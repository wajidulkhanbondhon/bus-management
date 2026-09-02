'use client';

import React from 'react';
import { StudentAIAssistant } from '@/components/ai/student-ai-assistant';
import { Ticket, GraduationCap } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function StudentAIPage() {
  const { language } = useApp();

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/25">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'স্টুডেন্ট এআই পার্সোনাল ট্রান্সপোর্ট অ্যাসিস্ট্যান্ট' : 'Student AI Transport Assistant'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'ভর্তি পরীক্ষার বাস শিডিউল, সিট নম্বর, পিকআপ পয়েন্ট ও অভিভাবক পলিসি হেল্পার'
                : 'Personal trip schedule, seat allocation, boarding points and guardian eligibility FAQ'}
            </p>
          </div>
        </div>
      </div>

      <StudentAIAssistant />
    </div>
  );
}
