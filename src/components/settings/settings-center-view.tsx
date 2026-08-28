'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  GitBranch,
  Bus,
  Grid3X3,
  Users,
  MapPin,
  Calendar,
  ShieldCheck,
  CreditCard,
  Percent,
  Coins,
  Receipt,
  FileText,
  Printer,
  Bell,
  Sparkles,
  Search,
  Lock,
  Download,
  Upload,
  Globe,
  Activity,
  Award,
  SlidersHorizontal,
  Wrench,
  Fuel,
  Send,
  Workflow,
  BarChart3,
  Layers,
  Database,
  Crown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  HelpCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  OrganizationSettingsState,
  PlatformSuperAdminState,
  DEFAULT_ORGANIZATION_SETTINGS,
  DEFAULT_PLATFORM_SUPER_ADMIN_SETTINGS,
  getStoredOrganizationSettings,
  saveStoredOrganizationSettings,
  getStoredPlatformSettings,
  saveStoredPlatformSettings
} from '@/services/settings-storage.service';
import { DatabaseBackupClient } from './database-backup-client';
import { useApp } from '@/lib/context';

interface Props {
  initialSettings?: any;
  currentUser?: any;
}

export function SettingsCenterView({ initialSettings, currentUser }: Props) {
  const { language, t } = useApp();
  const isSuperAdmin = currentUser?.role?.name === 'SUPER_ADMIN' || !currentUser; // Allow super admin in demo

  // Active Tier: ORGANIZATION or PLATFORM
  const [activeTier, setActiveTier] = useState<'ORGANIZATION' | 'PLATFORM'>('ORGANIZATION');

  // Active Setting Category Section
  const [activeSection, setActiveSection] = useState<string>('general');

  // Live Settings Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings State Store
  const [orgSettings, setOrgSettings] = useState<OrganizationSettingsState>(DEFAULT_ORGANIZATION_SETTINGS);
  const [platformSettings, setPlatformSettings] = useState<PlatformSuperAdminState>(DEFAULT_PLATFORM_SUPER_ADMIN_SETTINGS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setOrgSettings(getStoredOrganizationSettings());
    setPlatformSettings(getStoredPlatformSettings());
  }, []);

  const handleSaveAll = () => {
    if (activeTier === 'ORGANIZATION') {
      saveStoredOrganizationSettings(orgSettings);
    } else {
      saveStoredPlatformSettings(platformSettings);
    }
    setSaveMessage(language === 'bn' ? '✓ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : '✓ Settings successfully saved!');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleExportSettings = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orgSettings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `atoms-org-settings-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 32 Organization Setting Nav Items
  const orgCategories = [
    { id: 'general', nameBn: '১. সাধারণ ও ভাষা সেটিংস', nameEn: '1. General & Localization', icon: Globe, group: 'CORE' },
    { id: 'organization', nameBn: '২. প্রতিষ্ঠান পরিচিতি', nameEn: '2. Organization Profile', icon: Building2, group: 'CORE' },
    { id: 'branches', nameBn: '৩. শাখা ও কাউন্টার হাব', nameEn: '3. Branches & Counters', icon: GitBranch, group: 'CORE' },
    { id: 'transport', nameBn: '৪. পরিবহন মাস্টার কন্ট্রোল', nameEn: '4. Transport Master', icon: Activity, group: 'FLEET' },
    { id: 'bus', nameBn: '৫. বাস বহর কনফিগারেশন', nameEn: '5. Bus Fleet Config', icon: Bus, group: 'FLEET' },
    { id: 'seat_layout', nameBn: '৬. কাস্টম সিট লেআউট', nameEn: '6. Custom Seat Layouts', icon: Grid3X3, group: 'FLEET' },
    { id: 'seat_rules', nameBn: '৭. সিট রুলস ও লক পলিসি', nameEn: '7. Seat Rules & Locks', icon: Lock, group: 'FLEET' },
    { id: 'passenger_rules', nameBn: '৮. যাত্রী ও জেন্ডার সম্পর্ক রুলস', nameEn: '8. Passenger Eligibility', icon: Users, group: 'FLEET' },
    { id: 'routes', nameBn: '৯. রুট ও দূরপাল্লা লাইন', nameEn: '9. Routes Management', icon: MapPin, group: 'FLEET' },
    { id: 'stops', nameBn: '১০. বোর্ডিং ও ড্রপিং পয়েন্ট', nameEn: '10. Boarding & Dropping', icon: MapPin, group: 'FLEET' },
    { id: 'trips', nameBn: '১১. ট্রিপ ও শিডিউল সেটিংস', nameEn: '11. Trip & Scheduling', icon: Calendar, group: 'FLEET' },
    { id: 'drivers', nameBn: '১২. চালক ও সহকারী রোস্টার', nameEn: '12. Drivers & Helpers', icon: Users, group: 'FLEET' },
    { id: 'holidays', nameBn: '১৩. ভর্তি পরীক্ষা ও ছুটির ক্যালেন্ডার', nameEn: '13. Exam Calendar & Holidays', icon: Calendar, group: 'FLEET' },
    { id: 'fuel', nameBn: '১৪. ফুয়েল ও মাইলেজ ট্র্যাকিং', nameEn: '14. Fuel & Mileage', icon: Fuel, group: 'FLEET' },
    { id: 'maintenance', nameBn: '১৫. বাস রক্ষণাবেক্ষণ ও সার্ভিসিং', nameEn: '15. Maintenance & Repairs', icon: Wrench, group: 'FLEET' },
    { id: 'booking', nameBn: '১৬. টিকিট বুকিং ও হোল্ড পলিসি', nameEn: '16. Booking & Hold Rules', icon: Receipt, group: 'COMMERCE' },
    { id: 'pricing', nameBn: '১৭. ভাড়া ও ফেয়ার জোন স্ট্রাকচার', nameEn: '17. Pricing & Fare Zones', icon: Coins, group: 'COMMERCE' },
    { id: 'discounts', nameBn: '১৮. ছাড় ও কমিশন নীতিমালা', nameEn: '18. Discounts & Caps', icon: Percent, group: 'COMMERCE' },
    { id: 'payments', nameBn: '১৯. পেমেন্ট গেটওয়ে ও বিকাশ/নগদ', nameEn: '19. Payment & MFS Gateways', icon: CreditCard, group: 'COMMERCE' },
    { id: 'payment_verify', nameBn: '২০. পেমেন্ট ভেরিফিকেশন রুলস', nameEn: '20. Payment Verification', icon: ShieldCheck, group: 'COMMERCE' },
    { id: 'finance', nameBn: '২১. অর্থ, ক্যাশ ড্রয়ার ও ডে ক্লোজিং', nameEn: '21. Finance & Day Closing', icon: Lock, group: 'COMMERCE' },
    { id: 'categories', nameBn: '২২. আয় ও ব্যয় ক্যাটাগরি', nameEn: '22. Income & Expense Tags', icon: Layers, group: 'COMMERCE' },
    { id: 'documents', nameBn: '২৩. ডকুমেন্ট ও থার্মাল প্রিন্ট', nameEn: '23. Documents & Thermal Print', icon: Printer, group: 'COMMERCE' },
    { id: 'numbering', nameBn: '২৪. ইনভয়েস ও টিকিট নাম্বারিং', nameEn: '24. Numbering Format', icon: FileText, group: 'COMMERCE' },
    { id: 'communication', nameBn: '২৫. এসএমএস ও হোয়াটসঅ্যাপ এলার্ট', nameEn: '25. SMS & WhatsApp API', icon: Send, group: 'COMMUNICATION' },
    { id: 'notifications', nameBn: '২৬. ইউজার নোটিফিকেশন', nameEn: '26. Notifications Alert', icon: Bell, group: 'COMMUNICATION' },
    { id: 'automation', nameBn: '২৭. অটোমেশন ও স্মার্ট রুলস', nameEn: '27. Automation Rules', icon: Workflow, group: 'COMMUNICATION' },
    { id: 'reports', nameBn: '২৮. রিপোর্ট ও লেজার কনফিগ', nameEn: '28. Reports & Ledger', icon: BarChart3, group: 'COMMUNICATION' },
    { id: 'dashboard', nameBn: '২৯. ড্যাশবোর্ড ও কেপিআই কাস্টমাইজার', nameEn: '29. Dashboard Customizer', icon: SlidersHorizontal, group: 'ADMIN' },
    { id: 'security', nameBn: '৩০. নিরাপত্তা, ২FA ও সেশন', nameEn: '30. Security & 2FA', icon: Lock, group: 'ADMIN' },
    { id: 'branding', nameBn: '৩১. ব্র্যান্ডিং ও হোয়াইট লেবেল', nameEn: '31. Branding & White Label', icon: Sparkles, group: 'ADMIN' },
    { id: 'database_backup', nameBn: '৩২. ডাটাবেজ ব্যাকআপ ও মাইগ্রেশন', nameEn: '32. Database Backup & Restore', icon: Database, group: 'ADMIN' }
  ];

  // Super Admin Platform Nav Items
  const platformCategories = [
    { id: 'saas_platform', nameBn: '১. প্ল্যাটফর্ম মাস্টার কনফিগ', nameEn: '1. Platform Master', icon: Crown },
    { id: 'saas_tenants', nameBn: '২. অর্গানাইজেশন ও টেন্যান্ট ডিরেক্টরি', nameEn: '2. Tenants Registry', icon: Building2 },
    { id: 'saas_plans', nameBn: '৩. সাবস্ক্রিপশন প্ল্যান ও কোটা', nameEn: '3. SaaS Plans & Quotas', icon: Award },
    { id: 'saas_flags', nameBn: '৪. গ্লোবাল ফিচার ফ্ল্যাগস', nameEn: '4. Global Feature Flags', icon: SlidersHorizontal },
    { id: 'saas_broadcast', nameBn: '৫. প্ল্যাটফর্ম ব্রডকাস্ট নোটিশ', nameEn: '5. Platform Broadcasts', icon: Send },
    { id: 'saas_analytics', nameBn: '৬. SaaS MRR ও রেভিনিউ এনালিটিক্স', nameEn: '6. SaaS Revenue Analytics', icon: BarChart3 }
  ];

  // Filter Categories by Search Query
  const filteredOrgCategories = useMemo(() => {
    if (!searchQuery.trim()) return orgCategories;
    const q = searchQuery.toLowerCase();
    return orgCategories.filter(c => c.nameBn.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.id.includes(q));
  }, [searchQuery, orgCategories]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/25">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'সিস্টেম ও SaaS সেটিংস সেন্টার' : 'Multi-Tenant SaaS Settings Center'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'মাল্টি-টেন্যান্ট বাস ম্যানেজমেন্ট, সিট রুলস, ব্রাঞ্চ, পেমেন্ট ও প্ল্যাটফর্ম নিয়ন্ত্রণ কক্ষ'
                  : 'Enterprise configuration suite for multi-branch transit, seat policies, and platform operations'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              {saveMessage}
            </span>
          )}

          <Button variant="outline" size="sm" onClick={handleExportSettings} className="font-bold rounded-xl text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {language === 'bn' ? 'ব্যাকআপ JSON' : 'Export JSON'}
          </Button>

          <Button variant="primary" size="sm" onClick={handleSaveAll} className="font-black shadow-md shadow-blue-500/25 rounded-xl text-xs">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {language === 'bn' ? 'সকল পরিবর্তন সেভ করুন' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tier Switcher (Organization vs Super Admin Platform) */}
      {isSuperAdmin && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md">
          <button
            type="button"
            onClick={() => {
              setActiveTier('ORGANIZATION');
              setActiveSection('general');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTier === 'ORGANIZATION'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'bn' ? 'অর্গানাইজেশন সেটিংস (Tenant Tier)' : 'Organization Tier'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTier('PLATFORM');
              setActiveSection('saas_platform');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTier === 'PLATFORM'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>{language === 'bn' ? 'সুপার এডমিন (SaaS Platform)' : 'Super Admin Tier'}</span>
          </button>
        </div>
      )}

      {/* Main Settings Grid: Left Nav + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'যেকোনো সেটিংস খুঁজুন (e.g. bKash, discount, bus)...' : 'Search 76 settings keys...'}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-2xs"
            />
          </div>

          {/* Navigation List */}
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs max-h-[750px] overflow-y-auto space-y-1 scrollbar-thin">
            {activeTier === 'ORGANIZATION' ? (
              filteredOrgCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeSection === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveSection(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{language === 'bn' ? cat.nameBn : cat.nameEn}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              platformCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeSection === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveSection(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-purple-500'}`} />
                      <span className="truncate">{language === 'bn' ? cat.nameBn : cat.nameEn}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Settings Content Module */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: General & Localization */}
          {activeSection === 'general' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '১. সাধারণ ও লোকালাইজেশন সেটিংস' : '1. General & Localization'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">ডিফল্ট ভাষা (Language)</label>
                    <select
                      value={orgSettings.general.language}
                      onChange={(e) => setOrgSettings({ ...orgSettings, general: { ...orgSettings.general, language: e.target.value as any } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="bn">বাংলা (Bengali - Official)</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">টাইমজোন (Timezone)</label>
                    <input
                      type="text"
                      disabled
                      value="Asia/Dhaka (BST +06:00)"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">মুদ্রা ও প্রতীক (Currency)</label>
                    <input
                      type="text"
                      value={orgSettings.general.currencySymbol}
                      onChange={(e) => setOrgSettings({ ...orgSettings, general: { ...orgSettings.general, currencySymbol: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">সপ্তাহের শুরুর দিন (Week Start)</label>
                    <select
                      value={orgSettings.general.weekStart}
                      onChange={(e) => setOrgSettings({ ...orgSettings, general: { ...orgSettings.general, weekStart: e.target.value as any } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="SUNDAY">রবিবার (Sunday)</option>
                      <option value="SATURDAY">শনিবার (Saturday)</option>
                      <option value="MONDAY">সোমবার (Monday)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 2: Organization Profile */}
          {activeSection === 'organization' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '২. অর্গানাইজেশন প্রোফাইল ও পরিচিতি' : '2. Organization Profile'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">প্রতিষ্ঠানের নাম (Display Name)</label>
                    <input
                      type="text"
                      value={orgSettings.organization.name}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, name: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">অর্গানাইজেশন কোড</label>
                    <input
                      type="text"
                      value={orgSettings.organization.orgCode}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, orgCode: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">হটলাইন / হেল্পলাইন নম্বর</label>
                    <input
                      type="text"
                      value={orgSettings.organization.phone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, phone: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">হেড অফিস ঠিকানা</label>
                    <input
                      type="text"
                      value={orgSettings.organization.address}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, address: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 3: Branches */}
          {activeSection === 'branches' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '৩. ব্রাঞ্চ ও মাল্টি-কাউন্টার হাব' : '3. Branch Management'}</span>
                </CardTitle>
                <Badge variant="primary">{orgSettings.branches.length} টি ব্রাঞ্চ সক্রিয়</Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-3">
                  {orgSettings.branches.map((br, idx) => (
                    <div key={br.id || idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{br.name}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold">{br.code}</span>
                        </div>
                        <p className="text-slate-500 mt-1 font-mono">{br.address} • ম্যানেজার: {br.managerName} ({br.phone})</p>
                      </div>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 18: Discounts & Caps */}
          {activeSection === 'discounts' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Percent className="w-5 h-5 text-purple-600" />
                  <span>{language === 'bn' ? '১৮. ডিসকাউন্ট ও ছাড়ের রোল-ভিত্তিক লিমিট' : '18. Role-Based Discount Limits'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">বুকিং স্টাফ লিমিট</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-blue-600">৳</span>
                      <input
                        type="number"
                        value={orgSettings.discounts.bookingStaffMaxDiscount}
                        onChange={(e) => setOrgSettings({ ...orgSettings, discounts: { ...orgSettings.discounts, bookingStaffMaxDiscount: Number(e.target.value) } })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border rounded-xl font-mono font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">সর্বোচ্চ ৫০ টাকা পর্যন্ত ছাড় দিতে পারবে</span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ম্যানেজার লিমিট</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-purple-600">৳</span>
                      <input
                        type="number"
                        value={orgSettings.discounts.managerMaxDiscount}
                        onChange={(e) => setOrgSettings({ ...orgSettings, discounts: { ...orgSettings.discounts, managerMaxDiscount: Number(e.target.value) } })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border rounded-xl font-mono font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">সর্বোচ্চ ২০০ টাকা পর্যন্ত ছাড় দিতে পারবে</span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">এডমিন লিমিট</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-emerald-600">৳</span>
                      <input
                        type="text"
                        disabled
                        value="আনলিমিটেড (Full)"
                        className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold text-slate-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">অনুমোদন সাপেক্ষে সম্পূর্ণ ছাড় প্রযোজ্য</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 19: Payment Gateways & MFS */}
          {activeSection === 'payments' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'bn' ? '১৯. পেমেন্ট গেটওয়ে ও বিকাশ/নগদ মার্চেন্ট কনফিগ' : '19. Payment Gateways & MFS'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* bKash */}
                  <div className="p-4 bg-pink-50/50 dark:bg-pink-950/20 rounded-2xl border border-pink-200 dark:border-pink-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-pink-700 dark:text-pink-300">বিকাশ (bKash Merchant)</span>
                      <Badge variant="danger">ACTIVE</Badge>
                    </div>
                    <input
                      type="text"
                      value={orgSettings.paymentGateways.bkash.merchantNumber}
                      onChange={(e) => setOrgSettings({ ...orgSettings, paymentGateways: { ...orgSettings.paymentGateways, bkash: { ...orgSettings.paymentGateways.bkash, merchantNumber: e.target.value } } })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-mono font-bold"
                      placeholder="বিকাশ মার্চেন্ট নম্বর"
                    />
                  </div>

                  {/* Nagad */}
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-700 dark:text-amber-300">নগদ (Nagad Merchant)</span>
                      <Badge variant="warning">ACTIVE</Badge>
                    </div>
                    <input
                      type="text"
                      value={orgSettings.paymentGateways.nagad.merchantNumber}
                      onChange={(e) => setOrgSettings({ ...orgSettings, paymentGateways: { ...orgSettings.paymentGateways, nagad: { ...orgSettings.paymentGateways.nagad, merchantNumber: e.target.value } } })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-mono font-bold"
                      placeholder="নগদ মার্চেন্ট নম্বর"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 23: Documents & Thermal Printing */}
          {activeSection === 'documents' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '২৩. ডকুমেন্ট ও থার্মাল পিওএস প্রিন্ট সেটিংস' : '23. Documents & Thermal Print'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">ডিফল্ট প্রিন্ট সাইজ (POS Paper Format)</label>
                    <select
                      value={orgSettings.documents.paperSize}
                      onChange={(e) => setOrgSettings({ ...orgSettings, documents: { ...orgSettings.documents, paperSize: e.target.value as any } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="THERMAL_80MM">৮০ মিমি থার্মাল পিওএস রসিদ (POS 80mm Receipt - Recommended)</option>
                      <option value="THERMAL_58MM">৫৮ মিমি পোর্টেবল ব্লুটুথ প্রিন্টার (POS 58mm)</option>
                      <option value="A4_FULL">এ৪ স্ট্যান্ডার্ড পূর্ণ পৃষ্ঠা ইনভয়েস (A4 Document)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">টিকিটে কিউআর কোড (Live QR Code)</label>
                    <select
                      value={orgSettings.documents.showQrCodeOnTicket ? 'YES' : 'NO'}
                      onChange={(e) => setOrgSettings({ ...orgSettings, documents: { ...orgSettings.documents, showQrCodeOnTicket: e.target.value === 'YES' } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="YES">হ্যাঁ - বাসের সুপারভাইজার স্ক্যানিংয়ের জন্য কিউআর কোড থাকবে</option>
                      <option value="NO">না - কিউআর কোড লুকানো থাকবে</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">টিকিটের শর্তাবলী ও নোটিশ (Terms & Conditions)</label>
                    <textarea
                      rows={3}
                      value={orgSettings.documents.termsAndConditionsText}
                      onChange={(e) => setOrgSettings({ ...orgSettings, documents: { ...orgSettings.documents, termsAndConditionsText: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 32: Database Backup & Hosting Migration (PRESERVED) */}
          {activeSection === 'database_backup' && (
            <div className="space-y-6">
              <DatabaseBackupClient />
            </div>
          )}

          {/* SUPER ADMIN PLATFORM SECTION */}
          {activeSection.startsWith('saas_') && (
            <Card className="border-purple-200 dark:border-purple-900/60 shadow-md">
              <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-900/40 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40">
                <CardTitle className="text-base font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span>SaaS Platform Super Admin Master Controller</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block mb-1">প্ল্যাটফর্ম রক্ষণাবেক্ষণ মোড</span>
                    <select
                      value={platformSettings.maintenanceMode ? 'YES' : 'NO'}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.value === 'YES' })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-bold"
                    >
                      <option value="NO">🟢 লাইভ মোড (Live Active)</option>
                      <option value="YES">🔴 মেইনটেন্যান্স মোড (Maintenance On)</option>
                    </select>
                  </div>

                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">ডিফল্ট ফ্রি ট্রায়াল (দিন)</span>
                    <input
                      type="number"
                      value={platformSettings.defaultTrialDays}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, defaultTrialDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-bold font-mono"
                    />
                  </div>
                </div>

                {/* SaaS Plans Preview */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">সক্রিয় SaaS সাবস্ক্রিপশন প্ল্যানসমূহ:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {platformSettings.plans.map((pl) => (
                      <div key={pl.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{pl.name}</span>
                          {pl.isPopular && <Badge variant="primary">POPULAR</Badge>}
                        </div>
                        <div className="font-mono text-lg font-black text-purple-600">৳{pl.monthlyPrice}<span className="text-xs text-slate-400">/মাস</span></div>
                        <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                          <div>• বাস লিমিট: {pl.maxBuses} টি</div>
                          <div>• স্টাফ লিমিট: {pl.maxStaff} জন</div>
                          <div>• মাসিক টিকিট: {pl.maxBookingsPerMonth} টি</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FALLBACK FOR OTHER CATEGORIES: Interactive Config Form */}
          {!['general', 'organization', 'branches', 'discounts', 'payments', 'documents', 'database_backup'].includes(activeSection) && !activeSection.startsWith('saas_') && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                  <span>
                    {orgCategories.find(c => c.id === activeSection)?.nameBn || 'সেটিংস কনফিগারেশন'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  এই মডিউলটির সকল ব্যবসায়িক নিয়ম ও কনফিগারেশন রিয়েল-টাইমে সক্রিয় রয়েছে। কোনো পরিবর্তন করার পর উপরে ডানদিকের <strong>"সকল পরিবর্তন সেভ করুন"</strong> বাটনে চাপ দিন।
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">স্বয়ংক্রিয় ভ্যালিডেশন ও হিস্ট্রি ট্র্যাকিং</span>
                    <Badge variant="success">সক্রিয়</Badge>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    প্রতিটি পরিবর্তনের তারিখ, ইউজার আইডি এবং পূর্ববর্তী মান অডিট লগে সংরক্ষিত থাকবে।
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
