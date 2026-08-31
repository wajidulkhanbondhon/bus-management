'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  MessageCircle,
  Settings,
  Eye,
  TrendingUp,
  MousePointerClick,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Power,
  Trash2,
  Save
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface FomoAlert {
  id: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'URGENCY' | 'VIEWING';
  isActive: boolean;
  impressions: number;
  clicks: number;
}

const dummyAlerts: FomoAlert[] = [
  { id: '1', title: 'Recent Booking', message: 'এইমাত্র ঢাকা-কক্সবাজার রুটে ৩টি টিকিট বিক্রি হলো!', type: 'BOOKING', isActive: true, impressions: 12450, clicks: 342 },
  { id: '2', title: 'Seat Urgency', message: 'আগামীকালের সিলেট বাসে আর মাত্র ৪টি সিট বাকি আছে!', type: 'URGENCY', isActive: true, impressions: 8320, clicks: 512 },
  { id: '3', title: 'Live Viewing', message: 'বর্তমানে ২৫ জন এই রুটের টিকিট দেখছেন!', type: 'VIEWING', isActive: false, impressions: 4100, clicks: 120 }
];

export default function SocialProofPage() {
  const { language } = useApp();
  const [alerts, setAlerts] = useState<FomoAlert[]>(dummyAlerts);
  const [globalStatus, setGlobalStatus] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'BOOKING' | 'URGENCY' | 'VIEWING'>('BOOKING');

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    
    const newAlert: FomoAlert = {
      id: Date.now().toString(),
      title: newTitle,
      message: newMessage,
      type: newType,
      isActive: true,
      impressions: 0,
      clicks: 0
    };
    
    setAlerts([newAlert, ...alerts]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewMessage('');
  };

  const totalImpressions = alerts.reduce((sum, a) => sum + a.impressions, 0);
  const totalClicks = alerts.reduce((sum, a) => sum + a.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-800">
              <MessageCircle className="w-3.5 h-3.5 mr-1" />
              Marketing & Growth
            </Badge>
            <span className="text-xs font-mono font-bold text-slate-500">
              FOMO ALERTS MANAGER
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'সোশ্যাল প্রুফ ও আর্জেন্সি (FOMO)' : 'Social Proof & FOMO Alerts'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'ওয়েবসাইটে লাইভ পপ-আপ নোটিফিকেশন দেখিয়ে যাত্রীদের দ্রুত টিকিট কাটতে উৎসাহিত করুন।'
              : 'Encourage faster bookings by showing live pop-up notifications to website visitors.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsSettingsModalOpen(true)}
            className="rounded-2xl font-bold text-xs bg-white dark:bg-slate-900"
          >
            <Settings className="w-4 h-4 mr-1.5 text-slate-500" />
            {language === 'bn' ? 'পপ-আপ সেটিংস' : 'Popup Settings'}
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-2xl font-black shadow-lg shadow-blue-500/25 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none"
          >
            <Plus className="w-5 h-5 mr-1.5" />
            {language === 'bn' ? 'নতুন অ্যালার্ট তৈরি করুন' : 'Create New Alert'}
          </Button>
        </div>
      </div>

      {/* Global Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${globalStatus ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${globalStatus ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            <Power className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${globalStatus ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-300'}`}>
              {language === 'bn' ? 'গ্লোবাল পপ-আপ স্ট্যাটাস' : 'Global Popup Status'}
            </h3>
            <p className={`text-xs mt-0.5 ${globalStatus ? 'text-emerald-700 dark:text-emerald-400/80' : 'text-slate-500'}`}>
              {language === 'bn' 
                ? (globalStatus ? 'ওয়েবসাইটে এখন লাইভ পপ-আপ দেখানো হচ্ছে।' : 'ওয়েবসাইটে পপ-আপ দেখানো বন্ধ আছে।')
                : (globalStatus ? 'Live popups are currently visible on the website.' : 'Popups are currently disabled.')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setGlobalStatus(!globalStatus)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${globalStatus ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${globalStatus ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20">
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase font-mono">
            {language === 'bn' ? 'সক্রিয় অ্যালার্ট' : 'Active Alerts'}
          </span>
          <div className="text-2xl font-black text-indigo-900 dark:text-white font-mono mt-1">
            {alerts.filter(a => a.isActive).length}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'বর্তমানে চালু আছে' : 'Currently running'}
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase font-mono flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {language === 'bn' ? 'মোট ভিউ (ইম্প্রেশন)' : 'Total Impressions'}
          </span>
          <div className="text-2xl font-black text-blue-900 dark:text-white font-mono mt-1">
            {totalImpressions.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'পপ-আপ প্রদর্শিত হয়েছে' : 'Popups shown to users'}
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase font-mono flex items-center gap-1">
            <MousePointerClick className="w-3.5 h-3.5" />
            {language === 'bn' ? 'ক্লিক সংখ্যা' : 'Total Clicks'}
          </span>
          <div className="text-2xl font-black text-emerald-900 dark:text-white font-mono mt-1">
            {totalClicks.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'পপ-আপ থেকে ভিজিট' : 'Visits via popup'}
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {language === 'bn' ? 'ক্লিক-থ্রু রেট (CTR)' : 'Click-Through Rate'}
          </span>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
            {avgCtr}%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'গড় কনভার্শন রেট' : 'Average conversion'}
          </span>
        </Card>
      </div>

      {/* Alerts Grid */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-8 mb-4">
        {language === 'bn' ? 'অ্যালার্ট লিস্ট' : 'Alert Templates'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {alerts.map((alert) => (
          <Card key={alert.id} className={`overflow-hidden border-2 transition-all ${alert.isActive ? 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 shadow-lg shadow-indigo-500/5' : 'border-slate-200 opacity-60 bg-slate-50/50'}`}>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md font-mono 
                    ${alert.type === 'BOOKING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 
                      alert.type === 'URGENCY' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : 
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                    {alert.type}
                  </span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white mt-2">
                    {alert.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${alert.isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div className="relative p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <div className="absolute -top-2 -left-2 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">
                  <MessageCircle className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    "{alert.message}"
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Verified by System
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Views
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {alert.impressions.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" /> Clicks
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {alert.clicks.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={language === 'bn' ? 'নতুন অ্যালার্ট তৈরি করুন' : 'Create FOMO Alert'}
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'অ্যালার্টের ধরণ' : 'Alert Type'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['BOOKING', 'URGENCY', 'VIEWING'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={`py-2 text-xs font-bold rounded-xl border ${newType === type ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'শিরোনাম (ইন্টারনাল ব্যবহারের জন্য)' : 'Title (Internal)'}
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Dhaka-Ctg Urgency"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'পপ-আপ মেসেজ (যা ইউজার দেখবে)' : 'Popup Message (Visible to User)'}
            </label>
            <textarea
              required
              rows={3}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="e.g. এইমাত্র ঢাকা-কক্সবাজার রুটে ৩টি টিকিট বিক্রি হলো!"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl font-bold">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl font-black px-6 shadow-md bg-indigo-600 hover:bg-indigo-700 border-none">
              {language === 'bn' ? 'সেভ করুন' : 'Save Alert'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={language === 'bn' ? 'পপ-আপ সেটিংস' : 'Popup Configuration'}
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                {language === 'bn' ? 'নোটিফিকেশন বিরতি (Interval)' : 'Notification Interval'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">কতক্ষণ পরপর নতুন পপ-আপ আসবে</p>
            </div>
            <select className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold">
              <option>5 sec</option>
              <option>10 sec</option>
              <option>30 sec</option>
              <option>1 min</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                {language === 'bn' ? 'ডুপ্লিকেট প্রতিরোধ' : 'Prevent Duplicates'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">একই ইউজারকে বারবার একই মেসেজ না দেখানো</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsSettingsModalOpen(false)} className="rounded-xl font-bold px-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 border-none">
              <Save className="w-4 h-4 mr-1.5" />
              {language === 'bn' ? 'সেটিংস সেভ করুন' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
