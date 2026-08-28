'use client';

import React, { useState } from 'react';
import { Sparkles, Bot, X, Maximize2, Building2, Ticket } from 'lucide-react';
import { OfficeAIAssistant } from './office-ai-assistant';
import { StudentAIAssistant } from './student-ai-assistant';
import { AIAvatar } from './ai-avatar';
import { useApp } from '@/lib/context';

export function AIFloatingTrigger() {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<'OFFICE' | 'STUDENT'>('OFFICE');

  return (
    <>
      {/* Floating Trigger Pill in Bottom Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 pl-2 pr-4 py-2 bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 hover:from-slate-900 hover:to-indigo-900 text-white rounded-full font-black text-xs shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-500/30 backdrop-blur-md"
          >
            <AIAvatar variant="office" size="xs" showStatusBadge={false} />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-extrabold text-[11px] bg-gradient-to-r from-cyan-300 via-indigo-200 to-white bg-clip-text text-transparent">
                {language === 'bn' ? 'ATOMS এআই সহকারী' : 'ATOMS AI Copilot'}
              </span>
              <span className="text-[9px] text-cyan-400/80 font-mono font-medium">Online • 24/7 Support</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
          </button>
        </div>
      )}

      {/* Floating Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Top Bar Switcher */}
            <div className="p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
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
                  <span>{language === 'bn' ? 'অফিস এআই (Office Copilot)' : 'Office AI Copilot'}</span>
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
                  <span>{language === 'bn' ? 'স্টুডেন্ট এআই (Student Transport)' : 'Student AI Assistant'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Assistant Container */}
            <div className="flex-1 overflow-hidden">
              {activeContext === 'OFFICE' ? <OfficeAIAssistant /> : <StudentAIAssistant />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
