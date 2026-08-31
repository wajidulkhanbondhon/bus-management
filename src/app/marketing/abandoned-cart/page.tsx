'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PhoneIncoming,
  Settings,
  RefreshCw,
  TrendingUp,
  Clock,
  MessageSquare,
  Percent,
  Power,
  Save,
  BellRing
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface AbandonedCart {
  id: string;
  phone: string;
  route: string;
  seatSelected: string;
  price: number;
  timeAgo: string;
  status: 'PENDING' | 'RECOVERED' | 'LOST';
}

const dummyCarts: AbandonedCart[] = [
  { id: '1', phone: '01711***456', route: 'Dhaka - Cox\'s Bazar', seatSelected: 'A1, A2', price: 2400, timeAgo: '15 mins ago', status: 'PENDING' },
  { id: '2', phone: '01822***789', route: 'Sylhet - Dhaka', seatSelected: 'B3', price: 800, timeAgo: '1 hour ago', status: 'PENDING' },
  { id: '3', phone: '01933***123', route: 'Dhaka - Khulna', seatSelected: 'C1, C2', price: 1600, timeAgo: '2 hours ago', status: 'RECOVERED' },
  { id: '4', phone: '01644***321', route: 'Chittagong - Sylhet', seatSelected: 'D4', price: 1200, timeAgo: '5 hours ago', status: 'LOST' },
  { id: '5', phone: '01555***654', route: 'Dhaka - Rajshahi', seatSelected: 'E1, E2, E3', price: 2100, timeAgo: '1 day ago', status: 'RECOVERED' },
];

export default function AbandonedCartPage() {
  const { language } = useApp();
  const [globalStatus, setGlobalStatus] = useState<boolean>(true);
  
  // Settings State
  const [smsDelay, setSmsDelay] = useState<number>(15);
  const [recoveryDiscount, setRecoveryDiscount] = useState<number>(5);
  
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const pendingCarts = dummyCarts.filter(c => c.status === 'PENDING').length;
  const recoveredCarts = dummyCarts.filter(c => c.status === 'RECOVERED').length;
  const recoveredRevenue = dummyCarts.filter(c => c.status === 'RECOVERED').reduce((sum, c) => sum + c.price, 0);
  const recoveryRate = ((recoveredCarts / dummyCarts.length) * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-800">
              <PhoneIncoming className="w-3.5 h-3.5 mr-1" />
              Revenue Recovery
            </Badge>
            <span className="text-xs font-mono font-bold text-slate-500">
              ABANDONED CART MANAGER
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'অ্যাবানডনড কার্ট রিকভারি' : 'Abandoned Cart Recovery'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {language === 'bn'
              ? 'যারা সিট সিলেক্ট করেও পেমেন্ট করেনি, তাদের স্বয়ংক্রিয়ভাবে মেসেজ পাঠিয়ে টিকিট কিনতে উৎসাহিত করুন।'
              : 'Automatically follow up with passengers who selected seats but did not complete payment.'}
          </p>
        </div>
      </div>

      {/* Global Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${globalStatus ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${globalStatus ? 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            <Power className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${globalStatus ? 'text-rose-900 dark:text-rose-100' : 'text-slate-700 dark:text-slate-300'}`}>
              {language === 'bn' ? 'অটো-রিকভারি স্ট্যাটাস' : 'Auto-Recovery Status'}
            </h3>
            <p className={`text-xs mt-0.5 ${globalStatus ? 'text-rose-700 dark:text-rose-400/80' : 'text-slate-500'}`}>
              {language === 'bn' 
                ? (globalStatus ? 'বর্তমানে টিকিট না কাটা যাত্রীদের অটোমেটিক মেসেজ পাঠানো হচ্ছে।' : 'অটোমেটিক মেসেজ পাঠানো বন্ধ আছে।')
                : (globalStatus ? 'Automatic SMS follow-ups are currently active.' : 'Auto-recovery is currently disabled.')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setGlobalStatus(!globalStatus)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${globalStatus ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${globalStatus ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending Drop-offs'}
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            {pendingCarts}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {language === 'bn' ? 'পেমেন্ট করেনি' : 'Awaiting payment'}
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {language === 'bn' ? 'রিকভারি রেট' : 'Recovery Rate'}
          </span>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono mt-1">
            {recoveryRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'অটো মেসেজের পর কিনেছে' : 'Bought after follow-up'}
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 lg:col-span-2">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase font-mono flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            {language === 'bn' ? 'পুনরুদ্ধারকৃত আয়' : 'Recovered Revenue'}
          </span>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono mt-1">
            ৳ {recoveredRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {language === 'bn' ? 'যারা কিনত না, তাদের থেকে আয়' : 'Revenue saved by recovery campaigns'}
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">
        
        {/* Left Column: Automation Settings */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="p-0 overflow-hidden border-2 border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'অটোমেশন সেটিংস' : 'Automation Rules'}
              </h3>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Timing */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {language === 'bn' ? 'কতক্ষণ পর মেসেজ যাবে?' : 'Follow-up Delay (Minutes)'}
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={smsDelay}
                    onChange={(e) => setSmsDelay(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Incentive */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {language === 'bn' ? 'ফিরে এলে স্পেশাল ছাড় (%)' : 'Recovery Discount (%)'}
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={recoveryDiscount}
                    onChange={(e) => setRecoveryDiscount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  {language === 'bn' 
                    ? 'মেসেজের লিংকে ক্লিক করে টিকিট কিনলে এই ছাড়টি স্বয়ংক্রিয়ভাবে অ্যাপ্লাই হবে।' 
                    : 'This discount will be applied automatically if they complete purchase via the SMS link.'}
                </p>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Message Template Preview */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  {language === 'bn' ? 'এসএমএস প্রিভিউ' : 'SMS Template Preview'}
                </label>
                <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                  Hi! You left tickets for Dhaka-Cox's Bazar in your cart. Complete booking now and get {recoveryDiscount}% OFF! Link: bus.ly/abcde
                </div>
              </div>

              <Button 
                onClick={handleSaveSettings}
                disabled={isSaved}
                className={`w-full font-bold shadow-md transition-all rounded-xl ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'}`}
              >
                {isSaved ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                {isSaved 
                  ? (language === 'bn' ? 'সেভ হয়েছে!' : 'Saved!') 
                  : (language === 'bn' ? 'রুলস সেভ করুন' : 'Save Rules')}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Feed */}
        <div className="xl:col-span-2">
          <Card className="p-0 overflow-hidden border-2 border-slate-200 dark:border-slate-800 h-full">
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'লাইভ ড্রপ-অফ ফিড' : 'Live Drop-off Feed'}
                </h3>
              </div>
              <Badge variant="outline" className="bg-white dark:bg-slate-950 font-mono text-[10px]">
                Today
              </Badge>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {dummyCarts.map((cart) => (
                <div key={cart.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase
                        ${cart.status === 'RECOVERED' ? 'bg-emerald-100 text-emerald-700' :
                          cart.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                        {cart.status}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {cart.timeAgo}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                      {cart.phone}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {cart.route} <span className="text-slate-300 dark:text-slate-600 mx-1">•</span> {cart.seatSelected}
                    </p>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                    <div className="font-black text-slate-900 dark:text-white font-mono">
                      ৳ {cart.price}
                    </div>
                    {cart.status === 'PENDING' && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50">
                        Manual SMS
                      </Button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

// Dummy icon for CheckCircle2
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
