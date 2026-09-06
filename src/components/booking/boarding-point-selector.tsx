'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Check,
  ChevronDown,
  Sparkles,
  Plus,
  X,
  PlusCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/context';

export const COMMON_BOARDING_POINTS = [
  'গাবতলী বাস টার্মিনাল',
  'কল্যাণপুর কাউন্টার',
  'শ্যামলী কাউন্টার',
  'মহাখালী টার্মিনাল',
  'উত্তরা (আজমপুর)',
  'আব্দুল্লাহপুর বাসস্ট্যান্ড',
  'মিরপুর ১০ গোলচত্বর',
  'সাভার বাসস্ট্যান্ড',
  'নবীনগর মোড়',
  'বাইপাইল মোড়',
  'চন্দ্রা ত্রিমোড়'
];

export const COMMON_DROPPING_POINTS = [
  'বিশ্ববিদ্যালয় মেইন গেট',
  'কাজলা গেট',
  'তালাইমারী মোড়',
  'রেলগেট মোড়',
  'জিরো পয়েন্ট মোড়',
  'সেন্ট্রাল বাস টার্মিনাল',
  'ক্যাম্পাস হোস্টেল এরিয়া'
];

const STORAGE_KEY_BOARDING = 'ATOMS_CUSTOM_BOARDING_POINTS';
const STORAGE_KEY_DROPPING = 'ATOMS_CUSTOM_DROPPING_POINTS';

interface Props {
  boardingPoint: string;
  onBoardingChange: (val: string) => void;
  droppingPoint?: string;
  onDroppingChange?: (val: string) => void;
  isCompact?: boolean;
}

