'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
  MessageCircle,
  GraduationCap,
  Sparkles,
  Bot,
  ShieldAlert,
  Activity,
  Zap,
  ShoppingCart,
  Megaphone,
  TicketPercent,
  Star,
  Banknote,
  Bell,
  Package,
  BellRing,
  Handshake,
  Plug,
  ChevronDown,
  Search,
  X,
  CreditCard,
  ShieldCheck,
  Settings,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface SubItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  alertBadge?: string;
  highlight?: boolean;
}

interface MainSection {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  colorClass: string;
  items: SubItem[];
}

interface SidebarProps {
  onNavigate?: () => void;
  userRole?: string;
}

// Role-based main section access
const ROLE_ACCESS: Record<string, string[]> = {
  admin: ['all'],
  manager: ['all'],
  counter_staff: ['dashboard', 'bookings', 'trips', 'sales', 'payments'],
  supervisor: ['dashboard', 'bookings', 'trips', 'buses'],
};

export function Sidebar({ onNavigate, userRole = 'admin' }: SidebarProps = {}) {
  const pathname = usePathname();
  const { t, language, navFontSize, currentColor, sidebarAccordionMode } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Single-Word Pure Main Sections with full icons on all sub-items
  const mainSections: MainSection[] = useMemo(() => [
    {
      id: 'ai',
      title: language === 'bn' ? 'এআই' : 'AI',
      subtitle: language === 'bn' ? 'ইন্টেলিজেন্স কো-পাইলট' : 'Smart Intelligence',
      icon: Sparkles,
      colorClass: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
      items: [
        { href: '/ai/office', label: language === 'bn' ? 'অফিস এআই বিজনেস কো-পাইলট' : 'Office AI Copilot', icon: Sparkles, badge: 'AI', highlight: true },
        { href: '/dashboard/ai', label: language === 'bn' ? 'এআই অ্যানালিটিক্স ড্যাশবোর্ড' : 'AI Analytics', icon: Bot, badge: 'New', highlight: true }
      ]
    },
    {
      id: 'dashboard',
      title: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard',
      subtitle: language === 'bn' ? 'ওভারভিউ কন্ট্রোল' : 'Overview & Control',
      icon: LayoutGrid,
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      items: [
        { href: '/dashboard', label: language === 'bn' ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview', icon: LayoutGrid },
        { href: '/admin/dashboard', label: language === 'bn' ? 'রিয়েল-টাইম ড্যাশবোর্ড' : 'Real-time Dashboard', icon: Activity, badge: 'Live', highlight: true },
        { href: '/dashboard/landing-control', label: language === 'bn' ? 'ল্যান্ডিং পেজ কন্ট্রোল' : 'Landing Control', icon: Monitor }
      ]
    },
    {
      id: 'bookings',
      title: language === 'bn' ? 'বুকিং' : 'Bookings',
      subtitle: language === 'bn' ? 'কাউন্টার টিকিট' : 'Counter & Online',
      icon: Ticket,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      items: [
        { href: '/bookings/new', label: t.newBooking, icon: TicketPlus, highlight: true },
        { href: '/dashboard/booking-approvals', label: language === 'bn' ? 'অনলাইন প্রি-বুকিং ভেরিফিকেশন' : 'Online Pre-Bookings', icon: PhoneIncoming, badge: 'Live' },
        { href: '/bookings', label: t.allBookings, icon: Ticket }
      ]
    },
    {
      id: 'trips',
      title: language === 'bn' ? 'ট্রিপস' : 'Trips',
      subtitle: language === 'bn' ? 'রুট শিডিউল' : 'Routes & Schedule',
      icon: CalendarRange,
      colorClass: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      items: [
        { href: '/trips/create', label: t.scheduleTrip, icon: PlusCircle, highlight: true },
        { href: '/trips', label: t.trips, icon: CalendarRange }
      ]
    },
    {
      id: 'buses',
      title: language === 'bn' ? 'বাস' : 'Buses',
      subtitle: language === 'bn' ? 'ফ্লিট কন্ট্রোল' : 'Fleet & Seats',
      icon: BusFront,
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      items: [
        { href: '/buses/seat-builder', label: language === 'bn' ? 'কাস্টম সিট বিল্ডার' : 'Custom Seat Builder', icon: Armchair, highlight: true },
        { href: '/buses', label: t.allBuses, icon: BusFront },
        { href: '/buses/create', label: t.createBus, icon: PlusCircle },
        { href: '/supervisor', label: language === 'bn' ? 'সুপারভাইজার পোর্টাল' : 'Supervisor Portal', icon: UserCheck },
        { href: '/universities/manage', label: language === 'bn' ? 'বিশ্ববিদ্যালয় সার্কুলার' : 'University Circulars', icon: GraduationCap }
      ]
    },
    {
      id: 'sales',
      title: language === 'bn' ? 'সেলস' : 'Sales',
      subtitle: language === 'bn' ? 'বিক্রি ট্র্যাকিং' : 'Daily Revenue',
      icon: CircleDollarSign,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      items: [
        { href: '/sales/today', label: t.todaysSales, icon: CircleDollarSign },
        { href: '/sales/progressive', label: t.progressiveSales, icon: LineChart, badge: 'Live' },
        { href: '/sales/discounts', label: language === 'bn' ? 'ছাড় ও কনসেশন' : 'Discounts Log', icon: Tag }
      ]
    },
    {
      id: 'payments',
      title: language === 'bn' ? 'পেমেন্টস' : 'Payments',
      subtitle: language === 'bn' ? 'কালেকশন বকেয়া' : 'Collections & Dues',
      icon: CreditCard,
      colorClass: 'text-teal-600 dark:text-teal-400 bg-teal-600/10 border-teal-600/20',
      items: [
        { href: '/payments', label: t.allPayments, icon: WalletCards },
        { href: '/payments/due', label: t.duePayments, icon: ReceiptText, alertBadge: language === 'bn' ? 'বকেয়া' : 'Due' },
        { href: '/payments/refunds', label: t.refunds, icon: Undo2 }
      ]
    },
    {
      id: 'accounts',
      title: language === 'bn' ? 'অ্যাকাউন্টস' : 'Accounts',
      subtitle: language === 'bn' ? 'ক্যাশ লেজার' : 'Ledger & Closing',
      icon: Scale,
      colorClass: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
      items: [
        { href: '/dashboard/cash-calculator', label: language === 'bn' ? 'ক্যাশ ক্যালকুলেটর' : 'Cash Calculator', icon: Calculator, highlight: true },
        { href: '/day-closing', label: t.dayClosing, icon: LockKeyhole, highlight: true },
        { href: '/reports/financial-ledger', label: t.financialLedger, icon: Scale }
      ]
    },
    {
      id: 'marketing',
      title: language === 'bn' ? 'মার্কেটিং' : 'Marketing',
      subtitle: language === 'bn' ? 'ক্যাম্পেইন প্রমোশন' : 'Growth & Campaigns',
      icon: Megaphone,
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      items: [
        { href: '/marketing/campaigns', label: language === 'bn' ? 'ক্যাম্পেইন (SMS/Email)' : 'Campaigns', icon: Megaphone, badge: 'New', highlight: true },
        { href: '/marketing/ambassadors', label: language === 'bn' ? 'অ্যাম্বাসেডর প্রোগ্রাম' : 'Ambassadors', icon: GraduationCap, badge: 'Hot' },
        { href: '/marketing/bundle-offers', label: language === 'bn' ? 'কম্বো ও গ্রুপ অফার' : 'Bundle Offers', icon: Package },
        { href: '/marketing/push-notifications', label: language === 'bn' ? 'ওয়েব পুশ অ্যালার্ট' : 'Push Alerts', icon: BellRing },
        { href: '/marketing/crm', label: language === 'bn' ? 'কাস্টমার সিআরএম' : 'Customer CRM', icon: Users2 },
        { href: '/marketing/partnerships', label: language === 'bn' ? 'বিটুবি পার্টনারশিপ' : 'B2B Partners', icon: Handshake },
        { href: '/marketing/coupons', label: language === 'bn' ? 'মার্কেটিং কুপন' : 'Discount Coupons', icon: TicketPercent },
        { href: '/marketing/loyalty', label: language === 'bn' ? 'লয়্যালটি ও পয়েন্ট' : 'Loyalty Program', icon: Sparkles },
        { href: '/marketing/flash-sales', label: language === 'bn' ? 'ফ্ল্যাশ সেল ও প্রাইসিং' : 'Flash Sales', icon: Zap },
        { href: '/marketing/referrals', label: language === 'bn' ? 'রেফারেল প্রোগ্রাম' : 'Referral Program', icon: Users2 },
        { href: '/marketing/abandoned-cart', label: language === 'bn' ? 'অ্যাবানডনড কার্ট' : 'Abandoned Cart', icon: ShoppingCart },
        { href: '/marketing/social-proof', label: language === 'bn' ? 'সোশ্যাল প্রুফ (FOMO)' : 'Social Proof', icon: MessageCircle },
        { href: '/settings/integrations', label: language === 'bn' ? 'মার্কেটিং ইন্টিগ্রেশনস' : 'Marketing Integrations', icon: Plug, badge: 'New', highlight: true },
      ]
    },
    {
      id: 'staff',
      title: language === 'bn' ? 'স্টাফ' : 'Staff',
      subtitle: language === 'bn' ? 'টিম রোলস' : 'Roles & Payroll',
      icon: Users2,
      colorClass: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
      items: [
        { href: '/reports', label: t.reports, icon: BarChart3 },
        { href: '/staff', label: t.staffRoles, icon: Users2 },
        { href: '/staff/payroll', label: language === 'bn' ? 'স্টাফ পে-রোল' : 'Staff Payroll', icon: Banknote },
        { href: '/reviews', label: language === 'bn' ? 'রিভিউ ও রেটিং' : 'Reviews & Ratings', icon: Star },
        { href: '/audit-logs', label: t.auditLogs, icon: Fingerprint }
      ]
    },
    {
      id: 'security',
      title: language === 'bn' ? 'সিকিউরিটি' : 'Security',
      subtitle: language === 'bn' ? 'সুরক্ষাব্যবস্থা' : '2FA & Firewall',
      icon: ShieldCheck,
      colorClass: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
      items: [
        { href: '/settings/security', label: language === 'bn' ? 'সিকিউরিটি (2FA)' : 'Security & 2FA', icon: ShieldAlert },
        { href: '/dashboard/security', label: language === 'bn' ? 'ফায়ারওয়াল ও থ্রেট' : 'Firewall & Threats', icon: ShieldAlert, alertBadge: 'New' }
      ]
    },
    {
      id: 'settings',
      title: language === 'bn' ? 'সেটিংস' : 'Settings',
      subtitle: language === 'bn' ? 'সিস্টেম কনফিগ' : 'System Configuration',
      icon: Settings,
      colorClass: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
      items: [
        { href: '/settings/notifications', label: language === 'bn' ? 'SMS নোটিফিকেশন' : 'SMS Notifications', icon: Bell, badge: 'New' },
        { href: '/settings', label: t.settings, icon: SlidersHorizontal }
      ]
    }
  ], [language, t]);

  // Active check helper
  const isItemActive = (href: string) => {
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
    ].includes(href);

    return isExactRoot
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  };

  // Auto-expand section containing current route
  useEffect(() => {
    mainSections.forEach(section => {
      const hasActive = section.items.some(item => isItemActive(item.href));
      if (hasActive) {
        setOpenSections(prev => {
          if (sidebarAccordionMode === 'single') {
            return { [section.id]: true };
          }
          return { ...prev, [section.id]: true };
        });
      }
    });
  }, [pathname, mainSections, sidebarAccordionMode]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const isCurrentlyOpen = !!prev[id];
      if (sidebarAccordionMode === 'single') {
        return isCurrentlyOpen ? {} : { [id]: true };
      }
      return {
        ...prev,
        [id]: !isCurrentlyOpen
      };
    });
  };

  // Search Filtering
  const filteredSections = useMemo(() => {
    const allowed = ROLE_ACCESS[userRole] || ROLE_ACCESS['admin'];
    const accessible = allowed.includes('all')
      ? mainSections
      : mainSections.filter(s => allowed.includes(s.id));

    if (!searchQuery.trim()) return accessible;

    const query = searchQuery.toLowerCase();
    return accessible
      .map(section => {
        const matchesSection = section.title.toLowerCase().includes(query) || section.subtitle.toLowerCase().includes(query);
        const matchingItems = section.items.filter(item => item.label.toLowerCase().includes(query) || item.href.toLowerCase().includes(query));
        
        if (matchesSection) return section;
        if (matchingItems.length > 0) return { ...section, items: matchingItems };
        return null;
      })
      .filter((s): s is MainSection => s !== null);
  }, [mainSections, userRole, searchQuery]);

  // Typography scale
  const fontStyles = {
    sm: {
      sidebarWidth: 'w-64',
      sectionTitle: 'text-xs font-bold',
      sectionSubtitle: 'text-[9.5px]',
      itemText: 'text-[11px] py-1.5 px-2',
      subIconSize: 'w-3.5 h-3.5',
      mainIconSize: 'w-3.5 h-3.5',
      mainIconBox: 'w-7 h-7',
      brandText: 'text-xs',
      subText: 'text-[10px]'
    },
    base: {
      sidebarWidth: 'w-72',
      sectionTitle: 'text-[13px] font-bold',
      sectionSubtitle: 'text-[10px]',
      itemText: 'text-[11.5px] py-1.5 px-2.5',
      subIconSize: 'w-3.5 h-3.5',
      mainIconSize: 'w-4 h-4',
      mainIconBox: 'w-7.5 h-7.5',
      brandText: 'text-sm',
      subText: 'text-[11px]'
    },
    lg: {
      sidebarWidth: 'w-80',
      sectionTitle: 'text-sm font-bold',
      sectionSubtitle: 'text-xs',
      itemText: 'text-xs py-2 px-3',
      subIconSize: 'w-4 h-4',
      mainIconSize: 'w-4.5 h-4.5',
      mainIconBox: 'w-8.5 h-8.5',
      brandText: 'text-base',
      subText: 'text-xs'
    },
    xl: {
      sidebarWidth: 'w-88',
      sectionTitle: 'text-base font-extrabold',
      sectionSubtitle: 'text-sm',
      itemText: 'text-sm py-2.5 px-3.5 font-medium',
      subIconSize: 'w-4.5 h-4.5',
      mainIconSize: 'w-5 h-5',
      mainIconBox: 'w-9.5 h-9.5',
      brandText: 'text-lg',
      subText: 'text-sm'
    }
  }[navFontSize || 'base'];

  return (
    <aside
      suppressHydrationWarning
      className={cn(
        'bg-slate-50/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 h-screen flex flex-col shrink-0 border-r border-slate-200/80 dark:border-slate-800/90 select-none transition-all duration-200 shadow-sm backdrop-blur-xl',
        fontStyles.sidebarWidth
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white font-black text-lg shadow-md transition-all shadow-indigo-500/20',
            currentColor?.gradientClass || 'from-indigo-600 to-blue-600'
          )}>
            A
          </div>
          <div>
            <div className={cn('font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5', fontStyles.brandText)}>
              ATOMS
              <span
                suppressHydrationWarning
                className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-extrabold transition-colors shadow-2xs border border-indigo-500/10"
                style={{ backgroundColor: `${currentColor?.primaryHex}15`, color: currentColor?.primaryHex }}
              >
                v2.0 PRO
              </span>
            </div>
            <p className={cn('text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5', fontStyles.subText)}>
              {language === 'bn' ? 'অ্যাডমিশন বাস ম্যানেজমেন্ট' : 'Admission Transport Desk'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="px-3 pt-3 pb-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'মেনু খুঁজুন...' : 'Search menu...'}
            className="w-full pl-8.5 pr-7 py-1.5 text-xs bg-white dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modern Hierarchical Navigation: Clear Parent-Child Tree Structure with Sub-item Icons */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-1 scrollbar-thin">
        {filteredSections.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            {language === 'bn' ? 'কোনো মেনু পাওয়া যায়নি' : 'No menu item found'}
          </div>
        ) : (
          filteredSections.map((section) => {
            const SectionIcon = section.icon;
            const isOpen = searchQuery.trim() !== '' ? true : !!openSections[section.id];
            const hasActiveChild = section.items.some(item => isItemActive(item.href));

            return (
              <div
                key={section.id}
                className={cn(
                  'rounded-xl transition-all duration-200',
                  isOpen
                    ? 'bg-white/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs'
                    : hasActiveChild
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40'
                      : 'bg-transparent border border-transparent hover:bg-white/60 dark:hover:bg-slate-800/40'
                )}
              >
                {/* 1. Parent/Main Header: Bold & Distinct Top-Level Section */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-2 flex items-center justify-between text-left rounded-xl transition-all duration-150 active:scale-[0.99] cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Parent Distinct Icon Box */}
                    <div className={cn(
                      'rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 border shrink-0',
                      fontStyles.mainIconBox,
                      section.colorClass
                    )}>
                      <SectionIcon className={fontStyles.mainIconSize} />
                    </div>

                    <div className="min-w-0">
                      <h3 className={cn(
                        'text-slate-900 dark:text-white leading-tight truncate flex items-center gap-1.5 font-bold',
                        fontStyles.sectionTitle,
                        hasActiveChild && 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                      )}>
                        {section.title}
                        {hasActiveChild && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        )}
                      </h3>
                      <p className={cn('text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5 font-medium', fontStyles.sectionSubtitle)}>
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <span className={cn(
                      'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md transition-all duration-200',
                      isOpen
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    )}>
                      {section.items.length}
                    </span>
                    <div className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center transition-colors',
                      isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    )}>
                      <ChevronDown className={cn(
                        'w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                        isOpen ? 'rotate-180' : 'rotate-0'
                      )} />
                    </div>
                  </div>
                </button>

                {/* 2. Sub-segments: Indented Tree Rail with Sub-Item Icons */}
                <div
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  )}
                >
                  <div className="overflow-hidden">
                    {/* Tree Rail with Indentation */}
                    <div className="ml-5.5 mr-2 mb-2 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-0.5 pt-1">
                      {section.items.map((item, iIdx) => {
                        const Icon = item.icon;
                        const isActive = isItemActive(item.href);

                        return (
                          <Link
                            key={iIdx}
                            href={item.href}
                            onClick={onNavigate}
                            suppressHydrationWarning
                            style={isActive ? { backgroundColor: currentColor?.primaryHex } : undefined}
                            className={cn(
                              'flex items-center justify-between rounded-lg font-medium transition-all duration-150 relative group/sub',
                              fontStyles.itemText,
                              isActive
                                ? 'text-white font-bold shadow-xs shadow-indigo-500/20 translate-x-0.5'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:translate-x-1',
                              item.highlight && !isActive && `${currentColor?.bgClass} hover:opacity-90`
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Sub-item Icon (Clean inline without bulky box) */}
                              <Icon
                                className={cn(
                                  fontStyles.subIconSize,
                                  'shrink-0 transition-colors',
                                  isActive
                                    ? 'text-white'
                                    : 'text-slate-400 dark:text-slate-500 group-hover/sub:text-indigo-600 dark:group-hover/sub:text-indigo-400'
                                )}
                                strokeWidth={isActive ? 2.3 : 1.8}
                              />

                              {/* Sub-item Label */}
                              <span
                                className="truncate tracking-tight"
                                suppressHydrationWarning
                                style={item.highlight && !isActive ? { color: currentColor?.primaryHex } : undefined}
                              >
                                {item.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              {item.badge && (
                                <span className={cn(
                                  'text-[8px] font-extrabold px-1.5 py-0.2 rounded-full tracking-wide uppercase',
                                  isActive 
                                    ? 'bg-white/25 text-white' 
                                    : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                )}>
                                  {item.badge}
                                </span>
                              )}
                              {item.alertBadge && (
                                <span className={cn(
                                  'text-[8px] font-extrabold px-1.5 py-0.2 rounded-full tracking-wide uppercase',
                                  isActive 
                                    ? 'bg-white/25 text-white' 
                                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                )}>
                                  {item.alertBadge}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer System Status */}
      <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/50 text-center transition-colors">
        <div className={cn('text-slate-500 dark:text-slate-400', fontStyles.subText)}>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{language === 'bn' ? 'হেডকোয়ার্টার্স কন্ট্রোল' : 'HQ Control Desk'}</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
