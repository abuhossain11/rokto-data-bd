import { UserConsent, ConsentType, DeviceToken, LocationShare } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const CONSENT_STORAGE_KEY = 'rokto_data_user_consents';
const DEVICE_TOKEN_STORAGE_KEY = 'rokto_data_device_tokens';
const LOCATION_SHARES_KEY = 'rokto_data_location_shares';

export class ConsentService {
  /**
   * Record or update user consent
   */
  static async recordConsent(
    userId: string,
    consentType: ConsentType,
    consented: boolean = true
  ): Promise<UserConsent> {
    const record: UserConsent = {
      id: 'cst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      consentType,
      consented,
      ipAddress: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ROKTO_DATA_CLIENT',
      createdAt: new Date().toISOString(),
      revokedAt: consented ? undefined : new Date().toISOString(),
    };

    // Save to local cache
    try {
      const existingStr = localStorage.getItem(CONSENT_STORAGE_KEY);
      const consents: UserConsent[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = consents.filter(
        (c) => !(c.userId === userId && c.consentType === consentType)
      );
      updated.push(record);
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore local storage error
    }

    // Save to Supabase if connected
    if (isSupabaseConfigured) {
      try {
        await supabase.from('user_consents').insert({
          user_id: userId,
          consent_type: consentType,
          consented,
          created_at: record.createdAt,
          revoked_at: record.revokedAt,
        });
      } catch (err) {
        console.warn('Supabase consent record warning:', err);
      }
    }

    return record;
  }

  /**
   * Check if user has active consent
   */
  static hasConsent(userId: string, consentType: ConsentType): boolean {
    try {
      const existingStr = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!existingStr) return true; // Default opt-in on creation
      const consents: UserConsent[] = JSON.parse(existingStr);
      const match = consents.find((c) => c.userId === userId && c.consentType === consentType);
      return match ? match.consented : true;
    } catch {
      return true;
    }
  }

  /**
   * Register push device token (FCM Web / Android)
   */
  static async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'web' | 'android' | 'ios' = 'web'
  ): Promise<DeviceToken> {
    const deviceToken: DeviceToken = {
      id: 'dtk_' + Date.now(),
      userId,
      token,
      platform,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const existingStr = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
      const tokens: DeviceToken[] = existingStr ? JSON.parse(existingStr) : [];
      const filtered = tokens.filter((t) => t.token !== token);
      filtered.push(deviceToken);
      localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('device_tokens').upsert(
          {
            user_id: userId,
            token,
            platform,
            last_active_at: deviceToken.lastActiveAt,
          },
          { onConflict: 'token' }
        );
      } catch (err) {
        console.warn('Supabase device token warning:', err);
      }
    }

    return deviceToken;
  }

  /**
   * Create a time-limited location share (default expires in 4 hours)
   */
  static async createLocationShare(
    userId: string,
    approxLat: number,
    approxLng: number,
    durationHours: number = 4
  ): Promise<LocationShare> {
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
    const share: LocationShare = {
      id: 'lsh_' + Date.now(),
      userId,
      approxLat,
      approxLng,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingStr = localStorage.getItem(LOCATION_SHARES_KEY);
      const shares: LocationShare[] = existingStr ? JSON.parse(existingStr) : [];
      shares.push(share);
      localStorage.setItem(LOCATION_SHARES_KEY, JSON.stringify(shares));
    } catch {
      // Ignore
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('location_shares').insert({
          user_id: userId,
          approx_lat: approxLat,
          approx_lng: approxLng,
          expires_at: expiresAt,
        });
      } catch (err) {
        console.warn('Supabase location share warning:', err);
      }
    }

    return share;
  }

  /**
   * Check if location share is currently active and unexpired
   */
  static isLocationShareActive(share: LocationShare): boolean {
    return new Date(share.expiresAt).getTime() > Date.now();
  }

  /**
   * Retrieve active location share for user, pruning expired ones
   */
  static getActiveLocationShare(userId: string): LocationShare | null {
    try {
      const existingStr = localStorage.getItem(LOCATION_SHARES_KEY);
      if (!existingStr) return null;
      const shares: LocationShare[] = JSON.parse(existingStr);
      const userShares = shares.filter((s) => s.userId === userId);
      const active = userShares.find((s) => ConsentService.isLocationShareActive(s));
      return active || null;
    } catch {
      return null;
    }
  }
}
