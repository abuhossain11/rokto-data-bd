import { UserRole, UserProfile, DonorProfile, Hospital, BloodRequest, AbuseReport, AuditLog, VerificationRecord } from '../types';
import { DISTRICTS } from '../data/bangladeshLocations';

export interface AdminActor {
  userId: string;
  roles: UserRole[];
  districtScope?: string;
}

export interface AdminStatsSummary {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalDonors: number;
  verifiedDonors: number;
  availableDonors: number;
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  pendingRequests: number;
  totalHospitals: number;
  verifiedHospitals: number;
  pendingHospitals: number;
  rejectedHospitals: number;
  totalReports: number;
  pendingReports: number;
  totalAuditLogs: number;
  bloodGroupCounts: Record<string, number>;
  districtName?: string;
  isScopedToDistrict?: boolean;
}

export class AdminService {
  /**
   * Check if the actor can access the admin moderation panel
   */
  static canAccessAdmin(roles: UserRole[]): boolean {
    return roles.includes('super_admin') || roles.includes('district_admin') || roles.includes('moderator');
  }

  /**
   * Strict Privilege Escalation Protection: ONLY super_admin can assign or revoke administrative roles.
   * Normal users, seekers, donors, district admins, or moderators CANNOT assign roles!
   */
  static canAssignRoles(actorRoles: UserRole[]): boolean {
    return actorRoles.includes('super_admin');
  }

  /**
   * District Admin Scope Restriction:
   * - super_admin can manage ANY district (nationwide).
   * - district_admin can ONLY manage resources within their assigned districtScope.
   * - other roles cannot manage district resources.
   */
  static canManageInDistrict(
    actorRoles: UserRole[],
    actorDistrictScope: string | undefined,
    targetDistrictId: string
  ): { allowed: boolean; reason?: string } {
    if (actorRoles.includes('super_admin')) {
      return { allowed: true };
    }

    if (actorRoles.includes('district_admin')) {
      if (!actorDistrictScope) {
        return {
          allowed: false,
          reason: 'জেলা প্রশাসক অ্যাকাউন্টে নির্দিষ্ট জেলার অনুমতি নির্ধারণ করা হয়নি।',
        };
      }
      if (actorDistrictScope.toLowerCase() === targetDistrictId.toLowerCase()) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `অননুমোদিত: আপনি শুধুমাত্র আপনার নির্ধারিত জেলা (${actorDistrictScope}) পরিচালনা করতে পারবেন। (${targetDistrictId} অননুমোদিত)`,
      };
    }

    if (actorRoles.includes('moderator')) {
      // General moderators can view/review but cannot manage district-scoped admin actions
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'অননুমোদিত: আপনার প্রয়োজনীয় প্রশাসনিক ক্ষমতা নেই।',
    };
  }

  /**
   * Can moderate blood requests
   */
  static canModerateRequests(actorRoles: UserRole[]): boolean {
    return (
      actorRoles.includes('super_admin') ||
      actorRoles.includes('district_admin') ||
      actorRoles.includes('moderator')
    );
  }

  /**
   * Can moderate and verify hospital DGHS licenses
   */
  static canModerateHospitals(actorRoles: UserRole[]): boolean {
    return actorRoles.includes('super_admin') || actorRoles.includes('district_admin');
  }

  /**
   * Can review abuse reports
   */
  static canReviewReports(actorRoles: UserRole[]): boolean {
    return (
      actorRoles.includes('super_admin') ||
      actorRoles.includes('district_admin') ||
      actorRoles.includes('moderator')
    );
  }

  /**
   * Compute real database statistics with optional district filtering
   */
  static calculateRealStats(
    users: UserProfile[],
    donors: DonorProfile[],
    requests: BloodRequest[],
    hospitals: Hospital[],
    reports: AbuseReport[],
    auditLogs: AuditLog[],
    districtFilter?: string
  ): AdminStatsSummary {
    const isScoped = Boolean(districtFilter && districtFilter !== 'all');

    let scopedUsers = users;
    let scopedDonors = donors;
    let scopedRequests = requests;
    let scopedHospitals = hospitals;

    if (isScoped) {
      scopedUsers = users.filter((u) => u.districtId.toLowerCase() === districtFilter!.toLowerCase());
      scopedDonors = donors.filter((d) => d.districtId.toLowerCase() === districtFilter!.toLowerCase());
      scopedRequests = requests.filter((r) => r.districtId.toLowerCase() === districtFilter!.toLowerCase());
      scopedHospitals = hospitals.filter((h) => h.districtId.toLowerCase() === districtFilter!.toLowerCase());
    }

    const bloodGroupCounts: Record<string, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
      'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
    };

    scopedDonors.forEach((d) => {
      if (bloodGroupCounts[d.bloodGroup] !== undefined) {
        bloodGroupCounts[d.bloodGroup]++;
      }
    });

    return {
      totalUsers: scopedUsers.length,
      activeUsers: scopedUsers.filter((u) => u.status === 'active').length,
      suspendedUsers: scopedUsers.filter((u) => u.status === 'suspended').length,
      totalDonors: scopedDonors.length,
      verifiedDonors: scopedDonors.filter((d) => d.isVerified || d.verificationStatus === 'verified').length,
      availableDonors: scopedDonors.filter((d) => d.availability === 'available').length,
      totalRequests: scopedRequests.length,
      activeRequests: scopedRequests.filter(
        (r) => r.status === 'finding_donors' || r.status === 'donor_responded'
      ).length,
      completedRequests: scopedRequests.filter((r) => r.status === 'completed').length,
      pendingRequests: scopedRequests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length,
      totalHospitals: scopedHospitals.length,
      verifiedHospitals: scopedHospitals.filter((h) => h.status === 'verified').length,
      pendingHospitals: scopedHospitals.filter((h) => h.status === 'pending').length,
      rejectedHospitals: scopedHospitals.filter((h) => h.status === 'rejected').length,
      totalReports: isScoped
        ? reports.filter((rep) => scopedRequests.some((r) => r.id === rep.targetId)).length
        : reports.length,
      pendingReports: isScoped
        ? reports.filter((rep) => rep.status === 'pending' && scopedRequests.some((r) => r.id === rep.targetId)).length
        : reports.filter((rep) => rep.status === 'pending').length,
      totalAuditLogs: isScoped ? auditLogs.slice(0, 50).length : auditLogs.length,
      bloodGroupCounts,
      districtName: districtFilter,
      isScopedToDistrict: isScoped,
    };
  }

  /**
   * District Health / Readiness score (percentage of blood groups covered by active donors)
   */
  static calculateDistrictHealth(donors: DonorProfile[], districtId: string): {
    scorePercent: number;
    availableGroupsCount: number;
    status: 'good' | 'moderate' | 'critical';
  } {
    const districtDonors = donors.filter(
      (d) => d.districtId.toLowerCase() === districtId.toLowerCase() && d.availability === 'available'
    );
    const uniqueGroups = new Set(districtDonors.map((d) => d.bloodGroup));
    const count = uniqueGroups.size;
    const score = Math.round((count / 8) * 100);

    let status: 'good' | 'moderate' | 'critical' = 'critical';
    if (score >= 75) status = 'good';
    else if (score >= 37) status = 'moderate';

    return {
      scorePercent: score,
      availableGroupsCount: count,
      status,
    };
  }
}
