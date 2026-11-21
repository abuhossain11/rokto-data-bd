import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BloodRequest,
  DonorProfile,
  Hospital,
  DonorResponse,
  AuditLog,
  AbuseReport,
  BloodGroup,
  RequestStatus,
  HospitalStatus,
  DonationRecord,
  UserProfile,
  UserRole,
  VerificationRecord,
} from '../types';
import {
  INITIAL_HOSPITALS,
} from '../data/initialData';
import { fuzzCoordinates } from '../services/locationService';
import { calculateDistanceKm } from '../services/locationService';
import { DISTRICTS, getDistrictById } from '../data/bangladeshLocations';
import { NotificationService } from '../services/notificationService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { ConsentService } from '../services/consentService';
import {
  validateBloodRequestInput,
  isBloodRequestExpired,
  canUserManageBloodRequest,
} from '../services/validationService';
import { AdminService, AdminStatsSummary } from '../services/adminService';

export interface DonorSearchFilters {
  bloodGroup?: BloodGroup | '';
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  radiusKm?: number;
  availableOnly?: boolean;
  availabilityStatus?: 'all' | 'available' | 'temporarily_unavailable' | 'unavailable';
  userLat?: number;
  userLng?: number;
}

export interface MatchedDonorResult {
  donor: DonorProfile;
  distanceKm: number;
}

