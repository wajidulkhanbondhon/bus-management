'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bus,
  CalendarDays,
  Ticket,
  TrendingUp,
  CreditCard,
  FileBarChart,
  Lock,
  Users,
  ShieldAlert,
  Settings,
  PlusCircle,
  Grid3X3,
  BadgePercent,
  Receipt,
  RotateCcw,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  alertBadge?: string;
  highlight?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { t, language } = useApp();

  const navGroups: NavGroup[] = [
    {
      label: language === 'bn' ? 'ড্যাশবোর্ড' : 'OVERVIEW',
      items: [
        { href: '/dashboard', label: language === 'bn' ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      label: language === 'bn' ? 'বাস ও সিট তৈরি' : 'FLEET & SEATING',
      items: [
        { href: '/buses/seat-builder', label: language === 'bn' ? 'কাস্টম সিট বিল্ডার' : 'Custom Seat Builder', icon: Grid3X3, highlight: true },
        { href: '/buses', label: t.allBuses, icon: Bus },
        { href: '/buses/create', label: t.createBus, icon: PlusCircle }
      ]
    },
    {
      label: language === 'bn' ? 'শিডিউল ও ট্রিপ' : 'SCHEDULES & TRIPS',
      items: [
        { href: '/trips', label: t.trips, icon: CalendarDays },
        { href: '/trips/create', label: t.scheduleTrip, icon: PlusCircle }
      ]
    },
    {
      label: language === 'bn' ? 'কাউন্টার ও বুকিং' : 'COUNTER & BOOKING',
      items: [
        { href: '/bookings/new', label: t.newBooking, icon: Sparkles, highlight: true },
        { href: '/bookings', label: t.allBookings, icon: Ticket }
      ]
    },
    {
      label: language === 'bn' ? 'বিক্রি ও ছাড়' : 'REVENUE & DISCOUNTS',
      items: [
        { href: '/sales/today', label: t.todaysSales, icon: TrendingUp },
        { href: '/sales/progressive', label: t.progressiveSales, icon: TrendingUp, badge: 'Live' },
        { href: '/sales/discounts', label: language === 'bn' ? 'ছাড় ও কনসেশন' : 'Discounts Log', icon: BadgePercent }
      ]
    },
    {
      label: language === 'bn' ? 'কালেকশন ও বকেয়া' : 'COLLECTIONS & PAYMENTS',
      items: [
        { href: '/payments', label: t.allPayments, icon: CreditCard },
        { href: '/payments/due', label: t.duePayments, icon: Receipt, alertBadge: language === 'bn' ? 'বকেয়া' : 'Due' },
        { href: '/payments/refunds', label: t.refunds, icon: RotateCcw }
      ]
    },
    {
      label: language === 'bn' ? 'ক্লোজিং ও লেজার' : 'FINANCE & RECONCILIATION',
      items: [
        { href: '/day-closing', label: t.dayClosing, icon: Lock, highlight: true },
        { href: '/reports/financial-ledger', label: t.financialLedger, icon: FileBarChart }
      ]
    },
    {
      label: language === 'bn' ? 'অ্যানালিটিক্স ও রিপোর্ট' : 'ANALYTICS & REPORTS',
      items: [
        { href: '/reports', label: t.reports, icon: FileBarChart }
      ]
    },
    {
      label: language === 'bn' ? 'প্রশাসন ও সিকিউরিটি' : 'GOVERNANCE & ADMIN',
      items: [
        { href: '/staff', label: t.staffRoles, icon: Users },
        { href: '/audit-logs', label: t.auditLogs, icon: ShieldAlert },
        { href: '/settings', label: t.settings, icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 h-screen flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
          A
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            ATOMS
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">v1.0</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-none mt-0.5">
            {language === 'bn' ? 'অ্যাডমিশন বাস ম্যানেজমেন্ট' : 'Admission Transport Office'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {group.label}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/buses' && item.href !== '/trips' && item.href !== '/bookings' && item.href !== '/payments' && item.href !== '/reports');

                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60',
                      item.highlight && !isActive && 'text-blue-400 bg-blue-950/40 hover:bg-blue-900/40'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300">
                        {item.badge}
                      </span>
                    )}
                    {item.alertBadge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300">
                        {item.alertBadge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 text-center">
        <div className="text-[11px] text-slate-400">
          <span>{language === 'bn' ? 'ঢাকা হেডকোয়ার্টার্স কন্ট্রোল' : 'Dhaka HQ Transport Desk'}</span>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {language === 'bn' ? 'লাইভ সিংক চালু আছে' : 'Realtime Sync Active'}
          </div>
        </div>
      </div>
    </aside>
  );
}
