'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/context';
import {
  paymentBrandsList,
  PaymentBrandMeta,
  DynamicPaymentLogo
} from '@/components/booking/payment-brand-icons';
import {
  Upload,
  Link as LinkIcon,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Search,
  Filter,
  FileImage,
  Layers,
  ArrowUpDown,
  Download,
  UploadCloud,
  Check,
  Building2,
  Smartphone,
  CreditCard,
  Banknote
} from 'lucide-react';

export function PaymentLogosSettingsClient() {
  const { customLogos, setCustomLogo, resetCustomLogo, resetAllCustomLogos, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mfs' | 'bank' | 'card' | 'cash'>('all');
  const [editingBrand, setEditingBrand] = useState<PaymentBrandMeta | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [confirmResetAllModal, setConfirmResetAllModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const filteredBrands = paymentBrandsList.filter((b) => {
    const matchesSearch =
      b.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.descriptionBn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || b.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const customCount = Object.keys(customLogos || {}).length;
  const totalCount = paymentBrandsList.length;

  const handleFileUpload = (brandKey: string, file: File) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'bn' ? 'ফাইল সাইজ খুব বড়! সর্বোচ্চ ২ মেগাবাইট (2 MB) সাইজ অনুমোদিত।' : 'File size too large! Maximum 2 MB allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCustomLogo(brandKey, dataUrl);
        showToast(
          language === 'bn'
            ? `${brandKey} এর নতুন কাস্টম লোগো সফলভাবে সেট করা হয়েছে!`
            : `Custom logo for ${brandKey} has been updated!`
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (brandKey: string) => {
    if (!urlInput.trim()) return;
    setCustomLogo(brandKey, urlInput.trim());
    setUrlInput('');
    setEditingBrand(null);
    showToast(
      language === 'bn'
        ? `${brandKey} এর লোগো URL সফলভাবে আপডেট হয়েছে!`
        : `Logo URL for ${brandKey} updated successfully!`
    );
  };

  const handleResetSingle = (brandKey: string) => {
    resetCustomLogo(brandKey);
    showToast(
      language === 'bn'
        ? `${brandKey} এর অফিসিয়াল ডিফল্ট ভেক্টর লোগো রিস্টোর করা হয়েছে!`
        : `Restored default official vector logo for ${brandKey}!`
    );
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customLogos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `atoms_payment_logos_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.entries(parsed).forEach(([k, v]) => {
            if (typeof v === 'string') setCustomLogo(k, v);
          });
          showToast(language === 'bn' ? 'লোগো কনফিগারেশন ব্যাকআপ ইমপোর্ট সফল হয়েছে!' : 'Payment logos configuration imported!');
        }
      } catch {
        alert(language === 'bn' ? 'ভুল JSON ফাইল ফরম্যাট!' : 'Invalid JSON file format!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* 1. Main Header Card with Summary & Actions */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="bg-gradient-to-r from-pink-600 to-rose-600 text-white border-0">
                  {language === 'bn' ? 'ডাইনামিক লোগো ম্যানেজমেন্ট' : 'Dynamic Logo Manager'}
                </Badge>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {customCount > 0 ? `${customCount} CUSTOM OVERRIDES ACTIVE` : 'ALL OFFICIAL VECTORS ACTIVE'}
                </span>
              </div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'পেমেন্ট গেটওয়ে ও ব্যাংক লোগো কাস্টমাইজেশন' : 'Payment Gateway & Bank Brand Logos'}
              </CardTitle>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {language === 'bn'
                  ? 'বিকাশ, নগদ, রকেট, ডাচ-বাংলা, ইসলামী ব্যাংকসহ সকল ব্যাংক ও পেমেন্ট গেটওয়ের লোগো আপলোড এবং ডাইনামিক ভাবে পরিবর্তন করুন।'
                  : 'Upload and dynamically manage official logos for bKash, Nagad, Rocket, DBBL, Islami Bank, and all commercial banks.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="cursor-pointer">
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                <Button variant="outline" size="sm" type="button" className="text-xs gap-1.5 pointer-events-none">
                  <UploadCloud className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'ইমপোর্ট' : 'Import'}
                </Button>
              </label>

              <Button variant="outline" size="sm" onClick={handleExportJSON} className="text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" />
                {language === 'bn' ? 'ব্যাকআপ এক্সপোর্ট' : 'Export'}
              </Button>

              {customCount > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmResetAllModal(true)}
                  className="text-xs gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'সব ডিফল্ট করুন' : 'Reset All'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* 2. Official Technical Format Guideline Alert Box */}
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/80 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                <FileImage className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-2">
                  <span>{language === 'bn' ? 'লোগো ফাইল ফরম্যাট ও নির্দেশিকা (Logo File Format Guidelines)' : 'Logo File Format & Specification Guidelines'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-200/70 dark:bg-blue-800/70 text-[10px] font-mono text-blue-800 dark:text-blue-100 font-bold">
                    RECOMMENDED SPECS
                  </span>
                </h4>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                  {language === 'bn'
                    ? 'সর্বোত্তম ভিজ্যুয়াল রেজুলেশন এবং ডার্ক/লাইট মোডে স্পষ্টতার জন্য নিচের ফরম্যাট ও সাইজ অনুযায়ী লোগো আপলোড করার পরামর্শ দেওয়া হচ্ছে:'
                    : 'For crisp display in both Light & Dark modes and optimal app performance, please adhere to the following specifications:'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
              {/* Format */}
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-100 dark:border-blue-900 space-y-1">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block uppercase">
                  1. Supported Formats
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  SVG, PNG, WebP, JPG
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  SVG (Vector) বা স্বচ্ছ ব্যাকগ্রাউন্ডের Transparent PNG সর্বোচ্চ পরিষ্কার দেখায়।
                </p>
              </div>

              {/* Ratio */}
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-100 dark:border-blue-900 space-y-1">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block uppercase">
                  2. Dimensions & Ratio
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs font-mono">
                  1:1 Square (120×120px)
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  বর্গাকার আইকন (১২০×১২০ হতে ৫১২×৫১২ পিক্সেল) অথবা ৩:১ অনুপাতের ব্যানার লোগো।
                </p>
              </div>

              {/* File Size */}
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-100 dark:border-blue-900 space-y-1">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block uppercase">
                  3. Max File Size
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs font-mono">
                  &lt; 500 KB (Max 2 MB)
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  সুপার ফাস্ট লোডিংয়ের জন্য ৫০ কেবি হতে ২০০ কেবি সাইজের ছবি আদর্শ।
                </p>
              </div>

              {/* Dynamic Scope */}
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-100 dark:border-blue-900 space-y-1">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block uppercase">
                  4. Instant Dynamic Sync
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Realtime System-wide
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  বুকিং উইজার্ড, অডিট টেবিল ও টিকেটে সাথে সাথে রিয়েলটাইমে পরিবর্তিত হবে।
                </p>
              </div>
            </div>
          </div>

          {/* 3. Search and Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? `সকল (${totalCount})` : `All (${totalCount})`}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('mfs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  selectedCategory === 'mfs'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'মোবাইল ব্যাংকিং (MFS)' : 'MFS Wallets'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('bank')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  selectedCategory === 'bank'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'বাণিজ্যিক ব্যাংক' : 'Commercial Banks'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  selectedCategory === 'card'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'কার্ড ও পিওএস' : 'Card & POS'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('cash')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  selectedCategory === 'cash'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'কাউন্টার ক্যাশ' : 'Cash'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                type="text"
                placeholder={language === 'bn' ? 'লোগো বা ব্যাংক খুঁজুন...' : 'Search brand or bank...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          {/* 4. Brand Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredBrands.map((brand) => {
              const hasCustom = Boolean(customLogos?.[brand.key]);
              const activeUrl = customLogos?.[brand.key];

              return (
                <div
                  key={brand.key}
                  className={`p-4 rounded-2xl border transition-all ${
                    hasCustom
                      ? 'border-purple-300 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Visual Brand Logo Box */}
                    <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-1 flex-shrink-0 shadow-xs overflow-hidden">
                      <DynamicPaymentLogo
                        method={brand.key}
                        customUrl={activeUrl}
                        className="w-11 h-11"
                      />
                    </div>

                    {/* Brand Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {brand.nameBn}
                        </h4>
                        <Badge
                          variant={hasCustom ? 'primary' : 'outline'}
                          className={`text-[10px] font-mono shrink-0 ${
                            hasCustom
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {hasCustom ? 'CUSTOM LOGO' : 'OFFICIAL VECTOR'}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {brand.descriptionBn}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[10px] font-mono text-slate-400">
                          KEY: <strong className="text-slate-700 dark:text-slate-300">{brand.key}</strong>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">
                          {brand.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Upload Button */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(brand.key, f);
                            e.target.value = '';
                          }}
                        />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          {language === 'bn' ? 'ছবি আপলোড' : 'Upload Image'}
                        </span>
                      </label>

                      {/* URL button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBrand(brand);
                          setUrlInput(activeUrl || '');
                        }}
                        className="text-xs h-7.5 gap-1"
                      >
                        <LinkIcon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>{language === 'bn' ? 'URL দিয়ে' : 'Web URL'}</span>
                      </Button>
                    </div>

                    {/* Reset Button (If custom) */}
                    {hasCustom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetSingle(brand.key)}
                        className="text-[11px] h-7 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 px-2"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{language === 'bn' ? 'ডিফল্টে ফিরুন' : 'Reset'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBrands.length === 0 && (
            <div className="text-center py-12 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h5 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                {language === 'bn' ? 'কোনো গেটওয়ে বা ব্যাংক পাওয়া যায়নি' : 'No matching payment method found'}
              </h5>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'bn' ? 'অনুগ্রহ করে সার্চ কুয়েরি পরিবর্তন করুন।' : 'Try clearing the search or changing category.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Input Modal */}
      {editingBrand && (
        <Modal
          isOpen={true}
          onClose={() => setEditingBrand(null)}
          title={`${editingBrand.nameBn} - ${language === 'bn' ? 'লোগো ইমেজ লিঙ্ক (URL)' : 'Logo Image URL'}`}
          size="md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'bn' ? 'সরাসরি লিঙ্ক প্রবেশ করান:' : 'Enter direct image URL:'}
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                {language === 'bn'
                  ? 'ইন্টারনেট বা আপনার সার্ভারে হোস্ট করা SVG, PNG, WebP বা JPG ফরম্যাটের পাবলিক লিঙ্ক দিন।'
                  : 'Provide any public HTTPS link pointing to an SVG, PNG, WebP or JPG.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {language === 'bn' ? 'ইমেজ / SVG URL' : 'Image URL'}
              </label>
              <Input
                type="url"
                placeholder="https://example.com/images/bkash-logo.svg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-xs font-mono"
                autoFocus
              />
            </div>

            {urlInput && (
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Live Preview</span>
                <img
                  src={urlInput}
                  alt="Preview"
                  className="w-16 h-16 object-contain mx-auto rounded-lg border bg-white dark:bg-slate-800 p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingBrand(null)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApplyUrl(editingBrand.key)}
                disabled={!urlInput.trim()}
              >
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Logo'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Reset All Modal */}
      {confirmResetAllModal && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmResetAllModal(false)}
          title={language === 'bn' ? 'সকল কাস্টম লোগো রিসেট নিশ্চিতকরণ' : 'Reset All Custom Logos Confirmation'}
          size="sm"
        >
          <div className="space-y-4 pt-1 text-xs">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'bn'
                ? 'আপনি কি নিশ্চিত যে আপনার আপলোড করা সমস্ত কাস্টম লোগো মুছে ফেলে সিস্টেমের অফিশিয়াল ভেক্টর ডিফল্ট লোগোতে ফিরে যেতে চান?'
                : 'Are you sure you want to delete all custom overrides and revert back to default official vector logos?'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmResetAllModal(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  resetAllCustomLogos();
                  setConfirmResetAllModal(false);
                  showToast(language === 'bn' ? 'সকল লোগো ডিফল্ট করা হয়েছে!' : 'All logos reset to official vectors!');
                }}
              >
                {language === 'bn' ? 'হ্যাঁ, সব রিসেট করুন' : 'Yes, Reset All'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
