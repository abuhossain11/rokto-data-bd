export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UserRole =
  | 'guest'
  | 'donor'
  | 'seeker'
  | 'hospital'
  | 'moderator'
  | 'district_admin'
  | 'super_admin';

export type DonorAvailability = 'available' | 'unavailable' | 'temporarily_unavailable';

export type RequestStatus =
  | 'submitted'
  | 'under_review'
  | 'finding_donors'
  | 'donor_responded'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type HospitalStatus = 'pending' | 'verified' | 'rejected';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type ConsentType = 'contact_share' | 'location_share' | 'medical_disclaimer' | 'terms_and_privacy';

export interface LocationItem {
  id: string;
  type: 'division' | 'district' | 'upazila';
  parentId?: string;
  nameEn: string;
  nameBn: string;
  lat?: number;
  lng?: number;
}

export interface Division {
  id: string;
  nameEn: string;
  nameBn: string;
}

export interface District {
  id: string;
  divisionId: string;
  nameEn: string;
  nameBn: string;
  lat: number;
  lng: number;
  upazilas: {
    id: string;
    nameEn: string;
    nameBn: string;
  }[];
}

export interface UserProfile {
  id: string;
  phone: string; // Bangladesh +880 format normalized
  phoneVerified: boolean;
  fullName: string;
  email?: string;
  dateOfBirth?: string;
  bloodGroup: BloodGroup;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  area?: string;
  avatarUrl?: string;
  preferredLanguage: 'bn' | 'en';
  roles: UserRole[];
  districtScope?: string; // Assigned district for district_admin
  contactConsent: boolean;
  locationSharingConsent: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'suspended' | 'deleted';
}

export interface SystemRole {
  name: UserRole;
  descriptionEn: string;
  descriptionBn: string;
  createdAt?: string;
}

export interface UserRoleMapping {
  id: string;
  userId: string;
  role: UserRole;
  assignedBy?: string;
  districtScope?: string;
  createdAt: string;
}

export interface DonorProfile {
  id: string;
  userId: string;
  bloodGroup: BloodGroup;
  availability: DonorAvailability;
  lastDonationDate?: string;
  totalDonations: number;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  area?: string;
  // Fuzzed/approximate coordinates for privacy protection
  approxLat: number;
  approxLng: number;
  contactNumberProtected: boolean;
  medicalEligibilityAcknowledged: boolean;
  isVerified?: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationDocumentUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  registeredAt: string;
  updatedAt: string;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  patientName?: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalId?: string;
  hospitalName: string;
  hospitalAddress: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  lat: number;
  lng: number;
  requiredDateTime: string;
  urgency: 'critical' | 'high' | 'normal';
  additionalInfo?: string;
  status: RequestStatus;
  isHospitalVerified: boolean;
  matchedDonorsCount: number;
  responsesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DonorResponse {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: BloodGroup;
  status: 'interested' | 'declined' | 'contacted' | 'donated';
  note?: string;
  createdAt: string;
}

export interface Hospital {
  id: string;
  nameEn: string;
  nameBn: string;
  licenseNumber: string;
  address: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  contactPhone: string;
  contactEmail: string;
  lat: number;
  lng: number;
  status: HospitalStatus;
  verificationDocumentUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  type: 'emergency_match' | 'donor_response' | 'request_status' | 'verification' | 'system';
  relatedRequestId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetType: 'user' | 'request' | 'hospital' | 'role' | 'setting' | 'consent' | 'response';
  targetId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AbuseReport {
  id: string;
  reporterId: string;
  targetType: 'request' | 'user' | 'response' | 'hospital';
  targetId: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  reviewedBy?: string;
  createdAt: string;
}

export interface VerificationRecord {
  id: string;
  targetType: 'hospital' | 'donor' | 'organization';
  targetId: string;
  documentType: string;
  documentUrl: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verificationNotes?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonationRecord {
  id: string;
  donorId: string;
  requestId?: string;
  hospitalId?: string;
  donationDate: string;
  units: number;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  deviceInfo?: Record<string, unknown>;
  lastActiveAt: string;
  createdAt: string;
}

export interface LocationShare {
  id: string;
  userId: string;
  approxLat: number;
  approxLng: number;
  expiresAt: string;
  createdAt: string;
}

export interface UserConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  consented: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  revokedAt?: string;
}
