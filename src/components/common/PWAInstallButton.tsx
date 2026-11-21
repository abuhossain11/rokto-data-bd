import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X, MoreVertical, Share, CheckCircle2, Monitor } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const { language } = useLanguage();

  if (isInstalled) {
    return null;
  }

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        onClick={handlePrimaryClick}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer ${
          isInstallable
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
            : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
        }`}
        title={language === 'bn' ? 'অ্যাপ ইনস্টল ও নির্দেশিকা' : 'Install ROKTO DATA App'}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">
          {isInstallable
            ? (language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App')
            : (language === 'bn' ? 'অ্যাপ গাইড' : 'Install Guide')}
        </span>
        <span className="sm:hidden">{language === 'bn' ? 'ইনস্টল' : 'App'}</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative border border-gray-100 my-8">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              aria-label="Close install instructions"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-950">
                  {language === 'bn' ? 'ROKTO DATA (রক্তদাতা) অ্যাপ ইনস্টল করুন' : 'Install ROKTO DATA App'}
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'bn' ? 'মোবাইল ও ডেস্কটপের জন্য ফ্রি PWA অ্যাপ' : 'Free Progressive Web App for Mobile & Desktop'}
                </p>
              </div>
            </div>

            {isInstallable && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-red-900">
                  {language === 'bn' ? 'এক-ক্লিকে সরাসরি ইনস্টল প্রস্তুত!' : 'One-tap direct install is ready!'}
                </span>
                <button
                  onClick={async () => {
                    const ok = await install();
                    if (ok) setShowGuideModal(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  {language === 'bn' ? 'ইনস্টল করুন' : 'Install Now'}
                </button>
              </div>
            )}

            <div className="space-y-3 text-xs text-gray-700">
              {/* Android Chrome Section */}
              <div className={`p-4 rounded-2xl border ${isAndroid ? 'bg-red-50/60 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-red-600" />
                    <span>{language === 'bn' ? 'Android Chrome ব্যবহারকারীদের জন্য' : 'Android Chrome Users'}</span>
                  </span>
                  {isAndroid && (
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                      {language === 'bn' ? 'আপনার ডিভাইস' : 'Your Device'}
                    </span>
                  )}
                </div>
                <ol className="space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>
                    {language === 'bn' ? (
                      <>
                        Google Chrome ব্রাউজারে এই ওয়েবসাইটটি খুলুন এবং উপরে ডানদিকে <strong>⋮ (থ্রি-ডট মেনু)</strong> আইকনে ট্যাপ করুন।
                      </>
                    ) : (
                      <>
                        Open this app in Google Chrome and tap the <strong>⋮ (three-dot menu)</strong> in the top-right corner.
                      </>
                    )}
                  </li>
                  <li>
                    {language === 'bn' ? (
                      <>
                        মেনু থেকে <strong>&ldquo;Install app&rdquo;</strong> অথবা <strong>&ldquo;Add to Home screen&rdquo;</strong> নির্বাচন করুন।
                      </>
                    ) : (
                      <>
                        Tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
                      </>
                    )}
                  </li>
                  <li>
                    {language === 'bn' ? (
                      <>
                        পপআপ বক্সে <strong>&ldquo;Install&rdquo;</strong> বাটনে চাপ দিন — হোম স্ক্রিনে <strong>রক্তদাতা</strong> আইকন যুক্ত হয়ে যাবে।
                      </>
                    ) : (
                      <>
                        Confirm by tapping <strong>&ldquo;Install&rdquo;</strong>. ROKTO DATA will launch as a standalone app.
                      </>
                    )}
                  </li>
                </ol>
              </div>

              {/* iOS Safari Section */}
              <div className={`p-4 rounded-2xl border ${isIOS ? 'bg-red-50/60 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Share className="w-4 h-4 text-red-600" />
                    <span>{language === 'bn' ? 'iPhone / iPad (Safari)' : 'iPhone / iPad (Safari)'}</span>
                  </span>
                  {isIOS && (
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                      {language === 'bn' ? 'আপনার ডিভাইস' : 'Your Device'}
                    </span>
                  )}
                </div>
                <ol className="space-y-1 list-decimal pl-4 leading-relaxed">
                  <li>
                    {language === 'bn'
                      ? 'Safari ব্রাউজারের নিচের Share (শেয়ার) বাটনে ট্যাপ করুন।'
                      : 'Tap the Share button at the bottom of Safari.'}
                  </li>
                  <li>
                    {language === 'bn'
                      ? 'নিচে স্ক্রোল করে "Add to Home Screen" নির্বাচন করে Add চাপুন।'
                      : 'Scroll down and tap "Add to Home Screen", then tap Add.'}
                  </li>
                </ol>
              </div>

              {/* Desktop Browser Tip */}
              {!isAndroid && !isIOS && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-2.5">
                  <Monitor className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {language === 'bn'
                      ? 'ডেস্কটপ Chrome বা Edge-এ অ্যাড্রেস বারের ডানদিকে থাকা Install (ইনস্টল) আইকন অথবা মেনু থেকে "Install ROKTO DATA" চাপুন।'
                      : 'On Desktop Chrome or Edge, click the Install icon on the right side of the address bar or open browser menu → "Install ROKTO DATA".'}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'ইনস্টলের পর অ্যাপটি দ্রুত লোড হবে এবং প্রাইভেট ডেটা কখনোই ক্যাশে থাকবে না।'
                    : 'Runs in standalone mode with fast app shell loading and zero private data caching.'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition cursor-pointer"
            >
              {language === 'bn' ? 'বুঝেছি' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
