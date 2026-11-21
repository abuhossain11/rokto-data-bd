import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, DonorProfile } from '../types';
import { normalizeBangladeshPhone } from '../services/validationService';
import { supabase, isSupabaseConfigured, getSupabaseConfigStatus, SupabaseConfigStatus } from '../services/supabaseClient';
import { ConsentService } from '../services/consentService';
import { getDistrictById } from '../data/bangladeshLocations';
import { fuzzCoordinates } from '../services/locationService';

interface AuthContextType {
  user: UserProfile | null;
  donorProfile: DonorProfile | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isDistrictAdmin: boolean;
  isModerator: boolean;
  isHospital: boolean;
  supabaseStatus: SupabaseConfigStatus;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateDonorProfile: (updates: Partial<DonorProfile>) => Promise<DonorProfile | null>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (isSupabaseConfigured) return null;
    try {
      const saved = localStorage.getItem('rokto_data_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(() => {
    if (isSupabaseConfigured) return null;
    try {
      const saved = localStorage.getItem('rokto_data_donor_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [supabaseStatus] = useState<SupabaseConfigStatus>(getSupabaseConfigStatus());

  const hydrateSupabaseUser = useCallback(async (authUserId: string, authEmail?: string, authPhone?: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, district_scope')
      .eq('user_id', authUserId);

    const rolesList: UserRole[] = userRoles?.length
      ? userRoles.map((r) => r.role as UserRole)
      : ['donor', 'seeker'];
    const assignedScope = userRoles?.find((r) => r.district_scope)?.district_scope;

    if (profile) {
      const loadedUser: UserProfile = {
        id: profile.id,
        phone: profile.phone || authPhone || '',
        phoneVerified: Boolean(profile.phone_verified),
        fullName: profile.full_name,
        email: profile.email || authEmail,
        dateOfBirth: profile.date_of_birth,
        bloodGroup: profile.blood_group,
        divisionId: profile.division_id || 'dhaka',
        districtId: profile.district_id || 'dhaka',
        upazilaId: profile.upazila_id || 'dhanmondi',
        area: profile.area,
        avatarUrl: profile.avatar_url,
        preferredLanguage: profile.preferred_language || 'bn',
        roles: rolesList,
        districtScope: assignedScope,
        contactConsent: true,
        locationSharingConsent: true,
        status: profile.status || 'active',
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
      setUser(loadedUser);
    } else {
      const bootstrapUser: UserProfile = {
        id: authUserId,
        phone: authPhone || '',
        phoneVerified: Boolean(authPhone),
        fullName: authEmail ? authEmail.split('@')[0] : 'নতুন ব্যবহারকারী',
        email: authEmail,
        bloodGroup: 'O+',
        divisionId: 'dhaka',
        districtId: 'dhaka',
        upazilaId: 'dhanmondi',
        preferredLanguage: 'bn',
        roles: rolesList,
        districtScope: assignedScope,
        contactConsent: true,
        locationSharingConsent: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(bootstrapUser);
    }

    const { data: dProfile } = await supabase
      .from('donor_profiles')
      .select('id, user_id, blood_group, availability, last_donation_date, total_donations, division_id, district_id, upazila_id, area, contact_number_protected, medical_eligibility_acknowledged, registered_at, updated_at')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (dProfile) {
      const distObj = getDistrictById(dProfile.district_id || 'dhaka');
      const fuzzed = fuzzCoordinates(distObj?.lat || 23.8103, distObj?.lng || 90.4125);
      setDonorProfile({
        id: dProfile.id,
        userId: dProfile.user_id,
        bloodGroup: dProfile.blood_group,
        availability: dProfile.availability,
        lastDonationDate: dProfile.last_donation_date,
        totalDonations: dProfile.total_donations || 0,
        divisionId: dProfile.division_id || 'dhaka',
        districtId: dProfile.district_id || 'dhaka',
        upazilaId: dProfile.upazila_id || 'dhanmondi',
        area: dProfile.area,
        approxLat: fuzzed.lat,
        approxLng: fuzzed.lng,
        contactNumberProtected: dProfile.contact_number_protected ?? true,
        medicalEligibilityAcknowledged: dProfile.medical_eligibility_acknowledged ?? false,
        registeredAt: dProfile.registered_at,
        updatedAt: dProfile.updated_at,
      });
    }
  }, []);

  // Listen to Supabase Auth State changes if configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        hydrateSupabaseUser(
          data.session.user.id,
          data.session.user.email,
          data.session.user.phone
        );
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await hydrateSupabaseUser(session.user.id, session.user.email, session.user.phone);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setDonorProfile(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [hydrateSupabaseUser]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (user) {
      localStorage.setItem('rokto_data_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rokto_data_current_user');
    }
  }, [user]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (donorProfile) {
      localStorage.setItem('rokto_data_donor_profile', JSON.stringify(donorProfile));
    } else {
      localStorage.removeItem('rokto_data_donor_profile');
    }
  }, [donorProfile]);

  const loginWithPhone = async (phone: string) => {
    const validated = normalizeBangladeshPhone(phone);
    if (!validated.isValid) {
      return { success: false, error: validated.error };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: validated.normalized,
        });

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true, message: 'ওটিপি কোড আপনার মোবাইলে পাঠানো হয়েছে।' };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'ওটিপি পাঠাতে সমস্যা হয়েছে';
        return { success: false, error: message };
      }
    }