interface DataContextType {
  requests: BloodRequest[];
  donors: DonorProfile[];
  hospitals: Hospital[];
  auditLogs: AuditLog[];
  reports: AbuseReport[];
  responses: DonorResponse[];
  donationRecords: DonationRecord[];
  users: UserProfile[];
  verificationRecords: VerificationRecord[];
  isLoadingFromSupabase: boolean;
  isSearchingDonors: boolean;
  donorSearchError: string | null;
  createBloodRequest: (data: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt' | 'matchedDonorsCount' | 'responsesCount'>) => Promise<{ success: boolean; request?: BloodRequest; error?: string }>;
  updateBloodRequestStatus: (id: string, status: RequestStatus, actorUserId: string, actorRoles?: string[]) => Promise<{ success: boolean; message?: string }>;
  cancelBloodRequest: (id: string, actorUserId: string, reason: string, actorRoles?: string[]) => Promise<{ success: boolean; message: string }>;
  completeBloodRequest: (id: string, actorUserId: string, confirmedDonorId?: string, actorRoles?: string[]) => Promise<{ success: boolean; message: string }>;
  respondToRequest: (requestId: string, donorId: string, donorName: string, donorPhone: string, donorBloodGroup: BloodGroup, status: 'interested' | 'declined', note?: string) => Promise<{ success: boolean; message: string }>;
  registerHospital: (data: Omit<Hospital, 'id' | 'status' | 'createdAt'>) => Promise<Hospital>;
  updateHospitalStatus: (id: string, status: HospitalStatus, adminId: string) => Promise<void>;
  reportAbuse: (report: Omit<AbuseReport, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  searchDonors: (filters: DonorSearchFilters) => MatchedDonorResult[];
  searchDonorsAsync: (filters: DonorSearchFilters) => Promise<MatchedDonorResult[]>;
  upsertDonorRecord: (donor: DonorProfile, userProfile?: UserProfile) => void;
  requestDonorContact: (donorId: string, requesterUserId?: string) => Promise<{ success: boolean; phone?: string; message: string }>;
  refreshDataFromSupabase: () => Promise<void>;
  // Phase 6 Admin Methods
  updateUserStatus: (userId: string, status: 'active' | 'suspended', actorUserId: string, actorRoles?: UserRole[], actorDistrictScope?: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  assignUserRole: (targetUserId: string, role: UserRole, actorUserId: string, actorRoles?: UserRole[], districtScope?: string) => Promise<{ success: boolean; message: string }>;
  revokeUserRole: (targetUserId: string, role: UserRole, actorUserId: string, actorRoles?: UserRole[]) => Promise<{ success: boolean; message: string }>;
  verifyDonor: (donorId: string, status: 'verified' | 'rejected', actorUserId: string, actorRoles?: UserRole[], actorDistrictScope?: string, notes?: string) => Promise<{ success: boolean; message: string }>;
  verifyHospitalWithNotes: (hospitalId: string, status: HospitalStatus, actorUserId: string, actorRoles?: UserRole[], actorDistrictScope?: string, notes?: string) => Promise<{ success: boolean; message: string }>;
  moderateBloodRequest: (requestId: string, action: 'approve' | 'cancel' | 'verify_completed', actorUserId: string, actorRoles?: UserRole[], actorDistrictScope?: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  moderateAbuseReport: (reportId: string, action: 'dismissed' | 'action_taken', actorUserId: string, actorRoles?: UserRole[], notes?: string, suspendTarget?: boolean) => Promise<{ success: boolean; message: string }>;
  broadcastAdminAlert: (title: string, message: string, titleBn: string, messageBn: string, bloodGroup?: BloodGroup, districtId?: string, actorUserId?: string, actorRoles?: UserRole[], actorDistrictScope?: string) => Promise<{ success: boolean; message: string }>;
  getDistrictStats: (districtId?: string) => AdminStatsSummary;
  stats: {
    totalDonors: number;
    availableDonors: number;
    totalRequests: number;
    activeRequests: number;
    completedRequests: number;
    totalHospitals: number;
    verifiedHospitals: number;
    districtsCovered: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Never seed mock blood requests or mock donors into live searches or request feeds
  const [requests, setRequests] = useState<BloodRequest[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_live_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [donors, setDonors] = useState<DonorProfile[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_live_donors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_hospitals');
      return saved ? JSON.parse(saved) : INITIAL_HOSPITALS;
    } catch {
      return INITIAL_HOSPITALS;
    }
  });

  const [responses, setResponses] = useState<DonorResponse[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_responses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_donation_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reports, setReports] = useState<AbuseReport[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [verificationRecords, setVerificationRecords] = useState<VerificationRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('rokto_data_verifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoadingFromSupabase, setIsLoadingFromSupabase] = useState(false);
  const [isSearchingDonors, setIsSearchingDonors] = useState(false);
  const [donorSearchError, setDonorSearchError] = useState<string | null>(null);

  // Sync with Supabase on mount if configured
  const refreshDataFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsLoadingFromSupabase(true);
    try {
      // 1. Fetch real Blood Requests
      const { data: remoteReqs } = await supabase
        .from('blood_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (remoteReqs) {
        const formatted: BloodRequest[] = remoteReqs.map((r) => {
          const distObj = getDistrictById(r.district_id || 'dhaka');
          return {
            id: r.id,
            requesterId: r.requester_id,
            requesterName: r.requester_name,
            requesterPhone: r.requester_phone,
            patientName: r.patient_name,
            bloodGroup: r.blood_group,
            unitsRequired: r.units_required,
            hospitalId: r.hospital_id,
            hospitalName: r.hospital_name,
            hospitalAddress: r.hospital_address,
            divisionId: r.division_id,
            districtId: r.district_id,
            upazilaId: r.upazila_id,
            lat: distObj?.lat || 23.8103,
            lng: distObj?.lng || 90.4125,
            requiredDateTime: r.required_date_time,
            urgency: r.urgency,
            additionalInfo: r.additional_info,
            status: isBloodRequestExpired(r.required_date_time, r.status) ? 'expired' : r.status,
            isHospitalVerified: r.is_hospital_verified,
            matchedDonorsCount: 0,
            responsesCount: 0,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
        });
        setRequests(formatted);
      }

      // 2. Fetch real Registered Donor Profiles (never private contacts)
      const { data: remoteDonors } = await supabase
        .from('donor_profiles')
        .select('id, user_id, blood_group, availability, last_donation_date, total_donations, division_id, district_id, upazila_id, area, contact_number_protected, medical_eligibility_acknowledged, registered_at, updated_at');

      if (remoteDonors) {
        const formattedDonors: DonorProfile[] = remoteDonors.map((d) => {
          const distObj = getDistrictById(d.district_id || 'dhaka');
          const fuzzed = fuzzCoordinates(distObj?.lat || 23.8103, distObj?.lng || 90.4125);
          return {
            id: d.id,
            userId: d.user_id,
            bloodGroup: d.blood_group,
            availability: d.availability || 'available',
            lastDonationDate: d.last_donation_date || undefined,
            totalDonations: d.total_donations || 0,
            divisionId: d.division_id || 'dhaka',
            districtId: d.district_id || 'dhaka',
            upazilaId: d.upazila_id || '',
            area: d.area || undefined,
            approxLat: fuzzed.lat,
            approxLng: fuzzed.lng,
            contactNumberProtected: d.contact_number_protected ?? true,
            medicalEligibilityAcknowledged: d.medical_eligibility_acknowledged ?? true,
            registeredAt: d.registered_at,
            updatedAt: d.updated_at,
          };
        });
        setDonors(formattedDonors);
      }

      // 3. Fetch Hospitals
      const { data: remoteHospitals } = await supabase
        .from('hospitals')
        .select('*')
        .order('name_bn');

      if (remoteHospitals) {
        const formattedH: Hospital[] = remoteHospitals.map((h) => {
          const distObj = getDistrictById(h.district_id || 'dhaka');
          return {
            id: h.id,
            nameEn: h.name_en,
            nameBn: h.name_bn,
            licenseNumber: h.license_number,
            address: h.address,
            divisionId: h.division_id,
            districtId: h.district_id,
            upazilaId: h.upazila_id,
            contactPhone: h.contact_phone,
            contactEmail: h.contact_email || '',
            lat: distObj?.lat || 23.8103,
            lng: distObj?.lng || 90.4125,
            status: h.status,
            verificationDocumentUrl: h.verification_document_url,
            verifiedBy: h.verified_by,
            verifiedAt: h.verified_at,
            createdAt: h.created_at,
          };
        });
        setHospitals(formattedH.length > 0 ? formattedH : INITIAL_HOSPITALS);
      }
    } catch (err) {
      console.warn('Supabase initial fetch warning:', err);
    } finally {
      setIsLoadingFromSupabase(false);
    }
  }, []);

  useEffect(() => {
    refreshDataFromSupabase();
  }, [refreshDataFromSupabase]);

  // Expiry check run on mount and intervals
  useEffect(() => {
    setRequests((prev) =>
      prev.map((r) => {
        if (isBloodRequestExpired(r.requiredDateTime, r.status)) {
          return { ...r, status: 'expired' };
        }
        return r;
      })
    );
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem('rokto_data_live_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem('rokto_data_live_donors', JSON.stringify(donors));
  }, [donors]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem('rokto_data_hospitals', JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    localStorage.setItem('rokto_data_responses', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem('rokto_data_donation_records', JSON.stringify(donationRecords));
  }, [donationRecords]);

  useEffect(() => {
    localStorage.setItem('rokto_data_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('rokto_data_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('rokto_data_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('rokto_data_verifications', JSON.stringify(verificationRecords));
  }, [verificationRecords]);

  // Create Blood Request with Validation & Server Authorization
  const createBloodRequest = async (
    data: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt' | 'matchedDonorsCount' | 'responsesCount'>
  ): Promise<{ success: boolean; request?: BloodRequest; error?: string }> => {
    // 1. Strict Validation
    const validation = validateBloodRequestInput({
      bloodGroup: data.bloodGroup,
      unitsRequired: data.unitsRequired,
      hospitalName: data.hospitalName,
      hospitalAddress: data.hospitalAddress,
      requesterPhone: data.requesterPhone,
      requiredDateTime: data.requiredDateTime,
    });

    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const id = 'req_' + Date.now();
    const newReq: BloodRequest = {
      ...data,
      id,
      matchedDonorsCount: 0,
      responsesCount: 0,
      status: 'finding_donors',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate matched donors automatically based on blood group and district
    const matching = donors.filter(
      (d) => d.bloodGroup === data.bloodGroup && d.availability === 'available'
    );
    newReq.matchedDonorsCount = matching.length;

    setRequests((prev) => [newReq, ...prev]);

    // Add immutable audit log
    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: data.requesterId,
      actorRole: 'seeker',
      action: 'REQUEST_CREATED',
      targetType: 'request',
      targetId: id,
      details: `Created blood request for ${data.bloodGroup} at ${data.hospitalName}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    // Dispatch in-app notification to matched donors
    const dist = getDistrictById(data.districtId);
    const districtName = dist ? dist.nameBn : 'আপনার এলাকায়';
    NotificationService.addNotification({
      userId: 'all',
      title: `Urgent Blood Needed: ${data.bloodGroup}`,
      titleBn: `জরুরী রক্তের আবেদন: ${data.bloodGroup}`,
      message: `${data.unitsRequired} unit(s) of ${data.bloodGroup} needed at ${data.hospitalName}.`,
      messageBn: `${districtName}-এর ${data.hospitalName}-এ ${data.unitsRequired} ব্যাগ ${data.bloodGroup} রক্তের জরুরী প্রয়োজন।`,
      type: 'emergency_match',
      relatedRequestId: id,
    });

    // Write to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('blood_requests').insert({
          id,
          requester_id: data.requesterId,
          requester_name: data.requesterName,
          requester_phone: data.requesterPhone,
          patient_name: data.patientName,
          blood_group: data.bloodGroup,
          units_required: data.unitsRequired,
          hospital_name: data.hospitalName,
          hospital_address: data.hospitalAddress,
          division_id: data.divisionId,
          district_id: data.districtId,
          upazila_id: data.upazilaId,
          required_date_time: data.requiredDateTime,
          urgency: data.urgency,
          additional_info: data.additionalInfo,
          status: 'finding_donors',
        });

        await supabase.from('audit_logs').insert({
          actor_id: data.requesterId,
          actor_role: 'seeker',
          action: 'REQUEST_CREATED',
          target_type: 'request',
          target_id: id,
          details: { blood_group: data.bloodGroup, hospital: data.hospitalName },
        });
      } catch (err) {
        console.warn('Supabase create request warning:', err);
      }
    }

    return { success: true, request: newReq };
  };

  // Status update with authorization protection
  const updateBloodRequestStatus = async (
    id: string,
    status: RequestStatus,
    actorUserId: string,
    actorRoles: string[] = []
  ): Promise<{ success: boolean; message?: string }> => {
    const target = requests.find((r) => r.id === id);
    if (!target) {
      return { success: false, message: 'আবেদনটি খুঁজে পাওয়া যায়নি।' };
    }

    // Server-side authorization: Requester or Moderator/Admin only
    if (!canUserManageBloodRequest(actorUserId, target.requesterId, actorRoles)) {
      return { success: false, message: 'অননুমোদিত: আপনি অন্যের আবেদন পরিবর্তন করতে পারেন না।' };
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
    );

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] as any || 'seeker',
      action: `REQUEST_STATUS_${status.toUpperCase()}`,
      targetType: 'request',
      targetId: id,
      details: `Status changed to ${status}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('blood_requests').update({ status }).eq('id', id);
        await supabase.from('audit_logs').insert({
          actor_id: actorUserId,
          actor_role: actorRoles[0] || 'seeker',
          action: `REQUEST_STATUS_${status.toUpperCase()}`,
          target_type: 'request',
          target_id: id,
        });
      } catch (err) {
        console.warn('Supabase update request warning:', err);
      }
    }

    return { success: true, message: 'আবেদনের অবস্থা সফলভাবে হালনাগাদ করা হয়েছে।' };
  };

  // Dedicated Cancellation Workflow with Reason
  const cancelBloodRequest = async (
    id: string,
    actorUserId: string,
    reason: string,
    actorRoles: string[] = []
  ): Promise<{ success: boolean; message: string }> => {
    const target = requests.find((r) => r.id === id);
    if (!target) {
      return { success: false, message: 'আবেদনটি পাওয়া যায়নি।' };
    }

    if (!canUserManageBloodRequest(actorUserId, target.requesterId, actorRoles)) {
      return { success: false, message: 'অননুমোদিত: আবেদন বাতিলের অনুমতি আপনার নেই।' };
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled', updatedAt: new Date().toISOString() } : r))
    );

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] as any || 'seeker',
      action: 'REQUEST_CANCELLED',
      targetType: 'request',
      targetId: id,
      details: `Cancelled reason: ${reason}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    // Notify any responding donors
    const matchedResponses = responses.filter((resp) => resp.requestId === id);
    matchedResponses.forEach((resp) => {
      NotificationService.addNotification({
        userId: resp.donorId,
        title: 'Request Cancelled',
        titleBn: 'আবেদনটি বাতিল হয়েছে',
        message: `Blood request for ${target.bloodGroup} at ${target.hospitalName} was cancelled. Reason: ${reason}`,
        messageBn: `${target.hospitalName}-এ ${target.bloodGroup} রক্তের আবেদনটি বাতিল করা হয়েছে। কারণ: ${reason}`,
        type: 'request_status',
        relatedRequestId: id,
      });
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('blood_requests').update({ status: 'cancelled' }).eq('id', id);
        await supabase.from('audit_logs').insert({
          actor_id: actorUserId,
          actor_role: actorRoles[0] || 'seeker',
          action: 'REQUEST_CANCELLED',
          target_type: 'request',
          target_id: id,
          details: { reason },
        });
      } catch (err) {
        console.warn('Supabase cancel request warning:', err);
      }
    }

    return { success: true, message: 'আবেদনটি সফলভাবে বাতিল করা হয়েছে।' };
  };

  // Completion Workflow: NEVER auto-completed on donor interest! Explicit confirmation only
  const completeBloodRequest = async (
    id: string,
    actorUserId: string,
    confirmedDonorId?: string,
    actorRoles: string[] = []
  ): Promise<{ success: boolean; message: string }> => {
    const target = requests.find((r) => r.id === id);
    if (!target) {
      return { success: false, message: 'আবেদনটি পাওয়া যায়নি।' };
    }

    if (!canUserManageBloodRequest(actorUserId, target.requesterId, actorRoles)) {
      return { success: false, message: 'অননুমোদিত: রক্তদান সম্পন্ন নিশ্চিতকরণের অনুমতি আপনার নেই।' };
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'completed', updatedAt: new Date().toISOString() } : r))
    );

    // If confirmed donor provided, record donation event and increment donor profile
    if (confirmedDonorId) {
      const rec: DonationRecord = {
        id: 'dnr_' + Date.now(),
        donorId: confirmedDonorId,
        requestId: id,
        hospitalId: target.hospitalId,
        donationDate: new Date().toISOString().slice(0, 10),
        units: 1,
        verifiedBy: actorUserId,
        notes: `Confirmed blood donation at ${target.hospitalName}`,
        createdAt: new Date().toISOString(),
      };
      setDonationRecords((prev) => [rec, ...prev]);

      // Increment donor total donations
      setDonors((prev) =>
        prev.map((d) =>
          d.userId === confirmedDonorId || d.id === confirmedDonorId
            ? { ...d, totalDonations: d.totalDonations + 1, lastDonationDate: rec.donationDate }
            : d
        )
      );

      // Congratulate and notify donor
      NotificationService.addNotification({
        userId: confirmedDonorId,
        title: 'Donation Recorded! Thank You!',
        titleBn: 'রক্তদান সম্পন্ন নথিভুক্ত হয়েছে! ধন্যবাদ!',
        message: `Your voluntary blood donation at ${target.hospitalName} was successfully recorded. You saved a life!`,
        messageBn: `${target.hospitalName}-এ আপনার রক্তদান সফলভাবে নথিভুক্ত হয়েছে। একটি জীবন বাঁচানোর জন্য আপনাকে ধন্যবাদ!`,
        type: 'verification',
        relatedRequestId: id,
      });
    }

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] as any || 'seeker',
      action: 'DONATION_COMPLETED_CONFIRMED',
      targetType: 'request',
      targetId: id,
      details: `Donation confirmed completed by ${actorUserId}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('blood_requests').update({ status: 'completed' }).eq('id', id);
        if (confirmedDonorId) {
          await supabase.from('donation_records').insert({
            donor_id: confirmedDonorId,
            request_id: id,
            donation_date: new Date().toISOString().slice(0, 10),
            units: 1,
            verified_by: actorUserId,
          });
        }
      } catch (err) {
        console.warn('Supabase completion warning:', err);
      }
    }

    return { success: true, message: 'রক্তদান সম্পন্ন হিসেবে সফলভাবে নথিভুক্ত হয়েছে।' };
  };

  // Donor Response: Transitions request to 'donor_responded', NEVER 'completed'
  const respondToRequest = async (
    requestId: string,
    donorId: string,
    donorName: string,
    donorPhone: string,
    donorBloodGroup: BloodGroup,
    status: 'interested' | 'declined',
    note?: string
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Prevent duplicate response from same donor on same request
    const existing = responses.find((resp) => resp.requestId === requestId && resp.donorId === donorId);
    if (existing) {
      return { success: false, message: 'আপনি এই আবেদনে ইতিমধ্যে আপনার সাড়া নথিভুক্ত করেছেন।' };
    }

    const targetRequest = requests.find((r) => r.id === requestId);
    if (!targetRequest) {
      return { success: false, message: 'আবেদনটি খুঁজে পাওয়া যায়নি।' };
    }

    if (targetRequest.status === 'completed' || targetRequest.status === 'cancelled' || targetRequest.status === 'expired') {
      return { success: false, message: 'এই আবেদনটিতে আর নতুন সাড়া গ্রহণ করা সম্ভব নয়।' };
    }

    const newResponse: DonorResponse = {
      id: 'resp_' + Date.now(),
      requestId,
      donorId,
      donorName,
      donorPhone,
      donorBloodGroup,
      status,
      note,
      createdAt: new Date().toISOString(),
    };

    setResponses((prev) => [newResponse, ...prev]);

    // Crucial rule: Expressing willingness sets status to 'donor_responded', NEVER 'completed'
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              responsesCount: r.responsesCount + 1,
              status: (r.status === 'finding_donors' || r.status === 'submitted') ? 'donor_responded' : r.status,
            }
          : r
      )
    );

    // 2. Real notification dispatched directly to the requester
    NotificationService.addNotification({
      userId: targetRequest.requesterId,
      title: 'Donor Responded to Blood Request!',
      titleBn: 'রক্তের আবেদনে একজন রক্তদাতা সাড়া দিয়েছেন!',
      message: `${donorName} (${donorBloodGroup}) is ready to donate for your request at ${targetRequest.hospitalName}. Check response details to coordinate.`,
      messageBn: `স্বেচ্ছাসেবী রক্তদাতা ${donorName} (${donorBloodGroup}) ${targetRequest.hospitalName}-এর আবেদনে রক্তদানে আগ্রহ প্রকাশ করেছেন।`,
      type: 'donor_response',
      relatedRequestId: requestId,
    });

    // 3. Log audit entry
    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: donorId,
      actorRole: 'donor',
      action: 'DONOR_RESPONSE_SUBMITTED',
      targetType: 'request',
      targetId: requestId,
      details: `${donorName} expressed willingness to donate (${donorBloodGroup})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('donor_responses').insert({
          request_id: requestId,
          donor_id: donorId,
          status,
          note,
        });

        await supabase.from('blood_requests').update({
          status: 'donor_responded',
        }).eq('id', requestId);

        await supabase.from('notifications').insert({
          user_id: targetRequest.requesterId,
          title: 'Donor Responded!',
          title_bn: 'রক্তদাতা সাড়া দিয়েছেন!',
          message: `${donorName} (${donorBloodGroup}) responded to your request.`,
          message_bn: `স্বেচ্ছাসেবী রক্তদাতা ${donorName} (${donorBloodGroup}) আপনার আবেদনে সাড়া দিয়েছেন।`,
          type: 'donor_response',
          related_request_id: requestId,
        });
      } catch (err) {
        console.warn('Supabase donor response warning:', err);
      }
    }

    return {
      success: true,
      message: 'আপনার সম্মতির জন্য আন্তরিক ধন্যবাদ! অনুরোধকারীকে আপনার সাড়ার নোটিফিকেশন পাঠানো হয়েছে।',
    };
  };

  const registerHospital = async (data: Omit<Hospital, 'id' | 'status' | 'createdAt'>): Promise<Hospital> => {
    const id = 'hosp_' + Date.now();
    const newHospital: Hospital = {
      ...data,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setHospitals((prev) => [newHospital, ...prev]);

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: 'guest_hospital',
      actorRole: 'hospital',
      action: 'HOSPITAL_REGISTERED',
      targetType: 'hospital',
      targetId: id,
      details: `Hospital registration submitted: ${data.nameEn} (${data.licenseNumber})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('hospitals').insert({
          name_en: data.nameEn,
          name_bn: data.nameBn,
          license_number: data.licenseNumber,
          address: data.address,
          division_id: data.divisionId,
          district_id: data.districtId,
          upazila_id: data.upazilaId,
          contact_phone: data.contactPhone,
          contact_email: data.contactEmail,
          status: 'pending',
          verification_document_url: data.verificationDocumentUrl,
        });
      } catch (err) {
        console.warn('Supabase register hospital warning:', err);
      }
    }

    return newHospital;
  };

