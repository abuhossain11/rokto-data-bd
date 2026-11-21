import React from 'react';
import { DonorProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getLocationName } from '../../data/bangladeshLocations';
import { MapPin, Calendar, Heart, ShieldCheck, Lock, ArrowRight, User } from 'lucide-react';

interface DonorCardProps {
  donor: DonorProfile;
  distanceKm?: number;
  onOpenDetails: (donor: DonorProfile) => void;
  onRequestContact?: (donor: DonorProfile) => void;
}

export const DonorCard: React.FC<DonorCardProps> = ({
  donor,
  distanceKm,
  onOpenDetails,
  onRequestContact,
}) => {
  const { language } = useLanguage();

  const locationStr = getLocationName(donor.divisionId, donor.districtId, donor.upazilaId, language);

  const availabilityLabels = {
    available: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: language === 'bn' ? 'রক্তদানে প্রস্তুত' : 'Available',
    },
    unavailable: {
      badge: 'bg-red-50 text-red-700 border-red-200',
      label: language === 'bn' ? 'অনুপলব্ধ' : 'Unavailable',
    },
    temporarily_unavailable: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      label: language === 'bn' ? 'সাময়িক অনুপলব্ধ' : 'Temporarily Unavailable',
    },
  };

  const avail = availabilityLabels[donor.availability] || availabilityLabels.available;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-red-600/25">
              {donor.bloodGroup}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {language === 'bn' ? 'স্বেচ্ছাসেবী রক্তদাতা' : 'Voluntary Donor'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${avail.badge}`}>
                  {avail.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                {language === 'bn' ? `মোট রক্তদান: ${donor.totalDonations} বার` : `Total Donations: ${donor.totalDonations}`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 mb-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="line-clamp-1">{locationStr}</span>
          </div>

          {distanceKm !== undefined && (
            <div className="flex items-center gap-2 text-red-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>
                {language === 'bn' ? `আনুমানিক দূরত্ব: ~${distanceKm} কি.মি.` : `Approx. Distance: ~${distanceKm} km`}
              </span>
            </div>
          )}

          {donor.lastDonationDate && (
            <div className="flex items-center gap-2 text-gray-500 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>
                {language === 'bn' ? 'সর্বশেষ রক্তদান:' : 'Last Donated:'} {donor.lastDonationDate}
              </span>
            </div>
          )}
        </div>

        {/* Privacy protected tag */}
        <div className="mb-4 py-1.5 px-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-1.5 text-[11px] text-gray-500">
          <Lock className="w-3 h-3 text-gray-400 shrink-0" />
          <span>
            {language === 'bn'
              ? 'মোবাইল নম্বর ও সঠিক ঠিকানা সুরক্ষিত'
              : 'Phone & exact GPS guarded for privacy'}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenDetails(donor)}
          className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{language === 'bn' ? 'প্রোফাইল ও যোগাযোগ' : 'View & Request Contact'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
