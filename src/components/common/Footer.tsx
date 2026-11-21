import React from 'react';
import { Droplets, Phone, ShieldCheck, Heart, ExternalLink, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC<{ setCurrentTab: (tab: string) => void }> = ({ setCurrentTab }) => {
  const { language, t } = useLanguage();

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
                <Droplets className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                {language === 'bn' ? 'রক্তদাতা' : 'ROKTO DATA'}
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {language === 'bn'
                ? 'বাংলাদেশের ৬৪ জেলার জরুরী রক্তগ্রহীতা এবং স্বেচ্ছাসেবী রক্তদাতাদের সরাসরি সংযুক্ত করার একটি নিরাপদ, স্বচ্ছ এবং অলাভজনক প্ল্যাটফর্ম।'
                : 'A nationwide, voluntary non-profit network connecting blood seekers with voluntary blood donors across all 64 districts in Bangladesh.'}
            </p>

            {/* Emergency Hotline Box */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  {language === 'bn' ? 'জাতীয় জরুরী সেবা' : 'National Emergency Call'}
                </p>
                <p className="text-sm font-bold text-white">
                  999 <span className="text-slate-400 font-normal">| স্বাস্থ্য বাতায়ন:</span> 16263
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {language === 'bn' ? 'প্রধান সংযোগ' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => handleNav('landing')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('find_donors')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.findDonors}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('emergency_requests')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.requestBlood}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('hospitals')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.hospitals}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('how_it_works')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.howItWorks}
                </button>
              </li>
            </ul>
          </div>

          {/* Safety & Legal */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {language === 'bn' ? 'নিরাপত্তা ও নীতিমালা' : 'Safety & Legal'}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => handleNav('disclaimer')} className="hover:text-red-400 transition text-red-300 cursor-pointer">
                  {t.nav.disclaimer}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('safety')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.safety}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('privacy')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.privacy}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('terms')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.terms}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('faq')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.faq}
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Developer */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {language === 'bn' ? 'প্ল্যাটফর্ম ও ক্লাউড' : 'Platform & Setup'}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.about}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('feedback')} className="hover:text-red-400 transition cursor-pointer text-red-300 font-semibold">
                  {t.nav.feedback}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('contact')} className="hover:text-red-400 transition cursor-pointer">
                  {t.nav.contact}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('dev_setup')} className="hover:text-red-400 transition cursor-pointer flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ডাটাবেস ও এপিআই সেটআপ' : 'Supabase & API Setup'}</span>
                </button>
              </li>
              <li className="pt-2 text-xs text-slate-500">
                PWA Beta v1.0.0-beta
                <br />
                Leaflet OpenStreetMap Ready
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom medical note & copyright */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center md:text-left max-w-2xl">
            {language === 'bn'
              ? 'সতর্কতা: রক্তদাতা কোনো ব্লাড ব্যাংক নয় এবং রক্তের প্রাপ্যতা বা মেডিকেল উপযুক্ততার নিশ্চয়তা প্রদান করে না। যেকোনো রক্তদানের পূর্বে রেজিস্টার্ড চিকিৎসকের তত্ত্বাবধানে পূর্ণাঙ্গ স্ক্রিনিং ও ক্রস-ম্যাচিং বাধ্যতামূলক।'
              : 'Medical Notice: ROKTO DATA is an open voluntary communication platform, not a blood bank, and never guarantees biological compatibility. Certified laboratory cross-matching is strictly mandatory.'}
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for the people of Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
