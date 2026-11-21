import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { VALID_BLOOD_GROUPS } from '../../services/validationService';
import { BloodGroup, BloodRequest, DonorProfile } from '../../types';
import { RequestCard } from '../requests/RequestCard';
import {
  Droplets,
  Search,
  PlusCircle,
  Heart,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Hospital,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToFindDonors: (bloodGroup?: BloodGroup) => void;
  openCreateRequest: () => void;
  onOpenRequestDetails: (req: BloodRequest) => void;
  onNavigateTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToFindDonors,
  openCreateRequest,
  onOpenRequestDetails,
  onNavigateTab,
}) => {
  const { language, t } = useLanguage();
  const { stats, requests, hospitals, donors } = useData();
  const { isAuthenticated, setShowLoginModal, setShowProfileModal } = useAuth();

  const [selectedHeroBloodGroup, setSelectedHeroBloodGroup] = useState<BloodGroup | ''>('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateToFindDonors(selectedHeroBloodGroup || undefined);
  };

  const handleBecomeDonor = () => {
    if (isAuthenticated) {
      setShowProfileModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  // Group counts
  const groupCounts: Record<BloodGroup, number> = {
    'A+': donors.filter((d) => d.bloodGroup === 'A+').length,
    'A-': donors.filter((d) => d.bloodGroup === 'A-').length,
    'B+': donors.filter((d) => d.bloodGroup === 'B+').length,
    'B-': donors.filter((d) => d.bloodGroup === 'B-').length,
    'AB+': donors.filter((d) => d.bloodGroup === 'AB+').length,
    'AB-': donors.filter((d) => d.bloodGroup === 'AB-').length,
    'O+': donors.filter((d) => d.bloodGroup === 'O+').length,
    'O-': donors.filter((d) => d.bloodGroup === 'O-').length,
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-red-50/70 via-white to-gray-50 border-b border-red-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Unboxed editorial kicker with subtle separator */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-red-700 flex-wrap">
              <span>{t.hero.badge}</span>
              <span aria-hidden="true">·</span>
              <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                {language === 'bn' ? 'BETA TEST · বিটা টেস্ট' : 'PUBLIC BETA TEST'}
              </span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-tight sm:leading-none text-balance">
              {t.hero.titlePart1}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-700">
                {t.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>

            {/* Quick Hero Blood Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-8 p-2.5 sm:p-3 bg-white rounded-3xl shadow-xl shadow-red-950/5 border border-red-100 max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="w-full sm:flex-1 relative">
                <select
                  value={selectedHeroBloodGroup}
                  onChange={(e) => setSelectedHeroBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-hidden"
                >
                  <option value="">{t.hero.searchBloodPlaceholder}</option>
                  {VALID_BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg} গ্রুপ ({groupCounts[bg]} {language === 'bn' ? 'দাতা' : 'donors'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>{t.hero.findDonorsBtn}</span>
              </button>
            </form>

            {/* Sub-CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={openCreateRequest}
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.hero.requestBloodBtn}</span>
              </button>

              <button
                onClick={handleBecomeDonor}
                className="px-5 py-2.5 rounded-2xl border border-gray-300 hover:border-red-600 text-gray-800 hover:text-red-600 bg-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 text-red-600" />
                <span>{t.hero.becomeDonorBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION (Clearly labeled as realistic sample dataset) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <span>{language === 'bn' ? 'রিয়েল-টাইম ডাটাবেস পরিসংখ্যান' : 'Real Database Metrics'}</span>
            <span aria-hidden="true">·</span>
            <span>{language === 'bn' ? 'ফ্রি পাবলিক বিটা' : 'Free Public Beta'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950">
            {t.stats.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-lg mx-auto">
            {t.stats.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs hover:border-red-200 transition text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 fill-red-600" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-gray-950 block font-mono tabular-nums">
              {stats.totalDonors}
            </span>
            <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
              {t.stats.activeDonors}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              {stats.availableDonors} {language === 'bn' ? 'জন প্রস্তুত' : 'ready now'}
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs hover:border-red-200 transition text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Droplets className="w-6 h-6 fill-red-600" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-gray-950 block font-mono tabular-nums">
              {stats.totalRequests}
            </span>
            <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
              {t.stats.emergencyRequests}
            </span>
            <span className="text-[11px] text-red-600 font-semibold block mt-0.5">
              {stats.activeRequests} {language === 'bn' ? 'সক্রিয় জরুরী আবেদন' : 'active requests'}
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs hover:border-red-200 transition text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <Hospital className="w-6 h-6" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-gray-950 block font-mono tabular-nums">
              {stats.verifiedHospitals}
            </span>
            <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
              {t.stats.verifiedHospitals}
            </span>
            <span className="text-[11px] text-sky-600 font-semibold block mt-0.5">
              {language === 'bn' ? 'DGHS অনুমোদিত পার্টনার' : 'DGHS Certified'}
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs hover:border-red-200 transition text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-gray-950 block font-mono tabular-nums">
              ৬৪ / 64
            </span>
            <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
              {t.stats.districtsCovered}
            </span>
            <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">
              {language === 'bn' ? '৮ বিভাগেই সক্রিয়' : 'All 8 Divisions'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-center text-gray-400 mt-4">
          * {t.stats.realDataNotice}
        </p>
      </section>

      {/* BLOOD GROUP CATEGORIES (Interactive) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950">
              {language === 'bn' ? 'রক্তের গ্রুপ অনুযায়ী রক্তদাতা' : 'Find Donors By Blood Group'}
            </h2>
            <p className="text-xs text-gray-500">
              {language === 'bn' ? 'নির্দিষ্ট গ্রুপে ক্লিক করে সরাসরি অনুসন্ধান করুন' : 'Click any blood group to filter instantly'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {VALID_BLOOD_GROUPS.map((bg) => (
            <button
              key={bg}
              onClick={() => onNavigateToFindDonors(bg)}
              className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-red-500 hover:shadow-md transition text-center cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 group-hover:bg-red-600 text-red-600 group-hover:text-white font-black text-xl flex items-center justify-center mx-auto transition-colors">
                {bg}
              </div>
              <span className="text-xs font-bold text-gray-800 block mt-2">
                {groupCounts[bg]} {language === 'bn' ? 'জন রক্তদাতা' : 'Donors'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* LATEST EMERGENCY REQUESTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                {language === 'bn' ? 'সর্বশেষ জরুরী রক্তের আবেদন' : 'Latest Emergency Blood Requests'}
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              {language === 'bn' ? 'আপনার এলাকায় কেউ রক্তের প্রয়োজনে থাকলে দ্রুত এগিয়ে আসুন' : 'Real-time verified emergency requests'}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('emergency_requests')}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'bn' ? 'সকল আবেদন দেখুন' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-8 text-center space-y-3">
            <Droplets className="w-10 h-10 text-red-200 mx-auto" />
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              {language === 'bn'
                ? 'বর্তমানে কোনো সক্রিয় জরুরী রক্তের আবেদন নেই'
                : 'No active emergency blood requests right now'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {language === 'bn'
                ? 'এখানে শুধুমাত্র প্রকৃত ব্যবহারকারীদের জমা দেওয়া রক্তের আবেদন প্রদর্শিত হয় — কোনো কাল্পনিক বা ডেমো আবেদন দেখানো হয় না।'
                : 'Only real submitted emergency blood requests are displayed here. No fabricated or mock entries are shown.'}
            </p>
            <button
              onClick={openCreateRequest}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.hero.requestBloodBtn}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.slice(0, 3).map((req) => (
              <RequestCard key={req.id} request={req} onOpenDetails={onOpenRequestDetails} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS (৩টি সহজ ধাপ) */}
      <section className="bg-gray-50 py-16 border-y border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-950">
              {language === 'bn' ? 'কীভাবে রক্তদাতা কাজ করে?' : 'How ROKTO DATA Works'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {language === 'bn'
                ? 'রক্তগ্রহীতা ও রক্তদাতার মাঝে নিরাপদ, মধ্যস্বত্বভোগীমুক্ত এবং স্বচ্ছ সেতুবন্ধন।'
                : 'A safe, direct, and non-commercial bridge between blood seekers and voluntary donors.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 font-black text-lg flex items-center justify-center mb-4">
                ১
              </div>
              <h3 className="text-base font-bold text-gray-950 mb-2">
                {language === 'bn' ? '১. রক্তের আবেদন বা অনুসন্ধান' : '1. Search or Request Blood'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'bn'
                  ? 'আপনার প্রয়োজনীয় রক্তের গ্রুপ এবং জেলা ও উপজেলা নির্বাচন করুন অথবা জরুরী রক্তের আবেদন ফর্ম পূরণ করুন।'
                  : 'Select required blood group and district/upazila or publish an emergency blood request.'}
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 font-black text-lg flex items-center justify-center mb-4">
                ২
              </div>
              <h3 className="text-base font-bold text-gray-950 mb-2">
                {language === 'bn' ? '২. তাৎক্ষণিক রক্তদাতা নোটিফিকেশন' : '2. Instant Matching Alerts'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'bn'
                  ? 'কাছাকাছি এলাকার রক্তদাতারা সাথে সাথে অ্যালার্ট পাবেন এবং "আমি রক্ত দিতে পারব" বাটনে চাপ দিয়ে সাড়া দেবেন।'
                  : 'Matching available voluntary donors in the radius are instantly alerted and can respond with one click.'}
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 font-black text-lg flex items-center justify-center mb-4">
                ৩
              </div>
              <h3 className="text-base font-bold text-gray-950 mb-2">
                {language === 'bn' ? '৩. নিরাপদ যোগাযোগ ও রক্তদান' : '3. Safe Contact & Blood Donation'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'bn'
                  ? 'উভয়পক্ষ নিরাপদে যোগাযোগ করবেন এবং সরকারি অনুমোদিত হাসপাতালে চিকিৎসকের তত্ত্বাবধানে রক্তদান সম্পন্ন করবেন।'
                  : 'Both parties connect securely and conduct the donation under registered doctor supervision.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED HOSPITAL PARTNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950">
              {language === 'bn' ? 'যাচাইকৃত হাসপাতাল ও ক্লিনিকসমূহ' : 'Verified Hospital Network'}
            </h2>
            <p className="text-xs text-gray-500">
              {language === 'bn' ? 'স্বাস্থ্য অধিদপ্তরের (DGHS) লাইসেন্সপ্রাপ্ত সরকারি ও বেসরকারি হাসপাতাল' : 'DGHS licensed healthcare centers'}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('hospitals')}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'bn' ? 'সকল হাসপাতাল' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hospitals.slice(0, 3).map((hosp) => (
            <div key={hosp.id} className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">{hosp.licenseNumber}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  {language === 'bn' ? hosp.nameBn : hosp.nameEn}
                </h3>
                <p className="text-xs text-gray-500">{hosp.address}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span className="font-mono">{hosp.contactPhone}</span>
                <span className="text-[11px] text-sky-600 font-semibold">DGHS Certified</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
