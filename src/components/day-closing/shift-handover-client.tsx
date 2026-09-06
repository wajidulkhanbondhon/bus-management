'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coins,
  Wallet,
  ArrowRightLeft,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Clock,
  DollarSign,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

export function ShiftHandoverClient() {
  const { language } = useApp();
  const [outgoingStaff, setOutgoingStaff] = useState('রফিকুল ইসলাম (কাউন্টারম্যান - সকাল শিফট)');
  const [incomingStaff, setIncomingStaff] = useState('জহিরুল হক (কাউন্টারম্যান - সান্ধ্য শিফট)');
  const [counterName, setCounterName] = useState('গাবতলী প্রধান টার্মিনাল - বুথ ৪');

  // Cash breakdown state
  const [openingFloat, setOpeningFloat] = useState(5000);
  const [cashSales, setCashSales] = useState(48500);
  const [cashExpenses, setCashExpenses] = useState(1500);
  const [actualPhysicalCash, setActualPhysicalCash] = useState(52000);
  const [notes, setNotes] = useState('সকল টিকিট হিসেব ও ক্যাশ বক্স হস্তান্তর সম্পন্ন হয়েছে।');

  const [isHandoverCompleted, setIsHandoverCompleted] = useState(false);
  const [voucherId, setVoucherId] = useState('');

  const expectedCash = openingFloat + cashSales - cashExpenses;
  const variance = actualPhysicalCash - expectedCash;
  const isShort = variance < 0;
  const isOver = variance > 0;
  const isBalanced = variance === 0;

  const handleCompleteHandover = () => {
    const code = `HO-${Date.now().toString().slice(-6)}`;
    setVoucherId(code);
    setIsHandoverCompleted(true);
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'কাউন্টারম্যান শিফট হস্তান্তর ও ক্যাশ রিকনসিলিয়েশন' : 'Cashier Shift Handover & Drawer Audit'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'ডিউটি শেষে ক্যাশ ড্রয়ারের হিসাব মিলিয়ে পরবর্তী কাউন্টারম্যানের কাছে নগদ অর্থ হস্তান্তর ও ভাউচার প্রিন্ট'
                : 'Reconcile drawer balance and transfer cash custody between shift cashiers'}
            </p>
          </div>
        </div>

        <Link href="/day-closing">
          <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs">
            {language === 'bn' ? 'ডে-ক্লোজিং ড্যাশবোর্ড' : 'Day Closing'}
          </Button>
        </Link>
      </div>

      {isHandoverCompleted ? (
        <Card className="rounded-3xl border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">শিফট হস্তান্তর ভাউচার সফলভাবে তৈরি হয়েছে!</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            হস্তান্তর ভাউচার নং: <span className="font-mono font-black text-emerald-600">{voucherId}</span>
          </p>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border max-w-lg mx-auto text-xs space-y-2 text-left shadow-xs">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-slate-500">কাউন্টার:</span>
              <span className="font-bold">{counterName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-slate-500">হস্তান্তরকারী (Outgoing):</span>
              <span className="font-bold">{outgoingStaff}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-slate-500">গ্রহণকারী (Incoming):</span>
              <span className="font-bold">{incomingStaff}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-slate-500">মোট শারীরিক ক্যাশ হস্তান্তর:</span>
              <span className="font-mono font-black text-sm text-emerald-600">{formatCurrency(actualPhysicalCash)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">স্ট্যাটাস:</span>
              <span className="font-bold text-emerald-600">
                {isBalanced ? '✓ ১০০% সঠিক ও হিসাব মিলেছে' : `তফাত: ${formatCurrency(variance)}`}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button variant="primary" onClick={() => window.print()} className="font-bold rounded-xl text-xs">
              <Printer className="w-4 h-4 mr-1.5" />
              হস্তান্তর স্লিপ ও সিগনেচার শিট প্রিন্ট
            </Button>
            <Button variant="outline" onClick={() => setIsHandoverCompleted(false)} className="font-bold rounded-xl text-xs">
              নতুন শিফট হিসাব করুন
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Cash Drawer Accounting */}
          <div className="md:col-span-7 space-y-4">
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  ক্যাশ ড্রয়ার হিসাব ও নোট গণনা
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      শিফট শুরুর ফ্লোট ক্যাশ (Opening Float)
                    </label>
                    <input
                      type="number"
                      value={openingFloat}
                      onChange={(e) => setOpeningFloat(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মোট ক্যাশ টিকিট বিক্রি (Cash Sales)
                    </label>
                    <input
                      type="number"
                      value={cashSales}
                      onChange={(e) => setCashSales(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ক্যাশ খরচ বা ফেরত (Cash Out / Expense)
                    </label>
                    <input
                      type="number"
                      value={cashExpenses}
                      onChange={(e) => setCashExpenses(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold text-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      গণনাকৃত নগদ টাকা (Physical Cash in Drawer)
                    </label>
                    <input
                      type="number"
                      value={actualPhysicalCash}
                      onChange={(e) => setActualPhysicalCash(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold text-blue-600"
                    />
                  </div>
                </div>

                {/* Audit Calculation Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">প্রত্যাশিত ক্যাশ ব্যালেন্স (Expected):</span>
                    <span className="font-mono font-bold">{formatCurrency(expectedCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">প্রকৃত ক্যাশ (Counted):</span>
                    <span className="font-mono font-bold">{formatCurrency(actualPhysicalCash)}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between font-black text-sm items-center">
                    <span>তফাত (Variance):</span>
                    {isBalanced ? (
                      <Badge variant="success" className="text-xs">✓ সম্পূর্ণ মিলেছে (Balanced)</Badge>
                    ) : isShort ? (
                      <span className="font-mono text-rose-600">ঘাটতি: {formatCurrency(Math.abs(variance))}</span>
                    ) : (
                      <span className="font-mono text-emerald-600">উদ্বৃত্ত: +{formatCurrency(variance)}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Handover Custody details */}
          <div className="md:col-span-5 space-y-4">
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  হস্তান্তরকারী ও গ্রহণকারী তথ্য
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">কাউন্টার ও বুথ নম্বর</label>
                  <input
                    type="text"
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">হস্তান্তরকারী কাউন্টারম্যান (Outgoing)</label>
                  <input
                    type="text"
                    value={outgoingStaff}
                    onChange={(e) => setOutgoingStaff(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">গ্রহণকারী কাউন্টারম্যান (Incoming)</label>
                  <input
                    type="text"
                    value={incomingStaff}
                    onChange={(e) => setIncomingStaff(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">হস্তান্তর মন্তব্য বা নোট</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={handleCompleteHandover}
                  className="w-full font-black rounded-2xl py-3 mt-2 shadow-lg shadow-amber-500/25 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                  শিফট হস্তান্তর সম্পন্ন করুন
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
