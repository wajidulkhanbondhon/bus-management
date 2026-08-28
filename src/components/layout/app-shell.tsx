'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Bus, PhoneCall, LayoutDashboard, Clock, Menu, X, Sun, Moon, Globe, Palette, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, colorThemesList, ColorTheme } from '@/lib/context';
import { cn } from '@/lib/utils';
import { AIFloatingTrigger } from '@/components/ai/ai-floating-trigger';

interface AppShellProps {
  children: React.ReactNode;
  currentUser: any;
}

export function AppShell({ children, currentUser }: AppShellProps) {
  const pathname = usePathname();
  const { contentFontSize, theme, setTheme, language, setLanguage, colorTheme, setColorTheme, t } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);

  const contentFontClass = {
    sm: 'text-xs [&_table]:text-[11px] [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-sm',
    base: 'text-sm [&_table]:text-xs [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-base',
    lg: 'text-base [&_table]:text-sm [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-lg',
    xl: 'text-lg [&_table]:text-base [&_h1]:text-4xl [&_h2]:text-3xl [&_h3]:text-xl'
  }[contentFontSize || 'base'];

  const isPublicPage = pathname === '/' || pathname.startsWith('/track') || pathname === '/login' || pathname.startsWith('/universities') || pathname.startsWith('/supervisor') || pathname.startsWith('/passenger') || pathname.startsWith('/book');

  if (pathname === '/login' || pathname === '/supervisor/login') {
    return <>{children}</>;
  }

  if (isPublicPage) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-600 selection:text-white">
        {/* Streamlined Public Passenger Header */}
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-md transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-black text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  ATOMS <span className="text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 font-semibold">Transit</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'bn' ? 'বিশ্ববিদ্যালয় ভর্তি এক্সপ্রেস বাস' : 'Admission Express Bus'}
                </p>
              </div>
            </Link>

            {/* Middle Quick Links - Clean & Minimal */}
            <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Link href="/#trips" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {language === 'bn' ? 'বাস ও সিট' : 'Buses & Seats'}
              </Link>
              <Link href="/universities" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <span className="text-xs">🎓</span>
                {language === 'bn' ? 'বিশ্ববিদ্যালয় ভর্তি তথ্য' : 'Admission Circulars'}
              </Link>
              <Link href="/track" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                {language === 'bn' ? 'বুকিং ট্র্যাকার' : 'Booking Tracker'}
              </Link>
            </div>

            {/* Right: Theme, Language, WhatsApp & Dedicated Passenger Portal Auth Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Official WhatsApp Quick Link */}
              <a
                href="https://wa.me/8801711000001"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp Support"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4 text-[#25D366] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>WhatsApp</span>
              </a>

              {/* Theme Toggle (Light / Dark) */}
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'লাইট মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
                aria-label="Toggle Theme"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
                aria-label="Switch Language"
                className="h-9 px-2.5 rounded-xl flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{language === 'bn' ? 'EN' : 'বাং'}</span>
              </button>

              {/* Passenger Portal Auth Status Indicator */}
              <PassengerHeaderAuthButton language={language} />
            </div>
          </div>
        </header>

        {/* Public Main Body */}
        <main className="flex-1" suppressHydrationWarning>
          {children}
        </main>

        {/* Public Passenger Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs py-8 px-4 transition-colors duration-200" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="text-center space-y-1.5">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-300">
                ATOMS Admission Express & Student Transit
              </p>
              <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
                {language === 'bn'
                  ? 'ঢাকা ও অন্যান্য বিভাগীয় শহর থেকে বাংলাদেশের সকল বিশ্ববিদ্যালয় ক্যাম্পাসমুখী নিরাপদ শিক্ষার্থী বাস সার্ভিস।'
                  : 'Safe, direct and scheduled student admission express transit from Dhaka to all universities across Bangladesh.'}
              </p>
            </div>

            {/* Discreet Staff Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-900">
              <Link href="/passenger" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {language === 'bn' ? 'শিক্ষার্থী টিকিট পোর্টাল' : 'Passenger Portal'}
              </Link>
              <span>•</span>
              <Link href="/track" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {language === 'bn' ? 'বুকিং যাচাই' : 'Track Booking'}
              </Link>
              <span>•</span>
              <Link href="/login" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                {language === 'bn' ? 'অফিস স্টাফ লগইন' : 'Staff Login'}
              </Link>
              <span>•</span>
              <Link href="/supervisor/login" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                {language === 'bn' ? 'সুপারভাইজার লগইন' : 'Supervisor Login'}
              </Link>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center" suppressHydrationWarning>
              © {new Date().getFullYear()} ATOMS Transport Management. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Global Floating AI Trigger visible on all public & student views */}
        <AIFloatingTrigger />
      </div>
    );
  }

  // Internal ERP Layout for staff
  return (
    <div suppressHydrationWarning className="flex w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <>
          {/* Dark backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Slide-in sidebar panel */}
          <div className={cn(
            'fixed inset-y-0 left-0 z-50 md:hidden',
            'transform transition-transform duration-300 ease-out',
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}>
            <div className="relative h-full">
              {/* Close button */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="সাইডবার বন্ধ করুন"
                className="absolute top-4 right-[-44px] z-50 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        </>
      )}

      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen" suppressHydrationWarning>
        <Header
          currentUser={currentUser}
          onMobileMenuToggle={() => setMobileSidebarOpen(prev => !prev)}
        />
        <main
          suppressHydrationWarning
          className={cn(
            'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8',
            'bg-slate-100/60 dark:bg-slate-950/60',
            'transition-all duration-150',
            contentFontClass
          )}
        >
          {children}
        </main>
      </div>

      {/* Global Floating AI Trigger & Dialog Widget */}
      <AIFloatingTrigger />
    </div>
  );
}

