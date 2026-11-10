'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  GraduationCap,
  CheckCircle2,
  CreditCard,
  Sparkles,
  ArrowLeft,
  User,
  Phone,
  Receipt,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { fastApiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cleanAndLimitPhoneNumber, formatCurrency } from '@/lib/utils';
import { AdmissionPaymentSlip } from '@/components/admission/admission-payment-slip';
import type { AdmissionFeePreset, AdmissionOrder } from '@/types/admission';

interface FormLineItem {
  key: string;
  university_name: string;
  unit_name: string;
  govt_fee: number;
  service_charge: number;
  remarks?: string;
}

const PAYMENT_METHODS = [
  { id: 'HAND_CASH', label: 'নগদ (Cash)' },
  { id: 'BKASH', label: 'bKash' },
  { id: 'NAGAD', label: 'Nagad' },
  { id: 'ROCKET', label: 'Rocket' },
  { id: 'BANK_TRANSFER', label: 'Bank' },
];

export default function NewAdmissionSlipPage() {
  const [presets, setPresets] = useState<AdmissionFeePreset[]>([]);
  const [presetSearch, setPresetSearch] = useState('');
  const [loadingPresets, setLoadingPresets] = useState(true);

  // Student info
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [hscRoll, setHscRoll] = useState('');
  const [sscRoll, setSscRoll] = useState('');
  const [hscBoard, setHscBoard] = useState('');
  const [hscYear, setHscYear] = useState('2026');
  const [studentGroup, setStudentGroup] = useState('বিজ্ঞান');
  const [notes, setNotes] = useState('');

  // Multi-form items
  const [items, setItems] = useState<FormLineItem[]>([]);

  // Payment
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('HAND_CASH');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [autoFullPay, setAutoFullPay] = useState(true);
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdOrder, setCreatedOrder] = useState<AdmissionOrder | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  useEffect(() => {
    fastApiClient.getAdmissionPresets().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setPresets(res.data);
      }
      setLoadingPresets(false);
    });
  }, []);

  const filteredPresets = useMemo(() => {
    const q = presetSearch.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(
      (p) =>
        p.university_name.toLowerCase().includes(q) ||
        p.unit_name.toLowerCase().includes(q)
    );
  }, [presets, presetSearch]);

  const totals = useMemo(() => {
    const totalGovt = items.reduce((s, i) => s + (Number(i.govt_fee) || 0), 0);
    const totalSvc = items.reduce((s, i) => s + (Number(i.service_charge) || 0), 0);
    const gross = totalGovt + totalSvc;
    const discount = Math.min(Math.max(0, Number(discountAmount) || 0), gross);
    const net = Math.max(0, gross - discount);
    const paid = autoFullPay ? net : Math.min(Math.max(0, Number(paidAmount) || 0), net);
    const due = Math.max(0, net - paid);
    return { totalGovt, totalSvc, gross, discount, net, paid, due };
  }, [items, discountAmount, paidAmount, autoFullPay]);

  const addPresetItem = (p: AdmissionFeePreset) => {
    setItems((prev) => [
      ...prev,
      {
        key: `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        university_name: p.university_name,
        unit_name: p.unit_name,
        govt_fee: Number(p.default_govt_fee) || 0,
        service_charge: Number(p.default_service_charge) || 0,
      },
    ]);
  };

  const addBlankCustomItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        university_name: '',
        unit_name: '',
        govt_fee: 0,
        service_charge: 100,
      },
    ]);
  };

  const updateItem = (key: string, patch: Partial<FormLineItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const resetForm = () => {
    setStudentName('');
    setStudentPhone('');
    setGuardianPhone('');
    setHscRoll('');
    setSscRoll('');
    setHscBoard('');
    setNotes('');
    setItems([]);
    setDiscountAmount(0);
    setPaidAmount('');
    setAutoFullPay(true);
    setTransactionId('');
    setPaymentNotes('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = cleanAndLimitPhoneNumber(studentPhone) || studentPhone.trim();
    if (!studentName.trim()) {
      setErrorMsg('শিক্ষার্থীর নাম লিখুন।');
      return;
    }
    if (cleanPhone.length < 6) {
      setErrorMsg('সঠিক মোবাইল নম্বর লিখুন।');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('কমপক্ষে ১টি বিশ্ববিদ্যালয় ফরম যোগ করুন।');
      return;
    }
    const invalidItem = items.find((i) => !i.university_name.trim() || !i.unit_name.trim());
    if (invalidItem) {
      setErrorMsg('প্রতিটি ফরমের বিশ্ববিদ্যালয়ের নাম ও ইউনিট পূরণ করুন।');
      return;
    }

    setSubmitting(true);
    const res = await fastApiClient.createAdmissionOrder({
      student_name: studentName.trim(),
      student_phone: cleanPhone,
      guardian_phone: guardianPhone.trim() || undefined,
      hsc_roll: hscRoll.trim() || undefined,
      ssc_roll: sscRoll.trim() || undefined,
      hsc_board: hscBoard.trim() || undefined,
      hsc_year: hscYear.trim() || undefined,
      student_group: studentGroup.trim() || undefined,
      notes: notes.trim() || undefined,
      items: items.map((i) => ({
        university_name: i.university_name.trim(),
        unit_name: i.unit_name.trim(),
        govt_fee: Number(i.govt_fee) || 0,
        service_charge: Number(i.service_charge) || 0,
        remarks: i.remarks?.trim() || undefined,
      })),
      discount_amount: totals.discount,
      paid_amount: totals.paid,
      payment_method: paymentMethod,
      transaction_id: transactionId.trim() || undefined,
      payment_notes: paymentNotes.trim() || undefined,
    });
    setSubmitting(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error || 'স্লিপ তৈরি করতে সমস্যা হয়েছে।');
      return;
    }

    setCreatedOrder(res.data);
    setSlipModalOpen(true);
    resetForm();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                নতুন ভর্তি ফরম জমা ও পেমেন্ট স্লিপ
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                একজন শিক্ষার্থীর এক বা একাধিক বিশ্ববিদ্যালয় ফরম জমা নিয়ে সাথে সাথে পেমেন্ট কপি প্রিন্ট করুন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admission-service">
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              সব স্লিপ তালিকা
            </Button>
          </Link>
          <Link href="/admission-service/accounts">
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              <Receipt className="w-4 h-4 mr-1.5" />
              আলাদা হিসাব
            </Button>
          </Link>
        </div>
      </div>

      {/* Re-open last created slip banner */}
      {createdOrder && !slipModalOpen && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              সর্বশেষ স্লিপ তৈরি হয়েছে: <span className="font-mono">{createdOrder.slip_number}</span> ({createdOrder.student_name})
            </span>
          </div>
          <Button size="sm" variant="primary" onClick={() => setSlipModalOpen(true)} className="rounded-xl font-bold">
            <Printer className="w-4 h-4 mr-1.5" />
            পেমেন্ট স্লিপ দেখুন / প্রিন্ট
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left & Center: Student Info + University Form Selector */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Student Details */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-indigo-600" />
                ১. শিক্ষার্থীর তথ্য (Student Information)
              </CardTitle>
              <Badge variant="primary">Required *</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="শিক্ষার্থীর পূর্ণ নাম *"
                placeholder="যেমন: মো. রাফিউজ্জামান"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
              <Input
                label="মোবাইল নম্বর *"
                placeholder="017XXXXXXXX"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                required
              />
              <Input
                label="অভিভাবকের মোবাইল (ঐচ্ছিক)"
                placeholder="018XXXXXXXX"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
              />
              <Input
                label="HSC রোল"
                placeholder="যেমন: 102938"
                value={hscRoll}
                onChange={(e) => setHscRoll(e.target.value)}
              />
              <Input
                label="SSC রোল"
                placeholder="যেমন: 405960"
                value={sscRoll}
                onChange={(e) => setSscRoll(e.target.value)}
              />
              <Input
                label="বোর্ড ও সাল"
                placeholder="যেমন: ঢাকা ২০২৬"
                value={hscBoard}
                onChange={(e) => setHscBoard(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  বিভাগ / গ্রুপ
                </label>
                <select
                  value={studentGroup}
                  onChange={(e) => setStudentGroup(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="বিজ্ঞান">বিজ্ঞান (Science)</option>
                  <option value="মানবিক">মানবিক (Humanities)</option>
                  <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা (Business)</option>
                  <option value="মাদ্রাসা / কারিগরি">মাদ্রাসা / কারিগরি</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="বিশেষ নোট / ডকুমেন্ট তথ্য"
                  placeholder="যেমন: কোটা আছে, ছবি জমা দিয়েছে, ইত্যাদি"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Quick University Presets Picker */}
          <Card className="rounded-3xl">
            <CardHeader className="flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="w-4 h-4 text-fuchsia-600" />
                  ২. বিশ্ববিদ্যালয় ফরম নির্বাচন করুন (একাধিক ফরম যোগ করা যাবে)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  নিচের যেকোনো বিশ্ববিদ্যালয় বাটনে ক্লিক করলে ফরম লিস্টে যুক্ত হবে
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="বিশ্ববিদ্যালয় খুঁজুন..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl w-44"
                />
                <Button type="button" size="sm" variant="outline" onClick={addBlankCustomItem} className="rounded-xl text-xs font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  কাস্টম ফরম
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPresets ? (
                <div className="text-xs text-slate-400 py-4 text-center">প্রিসেট লোড হচ্ছে...</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredPresets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addPresetItem(p)}
                      className="text-left px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-all group"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center gap-1">
                        <Plus className="w-3 h-3 text-indigo-500" />
                        {p.university_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{p.unit_name}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Number(p.default_govt_fee) + Number(p.default_service_charge))}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Forms Table */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    জমা নেওয়া ফরমের তালিকা ({items.length} টি)
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                    এখনো কোনো ফরম যোগ করা হয়নি। উপরের বিশ্ববিদ্যালয় বাটনে ক্লিক করুন অথবা &quot;কাস্টম ফরম&quot; যোগ করুন।
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item, index) => {
                      const sub = (Number(item.govt_fee) || 0) + (Number(item.service_charge) || 0);
                      return (
                        <div
                          key={item.key}
                          className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800"
                        >
                          <div className="col-span-12 sm:col-span-4">
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              #{index + 1} বিশ্ববিদ্যালয়
                            </label>
                            <input
                              type="text"
                              value={item.university_name}
                              onChange={(e) => updateItem(item.key, { university_name: e.target.value })}
                              placeholder="বিশ্ববিদ্যালয়ের নাম"
                              className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                              required
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-3">
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">ইউনিট</label>
                            <input
                              type="text"
                              value={item.unit_name}
                              onChange={(e) => updateItem(item.key, { unit_name: e.target.value })}
                              placeholder="ইউনিট"
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                              required
                            />
                          </div>
                          <div className="col-span-5 sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">সরকারি ফি (৳)</label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.govt_fee}
                              onChange={(e) => updateItem(item.key, { govt_fee: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div className="col-span-5 sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">সার্ভিস চার্জ (৳)</label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.service_charge}
                              onChange={(e) => updateItem(item.key, { service_charge: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1 flex flex-col items-end justify-between">
                            <span className="text-[11px] font-mono font-black text-slate-900 dark:text-white">
                              {formatCurrency(sub)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Separate Fee Summary & Payment Collection */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-3xl sticky top-20 border-indigo-200/80 dark:border-indigo-900/60 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-600/10 via-fuchsia-600/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                ৩. পেমেন্ট ও স্লিপ সামারি
              </CardTitle>
              <Badge variant="purple">{items.length} টি ফরম</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fee Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>বিশ্ববিদ্যালয় সরকারি ফি (Govt Fee):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(totals.totalGovt)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>আমাদের সার্ভিস চার্জ (Income):</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(totals.totalSvc)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-slate-600 dark:text-slate-400">ছাড় (Discount ৳):</span>
                  <input
                    type="number"
                    min={0}
                    max={totals.gross}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-24 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>মোট প্রদেয় (Net Payable):</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(totals.net)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  পেমেন্ট মাধ্যম
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        paymentMethod === m.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    জমা নেওয়া টাকা (Paid ৳)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAutoFullPay(true)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        autoFullPay ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      ফুল পেইড
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoFullPay(false);
                        setPaidAmount('0');
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        !autoFullPay && paidAmount === '0'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      বকেয়া
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={totals.net}
                  step="any"
                  value={autoFullPay ? totals.net : paidAmount}
                  onChange={(e) => {
                    setAutoFullPay(false);
                    setPaidAmount(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 text-base font-mono font-black bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">বকেয়া থাকবে (Due):</span>
                  <span className={`font-mono ${totals.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(totals.due)}
                  </span>
                </div>
              </div>

              {paymentMethod !== 'HAND_CASH' && (
                <Input
                  label="Transaction ID / Ref (ঐচ্ছিক)"
                  placeholder="যেমন: TrxID 9X8A7B"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-400">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-2xl"
                  title="ফর্ম রিসেট করুন"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || items.length === 0}
                  className="flex-1 font-black rounded-2xl shadow-lg shadow-indigo-500/25 py-3"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {submitting ? 'স্লিপ তৈরি হচ্ছে...' : 'স্লিপ কাটুন ও প্রিন্ট করুন'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Slip Print Modal */}
      <Modal
        isOpen={slipModalOpen && !!createdOrder}
        onClose={() => setSlipModalOpen(false)}
        title={`পেমেন্ট স্লিপ তৈরি সম্পন্ন — ${createdOrder?.slip_number || ''}`}
        description="এখান থেকে প্রিন্ট করে শিক্ষার্থীকে Payment Copy দিন এবং Office Copy সংরক্ষণ করুন।"
        size="xl"
      >
        {createdOrder && <AdmissionPaymentSlip order={createdOrder} />}
      </Modal>
    </div>
  );
}

