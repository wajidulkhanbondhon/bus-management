'use client';

import React from 'react';
import { cleanAndLimitPhoneNumber, getBdMobileOperator } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  showOperatorBadge?: boolean;
  showCharacterCount?: boolean;
  required?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = '',
      onChange,
      label,
      error,
      helperText,
      showOperatorBadge = true,
      showCharacterCount = true,
      required,
      className = '',
      disabled,
      placeholder = '017XXXXXXXX',
      ...props
    },
    ref
  ) => {
    const cleanedValue = cleanAndLimitPhoneNumber(value);
    const operatorInfo = getBdMobileOperator(cleanedValue);
    const isComplete = cleanedValue.length === 11;
    const isValid = operatorInfo.valid;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      const sanitized = cleanAndLimitPhoneNumber(inputVal).slice(0, 11);
      onChange(sanitized);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow navigation and control keys
      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End'
      ];

      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
        return;
      }

      // If non-digit key pressed (allowing 0-9 and Bengali ০-৯), block it
      if (!/^[\d০-৯]$/.test(e.key)) {
        e.preventDefault();
        return;
      }

      // If already 11 digits and no selection, strictly block typing more
      const target = e.target as HTMLInputElement;
      const hasSelection = target.selectionStart !== target.selectionEnd;
      if (cleanedValue.length >= 11 && !hasSelection) {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const sanitized = cleanAndLimitPhoneNumber(pasted).slice(0, 11);
      onChange(sanitized);
    };

    return (
      <div className="space-y-1 w-full">
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {label} {required && <span className="text-rose-500 font-bold">*</span>}
            </label>
            {showCharacterCount && (
              <span
                className={`text-[10px] font-mono font-bold ${
                  isComplete
                    ? isValid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500'
                    : 'text-slate-400'
                }`}
              >
                {cleanedValue.length}/11
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          {/* Country Code Prefix Badge (+880 / ০৮৮) */}
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold pointer-events-none select-none z-10">
            <span className="text-sm">🇧🇩</span>
            <span className="text-blue-600 dark:text-blue-400">+880</span>
            <span className="text-[10px] text-slate-400 font-normal ml-0.5">(০৮৮)</span>
          </div>

          <input
            {...props}
            ref={ref}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={11}
            value={cleanedValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onInput={(e) => {
              const el = e.target as HTMLInputElement;
              if (el.value.length > 11) {
                el.value = el.value.slice(0, 11);
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full rounded-xl border bg-white dark:bg-slate-900 pl-32 pr-9 py-2 text-xs font-mono font-bold transition-all placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 ${
              disabled
                ? 'opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                : error || (isComplete && !isValid)
                ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600'
                : isComplete && isValid
                ? 'border-emerald-400 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 dark:text-white'
            } ${className}`}
          />

          {/* Right status icon */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {isComplete && isValid && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            {isComplete && !isValid && (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
        </div>

        {/* Dynamic Status / Helper Message */}
        <div className="flex items-center justify-between text-[10px] min-h-[16px]">
          {error ? (
            <span className="text-rose-500 font-semibold">{error}</span>
          ) : isComplete && isValid && showOperatorBadge ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span>✓ সঠিক নম্বর ({operatorInfo.operator})</span>
            </span>
          ) : isComplete && !isValid ? (
            <span className="text-rose-500 font-bold">
              {operatorInfo.error || '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন'}
            </span>
          ) : cleanedValue.length > 0 && cleanedValue.length < 11 ? (
            <span className="text-slate-500 dark:text-slate-400">
              ১১ ডিজিট পূর্ণ করতে আরও {11 - cleanedValue.length} টি সংখ্যা লিখুন
            </span>
          ) : helperText ? (
            <span className="text-slate-400">{helperText}</span>
          ) : null}
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

