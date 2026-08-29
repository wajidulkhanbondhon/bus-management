'use client';

import React from 'react';
import { Bus, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white select-none relative overflow-hidden transition-colors duration-200">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.06),transparent)]" />

      <div className="w-full max-w-md space-y-6 relative z-10">
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

        {/* Card Body */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900/90 rounded-3xl overflow-hidden backdrop-blur-xl">
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
