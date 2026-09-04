'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Edit3, Check, ChevronDown, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="space-y-5">
      {/* 1. Pickup / Boarding Point Selection (Direct Input + Dropdown & Chips) */}
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
            {COMMON_BOARDING_POINTS.map((pt) => (
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
              value={COMMON_BOARDING_POINTS.includes(boardingPoint) ? boardingPoint : ''}
              onChange={(e) => {
                if (e.target.value) {
                  onBoardingChange(e.target.value);
                }
              }}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 appearance-none pr-7 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <option value="">{language === 'bn' ? '📋 সাধারণ লিস্ট থেকে বেছে নিন (ঐচ্ছিক)...' : '📋 Choose from presets (Optional)...'}</option>
              {COMMON_BOARDING_POINTS.map((pt) => (
                <option key={pt} value={pt}>
                  📍 {pt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick-tap Chips for instant filling */}
        {!isCompact && (
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              {language === 'bn' ? 'জনপ্রিয় পয়েন্টসমূহ (এক ক্লিকে পূরণ করুন):' : 'Popular Points (Tap to fill):'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {COMMON_BOARDING_POINTS.map((pt) => {
                const isSelected = boardingPoint === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => onBoardingChange(pt)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                    }`}
                  >
                    {pt}
                  </button>
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
              {COMMON_DROPPING_POINTS.map((pt) => (
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
                value={COMMON_DROPPING_POINTS.includes(droppingPoint || '') ? droppingPoint : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onDroppingChange(e.target.value);
                  }
                }}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 appearance-none pr-7 cursor-pointer hover:border-emerald-400 transition-colors"
              >
                <option value="">{language === 'bn' ? '📋 সাধারণ লিস্ট থেকে নামার স্থান বাছুন (ঐচ্ছিক)...' : '📋 Choose from presets (Optional)...'}</option>
                {COMMON_DROPPING_POINTS.map((pt) => (
                  <option key={pt} value={pt}>
                    🎯 {pt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick-tap Chips for popular dropping locations */}
          {!isCompact && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                {language === 'bn' ? 'সাধারণ নামার স্থানসমূহ:' : 'Popular Drop Points:'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {COMMON_DROPPING_POINTS.map((pt) => {
                  const isSelected = droppingPoint === pt;
                  return (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => onDroppingChange(pt)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                      }`}
                    >
                      {pt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
