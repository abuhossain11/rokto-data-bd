import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { getLocationName } from '../../data/bangladeshLocations';
import { DonorAvailability, BloodRequest } from '../../types';
import {
  Heart,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Bell,
  ShieldCheck,
  AlertCircle,
  User,
  Settings,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { RequestCard } from '../requests/RequestCard';

interface DonorDashboardProps {
  onOpenRequestDetails: (req: BloodRequest) => void;
  openCreateRequest: () => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({ onOpenRequestDetails, openCreateRequest }) => {
  const { user, donorProfile, updateDonorProfile, setShowProfileModal } = useAuth();
  const { requests, responses } = useData();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'history' | 'settings'>('incoming');
  const [toggleNotice, setToggleNotice] = useState('');

  if (!user) return null;

  const handleAvailabilityToggle = async (newStatus: DonorAvailability) => {
    await updateDonorProfile({ availability: newStatus });
    const statusMsg =
      newStatus === 'available'
        ? (language === 'bn' ? 'আপনি রক্তদানে প্রস্তুত হিসেবে চিহ্নিত হয়েছেন।' : 'Marked as available for donation.')
        : newStatus === 'unavailable'
        ? (language === 'bn' ? 'স্ট্যাটাস অনুপলব্ধ করা হয়েছে।' : 'Status set to unavailable.')
        : (language === 'bn' ? 'স্ট্যাটাস সাময়িক অনুপলব্ধ করা হয়েছে।' : 'Status set to temporarily unavailable.');

    showToast({
      type: 'info',
      title: language === 'bn' ? 'প্রাপ্যতা স্ট্যাটাস পরিবর্তিত হয়েছে' : 'Availability Updated',
      message: statusMsg,
    });

    setToggleNotice(statusMsg);
    setTimeout(() => setToggleNotice(''), 3000);
  };

  // Incoming requests matching donor blood group
  const matchingRequests = requests.filter(
    (r) => r.bloodGroup === user.bloodGroup && (r.status === 'finding_donors' || r.status === 'donor_responded')
  );

  // Requests this donor responded to
  const myResponses = responses.filter((resp) => resp.donorId === user.id);
  const myRespondedRequests = requests.filter((r) => myResponses.some((resp) => resp.requestId === r.id));

  const locationStr = getLocationName(user.divisionId, user.districtId, user.upazilaId, language);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner Profile Summary */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-900/15 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white text-red-600 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shrink-0">
              {user.bloodGroup}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black">{user.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/30 text-white border border-red-400/30 text-xs font-bold">
                  {language === 'bn' ? 'স্বেচ্ছাসেবী রক্তদাতা' : 'Voluntary Donor'}
                </span>
              </div>
              <p className="text-red-100 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-200" />
                <span>{locationStr}</span>
              </p>
              <p className="text-red-200 text-xs mt-1">
                {language === 'bn' ? 'নিবন্ধিত ফোন:' : 'Registered Phone:'} {user.phone}
              </p>
            </div>
          </div>

          {/* Quick Availability Switch */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col gap-2">
            <span className="text-xs font-bold text-red-100 uppercase tracking-wider">
              {language === 'bn' ? 'বর্তমান রক্তদান প্রাপ্যতা:' : 'Availability Status:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAvailabilityToggle('available')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  donorProfile?.availability === 'available'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {language === 'bn' ? '✅ প্রস্তুত' : 'Available'}
              </button>
              <button
                onClick={() => handleAvailabilityToggle('unavailable')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  donorProfile?.availability === 'unavailable'
                    ? 'bg-red-950 text-white shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {language === 'bn' ? '❌ অক্ষম' : 'Unavailable'}
              </button>
              <button
                onClick={() => handleAvailabilityToggle('temporarily_unavailable')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  donorProfile?.availability === 'temporarily_unavailable'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {language === 'bn' ? '⏳ সাময়িক' : 'Temporary'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {toggleNotice && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{toggleNotice}</span>
        </div>
      )}

      {/* Medical disclaimer note */}
      <div className="mb-8 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-950 block mb-0.5">
            {language === 'bn' ? 'মেডিকেল স্ক্রিনিং ও স্বাস্থ্যগত যোগ্যতা:' : 'Medical Eligibility Disclaimer:'}
          </strong>
          <span className="leading-relaxed">
            {language === 'bn'
              ? 'শুধুমাত্র প্রাপ্যতা স্ট্যাটাস "প্রস্তুত" থাকা মানেই আপনি স্বয়ংক্রিয়ভাবে রক্তদানের যোগ্য নন। প্রতিবার রক্তদানের পূর্বে হিমোগ্লোবিন পরীক্ষা (কমপক্ষে ১২.৫ গ্রাম/ডেসিলিটার), ওজন (কমপক্ষে ৪৫ কেজি) এবং সরকারি অনুমোদিত স্ক্রিনিং ও ক্রস-ম্যাচিং বাধ্যতামূলক।'
              : 'Being marked available does not automatically guarantee eligibility. Laboratory hemoglobin checks, weight evaluation, and mandatory infectious disease screenings are strictly required prior to every donation.'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
        <button
          onClick={() => setActiveSubTab('incoming')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'incoming'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>
            {language === 'bn' ? 'আমার রক্তের গ্রুপের জরুরী আবেদন' : 'Matching Requests'} ({matchingRequests.length})
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>
            {language === 'bn' ? 'আমার সাড়া দেওয়া আবেদন' : 'My Responses'} ({myRespondedRequests.length})
          </span>
        </button>

        <button
          onClick={() => setShowProfileModal(true)}
          className="ml-auto px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-gray-500" />
          <span>{language === 'bn' ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'incoming' && (
        <div>
          {matchingRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200/80 p-6">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">
                {language === 'bn'
                  ? 'এই মুহূর্তে আপনার গ্রুপের কোনো সক্রিয় রক্তের আবেদন নেই'
                  : 'No active emergency requests for your blood group right now.'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                {language === 'bn'
                  ? 'আপনার এলাকায় নতুন রক্তের আবেদন এলে আমরা আপনাকে তাৎক্ষণিক নোটিফিকেশন পাঠাব।'
                  : 'We will notify you immediately when an urgent match arises in your district.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingRequests.map((req) => (
                <RequestCard key={req.id} request={req} onOpenDetails={onOpenRequestDetails} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'history' && (
        <div>
          {myRespondedRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200/80 p-6">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">
                {language === 'bn'
                  ? 'আপনি এখনও কোনো আবেদনে সাড়া দেননি'
                  : 'You have not responded to any requests yet.'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'bn'
                  ? 'জরুরী রক্তের আবেদনে রক্তদানে আগ্রহ প্রকাশ করলে তা এখানে দেখা যাবে।'
                  : 'Requests you express interest in will be recorded here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRespondedRequests.map((req) => (
                <RequestCard key={req.id} request={req} onOpenDetails={onOpenRequestDetails} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
