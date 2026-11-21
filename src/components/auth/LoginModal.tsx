import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { X, Phone, ShieldCheck, ArrowRight, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { normalizeBangladeshPhone } from '../../services/validationService';

export const LoginModal: React.FC = () => {
  const {
    showLoginModal,
    setShowLoginModal,
    loginWithPhone,
    verifyOtp,
    loginWithGoogle,
    switchDemoRole,
    supabaseStatus,
  } = useAuth();
  const { language } = useLanguage();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!showLoginModal) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const validation = normalizeBangladeshPhone(phoneNumber);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'সঠিক ফোন নম্বর লিখুন');
      return;
    }

    setLoading(true);
    const res = await loginWithPhone(phoneNumber);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setResendCooldown(30);
    } else {
      setErrorMsg(res.error || 'ওটিপি পাঠাতে সমস্যা হয়েছে');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg(language === 'bn' ? '৬ সংখ্যার ওটিপি কোড লিখুন' : 'Enter 6-digit OTP');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(phoneNumber, otpCode);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'ভুল ওটিপি কোড');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative border border-gray-100">
        <button
          onClick={() => {
            setShowLoginModal(false);
            setStep('phone');
            setErrorMsg('');
          }}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-gray-950">
            {language === 'bn' ? 'রক্তদাতা নেটওয়ার্কে লগইন' : 'Sign in to ROKTO DATA'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'bn'
              ? 'মোবাইল ওটিপি অথবা গুগল দিয়ে সুরক্ষিতভাবে প্রবেশ করুন'
              : 'Secure access via Mobile OTP or Google'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {language === 'bn' ? 'বাংলাদেশী মোবাইল নম্বর' : 'Bangladesh Mobile Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 text-sm font-semibold">
                  +880
                </div>
                <input
                  type="tel"
                  placeholder="1712345678"
                  value={phoneNumber.replace(/^\+880/, '')}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-16 pr-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-base font-medium outline-hidden transition"
                  autoFocus
                  required
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {language === 'bn'
                  ? 'যেমন: 01712345678 (গ্রামীণফোন, রবি, বাংলালিংক, টেলিটক ইত্যাদি)'
                  : 'E.g., 01712345678'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>{language === 'bn' ? 'কোড পাঠানো হচ্ছে...' : 'Sending OTP...'}</span>
              ) : (
                <>
                  <span>{language === 'bn' ? 'ওটিপি কোড পাঠান' : 'Send OTP Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-semibold">
                  {language === 'bn' ? 'অথবা' : 'or'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{language === 'bn' ? 'গুগল দিয়ে প্রবেশ করুন' : 'Continue with Google'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-800">
              <span className="font-bold">
                {language === 'bn' ? 'পরীক্ষামূলক কোড:' : 'Dev OTP:'}
              </span>{' '}
              <span className="font-mono font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">
                123456
              </span>
              <p className="mt-1 text-[11px] text-amber-700">
                {language === 'bn'
                  ? 'রিয়েল-টাইম SMS কনফিগারেশন না থাকলেও এই কোড দিয়ে যাচাই করা যাবে।'
                  : 'You can test the flow using this verification code.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {language === 'bn' ? '৬ সংখ্যার ওটিপি কোড' : '6-digit OTP Code'}
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-hidden transition"
                autoFocus
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-gray-500 hover:text-gray-800 font-medium underline cursor-pointer"
              >
                {language === 'bn' ? 'নম্বর পরিবর্তন' : 'Change Phone'}
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleSendOtp}
                className="text-red-600 hover:text-red-700 font-semibold disabled:text-gray-400 cursor-pointer"
              >
                {resendCooldown > 0
                  ? (language === 'bn' ? `পুনরায় পাঠান (${resendCooldown}s)` : `Resend (${resendCooldown}s)`)
                  : (language === 'bn' ? 'পুনরায় ওটিপি পাঠান' : 'Resend OTP')}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-red-600/25 transition cursor-pointer disabled:opacity-50"
            >
              {loading
                ? (language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...')
                : (language === 'bn' ? 'কোড যাচাই করুন' : 'Verify & Sign In')}
            </button>
          </form>
        )}

        {/* Role Quick Switcher strictly for local sandbox when Supabase is not configured */}
        {!supabaseStatus.isConfigured && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center mb-2">
              {language === 'bn' ? 'স্যান্ডবক্স টেস্টিং রোল (সুপাবেস সংযুক্ত নয়):' : 'Sandbox QA Role Switcher (No Supabase Connected):'}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('super_admin');
                  setShowLoginModal(false);
                }}
                className="px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold hover:bg-purple-100 cursor-pointer"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('district_admin');
                  setShowLoginModal(false);
                }}
                className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold hover:bg-blue-100 cursor-pointer"
              >
                District Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('donor');
                  setShowLoginModal(false);
                }}
                className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold hover:bg-red-100 cursor-pointer"
              >
                Donor
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('hospital');
                  setShowLoginModal(false);
                }}
                className="px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-semibold hover:bg-teal-100 cursor-pointer"
              >
                Hospital
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
