'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  Plus,
  Coins,
  TrendingUp,
  Wallet,
  AlertTriangle,
  LockKeyhole,
  CheckCircle2,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { fastApiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type {
  AdmissionAccountsSummary,
  AdmissionDayClosing,
  AdmissionLedgerEntry,
} from '@/types/admission';

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AdmissionAccountsPage() {
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());
  const [summary, setSummary] = useState<AdmissionAccountsSummary | null>(null);
  const [ledger, setLedger] = useState<AdmissionLedgerEntry[]>([]);
  const [closings, setClosings] = useState<AdmissionDayClosing[]>([]);
  const [loading, setLoading] = useState(true);

  // Day closing form
  const [closingDate, setClosingDate] = useState(todayIsoDate());
  const [actualCash, setActualCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingMsg, setClosingMsg] = useState('');
  const [submittingClosing, setSubmittingClosing] = useState(false);

  const loadData = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    const [sumRes, ledRes, closeRes] = await Promise.all([
      fastApiClient.getAdmissionAccountsSummary(from || undefined, to || undefined),
      fastApiClient.getAdmissionLedger(),
      fastApiClient.getAdmissionDayClosings(),
    ]);
    if (sumRes.success && sumRes.data) setSummary(sumRes.data);
    if (ledRes.success && Array.isArray(ledRes.data)) setLedger(ledRes.data);
    if (closeRes.success && Array.isArray(closeRes.data)) setClosings(closeRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(dateFrom, dateTo);
  }, [loadData, dateFrom, dateTo]);

  const setPresetRange = (mode: 'TODAY' | 'ALL') => {
    if (mode === 'TODAY') {
      const t = todayIsoDate();
      setDateFrom(t);
      setDateTo(t);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const handleDayClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    setClosingMsg('');
    setSubmittingClosing(true);
    const res = await fastApiClient.submitAdmissionDayClosing({
      closing_date: closingDate,
      actual_total_cash: Number(actualCash) || 0,
      notes: closingNotes.trim() || undefined,
    });
    setSubmittingClosing(false);
    if (res.success && res.data) {
      setClosingMsg(`ডে-ক্লোজিং সম্পন্ন (${res.data.reconcile_status})`);
      setActualCash('');
      setClosingNotes('');
      loadData(dateFrom, dateTo);
    } else {
      setClosingMsg(res.error || 'ডে-ক্লোজিং ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ভর্তি সার্ভিস হিসাব, লেজার ও ডে-ক্লোজিং
              </h1>
              <Badge variant="purple">বাস হিসাব থেকে সম্পূর্ণ আলাদা</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              শুধুমাত্র বিশ্ববিদ্যালয় ভর্তি ফরম সার্ভিসের আয়, সরকারি ফি, বকেয়া, পেমেন্ট মেথড ও নিজস্ব লেজার
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admission-service">
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              স্লিপ তালিকা
            </Button>
          </Link>
          <Link href="/admission-service/new">
            <Button variant="primary" size="sm" className="rounded-xl font-black">
              <Plus className="w-4 h-4 mr-1.5" />
              নতুন স্লিপ
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Filter Bar */}
      <Card className="p-4 rounded-2xl">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">শুরুর তারিখ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">শেষ তারিখ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
          <Button size="sm" variant={!dateFrom ? 'outline' : 'primary'} onClick={() => setPresetRange('TODAY')} className="rounded-xl text-xs font-bold">
            আজকের হিসাব
          </Button>
          <Button size="sm" variant={!dateFrom ? 'primary' : 'outline'} onClick={() => setPresetRange('ALL')} className="rounded-xl text-xs font-bold">
            সর্বমোট (All Time)
          </Button>
        </div>
      </Card>

      {/* Isolated Accounting KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 rounded-3xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>মোট কালেকশন (Net Cash)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-2">
            {formatCurrency(summary?.net_cash_collected)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary?.total_slips || 0} স্লিপ • {summary?.total_forms || 0} ফরম
          </div>
        </Card>

        <Card className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/70 to-white dark:from-indigo-950/30 dark:to-slate-900 border-indigo-200 dark:border-indigo-900">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <span>নিট সার্ভিস আয় (Profit)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-700 dark:text-indigo-300 mt-2">
            {formatCurrency(summary?.net_service_profit)}
          </div>
          <div className="text-[11px] text-indigo-600/80 mt-1">
            চার্জ {formatCurrency(summary?.total_service_charge)} - ছাড় {formatCurrency(summary?.total_discount)}
          </div>
        </Card>

        <Card className="p-4 rounded-3xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>বিশ্ববিদ্যালয় সরকারি ফি</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary?.total_govt_fee)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            পোর্টালে জমা/দায় বাবদ
          </div>
        </Card>

        <Card className="p-4 rounded-3xl">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600">
            <span>বকেয়া (Due)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 mt-2">
            {formatCurrency(summary?.total_due)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            রিফান্ড: {formatCurrency(summary?.total_refunded)}
          </div>
        </Card>

        <Card className="p-4 rounded-3xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>আবেদন অগ্রগতি</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            {summary?.applied_forms || 0} / {summary?.total_forms || 0}
          </div>
          <div className="text-[11px] text-amber-600 font-bold mt-1">
            বাকি (Pending): {summary?.pending_forms || 0} টি
          </div>
        </Card>
      </div>

      {/* Payment Method Breakdown + University Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 rounded-3xl">
          <CardHeader>
            <CardTitle>পেমেন্ট মেথড ভিত্তিক হিসাব</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(summary?.method_breakdown || {}).map(([method, amt]) => (
              <div
                key={method}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <span className="font-bold text-slate-700 dark:text-slate-200">{method}</span>
                <span className="font-mono font-black text-emerald-600 text-sm">{formatCurrency(amt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-7 rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              বিশ্ববিদ্যালয় ভিত্তিক ফরম ও ফি হিসাব
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">লোড হচ্ছে...</div>
            ) : !summary?.university_breakdown?.length ? (
              <div className="p-6 text-center text-xs text-slate-400">এই সময়সীমায় কোনো ফরম জমা নেই।</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-mono uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">বিশ্ববিদ্যালয়</th>
                    <th className="px-4 py-2.5 text-center">ফরম (Done/Total)</th>
                    <th className="px-4 py-2.5 text-right">সরকারি ফি</th>
                    <th className="px-4 py-2.5 text-right">সার্ভিস আয়</th>
                    <th className="px-4 py-2.5 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summary.university_breakdown.map((u) => (
                    <tr key={u.university_name}>
                      <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{u.university_name}</td>
                      <td className="px-4 py-2.5 text-center font-mono">
                        {u.applied_count} / {u.forms_count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(u.govt_fee_total)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(u.service_charge_total)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-black">{formatCurrency(u.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Separate Admission Day Closing + Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="w-4 h-4 text-amber-600" />
              ভর্তি সার্ভিস ডে-ক্লোজিং
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleDayClosing} className="space-y-3">
              <Input
                label="ক্লোজিং তারিখ"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                required
              />
              <Input
                label="বাস্তবে প্রাপ্ত মোট টাকা (৳)"
                type="number"
                min={0}
                step="any"
                placeholder="যেমন: 15400"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                required
              />
              <Input
                label="মন্তব্য (ঐচ্ছিক)"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
              />
              {closingMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {closingMsg}
                </div>
              )}
              <Button type="submit" variant="primary" disabled={submittingClosing} className="w-full rounded-xl font-bold">
                {submittingClosing ? 'সাবমিট হচ্ছে...' : 'আলাদা ডে-ক্লোজিং সম্পন্ন করুন'}
              </Button>
            </form>

            {closings.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-black text-slate-500 uppercase">সাম্প্রতিক ক্লোজিং</div>
                {closings.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <div className="font-mono font-bold">{c.closing_date}</div>
                      <div className="text-[10px] text-slate-400">
                        Expected {formatCurrency(c.expected_collected)} • Actual {formatCurrency(c.actual_total_cash)}
                      </div>
                    </div>
                    <Badge variant={c.reconcile_status === 'MATCHED' ? 'success' : 'warning'}>
                      {c.reconcile_status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 rounded-3xl">
          <CardHeader>
            <CardTitle>ভর্তি সার্ভিস নিজস্ব লেজার (Admission Financial Ledger)</CardTitle>
            <Badge variant="info">{ledger.length} টি এন্ট্রি</Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto max-h-[460px]">
            {ledger.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">এখনো কোনো লেজার এন্ট্রি নেই।</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-mono uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">এন্ট্রি নং</th>
                    <th className="px-4 py-2.5">ধরণ</th>
                    <th className="px-4 py-2.5">বিবরণ</th>
                    <th className="px-4 py-2.5 text-right">ডেবিট</th>
                    <th className="px-4 py-2.5 text-right">ক্রেডিট</th>
                    <th className="px-4 py-2.5 text-right">সময়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledger.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {l.entry_number}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={
                            l.entry_type === 'PAYMENT_RECEIVED' || l.entry_type === 'DUE_COLLECTED'
                              ? 'success'
                              : l.entry_type === 'REFUND_ISSUED'
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {l.entry_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {l.description}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-rose-600">
                        {Number(l.debit) > 0 ? formatCurrency(l.debit) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600">
                        {Number(l.credit) > 0 ? formatCurrency(l.credit) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400">
                        {formatDateTime(l.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

