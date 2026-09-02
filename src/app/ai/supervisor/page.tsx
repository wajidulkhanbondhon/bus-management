'use client';

import React from 'react';
import { SupervisorAIAssistant } from '@/components/ai/supervisor-ai-assistant';
import { Bus, Users, ShieldAlert } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function SupervisorAIPage() {
  const { language } = useApp();

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'সুপারভাইজার অন-ট্রিপ এআই কন্ডাক্টর' : 'Supervisor On-Trip AI Conductor'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'যাত্রী লাইভ হাজিরা, বোর্ডিং স্টপস মাইলস্টোন, অন-ট্রিপ ক্যাশ ব্যালেন্স ও জরুরি ড্রাইভার হেল্পার'
                : 'Passenger attendance manifest, boarding milestones, on-trip cash tracker and driver emergency support'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[550px]">
        <SupervisorAIAssistant />
      </div>
    </div>
  );
}
