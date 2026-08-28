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
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Check,
  Clock,
  Phone,
  Smartphone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  OrganizationSettingsState,
  DEFAULT_ORGANIZATION_SETTINGS,
  getStoredOrganizationSettings,
  saveStoredOrganizationSettings
} from '@/services/settings-storage.service';
import { DatabaseBackupClient } from './database-backup-client';
import { AppearanceSettingsClient } from './appearance-settings-client';
import { PaymentLogosSettingsClient } from './payment-logos-settings-client';
import { useApp } from '@/lib/context';

interface Props {
  initialSettings?: any;
  currentUser?: any;
}

export function SettingsCenterView({ initialSettings, currentUser }: Props) {
  const { language, t } = useApp();

  // Active Setting Category Section
  const [activeSection, setActiveSection] = useState<string>('general');

  // Live Settings Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings State Store
  const [orgSettings, setOrgSettings] = useState<OrganizationSettingsState>(DEFAULT_ORGANIZATION_SETTINGS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setOrgSettings(getStoredOrganizationSettings());
  }, []);

  const handleSaveAll = () => {
    saveStoredOrganizationSettings(orgSettings);
    setSaveMessage(language === 'bn' ? '✓ সকল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : '✓ All settings successfully saved!');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleExportSettings = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orgSettings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `atoms-bus-settings-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Operational Settings Categories
  const categories = [
    { id: 'general', nameBn: '১. সাধারণ ও ভাষা সেটিংস', nameEn: '1. General & Localization', icon: Globe },
    { id: 'organization', nameBn: '২. প্রতিষ্ঠান পরিচিতি ও যোগাযোগ', nameEn: '2. Profile & Contacts', icon: Building2 },
    { id: 'branches', nameBn: '৩. শাখা ও কাউন্টার হাব', nameEn: '3. Branches & Counters', icon: GitBranch },
    { id: 'transport', nameBn: '৪. পরিবহন পলিসি ও এলাউন্স', nameEn: '4. Transport & Allowances', icon: Activity },
    { id: 'seat_rules', nameBn: '৫. সিট রুলস ও জেন্ডার লক', nameEn: '5. Seat Rules & Gender Lock', icon: Lock },
    { id: 'passenger_rules', nameBn: '৬. অভিভাবক ও শিক্ষার্থী রুলস', nameEn: '6. Passenger Eligibility', icon: Users },
    { id: 'stops', nameBn: '৭. বোর্ডিং ও ড্রপিং পয়েন্ট ড্রপডাউন', nameEn: '7. Boarding & Dropping Points', icon: MapPin },
    { id: 'booking', nameBn: '৮. টিকিট বুকিং ও হোল্ড টাইমার', nameEn: '8. Booking & Hold Rules', icon: Receipt },
    { id: 'discounts', nameBn: '৯. ছাড় ও রোল-ভিত্তিক লিমিট', nameEn: '9. Discounts & Limits', icon: Percent },
    { id: 'payments', nameBn: '১০. পেমেন্ট গেটওয়ে (বিকাশ/নগদ/রকেট)', nameEn: '10. Payment & MFS Gateways', icon: CreditCard },
    { id: 'finance', nameBn: '১১. অর্থ, ক্যাশ ড্রয়ার ও ডে ক্লোজিং', nameEn: '11. Finance & Day Closing', icon: Coins },
    { id: 'categories', nameBn: '১২. আয় ও ব্যয় ক্যাটাগরি', nameEn: '12. Income & Expense Tags', icon: Layers },
    { id: 'documents', nameBn: '১৩. ডকুমেন্ট ও থার্মাল পিওএস প্রিন্ট', nameEn: '13. Documents & Thermal Print', icon: Printer },
    { id: 'communication', nameBn: '১৪. এসএমএস ও হোয়াটসঅ্যাপ এলার্ট', nameEn: '14. SMS & WhatsApp API', icon: Send },
    { id: 'security', nameBn: '১৫. নিরাপত্তা, পাসওয়ার্ড ও সেশন', nameEn: '15. Security & Session', icon: ShieldCheck },
    { id: 'appearance', nameBn: '১৬. থিম ও কালার কাস্টমাইজেশন', nameEn: '16. Appearance & Themes', icon: Sparkles },
    { id: 'payment_logos', nameBn: '১৭. পেমেন্ট ব্র্যান্ড লোগো সেটিংস', nameEn: '17. Payment Brand Logos', icon: CreditCard },
    { id: 'database_backup', nameBn: '১৮. ডাটাবেজ ব্যাকআপ ও মাইগ্রেশন', nameEn: '18. Database Backup & Restore', icon: Database }
  ];

  // Filter Categories by Search Query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => c.nameBn.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.id.includes(q));
  }, [searchQuery, categories]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/25">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'বাস ম্যানেজমেন্ট ও অপারেশন সেটিংস' : 'Bus Operations Settings Center'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'ভর্তি স্পেশাল বাস বহর, সিট রুলস, বোর্ডিং পয়েন্ট, পেমেন্ট ও ব্যাকআপ নিয়ন্ত্রণ কক্ষ'
                  : 'Master configuration for admission express fleet, seat policies, stops, and financial ledgers'}
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
              placeholder={language === 'bn' ? 'সেটিংস খুঁজুন (e.g. bKash, discount, hold)...' : 'Search settings...'}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-2xs"
            />
          </div>

          {/* Navigation List */}
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs max-h-[750px] overflow-y-auto space-y-1 scrollbar-thin">
            {filteredCategories.map((cat) => {
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
            })}
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
                  <span>{language === 'bn' ? '২. প্রতিষ্ঠান পরিচিতি ও হেল্পলাইন' : '2. Organization Profile'}</span>
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
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">হটলাইন / হেল্পলাইন নম্বর</label>
                    <input
                      type="text"
                      value={orgSettings.organization.phone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, phone: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">জরুরী যোগাযোগ নম্বর (Emergency)</label>
                    <input
                      type="text"
                      value={orgSettings.organization.emergencyContact}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, emergencyContact: e.target.value } })}
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
                  <span>{language === 'bn' ? '৩. কাউন্টার ও ব্রাঞ্চ হাব' : '3. Branch Management'}</span>
                </CardTitle>
                <Badge variant="primary">{orgSettings.branches.length} টি কাউন্টার সক্রিয়</Badge>
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

          {/* SECTION 4: Transport Master */}
          {activeSection === 'transport' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'bn' ? '৪. পরিবহন পলিসি ও এলাউন্স' : '4. Transport Master Policy'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold block mb-1">ড্রাইভার ট্রিপ এলাউন্স (প্রতি ট্রিপ)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-blue-600">৳</span>
                      <input
                        type="number"
                        value={orgSettings.transport.defaultDriverAllowance}
                        onChange={(e) => setOrgSettings({ ...orgSettings, transport: { ...orgSettings.transport, defaultDriverAllowance: Number(e.target.value) } })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border rounded-xl font-bold font-mono"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold block mb-1">হেল্পার ট্রিপ এলাউন্স (প্রতি ট্রিপ)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-indigo-600">৳</span>
                      <input
                        type="number"
                        value={orgSettings.transport.defaultHelperAllowance}
                        onChange={(e) => setOrgSettings({ ...orgSettings, transport: { ...orgSettings.transport, defaultHelperAllowance: Number(e.target.value) } })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border rounded-xl font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 5: Seat Rules & Locks */}
          {activeSection === 'seat_rules' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span>{language === 'bn' ? '৫. সিট রুলস, ভিআইপি ফেয়ার ও এমার্জেন্সি লক পলিসি' : '5. Seat Rules & Locking Policies'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">ডিফল্ট স্ট্যান্ডার্ড সিট ভাড়া (৳)</label>
                    <input
                      type="number"
                      value={orgSettings.seatSettings.standardFareDefault}
                      onChange={(e) => setOrgSettings({ ...orgSettings, seatSettings: { ...orgSettings.seatSettings, standardFareDefault: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5">ডিফল্ট ভিআইপি (A-E Row) সিট ভাড়া (৳)</label>
                    <input
                      type="number"
                      value={orgSettings.seatSettings.vipFareDefault}
                      onChange={(e) => setOrgSettings({ ...orgSettings, seatSettings: { ...orgSettings.seatSettings, vipFareDefault: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2 p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200 block">জেন্ডার সংলগ্ন সিট অটো-লক (Strict Gender Validation)</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400">ছাত্রী কোচে ও সাধারণ বাসে নারী যাত্রীর পাশে অপরিচিত পুরুষ টিকিট কাটা রোধ করে</span>
                    </div>
                    <Badge variant="warning">সক্রিয় (Active)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 6: Passenger Eligibility */}
          {activeSection === 'passenger_rules' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>{language === 'bn' ? '৬. যাত্রী যোগ্যতা ও অভিভাবক সম্পর্ক পলিসি' : '6. Passenger Eligibility Rules'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold block text-slate-900 dark:text-white">অনুমোদিত অভিভাবক সম্পর্ক (ছাত্রী বাস):</span>
                    <div className="flex flex-wrap gap-2">
                      {['বাবা (Father)', 'মা (Mother)', 'ভাই (Brother)', 'বোন (Sister)', 'স্বামী (Spouse)'].map((rel, i) => (
                        <span key={i} className="px-3 py-1 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-bold text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {rel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5">এক মোবাইল নম্বর থেকে সর্বোচ্চ টিকিট লিমিট</label>
                    <input
                      type="number"
                      value={orgSettings.passengerRules.maxTicketsPerPhone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, passengerRules: { ...orgSettings.passengerRules, maxTicketsPerPhone: Number(e.target.value) } })}
                      className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 7: Stops & Boarding Points */}
          {activeSection === 'stops' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '৭. বোর্ডিং ও ড্রপিং পয়েন্ট ড্রপডাউন' : '7. Boarding & Dropping Points'}</span>
                </CardTitle>
                <Badge variant="primary">{orgSettings.stops.length} টি পয়েন্ট নিবন্ধিত</Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-2">
                  {orgSettings.stops.map((st, i) => (
                    <div key={st.id || i} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold w-6 text-center text-blue-600">{st.sequence}.</span>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{st.nameBn}</span>
                          <span className="text-[11px] text-slate-500 ml-2">({st.area})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {st.pickupEnabled && <Badge variant="primary">PICKUP</Badge>}
                        {st.dropEnabled && <Badge variant="success">DROP</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 8: Booking & Hold Policies */}
          {activeSection === 'booking' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '৮. টিকিট বুকিং ও সিট হোল্ড টাইমার' : '8. Booking & Hold Rules'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">অনলাইন পাবলিক সিট হোল্ড উইন্ডো (মিনিট)</label>
                    <input
                      type="number"
                      value={orgSettings.booking.seatHoldMinutesPublic}
                      onChange={(e) => setOrgSettings({ ...orgSettings, booking: { ...orgSettings.booking, seatHoldMinutesPublic: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">শিক্ষার্থী টিকিট কাটার সময় সর্বোচ্চ ৫ মিনিট লক থাকবে</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5">কাউন্টার স্টাফ সিট হোল্ড উইন্ডো (মিনিট)</label>
                    <input
                      type="number"
                      value={orgSettings.booking.seatHoldMinutesStaff}
                      onChange={(e) => setOrgSettings({ ...orgSettings, booking: { ...orgSettings.booking, seatHoldMinutesStaff: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">কাউন্টার বুকিংয়ের সময় সর্বোচ্চ ১৫ মিনিট হোল্ড থাকবে</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 9: Discounts & Caps */}
          {activeSection === 'discounts' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Percent className="w-5 h-5 text-purple-600" />
                  <span>{language === 'bn' ? '৯. ডিসকাউন্ট ও ছাড়ের রোল-ভিত্তিক লিমিট' : '9. Role-Based Discount Limits'}</span>
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

          {/* SECTION 10: Payment Gateways & MFS */}
          {activeSection === 'payments' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'bn' ? '১০. পেমেন্ট গেটওয়ে ও বিকাশ/নগদ মার্চেন্ট কনফিগ' : '10. Payment Gateways & MFS'}</span>
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

          {/* SECTION 11: Finance & Day Closing */}
          {activeSection === 'finance' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span>{language === 'bn' ? '১১. অর্থ, ক্যাশ ড্রয়ার ও ডে ক্লোজিং হিসাব' : '11. Finance & Day Closing'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">দৈনিক হিসাব ক্লোজিং টাইম (Business Closing Time)</label>
                    <input
                      type="time"
                      value={orgSettings.finance.businessDayClosingTime}
                      onChange={(e) => setOrgSettings({ ...orgSettings, finance: { ...orgSettings.finance, businessDayClosingTime: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-900 dark:text-blue-200 block">ক্লোজিং-পরবর্তী এডিট লক</span>
                      <span className="text-[11px] text-blue-700 dark:text-blue-400">ডে ক্লোজিং সম্পন্ন হলে স্টাফরা আর পুরনো দিনের লেনদেন সংশোধন করতে পারবে না</span>
                    </div>
                    <Badge variant="primary">লক সক্রিয়</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 12: Income & Expense Categories */}
          {activeSection === 'categories' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>{language === 'bn' ? '১২. আয় ও ব্যয় ক্যাটাগরি ব্যবস্থাপনা' : '12. Income & Expense Categories'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Income Categories */}
                  <div className="space-y-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-sm">আয় ক্যাটাগরি (Income Tags):</span>
                    <div className="space-y-1.5">
                      {orgSettings.categories.income.map((cat, idx) => (
                        <div key={idx} className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                          <span>{cat}</span>
                          <span className="text-[10px] text-emerald-600 font-mono">ACTIVE</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expense Categories */}
                  <div className="space-y-3">
                    <span className="font-bold text-rose-600 dark:text-rose-400 block text-sm">ব্যয় ক্যাটাগরি (Expense Tags):</span>
                    <div className="space-y-1.5">
                      {orgSettings.categories.expense.map((cat, idx) => (
                        <div key={idx} className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl font-bold text-rose-900 dark:text-rose-200 flex items-center justify-between">
                          <span>{cat}</span>
                          <span className="text-[10px] text-rose-600 font-mono">ACTIVE</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 13: Documents & Thermal Printing */}
          {activeSection === 'documents' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '১৩. ডকুমেন্ট ও থার্মাল পিওএস প্রিন্ট সেটিংস' : '13. Documents & Thermal Print'}</span>
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

          {/* SECTION 14: SMS & WhatsApp Gateways */}
          {activeSection === 'communication' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'bn' ? '১৪. এসএমএস ও হোয়াটসঅ্যাপ অটোমেশন গেটওয়ে' : '14. SMS & WhatsApp Automation'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">Greenweb SMS Gateway</span>
                      <Badge variant="success">CONNECTED</Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 block">বুকিং নিশ্চিত হলে পরীক্ষার্থীর মোবাইলে তৎক্ষণাৎ SMS পৌঁছে যায়।</span>
                  </div>

                  <div className="p-4 bg-green-50/50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-800 dark:text-green-300">WhatsApp Cloud API</span>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 block">শিক্ষার্থীর হোয়াটসঅ্যাপে সরাসরি টিকিট PDF এবং লাইভ বাস ট্র্যাকিং লিংক প্রদান।</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 15: Security & Session */}
          {activeSection === 'security' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  <span>{language === 'bn' ? '১৫. নিরাপত্তা, পাসওয়ার্ড ও সেশন ম্যানেজমেন্ট' : '15. Security & Session Management'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">সেশন টাইমআউট (মিনিট)</label>
                    <input
                      type="number"
                      value={orgSettings.security.sessionTimeoutMinutes}
                      onChange={(e) => setOrgSettings({ ...orgSettings, security: { ...orgSettings.security, sessionTimeoutMinutes: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5">সর্বোচ্চ ভুল পাসওয়ার্ড লিমিট (Login Attempts)</label>
                    <input
                      type="number"
                      value={orgSettings.security.maxFailedLoginAttempts}
                      onChange={(e) => setOrgSettings({ ...orgSettings, security: { ...orgSettings.security, maxFailedLoginAttempts: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 16: Appearance & Themes */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <AppearanceSettingsClient />
            </div>
          )}

          {/* SECTION 17: Payment Brand Logos */}
          {activeSection === 'payment_logos' && (
            <div className="space-y-6">
              <PaymentLogosSettingsClient />
            </div>
          )}

          {/* SECTION 18: Database Backup & Hosting Migration */}
          {activeSection === 'database_backup' && (
            <div className="space-y-6">
              <DatabaseBackupClient />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
