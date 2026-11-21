import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useData, MatchedDonorResult } from '../../context/DataContext';
import {
  DIVISIONS,
  getDistrictsByDivision,
  getUpazilasByDistrict,
  getDistrictById,
} from '../../data/bangladeshLocations';
import { VALID_BLOOD_GROUPS } from '../../services/validationService';
import { BloodGroup, DonorProfile } from '../../types';
import { DonorCard } from '../donors/DonorCard';
import { BangladeshMap, MapMarkerItem } from '../map/BangladeshMap';
import {
  getUserApproximateLocation,
  findNearestDistrict,
} from '../../services/locationService';
import {
  Search,
  Filter,
  RotateCcw,
  List,
  Map as MapIcon,
  MapPin,
  Navigation,
  ShieldAlert,
  Heart,
  Loader2,
  AlertCircle,
  Crosshair,
  CheckCircle,
} from 'lucide-react';

interface FindDonorsPageProps {
  initialBloodGroup?: BloodGroup;
  onOpenDonorDetails: (donor: DonorProfile) => void;
}

export const FindDonorsPage: React.FC<FindDonorsPageProps> = ({
  initialBloodGroup,
  onOpenDonorDetails,
}) => {
  const { language, t } = useLanguage();
  const { searchDonorsAsync, donors, isSearchingDonors, donorSearchError } = useData();

  // Filter States
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>(initialBloodGroup || '');
  const [divisionId, setDivisionId] = useState<string>('');
  const [districtId, setDistrictId] = useState<string>('');
  const [upazilaId, setUpazilaId] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(10); // default 10 KM per prompt
  const [availabilityStatus, setAvailabilityStatus] = useState<'all' | 'available' | 'temporarily_unavailable'>('available');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Geolocation & Manual Location state
  const [locationMode, setLocationMode] = useState<'manual' | 'gps'>('manual');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Search Results & loading
  const [searchResults, setSearchResults] = useState<MatchedDonorResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const availableDistricts = useMemo(() => {
    return divisionId ? getDistrictsByDivision(divisionId) : [];
  }, [divisionId]);

  const availableUpazilas = useMemo(() => {
    return districtId ? getUpazilasByDistrict(districtId) : [];
  }, [districtId]);

  // Execute Search
  const runSearch = useCallback(async () => {
    let lat: number | undefined;
    let lng: number | undefined;

    if (locationMode === 'gps' && gpsCoordinates) {
      lat = gpsCoordinates.lat;
      lng = gpsCoordinates.lng;
    } else if (districtId) {
      const dist = getDistrictById(districtId);
      if (dist) {
        lat = dist.lat;
        lng = dist.lng;
      }
    }

    const results = await searchDonorsAsync({
      bloodGroup: bloodGroup || undefined,
      divisionId: divisionId || undefined,
      districtId: districtId || undefined,
      upazilaId: upazilaId || undefined,
      radiusKm,
      availableOnly: availabilityStatus === 'available',
      availabilityStatus,
      userLat: lat,
      userLng: lng,
    });

    setSearchResults(results);
    setHasSearched(true);
  }, [
    searchDonorsAsync,
    bloodGroup,
    divisionId,
    districtId,
    upazilaId,
    radiusKm,
    availabilityStatus,
    locationMode,
    gpsCoordinates,
  ]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const handleDivisionChange = (div: string) => {
    setDivisionId(div);
    setDistrictId('');
    setUpazilaId('');
  };

  const handleDistrictChange = (dist: string) => {
    setDistrictId(dist);
    setUpazilaId('');
  };

  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    setGpsError(null);
    try {
      const loc = await getUserApproximateLocation();
      setGpsCoordinates({ lat: loc.lat, lng: loc.lng });
      setLocationMode('gps');

      // Auto-identify nearest district in Bangladesh
      const nearest = findNearestDistrict(loc.lat, loc.lng);
      if (nearest.district) {
        setDivisionId(nearest.district.divisionId);
        setDistrictId(nearest.district.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'অবস্থান শনাক্ত করা যায়নি';
      setGpsError(msg);
      setLocationMode('manual');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleReset = () => {
    setBloodGroup('');
    setDivisionId('');
    setDistrictId('');
    setUpazilaId('');
    setRadiusKm(10);
    setAvailabilityStatus('available');
    setLocationMode('manual');
    setGpsCoordinates(null);
    setGpsError(null);
  };

  // Center coordinate for map view
  const mapCenter: [number, number] = useMemo(() => {
    if (locationMode === 'gps' && gpsCoordinates) {
      return [gpsCoordinates.lat, gpsCoordinates.lng];
    }
    if (districtId) {
      const dist = getDistrictById(districtId);
      if (dist) return [dist.lat, dist.lng];
    }
    return [23.8103, 90.4125]; // Dhaka centroid
  }, [locationMode, gpsCoordinates, districtId]);

  // Map markers with approximate privacy-protected coordinates
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return searchResults.map(({ donor, distanceKm }) => ({
      id: donor.id,
      lat: donor.approxLat,
      lng: donor.approxLng,
      title: `${donor.bloodGroup} Voluntary Donor`,
      subtitle: `${language === 'bn' ? 'মোট রক্তদান:' : 'Donations:'} ${donor.totalDonations} ${language === 'bn' ? 'বার' : 'times'} (~${distanceKm} km)`,
      badgeText: donor.bloodGroup,
      type: 'donor',
      isApproximate: true,
    }));
  }, [searchResults, language]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & View Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
            {t.search.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'সারাদেশের ৮ বিভাগ ও ৬৪ জেলায় রক্তদাতা খুঁজুন (সুপাবেস ও পোস্টজিআইএস নির্ভর)'
              : 'Find voluntary blood donors across all 8 divisions and 64 districts with PostGIS distance matching'}
          </p>
        </div>

        {/* View Toggle (List vs Map) */}
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>{t.search.viewList}</span>
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>{t.search.viewMap}</span>
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
        {/* Blood Group Quick Buttons */}
        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
            {t.search.bloodGroup} (৮টি রক্তের গ্রুপ)
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setBloodGroup('')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                bloodGroup === ''
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.search.allGroups}
            </button>
            {VALID_BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setBloodGroup(bg)}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs font-mono transition cursor-pointer ${
                  bloodGroup === bg
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25 scale-105'
                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Location Selection Method Toggle (GPS with consent vs Manual) */}
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                {language === 'bn' ? 'লোকেশন নির্ধারণ পদ্ধতি:' : 'Location Mode:'}
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                <button
                  onClick={() => setLocationMode('manual')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    locationMode === 'manual' ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-600'
                  }`}
                >
                  {language === 'bn' ? 'ম্যানুয়াল নির্বাচন' : 'Manual Pick'}
                </button>
                <button
                  onClick={() => {
                    setLocationMode('gps');
                    if (!gpsCoordinates) handleDetectGps();
                  }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    locationMode === 'gps' ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-600'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-red-600" />
                  <span>{language === 'bn' ? 'বর্তমান জিপিএস' : 'GPS Device'}</span>
                </button>
              </div>
            </div>

            {locationMode === 'gps' && (
              <button
                onClick={handleDetectGps}
                disabled={isDetectingGps}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-800 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60 self-start sm:self-auto"
              >
                <Navigation className={`w-3.5 h-3.5 text-red-600 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>
                  {isDetectingGps
                    ? (language === 'bn' ? 'শনাক্ত হচ্ছে...' : 'Detecting...')
                    : (language === 'bn' ? 'পুনরায় সনাক্ত করুন' : 'Refresh GPS')}
                </span>
              </button>
            )}
          </div>

          {gpsCoordinates && locationMode === 'gps' && (
            <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === 'bn'
                  ? `সম্মতি ভিত্তিক আনুমানিক অবস্থান প্রাপ্ত হয়েছে: (${gpsCoordinates.lat.toFixed(4)}, ${gpsCoordinates.lng.toFixed(4)})`
                  : `Consent-based approximate location active: (${gpsCoordinates.lat.toFixed(4)}, ${gpsCoordinates.lng.toFixed(4)})`}
              </span>
            </div>
          )}

          {gpsError && (
            <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
          )}
        </div>

        {/* Cascading Administrative Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          {/* Division */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t.search.division}
            </label>
            <select
              value={divisionId}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 font-medium"
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
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t.search.district}
            </label>
            <select
              value={districtId}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!divisionId}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 font-medium disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{t.search.allDistricts}</option>
              {availableDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'bn' ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t.search.upazila}
            </label>
            <select
              value={upazilaId}
              onChange={(e) => setUpazilaId(e.target.value)}
              disabled={!districtId}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 font-medium disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{t.search.allUpazilas}</option>
              {availableUpazilas.map((u) => (
                <option key={u.id} value={u.id}>
                  {language === 'bn' ? u.nameBn : u.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-filters: PostGIS Radius & Availability Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Radius options: 5, 10, 20, 50 KM */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">
                {language === 'bn' ? 'পোস্টজিআইএস ব্যাসার্ধ:' : 'PostGIS Radius:'}
              </span>
              <div className="flex items-center gap-1">
                {[5, 10, 20, 50].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusKm(r)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer font-mono ${
                      radiusKm === r
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {r} KM
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-700">
                {language === 'bn' ? 'প্রাপ্যতা:' : 'Availability:'}
              </span>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as 'all' | 'available' | 'temporarily_unavailable')}
                className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white font-semibold text-gray-800"
              >
                <option value="available">{language === 'bn' ? 'রক্তদানে প্রস্তুত (Available Only)' : 'Available Only'}</option>
                <option value="temporarily_unavailable">{language === 'bn' ? 'সাময়িক অনুপলব্ধ' : 'Temporarily Unavailable'}</option>
                <option value="all">{language === 'bn' ? 'সকল অবস্থা (All)' : 'All Status'}</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="text-gray-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.search.resetBtn}</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-2.5">
        <MapPin className="w-4 h-4 text-red-600 shrink-0" />
        <span>
          {language === 'bn'
            ? 'গোপনীয়তা সুরক্ষা: রক্তদাতাদের সার্বক্ষণিক ট্র্যাক করা হয় না এবং সঠিক বাড়ির জিপিএস লোকেশন দেখানো হয় না। নিরাপত্তা বিধির আওতায় আনুমানিক দূরত্ব ও এলাকা প্রদর্শিত হয়।'
            : 'Privacy Safeguard: Donors are never continuously tracked and exact home GPS coordinates are never published.'}
        </span>
      </div>

      {/* Error State Banner */}
      {donorSearchError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{donorSearchError}</span>
          </div>
          <button
            onClick={runSearch}
            className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition cursor-pointer"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* SEARCH LOADING STATE */}
      {isSearchingDonors && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
              </div>
              <div className="h-9 bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* MAP VIEW */}
      {!isSearchingDonors && viewMode === 'map' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs">
            <BangladeshMap
              center={mapCenter}
              zoom={districtId || (locationMode === 'gps' && gpsCoordinates) ? 12 : 8}
              radiusKm={radiusKm}
              markers={mapMarkers}
              onSelectMarker={(id) => {
                const item = donors.find((d) => d.id === id);
                if (item) onOpenDonorDetails(item);
              }}
              className="h-[520px] w-full rounded-2xl shadow-inner"
            />
          </div>
          <p className="text-center text-xs text-gray-400">
            OpenStreetMap Bangladesh &copy; Contributors
          </p>
        </div>
      )}

      {/* LIST VIEW */}
      {!isSearchingDonors && viewMode === 'list' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-700">
              {language === 'bn'
                ? `পাওয়া গেছে: ${searchResults.length} জন রক্তদাতা (${radiusKm} কি.মি. ব্যাসার্ধ)`
                : `Found: ${searchResults.length} donors (${radiusKm} KM radius)`}
            </span>
          </div>

          {/* EMPTY STATE */}
          {hasSearched && searchResults.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {t.search.noDonorsFound}
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                  {language === 'bn'
                    ? `বর্তমান ফিল্টারে (${radiusKm} কি.মি.) ডাটাবেসে কোনো নিবন্ধিত রক্তদাতা পাওয়া যায়নি। নিরাপত্তা ও সত্যতার জন্য কোনো কাল্পনিক বা ডেমো রক্তদাতা দেখানো হয় না। ব্যাসার্ধ বাড়িয়ে চেষ্টা করুন বা নিজেই রক্তদাতা হিসেবে নিবন্ধন করুন।`
                    : `No real registered donors found in the database within ${radiusKm} KM. Mock/fake donor profiles are strictly disabled. Try expanding the radius or registering as a donor.`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setRadiusKm(50)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  {language === 'bn' ? '৫০ কি.মি. ব্যাসার্ধে খুঁজুন' : 'Search 50 KM Radius'}
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
              {searchResults.map(({ donor, distanceKm }) => (
                <DonorCard
                  key={donor.id}
                  donor={donor}
                  distanceKm={distanceKm}
                  onOpenDetails={onOpenDonorDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
