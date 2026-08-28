import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '৳0';
  return `৳${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '--:--';
  if (typeof date === 'string') {
    if (date.includes(':') && !date.includes('T') && !date.includes('-')) {
      return date;
    }
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '--:--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' });
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '---';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '---';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '---';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '---';
  return `${formatDate(d)} at ${formatTime(d)}`;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function randomSuffix(length = 4): string {
  return crypto.randomBytes(length).toString('hex').substring(0, length).toUpperCase();
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

export function generateBookingNumber(sequenceCount: number): string {
  return `BK-${dateStamp()}-${randomSuffix()}-${String(sequenceCount + 10001).padStart(5, '0')}`;
}

export function generateReceiptNumber(sequenceCount: number): string {
  return `RCT-${dateStamp()}-${randomSuffix()}-${String(sequenceCount + 1).padStart(4, '0')}`;
}

export function generateLedgerEntryNumber(sequenceCount: number): string {
  return `LED-${dateStamp()}-${randomSuffix()}-${String(sequenceCount + 1).padStart(5, '0')}`;
}

export function generateRefundNumber(sequenceCount: number): string {
  return `RF-${dateStamp()}-${randomSuffix()}-${String(sequenceCount + 1).padStart(4, '0')}`;
}

/**
 * Converts Bengali digits to English digits, strips non-digits, trims leading +88/88,
 * and strictly limits to maximum 11 digits.
 */
const BN_TO_EN_DIGIT_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

export function cleanAndLimitPhoneNumber(val: string | null | undefined): string {
  if (!val) return '';
  // Convert any Bengali numerals to English digits
  let cleaned = String(val).replace(/[০-৯]/g, (d) => BN_TO_EN_DIGIT_MAP[d] || d);
  // Strip all non-numeric characters (plus, minus, spaces, parens)
  cleaned = cleaned.replace(/\D/g, '');

  // Strip international / country code variants (088 / 0088 / +880 / 880 / +88)
  if (cleaned.startsWith('008801')) {
    cleaned = cleaned.substring(4); // leaves '01...'
  } else if (cleaned.startsWith('08801')) {
    cleaned = cleaned.substring(3); // leaves '01...'
  } else if (cleaned.startsWith('8801')) {
    cleaned = cleaned.substring(2); // leaves '01...'
  } else if (cleaned.startsWith('0881') && cleaned.length >= 12) {
    cleaned = '0' + cleaned.substring(3); // '08817...' -> '017...'
  } else if (cleaned.startsWith('881') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.substring(2); // '8817...' -> '017...'
  }

  // Enforce absolute max 11 digits
  return cleaned.slice(0, 11);
}

/**
 * Checks whether a phone number is a valid 11-digit Bangladeshi mobile number.
 * Valid prefixes: 013, 014, 015, 016, 017, 018, 019
 */
export function isValidBdMobile(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return /^01[3-9]\d{8}$/.test(cleanAndLimitPhoneNumber(phone));
}

/**
 * Returns operator brand details or validation error message.
 */
export function getBdMobileOperator(phone: string | null | undefined): {
  valid: boolean;
  operator?: string;
  prefix?: string;
  error?: string;
} {
  const cleaned = cleanAndLimitPhoneNumber(phone);
  if (!cleaned) {
    return { valid: false, error: 'ফোন নম্বর আবশ্যক' };
  }
  if (cleaned.length < 11) {
    return { valid: false, error: `১১ ডিজিটের নম্বর লিখুন (${cleaned.length}/11)` };
  }
  if (!cleaned.startsWith('01')) {
    return { valid: false, error: 'নম্বরটি 01 দিয়ে শুরু হতে হবে' };
  }

  const prefix = cleaned.substring(0, 3);
  const operatorMap: Record<string, string> = {
    '017': 'Grameenphone',
    '013': 'GP / Skitto',
    '018': 'Robi',
    '016': 'Airtel',
    '019': 'Banglalink',
    '014': 'Banglalink',
    '015': 'Teletalk'
  };

  const operator = operatorMap[prefix];
  if (!operator) {
    return { valid: false, error: `অকার্যকর প্রিফিক্স (${prefix})! 013-019 হতে হবে` };
  }

  return { valid: true, operator, prefix };
}

