'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  BusFront,
  CalendarRange,
  Ticket,
  CircleDollarSign,
  LineChart,
  Tag,
  WalletCards,
  ReceiptText,
  Undo2,
  LockKeyhole,
  Scale,
  BarChart3,
  Users2,
  Fingerprint,
  SlidersHorizontal,
  PlusCircle,
  Armchair,
  TicketPlus,
  PhoneIncoming,
  Monitor,
  Calculator,
  Truck,
  UserCheck,
  MessageCircle,
  Contact2,
  GraduationCap,
  Smartphone,
  Wallet,
  Sparkles,
  Bot,
  ShieldAlert,
  Activity,
  Zap,
  ShoppingCart,
  Megaphone,
  TicketPercent,
  Palette,
  Star,
  Banknote,
  Bell,
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

interface SidebarProps {
  onNavigate?: () => void;
  userRole?: string;
}

// Define which sidebar groups are visible per role
const ROLE_ACCESS: Record<string, string[]> = {
  admin: ['all'], // Admin sees everything
  manager: ['all'],
  counter_staff: [
    'AI COPILOT & INTELLIGENCE',
    'OVERVIEW',
    'COUNTER & BOOKINGS',
    'REVENUE & DISCOUNTS',
    'COLLECTIONS & PAYMENTS',
  ],
  supervisor: [
    'OVERVIEW',
    'COUNTER & BOOKINGS',
    'SCHEDULES & TRIPS',
    'PORTALS & ADMISSION',
  ],
};

