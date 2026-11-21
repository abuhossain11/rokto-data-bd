import { BloodGroup, RequestStatus } from '../types';

export const VALID_BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Validates and normalizes Bangladesh phone numbers.
 * Supports:
 * - 01712345678 -> +8801712345678
 * - +8801712345678 -> +8801712345678
 * - 8801712345678 -> +8801712345678
 * Operators in BD: 013, 014, 015, 016, 017, 018, 019
 */
export function normalizeBangladeshPhone(input: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!input) {
    return { isValid: false, normalized: '', error: 'ফোন নম্বর প্রদান করুন' };
  }

  // Remove spaces, dashes, parentheses
  let cleaned = input.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+880')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // BD mobile subscriber numbers without prefix must be 10 digits starting with 1
  // Operators: 13, 14, 15, 16, 17, 18, 19
  const bdPattern = /^1[3-9]\d{8}$/;

  if (!bdPattern.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      error: 'সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন (যেমন: 01712345678)',
    };
  }

  return {
    isValid: true,
    normalized: `+880${cleaned}`,
  };
}

export function isValidBloodGroup(bg: string): bg is BloodGroup {
  return VALID_BLOOD_GROUPS.includes(bg as BloodGroup);
}

export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function isEligibleDonorAge(dobString: string): { eligible: boolean; message?: string } {
  const age = calculateAge(dobString);
  if (age < 18) {
    return { eligible: false, message: 'রক্তদানের জন্য নূন্যতম বয়স ১৮ বছর হতে হবে।' };
  }
  if (age > 65) {
    return { eligible: false, message: '৬৫ বছরের অধিক বয়সে চিকিৎসকের বিশেষ পরামর্শ ছাড়া রক্তদান সমীচীন নয়।' };
  }
  return { eligible: true };
}

export function getDaysSinceLastDonation(lastDateString?: string): number | null {
  if (!lastDateString) return null;
  const last = new Date(lastDateString).getTime();
  const now = new Date().getTime();
  const diffTime = now - last;
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Validates emergency blood request inputs
 */
export function validateBloodRequestInput(data: {
  bloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  hospitalAddress: string;
  requesterPhone: string;
  requiredDateTime: string;
}): { isValid: boolean; error?: string } {
  if (!isValidBloodGroup(data.bloodGroup)) {
    return { isValid: false, error: 'সঠিক রক্তের গ্রুপ নির্বাচন করুন।' };
  }

  if (typeof data.unitsRequired !== 'number' || data.unitsRequired < 1 || data.unitsRequired > 10) {
    return { isValid: false, error: 'রক্তের প্রয়োজনীয় ব্যাগ ১ থেকে ১০ এর মধ্যে হতে হবে।' };
  }

  if (!data.hospitalName || data.hospitalName.trim().length < 3) {
    return { isValid: false, error: 'হাসপাতালের নাম প্রদান করুন (নূন্যতম ৩ অক্ষর)।' };
  }

  if (!data.hospitalAddress || data.hospitalAddress.trim().length < 5) {
    return { isValid: false, error: 'হাসপাতালের পূর্ণাঙ্গ ঠিকানা লিখুন।' };
  }

  const phoneCheck = normalizeBangladeshPhone(data.requesterPhone);
  if (!phoneCheck.isValid) {
    return { isValid: false, error: phoneCheck.error || 'সঠিক ফোন নম্বর প্রদান করুন।' };
  }

  if (!data.requiredDateTime) {
    return { isValid: false, error: 'রক্তদানের তারিখ ও সময় নির্ধারণ করুন।' };
  }

  // Ensure request is not older than 12 hours ago
  const reqTime = new Date(data.requiredDateTime).getTime();
  const twelveHoursAgo = Date.now() - 12 * 3600 * 1000;
  if (reqTime < twelveHoursAgo) {
    return { isValid: false, error: 'রক্তদানের সময় অতীতের কোনো তারিখ হতে পারে না।' };
  }

  return { isValid: true };
}

/**
 * Checks if a blood request is expired
 */
export function isBloodRequestExpired(requiredDateTime: string, status?: RequestStatus): boolean {
  if (status === 'completed' || status === 'cancelled') return false;
  const reqTime = new Date(requiredDateTime).getTime();
  // An emergency request expires 24 hours after the requiredDateTime if not fulfilled
  return Date.now() > reqTime + 24 * 3600 * 1000;
}

/**
 * Authorization check for managing a blood request
 */
export function canUserManageBloodRequest(
  userId: string | undefined,
  requesterId: string,
  userRoles: string[] = []
): boolean {
  if (!userId) return false;
  if (userId === requesterId) return true;
  return userRoles.includes('super_admin') || userRoles.includes('district_admin') || userRoles.includes('moderator');
}
