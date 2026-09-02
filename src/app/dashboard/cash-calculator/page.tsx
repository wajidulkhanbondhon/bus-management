'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Banknote,
  Coins,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Printer,
  FileSpreadsheet,
  Clock,
  LockKeyhole
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency } from '@/lib/utils';

interface Denomination {
  value: number;
  label: string;
  type: 'note' | 'coin';
  color: string;
  bgColor: string;
  borderColor: string;
}

const DENOMINATIONS: Denomination[] = [
  { value: 1000, label: '১,০০০', type: 'note', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-200 dark:border-purple-500/30' },
  { value: 500, label: '৫০০', type: 'note', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-500/10', borderColor: 'border-blue-200 dark:border-blue-500/30' },
  { value: 200, label: '২০০', type: 'note', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-500/10', borderColor: 'border-teal-200 dark:border-teal-500/30' },
  { value: 100, label: '১০০', type: 'note', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-200 dark:border-emerald-500/30' },
  { value: 50, label: '৫০', type: 'note', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-200 dark:border-amber-500/30' },
  { value: 20, label: '২০', type: 'note', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-500/10', borderColor: 'border-orange-200 dark:border-orange-500/30' },
  { value: 10, label: '১০', type: 'note', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-500/10', borderColor: 'border-rose-200 dark:border-rose-500/30' },
  { value: 5, label: '৫', type: 'coin', color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-500/10', borderColor: 'border-sky-200 dark:border-sky-500/30' },
  { value: 2, label: '২', type: 'coin', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10', borderColor: 'border-indigo-200 dark:border-indigo-500/30' },
  { value: 1, label: '১', type: 'coin', color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-200 dark:border-slate-700' },
];

export default function CashCalculatorPage() {
  const { language } = useApp();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [expectedAmount, setExpectedAmount] = useState<string>('');

  // Calculate totals
  const denomTotals = useMemo(() => {
    return DENOMINATIONS.map(d => ({
      ...d,
      count: counts[d.value] || 0,
      subtotal: (counts[d.value] || 0) * d.value,
    }));
  }, [counts]);

  const grandTotal = useMemo(() => {
    return denomTotals.reduce((sum, d) => sum + d.subtotal, 0);
  }, [denomTotals]);

  const totalNotes = useMemo(() => {
    return denomTotals.filter(d => d.type === 'note').reduce((sum, d) => sum + d.count, 0);
  }, [denomTotals]);

  const totalCoins = useMemo(() => {
    return denomTotals.filter(d => d.type === 'coin').reduce((sum, d) => sum + d.count, 0);
  }, [denomTotals]);

  const expected = parseFloat(expectedAmount) || 0;
  const variance = grandTotal - expected;
  const reconcileStatus = expected === 0 ? 'none' : variance === 0 ? 'matched' : variance > 0 ? 'excess' : 'short';

  const updateCount = (value: number, count: string) => {
    const num = parseInt(count) || 0;
    setCounts(prev => ({ ...prev, [value]: Math.max(0, num) }));
  };

  const incrementCount = (value: number) => {
    setCounts(prev => ({ ...prev, [value]: (prev[value] || 0) + 1 }));
  };

  const decrementCount = (value: number) => {
    setCounts(prev => ({ ...prev, [value]: Math.max(0, (prev[value] || 0) - 1) }));
  };

  const resetAll = () => {
    setCounts({});
    setExpectedAmount('');
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-500" />
            {language === 'bn' ? 'ক্যাশ ক্যালকুলেটর ও ডে ক্লোজিং' : 'Cash Calculator & Day Closing'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'নোট ও কয়েন গুনে হিসাব মেলান — আলাদা ক্যালকুলেটর লাগবে না।'
              : 'Count notes & coins to reconcile — no separate calculator needed.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            রিসেট
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            প্রিন্ট
          </button>
        </div>
      </div>

      {/* Grand Total Card */}
      <motion.div
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-2xl shadow-emerald-600/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="sm:col-span-2">
            <div className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">মোট গোনা টাকা</div>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight">
              {formatCurrency(grandTotal)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-emerald-200">
              <span className="flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" />
                {totalNotes} টি নোট
              </span>
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {totalCoins} টি কয়েন
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">প্রত্যাশিত কালেকশন</div>
            <input
              type="number"
              value={expectedAmount}
              onChange={e => setExpectedAmount(e.target.value)}
              placeholder="যেমন: ৫০,০০০"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-lg font-mono font-bold placeholder:text-emerald-300/50 focus:ring-2 focus:ring-white/40 focus:border-transparent"
            />
          </div>
          <div>
            {expected > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-xl p-3 text-center ${
                  reconcileStatus === 'matched'
                    ? 'bg-white/20'
                    : reconcileStatus === 'excess'
                    ? 'bg-amber-500/20'
                    : 'bg-red-500/20'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {reconcileStatus === 'matched' ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : reconcileStatus === 'excess' ? (
                    <TrendingUp className="w-5 h-5 text-amber-300" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-300" />
                  )}
                  <span className="text-xs font-bold uppercase">
                    {reconcileStatus === 'matched' ? 'মিলে গেছে ✓' :
                     reconcileStatus === 'excess' ? 'উদ্বৃত্ত' : 'ঘাটতি!'}
                  </span>
                </div>
                <div className="text-xl font-black font-mono">
                  {variance > 0 ? '+' : ''}{formatCurrency(Math.abs(variance))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Denomination Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {denomTotals.map((denom) => (
          <motion.div
            key={denom.value}
            className={`${denom.bgColor} border ${denom.borderColor} rounded-xl p-4 space-y-3 transition-all hover:shadow-md`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: DENOMINATIONS.indexOf(denom) * 0.03 }}
          >
            {/* Denomination Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {denom.type === 'note' ? (
                  <Banknote className={`w-4 h-4 ${denom.color}`} />
                ) : (
                  <Coins className={`w-4 h-4 ${denom.color}`} />
                )}
                <span className={`text-lg font-black font-mono ${denom.color}`}>
                  ৳{denom.label}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase text-slate-400">
                {denom.type === 'note' ? 'নোট' : 'কয়েন'}
              </span>
            </div>

            {/* Counter */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => decrementCount(denom.value)}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-95"
              >
                −
              </button>
              <input
                type="number"
                value={denom.count || ''}
                onChange={e => updateCount(denom.value, e.target.value)}
                placeholder="0"
                min="0"
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center text-sm font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => incrementCount(denom.value)}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-95"
              >
                +
              </button>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-500 font-semibold">
                {denom.count} × ৳{denom.value}
              </span>
              <span className={`text-sm font-black font-mono ${denom.count > 0 ? denom.color : 'text-slate-300 dark:text-slate-600'}`}>
                {formatCurrency(denom.subtotal)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            সারসংক্ষেপ
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="text-left px-5 py-3">নোটের মান</th>
                <th className="text-center px-5 py-3">সংখ্যা</th>
                <th className="text-right px-5 py-3">মোট টাকা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {denomTotals.filter(d => d.count > 0).map(denom => (
                <tr key={denom.value} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      {denom.type === 'note' ? (
                        <Banknote className={`w-3.5 h-3.5 ${denom.color}`} />
                      ) : (
                        <Coins className={`w-3.5 h-3.5 ${denom.color}`} />
                      )}
                      <span className={`font-bold font-mono ${denom.color}`}>৳{denom.label}</span>
                      <span className="text-[10px] text-slate-400">({denom.type === 'note' ? 'নোট' : 'কয়েন'})</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-center font-bold font-mono text-slate-900 dark:text-white">{denom.count} টি</td>
                  <td className="px-5 py-2.5 text-right font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(denom.subtotal)}</td>
                </tr>
              ))}
              {denomTotals.filter(d => d.count > 0).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                    কোনো নোট/কয়েন গোনা হয়নি — উপরে সংখ্যা দিন
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                <td className="px-5 py-3 text-slate-900 dark:text-white">মোট</td>
                <td className="px-5 py-3 text-center text-slate-900 dark:text-white font-mono">{totalNotes + totalCoins} টি</td>
                <td className="px-5 py-3 text-right text-lg text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(grandTotal)}</td>
              </tr>
              {expected > 0 && (
                <>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-5 py-2 text-slate-500" colSpan={2}>প্রত্যাশিত কালেকশন</td>
                    <td className="px-5 py-2 text-right font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(expected)}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3" colSpan={2}>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                        reconcileStatus === 'matched'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : reconcileStatus === 'excess'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                      }`}>
                        {reconcileStatus === 'matched' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {reconcileStatus === 'matched' ? 'হিসাব মিলে গেছে ✓' :
                         reconcileStatus === 'excess' ? 'উদ্বৃত্ত টাকা (Excess)' : 'ঘাটতি (Short)'}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right text-lg font-black font-mono ${
                      reconcileStatus === 'matched'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : reconcileStatus === 'excess'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {variance > 0 ? '+' : ''}{formatCurrency(Math.abs(variance))}
                    </td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
