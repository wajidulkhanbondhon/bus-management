'use client';

import React from 'react';
import { OfficeAIAssistant } from '@/components/ai/office-ai-assistant';
import { Sparkles, BarChart3 } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function OfficeAIPage() {
  const { language } = useApp();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'অফিস এআই বিজনেস ও অপারেশন কো-পাইলট' : 'Office AI Business Copilot'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'ডাটাবেজ ভিত্তিক লাইভ সেলস, প্রফিট-মার্জিন, বাস র্যাঙ্কিং এবং অডিট ইনসাইটস'
                : 'Verified analytics, bus fleet performance, profit margin calculations and actionable insights'}
            </p>
          </div>
        </div>
      </div>

      <OfficeAIAssistant />
    </div>
  );
}