export function Sidebar({ onNavigate, userRole = 'admin' }: SidebarProps = {}) {
  const pathname = usePathname();
  const { t, language, navFontSize, currentColor } = useApp();

  const navGroups: NavGroup[] = [
    {
      label: language === 'bn' ? 'এআই কো-পাইলট ও অ্যানালিটিক্স' : 'AI COPILOT & INTELLIGENCE',
      items: [
        { href: '/ai/office', label: language === 'bn' ? 'অফিস এআই বিজনেস কো-পাইলট' : 'Office AI Copilot', icon: Sparkles, badge: 'AI', highlight: true },
        { href: '/dashboard/ai', label: language === 'bn' ? 'এআই ড্যাশবোর্ড' : 'AI Dashboard', icon: Bot, badge: 'New', highlight: true }
      ]
    },
    {
      label: language === 'bn' ? 'ড্যাশবোর্ড' : 'OVERVIEW',
      items: [
        { href: '/dashboard', label: language === 'bn' ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview', icon: LayoutGrid },
        { href: '/dashboard/landing-control', label: language === 'bn' ? 'ল্যান্ডিং পেজ কন্ট্রোল' : 'Landing Page Control', icon: Monitor }
      ]
    },
    {
      label: language === 'bn' ? 'কাউন্টার ও প্রি-বুকিং' : 'COUNTER & BOOKINGS',
      items: [
        { href: '/bookings/new', label: t.newBooking, icon: TicketPlus, highlight: true },
        { href: '/dashboard/booking-approvals', label: language === 'bn' ? 'অনলাইন প্রি-বুকিং ভেরিফিকেশন' : 'Online Pre-Bookings', icon: PhoneIncoming, badge: 'Live' },
        { href: '/bookings', label: t.allBookings, icon: Ticket }
      ]
    },
    {
      label: language === 'bn' ? 'শিডিউল ও ট্রিপ' : 'SCHEDULES & TRIPS',
      items: [
        { href: '/trips', label: t.trips, icon: CalendarRange },
        { href: '/trips/create', label: t.scheduleTrip, icon: PlusCircle }
      ]
    },
    {
      label: language === 'bn' ? 'বিক্রি ও ছাড়' : 'REVENUE & DISCOUNTS',
      items: [
        { href: '/sales/today', label: t.todaysSales, icon: CircleDollarSign },
        { href: '/sales/progressive', label: t.progressiveSales, icon: LineChart, badge: 'Live' },
        { href: '/sales/discounts', label: language === 'bn' ? 'ছাড় ও কনসেশন' : 'Discounts Log', icon: Tag }
      ]
    },
    {
      label: language === 'bn' ? 'কালেকশন ও বকেয়া' : 'COLLECTIONS & PAYMENTS',
      items: [
        { href: '/payments', label: t.allPayments, icon: WalletCards },
        { href: '/payments/due', label: t.duePayments, icon: ReceiptText, alertBadge: language === 'bn' ? 'বকেয়া' : 'Due' },
        { href: '/payments/refunds', label: t.refunds, icon: Undo2 }
      ]
    },
    {
      label: language === 'bn' ? 'ক্লোজিং ও লেজার' : 'FINANCE & RECONCILIATION',
      items: [
        { href: '/day-closing', label: t.dayClosing, icon: LockKeyhole, highlight: true },
        { href: '/dashboard/cash-calculator', label: language === 'bn' ? 'ক্যাশ ক্যালকুলেটর' : 'Cash Calculator', icon: Calculator, highlight: true },
        { href: '/reports/financial-ledger', label: t.financialLedger, icon: Scale }
      ]
    },
    {
      label: language === 'bn' ? 'বাস ও সিট তৈরি' : 'FLEET & SEAT BUILDER',
      items: [
        { href: '/buses/seat-builder', label: language === 'bn' ? 'কাস্টম সিট বিল্ডার' : 'Custom Seat Builder', icon: Armchair, highlight: true },
        { href: '/buses', label: t.allBuses, icon: BusFront },
        { href: '/buses/create', label: t.createBus, icon: PlusCircle }
      ]
    },
    {
      label: language === 'bn' ? 'অ্যানালিটিক্স ও রিপোর্ট' : 'ANALYTICS & REPORTS',
      items: [
        { href: '/admin/dashboard', label: language === 'bn' ? 'রিয়েল-টাইম ড্যাশবোর্ড' : 'Real-time Dashboard', icon: Activity, badge: 'Live', highlight: true },
        { href: '/reports', label: t.reports, icon: BarChart3 }
      ]
    },
    {
      label: language === 'bn' ? 'মার্কেটিং ও গ্রোথ' : 'MARKETING & GROWTH',
      items: [
        { href: '/marketing/coupons', label: language === 'bn' ? 'মার্কেটিং কুপন' : 'Discount Coupons', icon: TicketPercent },
        { href: '/marketing/loyalty', label: language === 'bn' ? 'লয়্যালটি ও পয়েন্ট' : 'Loyalty Program', icon: Sparkles, badge: 'New' },
        { href: '/marketing/flash-sales', label: language === 'bn' ? 'ফ্ল্যাশ সেল ও প্রাইসিং' : 'Flash Sales', icon: Zap },
        { href: '/marketing/referrals', label: language === 'bn' ? 'রেফারেল প্রোগ্রাম' : 'Referral Program', icon: Megaphone },
        { href: '/marketing/abandoned-cart', label: language === 'bn' ? 'অ্যাবানডনড কার্ট' : 'Abandoned Cart', icon: ShoppingCart },
        { href: '/marketing/social-proof', label: language === 'bn' ? 'সোশ্যাল প্রুফ (FOMO)' : 'Social Proof', icon: MessageCircle },
      ]
    },
    {
      label: language === 'bn' ? 'সুপারভাইজার ও পোর্টাল' : 'PORTALS & ADMISSION',
      items: [
        { href: '/supervisor', label: language === 'bn' ? 'সুপারভাইজার পোর্টাল' : 'Supervisor Portal', icon: UserCheck },
        { href: '/universities/manage', label: language === 'bn' ? 'বিশ্ববিদ্যালয় সার্কুলার' : 'University Circulars', icon: GraduationCap },
        { href: '/dashboard/landing-control', label: language === 'bn' ? 'ল্যান্ডিং কন্ট্রোল' : 'Landing Control', icon: Palette }
      ]
    },
    {
      label: language === 'bn' ? 'প্রশাসন ও সিকিউরিটি' : 'GOVERNANCE & ADMIN',
      items: [
        { href: '/staff', label: t.staffRoles, icon: Users2 },
        { href: '/staff/payroll', label: language === 'bn' ? 'স্টাফ পে-রোল' : 'Staff Payroll', icon: Banknote },
        { href: '/settings/notifications', label: language === 'bn' ? 'SMS নোটিফিকেশন' : 'SMS Notifications', icon: Bell, badge: 'New' },
        { href: '/reviews', label: language === 'bn' ? 'রিভিউ ও রেটিং' : 'Reviews & Ratings', icon: Star },
        { href: '/audit-logs', label: t.auditLogs, icon: Fingerprint },
        { href: '/settings/security', label: language === 'bn' ? 'অ্যাকাউন্ট সিকিউরিটি (2FA)' : 'Security & 2FA', icon: ShieldAlert },
        { href: '/settings', label: t.settings, icon: SlidersHorizontal }
      ]
    },
    {
      label: language === 'bn' ? 'সাইবার সিকিউরিটি' : 'CYBER SECURITY',
      items: [
        { href: '/dashboard/security', label: language === 'bn' ? 'ফায়ারওয়াল ও থ্রেট' : 'Firewall & Threats', icon: ShieldAlert, alertBadge: 'New', highlight: true }
      ]
    }
  ];


  // Dynamic Font Size & Spacing Styles based on navFontSize
  const fontStyles = {
    sm: {
      sidebarWidth: 'w-60',
      itemText: 'text-[11px] py-1.5 px-2.5',
      groupLabel: 'text-[9px]',
      iconSize: 'w-3.5 h-3.5',
      iconBox: 'w-6 h-6',
      brandText: 'text-xs',
      subText: 'text-[10px]'
    },
    base: {
      sidebarWidth: 'w-64',
      itemText: 'text-xs py-2 px-3',
      groupLabel: 'text-[10px]',
      iconSize: 'w-4 h-4',
      iconBox: 'w-7 h-7',
      brandText: 'text-sm',
      subText: 'text-[11px]'
    },
    lg: {
      sidebarWidth: 'w-72',
      itemText: 'text-sm py-2.5 px-3.5 font-medium',
      groupLabel: 'text-xs',
      iconSize: 'w-4.5 h-4.5',
      iconBox: 'w-8 h-8',
      brandText: 'text-base',
      subText: 'text-xs'
    },
    xl: {
      sidebarWidth: 'w-80',
      itemText: 'text-base py-3 px-4 font-semibold',
      groupLabel: 'text-sm font-bold',
      iconSize: 'w-5 h-5',
      iconBox: 'w-9 h-9',
      brandText: 'text-lg',
      subText: 'text-sm'
    }
  }[navFontSize || 'base'];

  return (
    <aside
      suppressHydrationWarning
      className={cn(
        'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 h-screen flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 select-none transition-all duration-200 shadow-2xs',
        fontStyles.sidebarWidth
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 transition-colors">
        <div className={cn(
          'w-9 h-9 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white font-black text-lg shadow-md transition-all',
          currentColor?.gradientClass || 'from-blue-600 to-indigo-600'
        )}>
          A
        </div>
        <div>
          <div className={cn('font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5', fontStyles.brandText)}>
            ATOMS
            <span
              suppressHydrationWarning
              className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold transition-colors"
              style={{ backgroundColor: `${currentColor?.primaryHex}20`, color: currentColor?.primaryHex }}
            >
              v1.0
            </span>
          </div>
          <p className={cn('text-slate-500 dark:text-slate-400 leading-none mt-0.5', fontStyles.subText)}>
            {language === 'bn' ? 'অ্যাডমিশন বাস ম্যানেজমেন্ট' : 'Admission Transport Office'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {navGroups
          .filter((group) => {
            const allowed = ROLE_ACCESS[userRole] || ROLE_ACCESS['admin'];
            if (allowed.includes('all')) return true;
            // Match English label (the key used in ROLE_ACCESS)
            const englishLabel = group.label.toUpperCase();
            return allowed.some(a => englishLabel.includes(a));
          })
          .map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h4 className={cn('px-3 font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono', fontStyles.groupLabel)}>
              {group.label}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isExactRoot = [
                  '/dashboard',
                  '/buses',
                  '/trips',
                  '/bookings',
                  '/payments',
                  '/reports',
                  '/staff',
                  '/universities',
                  '/settings',
                  '/passenger'
                ].includes(item.href);

                const isActive = isExactRoot
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    onClick={onNavigate}
                    suppressHydrationWarning
                    style={isActive ? { backgroundColor: currentColor?.primaryHex } : undefined}
                    className={cn(
                      'flex items-center justify-between rounded-xl font-medium transition-all group',
                      fontStyles.itemText,
                      isActive
                        ? 'text-white font-semibold shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/70',
                      item.highlight && !isActive && `${currentColor?.bgClass} hover:opacity-90`
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'rounded-lg flex items-center justify-center transition-all',
                        fontStyles.iconBox,
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800/80 group-hover:scale-105 text-slate-500 dark:text-slate-400'
                      )}>
                        <Icon className={fontStyles.iconSize} strokeWidth={isActive ? 2.2 : 1.8} />
                      </div>
                      <span suppressHydrationWarning style={item.highlight && !isActive ? { color: currentColor?.primaryHex } : undefined}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                        {item.badge}
                      </span>
                    )}
                    {item.alertBadge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300">
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-center transition-colors">
        <div className={cn('text-slate-500 dark:text-slate-400', fontStyles.subText)}>
          <span>{language === 'bn' ? 'ঢাকা হেডকোয়ার্টার্স কন্ট্রোল' : 'Dhaka HQ Transport Desk'}</span>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center justify-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            {language === 'bn' ? 'লাইভ সিংক চালু আছে' : 'Realtime Sync Active'}
          </div>
        </div>
      </div>
    </aside>
  );
}
