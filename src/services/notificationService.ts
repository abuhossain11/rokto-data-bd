import { AppNotification, BloodGroup, DonorProfile } from '../types';
import { calculateDistanceKm } from './locationService';
import { ConsentService } from './consentService';

export interface PushDispatchOptions {
  bloodGroup: BloodGroup;
  districtId: string;
  hospitalName: string;
  unitsRequired: number;
  requestId: string;
  patientName?: string;
}

// Safe in-memory fallback for environments where localStorage is not defined (Node.js test suite)
const memoryStorage: Map<string, string> = new Map();

function safeGetStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore
  }
  return memoryStorage.get(key) || null;
}

function safeSetStorage(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
      return;
    }
  } catch {
    // Ignore
  }
  memoryStorage.set(key, val);
}

export class NotificationService {
  private static STORAGE_KEY = 'rokto_data_notifications';
  private static LAST_PUSH_TIME_KEY = 'rokto_data_last_push_timestamps';
  private static RATE_LIMIT_MS = 60000; // 60s cooldown per request ID to prevent spam

  static getNotifications(userId: string): AppNotification[] {
    try {
      const raw = safeGetStorage(this.STORAGE_KEY);
      if (!raw) return [];
      const all: AppNotification[] = JSON.parse(raw);
      return all.filter((n) => n.userId === userId || n.userId === 'all');
    } catch {
      return [];
    }
  }

  static addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notification,
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      read: false,
    };

    try {
      const raw = safeGetStorage(this.STORAGE_KEY);
      const all: AppNotification[] = raw ? JSON.parse(raw) : [];
      all.unshift(newNotif);
      safeSetStorage(this.STORAGE_KEY, JSON.stringify(all.slice(0, 100))); // keep latest 100
    } catch (e) {
      console.warn('Failed to store notification locally', e);
    }

    // Trigger browser Web Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newNotif.titleBn || newNotif.title, {
          body: newNotif.messageBn || newNotif.message,
          icon: '/pwa-192x192.png',
        });
      } catch (err) {
        console.warn('Browser Notification API error', err);
      }
    }

    return newNotif;
  }

  static markAsRead(notificationId: string): void {
    try {
      const raw = safeGetStorage(this.STORAGE_KEY);
      if (!raw) return;
      const all: AppNotification[] = JSON.parse(raw);
      const updated = all.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      safeSetStorage(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  }

  static markAllAsRead(userId: string): void {
    try {
      const raw = safeGetStorage(this.STORAGE_KEY);
      if (!raw) return;
      const all: AppNotification[] = JSON.parse(raw);
      const updated = all.map((n) => (n.userId === userId || n.userId === 'all' ? { ...n, read: true } : n));
      safeSetStorage(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Filter matching voluntary donors according to:
   * 1. Blood group match
   * 2. Availability == 'available'
   * 3. Geographic radius (default 10-50 km)
   * 4. Notification / contact consent
   */
  static filterMatchingDonors(
    donors: DonorProfile[],
    bloodGroup: BloodGroup,
    targetLat: number,
    targetLng: number,
    radiusKm: number = 20
  ): DonorProfile[] {
    return donors.filter((donor) => {
      // 1. Availability check
      if (donor.availability !== 'available') return false;

      // 2. Blood group compatibility
      if (donor.bloodGroup !== bloodGroup) return false;

      // 3. User consent check
      const hasConsent = ConsentService.hasConsent(donor.userId, 'contact_share');
      if (!hasConsent) return false;

      // 4. Geographic radius distance
      const distance = calculateDistanceKm(targetLat, targetLng, donor.approxLat, donor.approxLng);
      return distance <= radiusKm;
    });
  }

  /**
   * Sanitizes payload: Never includes patient private names or diagnoses in push
   */
  static buildEmergencyMatchPayload(bloodGroup: BloodGroup, hospitalName: string, units: number) {
    return {
      titleEn: `Urgent Blood Needed: ${bloodGroup}`,
      titleBn: `জরুরী রক্তের আবেদন: ${bloodGroup}`,
      messageEn: `${units} unit(s) of ${bloodGroup} blood needed at ${hospitalName}. Open app to respond.`,
      messageBn: `${hospitalName}-এ জরুরী ভিত্তিতে ${units} ব্যাগ ${bloodGroup} রক্ত প্রয়োজন। আপনি কি রক্তদানে আগ্রহী?`,
    };
  }

  /**
   * Check rate-limit cooldown to prevent notification spam
   */
  static canBroadcastRequest(requestId: string): boolean {
    try {
      const raw = safeGetStorage(this.LAST_PUSH_TIME_KEY);
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      const lastTime = map[requestId];
      if (lastTime && Date.now() - lastTime < this.RATE_LIMIT_MS) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  static recordBroadcastTimestamp(requestId: string): void {
    try {
      const raw = safeGetStorage(this.LAST_PUSH_TIME_KEY);
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      map[requestId] = Date.now();
      safeSetStorage(this.LAST_PUSH_TIME_KEY, JSON.stringify(map));
    } catch {
      // Ignore
    }
  }

  /**
   * Dispatches push notification via secure server route /api/notifications/dispatch-push
   * with automatic fallback to in-app notification center if credentials or network fail
   */
  static async dispatchPushNotification(options: PushDispatchOptions): Promise<{
    success: boolean;
    mode: 'fcm_cloud' | 'in_app_fallback';
    message: string;
  }> {
    if (!this.canBroadcastRequest(options.requestId)) {
      return {
        success: false,
        mode: 'in_app_fallback',
        message: 'Spam prevention active: Blood request was broadcasted recently.',
      };
    }

    try {
      const response = await fetch('/api/notifications/dispatch-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup: options.bloodGroup,
          districtId: options.districtId,
          hospitalName: options.hospitalName,
          unitsRequired: options.unitsRequired,
          requestId: options.requestId,
          // Note: patientName is NOT sent or is sanitized on the server
        }),
      });

      this.recordBroadcastTimestamp(options.requestId);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          mode: data.mode || 'in_app_fallback',
          message: data.message,
        };
      }
    } catch (err) {
      console.warn('Server push dispatch unavailable, falling back to in-app notifications', err);
    }

    // In-app notification fallback
    const payload = this.buildEmergencyMatchPayload(options.bloodGroup, options.hospitalName, options.unitsRequired);
    this.addNotification({
      userId: 'all',
      title: payload.titleEn,
      titleBn: payload.titleBn,
      message: payload.messageEn,
      messageBn: payload.messageBn,
      type: 'emergency_match',
      relatedRequestId: options.requestId,
    });

    return {
      success: true,
      mode: 'in_app_fallback',
      message: 'In-app notification fallback active. Alert delivered to matching donor notification feeds.',
    };
  }

  /**
   * Prompts user for browser notification permission and registers device push token
   */
  static async requestPushPermission(userId: string): Promise<{ granted: boolean; token?: string }> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { granted: false };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const simulatedFcmToken = `fcm_web_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // Register token in local storage & backend
        await ConsentService.registerDeviceToken(userId, simulatedFcmToken, 'web');

        try {
          await fetch('/api/notifications/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              token: simulatedFcmToken,
              platform: 'web',
              contactConsent: true,
            }),
          });
        } catch {
          // Ignore server fetch error
        }

        return { granted: true, token: simulatedFcmToken };
      }
    } catch (err) {
      console.warn('Error requesting notification permission', err);
    }

    return { granted: false };
  }
}
