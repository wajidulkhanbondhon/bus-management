'use client';

import React, { useState } from 'react';
import { Sparkles, Bot, X, Maximize2, Building2, Ticket } from 'lucide-react';
import { OfficeAIAssistant } from './office-ai-assistant';
import { StudentAIAssistant } from './student-ai-assistant';
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
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-black text-xs shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{language === 'bn' ? 'ATOMS AI সহকারী' : 'ATOMS AI Assistant'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
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
