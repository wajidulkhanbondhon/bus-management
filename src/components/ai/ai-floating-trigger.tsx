'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, Bot, X, Building2, Ticket, ShieldCheck, Zap } from 'lucide-react';
import { OfficeAIAssistant } from './office-ai-assistant';
import { StudentAIAssistant } from './student-ai-assistant';
import { AIAvatar } from './ai-avatar';
import { useApp } from '@/lib/context';

export function AIFloatingTrigger() {
  const pathname = usePathname();
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Determine if user is currently on public/student pages
  const isStudentPage =
    pathname === '/' ||
    pathname.startsWith('/passenger') ||
    pathname.startsWith('/track') ||
    pathname.startsWith('/book') ||
    pathname.startsWith('/universities') ||
    pathname === '/ai/student';

  const [activeContext, setActiveContext] = useState<'OFFICE' | 'STUDENT'>(
    isStudentPage ? 'STUDENT' : 'OFFICE'
  );

  return (
    <>
      {/* Floating Trigger Pill in Bottom Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <button
            onClick={() => {
              setActiveContext(isStudentPage ? 'STUDENT' : 'OFFICE');
              setIsOpen(true);
            }}
            className={`group flex items-center gap-3 pl-2.5 pr-4 py-2 text-white rounded-full font-black text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border backdrop-blur-md ${
              isStudentPage
                ? 'bg-gradient-to-r from-slate-950 via-teal-950 to-emerald-950 hover:from-slate-900 hover:to-emerald-900 border-emerald-500/40 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 hover:from-slate-900 hover:to-indigo-900 border-indigo-500/40 shadow-indigo-500/30'
            }`}
          >
            <AIAvatar
              variant={isStudentPage ? 'student' : 'office'}
              size="xs"
              showStatusBadge={false}
            />
            <div className="flex flex-col items-start leading-tight">
              <span
                className={`font-extrabold text-[11px] bg-clip-text text-transparent ${
                  isStudentPage
                    ? 'bg-gradient-to-r from-emerald-300 via-teal-200 to-white'
                    : 'bg-gradient-to-r from-cyan-300 via-indigo-200 to-white'
                }`}
              >
                {isStudentPage
                  ? (language === 'bn' ? 'ভর্তি বাস এআই সহকারী' : 'Student Bus AI')
                  : (language === 'bn' ? 'অফিস এআই কো-পাইলট' : 'Office AI Copilot')}
              </span>
              <span className="text-[9px] text-slate-400 font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isStudentPage ? 'সিট ও শিডিউল সাপোর্ট' : 'রিয়েল-টাইম বিজনেস এআই'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Floating Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Top Bar */}
            <div className="p-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {/* If on student page, show pure Student AI Header (No Office Switcher) */}
              {isStudentPage ? (
                <div className="flex items-center gap-2.5 px-2">
                  <AIAvatar variant="student" size="xs" />
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'bn' ? 'ভর্তি স্পেশাল বাস পার্সোনাল এআই' : 'Admission Bus Transport AI'}
                    </h3>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {language === 'bn' ? 'শিক্ষার্থী ও পরীক্ষার্থী মোড' : 'Student & Candidate Mode'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Internal Staff View: Context Switcher available for admin testing */
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveContext('OFFICE')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeContext === 'OFFICE'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'অফিস এআই (Office)' : 'Office AI'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveContext('STUDENT')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeContext === 'STUDENT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'স্টুডেন্ট ভিউ প্রিভিউ' : 'Student View'}</span>
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Assistant Body Container */}
            <div className="flex-1 overflow-hidden">
              {isStudentPage || activeContext === 'STUDENT' ? (
                <StudentAIAssistant />
              ) : (
                <OfficeAIAssistant />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
