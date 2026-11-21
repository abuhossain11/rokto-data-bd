import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const MedicalDisclaimerBanner: React.FC<{ onNavigateToDisclaimer?: () => void }> = ({
  onNavigateToDisclaimer,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { language, t } = useLanguage();

  if (dismissed) return null;

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-xs text-red-900 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <strong className="font-semibold text-red-700 mr-1.5">
              {t.disclaimer.bannerTitle}
            </strong>
            <span className="text-gray-700 hidden sm:inline">
              {t.disclaimer.bannerText}
            </span>
            <button
              onClick={onNavigateToDisclaimer}
              className="ml-2 font-medium text-red-700 underline hover:text-red-800 cursor-pointer"
            >
              {t.disclaimer.readMore}
            </button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 p-1 shrink-0 cursor-pointer rounded hover:bg-red-100"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
