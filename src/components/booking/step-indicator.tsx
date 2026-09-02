'use client';

import React from 'react';
import { Check, Armchair } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

export interface BookingStepDefinition {
  id: number;
  key: string;
  labelBn: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BOOKING_STEPS: BookingStepDefinition[] = [
  { id: 1, key: 'trip', labelBn: 'বাস নির্বাচন', labelEn: 'Bus', icon: Armchair },
  { id: 2, key: 'seats', labelBn: 'সিট নির্বাচন', labelEn: 'Seats', icon: Armchair },
  { id: 3, key: 'passengers', labelBn: 'যাত্রী তথ্য', labelEn: 'Students', icon: Armchair },
  { id: 4, key: 'boarding', labelBn: 'বোর্ডিং ও প্যাকেজ', labelEn: 'Boarding', icon: Armchair },
  { id: 5, key: 'payment', labelBn: 'ছাড়, পেমেন্ট ও টিকিট', labelEn: 'Payment', icon: Armchair }
];

interface StepIndicatorProps {
  currentStep: number;
  maxReachableStep: number;
  onNavigate: (step: number) => void;
}

export function StepIndicator({ currentStep, maxReachableStep, onNavigate }: StepIndicatorProps) {
  const { language } = useApp();

  return (
    <div className="p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {BOOKING_STEPS.map((item, idx) => {
          const isCurrent = currentStep === item.id;
          const isComplete = currentStep > item.id;
          const isClickable = item.id <= maxReachableStep;
          return (
            <React.Fragment key={item.id}>
              {idx > 0 && (
                <span className={`h-px w-3 sm:w-4 shrink-0 ${isComplete ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onNavigate(item.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isCurrent
                    ? 'text-white shadow-xs'
                    : isClickable
                    ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                    : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                }`}
                style={isCurrent ? { backgroundColor: 'var(--primary-color)' } : undefined}
              >
                {isComplete ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                ) : (
                  <span className="font-mono">{item.id}.</span>
                )}
                <span className={isCurrent ? '' : 'hidden sm:inline'}>{language === 'bn' ? item.labelBn : item.labelEn}</span>
              </button>
            </React.Fragment>
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
}

export function BookingSummaryBar({
  selectedSeatCount,
  seatLabels,
  destinationLabel,
  netAmount,
  discountAmount,
  paidAmount,
  stepLabel
}: SummaryBarProps) {
  const { language } = useApp();

  return (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
          <Armchair className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            {stepLabel || (language === 'bn' ? 'নির্বাচিত সিট ও গন্তব্য' : 'Selected Seats & Route')}
          </div>
          <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
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
