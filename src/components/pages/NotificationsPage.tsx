import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { NotificationService } from '../../services/notificationService';
import { AppNotification, BloodRequest } from '../../types';
import {
  Bell,
  CheckCheck,
  Droplets,
  Heart,
  ShieldCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface NotificationsPageProps {
  onOpenRequestDetails: (req: BloodRequest) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onOpenRequestDetails }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { requests } = useData();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'emergency_match' | 'donor_response' | 'system'>('all');
  const [pushStatus, setPushStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    setNotifications(NotificationService.getNotifications(user?.id || 'guest'));
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    } else {
      setPushStatus('unsupported');
    }
  }, [user]);

  const handleEnablePush = async () => {
    if (!user) return;
    setEnablingPush(true);
    try {
      const res = await NotificationService.requestPushPermission(user.id);
      if (res.granted) {
        setPushStatus('granted');
      }
    } finally {
      setEnablingPush(false);
    }
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead(user?.id || 'guest');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = (notif: AppNotification) => {
    NotificationService.markAsRead(notif.id);
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));

    if (notif.relatedRequestId) {
      const targetReq = requests.find((r) => r.id === notif.relatedRequestId);
      if (targetReq) {
        onOpenRequestDetails(targetReq);
      }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
            {language === 'bn' ? 'বিজ্ঞপ্তি ও সতর্কতা' : 'Notifications & Alerts'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'জরুরী রক্তের ম্যাচ, সাড়া এবং সিস্টেম বার্তা'
              : 'Emergency matching alerts and voluntary donation response updates'}
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-red-600" />
            <span>{language === 'bn' ? 'সব পঠিত চিহ্নিত করুন' : 'Mark all read'}</span>
          </button>
        )}
      </div>

      {/* Push Notification Opt-In Card */}
      {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/25">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                {language === 'bn'
                  ? 'জরুরী রক্তের নোটিফিকেশন চালু করুন (FCM Push)'
                  : 'Enable Emergency Push Notifications (FCM)'}
              </h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                {language === 'bn'
                  ? 'আপনার রক্তের গ্রুপের কোনো জরুরী রক্তের আবেদন এলে তাৎক্ষণিক নোটিফিকেশন পান। কোনো রোগীর স্পর্শকাতর তথ্য নোটিফিকেশনে পাঠানো হয় না।'
                  : 'Get instant alerts when someone urgently needs your blood group nearby. Privacy protected.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleEnablePush}
            disabled={enablingPush}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition cursor-pointer shrink-0 disabled:opacity-75"
          >
            {enablingPush
              ? (language === 'bn' ? 'অনুরোধ করা হচ্ছে...' : 'Requesting...')
              : (language === 'bn' ? 'নোটিফিকেশন সক্রিয় করুন' : 'Enable Notifications')}
          </button>
        </div>
      )}

      {pushStatus === 'granted' && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'bn'
                ? 'ব্রাউজার পুশ নোটিফিকেশন সক্রিয় রয়েছে। জরুরী ম্যাচ নোটিফিকেশন ডিভাইসে পৌঁছাবে।'
                : 'Device push notifications active. Emergency blood matches will alert your device.'}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
            FCM Active
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {language === 'bn' ? 'সকল বার্তা' : 'All'} ({notifications.length})
        </button>

        <button
          onClick={() => setActiveFilter('emergency_match')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'emergency_match'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {language === 'bn' ? 'রক্তের ম্যাচ' : 'Blood Matches'}
        </button>

        <button
          onClick={() => setActiveFilter('donor_response')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'donor_response'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {language === 'bn' ? 'দাতার সাড়া' : 'Responses'}
        </button>

        <button
          onClick={() => setActiveFilter('system')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'system'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {language === 'bn' ? 'সিস্টেম বার্তা' : 'System'}
        </button>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-3">
          <Bell className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">
            {language === 'bn' ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {language === 'bn'
              ? 'আপনার রক্তের গ্রুপের কোনো জরুরী আবেদন তৈরি হলে বা কেউ আপনার আবেদনে সাড়া দিলে এখানে দেখতে পাবেন।'
              : 'Alerts will appear here when an emergency blood request matches your profile.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-4 sm:p-5 rounded-2xl border transition flex items-start gap-3.5 cursor-pointer ${
                notif.read
                  ? 'bg-white border-gray-200/80 hover:border-gray-300'
                  : 'bg-red-50/50 border-red-200 hover:bg-red-50 shadow-xs'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.type === 'emergency_match'
                    ? 'bg-red-100 text-red-600'
                    : notif.type === 'donor_response'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {notif.type === 'emergency_match' ? (
                  <Droplets className="w-5 h-5 fill-red-600" />
                ) : notif.type === 'donor_response' ? (
                  <Heart className="w-5 h-5 fill-emerald-600" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    {language === 'bn' ? notif.titleBn : notif.title}
                  </h4>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap font-mono">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {language === 'bn' ? notif.messageBn : notif.message}
                </p>

                {notif.relatedRequestId && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-red-600">
                    <span>{language === 'bn' ? 'আবেদনটি দেখতে ট্যাপ করুন' : 'Tap to view request'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Privacy note */}
      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
        <Lock className="w-4 h-4 text-gray-400 shrink-0" />
        <span>
          {language === 'bn'
            ? 'সুরক্ষা নীতি: পুশ নোটিফিকেশনে রোগীর কোনো ব্যক্তিগত নাম বা রোগ নির্ণয়ের স্পর্শকাতর তথ্য পাঠানো হয় না।'
            : 'Privacy Policy: Push notifications never contain patient personal names or sensitive medical diagnoses.'}
        </span>
      </div>
    </div>
  );
};
