import React, { useState } from 'react';
import {
  Droplets,
  Bell,
  User,
  Shield,
  Menu,
  X,
  Languages,
  LogOut,
  Hospital as HospitalIcon,
  Search,
  PlusCircle,
  LayoutDashboard,
  HeartPulse,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ConnectionStatusBadge } from './OfflineIndicator';
import { NotificationService } from '../../services/notificationService';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openCreateRequest: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openCreateRequest }) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, isSuperAdmin, isDistrictAdmin, isModerator, logout, setShowLoginModal, setShowProfileModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifications = NotificationService.getNotifications(user?.id || 'guest');
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand: Zone 1 */}
          <button
            onClick={() => handleNav('landing')}
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/25">
              <Droplets className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight whitespace-nowrap">
              {language === 'bn' ? 'রক্তদাতা' : 'ROKTO DATA'}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] sm:text-[10px] font-black tracking-wider uppercase">
              BETA TEST
            </span>
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => handleNav('landing')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                currentTab === 'landing'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.nav.home}
            </button>

            <button
              onClick={() => handleNav('find_donors')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                currentTab === 'find_donors'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.nav.findDonors}
            </button>

            <button
              onClick={() => handleNav('emergency_requests')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                currentTab === 'emergency_requests'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.nav.requestBlood}
            </button>

            <button
              onClick={() => handleNav('hospitals')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                currentTab === 'hospitals'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.nav.hospitals}
            </button>

            <button
              onClick={() => handleNav('feedback')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                currentTab === 'feedback'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.nav.feedback}
            </button>

            {isAuthenticated && (
              <button
                onClick={() => handleNav('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.nav.dashboard}
              </button>
            )}

            {(isSuperAdmin || isDistrictAdmin || isModerator) && (
              <button
                onClick={() => handleNav('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  currentTab === 'admin'
                    ? 'text-red-700 bg-red-100 font-bold'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t.nav.admin}</span>
              </button>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Online / Offline Status Indicator */}
            <ConnectionStatusBadge />

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition cursor-pointer"
              title="Toggle Language"
            >
              <Languages className="w-3.5 h-3.5 text-gray-500" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Notifications Icon */}
            <button
              onClick={() => handleNav('notifications')}
              className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Emergency Request CTA */}
            <button
              onClick={openCreateRequest}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/20 transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? 'রক্তের আবেদন' : 'Post Request'}</span>
            </button>

            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                    {user?.bloodGroup || 'BD'}
                  </div>
                  <span className="hidden md:inline text-xs font-medium text-gray-800 max-w-[100px] truncate">
                    {user?.fullName}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-2 rounded-xl border border-red-600 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                {t.nav.login}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-gray-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-4 duration-150">
          <div className="space-y-1">
            <button
              onClick={() => handleNav('landing')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-600"
            >
              {t.nav.home}
            </button>
            <button
              onClick={() => handleNav('find_donors')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-600"
            >
              {t.nav.findDonors}
            </button>
            <button
              onClick={() => handleNav('emergency_requests')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-600"
            >
              {t.nav.requestBlood}
            </button>
            <button
              onClick={() => handleNav('hospitals')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-600"
            >
              {t.nav.hospitals}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => handleNav('dashboard')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-600"
              >
                {t.nav.dashboard}
              </button>
            )}
            {(isSuperAdmin || isDistrictAdmin || isModerator) && (
              <button
                onClick={() => handleNav('admin')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 bg-red-50"
              >
                {t.nav.admin}
              </button>
            )}
            <button
              onClick={() => handleNav('feedback')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50/70 hover:bg-red-100"
            >
              {t.nav.feedback}
            </button>
            <button
              onClick={() => handleNav('about')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
            >
              {t.nav.about}
            </button>
            <button
              onClick={() => handleNav('safety')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
            >
              {t.nav.safety}
            </button>
            <button
              onClick={() => handleNav('privacy')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
            >
              {t.nav.privacy}
            </button>
            <button
              onClick={() => handleNav('terms')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
            >
              {t.nav.terms}
            </button>
            <button
              onClick={() => handleNav('contact')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
            >
              {t.nav.contact}
            </button>
            <button
              onClick={() => handleNav('disclaimer')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50"
            >
              {t.nav.disclaimer}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
            <button
              onClick={() => {
                openCreateRequest();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? 'জরুরী রক্তের আবেদন করুন' : 'Post Blood Request'}</span>
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.nav.logout}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl border border-red-600 text-red-600 text-xs font-semibold hover:bg-red-50"
              >
                {t.nav.login}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
