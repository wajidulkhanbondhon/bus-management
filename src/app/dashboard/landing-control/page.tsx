'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Monitor,
  MapPin,
  Bus,
  GraduationCap,
  MessageCircle,
  Timer,
  Shield,
  Palette,
  Type,
  Globe,
  Layout,
  Sparkles,
  CheckCircle2,
  Image,
  Phone
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/ui/toast';

interface LandingSection {
  id: string;
  label: string;
  labelEn: string;
  icon: any;
  description: string;
  visible: boolean;
}

interface LandingConfig {
  sections: LandingSection[];
  bannerMessage: string;
  bannerEnabled: boolean;
  mapAnimationEnabled: boolean;
  helplineNumber: string;
  whatsappNumber: string;
  companyName: string;
  tagline: string;
}

const DEFAULT_CONFIG: LandingConfig = {
  sections: [
    { id: 'hero', label: 'হিরো সেকশন ও ম্যাপ', labelEn: 'Hero Section & Map', icon: Globe, description: 'মানচিত্র, স্ট্যাটিস্টিক্স, হেডলাইন', visible: true },
    { id: 'search', label: 'সার্চ ও ফিল্টার বার', labelEn: 'Search & Filter Bar', icon: MapPin, description: 'ফিল্টারিং অপশন', visible: true },
    { id: 'howItWorks', label: 'কীভাবে বুকিং করবেন', labelEn: 'How It Works', icon: Layout, description: '৩ ধাপের গাইড', visible: true },
    { id: 'tripCards', label: 'বাসের তালিকা ও সিট', labelEn: 'Trip Listings', icon: Bus, description: 'চলমান বাসের কার্ড ও সিট সংখ্যা', visible: true },
    { id: 'tracking', label: 'বুকিং ট্র্যাকিং', labelEn: 'Booking Tracking', icon: Timer, description: 'বুকিং স্ট্যাটাস চেক সেকশন', visible: true },
    { id: 'university', label: 'বিশ্ববিদ্যালয় তথ্য বাটন', labelEn: 'University Portal CTA', icon: GraduationCap, description: 'ভর্তি তথ্য কেন্দ্রের বড় বাটন', visible: true },
    { id: 'trust', label: 'ট্রাস্ট ব্যাজ / ফিচার্স', labelEn: 'Trust Badges', icon: Shield, description: 'নিরাপত্তা ও সুবিধা ব্যাজ', visible: true },
    { id: 'contact', label: 'হেল্পলাইন ও যোগাযোগ', labelEn: 'Contact & Helpline', icon: Phone, description: 'ফোন ও WhatsApp যোগাযোগ', visible: true },
  ],
  bannerMessage: '',
  bannerEnabled: false,
  mapAnimationEnabled: true,
  helplineNumber: '01711-000001',
  whatsappNumber: '8801711000001',
  companyName: 'ATOMS Admission Express',
  tagline: 'বিশ্ববিদ্যালয় ভর্তি স্পেশাল ট্রান্সপোর্ট সার্ভিস',
};