export function BoardingPointSelector({
  boardingPoint,
  onBoardingChange,
  droppingPoint,
  onDroppingChange,
  isCompact = false
}: Props) {
  const { language } = useApp();

  // Custom user-managed popular points
  const [customBoarding, setCustomBoarding] = useState<string[]>([]);
  const [customDropping, setCustomDropping] = useState<string[]>([]);

  // Modal for adding a new popular point
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPointTarget, setNewPointTarget] = useState<'BOARDING' | 'DROPPING' | 'BOTH'>('BOARDING');
  const [newPointName, setNewPointName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Load custom points from localStorage on mount
  useEffect(() => {
    try {
      const savedBoarding = localStorage.getItem(STORAGE_KEY_BOARDING);
      if (savedBoarding) {
        const parsed = JSON.parse(savedBoarding);
        if (Array.isArray(parsed)) setCustomBoarding(parsed);
      }
      const savedDropping = localStorage.getItem(STORAGE_KEY_DROPPING);
      if (savedDropping) {
        const parsed = JSON.parse(savedDropping);
        if (Array.isArray(parsed)) setCustomDropping(parsed);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Combined lists
  const allBoardingPoints = [...COMMON_BOARDING_POINTS, ...customBoarding];
  const allDroppingPoints = [...COMMON_DROPPING_POINTS, ...customDropping];

  const handleOpenAddModal = (target: 'BOARDING' | 'DROPPING') => {
    setNewPointTarget(target);
    setNewPointName('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveNewPoint = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPointName.trim();
    if (!trimmed) {
      setAddError(language === 'bn' ? 'পয়েন্টের নাম লিখুন' : 'Point name is required');
      return;
    }

    if (newPointTarget === 'BOARDING' || newPointTarget === 'BOTH') {
      if (!allBoardingPoints.includes(trimmed)) {
        const updated = [...customBoarding, trimmed];
        setCustomBoarding(updated);
        try {
          localStorage.setItem(STORAGE_KEY_BOARDING, JSON.stringify(updated));
        } catch {}
      }
      onBoardingChange(trimmed);
    }

    if ((newPointTarget === 'DROPPING' || newPointTarget === 'BOTH') && onDroppingChange) {
      if (!allDroppingPoints.includes(trimmed)) {
        const updated = [...customDropping, trimmed];
        setCustomDropping(updated);
        try {
          localStorage.setItem(STORAGE_KEY_DROPPING, JSON.stringify(updated));
        } catch {}
      }
      onDroppingChange(trimmed);
    }

    setIsAddModalOpen(false);
    setNewPointName('');
    setAddError(null);
  };

  const handleDeleteCustomBoarding = (pt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customBoarding.filter((item) => item !== pt);
    setCustomBoarding(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BOARDING, JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteCustomDropping = (pt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customDropping.filter((item) => item !== pt);
    setCustomDropping(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DROPPING, JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* 1. Pickup / Boarding Point Selection */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'bn' ? 'যাত্রী ওঠার স্থান (Boarding Point) *' : 'Pickup / Boarding Point *'}</span>
          </label>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800/80">
            {language === 'bn' ? '✍️ সরাসরি লিখুন বা পছন্দ করুন' : '✍️ Type or Pick'}
          </span>
        </div>

        {/* Primary Editable Text Input with Datalist */}
        <div className="relative">
          <Input
            id="input-boarding-point"
            list="boarding-suggestions-list"
            type="text"
            placeholder={
              language === 'bn'
                ? 'স্থান বা কাউন্টারের নাম সরাসরি লিখুন (যেমন: গাবতলী কাউন্টার, সাভার)...'
                : 'Type landmark / counter name directly (e.g. Gabtoli, Savar)...'
            }
            value={boardingPoint}
            onChange={(e) => onBoardingChange(e.target.value)}
            className="text-xs sm:text-sm font-bold pl-3.5 pr-9 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl focus:border-blue-500 shadow-2xs"
            autoComplete="off"
            required
          />
          <datalist id="boarding-suggestions-list">
            {allBoardingPoints.map((pt) => (
              <option key={pt} value={pt} />
            ))}
          </datalist>
          {boardingPoint && (
            <Check className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
        </div>

        {/* Dropdown helper to pick popular points */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
          <div className="relative flex-1">
            <select
              value={allBoardingPoints.includes(boardingPoint) ? boardingPoint : ''}
              onChange={(e) => {
                if (e.target.value) {
                  onBoardingChange(e.target.value);
                }
              }}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 appearance-none pr-7 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <option value="">
                {language === 'bn' ? '📋 সাধারণ লিস্ট থেকে বেছে নিন (ঐচ্ছিক)...' : '📋 Choose from presets (Optional)...'}
              </option>
              {allBoardingPoints.map((pt) => (
                <option key={pt} value={pt}>
                  📍 {pt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick-tap Chips for instant filling + Add option */}
        {!isCompact && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>{language === 'bn' ? 'জনপ্রিয় পয়েন্টসমূহ (এক ক্লিকে পূরণ করুন):' : 'Popular Points (Tap to fill):'}</span>
              </span>
              <button
                type="button"
                onClick={() => handleOpenAddModal('BOARDING')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-800/80 cursor-pointer transition-all active:scale-95 shadow-2xs"
                title={language === 'bn' ? 'নতুন জনপ্রিয় পয়েন্ট যোগ করুন' : 'Add new popular point'}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{language === 'bn' ? '+ পয়েন্ট যোগ করুন' : '+ Add Point'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {allBoardingPoints.map((pt) => {
                const isSelected = boardingPoint === pt;
                const isCustom = customBoarding.includes(pt);
                return (
                  <div
                    key={pt}
                    className={`inline-flex items-center rounded-xl border text-[11px] font-bold transition-all shadow-2xs ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onBoardingChange(pt)}
                      className="px-2.5 py-1 cursor-pointer select-none text-left"
                    >
                      {pt}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomBoarding(pt, e)}
                        className={`pr-2 pl-0.5 py-1 cursor-pointer transition-colors ${
                          isSelected ? 'text-blue-200 hover:text-white' : 'text-slate-400 hover:text-rose-500'
                        }`}
                        title={language === 'bn' ? 'পয়েন্টটি তালিকা থেকে মুছুন' : 'Remove from list'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Dropping Point Selection (Direct Input + Dropdown & Chips) */}
      {onDroppingChange !== undefined && (
        <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'bn' ? 'যাত্রী নামার স্থান (Dropping Point) *' : 'Destination Drop Point *'}</span>
            </label>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80">
              {language === 'bn' ? '✍️ সরাসরি লিখুন বা পছন্দ করুন' : '✍️ Type or Pick'}
            </span>
          </div>

          {/* Primary Editable Text Input for Dropping */}
          <div className="relative">
            <Input
              id="input-dropping-point"
              list="dropping-suggestions-list"
              type="text"
              placeholder={
                language === 'bn'
                  ? 'নামার স্থান বা গেটের নাম সরাসরি লিখুন (যেমন: মেইন গেট, কাজলা গেট)...'
                  : 'Type drop place / gate name directly...'
              }
              value={droppingPoint || ''}
              onChange={(e) => onDroppingChange(e.target.value)}
              className="text-xs sm:text-sm font-bold pl-3.5 pr-9 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl focus:border-emerald-500 shadow-2xs"
              autoComplete="off"
              required
            />
            <datalist id="dropping-suggestions-list">
              {allDroppingPoints.map((pt) => (
                <option key={pt} value={pt} />
              ))}
            </datalist>
            {droppingPoint && (
              <Check className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>

          {/* Dropdown helper for dropping */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
            <div className="relative flex-1">
              <select
                value={allDroppingPoints.includes(droppingPoint || '') ? droppingPoint : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onDroppingChange(e.target.value);
                  }
                }}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 appearance-none pr-7 cursor-pointer hover:border-emerald-400 transition-colors"
              >
                <option value="">
                  {language === 'bn' ? '📋 সাধারণ লিস্ট থেকে নামার স্থান বাছুন (ঐচ্ছিক)...' : '📋 Choose from presets (Optional)...'}
                </option>
                {allDroppingPoints.map((pt) => (
                  <option key={pt} value={pt}>
                    🎯 {pt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick-tap Chips for popular dropping locations + Add option */}
          {!isCompact && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>{language === 'bn' ? 'জনপ্রিয় পয়েন্টসমূহ (এক ক্লিকে পূরণ করুন):' : 'Popular Drop Points (Tap to fill):'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('DROPPING')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/80 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  title={language === 'bn' ? 'নতুন নামার পয়েন্ট যোগ করুন' : 'Add new dropping point'}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{language === 'bn' ? '+ পয়েন্ট যোগ করুন' : '+ Add Point'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {allDroppingPoints.map((pt) => {
                  const isSelected = droppingPoint === pt;
                  const isCustom = customDropping.includes(pt);
                  return (
                    <div
                      key={pt}
                      className={`inline-flex items-center rounded-xl border text-[11px] font-bold transition-all shadow-2xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/40'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onDroppingChange(pt)}
                        className="px-2.5 py-1 cursor-pointer select-none text-left"
                      >
                        {pt}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomDropping(pt, e)}
                          className={`pr-2 pl-0.5 py-1 cursor-pointer transition-colors ${
                            isSelected ? 'text-emerald-200 hover:text-white' : 'text-slate-400 hover:text-rose-500'
                          }`}
                          title={language === 'bn' ? 'পয়েন্টটি তালিকা থেকে মুছুন' : 'Remove from list'}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Custom Point Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={language === 'bn' ? 'জনপ্রিয় পয়েন্ট যোগ করুন (এক ক্লিকে পূরণ)' : 'Add Popular Point (1-Click Fill)'}
        description={
          language === 'bn'
            ? 'নতুন পয়েন্টটি সংরক্ষণ করলে তা স্থায়ীভাবে তালিকায় যুক্ত হবে এবং এক ক্লিকেই ইনপুট পূরণ করা যাবে।'
            : 'Added points will be saved to your preset list for instant 1-click filling.'
        }
        size="sm"
      >
        <form onSubmit={handleSaveNewPoint} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'পয়েন্ট বা কাউন্টারের নাম *' : 'Point / Counter Landmark Name *'}
            </label>
            <Input
              type="text"
              placeholder={
                language === 'bn'
                  ? 'যেমন: উত্তরা হাউজবিল্ডিং, মিরপুর ১২, সাইনবোর্ড মোড়...'
                  : 'e.g. Uttara House Building, Signboard, Mirpur 12...'
              }
              value={newPointName}
              onChange={(e) => {
                setNewPointName(e.target.value);
                if (addError) setAddError(null);
              }}
              autoFocus
              required
              className="text-xs sm:text-sm font-bold"
            />
            {addError && <p className="text-xs font-semibold text-rose-500">{addError}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'কোথায় যোগ করবেন?' : 'Point Category'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewPointTarget('BOARDING')}
                className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  newPointTarget === 'BOARDING'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                📍 {language === 'bn' ? 'ওঠার স্থান' : 'Boarding'}
              </button>
              <button
                type="button"
                onClick={() => setNewPointTarget('DROPPING')}
                className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  newPointTarget === 'DROPPING'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                🎯 {language === 'bn' ? 'নামার স্থান' : 'Dropping'}
              </button>
              <button
                type="button"
                onClick={() => setNewPointTarget('BOTH')}
                className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  newPointTarget === 'BOTH'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                🔄 {language === 'bn' ? 'উভয়টিতে' : 'Both'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl font-bold text-xs cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              {language === 'bn' ? 'সংরক্ষণ ও নির্বাচন করুন' : 'Save & Select'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
