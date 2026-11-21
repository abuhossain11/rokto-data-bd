import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const ConnectionStatusBadge: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
        isOnline
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
      }`}
      role="status"
      aria-live="polite"
      title={
        isOnline
          ? (language === 'bn' ? 'ইন্টারনেট সংযোগ সক্রিয়' : 'Connected to live network')
          : (language === 'bn' ? 'ইন্টারনেট সংযোগ বিচ্ছিন্ন' : 'No internet connection')
      }
    >
      <span
        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-600'}`}
      />
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span className="hidden sm:inline">
        {isOnline
          ? (language === 'bn' ? 'অনলাইন' : 'Online')
          : (language === 'bn' ? 'অফলাইন' : 'Offline')}
      </span>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl border border-amber-500"
      role="alert"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {language === 'bn'
          ? 'আপনি বর্তমানে অফলাইনে আছেন — লাইভ রক্তদাতা অনুসন্ধান ও নতুন আবেদনের জন্য ইন্টারনেট সংযোগ প্রয়োজন।'
          : 'You are offline — live donor search and blood requests require an internet connection.'}
      </span>
    </div>
  );
};
