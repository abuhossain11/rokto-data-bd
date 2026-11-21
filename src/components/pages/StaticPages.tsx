import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldAlert,
  ShieldCheck,
  Heart,
  Droplets,
  HelpCircle,
  FileText,
  Lock,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

export const MedicalDisclaimerPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
          {language === 'bn' ? 'মেডিকেল ডিসক্লেইমার ও আইনগত শর্তাবলী' : 'Medical Disclaimer & Legal Guidelines'}
        </h1>
        <p className="text-xs text-gray-500">
          {language === 'bn' ? 'সর্বশেষ হালনাগাদ: ২০২৬' : 'Last Updated: 2026'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950 font-bold">
          {language === 'bn'
            ? 'রক্তদাতা (ROKTO DATA) কোনো বাণিজ্যিক ব্লাড ব্যাংক নয়, রক্তের মজুদ রাখে না এবং রক্তের প্রাপ্যতা বা জৈবিক উপযুক্ততার নিশ্চয়তা প্রদান করে না।'
            : 'ROKTO DATA is not a blood bank, stores no blood units, and does not guarantee blood availability or medical compatibility.'}
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '১. প্ল্যাটফর্মের ভূমিকা ও পরিধি' : '1. Scope of the Platform'}
          </h3>
          <p>
            {language === 'bn'
              ? 'এই প্ল্যাটফর্মের একমাত্র উদ্দেশ্য হলো বাংলাদেশের স্বেচ্ছাসেবী রক্তদাতা এবং জরুরী রক্তের প্রয়োজনে থাকা রোগী বা তাদের স্বজনদের মধ্যে সরাসরি যোগাযোগের সুযোগ তৈরি করা। রক্তদাতা প্ল্যাটফর্ম কোনো পক্ষ থেকে কোনো প্রকার আর্থিক লেনদেন করে না এবং রক্তের বিনিময়ে অর্থ গ্রহণ বা প্রদান সম্পূর্ণ বেআইনি ও নিষিদ্ধ।'
              : 'The sole purpose of ROKTO DATA is to facilitate direct communication between voluntary donors and emergency seekers in Bangladesh. Financial compensation for blood is strictly prohibited.'}
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '২. বাধ্যতামূলক ল্যাবরেটরি স্ক্রিনিং ও ক্রস-ম্যাচিং' : '2. Mandatory Laboratory Screening'}
          </h3>
          <p>
            {language === 'bn'
              ? 'যেকোনো রক্ত সঞ্চালনের পূর্বে সরকারি অনুমোদিত হাসপাতালের প্যাথলজি ল্যাবরেটরিতে রেজিস্টার্ড চিকিৎসকের উপস্থিতিতে রক্তদাতার রক্তে এইচআইভি (HIV), হেপাটাইটিস বি (HBV), হেপাটাইটিস সি (HCV), সিফিলিস (VDRL) এবং ম্যালেরিয়া (Malaria) স্ক্রিনিং এবং ক্রস-ম্যাচিং সম্পন্ন করা আইনত ও চিকিৎসাগতভাবে বাধ্যতামূলক।'
              : 'TTI (Transfusion Transmissible Infections) screening for HIV, HBV, HCV, Syphilis, and Malaria alongside blood cross-matching is legally mandatory before every transfusion.'}
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '৩. রক্তদাতার শারীরিক যোগ্যতা' : '3. Donor Physical Eligibility'}
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
            <li>বয়স ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে।</li>
            <li>ওজন কমপক্ষে ৪৫ কেজি (পুরুষ ও মহিলা উভয়ের ক্ষেত্রে) হতে হবে।</li>
            <li>হিমোগ্লোবিনের মাত্রা নূন্যতম ১২.৫ গ্রাম/ডেসিলিটার হতে হবে।</li>
            <li>সর্বশেষ রক্তদানের পর কমপক্ষে ৩ থেকে ৪ মাস (১২০ দিন) অতিবাহিত হতে হবে।</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const SafetyGuidelinesPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
          {language === 'bn' ? 'রক্তদান ও গ্রহণের নিরাপত্তা নির্দেশিকা' : 'Safety & Transfusion Guidelines'}
        </h1>
        <p className="text-xs text-gray-500">
          {language === 'bn' ? 'নিরাপদ রক্তদানই জীবন বাঁচায়' : 'Safe blood saves lives'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? 'রক্তদাতার প্রস্তুতি' : 'Before Blood Donation'}
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
            <li>রক্তদানের পূর্ববর্তী রাতে কমপক্ষে ৭-৮ ঘণ্টা পর্যাপ্ত ঘুমান।</li>
            <li>রক্তদানের ২-৩ ঘণ্টা পূর্বে পুষ্টিকর খাবার গ্রহণ করুন। খালি পেটে রক্তদান করবেন না।</li>
            <li>রক্তদানের পূর্বে প্রচুর পরিমাণে বিশুদ্ধ পানি বা ফলের রস পান করুন।</li>
            <li>ধূমপান বা অ্যালকোহল সেবন থেকে বিরত থাকুন।</li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? 'রক্তদানের পর করণীয়' : 'After Blood Donation'}
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
            <li>রক্তদানের পর ১০-১৫ মিনিট বিশ্রাম নিন।</li>
            <li>পরবর্তী ২৪ ঘণ্টায় স্বাভাবিকের চেয়ে বেশি পানি পান করুন।</li>
            <li>যে হাত থেকে রক্ত নেওয়া হয়েছে, সেই হাতে অন্তত ৪-৫ ঘণ্টা ভারী কোনো কাজ করবেন না।</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const AboutUsPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
          <Heart className="w-8 h-8 fill-red-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
          {language === 'bn' ? 'আমাদের সম্পর্কে' : 'About ROKTO DATA'}
        </h1>
        <p className="text-xs text-gray-500">
          {language === 'bn' ? 'রক্তদাতা - একটি মানবিক উদ্যোগ' : 'A Nationwide Humanitarian Network'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <p>
          {language === 'bn'
            ? 'রক্তদাতা (ROKTO DATA) বাংলাদেশের প্রতিটি প্রান্তের সাধারণ মানুষ এবং রোগীদের রক্তের জরুরী প্রয়োজনে পাশে দাঁড়াতে নির্মিত একটি স্বেচ্ছাসেবী, সম্পূর্ণ অলাভজনক এবং আধুনিক রক্তদান প্ল্যাটফর্ম।'
            : 'ROKTO DATA is an open, verified, non-profit voluntary network connecting emergency blood seekers with ready blood donors across all divisions and districts in Bangladesh.'}
        </p>
        <p>
          {language === 'bn'
            ? 'আমাদের লক্ষ্য রক্তের অভাবে কোনো রোগীর জীবন যাতে সংকটাপন্ন না হয় এবং রক্তদাতা ও রক্তগ্রহীতার যোগাযোগে কোনো দালালি বা বাণিজ্যিক সিন্ডিকেট যাতে বাধা তৈরি করতে না পারে তা নিশ্চিত করা।'
            : 'Our mission is to eliminate blood shortages in emergencies while enforcing patient privacy and non-commercial ethical standards.'}
        </p>
      </div>
    </div>
  );
};

