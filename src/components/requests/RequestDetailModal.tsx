import React, { useState } from 'react';
import { BloodRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { getLocationName } from '../../data/bangladeshLocations';
import { getExternalRouteUrl } from '../../services/locationService';
import { isBloodRequestExpired } from '../../services/validationService';
import {
  X,
  Hospital,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Share2,
  Flag,
  CheckCircle,
  ExternalLink,
  Ban,
  CheckCircle2,
  Users,
  AlertCircle,
} from 'lucide-react';

interface RequestDetailModalProps {
  request: BloodRequest | null;
  onClose: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose }) => {
  const { user, isAuthenticated, setShowLoginModal, isSuperAdmin, isDistrictAdmin, isModerator } = useAuth();
  const {
    respondToRequest,
    responses,
    cancelBloodRequest,
    completeBloodRequest,
    reportAbuse,
  } = useData();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [responseSuccessMsg, setResponseSuccessMsg] = useState('');
  const [responseErrorMsg, setResponseErrorMsg] = useState('');

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('অন্য উৎস থেকে রক্ত পাওয়া গেছে');
  const [isCancelling, setIsCancelling] = useState(false);

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedDonorId, setSelectedDonorId] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Abuse report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('ভুয়া আবেদন বা অতিরিক্ত অর্থের দাবি');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if (!request) return null;

  const isExpired = isBloodRequestExpired(request.requiredDateTime, request.status) || request.status === 'expired';
  const locationStr = getLocationName(request.divisionId, request.districtId, request.upazilaId, language);
  const routeUrl = getExternalRouteUrl(request.lat, request.lng);

  // Check if current user has already responded
  const hasResponded = user
    ? responses.some((resp) => resp.requestId === request.id && resp.donorId === user.id)
    : false;

  // Request responses list for this request
  const requestResponses = responses.filter((r) => r.requestId === request.id);

  const isOwner = user?.id === request.requesterId;
  const canManage = isOwner || isSuperAdmin || isDistrictAdmin || isModerator;

  // Donor response action: Marks 'donor_responded', NEVER 'completed'
  const handleDonateClick = async () => {
    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    setResponseSuccessMsg('');
    setResponseErrorMsg('');

    const res = await respondToRequest(
      request.id,
      user.id,
      user.fullName,
      user.phone,
      user.bloodGroup,
      'interested',
      'আমি এই সময়ে রক্তদানে প্রস্তুত আছি।'
    );

    if (res.success) {
      setResponseSuccessMsg(res.message);
      showToast({
        type: 'success',
        title: language === 'bn' ? 'সাড়া নথিভুক্ত হয়েছে!' : 'Response Recorded!',
        message: res.message,
      });
    } else {
      setResponseErrorMsg(res.message);
      showToast({
        type: 'warning',
        title: language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notice',
        message: res.message,
      });
    }
  };

  // Dedicated cancellation with reason
  const handleConfirmCancel = async () => {
    if (!user) return;
    setIsCancelling(true);
    try {
      const res = await cancelBloodRequest(request.id, user.id, cancelReason, user.roles);
      if (res.success) {
        showToast({
          type: 'info',
          title: language === 'bn' ? 'আবেদন বাতিল করা হয়েছে' : 'Request Cancelled',
          message: res.message,
        });
        setShowCancelModal(false);
      } else {
        showToast({
          type: 'error',
          title: language === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed',
          message: res.message,
        });
      }
    } finally {
      setIsCancelling(false);
    }
  };

  // Explicit completion confirmation - NEVER automatic on donor interest!
  const handleConfirmComplete = async () => {
    if (!user) return;
    setIsCompleting(true);
    try {
      const res = await completeBloodRequest(
        request.id,
        user.id,
        selectedDonorId || undefined,
        user.roles
      );
      if (res.success) {
        showToast({
          type: 'success',
          title: language === 'bn' ? 'রক্তদান সম্পন্ন নিশ্চিত করা হয়েছে!' : 'Donation Verified Complete!',
          message: res.message,
        });
        setShowCompleteModal(false);
      } else {
        showToast({
          type: 'error',
          title: language === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed',
          message: res.message,
        });
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await reportAbuse({
      reporterId: user.id,
      targetType: 'request',
      targetId: request.id,
      reason: reportReason,
      details: reportDetails,
    });
    setReportSubmitted(true);
    showToast({
      type: 'info',
      title: language === 'bn' ? 'রিপোর্ট জমা হয়েছে' : 'Report Submitted',
      message: language === 'bn' ? 'আমাদের মডারেশন টিম এটি পর্যালোচনা করবে।' : 'Our moderation team will review this.',
    });
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative border border-gray-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
              {request.bloodGroup}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-gray-950">
                  {request.unitsRequired} {language === 'bn' ? 'ব্যাগ রক্ত প্রয়োজন' : 'Units Needed'}
                </h3>
                {isExpired ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                    {language === 'bn' ? 'মেয়াদোত্তীর্ণ (Expired)' : 'Expired'}
                  </span>
                ) : (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    request.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : request.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : request.status === 'donor_responded'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {request.status === 'donor_responded'
                      ? (language === 'bn' ? 'রক্তদাতা সাড়া দিয়েছেন' : 'Donor Responded')
                      : request.status === 'completed'
                      ? (language === 'bn' ? 'রক্তদান সম্পন্ন' : 'Completed')
                      : request.status === 'cancelled'
                      ? (language === 'bn' ? 'বাতিলকৃত' : 'Cancelled')
                      : (language === 'bn' ? 'রক্তদাতা খোঁজা হচ্ছে' : 'Finding Donors')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {language === 'bn' ? 'আবেদনকারী:' : 'Requester:'} {request.requesterName}
              </p>
            </div>
          </div>

          <div>
            {request.isHospitalVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'হাসপাতাল যাচাইকৃত' : 'Hospital Verified'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{language === 'bn' ? 'যাচাই প্রক্রিয়াধীন' : 'Pending Verification'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Alerts & Responses */}
        {responseSuccessMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{responseSuccessMsg}</span>
          </div>
        )}

        {responseErrorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{responseErrorMsg}</span>
          </div>
        )}

        {/* Request Information Table */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80 space-y-3.5 mb-6 text-xs sm:text-sm">
          <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-2.5">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Hospital className="w-4 h-4 text-red-500" />
              <span>{language === 'bn' ? 'হাসপাতাল:' : 'Hospital:'}</span>
            </span>
            <span className="font-bold text-gray-900 text-right">
              {request.hospitalName}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-2.5">
            <span className="text-gray-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>{language === 'bn' ? 'এলাকা ও ওয়ার্ড:' : 'Address:'}</span>
            </span>
            <span className="font-medium text-gray-800 text-right">
              {request.hospitalAddress}, {locationStr}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-2.5">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-500" />
              <span>{language === 'bn' ? 'রক্তদানের সম্ভাব্য সময়:' : 'Required By:'}</span>
            </span>
            <span className="font-bold text-red-600 text-right font-mono">
              {new Date(request.requiredDateTime).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>

          {request.patientName && (
            <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-2.5">
              <span className="text-gray-500">
                {language === 'bn' ? 'রোগীর নাম:' : 'Patient Name:'}
              </span>
              <span className="font-medium text-gray-800">
                {request.patientName}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-red-500" />
              <span>{language === 'bn' ? 'জরুরী যোগাযোগ:' : 'Emergency Contact:'}</span>
            </span>
            <span className="font-mono font-bold text-gray-900">
              {isAuthenticated ? request.requesterPhone : '+880 1••••••••• (লগইন প্রয়োজন)'}
            </span>
          </div>
        </div>

        {/* Responding Donors Stream (Visible to requester or participants) */}
        {requestResponses.length > 0 && (
          <div className="mb-6 bg-blue-50/70 p-4 rounded-2xl border border-blue-200 text-xs">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>
                {language === 'bn'
                  ? `সাড়াপ্রাপ্ত রক্তদাতা (${requestResponses.length} জন):`
                  : `Voluntary Donors Responded (${requestResponses.length}):`}
              </span>
            </h4>
            <div className="space-y-2">
              {requestResponses.map((resp) => (
                <div key={resp.id} className="bg-white p-2.5 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900">{resp.donorName}</span>
                    <span className="ml-2 font-mono text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                      {resp.donorBloodGroup}
                    </span>
                    {resp.note && <p className="text-[11px] text-gray-500 mt-0.5">"{resp.note}"</p>}
                  </div>
                  {isAuthenticated && (
                    <a
                      href={`tel:${resp.donorPhone}`}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{language === 'bn' ? 'কল' : 'Call'}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Primary I CAN DONATE button */}
            <button
              onClick={handleDonateClick}
              disabled={hasResponded || request.status === 'completed' || request.status === 'cancelled' || isExpired}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>
                {hasResponded
                  ? t.request.alreadyResponded
                  : request.status === 'completed'
                  ? (language === 'bn' ? 'রক্তদান সম্পন্ন হয়েছে' : 'Donation Completed')
                  : request.status === 'cancelled'
                  ? (language === 'bn' ? 'আবেদনটি বাতিল' : 'Request Cancelled')
                  : isExpired
                  ? (language === 'bn' ? 'আবেদনের মেয়াদ শেষ' : 'Request Expired')
                  : t.request.iCanDonate}
              </span>
            </button>

            {/* Direct Call / Contact button */}
            {isAuthenticated ? (
              <a
                href={`tel:${request.requesterPhone}`}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-red-600" />
                <span>{language === 'bn' ? 'সরাসরি কল করুন' : 'Call Requester'}</span>
              </a>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-red-600" />
                <span>{language === 'bn' ? 'কল করতে লগইন করুন' : 'Login to Call'}</span>
              </button>
            )}

            {/* Open map navigation */}
            <a
              href={routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
              title="Open Hospital Location in Maps"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{language === 'bn' ? 'ম্যাপ' : 'Map'}</span>
            </a>
          </div>

          {/* Owner / Admin Management Bar */}
          {canManage && request.status !== 'completed' && request.status !== 'cancelled' && (
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-gray-500 font-semibold">
                {language === 'bn' ? 'আবেদন পরিচালনা (শুধুমাত্র আপনি):' : 'Request Management:'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  {language === 'bn' ? 'রক্তদান সম্পন্ন নিশ্চিত করুন' : 'Confirm Completed'}
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
                >
                  {language === 'bn' ? 'আবেদন বাতিল' : 'Cancel Request'}
                </button>
              </div>
            </div>
          )}

          {/* Abuse reporting */}
          <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
            <span className="font-mono text-[11px]">
              {language === 'bn' ? 'আইডি:' : 'ID:'} {request.id}
            </span>
            <button
              onClick={() => setShowReportModal(true)}
              className="text-gray-400 hover:text-red-600 flex items-center gap-1 cursor-pointer transition"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সন্দেহজনক আবেদন রিপোর্ট করুন' : 'Report Request'}</span>
            </button>
          </div>
        </div>

        {/* CANCEL REQUEST MODAL */}
        {showCancelModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl relative space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <Ban className="w-5 h-5" />
                <h4>{language === 'bn' ? 'আবেদন বাতিলের কারণ' : 'Cancel Request Reason'}</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'bn'
                  ? 'আবেদন বাতিল করলে সাড়াদানকারী রক্তদাতাদের স্বয়ংক্রিয়ভাবে নোটিফিকেশন পৌঁছে যাবে।'
                  : 'Cancelling this request will automatically alert any responding donors.'}
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'bn' ? 'কারণ নির্বাচন করুন:' : 'Select Reason:'}
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs bg-white"
                >
                  <option value="অন্য উৎস থেকে রক্ত পাওয়া গেছে">অন্য উৎস থেকে রক্ত পাওয়া গেছে (Blood received elsewhere)</option>
                  <option value="রোগী সুস্থ হয়েছেন / রক্ত প্রয়োজন নেই">রোগী সুস্থ হয়েছেন / রক্ত প্রয়োজন নেই (Patient recovered)</option>
                  <option value="অস্ত্রোপচারের তারিখ পরিবর্তন হয়েছে">অস্ত্রোপচারের তারিখ পরিবর্তন হয়েছে (Surgery rescheduled)</option>
                  <option value="ভুল তথ্যের কারণে বাতিল">ভুল তথ্যের কারণে বাতিল (Accidental/Mistaken request)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                  className="px-3 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {language === 'bn' ? 'ফিরে যান' : 'Back'}
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isCancelling ? 'বাতিল হচ্ছে...' : (language === 'bn' ? 'বাতিল নিশ্চিত করুন' : 'Confirm Cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM COMPLETION MODAL */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl relative space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                <CheckCircle2 className="w-5 h-5" />
                <h4>{language === 'bn' ? 'রক্তদান সম্পন্ন নিশ্চিতকরণ' : 'Confirm Blood Donation Completed'}</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'bn'
                  ? 'নিশ্চিত করুন যে রক্তদাতার কাছ থেকে হাসপাতালে সফলভাবে রক্ত গ্রহণ করা হয়েছে। এটি রক্তদাতার প্রোফাইলে একটি সফল রক্তদান রেকর্ড করবে।'
                  : 'Confirm that blood was actually donated and received at the hospital. This records an official donation event.'}
              </p>

              {requestResponses.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'bn' ? 'কোন রক্তদাতা রক্ত দিয়েছেন? (ঐচ্ছিক)' : 'Which donor donated? (Optional)'}
                  </label>
                  <select
                    value={selectedDonorId}
                    onChange={(e) => setSelectedDonorId(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white"
                  >
                    <option value="">{language === 'bn' ? '-- রক্তদাতা নির্বাচন করুন --' : '-- Select Donor --'}</option>
                    {requestResponses.map((r) => (
                      <option key={r.id} value={r.donorId}>
                        {r.donorName} ({r.donorBloodGroup})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  disabled={isCompleting}
                  className="px-3 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {language === 'bn' ? 'ফিরে যান' : 'Back'}
                </button>
                <button
                  onClick={handleConfirmComplete}
                  disabled={isCompleting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isCompleting ? 'নথিভুক্ত হচ্ছে...' : (language === 'bn' ? 'সম্পন্ন নিশ্চিত করুন' : 'Confirm Complete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Abuse Modal Overlay */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl relative">
              <h4 className="font-bold text-gray-900 text-base mb-3">
                {language === 'bn' ? 'সন্দেহজনক আবেদন রিপোর্ট করুন' : 'Report Suspicious Request'}
              </h4>
              {reportSubmitted ? (
                <p className="text-xs text-emerald-600 font-semibold">
                  {language === 'bn' ? 'আপনার রিপোর্ট প্রশাসকের কাছে পাঠানো হয়েছে।' : 'Report submitted for moderation.'}
                </p>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      {language === 'bn' ? 'রিপোর্টের কারণ' : 'Reason'}
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white"
                    >
                      <option value="ভুয়া আবেদন">ভুয়া আবেদন (Fake request)</option>
                      <option value="রক্তের বিনিময়ে অর্থের দাবি">রক্তের বিনিময়ে অর্থের দাবি (Commercial demands)</option>
                      <option value="ভুল ফোন নম্বর">ভুল ফোন নম্বর (Invalid phone)</option>
                      <option value="অন্যান্য কারণ">অন্যান্য কারণ (Other)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      {language === 'bn' ? 'বিস্তারিত বিবরণ' : 'Details'}
                    </label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="বিস্তারিত লিখুন..."
                      className="w-full p-2.5 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-3 py-1.5 border rounded-lg cursor-pointer"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-lg cursor-pointer"
                    >
                      {language === 'bn' ? 'রিপোর্ট পাঠান' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