    return {
      success: true,
      message: 'বিটা টেস্টিং ওটিপি পাঠানো হয়েছে। কোড: 123456',
    };
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const validated = normalizeBangladeshPhone(phone);
    if (!validated.isValid) {
      return { success: false, error: validated.error };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: validated.normalized,
          token: otp,
          type: 'sms',
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          ConsentService.recordConsent(data.user.id, 'terms_and_privacy', true);
          setShowLoginModal(false);
          return { success: true };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'ওটিপি যাচাই ব্যর্থ হয়েছে';
        return { success: false, error: message };
      }
    }

    // Local sandbox fallback when Supabase env is not connected
    if (otp !== '123456') {
      return { success: false, error: 'ভুল ওটিপি কোড (পরীক্ষামূলক ওটিপি: 123456)' };
    }

    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      phone: validated.normalized,
      phoneVerified: true,
      fullName: 'নতুন ব্যবহারকারী',
      bloodGroup: 'B+',
      divisionId: 'dhaka',
      districtId: 'dhaka',
      upazilaId: 'dhanmondi',
      preferredLanguage: 'bn',
      roles: ['donor', 'seeker'],
      contactConsent: true,
      locationSharingConsent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    };

    ConsentService.recordConsent(newUser.id, 'terms_and_privacy', true);
    setUser(newUser);
    setShowLoginModal(false);
    return { success: true };
  };

  const loginWithGoogle = async () => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Google লগইন ব্যর্থ হয়েছে';
        return { success: false, error: message };
      }
    }

    const googleUser: UserProfile = {
      id: 'usr_google_' + Date.now(),
      phone: '+8801711223344',
      phoneVerified: true,
      fullName: 'Beta Tester (Google)',
      email: 'tester@roktodata.org.bd',
      bloodGroup: 'O+',
      divisionId: 'dhaka',
      districtId: 'dhaka',
      upazilaId: 'gulshan',
      preferredLanguage: 'bn',
      roles: ['donor', 'seeker'],
      contactConsent: true,
      locationSharingConsent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    };
    ConsentService.recordConsent(googleUser.id, 'terms_and_privacy', true);
    setUser(googleUser);
    setShowLoginModal(false);
    return { success: true };
  };

  // Sandbox QA role helper — strictly disabled when live Supabase DB is active
  const switchDemoRole = (role: UserRole) => {
    if (isSupabaseConfigured) {
      console.warn('Role switching via client is disabled when Supabase is configured.');
      return;
    }
    const baseUser: UserProfile = user || {
      id: role === 'super_admin' ? 'user_admin' : 'usr_sandbox_' + Date.now(),
      phone: '+8801700000001',
      phoneVerified: true,
      fullName: 'Beta QA Tester',
      bloodGroup: 'O+',
      divisionId: 'dhaka',
      districtId: 'dhaka',
      upazilaId: 'dhanmondi',
      preferredLanguage: 'bn',
      roles: [role],
      contactConsent: true,
      locationSharingConsent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    };
    const updated: UserProfile = {
      ...baseUser,
      roles: [role],
      updatedAt: new Date().toISOString(),
    };
    setUser(updated);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            phone: updated.phone,
            phone_verified: updated.phoneVerified,
            full_name: updated.fullName,
            email: updated.email,
            date_of_birth: updated.dateOfBirth || null,
            blood_group: updated.bloodGroup,
            division_id: updated.divisionId,
            district_id: updated.districtId,
            upazila_id: updated.upazilaId,
            area: updated.area || null,
            preferred_language: updated.preferredLanguage,
          });
      } catch (err) {
        console.warn('Supabase profile update warning:', err);
      }
    }
  };

  const updateDonorProfile = async (updates: Partial<DonorProfile>): Promise<DonorProfile | null> => {
    if (!user) return null;

    const distObj = getDistrictById(updates.districtId || donorProfile?.districtId || user.districtId);
    const fuzzed = fuzzCoordinates(distObj?.lat || 23.8103, distObj?.lng || 90.4125);

    const updated: DonorProfile = donorProfile
      ? { ...donorProfile, ...updates, updatedAt: new Date().toISOString() }
      : {
          id: 'dp_' + user.id,
          userId: user.id,
          bloodGroup: updates.bloodGroup || user.bloodGroup,
          availability: updates.availability || 'available',
          lastDonationDate: updates.lastDonationDate,
          totalDonations: 0,
          divisionId: updates.divisionId || user.divisionId,
          districtId: updates.districtId || user.districtId,
          upazilaId: updates.upazilaId || user.upazilaId,
          area: updates.area || user.area,
          approxLat: fuzzed.lat,
          approxLng: fuzzed.lng,
          contactNumberProtected: updates.contactNumberProtected ?? true,
          medicalEligibilityAcknowledged: updates.medicalEligibilityAcknowledged ?? true,
          registeredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    setDonorProfile(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('donor_profiles')
          .upsert(
            {
              user_id: user.id,
              blood_group: updated.bloodGroup,
              availability: updated.availability,
              last_donation_date: updated.lastDonationDate || null,
              division_id: updated.divisionId,
              district_id: updated.districtId,
              upazila_id: updated.upazilaId,
              area: updated.area || null,
              contact_number_protected: updated.contactNumberProtected,
              medical_eligibility_acknowledged: updated.medicalEligibilityAcknowledged,
            },
            { onConflict: 'user_id' }
          );
      } catch (err) {
        console.warn('Supabase donor profile update warning:', err);
      }
    }

    return updated;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut warning:', err);
      }
    }
    setUser(null);
    setDonorProfile(null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update({ status: 'deleted' }).eq('id', user.id);
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase account deletion warning:', err);
      }
    }
    const deletedUserId = user.id;
    setUser(null);
    setDonorProfile(null);
    localStorage.removeItem('rokto_data_current_user');
    localStorage.removeItem('rokto_data_donor_profile');
    try {
      const existingTokens = localStorage.getItem('rokto_data_device_tokens');
      if (existingTokens) {
        const tokens = JSON.parse(existingTokens).filter((t: { userId: string }) => t.userId !== deletedUserId);
        localStorage.setItem('rokto_data_device_tokens', JSON.stringify(tokens));
      }
      const existingConsents = localStorage.getItem('rokto_data_user_consents');
      if (existingConsents) {
        const consents = JSON.parse(existingConsents).filter((c: { userId: string }) => c.userId !== deletedUserId);
        localStorage.setItem('rokto_data_user_consents', JSON.stringify(consents));
      }
    } catch {}
  };

  const roles = user?.roles || ['guest'];
  const isSuperAdmin = roles.includes('super_admin');
  const isDistrictAdmin = roles.includes('district_admin') || isSuperAdmin;
  const isModerator = roles.includes('moderator') || isDistrictAdmin;
  const isHospital = roles.includes('hospital');

  return (
    <AuthContext.Provider
      value={{
        user,
        donorProfile,
        isAuthenticated: !!user,
        isSuperAdmin,
        isDistrictAdmin,
        isModerator,
        isHospital,
        supabaseStatus,
        loginWithPhone,
        verifyOtp,
        loginWithGoogle,
        switchDemoRole,
        updateProfile,
        updateDonorProfile,
        logout,
        deleteAccount,
        showLoginModal,
        setShowLoginModal,
        showProfileModal,
        setShowProfileModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
