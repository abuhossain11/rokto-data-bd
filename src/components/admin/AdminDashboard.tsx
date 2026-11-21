import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DISTRICTS, DIVISIONS, getDistrictById, getLocationName } from '../../data/bangladeshLocations';
import { UserRole, BloodGroup, RequestStatus, HospitalStatus, UserProfile } from '../../types';
import { AdminService } from '../../services/adminService';
import {
  Users,
  Heart,
  Droplets,
  Hospital as HospitalIcon,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Lock,
  Search,
  Activity,
  History,
  Radio,
  Send,
  MapPin,
  BadgeCheck,
  UserCheck,
  UserX,
  ChevronRight,
  Filter,
  Eye,
  Info,
  Building,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, switchDemoRole, isSuperAdmin, isDistrictAdmin, isModerator } = useAuth();
  const {
    requests,
    donors,
    hospitals,
    reports,
    auditLogs,
    users,
    verificationRecords,
    updateUserStatus,
    assignUserRole,
    revokeUserRole,
    verifyDonor,
    verifyHospitalWithNotes,
    moderateBloodRequest,
    moderateAbuseReport,
    broadcastAdminAlert,
    getDistrictStats,
  } = useData();
  const { language } = useLanguage();
  const { showToast } = useToast();

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'donors' | 'hospitals' | 'requests' | 'reports' | 'districts' | 'broadcast' | 'audit'
  >('overview');

  // District Scope selection
  // If user is district_admin (and not super_admin), their scope is strictly locked!
  const effectiveDistrictScope = isSuperAdmin
    ? 'all'
    : user?.districtScope || (user?.districtId || 'dhaka');

  const [selectedDistrict, setSelectedDistrict] = useState<string>(effectiveDistrictScope);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  const [donorSearch, setDonorSearch] = useState('');
  const [donorGroupFilter, setDonorGroupFilter] = useState<string>('all');
  const [donorStatusFilter, setDonorStatusFilter] = useState<string>('all');

  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');

  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // Modals
  const [roleModalUser, setRoleModalUser] = useState<UserProfile | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('moderator');
  const [selectedRoleDistrict, setSelectedRoleDistrict] = useState<string>('dhaka');

  // Broadcast Form
  const [broadcastTitleEn, setBroadcastTitleEn] = useState('');
  const [broadcastTitleBn, setBroadcastTitleBn] = useState('');
  const [broadcastBodyEn, setBroadcastBodyEn] = useState('');
  const [broadcastBodyBn, setBroadcastBodyBn] = useState('');
  const [broadcastBloodGroup, setBroadcastBloodGroup] = useState<string>('all');
  const [broadcastDistrict, setBroadcastDistrict] = useState<string>(isSuperAdmin ? 'all' : effectiveDistrictScope);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Access Control Guard
  if (!isSuperAdmin && !isDistrictAdmin && !isModerator) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'bn' ? 'অননুমোদিত প্রবেশাধিকার' : 'Unauthorized Access'}
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {language === 'bn'
            ? 'এই প্যানেলে প্রবেশের জন্য আপনার অ্যাকাউন্টে অ্যাডমিন বা মডারেটর অনুমতি প্রয়োজন।'
            : 'You need administrative permissions to view the moderation panel.'}
        </p>
      </div>
    );
  }

  // Active Scope Determination
  const activeDistrictFilter = isSuperAdmin ? selectedDistrict : effectiveDistrictScope;
  const isDistrictScoped = activeDistrictFilter !== 'all';

  // Compute Real Database Statistics
  const realStats = useMemo(() => {
    return getDistrictStats(activeDistrictFilter);
  }, [getDistrictStats, activeDistrictFilter, users, donors, requests, hospitals, reports, auditLogs]);

  // District Health Calculation for Active Scope
  const districtHealth = useMemo(() => {
    if (isDistrictScoped) {
      return AdminService.calculateDistrictHealth(donors, activeDistrictFilter);
    }
    return { scorePercent: 100, availableGroupsCount: 8, status: 'good' as const };
  }, [donors, isDistrictScoped, activeDistrictFilter]);

  // Pending counts
  const pendingHospitalsCount = hospitals.filter(
    (h) => h.status === 'pending' && (!isDistrictScoped || h.districtId.toLowerCase() === activeDistrictFilter.toLowerCase())
  ).length;

  const pendingDonorsCount = donors.filter(
    (d) =>
      (!d.isVerified || d.verificationStatus === 'pending') &&
      (!isDistrictScoped || d.districtId.toLowerCase() === activeDistrictFilter.toLowerCase())
  ).length;

  const pendingRequestsCount = requests.filter(
    (r) =>
      (r.status === 'submitted' || r.status === 'under_review') &&
      (!isDistrictScoped || r.districtId.toLowerCase() === activeDistrictFilter.toLowerCase())
  ).length;

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  // Handler: Handle Role Assignment (Super Admin Only)
  const handleAssignRoleSubmit = async () => {
    if (!roleModalUser) return;
    if (!isSuperAdmin) {
      showToast({
        type: 'error',
        title: language === 'bn' ? 'অননুমোদিত' : 'Access Denied',
        message: language === 'bn' ? 'শুধুমাত্র সুপার অ্যাডমিন পদবি পরিবর্তন করতে পারেন।' : 'Only Super Admin can assign roles.',
      });
      return;
    }

    const res = await assignUserRole(
      roleModalUser.id,
      selectedNewRole,
      user?.id || 'admin',
      user?.roles || ['super_admin'],
      selectedNewRole === 'district_admin' ? selectedRoleDistrict : undefined
    );

    if (res.success) {
      showToast({ type: 'success', title: language === 'bn' ? 'পদবি বরাদ্দ সফল' : 'Role Assigned', message: res.message });
      setRoleModalUser(null);
    } else {
      showToast({ type: 'error', title: 'Error', message: res.message });
    }
  };

  // Handler: Broadcast Announcement
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitleBn || !broadcastBodyBn) {
      showToast({
        type: 'warning',
        title: language === 'bn' ? 'তথ্য পূরণ করুন' : 'Missing Information',
        message: language === 'bn' ? 'দয়া করে শিরোনাম ও বার্তা লিখুন।' : 'Please enter title and message.',
      });
      return;
    }

    setIsBroadcasting(true);
    const res = await broadcastAdminAlert(
      broadcastTitleEn || broadcastTitleBn,
      broadcastBodyEn || broadcastBodyBn,
      broadcastTitleBn,
      broadcastBodyBn,
      broadcastBloodGroup === 'all' ? undefined : (broadcastBloodGroup as BloodGroup),
      broadcastDistrict === 'all' ? undefined : broadcastDistrict,
      user?.id || 'admin',
      user?.roles || ['super_admin'],
      user?.districtScope
    );
    setIsBroadcasting(false);

    if (res.success) {
      showToast({ type: 'success', title: language === 'bn' ? 'বার্তা প্রেরিত হয়েছে' : 'Broadcast Sent', message: res.message });
      setBroadcastTitleBn('');
      setBroadcastTitleEn('');
      setBroadcastBodyBn('');
      setBroadcastBodyEn('');
    } else {
      showToast({ type: 'error', title: 'Error', message: res.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. TOP OPERATIONAL BOUNDARY & RBAC BANNER */}
      <div className="bg-linear-to-r from-gray-900 via-gray-950 to-red-950 rounded-3xl p-6 text-white shadow-xl border border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {isSuperAdmin
                    ? 'Super Admin (সর্বোচ্চ সিস্টেম প্রশাসক)'
                    : isDistrictAdmin
                    ? `District Admin (${user?.districtScope || 'Dhaka'})`
                    : 'System Moderator (মডারেটর)'}
                </span>
              </span>

              {/* District Scope Badge */}
              <span className="px-3 py-1 rounded-full bg-gray-800/90 text-gray-300 font-medium text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>
                  {isSuperAdmin
                    ? language === 'bn' ? 'অধিক্ষেত্র: সারাদেশে ৬৪ জেলা' : 'Scope: Nationwide (All 64 Districts)'
                    : language === 'bn'
                    ? `অধিক্ষেত্র: ${getDistrictById(user?.districtScope || 'dhaka')?.nameBn || user?.districtScope} জেলা`
                    : `Scope: District Admin (${getDistrictById(user?.districtScope || 'dhaka')?.nameEn || user?.districtScope})`}
                </span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {language === 'bn' ? 'রক্তদাতা কেন্দ্রীয় প্রশাসন ও নিরাপত্তা ড্যাশবোর্ড' : 'ROKTO DATA Central Administration & Security'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {language === 'bn'
                ? 'সারাদেশের ৬৪ জেলার রক্তদাতা যাচাই, হাসপাতাল লাইসেন্স অনুমোদন, আবেদন মডারেশন ও অডিট পর্যবেক্ষণ'
                : 'Nationwide voluntary donor verification, DGHS hospital review, emergency request moderation & audit logs'}
            </p>
          </div>

          {/* Quick RBAC Role Tester & Scope Switcher Widget */}
          <div className="bg-gray-800/80 p-3.5 rounded-2xl border border-gray-700/60 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between gap-3 text-xs text-gray-300 font-bold">
              <span>{language === 'bn' ? 'ভূমিকা পরীক্ষা করুন:' : 'Test RBAC Role:'}</span>
              <span className="text-[10px] text-amber-400 font-mono">Live RBAC Mode</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => switchDemoRole('super_admin')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  isSuperAdmin ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Super Admin
              </button>
              <button
                onClick={() => switchDemoRole('district_admin')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  !isSuperAdmin && isDistrictAdmin ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                District Admin
              </button>
              <button
                onClick={() => switchDemoRole('moderator')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  !isDistrictAdmin && isModerator ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Moderator
              </button>
            </div>

            {/* Scope Filter for Super Admin */}
            {isSuperAdmin && (
              <div className="mt-1 flex items-center gap-2 pt-2 border-t border-gray-700">
                <span className="text-[11px] text-gray-400 font-medium">
                  {language === 'bn' ? 'ফিল্টার জেলা:' : 'Scope Filter:'}
                </span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-gray-900 text-white text-xs px-2.5 py-1 rounded-lg border border-gray-700 focus:outline-hidden focus:border-red-500 font-medium"
                >
                  <option value="all">{language === 'bn' ? 'সারাদেশ (৬৪ জেলা)' : 'Nationwide (All 64)'}</option>
                  {DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-6 mt-6 border-t border-gray-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {language === 'bn' ? 'একনজরে' : 'Overview'}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'users' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ব্যবহারকারী' : 'Users'}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-gray-900 text-[10px] font-mono text-gray-300">
                {realStats.totalUsers}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('donors')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
              activeTab === 'donors' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'রক্তদাতা ভেরিফিকেশন' : 'Donor Verification'}</span>
              {pendingDonorsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-gray-950 text-[10px] font-bold">
                  {pendingDonorsCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('hospitals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
              activeTab === 'hospitals' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <HospitalIcon className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'হাসপাতাল অনুমোদন' : 'Hospitals'}</span>
              {pendingHospitalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-gray-950 text-[10px] font-bold">
                  {pendingHospitalsCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
              activeTab === 'requests' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'আবেদন মডারেশন' : 'Requests'}</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
              activeTab === 'reports' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অভিযোগ' : 'Reports'}</span>
              {pendingReportsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingReportsCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('districts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'districts' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? '৬৪ জেলা' : '64 Districts'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'broadcast' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'জরুরী বার্তা' : 'Broadcast'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'audit' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অডিট লগ' : 'Audit Logs'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: OVERVIEW & REAL STATISTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 fill-red-600" />
              </div>
              <span className="text-2xl font-black text-gray-900">{realStats.totalDonors}</span>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {language === 'bn' ? 'নিবন্ধিত রক্তদাতা' : 'Registered Donors'}
              </p>
              <span className="text-[10px] font-bold text-emerald-600 block mt-1">
                {realStats.availableDonors} {language === 'bn' ? 'প্রস্তুত রক্তদাতা' : 'available'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Droplets className="w-5 h-5 fill-blue-600" />
              </div>
              <span className="text-2xl font-black text-gray-900">{realStats.totalRequests}</span>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {language === 'bn' ? 'সর্বমোট আবেদন' : 'Total Requests'}
              </p>
              <span className="text-[10px] font-bold text-red-600 block mt-1">
                {realStats.activeRequests} {language === 'bn' ? 'সক্রিয় অনুসন্ধান' : 'active'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
                <HospitalIcon className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-gray-900">{realStats.totalHospitals}</span>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {language === 'bn' ? 'হাসপাতাল পার্টনার' : 'Hospitals'}
              </p>
              <span className="text-[10px] font-bold text-sky-600 block mt-1">
                {realStats.verifiedHospitals} {language === 'bn' ? 'যাচাইকৃত' : 'verified'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-gray-900">{realStats.totalUsers}</span>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {language === 'bn' ? 'সর্বমোট ব্যবহারকারী' : 'Total Users'}
              </p>
              <span className="text-[10px] font-bold text-emerald-600 block mt-1">
                {realStats.activeUsers} {language === 'bn' ? 'সক্রিয় একাউন্ট' : 'active'}
              </span>
            </div>
          </div>

          {/* Blood Group Matrix & District Readiness Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    {language === 'bn' ? 'রক্তের গ্রুপ অনুযায়ী প্রস্তুত রক্তদাতা' : 'Available Donors by Blood Group'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isDistrictScoped
                      ? `${getDistrictById(activeDistrictFilter)?.nameBn || activeDistrictFilter} জেলার প্রস্তুত স্বেচ্ছাসেবী তালিকা`
                      : 'সারাদেশের ৮টি রক্তের গ্রুপের সক্রিয় রক্তদাতা অনুপাত'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((group) => {
                  const count = realStats.bloodGroupCounts[group] || 0;
                  const isRare = group.includes('-');
                  return (
                    <div
                      key={group}
                      className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-red-600">{group}</span>
                        {isRare && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {language === 'bn' ? 'রেয়ার' : 'Rare'}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-xl font-bold text-gray-900">{count}</span>
                        <span className="text-xs text-gray-400 ml-1 font-medium">{language === 'bn' ? 'জন' : 'donors'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* District Health & Readiness Gauge */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {language === 'bn' ? 'জেলা স্বাস্থ্য সূচক' : 'District Readiness Index'}
                </span>
                <h3 className="text-base font-bold text-gray-950">
                  {isDistrictScoped
                    ? `${getDistrictById(activeDistrictFilter)?.nameBn || activeDistrictFilter} জেলা প্রস্তুতি`
                    : 'জাতীয় রক্ত সহায়তা প্রস্তুতি'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'bn'
                    ? '৮টি রক্তের গ্রুপের রক্তদাতার উপস্থিতির হার'
                    : 'Readiness coverage based on donor availability'}
                </p>

                <div className="mt-6 flex items-center justify-center">
                  <div className="relative w-36 h-36 rounded-full border-8 border-gray-100 flex items-center justify-center">
                    <div
                      className={`absolute inset-0 rounded-full border-8 ${
                        districtHealth.status === 'good'
                          ? 'border-emerald-500'
                          : districtHealth.status === 'moderate'
                          ? 'border-amber-500'
                          : 'border-red-500'
                      }`}
                      style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)` }}
                    />
                    <div className="text-center z-10">
                      <span className="text-3xl font-black text-gray-900">{districtHealth.scorePercent}%</span>
                      <span className="text-[11px] text-gray-500 block font-medium">
                        {districtHealth.availableGroupsCount}/8 {language === 'bn' ? 'গ্রুপ প্রস্তুত' : 'groups'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span
                  className={`text-xs font-bold block text-center ${
                    districtHealth.status === 'good'
                      ? 'text-emerald-700 bg-emerald-50'
                      : districtHealth.status === 'moderate'
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-red-700 bg-red-50'
                  } py-1.5 px-3 rounded-xl`}
                >
                  {districtHealth.status === 'good'
                    ? language === 'bn' ? '✅ রক্তদাতা প্রস্তুতি সন্তোষজনক' : '✅ Good Readiness'
                    : districtHealth.status === 'moderate'
                    ? language === 'bn' ? '⚠️ কিছু রেয়ার গ্রুপে রক্তদাতা কম' : '⚠️ Moderate Readiness'
                    : language === 'bn' ? '🚨 জরুরী রক্তদাতা নিবন্ধন প্রয়োজন' : '🚨 Critical Donor Shortage'}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Alerts Banner */}
          {(pendingHospitalsCount > 0 || pendingDonorsCount > 0 || pendingRequestsCount > 0) && (
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    {language === 'bn' ? 'অনিষ্পন্ন প্রশাসনিক কাজ রয়েছে' : 'Pending Administrative Tasks'}
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {language === 'bn'
                      ? `${pendingHospitalsCount}টি হাসপাতাল, ${pendingDonorsCount} জন রক্তদাতা এবং ${pendingRequestsCount}টি রক্তের আবেদন পর্যালোচনার অপেক্ষায়।`
                      : `${pendingHospitalsCount} hospitals, ${pendingDonorsCount} donors, and ${pendingRequestsCount} requests awaiting review.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pendingDonorsCount > 0 && (
                  <button
                    onClick={() => setActiveTab('donors')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition cursor-pointer"
                  >
                    {language === 'bn' ? 'রক্তদাতা যাচাই' : 'Verify Donors'}
                  </button>
                )}
                {pendingHospitalsCount > 0 && (
                  <button
                    onClick={() => setActiveTab('hospitals')}
                    className="px-3 py-1.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition cursor-pointer"
                  >
                    {language === 'bn' ? 'হাসপাতাল যাচাই' : 'Verify Hospitals'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-950">
                {language === 'bn' ? 'সিস্টেম ব্যবহারকারী ও ভূমিকা ব্যবস্থাপনা' : 'User & Role Management'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'ব্যবহারকারীর অ্যাকাউন্ট সক্রিয়/স্থগিত ও পদবি নিয়ন্ত্রণ (সুপার অ্যাডমিন অনুমতি সাপেক্ষে)'
                  : 'Manage user access, suspensions, and server-controlled role assignments'}
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'নাম বা ফোন নম্বর...' : 'Search name or phone...'}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল পদবি' : 'All Roles'}</option>
                <option value="donor">Donor</option>
                <option value="seeker">Seeker</option>
                <option value="hospital">Hospital</option>
                <option value="moderator">Moderator</option>
                <option value="district_admin">District Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-900 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">ব্যবহারকারী / User</th>
                    <th className="p-4">ফোন ও অবস্থান</th>
                    <th className="p-4">রক্তের গ্রুপ</th>
                    <th className="p-4">পদবি / Roles</th>
                    <th className="p-4">অবস্থা</th>
                    <th className="p-4 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users
                    .filter((u) => {
                      if (isDistrictScoped && u.districtId.toLowerCase() !== activeDistrictFilter.toLowerCase()) return false;
                      if (userSearch) {
                        const q = userSearch.toLowerCase();
                        if (!u.fullName.toLowerCase().includes(q) && !u.phone.includes(q)) return false;
                      }
                      if (userRoleFilter !== 'all' && !u.roles.includes(userRoleFilter as UserRole)) return false;
                      if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
                      return true;
                    })
                    .map((usr) => (
                      <tr key={usr.id} className="hover:bg-gray-50/80">
                        <td className="p-4">
                          <span className="font-bold text-gray-900 block">{usr.fullName}</span>
                          <span className="text-[11px] text-gray-400 font-mono">{usr.id}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-gray-800 block">{usr.phone}</span>
                          <span className="text-[11px] text-gray-500">
                            {getLocationName(usr.divisionId, usr.districtId, usr.upazilaId, language)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                            {usr.bloodGroup}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {usr.roles.map((r) => (
                              <span
                                key={r}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r === 'super_admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : r === 'district_admin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : r === 'moderator'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {r}
                                {r === 'district_admin' && usr.districtScope && ` (${usr.districtScope})`}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              usr.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {usr.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Suspend/Active Button */}
                            <button
                              onClick={async () => {
                                const newStatus = usr.status === 'active' ? 'suspended' : 'active';
                                const res = await updateUserStatus(
                                  usr.id,
                                  newStatus,
                                  user?.id || 'admin',
                                  user?.roles || ['super_admin'],
                                  user?.districtScope
                                );
                                if (res.success) {
                                  showToast({ type: 'success', title: 'Status Updated', message: res.message });
                                } else {
                                  showToast({ type: 'error', title: 'Error', message: res.message });
                                }
                              }}
                              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                usr.status === 'active'
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={usr.status === 'active' ? 'Suspend User' : 'Activate User'}
                            >
                              {usr.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>

                            {/* Assign Role Button (Super Admin Only) */}
                            {isSuperAdmin ? (
                              <button
                                onClick={() => {
                                  setRoleModalUser(usr);
                                  setSelectedRoleDistrict(usr.districtId || 'dhaka');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 font-bold text-[11px] cursor-pointer"
                              >
                                {language === 'bn' ? 'পদবি পরিবর্তন' : 'Manage Role'}
                              </button>
                            ) : (
                              <span
                                className="px-2 py-1 text-[10px] text-gray-400 font-medium"
                                title="Only Super Admin can assign roles"
                              >
                                <Lock className="w-3 h-3 inline mr-1" />
                                {language === 'bn' ? 'লকড' : 'Locked'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 3: VOLUNTARY DONOR VERIFICATION */}
      {activeTab === 'donors' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-950">
                {language === 'bn' ? 'স্বেচ্ছাসেবী রক্তদাতা ভেরিফিকেশন' : 'Voluntary Donor Badge Verification'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'রক্তের গ্রুপ সার্টিফিকেট বা রেড ক্রিসেন্ট কার্ড যাচাই করে ভেরিফাইড ব্যাজ অনুমোদন করুন'
                  : 'Review blood group certificates and donation history to grant verified badges'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={donorGroupFilter}
                onChange={(e) => setDonorGroupFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল গ্রুপ' : 'All Groups'}</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={donorStatusFilter}
                onChange={(e) => setDonorStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
                <option value="pending">{language === 'bn' ? 'যাচাই বাকি' : 'Pending Verification'}</option>
                <option value="verified">{language === 'bn' ? 'যাচাইকৃত' : 'Verified'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donors
              .filter((d) => {
                if (isDistrictScoped && d.districtId.toLowerCase() !== activeDistrictFilter.toLowerCase()) return false;
                if (donorGroupFilter !== 'all' && d.bloodGroup !== donorGroupFilter) return false;
                if (donorStatusFilter === 'pending' && (d.isVerified || d.verificationStatus === 'verified')) return false;
                if (donorStatusFilter === 'verified' && !d.isVerified && d.verificationStatus !== 'verified') return false;
                return true;
              })
              .map((donor) => {
                const userObj = users.find((u) => u.id === donor.userId);
                const isVerified = donor.isVerified || donor.verificationStatus === 'verified';
                return (
                  <div key={donor.id} className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-red-600 text-base bg-red-50 px-2.5 py-1 rounded-xl">
                            {donor.bloodGroup}
                          </span>
                          <div>
                            <h4 className="font-black text-gray-900 text-sm">
                              {userObj ? userObj.fullName : donor.userId}
                            </h4>
                            <p className="text-xs text-gray-500 font-mono">
                              {userObj ? userObj.phone : '+880 17•• ••••78'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isVerified ? 'Verified Donor' : 'Pending'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-2xl">
                        <div>
                          <strong className="text-gray-700">অবস্থান:</strong>{' '}
                          {getLocationName(donor.divisionId, donor.districtId, donor.upazilaId, language)}
                        </div>
                        <div>
                          <strong className="text-gray-700">সর্বমোট রক্তদান:</strong>{' '}
                          <span className="font-bold text-gray-900">{donor.totalDonations} বার</span>
                        </div>
                        {donor.lastDonationDate && (
                          <div>
                            <strong className="text-gray-700">সর্বশেষ রক্তদান:</strong> {donor.lastDonationDate}
                          </div>
                        )}
                        {donor.verificationDocumentUrl && (
                          <div>
                            <strong className="text-gray-700">সনদপত্র:</strong>{' '}
                            <span className="text-blue-600 font-medium underline">
                              রক্তের গ্রুপ যাচাই সনদ (সংযুক্ত)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                      {!isVerified ? (
                        <>
                          <button
                            onClick={async () => {
                              const res = await verifyDonor(
                                donor.id,
                                'verified',
                                user?.id || 'admin',
                                user?.roles || ['super_admin'],
                                user?.districtScope,
                                'Blood grouping certificate confirmed by medical reviewer'
                              );
                              if (res.success) {
                                showToast({ type: 'success', title: 'Donor Verified', message: res.message });
                              } else {
                                showToast({ type: 'error', title: 'Error', message: res.message });
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'অনুমোদন ও ব্যাজ প্রদান' : 'Approve Badge'}</span>
                          </button>
                          <button
                            onClick={async () => {
                              const res = await verifyDonor(
                                donor.id,
                                'rejected',
                                user?.id || 'admin',
                                user?.roles || ['super_admin'],
                                user?.districtScope,
                                'Invalid or illegible certificate'
                              );
                              if (res.success) {
                                showToast({ type: 'warning', title: 'Rejected', message: res.message });
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition cursor-pointer"
                          >
                            {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>{language === 'bn' ? 'যাচাইকৃত স্বেচ্ছাসেবী' : 'Verified Voluntary Donor'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 5. TAB 4: HOSPITAL DGHS VERIFICATION */}
      {activeTab === 'hospitals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-950">
                {language === 'bn' ? 'হাসপাতাল লাইসেন্স যাচাই ও অনুমোদন (DGHS)' : 'Hospital DGHS License Verification'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'স্বাস্থ্য অধিদপ্তরের (DGHS) লাইসেন্স নম্বর যাচাই করে হাসপাতাল অনুমোদন দিন।'
                  : 'Verify Ministry of Health (DGHS) license credentials before approving'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospitals
              .filter((h) => !isDistrictScoped || h.districtId.toLowerCase() === activeDistrictFilter.toLowerCase())
              .map((hosp) => (
                <div key={hosp.id} className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-black text-gray-900 text-sm">{hosp.nameBn}</h4>
                        <p className="text-xs text-gray-500">{hosp.nameEn}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          hosp.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : hosp.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {hosp.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-2xl">
                      <div>
                        <strong className="text-gray-700">ডিজিএইচএস লাইসেন্স:</strong>{' '}
                        <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {hosp.licenseNumber}
                        </span>
                      </div>
                      <div>
                        <strong className="text-gray-700">ঠিকানা:</strong> {hosp.address}
                      </div>
                      <div>
                        <strong className="text-gray-700">যোগাযোগ:</strong> {hosp.contactPhone}
                      </div>
                      <div>
                        <strong className="text-gray-700">জেলা:</strong>{' '}
                        {getLocationName(hosp.divisionId, hosp.districtId, hosp.upazilaId, language)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    {hosp.status !== 'verified' && (
                      <button
                        onClick={async () => {
                          const res = await verifyHospitalWithNotes(
                            hosp.id,
                            'verified',
                            user?.id || 'admin',
                            user?.roles || ['super_admin'],
                            user?.districtScope,
                            `DGHS license ${hosp.licenseNumber} verified with health registry`
                          );
                          if (res.success) {
                            showToast({ type: 'success', title: 'Hospital Verified', message: res.message });
                          } else {
                            showToast({ type: 'error', title: 'Error', message: res.message });
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'অনুমোদন দিন' : 'Approve'}</span>
                      </button>
                    )}
                    {hosp.status !== 'rejected' && (
                      <button
                        onClick={async () => {
                          const res = await verifyHospitalWithNotes(
                            hosp.id,
                            'rejected',
                            user?.id || 'admin',
                            user?.roles || ['super_admin'],
                            user?.districtScope,
                            'DGHS license record mismatched or expired'
                          );
                          if (res.success) {
                            showToast({ type: 'warning', title: 'Hospital Rejected', message: res.message });
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 transition cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 6. TAB 5: EMERGENCY REQUEST MODERATION */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-950">
                {language === 'bn' ? 'জরুরী রক্তের আবেদন পর্যালোচনা ও নিয়ন্ত্রণ' : 'Blood Request Moderation'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'আবেদন যাচাই করে রক্তদাতা সন্ধানের জন্য অনুমোদন দিন অথবা প্রতারণামূলক আবেদন বাতিল করুন'
                  : 'Approve authentic requests for donor broadcast or cancel duplicate/fraudulent posts'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল অবস্থা' : 'All Status'}</option>
                <option value="submitted">{language === 'bn' ? 'নতুন জমা' : 'Submitted'}</option>
                <option value="finding_donors">{language === 'bn' ? 'রক্তদাতা অনুসন্ধানাধীন' : 'Finding Donors'}</option>
                <option value="donor_responded">{language === 'bn' ? 'সাড়া প্রাপ্ত' : 'Donor Responded'}</option>
                <option value="completed">{language === 'bn' ? 'সম্পন্ন' : 'Completed'}</option>
                <option value="cancelled">{language === 'bn' ? 'বাতিল' : 'Cancelled'}</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-900 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">গ্রুপ ও ব্যাগ</th>
                    <th className="p-4">হাসপাতাল ও এলাকা</th>
                    <th className="p-4">অনুরোধকারী</th>
                    <th className="p-4">জরুরিতা</th>
                    <th className="p-4">অবস্থা</th>
                    <th className="p-4 text-right">মডারেশন কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests
                    .filter((r) => {
                      if (isDistrictScoped && r.districtId.toLowerCase() !== activeDistrictFilter.toLowerCase()) return false;
                      if (requestStatusFilter !== 'all' && r.status !== requestStatusFilter) return false;
                      return true;
                    })
                    .map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/80">
                        <td className="p-4">
                          <span className="font-black text-red-600 text-sm bg-red-50 px-2.5 py-1 rounded-lg">
                            {req.bloodGroup}
                          </span>
                          <span className="ml-2 font-bold text-gray-800">({req.unitsRequired} ব্যাগ)</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-gray-900 block">{req.hospitalName}</span>
                          <span className="text-[11px] text-gray-400">
                            {getLocationName(req.divisionId, req.districtId, req.upazilaId, language)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-gray-800 block">{req.requesterName}</span>
                          <span className="font-mono text-gray-500 text-[11px]">{req.requesterPhone}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.urgency === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {req.urgency}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-gray-700">{req.status}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {req.status === 'submitted' || req.status === 'under_review' ? (
                              <button
                                onClick={async () => {
                                  const res = await moderateBloodRequest(
                                    req.id,
                                    'approve',
                                    user?.id || 'admin',
                                    user?.roles || ['super_admin'],
                                    user?.districtScope,
                                    'Approved by administrator'
                                  );
                                  if (res.success) {
                                    showToast({ type: 'success', title: 'Approved', message: res.message });
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 cursor-pointer"
                              >
                                {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                              </button>
                            ) : null}

                            {req.status !== 'completed' && req.status !== 'cancelled' && (
                              <button
                                onClick={async () => {
                                  const res = await moderateBloodRequest(
                                    req.id,
                                    'cancel',
                                    user?.id || 'admin',
                                    user?.roles || ['super_admin'],
                                    user?.districtScope,
                                    'Spam or duplicate'
                                  );
                                  if (res.success) {
                                    showToast({ type: 'warning', title: 'Cancelled', message: res.message });
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-bold hover:bg-red-100 cursor-pointer"
                              >
                                {language === 'bn' ? 'বাতিল' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 6: ABUSE REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-950">
              {language === 'bn' ? 'নিরাপত্তা ও অপব্যবহার রিপোর্ট মডারেশন' : 'Abuse & Safety Reports'}
            </h3>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-xs">
              {language === 'bn' ? 'এই মুহূর্তে কোনো অনিষ্পন্ন রিপোর্ট নেই।' : 'No pending abuse reports.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((rep) => (
                <div key={rep.id} className="bg-white p-5 rounded-3xl border border-red-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-red-600 text-xs">{rep.reason}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          rep.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : rep.status === 'action_taken'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mb-3 bg-red-50/50 p-3 rounded-2xl">{rep.details}</p>
                    <div className="text-[11px] text-gray-400 space-y-0.5">
                      <div>Target Type: <strong className="text-gray-600">{rep.targetType}</strong></div>
                      <div>Target ID: <span className="font-mono">{rep.targetId}</span></div>
                    </div>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                      <button
                        onClick={async () => {
                          const res = await moderateAbuseReport(
                            rep.id,
                            'action_taken',
                            user?.id || 'admin',
                            user?.roles || ['super_admin'],
                            'Target verified abusive and suspended',
                            true
                          );
                          if (res.success) {
                            showToast({ type: 'warning', title: 'Action Taken', message: res.message });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer"
                      >
                        {language === 'bn' ? 'সাসপেন্ড ও ব্যবস্থা নিন' : 'Take Action & Suspend'}
                      </button>
                      <button
                        onClick={async () => {
                          const res = await moderateAbuseReport(
                            rep.id,
                            'dismissed',
                            user?.id || 'admin',
                            user?.roles || ['super_admin'],
                            'False report dismissed'
                          );
                          if (res.success) {
                            showToast({ type: 'info', title: 'Dismissed', message: res.message });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
                      >
                        {language === 'bn' ? 'খারিজ করুন' : 'Dismiss'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 7: 64 DISTRICTS MANAGEMENT */}
      {activeTab === 'districts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-950">
                {language === 'bn' ? 'সারাদেশের ৬৪ জেলা ও বিভাগ পর্যবেক্ষণ' : '64 Districts Management & Health Matrix'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'সকল ৮টি বিভাগে জেলাভিত্তিক রক্তদাতা সংখ্যা ও নির্ধারিত জেলা প্রশাসক তালিকা'
                  : 'District-wise blood donor coverage and assigned district administrator network'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DISTRICTS.map((dist) => {
              const districtDonors = donors.filter((d) => d.districtId.toLowerCase() === dist.id.toLowerCase());
              const districtReqs = requests.filter(
                (r) => r.districtId.toLowerCase() === dist.id.toLowerCase() && (r.status === 'finding_donors' || r.status === 'donor_responded')
              );
              const districtHosps = hospitals.filter(
                (h) => h.districtId.toLowerCase() === dist.id.toLowerCase() && h.status === 'verified'
              );
              const assignedAdmin = users.find(
                (u) => u.roles.includes('district_admin') && u.districtScope?.toLowerCase() === dist.id.toLowerCase()
              );
              const health = AdminService.calculateDistrictHealth(donors, dist.id);

              return (
                <div
                  key={dist.id}
                  className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-red-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div>
                        <h4 className="font-black text-gray-900 text-sm">{dist.nameBn}</h4>
                        <span className="text-[11px] text-gray-400 font-medium">{dist.nameEn} ({dist.divisionId})</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          health.status === 'good'
                            ? 'bg-emerald-50 text-emerald-700'
                            : health.status === 'moderate'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {health.scorePercent}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center my-3 bg-gray-50 p-2.5 rounded-2xl">
                      <div>
                        <span className="text-sm font-black text-red-600 block">{districtDonors.length}</span>
                        <span className="text-[9px] text-gray-500 font-medium">{language === 'bn' ? 'রক্তদাতা' : 'Donors'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-black text-blue-600 block">{districtReqs.length}</span>
                        <span className="text-[9px] text-gray-500 font-medium">{language === 'bn' ? 'আবেদন' : 'Requests'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-black text-emerald-600 block">{districtHosps.length}</span>
                        <span className="text-[9px] text-gray-500 font-medium">{language === 'bn' ? 'হাসপাতাল' : 'Hospitals'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">{language === 'bn' ? 'জেলা প্রশাসক:' : 'Admin:'}</span>
                    <span className="font-bold text-gray-900">
                      {assignedAdmin ? assignedAdmin.fullName.split(' ')[0] : (language === 'bn' ? 'নির্ধারিত নেই' : 'Unassigned')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9. TAB 8: EMERGENCY BROADCAST NOTIFICATION */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-950">
                {language === 'bn' ? 'জরুরী প্রশাসনিক পুশ ও ইন-অ্যাপ বার্তা' : 'Admin Emergency Broadcast'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'নির্দিষ্ট জেলা বা সারাদেশের রক্তদাতাদের কাছে জরুরী রক্তের আহবান প্রেরণ করুন'
                  : 'Dispatch high-priority push and in-app alerts to matching donors'}
              </p>
            </div>
          </div>

          <form onSubmit={handleBroadcastSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {language === 'bn' ? 'লক্ষ্য জেলা' : 'Target District'}
                </label>
                <select
                  value={broadcastDistrict}
                  onChange={(e) => setBroadcastDistrict(e.target.value)}
                  disabled={!isSuperAdmin}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900"
                >
                  {isSuperAdmin && (
                    <option value="all">{language === 'bn' ? 'সারাদেশ (সকল জেলা)' : 'Nationwide (All Districts)'}</option>
                  )}
                  {DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {language === 'bn' ? 'নির্দিষ্ট রক্তের গ্রুপ (ঐচ্ছিক)' : 'Target Blood Group (Optional)'}
                </label>
                <select
                  value={broadcastBloodGroup}
                  onChange={(e) => setBroadcastBloodGroup(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900"
                >
                  <option value="all">{language === 'bn' ? 'সকল গ্রুপ' : 'All Blood Groups'}</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {language === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'}
              </label>
              <input
                type="text"
                value={broadcastTitleBn}
                onChange={(e) => setBroadcastTitleBn(e.target.value)}
                placeholder="যেমন: জরুরী আহবান: ঢাকা মেডিকেলে O- নেগেটিভ রক্ত প্রয়োজন"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {language === 'bn' ? 'বার্তা (বাংলা)' : 'Message (Bengali)'}
              </label>
              <textarea
                rows={3}
                value={broadcastBodyBn}
                onChange={(e) => setBroadcastBodyBn(e.target.value)}
                placeholder="বিস্তারিত বার্তা লিখুন..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-red-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isBroadcasting}
              className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>{isBroadcasting ? 'প্রেরণ করা হচ্ছে...' : 'জরুরী ঘোষণা সম্প্রচার করুন'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 10. TAB 9: TAMPER-EVIDENT AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                <span>{language === 'bn' ? 'সিস্টেম অডিট ও অপরিবর্তনীয় নিরাপত্তা লগ' : 'Tamper-Evident Security Audit Logs'}</span>
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'প্রশাসনিক সকল কার্যক্রমের অপরিবর্তনীয় ডিজিটাল প্রমাণপত্র (Append-Only Trail)'
                  : 'Immutable security log of all administrative actions, role assignments, and status updates'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={language === 'bn' ? 'অ্যাকশন বা টার্গেট খুঁজুন...' : 'Search action or target...'}
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-900 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">সময়</th>
                    <th className="p-4">অ্যাকশন</th>
                    <th className="p-4">অপারেটর রোল</th>
                    <th className="p-4">টার্গেট</th>
                    <th className="p-4">বিবরণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {auditLogs
                    .filter((l) => {
                      if (auditSearch) {
                        const q = auditSearch.toLowerCase();
                        if (!l.action.toLowerCase().includes(q) && !l.targetId.toLowerCase().includes(q)) return false;
                      }
                      return true;
                    })
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/80">
                        <td className="p-4 whitespace-nowrap text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-red-700">{log.action}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-sans font-semibold text-[10px]">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="p-4 text-gray-900">{log.targetType}: {log.targetId}</td>
                        <td className="p-4 font-sans text-gray-700">{log.details}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 11. ROLE ASSIGNMENT MODAL (SUPER ADMIN ONLY) */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-gray-950 text-base">
                  {language === 'bn' ? 'পদবি ও ক্ষমতা বরাদ্দ (সুপার অ্যাডমিন)' : 'Assign Role (Super Admin)'}
                </h3>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl text-xs space-y-1">
              <div><strong>ব্যবহারকারী:</strong> {roleModalUser.fullName}</div>
              <div><strong>ফোন:</strong> {roleModalUser.phone}</div>
              <div><strong>বর্তমান পদবি:</strong> {roleModalUser.roles.join(', ')}</div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {language === 'bn' ? 'প্রদানযোগ্য পদবি' : 'Role to Grant'}
              </label>
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium"
              >
                <option value="moderator">মডারেটর (Moderator)</option>
                <option value="district_admin">জেলা প্রশাসক (District Admin)</option>
                <option value="hospital">হাসপাতাল প্রতিনিধি (Hospital Staff)</option>
                <option value="super_admin">সুপার অ্যাডমিন (Super Admin)</option>
              </select>
            </div>

            {selectedNewRole === 'district_admin' && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {language === 'bn' ? 'নির্ধারিত জেলা (District Scope)' : 'Assigned District Scope'}
                </label>
                <select
                  value={selectedRoleDistrict}
                  onChange={(e) => setSelectedRoleDistrict(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  {language === 'bn'
                    ? 'জেলা প্রশাসক শুধুমাত্র নির্বাচিত জেলার হাসপাতাল, রক্তদাতা ও আবেদন পরিচালনা করতে পারবেন।'
                    : 'The District Admin will be strictly restricted to this assigned district.'}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAssignRoleSubmit}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer shadow-md"
              >
                {language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
