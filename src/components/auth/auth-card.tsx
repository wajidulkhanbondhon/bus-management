'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Bus, ShieldCheck, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/context';

interface AuthCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({
  title = 'ATOMS Transport Desk',
  subtitle = 'Internal Office & Terminal Management System',
  children,
  footer,
}: AuthCardProps) {
  const { theme, setTheme } = useApp();

  // Ensure login page defaults to Light Mode as explicitly requested
  useEffect(() => {
    // Set theme to light on initial mount of login page
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('atoms_theme');
      if (savedTheme !== 'light') {
        setTheme('light');
      }
    }
  }, [setTheme]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 dark:bg-slate-950 text-slate-900 dark:text-white select-none relative overflow-hidden transition-colors duration-200">
      {/* Top action bar: Back to Home + Theme Switcher */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 max-w-4xl mx-auto w-full px-2 sm:px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
          <span>হোমপেজে ফিরুন</span>
        </Link>

        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'লাইট মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
          aria-label="Toggle Theme"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs backdrop-blur-md cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>লাইট মোড</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>ডার্ক মোড</span>
            </>
          )}
        </button>
      </div>

      {/* Background ambient gradient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 pt-8 sm:pt-4">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl shadow-blue-500/25 border border-blue-400/20">
            <Bus className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
              {title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Card Body — Crisp Light presentation */}
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white/95 dark:bg-slate-900/90 rounded-3xl overflow-hidden backdrop-blur-xl">
          <CardContent className="p-6 sm:p-7 space-y-5">
            {children}
            {footer}
          </CardContent>
        </Card>

        {/* Secure badge footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          <span>Encrypted Session • Multi-Role Access Control</span>
        </div>
      </div>
    </div>
  );
}
