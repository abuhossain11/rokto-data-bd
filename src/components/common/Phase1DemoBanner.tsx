import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, MessageSquarePlus } from 'lucide-react';

interface BetaBannerProps {
  onOpenFeedback?: () => void;
}

export const Phase1DemoBanner: React.FC<BetaBannerProps> = ({ onOpenFeedback }) => {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-[11px] sm:text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-white uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 border border-red-500 text-[10px]">
            {language === 'bn' ? 'BETA TEST · বিটা টেস্ট' : 'BETA TEST'}
          </span>
          <span className="text-slate-200">
            {language === 'bn'
              ? 'ফ্রি পাবলিক বিটা টেস্টিং চলছে — কোনো বাগ বা পরামর্শ থাকলে সরাসরি আমাদের জানান।'
              : 'Free Public Beta Testing is live — help us improve by reporting bugs or sharing suggestions.'}
          </span>
          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer"
            >
              <MessageSquarePlus className="w-3 h-3 text-red-400" />
              <span>{language === 'bn' ? 'ফিডব্যাক দিন' : 'Send Feedback'}</span>
            </button>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-200 p-1 shrink-0 rounded cursor-pointer"
          title="Dismiss"
          aria-label="Dismiss beta banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
