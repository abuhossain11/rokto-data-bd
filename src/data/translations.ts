export interface Translations {
  appName: string;
  appTagline: string;
  nav: {
    home: string;
    findDonors: string;
    requestBlood: string;
    hospitals: string;
    notifications: string;
    dashboard: string;
    admin: string;
    login: string;
    logout: string;
    profile: string;
    about: string;
    howItWorks: string;
    safety: string;
    faq: string;
    disclaimer: string;
    privacy: string;
    terms: string;
    contact: string;
    feedback: string;
  };
  hero: {
    badge: string;
    titlePart1: string;
    titleHighlight: string;
    titlePart2: string;
    subtitle: string;
    searchBloodPlaceholder: string;
    findDonorsBtn: string;
    requestBloodBtn: string;
    becomeDonorBtn: string;
  };
  stats: {
    title: string;
    subtitle: string;
    activeDonors: string;
    emergencyRequests: string;
    verifiedHospitals: string;
    districtsCovered: string;
    realDataNotice: string;
  };
  search: {
    title: string;
    bloodGroup: string;
    allGroups: string;
    division: string;
    district: string;
    upazila: string;
    allDivisions: string;
    allDistricts: string;
    allUpazilas: string;
    radius: string;
    availableOnly: string;
    searchBtn: string;
    resetBtn: string;
    viewList: string;
    viewMap: string;
    noDonorsFound: string;
    approxDistance: string;
    contactDonor: string;
  };
  request: {
    createTitle: string;
    patientName: string;
    patientNameOpt: string;
    bloodGroup: string;
    units: string;
    hospitalName: string;
    hospitalAddress: string;
    dateTime: string;
    urgency: string;
    urgencyCritical: string;
    urgencyHigh: string;
    urgencyNormal: string;
    contactPhone: string;
    additionalNotes: string;
    submitBtn: string;
    status: string;
    verifiedBadge: string;
    unverifiedBadge: string;
    responses: string;
    iCanDonate: string;
    alreadyResponded: string;
  };
  disclaimer: {
    bannerTitle: string;
    bannerText: string;
    pageTitle: string;
    readMore: string;
  };
}

