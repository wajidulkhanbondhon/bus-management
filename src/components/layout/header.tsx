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
  LockKeyhole,
  CreditCard,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Globe,
  BusFront,
  Grid3X3,
  CalendarPlus,
  SlidersHorizontal,
  ChevronRight,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';
import { switchDemoUserAction, logoutAction } from '@/actions/auth.actions';
import { GlobalSearchBar } from '@/components/layout/global-search-bar';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  currentUser?: {
    id: string;
    fullName: string;
    email: string;
    role: { name: string; permissions: string[] };
    discountLimit: number;
  } | null;
  onMobileMenuToggle?: () => void;
}

export function Header({ currentUser, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { language, setLanguage, theme, setTheme, headerFontSize, currentColor, t } = useApp();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

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
    localStorage.removeItem('fastapi_token');
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

  // Header font scaling classes
  const fontStyles = {
    sm: {
      headerHeight: 'h-14',
      clockText: 'text-[11px]',
      badgeText: 'text-[10px]',
      buttonSize: 'sm' as const,
      avatarSize: 'w-7 h-7 text-[11px]',
      userNameText: 'text-[11px]'
    },
    base: {
      headerHeight: 'h-16',
      clockText: 'text-xs',
      badgeText: 'text-xs',
      buttonSize: 'sm' as const,
      avatarSize: 'w-8 h-8 text-xs',
      userNameText: 'text-xs'
    },
    lg: {
      headerHeight: 'h-18',
      clockText: 'text-sm',
      badgeText: 'text-xs',
      buttonSize: 'md' as const,
      avatarSize: 'w-9 h-9 text-sm',
      userNameText: 'text-sm'
    },
    xl: {
      headerHeight: 'h-20',
      clockText: 'text-base font-medium',
      badgeText: 'text-sm',
      buttonSize: 'lg' as const,
      avatarSize: 'w-10 h-10 text-base',
      userNameText: 'text-base'
    }
  }[headerFontSize || 'base'];

  return (
    <header
      suppressHydrationWarning
      className={cn(
        'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-30 sticky top-0 shadow-2xs select-none gap-4 transition-all duration-200',
        fontStyles.headerHeight
      )}
    >
      {/* Left: Hamburger (mobile) + Bangladesh Business Day & Time Clock */}
      <div className="flex items-center gap-3 shrink-0" suppressHydrationWarning>
        {/* Hamburger menu — visible only on mobile */}
        <button
          onClick={onMobileMenuToggle}
          aria-label="মেনু খুলুন"
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop / Tablet Date & Time Clock */}
        <div className={cn(
          'hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-xl shadow-2xs transition-colors',
          fontStyles.clockText
        )} suppressHydrationWarning>
          <Calendar
            suppressHydrationWarning
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: currentColor?.primaryHex || 'var(--primary-color)' }}
          />
          <span suppressHydrationWarning className="font-semibold text-slate-800 dark:text-slate-200">{dateStr || '...'}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
          <span suppressHydrationWarning className="font-mono text-slate-700 dark:text-slate-300 font-bold">{timeStr || '--:--:--'}</span>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono hidden md:inline">(BST)</span>
        </div>

        {/* Mobile Mini Time Badge */}
        <div className="flex sm:hidden items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          <Clock className="w-3 h-3 text-blue-500" />
          <span>{timeStr?.slice(0, 8) || '--:--'}</span>
        </div>

        <div className={cn(
          'hidden xl:flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-xl',
          fontStyles.badgeText
        )}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">{t.businessDayOpen}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <GlobalSearchBar />

      {/* Right: Language Toggle, Dark Mode Switcher, Quick Actions & Profile */}
      <div className="flex items-center gap-2.5 shrink-0" suppressHydrationWarning>
        {/* Language Switcher (বাংলা ⇄ English) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80" suppressHydrationWarning>
          <button
            suppressHydrationWarning
            onClick={() => setLanguage('bn')}
            style={language === 'bn' ? { backgroundColor: 'var(--primary-color)' } : undefined}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              language === 'bn'
                ? 'text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
            }`}
          >
            বাংলা
          </button>
          <button
            suppressHydrationWarning
            onClick={() => setLanguage('en')}
            style={language === 'en' ? { backgroundColor: 'var(--primary-color)' } : undefined}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              language === 'en'
                ? 'text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
            }`}
          >
            EN
          </button>
        </div>

        {/* Dark Mode / Light Mode Switcher */}
        <button
          suppressHydrationWarning
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/80"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Quick Actions Dropdown */}
        <div className="relative">
          <Button
            size={fontStyles.buttonSize}
            variant="primary"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="flex items-center gap-1.5 shadow-sm font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>{t.quickActions}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Button>

          {isQuickActionsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsQuickActionsOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  {t.quickActions}
                </div>
                <Link
                  href="/bookings/new"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="group-hover:text-[var(--primary-color)] transition-colors">{t.newBooking}</span>
                </Link>
                <Link
                  href="/trips/create"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <span>{t.scheduleTrip}</span>
                </Link>
                <Link
                  href="/buses/seat-builder"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Grid3X3 className="w-4 h-4" />
                  </div>
                  <span>{t.seatBuilder}</span>
                </Link>
                <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                <Link
                  href="/day-closing"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <LockKeyhole className="w-4 h-4" />
                  </div>
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
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 text-left"
          >
            <div
              className={cn(
                'rounded-full text-white font-black flex items-center justify-center shadow-xs transition-all',
                fontStyles.avatarSize
              )}
              style={{ backgroundImage: 'var(--primary-gradient)' }}
            >
              {currentUser?.fullName ? currentUser.fullName[0] : 'A'}
            </div>
            <div className="hidden sm:block">
              <div className={cn('font-bold text-slate-900 dark:text-white leading-tight', fontStyles.userNameText)}>
                {currentUser?.fullName || 'Kamrul Hasan (Director)'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant={roleColor}>{currentUser?.role.name || 'SUPER_ADMIN'}</Badge>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {isRoleDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser?.fullName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
                  <p className="text-[10px] text-[var(--primary-color)] font-mono mt-1">
                    Discount Allowance: ৳{currentUser?.discountLimit === 99999 ? 'Unlimited' : currentUser?.discountLimit}
                  </p>
                </div>

                <div className="px-3 py-2">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1 px-1">
                    <RefreshCw className="w-3 h-3" />
                    {t.switchRole}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleSwitchRole('admin@transport.office')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200"
                    >
                      <span>Kamrul Hasan (Director)</span>
                      <Badge variant="purple">Super Admin</Badge>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('manager@transport.office')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200"
                    >
                      <span>Tariqul Islam (Supervisor)</span>
                      <Badge variant="info">Manager</Badge>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('staff@transport.office')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200"
                    >
                      <span>Rahim Chowdhury (Desk)</span>
                      <Badge variant="success">Booking Staff</Badge>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('accountant@transport.office')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200"
                    >
                      <span>Zubair Ahmed (Cashier)</span>
                      <Badge variant="warning">Accountant</Badge>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg font-semibold transition-colors"
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
