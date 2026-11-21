import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DIVISIONS, DISTRICTS, getDistrictsByDivision, getUpazilasByDistrict, getDistrictById } from '../../data/bangladeshLocations';
import { VALID_BLOOD_GROUPS, normalizeBangladeshPhone } from '../../services/validationService';
import { BloodGroup } from '../../types';
import { X, PlusCircle, AlertCircle, Calendar, Hospital as HospitalIcon, CheckCircle2 } from 'lucide-react';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, isAuthenticated, setShowLoginModal } = useAuth();
  const { createBloodRequest, hospitals } = useData();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('A+');
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [divisionId, setDivisionId] = useState('dhaka');
  const [districtId, setDistrictId] = useState('dhaka');
  const [upazilaId, setUpazilaId] = useState('dhanmondi');
  const [requiredDateTime, setRequiredDateTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 6);
    return d.toISOString().slice(0, 16);
  });
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'normal'>('critical');
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

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

  // Quick hospital fill if user picks from verified list
  const handleSelectPredefinedHospital = (hospId: string) => {
    const hosp = hospitals.find((h) => h.id === hospId);
    if (hosp) {
      setHospitalName(language === 'bn' ? hosp.nameBn : hosp.nameEn);
      setHospitalAddress(hosp.address);
      setDivisionId(hosp.divisionId);
      setDistrictId(hosp.districtId);
      setUpazilaId(hosp.upazilaId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    const phoneValidation = normalizeBangladeshPhone(contactNumber);
    if (!phoneValidation.isValid) {
      setErrorMsg(phoneValidation.error || 'সঠিক ফোন নম্বর প্রদান করুন');
      return;
    }

    const distObj = getDistrictById(districtId);
    const lat = distObj ? distObj.lat : 23.8103;
    const lng = distObj ? distObj.lng : 90.4125;

    // Check if the hospital is in verified list
    const isVerifiedHospital = hospitals.some(
      (h) => h.status === 'verified' && (h.nameEn.toLowerCase() === hospitalName.toLowerCase() || h.nameBn === hospitalName)
    );

    const res = await createBloodRequest({
      requesterId: user.id,
      requesterName: user.fullName,
      requesterPhone: phoneValidation.normalized,
      patientName: patientName.trim() || undefined,
      bloodGroup,
      unitsRequired: Math.min(10, Math.max(1, unitsRequired)),
      hospitalName,
      hospitalAddress,
      divisionId,
      districtId,
      upazilaId,
      lat,
      lng,
      requiredDateTime,
      urgency,
      additionalInfo,
      status: 'finding_donors',
      isHospitalVerified: isVerifiedHospital,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'আবেদন প্রকাশ করা সম্ভব হয়নি');
      return;
    }

    showToast({
      type: 'success',
      title: language === 'bn' ? 'জরুরী আবেদন সফলভাবে প্রকাশিত হয়েছে!' : 'Emergency request broadcasted!',
      message: language === 'bn' ? 'নিকটবর্তী নিবন্ধিত রক্তদাতাদের নোটিফিকেশন পাঠানো হয়েছে।' : 'Alert sent to matching voluntary donors.',
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative border border-gray-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-950">
              {t.request.createTitle}
            </h3>
            <p className="text-xs text-gray-500">
              {language === 'bn'
                ? 'অনুরোধটি তাৎক্ষণিকভাবে এলাকার রক্তদাতাদের কাছে পৌঁছাবে'
                : 'Will broadcast to matching donors in the radius'}
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              {language === 'bn'
                ? 'আবেদন সফলভাবে প্রকাশিত হয়েছে! মিল থাকা রক্তদাতাদের বিজ্ঞপ্তি পাঠানো হয়েছে।'
                : 'Request published successfully! Matching donors alerted.'}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Quick Pre-fill from verified hospital */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              {language === 'bn' ? 'যাচাইকৃত হাসপাতাল তালিকা থেকে বেছে নিন (ঐচ্ছিক)' : 'Select from Verified Hospital (Optional)'}
            </label>
            <select
              onChange={(e) => handleSelectPredefinedHospital(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700"
            >
              <option value="">
                {language === 'bn' ? '-- তালিকায় থাকা হাসপাতাল বেছে নিন --' : '-- Choose hospital --'}
              </option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {language === 'bn' ? h.nameBn : h.nameEn} ({h.licenseNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {t.request.bloodGroup} *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 font-bold text-red-600 text-base"
                required
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
                {t.request.units} *
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={unitsRequired}
                onChange={(e) => setUnitsRequired(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {t.request.hospitalName} *
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল' : 'e.g., Dhaka Medical College'}
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {t.request.patientName}
              </label>
              <input
                type="text"
                placeholder={t.request.patientNameOpt}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
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

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {t.request.hospitalAddress} *
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'হাসপাতালের সঠিক ঠিকানা, ওয়ার্ড/কেবিন ও বেড নম্বর' : 'Ward / Bed / Floor'}
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {t.request.dateTime} *
              </label>
              <input
                type="datetime-local"
                value={requiredDateTime}
                onChange={(e) => setRequiredDateTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {t.request.urgency} *
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as 'critical' | 'high' | 'normal')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 font-semibold"
              >
                <option value="critical">{t.request.urgencyCritical}</option>
                <option value="high">{t.request.urgencyHigh}</option>
                <option value="normal">{t.request.urgencyNormal}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t.request.contactPhone} *
            </label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="01712345678"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t.request.additionalNotes}
            </label>
            <textarea
              rows={2}
              placeholder={language === 'bn' ? 'রোগের বিবরণ, হিমোগ্লোবিন বা প্লাটিলেটের প্রয়োজনীয়তা ইত্যাদি' : 'Special clinical instructions'}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/30 transition active:scale-98 cursor-pointer"
            >
              {t.request.submitBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
