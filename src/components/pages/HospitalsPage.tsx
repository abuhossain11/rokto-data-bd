import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { getLocationName } from '../../data/bangladeshLocations';
import { getExternalRouteUrl } from '../../services/locationService';
import { HospitalRegistrationModal } from '../hospitals/HospitalRegistrationModal';
import {
  Hospital as HospitalIcon,
  PlusCircle,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const HospitalsPage: React.FC = () => {
  const { language } = useLanguage();
  const { hospitals } = useData();

  const [showRegModal, setShowRegModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHospitals = hospitals.filter((h) => {
    const term = searchTerm.toLowerCase();
    return (
      h.nameEn.toLowerCase().includes(term) ||
      h.nameBn.includes(term) ||
      h.licenseNumber.toLowerCase().includes(term) ||
      h.address.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
            {language === 'bn' ? 'যাচাইকৃত হাসপাতাল ও স্বাস্থ্যসেবা কেন্দ্র' : 'Verified Hospital Network'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'স্বাস্থ্য অধিদপ্তর (DGHS) লাইসেন্সপ্রাপ্ত অনুমোদিত হাসপাতাল তালিকা'
              : 'Official healthcare partners licensed by Directorate General of Health Services (DGHS)'}
          </p>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'bn' ? 'হাসপাতাল নিবন্ধন করুন' : 'Register Hospital'}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={language === 'bn' ? 'হাসপাতালের নাম বা লাইসেন্স দিয়ে খুঁজুন...' : 'Search by name or license...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs sm:text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-hidden"
        />
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map((hosp) => {
          const locationStr = getLocationName(hosp.divisionId, hosp.districtId, hosp.upazilaId, language);
          const routeUrl = getExternalRouteUrl(hosp.lat, hosp.lng);

          return (
            <div
              key={hosp.id}
              className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <HospitalIcon className="w-6 h-6" />
                  </div>

                  <div>
                    {hosp.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'bn' ? 'DGHS যাচাইকৃত' : 'DGHS Verified'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span>{language === 'bn' ? 'যাচাই প্রক্রিয়াধীন' : 'Pending Review'}</span>
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-black text-gray-900 mb-1 leading-snug">
                  {language === 'bn' ? hosp.nameBn : hosp.nameEn}
                </h3>
                <p className="text-xs text-gray-400 font-medium mb-3">
                  {language === 'bn' ? hosp.nameEn : hosp.nameBn}
                </p>

                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span>{hosp.address}, {locationStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-mono font-medium">{hosp.contactPhone}</span>
                  </div>

                  {hosp.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-mono">{hosp.contactEmail}</span>
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      {language === 'bn' ? 'লাইসেন্স নম্বর:' : 'DGHS License:'}
                    </span>
                    <span className="font-mono font-bold text-gray-800 text-[11px]">
                      {hosp.licenseNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${hosp.contactPhone}`}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'কল' : 'Call'}</span>
                </a>

                <a
                  href={routeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>{language === 'bn' ? 'ম্যাপে অবস্থান' : 'Directions'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <HospitalRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
      />
    </div>
  );
};
