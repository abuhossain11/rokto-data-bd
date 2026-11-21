import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { MedicalDisclaimerBanner } from './components/common/MedicalDisclaimerBanner';
import { Phase1DemoBanner } from './components/common/Phase1DemoBanner';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';

import { LoginModal } from './components/auth/LoginModal';
import { ProfileCompletionModal } from './components/auth/ProfileCompletionModal';
import { CreateRequestModal } from './components/requests/CreateRequestModal';
import { RequestDetailModal } from './components/requests/RequestDetailModal';
import { DonorDetailModal } from './components/donors/DonorDetailModal';

import { LandingPage } from './components/pages/LandingPage';
import { FindDonorsPage } from './components/pages/FindDonorsPage';
import { EmergencyRequestsPage } from './components/pages/EmergencyRequestsPage';
import { HospitalsPage } from './components/pages/HospitalsPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { DonorDashboard } from './components/donors/DonorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DeveloperSetupPage } from './components/pages/DeveloperSetupPage';
import { FeedbackPage } from './components/pages/FeedbackPage';
import {
  MedicalDisclaimerPage,
  SafetyGuidelinesPage,
  AboutUsPage,
  ContactUsPage,
  PrivacyPolicyPage,
  TermsConditionsPage,
  FAQPage,
} from './components/pages/StaticPages';

import { BloodGroup, BloodRequest, DonorProfile } from './types';

const MainAppContent: React.FC = () => {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedBloodGroupFilter, setSelectedBloodGroupFilter] = useState<BloodGroup | undefined>(undefined);

  // Modals state
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [activeRequestDetail, setActiveRequestDetail] = useState<BloodRequest | null>(null);
  const [activeDonorDetail, setActiveDonorDetail] = useState<DonorProfile | null>(null);

  const handleNavigateToFindDonors = (bloodGroup?: BloodGroup) => {
    setSelectedBloodGroupFilter(bloodGroup);
    setCurrentTab('find_donors');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRequestDetails = (req: BloodRequest) => {
    setActiveRequestDetail(req);
  };

  const handleOpenDonorDetails = (donor: DonorProfile) => {
    setActiveDonorDetail(donor);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-red-600 selection:text-white">
      {/* Public Beta Testing Banner */}
      <Phase1DemoBanner onOpenFeedback={() => setCurrentTab('feedback')} />

      {/* Top Medical Disclaimer Announcement */}
      <MedicalDisclaimerBanner onNavigateToDisclaimer={() => setCurrentTab('disclaimer')} />

      {/* Toast Alert Notifications */}
      <ToastContainer />

      {/* Main Sticky Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openCreateRequest={() => setIsCreateRequestOpen(true)}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigateToFindDonors={handleNavigateToFindDonors}
            openCreateRequest={() => setIsCreateRequestOpen(true)}
            onOpenRequestDetails={handleOpenRequestDetails}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'find_donors' && (
          <FindDonorsPage
            initialBloodGroup={selectedBloodGroupFilter}
            onOpenDonorDetails={handleOpenDonorDetails}
          />
        )}

        {currentTab === 'emergency_requests' && (
          <EmergencyRequestsPage
            openCreateRequest={() => setIsCreateRequestOpen(true)}
            onOpenRequestDetails={handleOpenRequestDetails}
          />
        )}

        {currentTab === 'hospitals' && <HospitalsPage />}

        {currentTab === 'dashboard' && (
          <DonorDashboard
            onOpenRequestDetails={handleOpenRequestDetails}
            openCreateRequest={() => setIsCreateRequestOpen(true)}
          />
        )}

        {currentTab === 'admin' && <AdminDashboard />}

        {currentTab === 'notifications' && (
          <NotificationsPage onOpenRequestDetails={handleOpenRequestDetails} />
        )}

        {currentTab === 'dev_setup' && <DeveloperSetupPage />}

        {currentTab === 'about' && <AboutUsPage />}
        {currentTab === 'how_it_works' && <AboutUsPage />}
        {currentTab === 'safety' && <SafetyGuidelinesPage />}
        {currentTab === 'faq' && <FAQPage />}
        {currentTab === 'disclaimer' && <MedicalDisclaimerPage />}
        {currentTab === 'privacy' && <PrivacyPolicyPage />}
        {currentTab === 'terms' && <TermsConditionsPage />}
        {currentTab === 'contact' && <ContactUsPage onOpenFeedback={() => setCurrentTab('feedback')} />}
        {currentTab === 'feedback' && <FeedbackPage />}
      </main>

      {/* Footer */}
      <Footer setCurrentTab={setCurrentTab} />

      {/* Mobile Bottom Navigation (Visible on phones & tablets) */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openCreateRequest={() => setIsCreateRequestOpen(true)}
      />

      {/* Modals & Dialogs */}
      <LoginModal />
      <ProfileCompletionModal />
      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onSuccess={() => setCurrentTab('emergency_requests')}
      />
      <RequestDetailModal
        request={activeRequestDetail}
        onClose={() => setActiveRequestDetail(null)}
      />
      <DonorDetailModal
        donor={activeDonorDetail}
        onClose={() => setActiveDonorDetail(null)}
      />

      {/* Offline Alert Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <MainAppContent />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
