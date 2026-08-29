'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Sparkles,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  Search,
  Tag,
  TrendingUp,
  Percent,
  Calendar,
  Share2,
  Shield,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  MarketingCoupon,
  getMarketingCoupons,
  fetchMarketingCoupons,
  createMarketingCouponAsync,
  toggleCouponActiveAsync,
  deleteMarketingCouponAsync
} from '@/services/coupon.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useApp } from '@/lib/context';
import Link from 'next/link';

export default function MarketingCouponsPage() {
  const { language } = useApp();
  const [coupons, setCoupons] = useState<MarketingCoupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState<'FACEBOOK' | 'CAMPUS_BOOTH' | 'LEAFLET' | 'STUDENT_REFERRAL' | 'SMS_CAMPAIGN' | 'SPECIAL_EVENT'>('FACEBOOK');
  const [newDiscountType, setNewDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [newDiscountValue, setNewDiscountValue] = useState<number>(100);
  const [newMaxUsage, setNewMaxUsage] = useState<number>(500);
  const [newMinPurchase, setNewMinPurchase] = useState<number>(0);
  const [newMaxDiscountLimit, setNewMaxDiscountLimit] = useState<number>(200);
  const [newTargetUniversity, setNewTargetUniversity] = useState<string>('ALL');
  const [newExpiryDate, setNewExpiryDate] = useState<string>('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    setCoupons(getMarketingCoupons());
    fetchMarketingCoupons().then(res => {
      if (res && res.length > 0) setCoupons(res);
    });
  }, []);

  const handleGenerateRandomCode = () => {
    const prefixes = ['ADMIT', 'CAMPUS', 'VARSITY', 'STUDENT', 'SPECIAL', 'PROMO', 'OFFER'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setNewCode(`${randomPrefix}${randomNum}`);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim() || newDiscountValue <= 0) return;

    await createMarketingCouponAsync({
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim(),
      campaignChannel: newChannel,
      discountType: newDiscountType,
      discountValue: Number(newDiscountValue),
      minPurchaseAmount: newMinPurchase > 0 ? Number(newMinPurchase) : undefined,
      maxDiscountLimit: newDiscountType === 'PERCENTAGE' && newMaxDiscountLimit > 0 ? Number(newMaxDiscountLimit) : undefined,
      targetUniversity: newTargetUniversity,
      expiryDate: newExpiryDate || undefined,
      maxUsageLimit: Number(newMaxUsage) || 500,
      isActive: true,
      notes: newNotes.trim() || undefined
    });

    const updated = await fetchMarketingCoupons();
    setCoupons(updated);
    setIsCreateModalOpen(false);
    // Reset
    setNewCode('');
    setNewTitle('');
    setNewDiscountValue(100);
    setNewNotes('');
  };

  const handleToggle = async (id: string) => {
    const updated = await toggleCouponActiveAsync(id);
    setCoupons(updated);
  };

  const handleDelete = async (id: string) => {
    if (confirm(language === 'bn' ? 'আপনি কি এই কুপনটি ডিলিট করতে চান?' : 'Are you sure you want to delete this coupon?')) {
      const updated = await deleteMarketingCouponAsync(id);
      setCoupons(updated);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) || c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = filterChannel === 'ALL' || c.campaignChannel === filterChannel;
    return matchesSearch && matchesChannel;
  });

  const totalActive = coupons.filter(c => c.isActive).length;
  const totalUses = coupons.reduce((sum, c) => sum + c.usageCount, 0);

  const channelBadges: Record<string, { label: string; bg: string }> = {
    FACEBOOK: { label: '📱 Facebook Campaign', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' },
    CAMPUS_BOOTH: { label: '🏫 Campus Booth', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
    LEAFLET: { label: '📄 Leaflet & Flyer', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' },
    STUDENT_REFERRAL: { label: '🤝 Student Referral', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200' },
    SMS_CAMPAIGN: { label: '💬 SMS Broadcast', bg: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200' },
    SPECIAL_EVENT: { label: '🎉 Special Event', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Marketing & Growth
            </Badge>
            <span className="text-xs font-mono font-bold text-slate-500">
              SECRET CAMPAIGN COUPONS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'মার্কেটিং কুপন ও প্রমো কোড জেনারেটর' : 'Marketing Campaign Coupon Generator'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'ফেসবুক ক্যাম্পেইন, লিফলেট বা ক্যাম্পাস প্রমোশনের জন্য স্পেশাল কোড তৈরি করুন। শিক্ষার্থীরা কাউন্টারে এই কোড বললে ছাড় কার্যকর হবে।'
              : 'Create campaign-specific promo codes for social media and campus campaigns. Counter staff applies discounts when students present codes.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/bookings/new">
            <Button variant="outline" className="rounded-2xl font-bold text-xs">
              {language === 'bn' ? 'কাউন্টার বুকিংয়ে যান' : 'Go to Booking Wizard'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Button
            variant="primary"
            onClick={() => {
              handleGenerateRandomCode();
              setIsCreateModalOpen(true);
            }}
            className="rounded-2xl font-black shadow-lg shadow-blue-500/25 px-5"
          >
            <Plus className="w-5 h-5 mr-1.5" />
            {language === 'bn' ? 'নতুন কুপন জেনারেট করুন' : 'Generate New Coupon'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase font-mono">
            {language === 'bn' ? 'সক্রিয় কুপন সংখ্যা' : 'Active Coupons'}
          </span>
          <div className="text-2xl font-black text-blue-900 dark:text-white font-mono mt-1">
            {totalActive} / {coupons.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'চলতি ক্যাম্পেইনে যুক্ত' : 'Active campaigns'}
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase font-mono">
            {language === 'bn' ? 'মোট টিকিট দাবি / ব্যবহার' : 'Total Redemptions'}
          </span>
          <div className="text-2xl font-black text-emerald-900 dark:text-white font-mono mt-1">
            {totalUses} {language === 'bn' ? 'বার' : 'Times'}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'কাউন্টারে বুকিংয়ে প্রযোজ্য' : 'Redeemed at counters'}
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase font-mono">
            {language === 'bn' ? 'ক্যাম্পেইন চ্যানেল' : 'Marketing Channels'}
          </span>
          <div className="text-2xl font-black text-purple-900 dark:text-white font-mono mt-1">
            6 {language === 'bn' ? 'টি চ্যানেল' : 'Channels'}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            FB, Campus, SMS, Leaflet
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase font-mono">
            {language === 'bn' ? 'গোপনীয়তা স্ট্যাটাস' : 'Security Mode'}
          </span>
          <div className="text-sm font-black text-amber-900 dark:text-amber-200 mt-1 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-600" />
            {language === 'bn' ? 'স্টাফ ও মার্কেটিং প্রটেক্টেড' : 'Staff Protected'}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'পাবলিক পেজে সরাসরি দৃশ্যমান নয়' : 'Hidden from public'}
          </span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'কুপন কোড বা ক্যাম্পেইনের নাম খুঁজুন...' : 'Search coupon code or campaign...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
          >
            <option value="ALL">{language === 'bn' ? 'সকল ক্যাম্পেইন চ্যানেল' : 'All Channels'}</option>
            <option value="FACEBOOK">Facebook Campaign</option>
            <option value="CAMPUS_BOOTH">Campus Booth</option>
            <option value="LEAFLET">Leaflet & Flyer</option>
            <option value="STUDENT_REFERRAL">Student Referral</option>
            <option value="SMS_CAMPAIGN">SMS Broadcast</option>
            <option value="SPECIAL_EVENT">Special Event</option>
          </select>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCoupons.map((c) => {
          const chBadge = channelBadges[c.campaignChannel] || { label: c.campaignChannel, bg: 'bg-slate-100' };

          return (
            <Card key={c.id} className={`overflow-hidden border-2 transition-all ${c.isActive ? 'border-slate-200 dark:border-slate-800 hover:border-blue-400' : 'border-slate-200 opacity-60 bg-slate-50/50'}`}>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md font-mono ${chBadge.bg}`}>
                      {chBadge.label}
                    </span>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white mt-2">
                      {c.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(c.id)}
                      title={c.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded-lg border transition-colors ${c.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Big Coupon Code Box with Copy Button */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border-2 border-dashed border-blue-400 dark:border-blue-700 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block font-mono">
                      {language === 'bn' ? 'প্রমো কোড (মার্কেটিং)' : 'Promo Code'}
                    </span>
                    <span className="text-lg font-black text-blue-950 dark:text-white font-mono tracking-widest">
                      {c.code}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(c.code, c.id)}
                    className="rounded-xl font-bold text-xs bg-white dark:bg-slate-900 border-blue-300 shadow-2xs"
                  >
                    {copiedId === c.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        <span className="text-emerald-600">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        <span>কপি</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Value & Rules */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {language === 'bn' ? 'ছাড়ের পরিমাণ:' : 'Discount Value:'}
                    </span>
                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      {c.discountType === 'FIXED' ? formatCurrency(c.discountValue) : `${c.discountValue}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {language === 'bn' ? 'ব্যবহার সংখ্যা:' : 'Usage Progress:'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {c.usageCount} / {c.maxUsageLimit}
                    </span>
                  </div>
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    💡 {c.notes}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            {language === 'bn' ? 'কোনো কুপন কোড পাওয়া যায়নি' : 'No Coupon Codes Found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'bn' ? 'নতুন কুপন তৈরি করতে উপরের বাটনে ক্লিক করুন।' : 'Click the button above to generate your first marketing coupon.'}
          </p>
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={language === 'bn' ? 'নতুন মার্কেটিং কুপন তৈরি করুন' : 'Generate Marketing Coupon'}
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'কুপন কোড *' : 'Coupon Code *'}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomCode}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {language === 'bn' ? 'অটো জেনারেট' : 'Auto Generate'}
                </button>
              </div>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. ADMISSION2026"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 font-mono font-black uppercase tracking-wider border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'ক্যাম্পেইন চ্যানেল / উৎস *' : 'Campaign Channel *'}
              </label>
              <select
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="FACEBOOK">Facebook Campaign / Page</option>
                <option value="CAMPUS_BOOTH">Campus Booth & Coaching Center</option>
                <option value="LEAFLET">Leaflet & Flyer Promotion</option>
                <option value="STUDENT_REFERRAL">Student Referral Program</option>
                <option value="SMS_CAMPAIGN">SMS Broadcast Offer</option>
                <option value="SPECIAL_EVENT">Special Event / Quota</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'ক্যাম্পেইন বা অফারের শিরোনাম *' : 'Campaign Title *'}
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="যেমন: রাজশাহী বিশ্ববিদ্যালয় ভর্তি স্পেশাল অফার"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'ছাড়ের ধরণ *' : 'Discount Type *'}
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newDiscountType === 'FIXED' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setNewDiscountType('FIXED')}
                  className="flex-1 rounded-xl font-bold"
                >
                  {language === 'bn' ? 'নির্দিষ্ট টাকা (Fixed ৳)' : 'Fixed ৳'}
                </Button>
                <Button
                  type="button"
                  variant={newDiscountType === 'PERCENTAGE' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setNewDiscountType('PERCENTAGE')}
                  className="flex-1 rounded-xl font-bold"
                >
                  {language === 'bn' ? 'শতাংশ (%)' : 'Percentage %'}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? (newDiscountType === 'FIXED' ? 'ছাড়ের পরিমাণ (টাকা) *' : 'ছাড়ের হার (%) *') : 'Discount Value *'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={newDiscountValue}
                onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'সর্বোচ্চ ব্যবহার লিমিট' : 'Max Redemptions'}
              </label>
              <input
                type="number"
                min="1"
                value={newMaxUsage}
                onChange={(e) => setNewMaxUsage(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 font-mono border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'মেয়াদ শেষের তারিখ (ঐচ্ছিক)' : 'Expiry Date (Optional)'}
              </label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'অভ্যন্তরীণ নোট / শর্তাবলী' : 'Internal Notes / Rules'}
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="যেমন: শুধুমাত্র রাজশাহী বিশ্ববিদ্যালয়গামী বাসে প্রযোজ্য"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl font-bold"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-xl font-black px-6 shadow-md"
            >
              {language === 'bn' ? 'কুপন সেভ ও সক্রিয় করুন' : 'Save & Activate Coupon'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
