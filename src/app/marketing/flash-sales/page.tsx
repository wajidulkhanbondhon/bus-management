'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  CircleDollarSign,
  Clock,
  Plus,
  Power,
  Trash2,
  CalendarDays,
  Percent,
  Timer,
  MapPin,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface FlashSale {
  id: string;
  title: string;
  route: string;
  discountPercentage: number;
  endTime: string;
  isActive: boolean;
  totalSold: number;
  revenueGenerated: number;
}

const dummyFlashSales: FlashSale[] = [
  { id: '1', title: 'Midnight Madness', route: 'Dhaka - Cox\'s Bazar', discountPercentage: 20, endTime: '2026-09-02T23:59:00', isActive: true, totalSold: 145, revenueGenerated: 125000 },
  { id: '2', title: 'Weekend Getaway', route: 'Sylhet - Dhaka', discountPercentage: 15, endTime: '2026-09-05T12:00:00', isActive: true, totalSold: 89, revenueGenerated: 64000 },
  { id: '3', title: 'Eid Special', route: 'All Routes', discountPercentage: 10, endTime: '2026-08-30T00:00:00', isActive: false, totalSold: 1240, revenueGenerated: 980000 }
];

export default function FlashSalesPage() {
  const { language } = useApp();
  const [sales, setSales] = useState<FlashSale[]>(dummyFlashSales);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newRoute, setNewRoute] = useState('All Routes');
  const [newDiscount, setNewDiscount] = useState<number>(10);
  const [newEndTime, setNewEndTime] = useState('');

  const toggleSale = (id: string) => {
    setSales(sales.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const deleteSale = (id: string) => {
    if(confirm(language === 'bn' ? 'আপনি কি এই ফ্ল্যাশ সেলটি ডিলিট করতে চান?' : 'Are you sure you want to delete this flash sale?')) {
      setSales(sales.filter(s => s.id !== id));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newEndTime) return;
    
    const newSale: FlashSale = {
      id: Date.now().toString(),
      title: newTitle,
      route: newRoute,
      discountPercentage: newDiscount,
      endTime: newEndTime,
      isActive: true,
      totalSold: 0,
      revenueGenerated: 0
    };
    
    setSales([newSale, ...sales]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDiscount(10);
    setNewEndTime('');
  };

  const calculateTimeLeft = (endTime: string) => {
    const total = Date.parse(endTime) - Date.now();
    if (total <= 0) return language === 'bn' ? 'সময় শেষ' : 'Expired';
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return `${days > 0 ? `${days}d ` : ''}${hours}h left`;
  };

  const activeSales = sales.filter(s => s.isActive);
  const totalRevenue = sales.reduce((sum, s) => sum + s.revenueGenerated, 0);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
              <CircleDollarSign className="w-3.5 h-3.5 mr-1" />
              Dynamic Pricing
            </Badge>
            <span className="text-xs font-mono font-bold text-slate-500">
              FLASH SALES MANAGER
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'ফ্ল্যাশ সেল ও প্রাইসিং' : 'Flash Sales & Pricing'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'নির্দিষ্ট সময়ের জন্য বিশেষ ডিসকাউন্ট দিয়ে টিকিটের বিক্রি বহুগুণ বাড়িয়ে নিন।'
              : 'Boost ticket sales instantly by offering time-limited dynamic discounts on specific routes.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-2xl font-black shadow-lg shadow-amber-500/25 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-none"
          >
            <Plus className="w-5 h-5 mr-1.5" />
            {language === 'bn' ? 'নতুন ফ্ল্যাশ সেল চালু করুন' : 'Launch Flash Sale'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-bold">{language === 'bn' ? 'অতিরিক্ত আয় (ফ্ল্যাশ সেল থেকে)' : 'Revenue Generated'}</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-mono">৳ {totalRevenue.toLocaleString()}</h2>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <span className="font-bold">{language === 'bn' ? 'মোট টিকিট বিক্রি' : 'Tickets Sold'}</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-mono">{sales.reduce((sum, s) => sum + s.totalSold, 0).toLocaleString()}</h2>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-bold">{language === 'bn' ? 'চলমান ক্যাম্পেইন' : 'Active Campaigns'}</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-mono">{activeSales.length}</h2>
        </Card>
      </div>

      {/* Active Campaigns */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-8 mb-4">
        {language === 'bn' ? 'ক্যাম্পেইন লিস্ট' : 'Campaign List'}
      </h3>
      
      <div className="space-y-4">
        {sales.map((sale) => (
          <Card key={sale.id} className={`p-0 overflow-hidden border-2 transition-all ${sale.isActive ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 opacity-70'}`}>
            <div className="flex flex-col md:flex-row">
              {/* Left Side: Info */}
              <div className="p-6 flex-1 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide
                      ${sale.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                      {sale.isActive ? 'LIVE NOW' : 'ENDED'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{sale.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSale(sale.id)}
                      className={`p-2 rounded-lg border transition-colors ${sale.isActive ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSale(sale.id)}
                      className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {sale.route}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Timer className="w-4 h-4 text-slate-400" />
                    Ends: {new Date(sale.endTime).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Right Side: Highlight */}
              <div className={`p-6 w-full md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l ${sale.isActive ? 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Discount</span>
                  <div className="text-4xl font-black text-amber-600 dark:text-amber-500 flex justify-center items-start">
                    {sale.discountPercentage}
                    <Percent className="w-5 h-5 ml-0.5 mt-1 opacity-70" />
                  </div>
                  {sale.isActive && (
                    <div className="mt-3 text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      {calculateTimeLeft(sale.endTime)}
                    </div>
                  )}
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
        title={language === 'bn' ? 'নতুন ফ্ল্যাশ সেল চালু করুন' : 'Launch Flash Sale'}
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
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Eid Mega Sale"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'ছাড় (%)' : 'Discount (%)'}
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={newDiscount}
                onChange={(e) => setNewDiscount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'কোন রুটে?' : 'Target Route'}
              </label>
              <select
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="All Routes">All Routes (সব রুট)</option>
                <option value="Dhaka - Cox's Bazar">Dhaka - Cox's Bazar</option>
                <option value="Dhaka - Sylhet">Dhaka - Sylhet</option>
                <option value="Dhaka - Chittagong">Dhaka - Chittagong</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'শেষ হওয়ার সময়' : 'End Time'}
            </label>
            <input
              type="datetime-local"
              required
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl font-bold">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl font-black px-6 shadow-md bg-amber-500 hover:bg-amber-600 border-none text-white">
              {language === 'bn' ? 'চালু করুন' : 'Launch Sale'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
