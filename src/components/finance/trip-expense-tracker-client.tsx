'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Fuel,
  Receipt,
  Truck,
  Plus,
  DollarSign,
  PieChart,
  CheckCircle2,
  Trash2,
  Calendar,
  Bus,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface TripExpenseItem {
  id: string;
  category: 'FUEL' | 'TOLL' | 'CREW' | 'MAINTENANCE' | 'OTHER';
  description: string;
  amount: number;
  voucherNo: string;
}

interface TripReport {
  id: string;
  busNumber: string;
  route: string;
  date: string;
  ticketRevenue: number;
  expenses: TripExpenseItem[];
}

const INITIAL_TRIP: TripReport = {
  id: 'TRIP-2026-0906-SUST',
  busNumber: 'ঢাকা মেট্রো-ব-১৫-৪২২১ (হানিফ স্পেশাল)',
  route: 'ঢাকা (গাবতলী) ➔ সিলেট (শাবিপ্রবি ভর্তি কেন্দ্র)',
  date: '০৬ সেপ্টেম্বর ২০২৬',
  ticketRevenue: 42000,
  expenses: [
    { id: 'E1', category: 'FUEL', description: 'ডিজেল ১১০ লিটার (@১০৮.৫০ টাকা)', amount: 11935, voucherNo: 'PUMP-9812' },
    { id: 'E2', category: 'TOLL', description: 'মেঘনা ও ভৈরব ব্রিজ টোল', amount: 1200, voucherNo: 'TOLL-332' },
    { id: 'E3', category: 'CREW', description: 'চালক ও সুপারভাইজার খোরাকি ও ট্রিপ ভাতা', amount: 2500, voucherNo: 'VCH-01' },
    { id: 'E4', category: 'MAINTENANCE', description: 'হেডলাইট বাল্ব পরিবর্তন', amount: 450, voucherNo: 'PARTS-11' }
  ]
};

export function TripExpenseTrackerClient() {
  const { language } = useApp();
  const [trip, setTrip] = useState<TripReport>(INITIAL_TRIP);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New expense modal state
  const [cat, setCat] = useState<'FUEL' | 'TOLL' | 'CREW' | 'MAINTENANCE' | 'OTHER'>('FUEL');
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState<number>(0);
  const [vouch, setVouch] = useState('');

  const totalExpense = trip.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = trip.ticketRevenue - totalExpense;
  const marginPercent = Math.round((netProfit / trip.ticketRevenue) * 100);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || amt <= 0) return;

    const newItem: TripExpenseItem = {
      id: `E-${Date.now()}`,
      category: cat,
      description: desc,
      amount: amt,
      voucherNo: vouch || 'N/A'
    };

    setTrip({ ...trip, expenses: [...trip.expenses, newItem] });
    setIsModalOpen(false);
    setDesc('');
    setAmt(0);
    setVouch('');
  };

  const handleRemoveExpense = (id: string) => {
    setTrip({ ...trip, expenses: trip.expenses.filter((e) => e.id !== id) });
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'ট্রিপ খরচ ও প্রফিট/লস (Trip P&L Tracker)' : 'Trip Expense & Net Margin Tracker'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'বাসের তেল, সেতু টোল ও স্টাফ খোরাকি এন্ট্রি করে প্রতিটি ট্রিপের নিট লাভ ও মার্জিন বিশ্লেষণ'
                : 'Log operational fuel, toll, and crew costs to calculate real-time net profitability'}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          + নতুন খরচ এন্ট্রি করুন
        </Button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-1">
          <span className="text-xs text-slate-500 font-bold block">মোট টিকিট আয় (Revenue)</span>
          <span className="font-mono font-black text-2xl text-blue-600 dark:text-blue-400">
            {formatCurrency(trip.ticketRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 block">পূর্ণ ট্রিপ টিকিট বিক্রি</span>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-1">
          <span className="text-xs text-slate-500 font-bold block">মোট পরিচালন খরচ (Expense)</span>
          <span className="font-mono font-black text-2xl text-rose-600 dark:text-rose-400">
            {formatCurrency(totalExpense)}
          </span>
          <span className="text-[11px] text-slate-400 block">{trip.expenses.length} টি ভাউচার তালিকাভুক্ত</span>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-1 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">নিট লাভ (Net Profit)</span>
            <Badge variant="success" className="text-[10px] font-bold font-mono">
              {marginPercent}% মার্জিন
            </Badge>
          </div>
          <span className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">
            {formatCurrency(netProfit)}
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block">ট্রিপ শেষে নিট ক্যাশ প্রফিট</span>
        </Card>
      </div>

      {/* Trip Information & Expense Table */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">{trip.busNumber}</span>
            <span className="text-xs text-slate-500">• {trip.route}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">{trip.date}</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="px-5 py-3.5">ক্যাটাগরি</th>
                  <th className="px-4 py-3.5">খরচের বিবরণ</th>
                  <th className="px-4 py-3.5">ভাউচার / স্লিপ নং</th>
                  <th className="px-4 py-3.5 text-right">পরিমাণ (টাকা)</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {trip.expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={e.category === 'FUEL' ? 'danger' : e.category === 'TOLL' ? 'primary' : 'warning'}
                        className="text-[10px] font-bold font-mono"
                      >
                        {e.category === 'FUEL' ? 'জ্বালানি তেল' : e.category === 'TOLL' ? 'সেতু টোল' : e.category === 'CREW' ? 'খোরাকি' : 'মেরামত'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {e.description}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {e.voucherNo}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRemoveExpense(e.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="নতুন ট্রিপ খরচ এন্ট্রি"
          description="জ্বালানি তেল, এক্সপ্রেসওয়ে টোল বা ড্রাইভার-হেলপারের খোরাকি যুক্ত করুন।"
        >
          <form onSubmit={handleAddExpense} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold mb-1">খরচের ধরন (Category)</label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-semibold"
              >
                <option value="FUEL">জ্বালানি তেল (Fuel / Diesel)</option>
                <option value="TOLL">সেতু ও এক্সপ্রেসওয়ে টোল (Toll Plaza)</option>
                <option value="CREW">চালক ও সহকারীর খোরাকি / খাবার ভাতা (Crew Allowance)</option>
                <option value="MAINTENANCE">জরুরি পার্টস বা মেকানিক মেরামত (Maintenance)</option>
                <option value="OTHER">অন্যান্য বিবিধ খরচ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">খরচের বিবরণ *</label>
              <input
                type="text"
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="যেমন: পদ্মা সেতু টোল অথবা যমুনা ওয়ে ব্রিজে ১২০ লিটার ডিজেল..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">পরিমাণ (টাকা) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amt || ''}
                  onChange={(e) => setAmt(Number(e.target.value))}
                  placeholder="৫০০"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">ভাউচার বা স্লিপ নং</label>
                <input
                  type="text"
                  value={vouch}
                  onChange={(e) => setVouch(e.target.value)}
                  placeholder="PUMP-101..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary">
                খরচ সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
