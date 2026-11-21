import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { VALID_BLOOD_GROUPS } from '../../services/validationService';
import { BloodGroup, BloodRequest, RequestStatus } from '../../types';
import { RequestCard } from '../requests/RequestCard';
import { DIVISIONS, DISTRICTS, getDistrictsByDivision } from '../../data/bangladeshLocations';
import { PlusCircle, Filter, RotateCcw, Droplets, CheckCircle2 } from 'lucide-react';

interface EmergencyRequestsPageProps {
  openCreateRequest: () => void;
  onOpenRequestDetails: (req: BloodRequest) => void;
}

export const EmergencyRequestsPage: React.FC<EmergencyRequestsPageProps> = ({
  openCreateRequest,
  onOpenRequestDetails,
}) => {
  const { language, t } = useLanguage();
  const { requests } = useData();

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | ''>('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  const availableDistricts = selectedDivision ? getDistrictsByDivision(selectedDivision) : [];

  const filteredRequests = requests.filter((r) => {
    if (selectedGroup && r.bloodGroup !== selectedGroup) return false;
    if (selectedUrgency && r.urgency !== selectedUrgency) return false;
    if (selectedDivision && r.divisionId !== selectedDivision) return false;
    if (selectedDistrict && r.districtId !== selectedDistrict) return false;

    if (selectedStatus === 'active') {
      return r.status === 'finding_donors' || r.status === 'donor_responded' || r.status === 'submitted';
    }
    if (selectedStatus === 'completed') {
      return r.status === 'completed';
    }
    if (selectedStatus === 'cancelled') {
      return r.status === 'cancelled';
    }
    if (selectedStatus === 'expired') {
      return r.status === 'expired';
    }
    return true; // 'all'
  });

  const handleReset = () => {
    setSelectedGroup('');
    setSelectedUrgency('');
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedStatus('active');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
            {language === 'bn' ? 'জরুরী রক্তের আবেদনসমূহ' : 'Emergency Blood Requests'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'হাসপাতাল ও পরিবারের জরুরী রক্তের আবেদন পর্যালোচনা করুন এবং রক্তদানে এগিয়ে আসুন'
              : 'Review hospital and patient emergency requests and respond to save a life'}
          </p>
        </div>

        <button
          onClick={openCreateRequest}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.hero.requestBloodBtn}</span>
        </button>
      </div>

      {/* Filter row */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Blood group */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {t.search.bloodGroup}
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as BloodGroup)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 font-bold text-red-600 bg-white"
            >
              <option value="">{t.search.allGroups}</option>
              {VALID_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {language === 'bn' ? 'জরুরিতা মাত্রা' : 'Urgency'}
            </label>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 font-semibold bg-white"
            >
              <option value="">{language === 'bn' ? 'সকল মাত্রা' : 'All Urgencies'}</option>
              <option value="critical">{t.request.urgencyCritical}</option>
              <option value="high">{t.request.urgencyHigh}</option>
              <option value="normal">{t.request.urgencyNormal}</option>
            </select>
          </div>

          {/* Division */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {t.search.division}
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setSelectedDistrict('');
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="">{t.search.allDivisions}</option>
              {DIVISIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'bn' ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {t.search.district}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedDivision}
              className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 font-medium bg-white disabled:bg-gray-50"
            >
              <option value="">{t.search.allDistricts}</option>
              {availableDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'bn' ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {language === 'bn' ? 'আবেদনের অবস্থা' : 'Status'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 font-semibold bg-white"
            >
              <option value="active">{language === 'bn' ? 'সক্রিয় আবেদনসমূহ' : 'Active Only'}</option>
              <option value="completed">{language === 'bn' ? 'রক্তদান সম্পন্ন' : 'Completed'}</option>
              <option value="cancelled">{language === 'bn' ? 'বাতিলকৃত' : 'Cancelled'}</option>
              <option value="expired">{language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired'}</option>
              <option value="all">{language === 'bn' ? 'সকল আবেদন' : 'All Requests'}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
          <span className="font-bold text-gray-700 font-mono tabular-nums">
            {language === 'bn'
              ? `মোট পাওয়া গেছে: ${filteredRequests.length} টি আবেদন`
              : `Found: ${filteredRequests.length} requests`}
          </span>

          {(selectedGroup || selectedUrgency || selectedDivision || selectedDistrict || selectedStatus !== 'active') && (
            <button
              onClick={handleReset}
              className="text-gray-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.search.resetBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Request Grid */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-4">
          <Droplets className="w-12 h-12 text-red-200 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {language === 'bn' ? 'বর্তমানে কোনো সক্রিয় রক্তের আবেদন নেই' : 'No blood requests found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {language === 'bn'
                ? 'ফিল্টার রিসেট করে দেখুন অথবা জরুরী রক্তের প্রয়োজনে নতুন আবেদন প্রকাশ করুন। কোনো ভুয়া বা ডেমো আবেদন এখানে দেখানো হয় না।'
                : 'Try resetting your filters or create a new emergency request. No mock requests are displayed.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={openCreateRequest}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.hero.requestBloodBtn}</span>
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
            >
              {t.search.resetBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onOpenDetails={onOpenRequestDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
