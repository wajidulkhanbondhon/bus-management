'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Receipt,
  Plus,
  Clock,
  Fuel,
  Utensils,
  Wrench,
  AlertTriangle,
  MapPin,
  X,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export interface TripExpenseItem {
  id: string;
  category: 'FUEL' | 'FOOD' | 'REPAIR' | 'TOLL' | 'EMERGENCY' | 'OTHER';
  amount: number;
  desc: string;
  time: string;
}

const EXPENSE_CATEGORIES = [
  { id: 'FUEL', label: 'তেল খরচ', icon: Fuel, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
  { id: 'FOOD', label: 'খাবার', icon: Utensils, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
  { id: 'REPAIR', label: 'মেরামত', icon: Wrench, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' },
  { id: 'TOLL', label: 'টোল/পার্কিং', icon: MapPin, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
  { id: 'EMERGENCY', label: 'জরুরি', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60' },
  { id: 'OTHER', label: 'অন্যান্য', icon: Receipt, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
];

interface TripExpenseManagerProps {
  issuedCash: number;
  collectedDues: number;
  expenses: TripExpenseItem[];
  onAddExpense: (expense: Omit<TripExpenseItem, 'id' | 'time'>) => void;
  onDeleteExpense: (id: string) => void;
}

export function TripExpenseManager({
  issuedCash,
  collectedDues,
  expenses,
  onAddExpense,
  onDeleteExpense,
}: TripExpenseManagerProps) {
  const { success, error } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<TripExpenseItem['category']>('FUEL');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBalance = issuedCash + collectedDues - totalExpense;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount);
    if (!amountNum || amountNum <= 0) {
      error('ভুল পরিমাণ', 'সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    onAddExpense({
      category: newCategory,
      amount: amountNum,
      desc: newDesc.trim(),
    });

    setNewAmount('');
    setNewDesc('');
    setShowAddModal(false);
    success('খরচ সংরক্ষিত', 'নতুন খরচ সফলভাবে যুক্ত হয়েছে।');
  };

  return (
    <div className="space-y-4">
      {/* 1. Cash Balance Breakdown Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
              হাতে থাকা মোট ক্যাশ ব্যালেন্স
            </span>
            <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(remainingBalance)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>খরচ যুক্ত করুন</span>
          </button>
        </div>

        {/* 3 Columns details */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">অফিস বাজেট</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
              {formatCurrency(issuedCash)}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">সংগৃহীত বকেয়া</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(collectedDues)}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">মোট খরচ</span>
            <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
              -{formatCurrency(totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Expense List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ট্রিপে খরচের ভাউচার ({expenses.length})
          </h4>
        </div>

        {expenses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 space-y-2">
            <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs text-slate-400">এখনও কোনো খরচ এন্ট্রি করা হয়নি।</p>
          </div>
        ) : (
          expenses.map((expense) => {
            const cat =
              EXPENSE_CATEGORIES.find((c) => c.id === expense.category) ||
              EXPENSE_CATEGORIES[5];
            const Icon = cat.icon;

            return (
              <div
                key={expense.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${cat.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {cat.label}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatTime(expense.time)}</span>
                      {expense.desc && <span>• {expense.desc}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
                    -{formatCurrency(expense.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteExpense(expense.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 pb-0 sm:pb-4">
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  নতুন খরচ যুক্ত করুন
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                {/* Categories */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">
                    খরচের ক্যাটাগরি
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewCategory(cat.id as any)}
                        className={`p-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          newCategory === cat.id
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <cat.icon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">
                    টাকার পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono font-black text-xl text-center text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">
                    বিবরণ / নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="যেমন: পদ্মা সেতু টোল, বা ফুয়েল ভাউচার নং..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
