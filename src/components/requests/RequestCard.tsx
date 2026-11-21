import React from 'react';
import { BloodRequest } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getLocationName } from '../../data/bangladeshLocations';
import { Hospital, MapPin, Clock, Users, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

interface RequestCardProps {
  request: BloodRequest;
  onOpenDetails: (request: BloodRequest) => void;
  onQuickDonate?: (request: BloodRequest) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onOpenDetails, onQuickDonate }) => {
  const { language } = useLanguage();

  const locationStr = getLocationName(request.divisionId, request.districtId, request.upazilaId, language);

  const urgencyColors = {
    critical: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
    high: 'bg-amber-100 text-amber-800 border-amber-200',
    normal: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const statusLabels: Record<string, { bn: string; en: string }> = {
    submitted: { bn: 'জমা হয়েছে', en: 'Submitted' },
    under_review: { bn: 'পর্যালোচনাধীন', en: 'Under Review' },
    finding_donors: { bn: 'রক্তদাতা খোঁজা হচ্ছে', en: 'Finding Donors' },
    donor_responded: { bn: 'রক্তদাতা সাড়া দিয়েছেন', en: 'Donor Responded' },
    completed: { bn: 'রক্তদান সম্পন্ন', en: 'Completed' },
    cancelled: { bn: 'বাতিলকৃত', en: 'Cancelled' },
    expired: { bn: 'মেয়াদোত্তীর্ণ', en: 'Expired' },
  };

  const statusObj = statusLabels[request.status] || { bn: request.status, en: request.status };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-red-600/25">
              {request.bloodGroup}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-gray-900">
                  {request.unitsRequired} {language === 'bn' ? 'ব্যাগ রক্ত প্রয়োজন' : 'Units Needed'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    urgencyColors[request.urgency]
                  }`}
                >
                  {request.urgency === 'critical'
                    ? (language === 'bn' ? 'জরুরী' : 'Critical')
                    : request.urgency === 'high'
                    ? (language === 'bn' ? 'অগ্রাধিকার' : 'High')
                    : (language === 'bn' ? 'সাধারণ' : 'Normal')}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {language === 'bn' ? statusObj.bn : statusObj.en}
              </p>
            </div>
          </div>

          {/* Hospital Verification Tag */}
          <div>
            {request.isHospitalVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>{language === 'bn' ? 'হাসপাতাল যাচাইকৃত' : 'Hospital Verified'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>{language === 'bn' ? 'যাচাই প্রক্রিয়াধীন' : 'Under Verification'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Hospital & Location */}
        <div className="space-y-1.5 mb-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Hospital className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-semibold text-gray-900 line-clamp-1">
              {request.hospitalName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="line-clamp-1">{locationStr}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span>
              {language === 'bn' ? 'প্রয়োজনের সময়:' : 'Needed By:'}{' '}
              {new Date(request.requiredDateTime).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {request.additionalInfo && (
          <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-4">
            "{request.additionalInfo}"
          </p>
        )}
      </div>

      {/* Footer info & CTA */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="w-3.5 h-3.5 text-red-500" />
          <span>
            {request.responsesCount} {language === 'bn' ? 'জন সাড়া দিয়েছেন' : 'responded'}
          </span>
        </div>

        <button
          onClick={() => onOpenDetails(request)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-xs font-bold transition cursor-pointer"
        >
          <span>{language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
