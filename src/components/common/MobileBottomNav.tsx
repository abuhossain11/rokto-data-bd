import React from 'react';
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationService } from '../../services/notificationService';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openCreateRequest: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  openCreateRequest,
}) => {
  const { language } = useLanguage();
  const { user, isAuthenticated, setShowLoginModal, setShowProfileModal } = useAuth();

  const notifications = NotificationService.getNotifications(user?.id || 'guest');
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setShowProfileModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => {
            setCurrentTab('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`min-h-[48px] min-w-[54px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            currentTab === 'landing' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'landing' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">
            {language === 'bn' ? 'মূলপাতা' : 'Home'}
          </span>
        </button>

        {/* Find Donor */}
        <button
          onClick={() => {
            setCurrentTab('find_donors');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`min-h-[48px] min-w-[54px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            currentTab === 'find_donors' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Search className={`w-5 h-5 ${currentTab === 'find_donors' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">
            {language === 'bn' ? 'রক্তদাতা' : 'Find Donor'}
          </span>
        </button>

        {/* Request Blood - Highlighted center button */}
        <button
          onClick={openCreateRequest}
          className="min-h-[48px] min-w-[54px] flex flex-col items-center justify-center -mt-5 cursor-pointer"
          title="Create Emergency Request"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/35 border-2 border-white active:scale-95 transition-transform">
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-red-600">
            {language === 'bn' ? 'আবেদন' : 'Request'}
          </span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            setCurrentTab('notifications');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`min-h-[48px] min-w-[54px] relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            currentTab === 'notifications' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Bell className={`w-5 h-5 ${currentTab === 'notifications' ? 'stroke-[2.5]' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5">
            {language === 'bn' ? 'বিজ্ঞপ্তি' : 'Alerts'}
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={handleProfileClick}
          className="min-h-[48px] min-w-[54px] flex flex-col items-center justify-center py-1 px-2 rounded-xl text-gray-500 hover:text-gray-900 transition cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">
            {isAuthenticated
              ? (language === 'bn' ? 'প্রোফাইল' : 'Profile')
              : (language === 'bn' ? 'লগইন' : 'Login')}
          </span>
        </button>
      </div>
    </div>
  );
};
