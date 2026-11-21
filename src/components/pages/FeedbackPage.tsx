import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useOnlineStatus } from '../common/OfflineIndicator';
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  MapPin,
  ShieldAlert,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  WifiOff,
} from 'lucide-react';

interface FeedbackTicket {
  ticketId: string;
  category: 'bug' | 'suggestion' | 'location_data' | 'security' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  subject: string;
  description: string;
  contactInfo?: string;
  submittedAt: string;
  synced: boolean;
}

export const FeedbackPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isOnline = useOnlineStatus();

  const [category, setCategory] = useState<FeedbackTicket['category']>('bug');
  const [severity, setSeverity] = useState<FeedbackTicket['severity']>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState(user?.phone || user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastTicket, setLastTicket] = useState<FeedbackTicket | null>(null);
  const [history, setHistory] = useState<FeedbackTicket[]>(() => {
    try {
      const saved = localStorage.getItem('rokto_data_feedback_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rokto_data_feedback_history', JSON.stringify(history.slice(0, 20)));
    } catch {}
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (cleanSubject.length < 3) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে কমপক্ষে ৩ অক্ষরের একটি বিষয় লিখুন।'
          : 'Please enter a subject of at least 3 characters.'
      );
      return;
    }

    if (cleanDescription.length < 10) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে বিস্তারিত বর্ণনা দিন (কমপক্ষে ১০ অক্ষর)।'
          : 'Please describe the issue or suggestion (at least 10 characters).'
      );
      return;
    }

    setSubmitting(true);
    let ticketId = 'BETA-LOCAL-' + Math.floor(1000 + Math.random() * 9000);
    let synced = false;

    try {
      if (isOnline) {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            severity,
            subject: cleanSubject,
            description: cleanDescription,
            contactInfo: contactInfo.trim() || undefined,
            userId: user?.id || 'anonymous_beta_tester',
            language,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit feedback');
        }
        ticketId = data.ticketId;
        synced = true;
      }

      const ticket: FeedbackTicket = {
        ticketId,
        category,
        severity,
        subject: cleanSubject,
        description: cleanDescription,
        contactInfo: contactInfo.trim() || undefined,
        submittedAt: new Date().toISOString(),
        synced,
      };

      setHistory((prev) => [ticket, ...prev]);
      setLastTicket(ticket);
      setSubject('');
      setDescription('');

      showToast({
        type: synced ? 'success' : 'info',
        title: synced
          ? (language === 'bn' ? 'ফিডব্যাক পাঠানো হয়েছে' : 'Feedback Submitted')
          : (language === 'bn' ? 'অফলাইনে সংরক্ষিত হয়েছে' : 'Saved Offline'),
        message: synced
          ? `${language === 'bn' ? 'টিকেট আইডি:' : 'Ticket ID:'} ${ticketId}`
          : (language === 'bn' ? 'ইন্টারনেট সংযোগ ফিরলে পুনরায় পাঠাতে পারবেন।' : 'Saved locally while offline.'),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ফিডব্যাক পাঠাতে সমস্যা হয়েছে।';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions: { id: FeedbackTicket['category']; labelBn: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'bug', labelBn: 'বাগ / ত্রুটি রিপোর্ট', labelEn: 'Bug Report', icon: <Bug className="w-4 h-4" /> },
    { id: 'suggestion', labelBn: 'উন্নয়ন পরামর্শ', labelEn: 'Feature Suggestion', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'location_data', labelBn: 'জেলা / ম্যাপ তথ্য ত্রুটি', labelEn: 'Location / Map Issue', icon: <MapPin className="w-4 h-4" /> },
    { id: 'security', labelBn: 'নিরাপত্তা ও গোপনীয়তা', labelEn: 'Privacy / Security', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-black text-[11px] uppercase tracking-wider">
          BETA TEST FEEDBACK
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
          {language === 'bn' ? 'বিটা ফিডব্যাক ও বাগ রিপোর্ট' : 'Beta Feedback & Bug Report'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
          {language === 'bn'
            ? 'ROKTO DATA ফ্রি পাবলিক বিটা টেস্টে অংশ নেওয়ার জন্য ধন্যবাদ। কোনো ত্রুটি পেলে বা নতুন সুবিধার পরামর্শ থাকলে এখানে জানান।'
            : 'Thank you for testing ROKTO DATA Public Beta. Report any bugs, UI issues, or ideas to help us improve before wide release.'}
        </p>
      </div>

      {!isOnline && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {language === 'bn'
              ? 'আপনি বর্তমানে অফলাইনে আছেন। জমা দিলে আপনার ব্রাউজারে সংরক্ষিত থাকবে; সার্ভার সিঙ্কের জন্য অনলাইন সংযোগ প্রয়োজন।'
              : 'You are currently offline. Submissions are stored locally on your device until you reconnect.'}
          </span>
        </div>
      )}

      {lastTicket && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {language === 'bn' ? 'আপনার মতামত সফলভাবে গ্রহণ করা হয়েছে!' : 'Thank you! Your feedback has been received.'}
            </p>
            <p className="text-xs mt-0.5 text-emerald-800">
              {language === 'bn' ? 'টিকেট রেফারেন্স:' : 'Ticket Reference:'}{' '}
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                {lastTicket.ticketId}
              </span>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            {language === 'bn' ? 'মতামতের ধরন' : 'Feedback Category'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categoryOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCategory(opt.id)}
                className={`p-3 rounded-2xl border text-left text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                  category === opt.id
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={category === opt.id ? 'text-red-600' : 'text-gray-400'}>{opt.icon}</span>
                <span>{language === 'bn' ? opt.labelBn : opt.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {category === 'bug' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {language === 'bn' ? 'সমস্যার গুরুত্ব' : 'Bug Severity'}
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as FeedbackTicket['severity'])}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium bg-white"
            >
              <option value="low">{language === 'bn' ? 'সামান্য (Minor UI / Text)' : 'Low (Minor UI / Text)'}</option>
              <option value="medium">{language === 'bn' ? 'মাঝারি (Feature friction)' : 'Medium (Usability issue)'}</option>
              <option value="high">{language === 'bn' ? 'গুরুতর (Feature broken)' : 'High (Feature not working)'}</option>
              <option value="critical">{language === 'bn' ? 'অতি জরুরী (App crash / Security)' : 'Critical (Crash / Security)'}</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            {language === 'bn' ? 'বিষয় / শিরোনাম *' : 'Subject *'}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'যেমন: ম্যাপ ভিউতে জেলা ফিল্টার কাজ করছে না / নতুন ফিচার প্রস্তাব'
                : 'e.g., District filter on mobile view / Suggestion for blood group filter'
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm outline-hidden"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            {language === 'bn' ? 'বিস্তারিত বিবরণ *' : 'Detailed Description *'}
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'আপনি কোন ডিভাইস/ব্রাউজার ব্যবহার করছেন, কী করতে গিয়েছিলেন এবং কী ঘটেছে তা বিস্তারিত লিখুন...'
                : 'Describe steps to reproduce the bug or explain your suggestion in detail...'
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm outline-hidden"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            {language === 'bn' ? 'আপনার যোগাযোগ (ঐচ্ছিক - ইমেইল বা ফোন)' : 'Contact Info (Optional - Email or Phone)'}
          </label>
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder={language === 'bn' ? 'ফলো-আপের প্রয়োজনে দিলে উপকার হবে' : 'Optional for follow-up questions'}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm outline-hidden"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-99 text-white font-bold text-sm shadow-md shadow-red-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          <span>
            {submitting
              ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Submitting...')
              : (language === 'bn' ? 'ফিডব্যাক জমা দিন' : 'Submit Beta Feedback')}
          </span>
        </button>
      </form>

      {history.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <MessageSquarePlus className="w-4 h-4 text-red-600" />
            <span>{language === 'bn' ? 'আপনার সাম্প্রতিক ফিডব্যাকসমূহ' : 'Your Submitted Feedback'}</span>
          </h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.ticketId} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono font-bold text-red-600">{item.ticketId}</span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(item.submittedAt).toLocaleString()}
                  </span>
                </div>
                <p className="font-bold text-gray-900">{item.subject}</p>
                <p className="text-gray-600 line-clamp-2">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
