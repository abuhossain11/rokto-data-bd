import React, { useState } from 'react';
import { DonorProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { getLocationName } from '../../data/bangladeshLocations';
import { maskPhoneNumber } from '../../services/locationService';
import {
  X,
  MapPin,
  Calendar,
  Heart,
  Phone,
  Lock,
  Unlock,
  ShieldAlert,
  AlertCircle,
  Flag,
  CheckCircle,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

interface DonorDetailModalProps {
  donor: DonorProfile | null;
  distanceKm?: number;
  onClose: () => void;
}

export const DonorDetailModal: React.FC<DonorDetailModalProps> = ({ donor, distanceKm, onClose }) => {
  const { user, isAuthenticated, setShowLoginModal } = useAuth();
  const { reportAbuse, requestDonorContact } = useData();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [contactRequested, setContactRequested] = useState(false);
  const [unmaskedPhone, setUnmaskedPhone] = useState<string | null>(null);
  const [requestingContact, setRequestingContact] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('অনুপযুক্ত আচরণ বা অর্থ দাবি');
  const [reportDone, setReportDone] = useState(false);

  if (!donor) return null;

  const locationStr = getLocationName(donor.divisionId, donor.districtId, donor.upazilaId, language);

  const handleRequestContact = async () => {
    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    setRequestingContact(true);
    try {
      const res = await requestDonorContact(donor.id, user.id);
      if (res.success && res.phone) {
        setUnmaskedPhone(res.phone);
        setContactRequested(true);
        showToast({
          type: 'success',
          title: language === 'bn' ? 'যোগাযোগের তথ্য অনুমোদিত' : 'Contact Access Authorized',
          message: language === 'bn'
            ? 'রক্তদাতার যোগাযোগের নম্বর উন্মুক্ত করা হয়েছে। এটি অডিট লগে রেকর্ড হয়েছে।'
            : 'Donor phone number revealed. Logged in audit trail.',
        });
      } else {
        showToast({
          type: 'error',
          title: language === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed',
          message: res.message,
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        message: 'যোগাযোগের তথ্য লোড করা যায়নি।',
      });
    } finally {
      setRequestingContact(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await reportAbuse({
      reporterId: user.id,
      targetType: 'user',
      targetId: donor.userId,
      reason: reportReason,
      details: 'Reported through donor profile modal',
    });
    setReportDone(true);
    showToast({
      type: 'info',
      title: language === 'bn' ? 'রিপোর্ট জমা হয়েছে' : 'Report Received',
      message: language === 'bn' ? 'প্রোফাইলটি পর্যালোচনার জন্য পাঠানো হয়েছে।' : 'Profile queued for moderation review.',
    });
    setTimeout(() => {
      setShowReport(false);
      setReportDone(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative border border-gray-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-red-600 to-red-500 text-white font-black text-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-600/30 mb-3">
            {donor.bloodGroup}
          </div>
          <h3 className="text-xl font-black text-gray-950">
            {language === 'bn' ? 'স্বেচ্ছাসেবী রক্তদাতা' : 'Voluntary Blood Donor'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>{locationStr}</span>
            {distanceKm !== undefined && (
              <span className="font-semibold text-red-600 font-mono">
                (~{distanceKm} km)
              </span>
            )}
          </p>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
            <span className="text-[11px] font-semibold text-gray-500 block uppercase">
              {language === 'bn' ? 'মোট রক্তদান' : 'Total Donations'}
            </span>
            <span className="text-xl font-black text-red-600 font-mono">
              {donor.totalDonations} {language === 'bn' ? 'বার' : 'times'}
            </span>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
            <span className="text-[11px] font-semibold text-gray-500 block uppercase">
              {language === 'bn' ? 'বর্তমান প্রাপ্যতা' : 'Status'}
            </span>
            <span className={`text-xs font-bold ${
              donor.availability === 'available'
                ? 'text-emerald-700'
                : donor.availability === 'temporarily_unavailable'
                ? 'text-amber-700'
                : 'text-red-700'
            }`}>
              {donor.availability === 'available'
                ? (language === 'bn' ? '✅ রক্তদানে প্রস্তুত' : 'Available')
                : donor.availability === 'temporarily_unavailable'
                ? (language === 'bn' ? '⚠️ সাময়িক অনুপলব্ধ' : 'Temporarily Unavailable')
                : (language === 'bn' ? '❌ অনুপলব্ধ' : 'Unavailable')}
            </span>
          </div>
        </div>

        {/* Donor Verification & Last Donation info */}
        <div className="space-y-2 mb-6 text-xs text-gray-600 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{language === 'bn' ? 'সর্বশেষ রক্তদান:' : 'Last Donation:'}</span>
            <span className="font-semibold text-gray-800">
              {donor.lastDonationDate || (language === 'bn' ? 'রেকর্ড নেই' : 'No prior record')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">{language === 'bn' ? 'মেডিকেল সম্মতি:' : 'Medical Declaration:'}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'স্বাক্ষরিত' : 'Acknowledged'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">{language === 'bn' ? 'লোকেশন শেয়ারিং:' : 'Location Type:'}</span>
            <span className="text-gray-700 font-medium">
              {language === 'bn' ? 'আনুমানিক (সুরক্ষিত)' : 'Approximate (~500m fuzzed)'}
            </span>
          </div>
        </div>

        {/* Privacy protected contact section */}
        <div className="bg-red-50/60 p-4 rounded-2xl border border-red-100 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-red-600" />
            <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider">
              {language === 'bn' ? 'যোগাযোগ নিরাপত্তা ও স্প্যাম সুরক্ষা' : 'Guarded Contact Information'}
            </h4>
          </div>

          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            {language === 'bn'
              ? 'স্প্যাম প্রতিরোধে এবং রক্তদাতার ব্যক্তিগত গোপনীয়তা রক্ষার্থে ফোন নম্বর জনসম্মুখে উন্মুক্ত নয়। জরুরী প্রয়োজনে সম্মতি নিয়ে যোগাযোগ করুন।'
              : 'Donor contact numbers are guarded to protect voluntary donors from spam and unauthorized solicitation.'}
          </p>

          {contactRequested && unmaskedPhone ? (
            <div className="bg-white p-3.5 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-500 block">
                    {language === 'bn' ? 'অনুমোদিত যোগাযোগের নম্বর:' : 'Authorized Contact:'}
                  </span>
                  <span className="text-base font-mono font-black text-gray-900">
                    {unmaskedPhone}
                  </span>
                </div>
                <a
                  href={`tel:${unmaskedPhone}`}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-red-700 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center font-mono text-gray-400 text-xs tracking-wider">
                +880 1XXX-***XXX ({language === 'bn' ? 'সুরক্ষিত' : 'Protected'})
              </div>
              <button
                onClick={handleRequestContact}
                disabled={requestingContact}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>
                  {requestingContact
                    ? (language === 'bn' ? 'অনুমতি যাচাই হচ্ছে...' : 'Verifying Consent...')
                    : (language === 'bn' ? 'জরুরী প্রয়োজনে ফোন নম্বরের অনুমতি চান' : 'Request Contact Consent')}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Medical disclaimer reminder */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {language === 'bn'
              ? 'সতর্কতা: রক্তের বিনিময়ে কোনো আর্থিক লেনদেন করবেন না। রক্তদানের পূর্বে রক্তদাতার হিমোগ্লোবিন, রক্তচাপ ও স্ক্রিনিং টেস্ট হাসপাতালে সম্পন্ন করা বাধ্যতামূলক।'
              : 'Notice: Never pay money for voluntary blood donation. Professional screening and cross-matching at the hospital are strictly mandatory.'}
          </span>
        </div>

        {/* Report link */}
        <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-100">
          <span className="font-mono text-[11px]">{language === 'bn' ? 'আইডি:' : 'ID:'} {donor.id}</span>
          <button
            onClick={() => setShowReport(!showReport)}
            className="hover:text-red-600 flex items-center gap-1 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'রিপোর্ট করুন' : 'Report'}</span>
          </button>
        </div>

        {/* Report box */}
        {showReport && (
          <form onSubmit={handleReport} className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
            {reportDone ? (
              <p className="text-emerald-600 font-semibold">{language === 'bn' ? 'রিপোর্ট গৃহীত হয়েছে।' : 'Report received.'}</p>
            ) : (
              <>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="অর্থের দাবি">অর্থের দাবি (Demanding money for blood)</option>
                  <option value="ভুল তথ্য বা জাল প্রোফাইল">ভুল তথ্য বা জাল প্রোফাইল (Fake profile / wrong group)</option>
                  <option value="অনুপযুক্ত আচরণ বা হয়রানি">অনুপযুক্ত আচরণ বা হয়রানি (Harassment / inappropriate behavior)</option>
                </select>
                <button type="submit" className="w-full py-1.5 bg-red-600 text-white font-bold rounded-lg cursor-pointer">
                  {language === 'bn' ? 'রিপোর্ট জমা দিন' : 'Submit Report'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
