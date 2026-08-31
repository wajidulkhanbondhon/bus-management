'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  Calendar,
  Download,
  Plus,
  Clock,
  Banknote
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface PayrollEntry {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  overtime: number;
  bonus: number;
  deductions: number;
  netPay: number;
  status: 'PAID' | 'PENDING';
  month: string;
}

const dummyPayroll: PayrollEntry[] = [
  { id: '1', name: 'আব্দুল করিম', role: 'Counter Staff', baseSalary: 15000, overtime: 2000, bonus: 1000, deductions: 500, netPay: 17500, status: 'PAID', month: 'August 2026' },
  { id: '2', name: 'ফারুক আহমেদ', role: 'Supervisor', baseSalary: 22000, overtime: 0, bonus: 2000, deductions: 1000, netPay: 23000, status: 'PAID', month: 'August 2026' },
  { id: '3', name: 'রাশেদ খান', role: 'Counter Staff', baseSalary: 15000, overtime: 3500, bonus: 0, deductions: 500, netPay: 18000, status: 'PENDING', month: 'August 2026' },
  { id: '4', name: 'সাজেদুল ইসলাম', role: 'Manager', baseSalary: 35000, overtime: 0, bonus: 5000, deductions: 2000, netPay: 38000, status: 'PENDING', month: 'August 2026' },
];

export default function PayrollPage() {
  const { language } = useApp();
  const [entries] = useState<PayrollEntry[]>(dummyPayroll);

  const totalPayable = entries.reduce((sum, e) => sum + e.netPay, 0);
  const totalPaid = entries.filter(e => e.status === 'PAID').reduce((sum, e) => sum + e.netPay, 0);
  const totalPending = entries.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + e.netPay, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 border-violet-200 dark:border-violet-800">
              <Banknote className="w-3.5 h-3.5 mr-1" />
              Human Resources
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'স্টাফ পে-রোল' : 'Staff Payroll'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{language === 'bn' ? 'কর্মচারীদের মাসিক বেতন, বোনাস ও ওভারটাইম হিসাব করুন।' : 'Manage monthly salaries, bonuses and overtime for staff.'}</p>
        </div>
        <Button variant="outline" className="rounded-2xl font-bold text-xs bg-white dark:bg-slate-900">
          <Download className="w-4 h-4 mr-1.5" />
          {language === 'bn' ? 'PDF ডাউনলোড' : 'Export PDF'}
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 border-l-4 border-l-violet-500">
          <span className="text-xs font-bold text-violet-600 uppercase font-mono flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> মোট বেতন</span>
          <div className="text-3xl font-black text-violet-900 dark:text-violet-100 font-mono mt-1">৳ {totalPayable.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-emerald-600 uppercase font-mono">পরিশোধিত</span>
          <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 font-mono mt-1">৳ {totalPaid.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-amber-600 uppercase font-mono">বকেয়া</span>
          <div className="text-3xl font-black text-amber-900 dark:text-amber-100 font-mono mt-1">৳ {totalPending.toLocaleString()}</div>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase">
                <th className="text-left p-4">কর্মচারী</th>
                <th className="text-left p-4">পদবি</th>
                <th className="text-right p-4">মূল বেতন</th>
                <th className="text-right p-4">ওভারটাইম</th>
                <th className="text-right p-4">বোনাস</th>
                <th className="text-right p-4">কর্তন</th>
                <th className="text-right p-4 font-black">নেট পে</th>
                <th className="text-center p-4">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {entries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center font-bold text-xs text-violet-600">{entry.name.charAt(0)}</div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{entry.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{entry.role}</td>
                  <td className="p-4 text-right font-mono text-sm">৳{entry.baseSalary.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-sm text-emerald-600">+৳{entry.overtime.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-sm text-blue-600">+৳{entry.bonus.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-sm text-rose-600">-৳{entry.deductions.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-sm font-black text-slate-900 dark:text-white">৳{entry.netPay.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase ${entry.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{entry.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
