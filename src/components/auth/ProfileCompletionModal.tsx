import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict } from '../../data/bangladeshLocations';
import { VALID_BLOOD_GROUPS, isEligibleDonorAge } from '../../services/validationService';
import { BloodGroup, DonorAvailability } from '../../types';
import { X, User, ShieldCheck, Heart, Trash2, AlertCircle, Check } from 'lucide-react';

export const ProfileCompletionModal: React.FC = () => {
  const { user, donorProfile, showProfileModal, setShowProfileModal, updateProfile, updateDonorProfile, logout, deleteAccount } = useAuth();
  const { upsertDonorRecord } = useData();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '1998-05-15');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(user?.bloodGroup || 'B+');
  const [divisionId, setDivisionId] = useState(user?.divisionId || 'dhaka');
  const [districtId, setDistrictId] = useState(user?.districtId || 'dhaka');
  const [upazilaId, setUpazilaId] = useState(user?.upazilaId || 'dhanmondi');
  const [area, setArea] = useState(user?.area || '');
  const [contactConsent, setContactConsent] = useState(user?.contactConsent ?? true);
  const [locationSharingConsent, setLocationSharingConsent] = useState(user?.locationSharingConsent ?? true);
  const [availability, setAvailability] = useState<DonorAvailability>(donorProfile?.availability || 'available');
  const [lastDonationDate, setLastDonationDate] = useState(donorProfile?.lastDonationDate || '');
  const [medicalConsent, setMedicalConsent] = useState(donorProfile?.medicalEligibilityAcknowledged ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user && showProfileModal) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setDateOfBirth(user.dateOfBirth || '1998-05-15');
      setBloodGroup(user.bloodGroup || 'B+');
      setDivisionId(user.divisionId || 'dhaka');
      setDistrictId(user.districtId || 'dhaka');
      setUpazilaId(user.upazilaId || 'dhanmondi');
      setArea(user.area || '');
      setContactConsent(user.contactConsent ?? true);
      setLocationSharingConsent(user.locationSharingConsent ?? true);
      setAvailability(donorProfile?.availability || 'available');
      setLastDonationDate(donorProfile?.lastDonationDate || '');
      setMedicalConsent(donorProfile?.medicalEligibilityAcknowledged ?? true);
    }
  }, [user, donorProfile, showProfileModal]);

  if (!showProfileModal || !user) return null;

  const availableDistricts = getDistrictsByDivision(divisionId);
  const availableUpazilas = getUpazilasByDistrict(districtId);

  const handleDivisionChange = (newDiv: string) => {
    setDivisionId(newDiv);
    const dists = getDistrictsByDivision(newDiv);
    if (dists.length > 0) {
      setDistrictId(dists[0].id);
      const upzs = getUpazilasByDistrict(dists[0].id);
      setUpazilaId(upzs[0]?.id || '');
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrictId(newDist);
    const upzs = getUpazilasByDistrict(newDist);
    setUpazilaId(upzs[0]?.id || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (dateOfBirth) {
      const ageValidation = isEligibleDonorAge(dateOfBirth);
      if (!ageValidation.eligible) {
        setErrorMsg(ageValidation.message || 'বয়সজনিত সীমাবদ্ধতা');
        return;
      }
    }

    await updateProfile({
      fullName,
      email,
      dateOfBirth,
      bloodGroup,
      divisionId,
      districtId,
      upazilaId,
      area,
      contactConsent,
      locationSharingConsent,
    });

    const savedDonor = await updateDonorProfile({
      bloodGroup,
      availability,
      lastDonationDate: lastDonationDate || undefined,
      divisionId,
      districtId,
      upazilaId,
      area,
      medicalEligibilityAcknowledged: medicalConsent,
    });

    if (savedDonor) {
      upsertDonorRecord(savedDonor, {
        ...user,
        fullName,
        email,
        bloodGroup,
        divisionId,
        districtId,
        upazilaId,
        area,
      });
    }

    showToast({
      type: 'success',
      title: language === 'bn' ? 'প্রোফাইল সংরক্ষিত হয়েছে!' : 'Profile Saved!',
      message: language === 'bn' ? 'আপনার তথ্য সফলভাবে আপডেট হয়েছে।' : 'Your details have been updated.',
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowProfileModal(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative border border-gray-100 my-8">
        <button
          onClick={() => setShowProfileModal(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-950">
              {language === 'bn' ? 'আমার প্রোফাইল ও রক্তদান সেটিংস' : 'Profile & Donor Settings'}
            </h3>
            <p className="text-xs text-gray-500">
              {language === 'bn'
                ? 'আপনার রক্তের গ্রুপ ও এলাকা হালনাগাদ রাখুন'
                : 'Keep your blood group and location up to date'}
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'bn' ? 'প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile saved successfully!'}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 text-xs sm:text-sm">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'} *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 font-bold text-red-600"
              >
                {VALID_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'যাচাইকৃত ফোন নম্বর' : 'Verified Phone'}
              </label>
              <input
                type="text"
                value={user.phone}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'জন্ম তারিখ (বয়স যাচাইয়ের জন্য)' : 'Date of Birth'}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>

          {/* Location Hierarchy */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
              {language === 'bn' ? 'অবস্থান নির্বাচন (৬৪ জেলা ও উপজেলা)' : 'Location Selection'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  {language === 'bn' ? 'বিভাগ' : 'Division'}
                </label>
                <select
                  value={divisionId}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  {language === 'bn' ? 'জেলা' : 'District'}
                </label>
                <select
                  value={districtId}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium"
                >
                  {availableDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  {language === 'bn' ? 'উপজেলা' : 'Upazila'}
                </label>
                <select
                  value={upazilaId}
                  onChange={(e) => setUpazilaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium"
                >
                  {availableUpazilas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {language === 'bn' ? u.nameBn : u.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Donor Availability & Last Date */}
          <div className="bg-red-50/60 p-4 rounded-2xl border border-red-100 space-y-3">
            <h4 className="font-bold text-red-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" />
              <span>{language === 'bn' ? 'রক্তদান প্রাপ্যতা ও শেষ রক্তদানের তথ্য' : 'Donor Availability'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'বর্তমান স্ট্যাটাস' : 'Availability Status'}
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as DonorAvailability)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 bg-white font-semibold text-gray-800"
                >
                  <option value="available">
                    {language === 'bn' ? '✅ রক্তদানে প্রস্তুত (Available)' : '✅ Available'}
                  </option>
                  <option value="unavailable">
                    {language === 'bn' ? '❌ বর্তমানে রক্তদানে অক্ষম (Unavailable)' : '❌ Unavailable'}
                  </option>
                  <option value="temporarily_unavailable">
                    {language === 'bn' ? '⏳ সাময়িকভাবে অনুপলব্ধ (৩-৪ মাস)' : '⏳ Temporarily Unavailable'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'সর্বশেষ রক্তদানের তারিখ' : 'Last Donation Date'}
                </label>
                <input
                  type="date"
                  value={lastDonationDate}
                  onChange={(e) => setLastDonationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Privacy & Medical Consents */}
          <div className="space-y-2.5 pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={contactConsent}
                onChange={(e) => setContactConsent(e.target.checked)}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500"
              />
              <span>
                {language === 'bn'
                  ? 'জরুরী রক্তের প্রয়োজনে রক্তপ্রার্থী আমাকে যোগাযোগ করার অনুরোধ পাঠাতে পারবেন।'
                  : 'Allow emergency seekers to send me contact requests.'}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={medicalConsent}
                onChange={(e) => setMedicalConsent(e.target.checked)}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                required
              />
              <span>
                {language === 'bn'
                  ? 'আমি স্বীকার করছি যে রক্তদানের পূর্বে অনুমোদিত ল্যাব টেস্ট, স্ক্রিনিং ও চিকিৎসকের ছাড়পত্র গ্রহণ বাধ্যতামূলক।'
                  : 'I acknowledge that mandatory medical screening & cross-matching must precede any actual donation.'}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs"
              >
                {language === 'bn' ? 'লগআউট' : 'Sign Out'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনার অ্যাকাউন্ট সম্পূর্ণ মুছে ফেলতে চান?' : 'Are you sure you want to permanently delete your account?')) {
                    deleteAccount();
                    setShowProfileModal(false);
                  }
                }}
                className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'অ্যাকাউন্ট মুছুন' : 'Delete Account'}</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/25 transition cursor-pointer"
            >
              {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
