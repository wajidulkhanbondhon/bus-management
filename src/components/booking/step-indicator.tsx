'use client';

import React from 'react';
import { Check, Armchair, Lock, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

export interface BookingStepDefinition {
  id: number;
  key: string;
  labelBn: string;
  shortBn: string;
  labelEn: string;
  shortEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BOOKING_STEPS: BookingStepDefinition[] = [
  { id: 1, key: 'trip', labelBn: 'বাস নির্বাচন', shortBn: '১. বাস', labelEn: 'Select Bus', shortEn: '1. Bus', icon: Armchair },
  { id: 2, key: 'seats', labelBn: 'সিট নির্বাচন', shortBn: '২. সিট', labelEn: 'Pick Seats', shortEn: '2. Seats', icon: Armchair },
  { id: 3, key: 'passengers', labelBn: 'যাত্রী তথ্য', shortBn: '৩. যাত্রী', labelEn: 'Passenger Info', shortEn: '3. Info', icon: Armchair },
  { id: 4, key: 'boarding', labelBn: 'বোর্ডিং ও প্যাকেজ', shortBn: '৪. বোর্ডিং', labelEn: 'Boarding & Pkg', shortEn: '4. Boarding', icon: Armchair },
  { id: 5, key: 'payment', labelBn: 'পেমেন্ট ও টিকিট', shortBn: '৫. পেমেন্ট', labelEn: 'Payment & Ticket', shortEn: '5. Ticket', icon: Armchair }
];

interface StepIndicatorProps {
  currentStep: number;
  maxReachableStep: number;
  onNavigate: (step: number) => void;
}

export function StepIndicator({ currentStep, maxReachableStep, onNavigate }: StepIndicatorProps) {
  const { language } = useApp();

  return (
    <div suppressHydrationWarning className="w-full p-1 sm:p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div suppressHydrationWarning className="grid grid-cols-5 gap-1 sm:gap-2 w-full">
        {BOOKING_STEPS.map((item) => {
          const isCurrent = currentStep === item.id;
          const isComplete = currentStep > item.id;
          const isClickable = item.id <= maxReachableStep;
          return (
            <button
              key={item.id}
              type="button"
              suppressHydrationWarning
              disabled={!isClickable}
              onClick={() => isClickable && onNavigate(item.id)}
              title={
                !isClickable
                  ? language === 'bn'
                    ? 'পূর্ববর্তী ধাপ সম্পন্ন করে এগিয়ে যান'
                    : 'Complete previous steps first'
                  : undefined
              }
              className={`w-full py-1.5 sm:py-2 px-0.5 sm:px-2 rounded-xl text-[10px] sm:text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
                isCurrent
                  ? 'text-white shadow-md ring-2 ring-blue-400/50 scale-[1.01]'
                  : isComplete
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer'
                  : isClickable
                  ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                  : 'text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-slate-950/20 cursor-not-allowed border border-transparent opacity-60'
              }`}
              style={isCurrent ? { backgroundColor: 'var(--primary-color)' } : undefined}
            >
              {isComplete ? (
                <span suppressHydrationWarning className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              ) : !isClickable ? (
                <Lock suppressHydrationWarning className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              ) : (
                <span suppressHydrationWarning className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-mono text-[10px] sm:text-xs font-bold shrink-0 ${isCurrent ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                  {item.id}
                </span>
              )}
              <span suppressHydrationWarning className={`truncate text-[10px] sm:text-xs leading-tight ${isCurrent ? 'font-black' : 'font-semibold'}`}>
                <span className="hidden md:inline">{language === 'bn' ? item.labelBn : item.labelEn}</span>
                <span className="inline md:hidden">{language === 'bn' ? item.shortBn : item.shortEn}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SummaryBarProps {
  selectedSeatCount: number;
  seatLabels: string[];
  destinationLabel: string;
  netAmount: number;
  discountAmount: number;
  paidAmount: number;
  stepLabel: string;
  busNumber?: string;
  busName?: string;
}

export function BookingSummaryBar({
  selectedSeatCount,
  seatLabels,
  destinationLabel,
  netAmount,
  discountAmount,
  paidAmount,
  stepLabel,
  busNumber,
  busName
}: SummaryBarProps) {
  const { language } = useApp();

  return (
    <div suppressHydrationWarning className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
          <Armchair className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            {stepLabel || (language === 'bn' ? 'নির্বাচিত সিট ও গন্তব্য' : 'Selected Seats & Route')}
          </div>
          <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            {busNumber && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black font-mono text-xs sm:text-sm rounded-lg shadow-2xs border border-amber-300">
                🚌 {busNumber}
              </span>
            )}
            {selectedSeatCount > 0 ? (
              <>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  {selectedSeatCount}টি সিট ({seatLabels.filter(Boolean).join(', ')})
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">{destinationLabel}</span>
              </>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">{language === 'bn' ? 'কোনো সিট সিলেক্ট করা হয়নি' : 'No seat selected'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
        {discountAmount > 0 && (
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase tracking-wider text-rose-500 font-black block">
              {language === 'bn' ? 'অনুমোদিত ছাড়' : 'Discount'}
            </span>
            <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="text-right bg-blue-50 dark:bg-blue-950/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-2xs">
          <span className="text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-300 font-black block">
            {language === 'bn' ? 'সর্বমোট প্রদেয়' : 'Total Net Fare'}
          </span>
          <span className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(netAmount)}</span>
        </div>
      </div>
    </div>
  );
}
