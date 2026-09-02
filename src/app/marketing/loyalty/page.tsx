'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Settings,
  Users,
  Award,
  TrendingUp,
  Power,
  Save,
  Gift
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface LoyalCustomer {
  id: string;
  name: string;
  phone: string;
  totalTrips: number;
  pointsBalance: number;
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
}

const dummyCustomers: LoyalCustomer[] = [
  { id: '1', name: 'Md. Rakibul Islam', phone: '01711***456', totalTrips: 24, pointsBalance: 1250, tier: 'PLATINUM' },
  { id: '2', name: 'Nusrat Jahan', phone: '01822***789', totalTrips: 18, pointsBalance: 840, tier: 'GOLD' },
  { id: '3', name: 'Kamrul Hasan', phone: '01933***123', totalTrips: 15, pointsBalance: 620, tier: 'GOLD' },
  { id: '4', name: 'Sadia Afrin', phone: '01644***321', totalTrips: 8, pointsBalance: 310, tier: 'SILVER' },
  { id: '5', name: 'Tariqul Islam', phone: '01555***654', totalTrips: 5, pointsBalance: 150, tier: 'SILVER' },
];

export default function LoyaltyPage() {
  const { language } = useApp();
  const [globalStatus, setGlobalStatus] = useState<boolean>(true);
  
  // Settings State
  const [pointsPerSpend, setPointsPerSpend] = useState<number>(100);
  const [pointsEarned, setPointsEarned] = useState<number>(1);
  const [redemptionValue, setRedemptionValue] = useState<number>(10); // 10 points = 1 Taka
  
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const totalPointsIssued = dummyCustomers.reduce((sum, c) => sum + c.pointsBalance, 0) + 45000; // Adding dummy base for realism

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-800">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Customer Retention
            </Badge>
            <span className="text-xs font-mono font-bold text-slate-500">
              LOYALTY PROGRAM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'লয়্যালটি ও পয়েন্ট সিস্টেম' : 'Loyalty & Rewards Program'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {language === 'bn'
              ? 'নিয়মিত যাত্রীদের পুরস্কৃত করুন। প্রতিটি টিকিটের জন্য পয়েন্ট দিন, যা পরবর্তীতে তারা ডিসকাউন্ট হিসেবে ব্যবহার করতে পারবে।'
              : 'Reward your regular passengers. Issue points for every ticket purchase that can be redeemed for future discounts.'}
          </p>
        </div>
      </div>

      {/* Global Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${globalStatus ? 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${globalStatus ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            <Power className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${globalStatus ? 'text-purple-900 dark:text-purple-100' : 'text-slate-700 dark:text-slate-300'}`}>
              {language === 'bn' ? 'লয়্যালটি প্রোগ্রাম স্ট্যাটাস' : 'Program Status'}
            </h3>
            <p className={`text-xs mt-0.5 ${globalStatus ? 'text-purple-700 dark:text-purple-400/80' : 'text-slate-500'}`}>
              {language === 'bn' 
                ? (globalStatus ? 'বর্তমানে যাত্রীরা টিকিট কাটলে পয়েন্ট পাচ্ছেন।' : 'প্রোগ্রামটি বন্ধ আছে। কেউ পয়েন্ট পাচ্ছেন না।')
                : (globalStatus ? 'Passengers are currently earning points on purchases.' : 'Program is disabled. No points are being issued.')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setGlobalStatus(!globalStatus)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${globalStatus ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${globalStatus ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-0 overflow-hidden border-2 border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'পয়েন্ট সেটিংস' : 'Point Rules'}
              </h3>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Generation Rule */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {language === 'bn' ? 'পয়েন্ট অর্জনের নিয়ম' : 'Earning Rule'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">৳</span>
                    <input 
                      type="number" 
                      value={pointsPerSpend}
                      onChange={(e) => setPointsPerSpend(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-500">=</span>
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={pointsEarned}
                      onChange={(e) => setPointsEarned(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-purple-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">pts</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  {language === 'bn' ? 'প্রতি খরচকৃত টাকার জন্য প্রাপ্ত পয়েন্ট' : 'Points earned per amount spent'}
                </p>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Redemption Rule */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {language === 'bn' ? 'পয়েন্ট ব্যবহারের নিয়ম' : 'Redemption Rule'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={redemptionValue}
                      onChange={(e) => setRedemptionValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">pts</span>
                  </div>
                  <span className="text-sm font-bold text-slate-500">=</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">৳</span>
                    <input 
                      type="number" 
                      value={1}
                      disabled
                      className="w-full pl-7 pr-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold opacity-70 cursor-not-allowed"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  {language === 'bn' ? 'কত পয়েন্টে ১ টাকা ছাড় পাওয়া যাবে' : 'Points required for 1 Taka discount'}
                </p>
              </div>

              <Button 
                onClick={handleSaveSettings}
                disabled={isSaved}
                className={`w-full font-bold shadow-md transition-all ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'}`}
              >
                {isSaved ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                {isSaved 
                  ? (language === 'bn' ? 'সেভ হয়েছে!' : 'Saved!') 
                  : (language === 'bn' ? 'সেটিংস সেভ করুন' : 'Save Rules')}
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30">
              <span className="text-[10px] font-bold text-purple-600 uppercase flex items-center gap-1">
                <Gift className="w-3 h-3" /> 
                {language === 'bn' ? 'মোট পয়েন্ট দেওয়া হয়েছে' : 'Total Issued'}
              </span>
              <div className="text-lg font-black text-purple-900 dark:text-purple-100 mt-1 font-mono">
                {totalPointsIssued.toLocaleString()}
              </div>
            </Card>
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30">
              <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 
                {language === 'bn' ? 'মোট ছাড় দেওয়া হয়েছে' : 'Discount Given'}
              </span>
              <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 mt-1 font-mono">
                ৳ {(12450 / redemptionValue).toFixed(0).toLocaleString()}
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden border-2 border-slate-200 dark:border-slate-800 h-full">
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'টপ কাস্টমার (লয়্যালটি লিডারবোর্ড)' : 'Top Loyal Customers'}
                </h3>
              </div>
              <Badge variant="outline" className="bg-white dark:bg-slate-950 font-mono text-[10px]">
                Top 5
              </Badge>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {dummyCustomers.map((customer, index) => (
                <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                      ${index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm shadow-amber-500/20' : 
                        index === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                        index === 2 ? 'bg-amber-900/10 text-amber-900 dark:text-amber-700 border border-amber-900/20' :
                        'bg-slate-50 text-slate-400 dark:bg-slate-900'}`}>
                      #{index + 1}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        {customer.name}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase
                          ${customer.tier === 'PLATINUM' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' :
                            customer.tier === 'GOLD' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                          {customer.tier}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{customer.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-purple-600 dark:text-purple-400 font-mono">
                      {customer.pointsBalance.toLocaleString()} pts
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {customer.totalTrips} {language === 'bn' ? 'টি ট্রিপ' : 'trips'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-center">
              <Button variant="outline" className="w-full text-xs font-bold rounded-xl bg-white dark:bg-slate-950">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                {language === 'bn' ? 'সকল কাস্টমার তালিকা দেখুন' : 'View All Customers'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Dummy icon for CheckCircle2 since it wasn't imported at top
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