export default function LandingControlPage() {
  const { language } = useApp();
  const { success, info } = useToast();
  
  // Load config from localStorage (would be from API in production)
  const [config, setConfig] = useState<LandingConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('atoms_landing_config');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_CONFIG;
  });

  const [hasChanges, setHasChanges] = useState(false);

  const toggleSection = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      )
    }));
    setHasChanges(true);
  };

  const updateField = (field: keyof LandingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const saveConfig = () => {
    localStorage.setItem('atoms_landing_config', JSON.stringify(config));
    setHasChanges(false);
    success('সেভ হয়েছে', 'ল্যান্ডিং পেজ কনফিগারেশন সফলভাবে সেভ হয়েছে।');
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem('atoms_landing_config');
    setHasChanges(false);
    info('রিসেট', 'ডিফল্ট কনফিগারেশনে ফিরে এসেছে।');
  };

  const visibleCount = config.sections.filter(s => s.visible).length;
  const totalCount = config.sections.length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Monitor className="w-6 h-6 text-blue-500" />
            {language === 'bn' ? 'ল্যান্ডিং পেজ কন্ট্রোল' : 'Landing Page Control'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'পাবলিক ল্যান্ডিং পেজে কোন কোন সেকশন দেখাবে/লুকাবে তা নিয়ন্ত্রণ করুন।'
              : 'Control which sections are visible or hidden on the public landing page.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            লাইভ প্রিভিউ
          </a>
          <button
            onClick={resetConfig}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            রিসেট
          </button>
          <button
            onClick={saveConfig}
            disabled={!hasChanges}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all ${
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            সেভ করুন
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-semibold mb-1">দৃশ্যমান সেকশন</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {visibleCount} <span className="text-sm font-normal text-slate-400">/ {totalCount}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-semibold mb-1">ম্যাপ অ্যানিমেশন</div>
          <div className={`text-2xl font-black ${config.mapAnimationEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {config.mapAnimationEnabled ? 'চালু' : 'বন্ধ'}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-semibold mb-1">ব্যানার মেসেজ</div>
          <div className={`text-2xl font-black ${config.bannerEnabled ? 'text-amber-600 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>
            {config.bannerEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
          </div>
        </div>
      </div>

      {/* Section Visibility Toggles */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="w-4 h-4 text-blue-500" />
            সেকশন ভিজিবিলিটি কন্ট্রোল
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">প্রতিটি সেকশন চালু/বন্ধ করুন — বন্ধ সেকশন পাবলিক পেজে দেখাবে না।</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {config.sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    section.visible
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${
                      section.visible ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'
                    }`}>
                      {section.label}
                    </div>
                    <div className="text-[10px] text-slate-500">{section.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                    section.visible ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                      section.visible ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Animation Toggle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          ম্যাপ ও অ্যানিমেশন সেটিংস
        </h2>
        
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">বাস অ্যানিমেশন</div>
            <div className="text-[10px] text-slate-500">মানচিত্রে বাস চলার অ্যানিমেশন চালু/বন্ধ</div>
          </div>
          <button
            onClick={() => updateField('mapAnimationEnabled', !config.mapAnimationEnabled)}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
              config.mapAnimationEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                config.mapAnimationEnabled ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Banner Message */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-amber-500" />
          কাস্টম ব্যানার মেসেজ
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">ব্যানার চালু/বন্ধ</div>
          <button
            onClick={() => updateField('bannerEnabled', !config.bannerEnabled)}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
              config.bannerEnabled ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                config.bannerEnabled ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <textarea
          value={config.bannerMessage}
          onChange={e => updateField('bannerMessage', e.target.value)}
          placeholder="ব্যানার মেসেজ লিখুন... (যেমন: ঢাকা-রাজশাহী রুটে সীমিত সিট বাকি!)"
          rows={3}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Contact Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-500" />
          যোগাযোগ ও WhatsApp সেটিংস
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">হেল্পলাইন নম্বর</label>
            <input
              type="text"
              value={config.helplineNumber}
              onChange={e => updateField('helplineNumber', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp নম্বর (দেশ কোড সহ)</label>
            <input
              type="text"
              value={config.whatsappNumber}
              onChange={e => updateField('whatsappNumber', e.target.value)}
              placeholder="8801711000001"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-green-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">কোম্পানির নাম</label>
            <input
              type="text"
              value={config.companyName}
              onChange={e => updateField('companyName', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ট্যাগলাইন</label>
            <input
              type="text"
              value={config.tagline}
              onChange={e => updateField('tagline', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Save reminder */}
      {hasChanges && (
        <motion.div
          className="sticky bottom-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Save className="w-4 h-4" />
            আপনার পরিবর্তন সেভ করা হয়নি!
          </div>
          <button
            onClick={saveConfig}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-md"
          >
            এখনই সেভ করুন
          </button>
        </motion.div>
      )}
    </div>
  );
}
