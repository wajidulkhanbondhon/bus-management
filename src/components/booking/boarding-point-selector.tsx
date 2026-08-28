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
  const [isManualBoarding, setIsManualBoarding] = useState(false);
  const [isManualDropping, setIsManualDropping] = useState(false);

  return (
    <div className="space-y-4">
      {/* 1. Pickup / Boarding Point Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'bn' ? 'যাত্রী ওঠার স্থান (Boarding Point)' : 'Pickup / Boarding Point'}</span>
          </label>

          <button
            type="button"
            onClick={() => setIsManualBoarding(!isManualBoarding)}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isManualBoarding ? (language === 'bn' ? 'ড্রপডাউন লিস্ট দেখুন' : 'Select from list') : (language === 'bn' ? '+ অন্য স্থান লিখুন' : '+ Type custom place')}</span>
          </button>
        </div>

        {isManualBoarding ? (
          <div className="relative">
            <Input
              type="text"
              placeholder={language === 'bn' ? 'স্থান বা কাউন্টারের নাম লিখুন (যেমন: মিরপুর ১০, সাভার)...' : 'Type landmark / counter name...'}
              value={boardingPoint}
              onChange={(e) => onBoardingChange(e.target.value)}
              className="text-xs font-bold pl-3 pr-8"
              autoFocus
            />
            {boardingPoint && (
              <Check className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <select
                value={boardingPoint}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    setIsManualBoarding(true);
                    onBoardingChange('');
                  } else {
                    onBoardingChange(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white appearance-none pr-8 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">{language === 'bn' ? '-- ওঠার স্থান পছন্দ করুন --' : '-- Choose Boarding Point --'}</option>
                {COMMON_BOARDING_POINTS.map((pt) => (
                  <option key={pt} value={pt}>
                    📍 {pt}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ + অন্য স্থান লিখুন (Manual Custom Entry)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick-tap Chips for popular locations */}
            {!isCompact && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {COMMON_BOARDING_POINTS.slice(0, 5).map((pt) => {
                  const isSelected = boardingPoint === pt;
                  return (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => onBoardingChange(pt)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {pt.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Dropping Point Selection (if handler provided) */}
      {onDroppingChange !== undefined && (
        <div className="space-y-2 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'যাত্রী নামার স্থান (Dropping Point)' : 'Destination Drop Point'}</span>
            </label>

            <button
              type="button"
              onClick={() => setIsManualDropping(!isManualDropping)}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isManualDropping ? (language === 'bn' ? 'ড্রপডাউন লিস্ট দেখুন' : 'Select from list') : (language === 'bn' ? '+ অন্য স্থান লিখুন' : '+ Type custom place')}</span>
            </button>
          </div>

          {isManualDropping ? (
            <div className="relative">
              <Input
                type="text"
                placeholder={language === 'bn' ? 'নামার স্থান বা গেটের নাম লিখুন...' : 'Type dropping place / gate name...'}
                value={droppingPoint || ''}
                onChange={(e) => onDroppingChange(e.target.value)}
                className="text-xs font-bold pl-3 pr-8"
              />
              {droppingPoint && (
                <Check className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
          ) : (
            <div className="relative">
              <select
                value={droppingPoint || ''}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    setIsManualDropping(true);
                    onDroppingChange('');
                  } else {
                    onDroppingChange(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white appearance-none pr-8 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">{language === 'bn' ? '-- নামার স্থান পছন্দ করুন --' : '-- Choose Dropping Point --'}</option>
                {COMMON_DROPPING_POINTS.map((pt) => (
                  <option key={pt} value={pt}>
                    🎯 {pt}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ + অন্য স্থান লিখুন (Manual Custom Entry)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
