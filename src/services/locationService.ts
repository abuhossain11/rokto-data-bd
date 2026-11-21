import { DISTRICTS } from '../data/bangladeshLocations';

/**
 * Calculates geographic distance in Kilometers using the Haversine formula
 * (Matches PostGIS ST_DistanceSphere / 1000)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Privacy protection: Adds subtle deterministic or pseudo-random jitter
 * to coordinates (~500m to 1km) so exact home addresses are never published.
 */
export function fuzzCoordinates(lat: number, lng: number, seedId: string = ''): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) {
    hash = (hash << 5) - hash + seedId.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = ((Math.abs(hash % 100) - 50) / 100) * 0.008; // ~800m
  const jitterLng = ((Math.abs((hash >> 3) % 100) - 50) / 100) * 0.008;

  return {
    lat: Number((lat + jitterLat).toFixed(4)),
    lng: Number((lng + jitterLng).toFixed(4)),
  };
}

/**
 * Mask phone number for public display to protect voluntary donor privacy
 * e.g. +8801712345678 -> +880 17•• ••••78
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '+880 1••• ••••••';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 11) {
    const start = clean.slice(-11, -8); // e.g. 017 or 018
    const end = clean.slice(-2); // e.g. 78
    return `+880 ${start.slice(1)}•• ••••${end}`;
  }
  return '+880 1••• ••••••';
}

/**
 * Finds the nearest Bangladesh district for a given GPS coordinate
 */
export function findNearestDistrict(lat: number, lng: number) {
  let minDistance = Infinity;
  let nearest = DISTRICTS[0];

  for (const d of DISTRICTS) {
    const dist = calculateDistanceKm(lat, lng, d.lat, d.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = d;
    }
  }

  return { district: nearest, distanceKm: minDistance };
}

/**
 * Asynchronously requests user geolocation with browser consent
 */
export function getUserApproximateLocation(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'অবস্থান শনাক্ত করা যায়নি';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'ব্যবহারকারী অবস্থান ব্যবহারের অনুমতি প্রদান করেননি। ম্যানুয়ালি জেলা নির্বাচন করুন।';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'অবস্থান সম্পর্কিত তথ্য অনুপলব্ধ।';
        } else if (error.code === error.TIMEOUT) {
          msg = 'অবস্থান শনাক্তকরণের সময় শেষ হয়ে গেছে।';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: false, // Low power approx geolocation
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

/**
 * Generates an external navigation link (Google Maps or OpenStreetMap)
 */
export function getExternalRouteUrl(destLat: number, destLng: number, originLat?: number, originLng?: number): string {
  if (originLat && originLng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
}
