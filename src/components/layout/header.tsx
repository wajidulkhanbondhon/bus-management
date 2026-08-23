'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Sparkles,
  User,
  Shield,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Plus,
  Lock,
  CreditCard,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Globe,
  Bus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';
import { switchDemoUserAction, logoutAction } from '@/actions/auth.actions';

import { GlobalSearchBar } from '@/components/layout/global-search-bar';

export interface HeaderProps {
  currentUser?: {
    id: string;
    fullName: string;
    email: string;
    role: { name: string; permissions: string[] };
    discountLimit: number;
  } | null;
}

export function Header({ currentUser }: HeaderProps) {
  const router = useRouter();
  const { language, setLanguage, theme, setTheme, t } = useApp();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
      setDateStr(now.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const handleSwitchRole = async (email: string) => {
    await switchDemoUserAction(email);
    setIsRoleDropdownOpen(false);
    router.refresh();
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  const roleColor = {
    SUPER_ADMIN: 'purple',
    ADMIN: 'primary',
    MANAGER: 'info',
    BOOKING_STAFF: 'success',
    ACCOUNTANT: 'warning',
    VIEWER: 'default'
  }[currentUser?.role.name || 'SUPER_ADMIN'] as any;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between z-30 sticky top-0 shadow-2xs select-none gap-4">
      {/* Left: Bangladesh Business Day & Time Clock */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{dateStr || '23 Aug 2026'}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{timeStr || '08:00:00 PM'}</span>
          <span className="text-[10px] font-bold text-slate-400 font-mono">(ঢাকা BST)</span>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-emerald-800 dark:text-emerald-300">{t.businessDayOpen}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <GlobalSearchBar />

      {/* Right: Language Toggle, Dark Mode Switcher, Quick Actions & Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Language Switcher (বাংলা ⇄ English) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setLanguage('bn')}
            className={`px-2 py-1 rounded-md font-bold text-xs transition-all ${
              language === 'bn'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            বাংলা
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-md font-bold text-xs transition-all ${
              language === 'en'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            EN
          </button>
        </div>

        {/* Dark Mode / Light Mode Switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Quick Actions Dropdown */}
        <div className="relative">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="flex items-center gap-1.5 shadow-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>{t.quickActions}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Button>

          {isQuickActionsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsQuickActionsOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {t.quickActions}
                </div>
                <Link
                  href="/bookings/new"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>{t.newBooking}</span>
                </Link>
                <Link
                  href="/trips/create"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{t.scheduleTrip}</span>
                </Link>
                <Link
                  href="/buses/seat-builder"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bus className="w-4 h-4 text-purple-600" />
                  <span>{t.seatBuilder}</span>
                </Link>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <Link
                  href="/day-closing"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>{t.dayClosing}</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {currentUser?.fullName ? currentUser.fullName[0] : 'A'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {currentUser?.fullName || 'Kamrul Hasan (Director)'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant={roleColor}>{currentUser?.role.name || 'SUPER_ADMIN'}</Badge>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {isRoleDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser?.fullName}</p>
                  <p className="text-[11px] text-slate-500">{currentUser?.email}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-1">
                    Discount Allowance: ৳{currentUser?.discountLimit === 99999 ? 'Unlimited' : currentUser?.discountLimit}
                  </p>
                </div>

                <div className="px-3 py-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    {t.switchRole}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleSwitchRole('admin@transport.office')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200"
                    >
                      <span>Kamrul Hasan (Director)</span>
                      <Badge variant="purple">Super Admin</Badge>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('manager@transport.office')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200"
                    >
                      <span>Tariqul Islam (Supervisor)</span>
                      <Badge variant="info">Manager</Badge>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('staff@transport.office')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200"
                    >
                      <span>Rahim Chowdhury (Desk)</span>
                      <Badge variant="success">Booking Staff</Badge>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('accountant@transport.office')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200"
                    >
                      <span>Zubair Ahmed (Cashier)</span>
                      <Badge variant="warning">Accountant</Badge>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
