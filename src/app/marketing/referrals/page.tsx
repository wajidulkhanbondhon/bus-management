'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Users2,
  Settings,
  Share2,
  TrendingUp,
  UserPlus,
  Coins,
  Copy,
  Plus
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface ReferralCampaign {
  id: string;
  name: string;
  referrerBonus: number;
  refereeDiscount: number;
  totalReferrals: number;
  revenueGenerated: number;
  isActive: boolean;
}

const dummyCampaigns: ReferralCampaign[] = [
  { id: '1', name: 'Standard Refer & Earn', referrerBonus: 50, refereeDiscount: 10, totalReferrals: 450, revenueGenerated: 350000, isActive: true },
  { id: '2', name: 'Campus Ambassador (DU)', referrerBonus: 100, refereeDiscount: 15, totalReferrals: 120, revenueGenerated: 96000, isActive: true },
  { id: '3', name: 'Eid Special Invite', referrerBonus: 200, refereeDiscount: 20, totalReferrals: 890, revenueGenerated: 850000, isActive: false },
];

export default function ReferralsPage() {
  const { language } = useApp();
  const [campaigns, setCampaigns] = useState<ReferralCampaign[]>(dummyCampaigns);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [newName, setNewName] = useState('');
  const [newReferrerBonus, setNewReferrerBonus] = useState<number>(50);
  const [newRefereeDiscount, setNewRefereeDiscount] = useState<number>(10);

  const toggleCampaign = (id: string) => {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const newCampaign: ReferralCampaign = {
      id: Date.now().toString(),
      name: newName,
      referrerBonus: newReferrerBonus,
      refereeDiscount: newRefereeDiscount,
      totalReferrals: 0,
      revenueGenerated: 0,
      isActive: true
    };
    
    setCampaigns([newCampaign, ...campaigns]);
    setIsCreateModalOpen(false);
    setNewName('');
  };

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    // In real app: navigator.clipboard.writeText(`https://busapp.com/invite/${id}`);
  };

  const totalNewUsers = campaigns.reduce((sum, c) => sum + c.totalReferrals, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenueGenerated, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border-sky-200 dark:border-sky-800">
              <Users2 className="w-3.5 h-3.5 mr-1" />
              Growth & Acquisition
            </Badge>
            <span className="text-xs font-mono font-bold text-slate-500">
              REFERRAL MANAGER
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'রেফারেল প্রোগ্রাম' : 'Referral Programs'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {language === 'bn'
              ? 'আপনার যাত্রীদের মাধ্যমেই নতুন যাত্রী নিয়ে আসুন। ইনভাইট করলে দুজনেই পাবে আকর্ষণীয় বোনাস!'
              : 'Acquire new users through your existing passengers. Set up mutually beneficial invite bonuses.'}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-2xl font-black shadow-lg shadow-sky-500/25 px-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-none"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          {language === 'bn' ? 'নতুন ক্যাম্পেইন' : 'New Campaign'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-500/20">
          <div className="flex items-center gap-3 text-sky-700 dark:text-sky-400 mb-2">
            <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="font-bold">{language === 'bn' ? 'নতুন যাত্রী যুক্ত হয়েছে' : 'Total New Users'}</span>
          </div>
          <h2 className="text-3xl font-black text-sky-900 dark:text-white font-mono">{totalNewUsers.toLocaleString()}</h2>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-bold">{language === 'bn' ? 'রেফারেল থেকে আয়' : 'Revenue from Referrals'}</span>
          </div>
          <h2 className="text-3xl font-black text-emerald-900 dark:text-white font-mono">৳ {totalRevenue.toLocaleString()}</h2>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <div className="flex items-center gap-3 text-indigo-700 dark:text-indigo-400 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="font-bold">{language === 'bn' ? 'সক্রিয় ক্যাম্পেইন' : 'Active Campaigns'}</span>
          </div>
          <h2 className="text-3xl font-black text-indigo-900 dark:text-white font-mono">{campaigns.filter(c => c.isActive).length}</h2>
        </Card>
      </div>

      {/* Campaigns Grid */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-8 mb-4">
        {language === 'bn' ? 'সকল রেফারেল ক্যাম্পেইন' : 'All Campaigns'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className={`overflow-hidden border-2 transition-all ${campaign.isActive ? 'border-sky-200 dark:border-sky-800 shadow-md shadow-sky-500/5' : 'border-slate-200 opacity-70 bg-slate-50/50 dark:bg-slate-900/50'}`}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md font-mono tracking-wider
                    ${campaign.isActive ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' : 'bg-slate-200 text-slate-500'}`}>
                    {campaign.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mt-2">{campaign.name}</h3>
                </div>
                
                <div className="relative inline-flex items-center cursor-pointer" onClick={() => toggleCampaign(campaign.id)}>
                  <div className={`w-11 h-6 rounded-full transition-colors ${campaign.isActive ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full mt-0.5 ml-0.5 shadow transition-transform ${campaign.isActive ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
              </div>

              {/* Bonus Rules */}
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    {language === 'bn' ? 'যিনি ইনভাইট করবেন (Referrer)' : 'Referrer Gets'}
                  </span>
                  <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-black font-mono">
                    <Coins className="w-4 h-4" /> ৳ {campaign.referrerBonus}
                  </div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    {language === 'bn' ? 'যিনি জয়েন করবেন (Referee)' : 'Referee Gets'}
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black font-mono">
                    <TrendingUp className="w-4 h-4" /> {campaign.refereeDiscount}% OFF
                  </div>
                </div>
              </div>

              {/* Action & Stats */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Users Joined</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{campaign.totalReferrals}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Revenue</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">৳{campaign.revenueGenerated/1000}k</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCopy(campaign.id)}
                  disabled={!campaign.isActive}
                  className={`rounded-lg font-bold text-xs ${copiedId === campaign.id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}`}
                >
                  {copiedId === campaign.id ? (
                    language === 'bn' ? 'কপি হয়েছে!' : 'Copied!'
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      {language === 'bn' ? 'লিংক কপি' : 'Copy Link'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={language === 'bn' ? 'নতুন রেফারেল ক্যাম্পেইন' : 'New Referral Campaign'}
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'ক্যাম্পেইনের নাম' : 'Campaign Name'}
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Campus Ambassador DU"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'ইনভাইটার পাবে (৳)' : 'Referrer Bonus (৳)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">৳</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={newReferrerBonus}
                  onChange={(e) => setNewReferrerBonus(Number(e.target.value))}
                  className="w-full pl-7 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'নতুন ইউজার পাবে (%)' : 'Referee Discount (%)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={newRefereeDiscount}
                  onChange={(e) => setNewRefereeDiscount(Number(e.target.value))}
                  className="w-full pl-3.5 pr-7 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl font-bold">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl font-black px-6 shadow-md bg-sky-500 hover:bg-sky-600 border-none text-white">
              {language === 'bn' ? 'তৈরি করুন' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
