'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users2, 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Banknote, 
  Coffee, 
  Car, 
  Gift, 
  Receipt,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency } from '@/lib/utils';

interface StaffExpense {
  id: string;
  staffName: string;
  role: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'PAID' | 'PENDING';
}

const CATEGORIES = [
  { id: 'SALARY', label: 'মাসিক বেতন', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'SNACKS', label: 'খাবার/নাস্তা', icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'TRANSPORT', label: 'যাতায়াত', icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'BONUS', label: 'বোনাস/বকশিস', icon: Gift, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'OTHER', label: 'অন্যান্য', icon: Receipt, color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

const DEMO_DATA: StaffExpense[] = [
  { id: '1', staffName: 'কামরুল হাসান', role: 'ম্যানেজার', category: 'SALARY', amount: 25000, date: '2026-08-01', description: 'আগস্ট মাসের বেতন', status: 'PAID' },
  { id: '2', staffName: 'তানভীর আহমেদ', role: 'অফিস স্টাফ', category: 'SNACKS', amount: 500, date: '2026-08-28', description: 'বিকালের নাস্তা', status: 'PAID' },
  { id: '3', staffName: 'রফিকুল ইসলাম', role: 'ক্লিনার', category: 'TRANSPORT', amount: 150, date: '2026-08-27', description: 'যাতায়াত ভাড়া', status: 'PENDING' },
];

export default function StaffExpensesPage() {
  const { language } = useApp();
  const [expenses, setExpenses] = useState<StaffExpense[]>(DEMO_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filteredExpenses = expenses.filter(e => {
    if (filterCategory !== 'ALL' && e.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.staffName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    }
    return true;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" />
            {language === 'bn' ? 'স্টাফ বেতন ও খরচ' : 'Staff Payroll & Expenses'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            অফিসের স্টাফদের বেতন, নাস্তা, যাতায়াত এবং অন্যান্য খরচের হিসাব।
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all">
          <Plus className="w-3.5 h-3.5" />
          নতুন খরচ যোগ করুন
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="col-span-2 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-600/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 mb-1 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> মোট খরচ
          </div>
          <div className="text-3xl font-black font-mono tracking-tight">{formatCurrency(totalExpense)}</div>
        </div>
        
        {CATEGORIES.slice(0, 4).map(cat => {
          const Icon = cat.icon;
          const total = expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0);
          return (
            <div key={cat.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
              <Icon className={`w-5 h-5 mb-2 ${cat.color}`} />
              <div className="text-xs font-bold text-slate-500 mb-1">{cat.label}</div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white">{formatCurrency(total)}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="স্টাফের নাম বা বিবরণ খুঁজুন..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="ALL">সকল ক্যাটাগরি</option>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="text-left px-5 py-3">তারিখ</th>
                <th className="text-left px-5 py-3">স্টাফের নাম</th>
                <th className="text-left px-5 py-3">ক্যাটাগরি</th>
                <th className="text-left px-5 py-3">বিবরণ</th>
                <th className="text-right px-5 py-3">পরিমাণ</th>
                <th className="text-center px-5 py-3">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map(expense => {
                const cat = CATEGORIES.find(c => c.id === expense.category);
                const Icon = cat?.icon || Receipt;
                return (
                  <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">{expense.date}</td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{expense.staffName}</div>
                      <div className="text-[10px] text-slate-400">{expense.role}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md ${cat?.bg} ${cat?.color}`}>
                        <Icon className="w-3 h-3" />
                        {cat?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs truncate max-w-[200px]">{expense.description}</td>
                    <td className="px-5 py-3 text-right font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(expense.amount)}</td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      {expense.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> পরিশোধিত
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
                          পেন্ডিং
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-bold">কোনো খরচ পাওয়া যায়নি</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