// Client-side Passenger Auth Status Indicator in Public Header
function PassengerHeaderAuthButton({ language }: { language: string }) {
  const [session, setSession] = React.useState<{ phone: string; name: string } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const updateSession = () => {
      if (typeof window !== 'undefined') {
        const phone = localStorage.getItem('atoms_passenger_phone');
        const pin = localStorage.getItem('atoms_passenger_pin');
        if (phone && pin && pin.length === 4) {
          // Look up name if present in directory
          try {
            const rawHistory = localStorage.getItem('atoms_passenger_history');
            const history = rawHistory ? JSON.parse(rawHistory) : [];
            const found = history.find((p: any) => p.phone === phone);
            setSession({ phone, name: found?.name || phone });
          } catch {
            setSession({ phone, name: phone });
          }
        } else {
          setSession(null);
        }
      }
    };
    updateSession();
    window.addEventListener('storage', updateSession);
    return () => window.removeEventListener('storage', updateSession);
  }, []);

  if (!mounted) {
    return (
      <Link href="/passenger">
        <Button variant="primary" size="sm" className="text-xs bg-blue-600 text-white font-bold px-3.5">
          <span>{language === 'bn' ? 'লগইন / টিকিট' : 'Login / Tickets'}</span>
        </Button>
      </Link>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/passenger"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all group"
          title="আপনার স্টুডেন্ট প্রোফাইল ও টিকিট ড্যাশবোর্ড"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="max-w-[100px] truncate text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
            {session.name}
          </span>
          <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold hidden sm:inline">
            লগইন
          </span>
        </Link>
        <button
          type="button"
          onClick={() => {
            if (confirm(language === 'bn' ? 'আপনি কি স্টুডেন্ট পোর্টাল থেকে লগআউট করতে চান?' : 'Do you want to log out from passenger portal?')) {
              localStorage.removeItem('atoms_passenger_phone');
              localStorage.removeItem('atoms_passenger_pin');
              setSession(null);
              window.location.reload();
            }
          }}
          title={language === 'bn' ? 'লগআউট করুন' : 'Log out'}
          className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/50 dark:hover:text-red-400 text-slate-500 transition-all border border-slate-200 dark:border-slate-700"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <Link href="/passenger">
      <Button variant="primary" size="sm" className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/20 px-3.5 sm:px-4">
        <span>{language === 'bn' ? 'লগইন / পিন সেট' : 'Login / Set PIN'}</span>
      </Button>
    </Link>
  );
}

