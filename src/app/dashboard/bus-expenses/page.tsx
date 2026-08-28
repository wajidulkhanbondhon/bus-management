'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Plus,
  Fuel,
  Wrench,
  AlertTriangle,
  Utensils,
  Receipt,
  Calendar,
  Bus,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency } from '@/lib/utils';

interface Expense {
  id: string;
  tripCode: string;
  busName: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  reportedBy: string;
}

const EXPENSE_CATEGORIES = [
  { id: 'FUEL', label: 'জ্বালানি / তেল', icon: Fuel, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'DRIVER_TIP', label: 'ড্রাইভার বকশিস', icon: Receipt, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'FOOD', label: 'খাবার / নাস্তা', icon: Utensils, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'REPAIR', label: 'মেরামত / পার্টস', icon: Wrench, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'ACCIDENT', label: 'দুর্ঘটনা / জরুরি', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'TOLL', label: 'টোল / পার্কিং', icon: Receipt, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { id: 'OTHER', label: 'অন্যান্য খরচ', icon: Receipt, color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

// Demo data
const DEMO_EXPENSES: Expense[] = [
  { id: '1', tripCode: 'TRIP-20260828-001', busName: 'Dhaka Express 01', category: 'FUEL', amount: 5000, description: 'ঢাকা-রাজশাহী ফুয়েল', date: '2026-08-28', reportedBy: 'আলী হোসেন' },
  { id: '2', tripCode: 'TRIP-20260828-001', busName: 'Dhaka Express 01', category: 'DRIVER_TIP', amount: 500, description: 'ড্রাইভার ও হেলপার বকশিস', date: '2026-08-28', reportedBy: 'আলী হোসেন' },
  { id: '3', tripCode: 'TRIP-20260828-002', busName: 'RU Shuttle 02', category: 'FOOD', amount: 800, description: 'ড্রাইভার ও সুপারভাইজার খাবার', date: '2026-08-28', reportedBy: 'করিম সাহেব' },
  { id: '4', tripCode: 'TRIP-20260827-003', busName: 'CU Express 03', category: 'REPAIR', amount: 3500, description: 'টায়ার পাংচার মেরামত', date: '2026-08-27', reportedBy: 'জাহিদ' },
  { id: '5', tripCode: 'TRIP-20260827-001', busName: 'Dhaka Express 01', category: 'TOLL', amount: 200, description: 'পদ্মা সেতু টোল', date: '2026-08-27', reportedBy: 'আলী হোসেন' },
];

export default function BusExpensesPage() {
  const { language } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  
  // New expense form state
  const [newExpense, setNewExpense] = useState({
    tripCode: '',
    busName: '',
    category: 'FUEL',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Stats
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0),
    count: expenses.filter(e => e.category === cat.id).length,
  }));

  const filteredExpenses = filterCategory === 'ALL'
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  const addExpense = () => {
    if (!newExpense.amount || !newExpense.description) return;
    const expense: Expense = {
      id: Date.now().toString(),
      tripCode: newExpense.tripCode || 'TRIP-MANUAL',
      busName: newExpense.busName || 'Manual Entry',
      category: newExpense.category,
      amount: parseFloat(newExpense.amount) || 0,
      description: newExpense.description,
      date: newExpense.date,
      reportedBy: 'Current User',
    };
    setExpenses(prev => [expense, ...prev]);
    setNewExpense({ tripCode: '', busName: '', category: 'FUEL', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
    setShowAddForm(false);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-500" />
            {language === 'bn' ? 'বাস খরচ হিসাব' : 'Bus Expense Tracker'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            কোন বাসে কত খরচ হচ্ছে — ফুয়েল, মেরামত, দুর্ঘটনা, সবকিছুর হিসাব।
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          নতুন খরচ যুক্ত করুন
        </button>
      </div>

      {/* Total & Category Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200">মোট খরচ</div>
          <div className="text-2xl font-black font-mono mt-1">{formatCurrency(totalExpense)}</div>
          <div className="text-[10px] text-purple-200 mt-0.5">{expenses.length} টি এন্ট্রি</div>
        </div>
        {categoryTotals.filter(c => c.total > 0).slice(0, 6).map(cat => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className={`${cat.bg} rounded-xl p-3 border border-slate-200 dark:border-slate-800`}>
              <Icon className={`w-4 h-4 ${cat.color} mb-1`} />
              <div className="text-sm font-black font-mono text-slate-900 dark:text-white">{formatCurrency(cat.total)}</div>
              <div className="text-[9px] text-slate-500 font-semibold truncate">{cat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Add New Expense Form */}
      {showAddForm && (
        <motion.div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-500" />
            নতুন খরচ এন্ট্রি
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">ট্রিপ কোড</label>
              <input
                type="text"
                value={newExpense.tripCode}
                onChange={e => setNewExpense({ ...newExpense, tripCode: e.target.value })}
                placeholder="TRIP-20260828-001"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">বাসের নাম</label>
              <input
                type="text"
                value={newExpense.busName}
                onChange={e => setNewExpense({ ...newExpense, busName: e.target.value })}
                placeholder="Dhaka Express 01"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">ক্যাটাগরি</label>
              <select
                value={newExpense.category}
                onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">টাকার পরিমাণ</label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="০"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">তারিখ</label>
              <input
                type="date"
                value={newExpense.date}
                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">বিবরণ</label>
              <input
                type="text"
                value={newExpense.description}
                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="খরচের বিবরণ লিখুন"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={addExpense}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              সেভ করুন
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              বাতিল
            </button>
          </div>
        </motion.div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium"
        >
          <option value="ALL">সকল ক্যাটাগরি</option>
          {EXPENSE_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        <span className="text-[11px] text-slate-500">{filteredExpenses.length} টি খরচ</span>
      </div>

      {/* Expense Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="text-left px-4 py-3">তারিখ</th>
                <th className="text-left px-4 py-3">ট্রিপ / বাস</th>
                <th className="text-left px-4 py-3">ক্যাটাগরি</th>
                <th className="text-left px-4 py-3">বিবরণ</th>
                <th className="text-right px-4 py-3">টাকা</th>
                <th className="text-center px-4 py-3">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map(expense => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                const Icon = cat?.icon || Receipt;
                return (
                  <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-[10px]">{expense.date}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-slate-900 dark:text-white text-[11px]">{expense.busName}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{expense.tripCode}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cat?.bg} ${cat?.color}`}>
                        <Icon className="w-3 h-3" />
                        {cat?.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">{expense.description}</td>
                    <td className="px-4 py-2.5 text-right font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