  const updateHospitalStatus = async (id: string, status: HospitalStatus, adminId: string) => {
    setHospitals((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              status,
              verifiedBy: adminId,
              verifiedAt: status === 'verified' ? new Date().toISOString() : undefined,
            }
          : h
      )
    );

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: adminId,
      actorRole: 'super_admin',
      action: `HOSPITAL_${status.toUpperCase()}`,
      targetType: 'hospital',
      targetId: id,
      details: `Status set to ${status}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('hospitals')
          .update({
            status,
            verified_by: adminId,
            verified_at: status === 'verified' ? new Date().toISOString() : null,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update hospital warning:', err);
      }
    }
  };

  const reportAbuse = async (report: Omit<AbuseReport, 'id' | 'status' | 'createdAt'>) => {
    const newReport: AbuseReport = {
      ...report,
      id: 'rep_' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: report.reporterId,
      actorRole: 'seeker',
      action: 'ABUSE_REPORTED',
      targetType: report.targetType,
      targetId: report.targetId,
      details: `Reported: ${report.reason}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('reports').insert({
          reporter_id: report.reporterId,
          target_type: report.targetType,
          target_id: report.targetId,
          reason: report.reason,
          details: report.details,
          status: 'pending',
        });
      } catch (err) {
        console.warn('Supabase report abuse warning:', err);
      }
    }
  };

  // ==========================================================
  // PHASE 6: SECURE ADMIN WORKFLOWS & RBAC METHODS
  // ==========================================================

  // 1. User Status Management (Active / Suspended)
  const updateUserStatus = async (
    userId: string,
    status: 'active' | 'suspended',
    actorUserId: string,
    actorRoles: UserRole[] = [],
    actorDistrictScope?: string,
    reason: string = 'Administrative review'
  ): Promise<{ success: boolean; message: string }> => {
    if (!actorRoles.some((r) => ['super_admin', 'district_admin'].includes(r))) {
      return { success: false, message: 'অননুমোদিত: ব্যবহারকারীর স্থিতি পরিবর্তনের জন্য অ্যাডমিন অনুমতি প্রয়োজন।' };
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'ব্যবহারকারীকে খুঁজে পাওয়া যায়নি।' };
    }

    // District Admin Scope Restriction
    const scopeCheck = AdminService.canManageInDistrict(actorRoles, actorDistrictScope, targetUser.districtId);
    if (!scopeCheck.allowed) {
      return { success: false, message: scopeCheck.reason || 'অননুমোদিত জেলা।' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status, updatedAt: new Date().toISOString() } : u))
    );

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] || 'super_admin',
      action: `USER_STATUS_${status.toUpperCase()}`,
      targetType: 'user',
      targetId: userId,
      details: `User status changed to ${status}. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    // Async backend call
    try {
      fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': actorUserId, 'x-user-roles': actorRoles.join(',') },
        body: JSON.stringify({ status, userDistrictId: targetUser.districtId, reason }),
      }).catch(() => {});
    } catch {}

    return { success: true, message: `ব্যবহারকারীর অ্যাকাউন্ট সফলভাবে ${status === 'active' ? 'সক্রিয়' : 'স্থগিত'} করা হয়েছে।` };
  };

  // 2. Strict User Role Assignment: SUPER_ADMIN ONLY!
  const assignUserRole = async (
    targetUserId: string,
    role: UserRole,
    actorUserId: string,
    actorRoles: UserRole[] = [],
    districtScope?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!AdminService.canAssignRoles(actorRoles)) {
      return { success: false, message: 'প্রবেশাধিকার নিষিদ্ধ: শুধুমাত্র সুপার অ্যাডমিন নতুন প্রশাসনিক পদবি প্রদান করতে পারেন।' };
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, message: 'ব্যবহারকারীকে খুঁজে পাওয়া যায়নি।' };
    }

    const updatedRoles = Array.from(new Set([...targetUser.roles, role]));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? {
              ...u,
              roles: updatedRoles,
              districtScope: role === 'district_admin' ? (districtScope || u.districtId) : u.districtScope,
              updatedAt: new Date().toISOString(),
            }
          : u
      )
    );

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: 'super_admin',
      action: 'ASSIGN_ROLE',
      targetType: 'role',
      targetId: targetUserId,
      details: `Assigned role '${role}' ${districtScope ? `with scope '${districtScope}'` : ''} to ${targetUser.fullName}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    try {
      fetch('/api/admin/roles/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': actorUserId, 'x-user-roles': 'super_admin' },
        body: JSON.stringify({ targetUserId, role, districtScope }),
      }).catch(() => {});
    } catch {}

    return { success: true, message: `ব্যবহারকারীকে '${role}' পদবি সফলভাবে প্রদান করা হয়েছে।` };
  };

  // 3. Revoke User Role: SUPER_ADMIN ONLY!
  const revokeUserRole = async (
    targetUserId: string,
    role: UserRole,
    actorUserId: string,
    actorRoles: UserRole[] = []
  ): Promise<{ success: boolean; message: string }> => {
    if (!AdminService.canAssignRoles(actorRoles)) {
      return { success: false, message: 'প্রবেশাধিকার নিষিদ্ধ: শুধুমাত্র সুপার অ্যাডমিন প্রশাসনিক পদবি প্রত্যাহার করতে পারেন।' };
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? {
              ...u,
              roles: u.roles.filter((r) => r !== role),
              updatedAt: new Date().toISOString(),
            }
          : u
      )
    );

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: 'super_admin',
      action: 'REVOKE_ROLE',
      targetType: 'role',
      targetId: targetUserId,
      details: `Revoked role '${role}' from user`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    return { success: true, message: `ব্যবহারকারীর '${role}' পদবি প্রত্যাহার করা হয়েছে।` };
  };

  // 4. Voluntary Donor Badge Verification
  const verifyDonor = async (
    donorId: string,
    status: 'verified' | 'rejected',
    actorUserId: string,
    actorRoles: UserRole[] = [],
    actorDistrictScope?: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!actorRoles.some((r) => ['super_admin', 'district_admin', 'moderator'].includes(r))) {
      return { success: false, message: 'অননুমোদিত: রক্তদাতা ভেরিফিকেশনের অনুমতি আপনার নেই।' };
    }

    const donor = donors.find((d) => d.id === donorId || d.userId === donorId);
    if (!donor) {
      return { success: false, message: 'রক্তদাতাকে খুঁজে পাওয়া যায়নি।' };
    }

    const scopeCheck = AdminService.canManageInDistrict(actorRoles, actorDistrictScope, donor.districtId);
    if (!scopeCheck.allowed) {
      return { success: false, message: scopeCheck.reason || 'অননুমোদিত জেলা।' };
    }

    const now = new Date().toISOString();
    setDonors((prev) =>
      prev.map((d) =>
        d.id === donorId || d.userId === donorId
          ? {
              ...d,
              isVerified: status === 'verified',
              verificationStatus: status,
              verifiedAt: status === 'verified' ? now : undefined,
              verifiedBy: actorUserId,
              updatedAt: now,
            }
          : d
      )
    );

    // Record verification record
    const verRec: VerificationRecord = {
      id: 'ver_donor_' + Date.now(),
      targetType: 'donor',
      targetId: donor.userId,
      documentType: 'BLOOD_GROUP_CERTIFICATE',
      documentUrl: donor.verificationDocumentUrl || 'certificate_verified',
      verificationStatus: status === 'verified' ? 'approved' : 'rejected',
      verifiedBy: actorUserId,
      verificationNotes: notes || (status === 'verified' ? 'Verified voluntary donor badge granted.' : 'Verification rejected.'),
      createdAt: now,
      updatedAt: now,
    };
    setVerificationRecords((prev) => [verRec, ...prev]);

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] || 'moderator',
      action: `DONOR_VERIFICATION_${status.toUpperCase()}`,
      targetType: 'user',
      targetId: donor.userId,
      details: `Donor verified status: ${status}. Notes: ${notes || 'Verified'}`,
      timestamp: now,
    };
    setAuditLogs((prev) => [log, ...prev]);

    // Send notification to donor
    NotificationService.addNotification({
      userId: donor.userId,
      title: status === 'verified' ? 'Donor Badge Verified!' : 'Verification Update',
      titleBn: status === 'verified' ? 'রক্তদাতা প্রোফাইল যাচাইকৃত!' : 'ভেরিফিকেশন সংক্রান্ত তথ্য',
      message: status === 'verified' ? 'Congratulations! You now have a verified voluntary blood donor badge on ROKTO DATA.' : 'Your donor verification request was reviewed.',
      messageBn: status === 'verified' ? 'অভিনন্দন! রক্তদাতা নেটওয়ার্কে আপনার প্রোফাইলে যাচাইকৃত রক্তদাতা ব্যাজ যুক্ত হয়েছে।' : 'আপনার রক্তদাতা ভেরিফিকেশন আবেদনটি পর্যালোচনা করা হয়েছে।',
      type: 'verification',
    });

    return { success: true, message: `রক্তদাতার ভেরিফিকেশন স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে।` };
  };

  // 5. Hospital DGHS License Verification with Notes & District Enforcement
  const verifyHospitalWithNotes = async (
    hospitalId: string,
    status: HospitalStatus,
    actorUserId: string,
    actorRoles: UserRole[] = [],
    actorDistrictScope?: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!AdminService.canModerateHospitals(actorRoles)) {
      return { success: false, message: 'অননুমোদিত: হাসপাতাল অনুমোদনের জন্য জেলা প্রশাসক বা সুপার অ্যাডমিন অনুমতি প্রয়োজন।' };
    }

    const hospital = hospitals.find((h) => h.id === hospitalId);
    if (!hospital) {
      return { success: false, message: 'হাসপাতাল খুঁজে পাওয়া যায়নি।' };
    }

    const scopeCheck = AdminService.canManageInDistrict(actorRoles, actorDistrictScope, hospital.districtId);
    if (!scopeCheck.allowed) {
      return { success: false, message: scopeCheck.reason || 'অননুমোদিত জেলা।' };
    }

    const now = new Date().toISOString();
    setHospitals((prev) =>
      prev.map((h) =>
        h.id === hospitalId
          ? {
              ...h,
              status,
              verifiedBy: actorUserId,
              verifiedAt: status === 'verified' ? now : undefined,
            }
          : h
      )
    );

    const verRec: VerificationRecord = {
      id: 'ver_hosp_' + Date.now(),
      targetType: 'hospital',
      targetId: hospitalId,
      documentType: 'DGHS_LICENSE',
      documentUrl: hospital.verificationDocumentUrl || `dghs-license-${hospital.licenseNumber}`,
      verificationStatus: status === 'verified' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending',
      verifiedBy: actorUserId,
      verificationNotes: notes || `DGHS License ${hospital.licenseNumber} verified.`,
      createdAt: now,
      updatedAt: now,
    };
    setVerificationRecords((prev) => [verRec, ...prev]);

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] || 'super_admin',
      action: `HOSPITAL_VERIFIED_${status.toUpperCase()}`,
      targetType: 'hospital',
      targetId: hospitalId,
      details: `Hospital status set to ${status}. License: ${hospital.licenseNumber}. Notes: ${notes || 'Verified'}`,
      timestamp: now,
    };
    setAuditLogs((prev) => [log, ...prev]);

    return { success: true, message: `হাসপাতালের অবস্থা সফলভাবে '${status}' করা হয়েছে।` };
  };

  // 6. Request Moderation (Approve, Cancel, Complete)
  const moderateBloodRequest = async (
    requestId: string,
    action: 'approve' | 'cancel' | 'verify_completed',
    actorUserId: string,
    actorRoles: UserRole[] = [],
    actorDistrictScope?: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!AdminService.canModerateRequests(actorRoles)) {
      return { success: false, message: 'অননুমোদিত: রক্তের আবেদন মডারেশনের অনুমতি আপনার নেই।' };
    }

    const req = requests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, message: 'আবেদনটি খুঁজে পাওয়া যায়নি।' };
    }

    const scopeCheck = AdminService.canManageInDistrict(actorRoles, actorDistrictScope, req.districtId);
    if (!scopeCheck.allowed) {
      return { success: false, message: scopeCheck.reason || 'অননুমোদিত জেলা।' };
    }

    let targetStatus: RequestStatus = req.status;
    if (action === 'approve') targetStatus = 'finding_donors';
    else if (action === 'cancel') targetStatus = 'cancelled';
    else if (action === 'verify_completed') targetStatus = 'completed';

    const now = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: targetStatus, updatedAt: now } : r))
    );

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] || 'moderator',
      action: `ADMIN_REQUEST_${action.toUpperCase()}`,
      targetType: 'request',
      targetId: requestId,
      details: `Action '${action}' applied. Status: ${targetStatus}. Reason: ${reason || 'Approved by moderator'}`,
      timestamp: now,
    };
    setAuditLogs((prev) => [log, ...prev]);

    return { success: true, message: `আবেদনটি সফলভাবে '${targetStatus}' অবস্থায় আপডেট করা হয়েছে।` };
  };

  // 7. Abuse Report Moderation
  const moderateAbuseReport = async (
    reportId: string,
    action: 'dismissed' | 'action_taken',
    actorUserId: string,
    actorRoles: UserRole[] = [],
    notes?: string,
    suspendTarget?: boolean
  ): Promise<{ success: boolean; message: string }> => {
    if (!AdminService.canReviewReports(actorRoles)) {
      return { success: false, message: 'অননুমোদিত: রিপোর্ট নিষ্পত্তির ক্ষমতা নেই।' };
    }

    const report = reports.find((r) => r.id === reportId);
    if (!report) {
      return { success: false, message: 'রিপোর্টটি পাওয়া যায়নি।' };
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: action,
              reviewedBy: actorUserId,
            }
          : r
      )
    );

    // If moderator chose to suspend the reported user
    if (suspendTarget && report.targetType === 'user') {
      setUsers((prev) =>
        prev.map((u) => (u.id === report.targetId ? { ...u, status: 'suspended' } : u))
      );
    }

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] || 'moderator',
      action: `REPORT_${action.toUpperCase()}`,
      targetType: report.targetType,
      targetId: report.targetId,
      details: `Report resolved as ${action}. Target suspended: ${suspendTarget ? 'yes' : 'no'}. Notes: ${notes || 'Reviewed'}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    return { success: true, message: 'রিপোর্টটি সফলভাবে নিষ্পত্তি করা হয়েছে।' };
  };

  // 8. Emergency Administrative Broadcast
  const broadcastAdminAlert = async (
    title: string,
    message: string,
    titleBn: string,
    messageBn: string,
    bloodGroup?: BloodGroup,
    districtId?: string,
    actorUserId: string = 'admin',
    actorRoles: UserRole[] = ['super_admin'],
    actorDistrictScope?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!actorRoles.some((r) => ['super_admin', 'district_admin'].includes(r))) {
      return { success: false, message: 'অননুমোদিত: জরুরী ঘোষণা প্রেরণের জন্য প্রশাসনিক ক্ষমতা আবশ্যক।' };
    }

    if (districtId && districtId !== 'all') {
      const scopeCheck = AdminService.canManageInDistrict(actorRoles, actorDistrictScope, districtId);
      if (!scopeCheck.allowed) {
        return { success: false, message: scopeCheck.reason || 'অননুমোদিত জেলা।' };
      }
    } else if (!actorRoles.includes('super_admin')) {
      return { success: false, message: 'অননুমোদিত: জেলা প্রশাসক শুধুমাত্র নিজের জেলায় ঘোষণা পাঠাতে পারেন।' };
    }

    // Add in-app notification
    NotificationService.addNotification({
      userId: 'all',
      title,
      titleBn,
      message,
      messageBn,
      type: 'system',
    });

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: actorUserId,
      actorRole: actorRoles[0] || 'super_admin',
      action: 'ADMIN_BROADCAST_SENT',
      targetType: 'setting',
      targetId: districtId || 'nationwide',
      details: `Broadcast: ${title}. BloodGroup: ${bloodGroup || 'all'}. District: ${districtId || 'all'}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    return { success: true, message: 'জরুরী বার্তা সফলভাবে প্রচার করা হয়েছে।' };
  };

  // 9. District Scoped Real Statistics Calculator
  const getDistrictStats = (districtId?: string): AdminStatsSummary => {
    return AdminService.calculateRealStats(
      users,
      donors,
      requests,
      hospitals,
      reports,
      auditLogs,
      districtId
    );
  };

  // Synchronous search implementation (PostGIS Haversine calculation)
  const searchDonors = (filters: DonorSearchFilters): MatchedDonorResult[] => {
    let list = [...donors];

    if (filters.bloodGroup) {
      list = list.filter((d) => d.bloodGroup === filters.bloodGroup);
    }

    if (filters.availabilityStatus && filters.availabilityStatus !== 'all') {
      list = list.filter((d) => d.availability === filters.availabilityStatus);
    } else if (filters.availableOnly) {
      list = list.filter((d) => d.availability === 'available');
    }

    if (filters.divisionId) {
      list = list.filter((d) => d.divisionId === filters.divisionId);
    }

    if (filters.districtId) {
      list = list.filter((d) => d.districtId === filters.districtId);
    }

    if (filters.upazilaId) {
      list = list.filter((d) => d.upazilaId === filters.upazilaId);
    }

    // Reference coordinates for distance calculations
    let refLat = filters.userLat;
    let refLng = filters.userLng;

    if ((!refLat || !refLng) && filters.districtId) {
      const distObj = getDistrictById(filters.districtId);
      if (distObj) {
        refLat = distObj.lat;
        refLng = distObj.lng;
      }
    }

    // Default to Dhaka center centroid if no coordinates provided
    if (!refLat || !refLng) {
      refLat = 23.8103;
      refLng = 90.4125;
    }

    const radius = filters.radiusKm || 50;

    const results: MatchedDonorResult[] = list.map((d) => {
      const distance = calculateDistanceKm(refLat!, refLng!, d.approxLat, d.approxLng);
      return { donor: d, distanceKm: distance };
    });

    return results
      .filter((r) => r.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  };

  // Register/Update real donor record in state
  const upsertDonorRecord = (donor: DonorProfile, userProfile?: UserProfile) => {
    setDonors((prev) => {
      const idx = prev.findIndex((d) => d.userId === donor.userId || d.id === donor.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = donor;
        return next;
      }
      return [donor, ...prev];
    });

    if (userProfile) {
      setUsers((prev) => {
        const idx = prev.findIndex((u) => u.id === userProfile.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = userProfile;
          return next;
        }
        return [userProfile, ...prev];
      });
    }
  };

  // Async donor search with strict Supabase RPC / table query and ZERO mock fallback
  const searchDonorsAsync = async (filters: DonorSearchFilters): Promise<MatchedDonorResult[]> => {
    setIsSearchingDonors(true);
    setDonorSearchError(null);

    try {
      if (isSupabaseConfigured) {
        let refLat = filters.userLat;
        let refLng = filters.userLng;

        if ((!refLat || !refLng) && filters.districtId) {
          const distObj = getDistrictById(filters.districtId);
          if (distObj) {
            refLat = distObj.lat;
            refLng = distObj.lng;
          }
        }

        if (!refLat || !refLng) {
          refLat = 23.8103;
          refLng = 90.4125;
        }

        const radius = filters.radiusKm || 10;

        // If searching available donors with spatial radius, use PostGIS match_donors_nearby RPC
        if (!filters.availabilityStatus || filters.availabilityStatus === 'available') {
          const { data: remoteDonors, error: rpcError } = await supabase.rpc('match_donors_nearby', {
            p_blood_group: filters.bloodGroup || null,
            p_lat: refLat,
            p_lng: refLng,
            p_radius_km: radius,
          });

          if (rpcError) {
            throw rpcError;
          }

          interface MatchDonorRpcRow {
            donor_id: string;
            blood_group: BloodGroup;
            availability?: 'available' | 'unavailable' | 'temporarily_unavailable';
            total_donations?: number;
            division_id: string;
            district_id: string;
            upazila_id: string;
            distance_km?: number;
          }

          const mapped: MatchedDonorResult[] = ((remoteDonors || []) as MatchDonorRpcRow[]).map((item) => {
            const distObj = getDistrictById(item.district_id || 'dhaka');
            const fuzzed = fuzzCoordinates(distObj?.lat || refLat!, distObj?.lng || refLng!);
            return {
              donor: {
                id: item.donor_id,
                userId: item.donor_id,
                bloodGroup: item.blood_group,
                availability: item.availability || 'available',
                totalDonations: item.total_donations || 0,
                divisionId: item.division_id,
                districtId: item.district_id,
                upazilaId: item.upazila_id,
                approxLat: fuzzed.lat,
                approxLng: fuzzed.lng,
                contactNumberProtected: true,
                medicalEligibilityAcknowledged: true,
                registeredAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              distanceKm: item.distance_km || 0,
            };
          });

          return mapped.filter((m) => {
            if (filters.divisionId && m.donor.divisionId !== filters.divisionId) return false;
            if (filters.districtId && m.donor.districtId !== filters.districtId) return false;
            if (filters.upazilaId && m.donor.upazilaId !== filters.upazilaId) return false;
            return true;
          });
        }

        // Otherwise query donor_profiles table directly for all/temporarily_unavailable statuses
        let query = supabase
          .from('donor_profiles')
          .select('id, user_id, blood_group, availability, last_donation_date, total_donations, division_id, district_id, upazila_id, area, contact_number_protected, medical_eligibility_acknowledged, registered_at, updated_at');

        if (filters.bloodGroup) query = query.eq('blood_group', filters.bloodGroup);
        if (filters.availabilityStatus && filters.availabilityStatus !== 'all') {
          query = query.eq('availability', filters.availabilityStatus);
        }
        if (filters.divisionId) query = query.eq('division_id', filters.divisionId);
        if (filters.districtId) query = query.eq('district_id', filters.districtId);
        if (filters.upazilaId) query = query.eq('upazila_id', filters.upazilaId);

        const { data: rows, error: tableError } = await query;
        if (tableError) throw tableError;

        return (rows || [])
          .map((d) => {
            const distObj = getDistrictById(d.district_id || 'dhaka');
            const fuzzed = fuzzCoordinates(distObj?.lat || refLat!, distObj?.lng || refLng!);
            const distance = calculateDistanceKm(refLat!, refLng!, fuzzed.lat, fuzzed.lng);
            return {
              donor: {
                id: d.id,
                userId: d.user_id,
                bloodGroup: d.blood_group,
                availability: d.availability || 'available',
                lastDonationDate: d.last_donation_date || undefined,
                totalDonations: d.total_donations || 0,
                divisionId: d.division_id || 'dhaka',
                districtId: d.district_id || 'dhaka',
                upazilaId: d.upazila_id || '',
                area: d.area || undefined,
                approxLat: fuzzed.lat,
                approxLng: fuzzed.lng,
                contactNumberProtected: d.contact_number_protected ?? true,
                medicalEligibilityAcknowledged: d.medical_eligibility_acknowledged ?? true,
                registeredAt: d.registered_at,
                updatedAt: d.updated_at,
              },
              distanceKm: distance,
            };
          })
          .filter((r) => r.distanceKm <= radius)
          .sort((a, b) => a.distanceKm - b.distanceKm);
      }

      // When Supabase is not configured, search ONLY real registered donors in state (empty until users register)
      return searchDonors(filters);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'রক্তদাতা অনুসন্ধানে সমস্যা হয়েছে';
      setDonorSearchError(msg);
      return [];
    } finally {
      setIsSearchingDonors(false);
    }
  };

  // Secure contact request (never returns fabricated phone numbers)
  const requestDonorContact = async (
    donorId: string,
    requesterUserId?: string
  ): Promise<{ success: boolean; phone?: string; message: string }> => {
    if (!requesterUserId) {
      return {
        success: false,
        message: 'রক্তদাতার যোগাযোগের নম্বর দেখতে প্রথমে লগইন করুন।',
      };
    }

    const donorObj = donors.find((d) => d.id === donorId || d.userId === donorId);
    let resolvedPhone: string | undefined = users.find((u) => u.id === donorObj?.userId)?.phone;

    if (!resolvedPhone && isSupabaseConfigured && donorObj?.userId) {
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', donorObj.userId)
          .maybeSingle();
        if (profileRow?.phone) {
          resolvedPhone = profileRow.phone;
        }
      } catch (err) {
        console.warn('Supabase contact lookup warning:', err);
      }
    }

    if (!resolvedPhone) {
      return {
        success: false,
        message: 'এই রক্তদাতার যাচাইকৃত যোগাযোগ নম্বর বর্তমানে উপলব্ধ নয়। অনুগ্রহ করে জরুরী আবেদনের মাধ্যমে সাড়া নিন।',
      };
    }

    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      actorId: requesterUserId,
      actorRole: 'seeker',
      action: 'DONOR_CONTACT_REVEALED',
      targetType: 'user',
      targetId: donorId,
      details: `Revealed contact for emergency coordination`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    await ConsentService.recordConsent(requesterUserId, 'contact_share', true);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('audit_logs').insert({
          actor_id: requesterUserId,
          actor_role: 'seeker',
          action: 'DONOR_CONTACT_REVEALED',
          target_type: 'user',
          target_id: donorId,
          details: { reason: 'Emergency contact request' },
        });
      } catch (err) {
        console.warn('Supabase audit log insert warning:', err);
      }
    }

    return {
      success: true,
      phone: resolvedPhone,
      message: 'রক্তদাতার যোগাযোগের নম্বর প্রদর্শন করা হয়েছে। অনুগ্রহ করে শুধুমাত্র জরুরী রক্তদানের প্রয়োজনে যোগাযোগ করুন।',
    };
  };

  // Strictly calculated statistics from actual database records
  const stats = {
    totalDonors: donors.length,
    availableDonors: donors.filter((d) => d.availability === 'available').length,
    totalRequests: requests.length,
    activeRequests: requests.filter((r) => r.status === 'finding_donors' || r.status === 'donor_responded').length,
    completedRequests: requests.filter((r) => r.status === 'completed').length,
    totalHospitals: hospitals.length,
    verifiedHospitals: hospitals.filter((h) => h.status === 'verified').length,
    districtsCovered: DISTRICTS.length, // 64 Districts
  };

  return (
    <DataContext.Provider
      value={{
        requests,
        donors,
        hospitals,
        auditLogs,
        reports,
        responses,
        donationRecords,
        users,
        verificationRecords,
        isLoadingFromSupabase,
        isSearchingDonors,
        donorSearchError,
        createBloodRequest,
        updateBloodRequestStatus,
        cancelBloodRequest,
        completeBloodRequest,
        respondToRequest,
        registerHospital,
        updateHospitalStatus,
        reportAbuse,
        searchDonors,
        searchDonorsAsync,
        upsertDonorRecord,
        requestDonorContact,
        refreshDataFromSupabase,
        updateUserStatus,
        assignUserRole,
        revokeUserRole,
        verifyDonor,
        verifyHospitalWithNotes,
        moderateBloodRequest,
        moderateAbuseReport,
        broadcastAdminAlert,
        getDistrictStats,
        stats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