interface ContactUsPageProps {
  onOpenFeedback?: () => void;
}

export const ContactUsPage: React.FC<ContactUsPageProps> = ({ onOpenFeedback }) => {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
          <Phone className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
          {language === 'bn' ? 'যোগাযোগ ও সহায়তা কেন্দ্র' : 'Contact & Support Center'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          {language === 'bn'
            ? 'জরুরী সহায়তা, বাগ রিপোর্ট বা প্রাতিষ্ঠানিক অংশীদারিত্বের জন্য যোগাযোগ করুন'
            : 'Reach out for urgent help, beta bug reports, or verified hospital onboarding'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <Phone className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900 mb-1">
              {language === 'bn' ? 'জাতীয় জরুরী হটলাইন' : 'National Emergency'}
            </h4>
            <p className="font-mono text-xs font-bold text-red-700">999 / 16263</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {language === 'bn' ? '২৪ ঘণ্টা জরুরী স্বাস্থ্য ও অ্যাম্বুলেন্স' : '24/7 Emergency Health Line'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <Mail className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900 mb-1">
              {language === 'bn' ? 'সাপোর্ট ইমেইল' : 'Support Email'}
            </h4>
            <p className="font-mono text-xs font-bold">support@roktodata.org.bd</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {language === 'bn' ? 'অ্যাকাউন্ট, নিরাপত্তা ও ভেরিফিকেশন সহায়তা' : 'Account, Safety & Hospital Verification'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <MapPin className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900 mb-1">
              {language === 'bn' ? 'সমন্বয় কেন্দ্র' : 'Coordination Hub'}
            </h4>
            <p className="text-xs font-semibold">{language === 'bn' ? 'ঢাকা, বাংলাদেশ' : 'Dhaka, Bangladesh'}</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {language === 'bn' ? '৬৪ জেলায় স্বেচ্ছাসেবী নেটওয়ার্ক' : 'Serving 64 Districts'}
            </p>
          </div>
        </div>

        {onOpenFeedback && (
          <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-red-950 text-sm">
                {language === 'bn' ? 'বিটা টেস্টে কোনো সমস্যা দেখেছেন?' : 'Found a bug or have a suggestion?'}
              </h4>
              <p className="text-xs text-red-800 mt-0.5">
                {language === 'bn'
                  ? 'সরাসরি আমাদের বাগ রিপোর্ট ও ফিডব্যাক ফর্মের মাধ্যমে জানান।'
                  : 'Submit a bug report or feature idea directly via our Beta Feedback page.'}
              </p>
            </div>
            <button
              onClick={onOpenFeedback}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              {language === 'bn' ? 'ফিডব্যাক ফর্ম খুলুন' : 'Open Feedback Form'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
          {language === 'bn' ? 'গোপনীয়তা নীতিমালা (Privacy Policy)' : 'Privacy Policy'}
        </h1>
        <p className="text-xs text-gray-500">
          {language === 'bn' ? 'সর্বশেষ হালনাগাদ: ২০২৬ · পাবলিক বিটা সংস্করণ' : 'Last Updated: 2026 · Public Beta Edition'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold">
          {language === 'bn'
            ? 'রক্তদাতা (ROKTO DATA) রক্তদাতা ও রোগীদের ব্যক্তিগত তথ্যের সর্বোচ্চ গোপনীয়তা নিশ্চিত করতে বদ্ধপরিকর। আপনার ফোন নম্বর বা সঠিক অবস্থান কখনোই অনুমতি ছাড়া প্রকাশ করা হয় না।'
            : 'ROKTO DATA is built with strict privacy-by-design safeguards. Your personal phone number and exact home GPS coordinates are never publicly exposed.'}
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '১. আমরা কী কী তথ্য সংগ্রহ করি' : '1. Information We Collect'}
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
            <li>
              {language === 'bn'
                ? 'অ্যাকাউন্ট তথ্য: নাম, যাচাইকৃত মোবাইল নম্বর (+880), রক্তের গ্রুপ এবং বিভাগ/জেলা/উপজেলা নির্বাচন।'
                : 'Account details: Full name, verified Bangladesh phone number (+880), blood group, and administrative location (division/district/upazila).'}
            </li>
            <li>
              {language === 'bn'
                ? 'রক্তদান ও আবেদন সংক্রান্ত তথ্য: রক্তদানের প্রাপ্যতা, সর্বশেষ রক্তদানের তারিখ এবং জরুরী রক্তের আবেদনের তথ্য।'
                : 'Donation & Request metadata: Availability status, last donation date, and hospital details for posted blood requests.'}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '২. লোকেশন ও ফোন নম্বর সুরক্ষা' : '2. Location Fuzzing & Guarded Contact Protection'}
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
            <li>
              {language === 'bn'
                ? 'ম্যাপ ও সার্চে কেবল আনুমানিক অবস্থান (~৫০০ মিটার ফাজ করা) ব্যবহৃত হয়; সার্বক্ষণিক ব্যাকগ্রাউন্ড লোকেশন ট্র্যাকিং করা হয় না।'
                : 'Only approximate fuzzed coordinates (~500m radius) are used for matching; continuous background GPS tracking is never performed.'}
            </li>
            <li>
              {language === 'bn'
                ? 'রক্তদাতার ফোন নম্বর মাস্ক করা থাকে এবং শুধুমাত্র লগইনকৃত ব্যবহারকারীর সম্মতি-ভিত্তিক অনুরোধ ও অডিট লগের মাধ্যমে প্রদর্শিত হয়।'
                : 'Donor phone numbers remain masked publicly and are only revealed to authenticated seekers upon explicit consent recording and audit logging.'}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '৩. অফলাইন ক্যাশিং ও পুশ নোটিফিকেশন গোপনীয়তা' : '3. Offline Cache & Push Notification Privacy'}
          </h3>
          <p className="text-gray-600">
            {language === 'bn'
              ? 'আমাদের PWA সার্ভিস ওয়ার্কার শুধুমাত্র অ্যাপের সাধারণ ডিজাইন (App Shell) ক্যাশ করে। ব্যবহারকারীর লগইন টোকেন, ব্যক্তিগত প্রোফাইল, রক্তের আবেদন বা রক্তদাতার নম্বর কখনোই অফলাইন ক্যাশে জমা রাখা হয় না। পুশ নোটিফিকেশনে রোগীর নাম বা ব্যক্তিগত তথ্য পাঠানো হয় না।'
              : 'Our PWA Service Worker strictly caches only static UI shell assets. Auth tokens, private profiles, blood requests, and donor contacts use NetworkOnly rules and are never cached. Push payloads exclude patient private names.'}
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '৪. তথ্য সংশোধন ও অ্যাকাউন্ট মুছে ফেলা' : '4. Your Rights & Account Deletion'}
          </h3>
          <p className="text-gray-600">
            {language === 'bn'
              ? 'আপনি যেকোনো সময় আপনার প্রোফাইল থেকে রক্তদানের প্রাপ্যতা পরিবর্তন করতে অথবা আপনার সম্পূর্ণ অ্যাকাউন্ট ও ডিভাইস টোকেন মুছে ফেলতে পারেন।'
              : 'You can update your donor availability, revoke consents, or permanently delete your account and associated device tokens at any time from Profile Settings.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const TermsConditionsPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
          {language === 'bn' ? 'ব্যবহারের শর্তাবলী (Terms of Service)' : 'Terms & Conditions'}
        </h1>
        <p className="text-xs text-gray-500">
          {language === 'bn' ? 'সর্বশেষ হালনাগাদ: ২০২৬ · পাবলিক বিটা সংস্করণ' : 'Last Updated: 2026 · Public Beta Edition'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950 font-semibold flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>
            {language === 'bn'
              ? 'রক্তদাতা সম্পূর্ণ বিনামূল্যের স্বেচ্ছাসেবী প্ল্যাটফর্ম। রক্তের বিনিময়ে কোনো অর্থ দাবি, গ্রহণ বা মধ্যস্বত্বভোগিতা কঠোরভাবে নিষিদ্ধ।'
              : 'ROKTO DATA is strictly voluntary and non-commercial. Buying, selling, or brokering blood for financial gain is prohibited and illegal.'}
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '১. স্বেচ্ছাসেবী আচরণবিধি' : '1. Voluntary & Non-Commercial Use'}
          </h3>
          <p className="text-gray-600">
            {language === 'bn'
              ? 'সকল রক্তদাতা ও রক্তগ্রহীতা মানবিক উদ্দেশ্যে ও পারস্পরিক সম্মানের সাথে যোগাযোগ করবেন। অর্থ দাবি, ভুয়া আবেদন বা হয়রানির অভিযোগ প্রমাণিত হলে অ্যাকাউন্ট স্থায়ীভাবে স্থগিত করা হবে।'
              : 'All donors and seekers must communicate respectfully and strictly for humanitarian blood coordination. Accounts involved in extortion, fake requests, or harassment will be permanently suspended.'}
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '২. চিকিৎসা ও ল্যাবরেটরি দায়বদ্ধতা' : '2. Medical & Laboratory Responsibility'}
          </h3>
          <p className="text-gray-600">
            {language === 'bn'
              ? 'ROKTO DATA কোনো হাসপাতাল বা ব্লাড ব্যাংক নয়। রক্তদানের পূর্বে রক্তের গ্রুপ, হিমোগ্লোবিন, ক্রস-ম্যাচিং এবং TTI স্ক্রিনিং অনুমোদিত হাসপাতালে চিকিৎসকের তত্ত্বাবধানে সম্পন্ন করা গ্রহীতা ও হাসপাতালের দায়িত্ব।'
              : 'ROKTO DATA acts solely as a coordination directory and is not a medical provider. Verified laboratory cross-matching and infectious disease screening before transfusion remain mandatory.'}
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-950 mb-2">
            {language === 'bn' ? '৩. ফ্রি পাবলিক বিটা টেস্ট শর্ত' : '3. Free Public Beta Notice'}
          </h3>
          <p className="text-gray-600">
            {language === 'bn'
              ? 'প্ল্যাটফর্মটি বর্তমানে পাবলিক বিটা টেস্টিং পর্যায়ে রয়েছে। জরুরী অবস্থায় বিকল্প হিসেবে সরাসরি নিকটস্থ সরকারি হাসপাতাল বা জাতীয় জরুরী সেবা ৯৯৯-এ যোগাযোগ রাখার পরামর্শ দেওয়া হচ্ছে।'
              : 'The service is currently in Free Public Beta testing. In life-critical emergencies, always coordinate directly with nearby licensed hospital blood banks or call 999 alongside using this app.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const { language } = useLanguage();

  const faqs = [
    {
      q: 'রক্তদাতা ব্যবহারের জন্য কোনো ফি দিতে হয় কি?',
      a: 'না, রক্তদাতা সম্পূর্ণ বিনামূল্যে এবং অলাভজনক প্ল্যাটফর্ম। রক্তদানের জন্য কোনো প্রকার টাকা দাবি করা বা দেওয়া আইনত দণ্ডনীয় অপরাধ।',
    },
    {
      q: 'আমার মোবাইল নম্বর কি সবাই সরাসরি দেখতে পারবে?',
      a: 'না, রক্তদাতাদের গোপনীয়তা রক্ষায় সরাসরি নম্বর দেখানো হয় না। রক্তপ্রার্থী যখন সুনির্দিষ্ট অনুরোধ পাঠাবেন, কেবল তখনই যোগাযোগের নম্বর উন্মোচিত হয়।',
    },
    {
      q: 'রক্তদানের কতদিন পর আবার রক্ত দেওয়া যায়?',
      a: 'চিকিৎসকদের পরামর্শ অনুযায়ী একজন সুস্থ পুরুষ প্রতি ৩ মাস (৯০ দিন) পর পর এবং একজন সুস্থ মহিলা প্রতি ৪ মাস (১২০ দিন) পর পর নিরাপদে রক্তদান করতে পারেন।',
    },
    {
      q: 'হাসপাতালের ভেরিফিকেশন কীভাবে হয়?',
      a: 'হাসপাতাল কর্তৃপক্ষ স্বাস্থ্য অধিদপ্তরের (DGHS) লাইসেন্স নম্বর ও নিবন্ধন কাগজপত্র জমা দেওয়ার পর আমাদের কেন্দ্রীয় অ্যাডমিন প্যানেল থেকে তা যাচাই করে অনুমোদন দেওয়া হয়।',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
          {language === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
        </h1>
      </div>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">{f.q}</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