export const translations: Record<'bn' | 'en', Translations> = {
  bn: {
    appName: 'রক্তদাতা',
    appTagline: 'এক ফোঁটা রক্ত, বাঁচাতে পারে একটি জীবন।',
    nav: {
      home: 'মূলপাতা',
      findDonors: 'রক্তদাতা খুঁজুন',
      requestBlood: 'জরুরী রক্তের আবেদন',
      hospitals: 'হাসপাতালসমূহ',
      notifications: 'বিজ্ঞপ্তি',
      dashboard: 'আমার ড্যাশবোর্ড',
      admin: 'প্রশাসন প্যানেল',
      login: 'লগইন / নিবন্ধন',
      logout: 'লগআউট',
      profile: 'প্রোফাইল',
      about: 'আমাদের সম্পর্কে',
      howItWorks: 'কীভাবে কাজ করে',
      safety: 'নিরাপত্তা নির্দেশিকা',
      faq: 'সাধারণ জিজ্ঞাসা',
      disclaimer: 'মেডিকেল সতর্কতা',
      privacy: 'গোপনীয়তা নীতি',
      terms: 'শর্তাবলী',
      contact: 'যোগাযোগ',
      feedback: 'ফিডব্যাক',
    },
    hero: {
      badge: 'সারাদেশে ৮ বিভাগ ও ৬৪ জেলায় স্বেচ্ছাসেবী নেটওয়ার্ক',
      titlePart1: 'জরুরী প্রয়োজনে পাশে আছে',
      titleHighlight: 'স্বেচ্ছাসেবী রক্তদাতারা',
      titlePart2: 'মুহূর্তেই খুঁজে নিন আপনার এলাকায়',
      subtitle: 'রক্তদাতা একটি অলাভজনক ও স্বচ্ছ প্ল্যাটফর্ম যা জরুরী রক্তের প্রয়োজনে রোগী ও নিবন্ধিত রক্তদাতাদের তাৎক্ষণিকভাবে সংযুক্ত করে।',
      searchBloodPlaceholder: 'রক্তের গ্রুপ নির্বাচন করুন',
      findDonorsBtn: 'রক্তদাতা খুঁজুন',
      requestBloodBtn: 'রক্তের আবেদন করুন',
      becomeDonorBtn: 'রক্তদাতা হিসেবে নিবন্ধন করুন',
    },
    stats: {
      title: 'আমাদের সরাসরি পরিসংখ্যান',
      subtitle: 'কোনো কাল্পনিক সংখ্যা নয়, ডাটাবেসের বাস্তব তথ্যের ভিত্তিতে আপডেট হয়।',
      activeDonors: 'নিবন্ধিত রক্তদাতা',
      emergencyRequests: 'জরুরী রক্তের আবেদন',
      verifiedHospitals: 'যাচাইকৃত হাসপাতাল',
      districtsCovered: 'আওতাভুক্ত জেলা',
      realDataNotice: 'রক্তদাতা কোনো ব্লাড ব্যাংক নয় এবং রক্তের প্রাপ্যতা বা মেডিকেল উপযুক্ততার নিশ্চয়তা দেয় না।',
    },
    search: {
      title: 'রক্তদাতা অনুসন্ধান ও মানচিত্র',
      bloodGroup: 'রক্তের গ্রুপ',
      allGroups: 'সকল রক্তের গ্রুপ',
      division: 'বিভাগ',
      district: 'জেলা',
      upazila: 'উপজেলা',
      allDivisions: 'সকল বিভাগ',
      allDistricts: 'সকল জেলা',
      allUpazilas: 'সকল উপজেলা',
      radius: 'দূরত্ব ব্যাসার্ধ',
      availableOnly: 'কেবলমাত্র রক্তদানে প্রস্তুত রক্তদাতা',
      searchBtn: 'অনুসন্ধান করুন',
      resetBtn: 'রিসেট',
      viewList: 'তালিকা ভিউ',
      viewMap: 'মানচিত্র ভিউ',
      noDonorsFound: 'আপনার নির্বাচিত এলাকায় কোনো রক্তদাতা পাওয়া যায়নি। অনুগ্রহ করে ব্যাসার্ধ বাড়িয়ে অনুসন্ধান করুন।',
      approxDistance: 'আনুমানিক দূরত্ব',
      contactDonor: 'যোগাযোগের অনুরোধ পাঠান',
    },
    request: {
      createTitle: 'জরুরী রক্তের আবেদন তৈরি করুন',
      patientName: 'রোগীর নাম (ঐচ্ছিক)',
      patientNameOpt: 'রোগীর গোপনীয়তা বজায় রাখতে নাম গোপন রাখতে পারেন',
      bloodGroup: 'প্রয়োজনীয় রক্তের গ্রুপ',
      units: 'রক্তের পরিমাণ (ব্যাগ/ইউনিট: ১ - ১০)',
      hospitalName: 'হাসপাতালের নাম',
      hospitalAddress: 'হাসপাতালের ঠিকানা ও ওয়ার্ড/কেবিন',
      dateTime: 'কখন রক্ত প্রয়োজন (তারিখ ও সময়)',
      urgency: 'জরুরিতা মাত্রা',
      urgencyCritical: 'তাত্ক্ষণিক জরুরী (আগামী ৪ ঘণ্টার মধ্যে)',
      urgencyHigh: 'উচ্চ অগ্রাধিকার (আজকের মধ্যে)',
      urgencyNormal: 'পরিকল্পিত (আগামীকাল বা পরে)',
      contactPhone: 'জরুরী যোগাযোগের নম্বর (+880...)',
      additionalNotes: 'রোগের বিবরণ বা বিশেষ নির্দেশনা (যেমন: হিমোগ্লোবিন, প্লাটিলেট)',
      submitBtn: 'আবেদন প্রকাশ করুন',
      status: 'অবস্থা',
      verifiedBadge: 'হাসপাতাল যাচাইকৃত',
      unverifiedBadge: 'যাচাই প্রক্রিয়াধীন',
      responses: 'সাড়া দিয়েছেন',
      iCanDonate: 'আমি রক্ত দিতে পারব',
      alreadyResponded: 'আপনি ইতিমধ্যে সাড়া দিয়েছেন',
    },
    disclaimer: {
      bannerTitle: 'জরুরী স্বাস্থ্য ও সতর্কতা বিজ্ঞপ্তি:',
      bannerText: 'রক্তদাতা কোনো বাণিজ্যিক ব্লাড ব্যাংক নয়। রক্তদান ও গ্রহণের পূর্বে সরকারি রেজিস্টার্ড ডাক্তার দ্বারা ক্রস-ম্যাচিং ও সকল স্ক্রিনিং পরীক্ষা সম্পন্ন করা বাধ্যতামূলক।',
      pageTitle: 'মেডিকেল ডিসক্লেইমার ও আইনগত শর্তাবলী',
      readMore: 'বিস্তারিত পড়ুন',
    },
  },
  en: {
    appName: 'ROKTO DATA',
    appTagline: 'A single drop of blood can save a precious life.',
    nav: {
      home: 'Home',
      findDonors: 'Find Donors',
      requestBlood: 'Emergency Request',
      hospitals: 'Hospitals',
      notifications: 'Notifications',
      dashboard: 'Dashboard',
      admin: 'Admin Panel',
      login: 'Login / Register',
      logout: 'Logout',
      profile: 'Profile',
      about: 'About Us',
      howItWorks: 'How It Works',
      safety: 'Safety Guidelines',
      faq: 'FAQ',
      disclaimer: 'Medical Disclaimer',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      contact: 'Contact',
      feedback: 'Feedback',
    },
    hero: {
      badge: 'Nationwide Network Across 8 Divisions & 64 Districts',
      titlePart1: 'Find Voluntary Blood Donors',
      titleHighlight: 'In Emergencies',
      titlePart2: 'Quickly In Your Immediate Area',
      subtitle: 'ROKTO DATA is an open, verified voluntary platform bridging the gap between emergency patients and generous donors across Bangladesh.',
      searchBloodPlaceholder: 'Select Blood Group',
      findDonorsBtn: 'Find Donors',
      requestBloodBtn: 'Request Blood',
      becomeDonorBtn: 'Register as Donor',
    },
    stats: {
      title: 'Real Database Statistics',
      subtitle: 'Authentic metrics sourced straight from verified system activity. No fabricated counts.',
      activeDonors: 'Registered Donors',
      emergencyRequests: 'Emergency Requests',
      verifiedHospitals: 'Verified Hospitals',
      districtsCovered: 'Districts Covered',
      realDataNotice: 'ROKTO DATA is not a blood bank and never guarantees blood availability or biological compatibility.',
    },
    search: {
      title: 'Donor Search & Interactive Map',
      bloodGroup: 'Blood Group',
      allGroups: 'All Blood Groups',
      division: 'Division',
      district: 'District',
      upazila: 'Upazila',
      allDivisions: 'All Divisions',
      allDistricts: 'All Districts',
      allUpazilas: 'All Upazilas',
      radius: 'Search Radius',
      availableOnly: 'Available Donors Only',
      searchBtn: 'Search Donors',
      resetBtn: 'Reset Filters',
      viewList: 'List View',
      viewMap: 'Map View',
      noDonorsFound: 'No voluntary donors found in this exact radius. Try expanding the distance radius.',
      approxDistance: 'Approx. Distance',
      contactDonor: 'Request Contact Consent',
    },
    request: {
      createTitle: 'Create Emergency Blood Request',
      patientName: 'Patient Name (Optional)',
      patientNameOpt: 'Keep empty if you wish to preserve patient anonymity',
      bloodGroup: 'Required Blood Group',
      units: 'Units Needed (1 to 10 bags)',
      hospitalName: 'Hospital / Clinic Name',
      hospitalAddress: 'Hospital Address & Ward/Bed Info',
      dateTime: 'Required By (Date & Time)',
      urgency: 'Urgency Level',
      urgencyCritical: 'Immediate Emergency (Within 4 hrs)',
      urgencyHigh: 'High Priority (Today)',
      urgencyNormal: 'Scheduled / Planned',
      contactPhone: 'Emergency Phone (+880...)',
      additionalNotes: 'Medical context or instructions (e.g. Platelets, Hemoglobin level)',
      submitBtn: 'Broadcast Request',
      status: 'Status',
      verifiedBadge: 'Hospital Verified',
      unverifiedBadge: 'Under Review',
      responses: 'Donors Responded',
      iCanDonate: 'I Can Donate',
      alreadyResponded: 'You Have Responded',
    },
    disclaimer: {
      bannerTitle: 'Medical & Safety Notice:',
      bannerText: 'ROKTO DATA is a communication platform, not a blood bank. Professional laboratory cross-matching, TTI screening, and doctor supervision are strictly mandatory.',
      pageTitle: 'Medical Disclaimer & Legal Notice',
      readMore: 'Learn More',
    },
  },
};
