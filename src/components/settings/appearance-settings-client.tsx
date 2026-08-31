'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp, FontSize, colorThemesList, ColorTheme } from '@/lib/context';
import {
  Sun,
  Moon,
  Globe,
  CheckCircle2,
  RotateCcw,
  Layout,
  Table as TableIcon,
  Navigation,
  Palette,
  Sparkles,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function AppearanceSettingsClient() {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    currentColor,
    navFontSize,
    setNavFontSize,
    headerFontSize,
    setHeaderFontSize,
    contentFontSize,
    setContentFontSize,
    sidebarAccordionMode,
    setSidebarAccordionMode,
    t
  } = useApp();

  const fontOptions: { id: FontSize; labelBn: string; labelEn: string; sample: string; desc: string }[] = [
    { id: 'sm', labelBn: 'ছোট / কম্প্যাক্ট (Small)', labelEn: 'Compact (Small)', sample: '11px - 12px', desc: 'More information on screen' },
    { id: 'base', labelBn: 'ডিফল্ট / স্ট্যান্ডার্ড (Normal)', labelEn: 'Default (Normal)', sample: '13px - 14px', desc: 'Standard balanced readability' },
    { id: 'lg', labelBn: 'বড় / কমফোর্টেবল (Large)', labelEn: 'Comfortable (Large)', sample: '15px - 16px', desc: 'Larger text for comfortable viewing' },
    { id: 'xl', labelBn: 'এক্সট্রা লার্জ (Extra Large)', labelEn: 'Extra Large (XL)', sample: '17px - 18px', desc: 'Maximum accessibility & clarity' }
  ];

  const handleReset = () => {
    setNavFontSize('base');
    setHeaderFontSize('base');
    setContentFontSize('base');
    setColorTheme('blue');
    setTheme('light');
    setLanguage('bn');
  };

  return (
    <div className="space-y-6">
      {/* 1. Brand Accent Color Palette Customizer */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs transition-colors"
              style={{ backgroundColor: currentColor?.primaryHex || '#2563eb' }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                {language === 'bn' ? 'সিস্টেম ব্র্যান্ড কালার থিম (Brand Accent Color Theme)' : 'Brand Accent Color Theme'}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? '১২টি আধুনিক থিম থেকে পছন্দমতো কালার বেছে নিন — বাটন, সাইডবার লোগো, ব্যাজ ও লিঙ্ক স্বয়ংক্রিয়ভাবে রঙ পরিবর্তন করবে'
                  : 'Select from 12 curated theme palettes — all buttons, sidebar links, active badges, and focus rings will instantly adapt'}
              </p>
            </div>
          </div>
          <Badge
            className="font-mono font-bold"
            style={{ backgroundColor: `${currentColor?.primaryHex}20`, color: currentColor?.primaryHex }}
          >
            {language === 'bn' ? currentColor?.nameBn.split(' (')[0] : currentColor?.nameEn}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {colorThemesList.map((item) => {
              const isSelected = (colorTheme || 'blue') === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setColorTheme(item.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex items-center gap-3 cursor-pointer group ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/90 shadow-md ring-2 ring-slate-400/30 scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-xs text-white transition-transform group-hover:scale-110"
                    style={{ backgroundColor: item.primaryHex }}
                  >
                    {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {language === 'bn' ? item.nameBn.split(' (')[0] : item.nameEn}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase">
                      {item.primaryHex}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Color Accent Preview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
              {language === 'bn' ? 'সিস্টেমের সক্রিয় কালার প্রিভিউ:' : 'Active System Color Preview:'}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="sm" className="gap-1.5 font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'bn' ? 'প্রাইমারি বাটন (Button)' : 'Primary Button'}
              </Button>
              <Badge variant="primary">
                {language === 'bn' ? 'অ্যাক্টিভ ব্যাজ (Active Badge)' : 'Active Badge'}
              </Badge>
              <span
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                style={{ color: 'var(--primary-color)' }}
              >
                {language === 'bn' ? 'অ্যাকসেন্ট টেক্সট (Accent Text)' : 'Accent Text'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Navigation Sidebar Font Size Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                {language === 'bn' ? 'বাম পাশের সাইডবার ন্যাভিগেশন ফন্ট (Sidebar Font)' : 'Sidebar Navigation Font Size'}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'সাইডবারের মেনু লিঙ্ক, ক্যাটাগরি ও ব্যাজের ফন্ট সাইজ আলাদাভাবে নিয়ন্ত্রণ করুন'
                  : 'Adjust font size and spacing exclusively for the left sidebar menu and navigation links'}
              </p>
            </div>
          </div>
          <Badge variant="primary" className="font-mono uppercase">
            {navFontSize}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fontOptions.map((opt) => {
              const isSelected = (navFontSize || 'base') === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setNavFontSize(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/90 shadow-md ring-2 ring-slate-400/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {language === 'bn' ? opt.labelBn : opt.labelEn}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-400">Scale:</span>
                    <span className="font-bold text-[var(--primary-color)]">{opt.sample}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Top Header Navigation Font Size Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                {language === 'bn' ? 'উপরের নেভিগেশন বার (হেডার) ফন্ট সাইজ (Top Navigation Bar Font)' : 'Top Navigation Bar Font Size'}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'উপরের হেডারের ঘড়ি, তারিখ, ইউজার নাম, কুইক অ্যাকশন বাটন এবং সার্চ বারের ফন্ট স্কেল'
                  : 'Customize the font size and height of the top navigation bar, real-time clock, search, and user profile'}
              </p>
            </div>
          </div>
          <Badge variant="purple" className="font-mono uppercase">
            {headerFontSize}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fontOptions.map((opt) => {
              const isSelected = (headerFontSize || 'base') === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setHeaderFontSize(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/90 shadow-md ring-2 ring-slate-400/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {language === 'bn' ? opt.labelBn : opt.labelEn}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-400">Header:</span>
                    <span className="font-bold text-[var(--primary-color)]">{opt.sample}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Content & Tables Font Size Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                {language === 'bn' ? 'কনটেন্ট, টেবিল ও কার্ড ফন্ট সাইজ (Content & Tables Font)' : 'Content & Tables Font Size'}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'ড্যাশবোর্ড, সেলস টেবিল, টিকিট ডিটেইলস ও রিপোর্ট পেজের ফন্ট সাইজ আলাদাভাবে নিয়ন্ত্রণ করুন'
                  : 'Control the reading font size for dashboard metrics, data tables, passenger rosters, and reports'}
              </p>
            </div>
          </div>
          <Badge variant="success" className="font-mono uppercase">
            {contentFontSize}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fontOptions.map((opt) => {
              const isSelected = (contentFontSize || 'base') === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setContentFontSize(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/90 shadow-md ring-2 ring-slate-400/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {language === 'bn' ? opt.labelBn : opt.labelEn}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-400">Body / Table:</span>
                    <span className="font-bold text-[var(--primary-color)]">{opt.sample}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 5. Sidebar Dropdown Accordion Behavior Mode */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs transition-colors"
              style={{ backgroundColor: currentColor?.primaryHex || '#2563eb' }}
            >
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                {language === 'bn' ? 'সাইডবার ড্রপডাউন মোড (Sidebar Accordion Behavior)' : 'Sidebar Accordion Behavior'}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'একটি ক্যাটাগরি খুললে অন্যগুলো স্বয়ংক্রিয়ভাবে বন্ধ হবে কিনা তা নির্ধারণ করুন'
                  : 'Choose whether opening one dropdown automatically closes other open sections'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Single Accordion Mode */}
            <button
              type="button"
              onClick={() => setSidebarAccordionMode('single')}
              className={`p-4 rounded-2xl border text-left transition-all relative group flex flex-col justify-between cursor-pointer ${
                sidebarAccordionMode === 'single'
                  ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/90 shadow-md ring-2 ring-slate-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {language === 'bn' ? 'একক ড্রপডাউন মোড (সিঙ্গেল)' : 'Single Accordion Mode'}
                    <Badge variant="primary" className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      {language === 'bn' ? 'সুপারিশকৃত' : 'Recommended'}
                    </Badge>
                  </span>
                  {sidebarAccordionMode === 'single' && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn'
                    ? 'একটি ক্যাটাগরি খুললে বাকিগুলো নিজে থেকেই বন্ধ হয়ে যাবে — সাইডবার কখনো লম্বা হবে না এবং ক্লিন থাকবে।'
                    : 'Opening one category automatically collapses other categories — keeps the sidebar compact & clean.'}
                </p>
              </div>
            </button>

            {/* Multiple Accordion Mode */}
            <button
              type="button"
              onClick={() => setSidebarAccordionMode('multiple')}
              className={`p-4 rounded-2xl border text-left transition-all relative group flex flex-col justify-between cursor-pointer ${
                sidebarAccordionMode === 'multiple'
                  ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/90 shadow-md ring-2 ring-slate-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {language === 'bn' ? 'মাল্টি ড্রপডাউন মোড (একাধিক)' : 'Multiple Accordion Mode'}
                  </span>
                  {sidebarAccordionMode === 'multiple' && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn'
                    ? 'একসাথে একাধিক ক্যাটাগরি ড্রপডাউন খুলে রাখা যাবে।'
                    : 'Keep multiple category dropdowns open simultaneously.'}
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 6. Global Language & Theme Quick Controls */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'bn' ? 'থিম ও ভাষা নির্বাচন (Theme & Language)' : 'Theme & Language Switcher'}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleReset} className="text-xs flex items-center gap-1.5 rounded-xl">
            <RotateCcw className="w-3.5 h-3.5" />
            {language === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset to Default'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Theme Control */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                {language === 'bn' ? 'কালার থিম (Color Theme)' : 'Display Theme'}
              </span>
              <div className="flex gap-2 pt-1">
                <Button
                  variant={theme === 'light' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex-1 text-xs rounded-xl"
                >
                  <Sun className="w-3.5 h-3.5 mr-1.5" />
                  Light Mode (সাদা)
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex-1 text-xs rounded-xl"
                >
                  <Moon className="w-3.5 h-3.5 mr-1.5" />
                  Dark Mode (কালো)
                </Button>
              </div>
            </div>

            {/* Language Control */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--primary-color)]" />
                {language === 'bn' ? 'সিস্টেমের ভাষা (System Language)' : 'Application Language'}
              </span>
              <div className="flex gap-2 pt-1">
                <Button
                  variant={language === 'bn' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage('bn')}
                  className="flex-1 text-xs rounded-xl"
                >
                  🇧🇩 বাংলা (Bengali)
                </Button>
                <Button
                  variant={language === 'en' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage('en')}
                  className="flex-1 text-xs rounded-xl"
                >
                  🌐 English (US)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
