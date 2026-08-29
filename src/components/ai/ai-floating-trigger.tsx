'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, Bot, X, Building2, Ticket, Bus, ShieldCheck, Zap } from 'lucide-react';
import { OfficeAIAssistant } from './office-ai-assistant';
import { StudentAIAssistant } from './student-ai-assistant';
import { SupervisorAIAssistant } from './supervisor-ai-assistant';
import { AIAvatar } from './ai-avatar';
import { useApp } from '@/lib/context';

export function AIFloatingTrigger() {
  const pathname = usePathname();
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Determine current page domain
  const isSupervisorPage = pathname.startsWith('/supervisor') || pathname === '/ai/supervisor';
  const isStudentPage =
    !isSupervisorPage &&
    (pathname === '/' ||
      pathname.startsWith('/passenger') ||
      pathname.startsWith('/track') ||
      pathname.startsWith('/book') ||
      pathname.startsWith('/universities') ||
      pathname === '/ai/student');

  const initialContext: 'OFFICE' | 'SUPERVISOR' | 'STUDENT' = isSupervisorPage
    ? 'SUPERVISOR'
    : isStudentPage
    ? 'STUDENT'
    : 'OFFICE';

  const [activeContext, setActiveContext] = useState<'OFFICE' | 'SUPERVISOR' | 'STUDENT'>(initialContext);

  const triggerVariant = isSupervisorPage ? 'supervisor' : isStudentPage ? 'student' : 'office';

  const triggerPillBorder = isSupervisorPage
    ? 'border-amber-300 dark:border-amber-500/40 shadow-amber-500/25 hover:border-amber-400'
    : isStudentPage
    ? 'border-emerald-300 dark:border-emerald-500/40 shadow-emerald-500/25 hover:border-emerald-400'
    : 'border-indigo-300 dark:border-indigo-500/40 shadow-indigo-500/25 hover:border-indigo-400';

  const triggerTextGrad = isSupervisorPage
    ? 'bg-gradient-to-r from-amber-600 to-orange-700 dark:from-amber-300 dark:via-orange-200 dark:to-white'
    : isStudentPage
    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-300 dark:via-teal-200 dark:to-white'
    : 'bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-cyan-300 dark:via-indigo-200 dark:to-white';

  const triggerTitle = isSupervisorPage
    ? language === 'bn'
      ? 'সুপারভাইজার ট্রিপ এআই'
      : 'Supervisor Trip AI'
    : isStudentPage
    ? language === 'bn'
      ? 'ভর্তি বাস এআই সহকারী'
      : 'Student Bus AI'
    : language === 'bn'
    ? 'অফিস এআই কো-পাইলট'
    : 'Office AI Copilot';

  const triggerSubtitle = isSupervisorPage
    ? 'হাজিরা ও ট্রিপ সাপোর্ট'
    : isStudentPage
    ? 'সিট ও শিডিউল সাপোর্ট'
    : 'রিয়েল-টাইম বিজনেস এআই';

  return (
    <>
      {/* Floating Trigger Pill in Bottom Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <button
            onClick={() => {
              setActiveContext(initialContext);
              setIsOpen(true);
            }}
            className={`group flex items-center gap-3 pl-2.5 pr-4 py-2 rounded-full font-black text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border backdrop-blur-md bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${triggerPillBorder}`}
          >
            <AIAvatar
              variant={triggerVariant}
              size="xs"
              showStatusBadge={false}
            />
            <div className="flex flex-col items-start leading-tight">
              <span className={`font-extrabold text-[11px] bg-clip-text text-transparent ${triggerTextGrad}`}>
                {triggerTitle}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-medium flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isSupervisorPage ? 'bg-amber-500' : isStudentPage ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                />
                {triggerSubtitle}
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
              {/* If on Supervisor Page: Pure Supervisor AI Header */}
              {isSupervisorPage ? (
                <div className="flex items-center gap-2.5 px-2">
                  <AIAvatar variant="supervisor" size="xs" />
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'bn' ? 'সুপারভাইজার অন-ট্রিপ এআই কন্ডাক্টর' : 'Supervisor On-Trip AI Conductor'}
                    </h3>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      {language === 'bn' ? 'অন-ট্রিপ বাস অপারেশন মোড' : 'On-Trip Conductor Mode'}
                    </span>
                  </div>
                </div>
              ) : isStudentPage ? (
                /* If on Student Page: Pure Student AI Header */
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
                /* Internal Staff View: Context Switcher available for admin / testing all 3 roles */
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveContext('OFFICE')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      activeContext === 'OFFICE'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'অফিস এআই' : 'Office AI'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveContext('SUPERVISOR')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      activeContext === 'SUPERVISOR'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'সুপারভাইজার মোড' : 'Supervisor Mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveContext('STUDENT')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      activeContext === 'STUDENT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'স্টুডেন্ট মোড' : 'Student Mode'}</span>
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
              {activeContext === 'SUPERVISOR' ? (
                <SupervisorAIAssistant />
              ) : activeContext === 'STUDENT' ? (
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
