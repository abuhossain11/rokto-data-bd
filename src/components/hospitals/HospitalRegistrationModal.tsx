import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DIVISIONS, getDistrictsByDivision, getUpazilasByDistrict, getDistrictById } from '../../data/bangladeshLocations';
import { normalizeBangladeshPhone } from '../../services/validationService';
import { X, Hospital as HospitalIcon, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface HospitalRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HospitalRegistrationModal: React.FC<HospitalRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { registerHospital } = useData();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [divisionId, setDivisionId] = useState('dhaka');
  const [districtId, setDistrictId] = useState('dhaka');
  const [upazilaId, setUpazilaId] = useState('dhanmondi');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [documentName, setDocumentName] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const phoneValidation = normalizeBangladeshPhone(contactPhone);
    if (!phoneValidation.isValid) {
      setErrorMsg(phoneValidation.error || 'সঠিক ফোন নম্বর দিন');
      return;
    }

    if (!licenseNumber.trim()) {
      setErrorMsg('স্বাস্থ্য অধিদপ্তর (DGHS) লাইসেন্স নম্বর প্রদান করুন');
      return;
    }

    const distObj = getDistrictById(districtId);
    const lat = distObj ? distObj.lat : 23.8103;
    const lng = distObj ? distObj.lng : 90.4125;

    await registerHospital({
      nameEn,
      nameBn: nameBn || nameEn,
      licenseNumber,
      address,
      divisionId,
      districtId,
      upazilaId,
      contactPhone: phoneValidation.normalized,
      contactEmail,
      lat,
      lng,
      verificationDocumentUrl: documentName ? `/docs/${documentName}` : undefined,
    });

    showToast({
      type: 'success',
      title: language === 'bn' ? 'হাসপাতাল নিবন্ধন আবেদন জমা হয়েছে!' : 'Hospital Registration Submitted!',
      message: language === 'bn' ? 'অ্যাডমিন প্যানেল থেকে লাইসেন্স যাচাই করা হবে।' : 'Queued for DGHS license review by system admin.',
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
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
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <HospitalIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-950">
              {language === 'bn' ? 'হাসপাতাল ও ক্লিনিক নিবন্ধন' : 'Hospital Registration'}
            </h3>
            <p className="text-xs text-gray-500">
              {language === 'bn'
                ? 'অনুমোদিত হাসপাতাল হিসেবে তালিকাভুক্ত হয়ে জরুরী রক্তের আবেদন পাঠান'
                : 'Register as verified healthcare provider with DGHS license'}
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              {language === 'bn'
                ? 'হাসপাতাল আবেদন সফলভাবে জমা হয়েছে। কেন্দ্রীয় প্রশাসন যাচাই শেষে অনুমোদন করবে।'
                : 'Registration submitted! Admin review in progress.'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'হাসপাতালের নাম (ইংরেজি)' : 'Hospital Name (English)'} *
              </label>
              <input
                type="text"
                placeholder="e.g. Dhaka Medical College Hospital"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'হাসপাতালের নাম (বাংলা)' : 'Hospital Name (Bengali)'}
              </label>
              <input
                type="text"
                placeholder="যেমন: ঢাকা মেডিকেল কলেজ ও হাসপাতাল"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'DGHS লাইসেন্স নম্বর' : 'DGHS License Number'} *
              </label>
              <input
                type="text"
                placeholder="DGHS-HOSP-XXXXX"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'জরুরী যোগাযোগ নম্বর' : 'Authorized Contact Phone'} *
              </label>
              <input
                type="tel"
                placeholder="01712345678"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono"
                required
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
                {language === 'bn' ? 'অফিসিয়াল ঠিকানা' : 'Official Hospital Address'} *
              </label>
              <input
                type="text"
                placeholder="রোড, সেক্টর, পোস্টাল কোড ইত্যাদি"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'অফিসিয়াল ইমেইল' : 'Official Email'}
              </label>
              <input
                type="email"
                placeholder="hospital@domain.gov.bd"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'DGHS অনুমোদন কপি / লাইসেন্স ফাইল' : 'Verification Document (PDF/JPG)'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDocumentName(e.target.files[0].name);
                    }
                  }}
                  className="text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition active:scale-98 cursor-pointer"
            >
              {language === 'bn' ? 'নিবন্ধন আবেদন জমা দিন' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
