'use client';

import React, { useState } from 'react';
import { Check, AlertCircle, ArrowLeft, ArrowRight, TicketPercent, Wallet, Banknote, ChevronDown, Info, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, cleanAndLimitPhoneNumber, isValidBdMobile } from '@/lib/utils';
import { validateAndCalculateCoupon, getMarketingCoupons } from '@/services/coupon.service';
import { useApp } from '@/lib/context';
import Link from 'next/link';
import {
  BkashLogo,
  NagadLogo,
  RocketLogo,
  BankTransferLogo,
  CashMoneyLogo,
  IslamiBankLogo,
  DbblLogo,
  BracBankLogo,
  CityBankLogo,
  EblLogo,
  SonaliBankLogo,
  MtbLogo,
  VisaMastercardLogo,
  DynamicPaymentLogo,
  WhatsAppLogo
} from './payment-brand-icons';

export type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER';
export type SenderSourceType = 'MFS_WALLET' | 'BANK_TO_MFS' | 'CASH_RECEIPT';

export interface AppliedCoupon {
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  rate: number;
  label: string;
}

export interface DiscountState {
  isDiscountApplied: boolean;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountRate: number;
  discountReference: string;
  discountReason: string;
}

export interface FarePaymentProps {
  passengers: any[];
  allCurrentSeats: any[];
  targetUniversity: string;
  grossAmount: number;
  discountState: DiscountState;
  appliedCoupon: AppliedCoupon | null;
  couponMessage: string | null;
  couponApplying: boolean;
  netAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  senderSourceType: SenderSourceType;
  selectedBankName: string;
  paidAmount: number;
  transactionId: string;
  senderRef: string;
  isSubmitting: boolean;
  isStaffCouponModalOpen: boolean;
  customLogos?: Record<string, string>;
  errorMessage?: string | null;
  onSetErrorMessage?: (msg: string | null) => void;
  onGoToStep?: (step: number) => void;
  onDiscountChange: (state: Partial<DiscountState>) => void;
  onCouponApply: (code: string) => Promise<void>;
  onCouponRemove: () => void;
  onStaffCouponApply: (code: string) => Promise<void>;
  onSetStaffCouponModalOpen: (open: boolean) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onSenderSourceTypeChange: (type: SenderSourceType) => void;
  onSelectedBankChange: (name: string) => void;
  onPaidAmountChange: (amount: number) => void;
  onTransactionIdChange: (id: string) => void;
  onSenderRefChange: (ref: string) => void;
  duePromiseDate?: string;
  dueNote?: string;
  onDuePromiseDateChange?: (date: string) => void;
  onDueNoteChange?: (note: string) => void;
  onGoBack: () => void;
  onConfirm: () => void;
}

const authorizerPresets = [
  'কেন্দ্রীয় প্রশাসন / ডিরেক্টর (Central Admin / Director)',
  'ব্রাঞ্চ ইনচার্জ / শাখা প্রধান (Branch In-charge)',
  'অপারেশন ম্যানেজার (Operations Manager)',
  'কাউন্টার ম্যানেজার / ইনচার্জ (Counter In-charge)',
  'অধ্যাপক / ডিন স্পেশাল রেফারেন্স (Faculty / Dean Reference)',
  'কোচ কো-অর্ডিনেটর (Coach Coordinator)'
];

const PAYMENT_CHANNELS: { id: PaymentMethod; name: string; sub: string; activeBorder: string; activeBg: string; activeRing: string; activeText: string; Logo: React.ComponentType<{ className?: string }> }[] = [
  { id: 'HAND_CASH', name: 'Cash', sub: 'কাউন্টার ক্যাশ', Logo: CashMoneyLogo, activeBorder: 'border-[#059669]', activeBg: 'bg-[#059669]/10 dark:bg-[#059669]/20', activeRing: 'ring-[#059669]/50', activeText: 'text-[#059669]' },
  { id: 'BKASH', name: 'bKash', sub: 'বিকাশ', Logo: BkashLogo, activeBorder: 'border-[#E2136E]', activeBg: 'bg-[#E2136E]/10 dark:bg-[#E2136E]/20', activeRing: 'ring-[#E2136E]/50', activeText: 'text-[#E2136E]' },
  { id: 'NAGAD', name: 'Nagad', sub: 'নগদ', Logo: NagadLogo, activeBorder: 'border-[#F7941D]', activeBg: 'bg-[#F7941D]/10 dark:bg-[#F7941D]/20', activeRing: 'ring-[#F7941D]/50', activeText: 'text-[#E35205]' },
  { id: 'ROCKET', name: 'Rocket', sub: 'রকেট', Logo: RocketLogo, activeBorder: 'border-[#8C3494]', activeBg: 'bg-[#8C3494]/10 dark:bg-[#8C3494]/20', activeRing: 'ring-[#8C3494]/50', activeText: 'text-[#8C3494]' },
  { id: 'BANK_TRANSFER', name: 'Bank', sub: 'ব্যাংক', Logo: BankTransferLogo, activeBorder: 'border-[#003366]', activeBg: 'bg-[#003366]/10 dark:bg-[#003366]/20', activeRing: 'ring-[#003366]/50', activeText: 'text-[#003366] dark:text-blue-300' }
];

const BANK_OPTIONS: { id: string; name: string; app: string; Logo: React.ComponentType<{ className?: string }>; activeStyle: string; badgeColor: string }[] = [
  { id: 'Islami Bank (CellFin)', name: 'ইসলামী ব্যাংক', app: 'CellFin', Logo: IslamiBankLogo, activeStyle: 'border-[#00843D] bg-[#00843D]/10 ring-2 ring-[#00843D]', badgeColor: 'bg-[#00843D] text-white' },
  { id: 'DBBL (NexusPay / Rocket)', name: 'ডাচ-বাংলা ব্যাংক', app: 'NexusPay', Logo: DbblLogo, activeStyle: 'border-[#006838] bg-[#006838]/10 ring-2 ring-[#006838]', badgeColor: 'bg-[#006838] text-white' },
  { id: 'BRAC Bank (Astha)', name: 'ব্র্যাক ব্যাংক', app: 'Astha App', Logo: BracBankLogo, activeStyle: 'border-[#003366] bg-[#003366]/10 ring-2 ring-[#003366]', badgeColor: 'bg-[#003366] text-[#FFB81C]' },
  { id: 'City Bank (Citytouch)', name: 'সিটি ব্যাংক', app: 'Citytouch', Logo: CityBankLogo, activeStyle: 'border-[#E30613] bg-[#E30613]/10 ring-2 ring-[#E30613]', badgeColor: 'bg-[#E30613] text-white' },
  { id: 'Eastern Bank (Skybanking)', name: 'ইস্টার্ন ব্যাংক', app: 'Skybanking', Logo: EblLogo, activeStyle: 'border-[#003865] bg-[#003865]/10 ring-2 ring-[#003865]', badgeColor: 'bg-[#003865] text-white' },
  { id: 'Sonali Bank (e-Sheba)', name: 'সোনালী ব্যাংক', app: 'e-Sheba', Logo: SonaliBankLogo, activeStyle: 'border-[#006837] bg-[#006837]/10 ring-2 ring-[#006837]', badgeColor: 'bg-[#006837] text-white' },
  { id: 'MTB (Smart Banking)', name: 'মিউচুয়াল ট্রাস্ট ব্যাংক', app: 'MTB Smart', Logo: MtbLogo, activeStyle: 'border-[#0054A6] bg-[#0054A6]/10 ring-2 ring-[#0054A6]', badgeColor: 'bg-[#0054A6] text-white' },
  { id: 'Other Bank / Debit-Credit Card', name: 'ভিসা / মাস্টারকার্ড', app: 'Card to bKash', Logo: VisaMastercardLogo, activeStyle: 'border-[#0A1E40] bg-[#0A1E40]/10 ring-2 ring-[#0A1E40]', badgeColor: 'bg-[#0A1E40] text-white' }
];

export function FareAndPaymentStep({
  passengers,
  allCurrentSeats,
  targetUniversity,
  grossAmount,
  discountState,
  appliedCoupon,
  couponMessage,
  couponApplying,
  netAmount,
  dueAmount,
  paymentMethod,
  senderSourceType,
  selectedBankName,
  paidAmount,
  transactionId,
  senderRef,
  isSubmitting,
  isStaffCouponModalOpen,
  customLogos,
  errorMessage,
  onSetErrorMessage,
  onGoToStep,
  onDiscountChange,
  onCouponApply,
  onCouponRemove,
  onStaffCouponApply,
  onSetStaffCouponModalOpen,
  onPaymentMethodChange,
  onSenderSourceTypeChange,
  onSelectedBankChange,
  onPaidAmountChange,
  onTransactionIdChange,
  onSenderRefChange,
  duePromiseDate,
  dueNote,
  onDuePromiseDateChange,
  onDueNoteChange,
  onGoBack,
  onConfirm
}: FarePaymentProps) {
  const { language } = useApp();
  const { isDiscountApplied, discountType, discountRate, discountReference, discountReason } = discountState;
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || '');

  // Percentage calculation and custom input states
  const [activePctField, setActivePctField] = useState<'PAID' | 'DUE' | 'CUSTOM' | null>(null);
  const [chosenExplicitPct, setChosenExplicitPct] = useState<number | null>(null);
  const [customPctInput, setCustomPctInput] = useState<string>('');
  const [paidPctInput, setPaidPctInput] = useState<string>('');
  const [duePctInput, setDuePctInput] = useState<string>('');

  // Cash Tendered & Change Due Calculator state
  const [tenderedAmount, setTenderedAmount] = useState<number | ''>('');
  const numTendered = typeof tenderedAmount === 'number' ? tenderedAmount : 0;
  const changeDue = numTendered > paidAmount ? numTendered - paidAmount : 0;
  const shortageAmount = paidAmount > numTendered && numTendered > 0 ? paidAmount - numTendered : 0;

  // Passenger phone options for 1-click selection in Counter Cash Collection
  const passengerPhoneOptions = React.useMemo(() => {
    const list: {
      seatLabel: string;
      name: string;
      phone: string;
      type: string;
      hasWhatsapp: boolean;
      isGuardian?: boolean;
    }[] = [];

    (passengers || []).forEach((p, idx) => {
      const sObj = (allCurrentSeats || []).find((s) => s.seatId === p.seatId);
      const seatLabel = sObj?.seatNumber || (sObj as any)?.seat_number || p.seatNumber || (p.seatId?.includes('-') ? p.seatId.split('-').pop() : `সিট ${idx + 1}`);
      const cleanPhone = (p.passengerPhone || '').trim();
      if (cleanPhone) {
        list.push({
          seatLabel: String(seatLabel).toUpperCase(),
          name: p.passengerName || `যাত্রী ${idx + 1}`,
          phone: cleanPhone,
          type: p.passengerType || 'STUDENT',
          hasWhatsapp: p.phoneType === 'WHATSAPP' || p.hasWhatsapp !== false
        });
      }

      const gPhone = (p.guardianPhone || '').trim();
      if (gPhone && !list.some((item) => item.phone === gPhone)) {
        list.push({
          seatLabel: `${String(seatLabel).toUpperCase()} অভিভাবক`,
          name: `${p.passengerName || `যাত্রী ${idx + 1}`}-এর অভিভাবক`,
          phone: gPhone,
          type: 'GUARDIAN',
          hasWhatsapp: p.guardianPhoneType === 'WHATSAPP' || p.guardianHasWhatsapp !== false,
          isGuardian: true
        });
      }
    });

    return list;
  }, [passengers, allCurrentSeats]);

  const uniquePassengerPhones = React.useMemo(() => {
    return Array.from(new Set(passengerPhoneOptions.map((p) => p.phone)));
  }, [passengerPhoneOptions]);

  // Auto-fill passenger phone on mount/switch to Hand Cash if senderRef is empty
  React.useEffect(() => {
    if (paymentMethod === 'HAND_CASH') {
      if (!senderRef || senderRef === 'কাউন্টার নগদ ক্যাশ' || senderRef === 'CASH-COUNTER' || senderRef === 'CASH-COUNTER-OFFICE') {
        if (passengerPhoneOptions.length > 0 && passengerPhoneOptions[0].phone) {
          onSenderRefChange(passengerPhoneOptions[0].phone);
        }
      }
    }
  }, [paymentMethod, passengerPhoneOptions, senderRef, onSenderRefChange]);

  // Smart percentage derivation: fixes floating-point rounding (e.g. 25% of 550 = 138 Tk => exactly 25%, never 25.1%)
  const smartPercentages = React.useMemo(() => {
    if (netAmount <= 0 || paidAmount <= 0) return { paid: '0', due: '100' };
    if (paidAmount >= netAmount) return { paid: '100', due: '0' };

    // 1. If an explicit percentage was chosen or typed and matches the integer rounded amount:
    if (chosenExplicitPct !== null && chosenExplicitPct >= 0 && chosenExplicitPct <= 100) {
      if (Math.round((netAmount * chosenExplicitPct) / 100) === paidAmount) {
        const pStr = Number.isInteger(chosenExplicitPct)
          ? String(chosenExplicitPct)
          : String(parseFloat(chosenExplicitPct.toFixed(2)));
        const dNum = parseFloat((100 - chosenExplicitPct).toFixed(2));
        const dStr = Number.isInteger(dNum) ? String(dNum) : String(dNum);
        return { paid: pStr, due: dStr };
      }
    }

    const rawRatio = (paidAmount / netAmount) * 100;
    const roundedInt = Math.round(rawRatio);

    // 2. Check if rounding to nearest integer percentage yields this exact paid amount:
    // e.g. 550 * 25 / 100 = 137.5 -> 138. 138 / 550 * 100 = 25.0909 -> exactly 25%!
    if (Math.round((netAmount * roundedInt) / 100) === paidAmount || Math.abs(rawRatio - roundedInt) < 0.25) {
      return { paid: String(roundedInt), due: String(100 - roundedInt) };
    }

    // 3. Check clean .5 percentage (e.g. 12.5%, 17.5%, 37.5%)
    const roundedHalf = Math.round(rawRatio * 2) / 2;
    if (Math.abs(rawRatio - roundedHalf) < 0.15 && Math.round((netAmount * roundedHalf) / 100) === paidAmount) {
      const dNum = parseFloat((100 - roundedHalf).toFixed(1));
      return { paid: String(roundedHalf), due: String(dNum) };
    }

    const formatted = parseFloat(rawRatio.toFixed(1));
    const dueFormatted = parseFloat((100 - formatted).toFixed(1));
    return { paid: String(formatted), due: String(dueFormatted) };
  }, [paidAmount, netAmount, chosenExplicitPct]);

  const displayPaidPct = smartPercentages.paid;
  const displayDuePct = smartPercentages.due;

  const applyPercentage = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct));
    setChosenExplicitPct(clamped);
    const targetPaid = Math.round((netAmount * clamped) / 100);
    onPaidAmountChange(targetPaid);
  };

  const handleCustomPctInputChange = (val: string) => {
    setCustomPctInput(val);
    if (val.trim() === '') {
      setChosenExplicitPct(null);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      applyPercentage(num);
    }
  };

  const handlePaidPctInputChange = (val: string) => {
    setPaidPctInput(val);
    if (val.trim() === '') {
      setChosenExplicitPct(null);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      applyPercentage(num);
    }
  };

  const handleDuePctInputChange = (val: string) => {
    setDuePctInput(val);
    if (val.trim() === '') {
      setChosenExplicitPct(null);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const clampedDue = Math.min(100, Math.max(0, num));
      const targetPaid = Math.max(0, netAmount - Math.round((netAmount * clampedDue) / 100));
      setChosenExplicitPct(100 - clampedDue);
      onPaidAmountChange(targetPaid);
    }
  };

  // Pre-fill senderRef from 1st passenger mobile if currently blank or default placeholder
  React.useEffect(() => {
    const pPhone = passengers[0]?.passengerPhone?.trim();
    if (paymentMethod === 'HAND_CASH') {
      if (pPhone && (!senderRef || senderRef === 'কাউন্টার নগদ ক্যাশ' || senderRef === 'CASH-COUNTER' || senderRef === 'CASH-COUNTER-OFFICE')) {
        onSenderRefChange(pPhone);
      }
    } else if (!senderRef && pPhone) {
      onSenderRefChange(pPhone);
    }
  }, [passengers, paymentMethod]);

  return (
    <div className="space-y-5">
      {/* Discount & Fare Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black">
                {language === 'bn' ? 'ছাড় ও টিকিট মূল্য নির্ধারণ' : 'Discounts & Fare Breakdown'}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'কুপন কোড বা অনুমোদিত ছাড় প্রয়োগ করুন — শুধুমাত্র কাউন্টার স্টাফ ও প্রশাসনের জন্য'
                  : 'Apply coupon codes or authorized discounts (staff/admin only)'}
              </p>
            </div>
            <Badge variant="primary" className="font-mono text-xs font-bold">
              {language === 'bn' ? 'মোট: ' : 'Total: '}{formatCurrency(grossAmount)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Discount toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5 cursor-pointer" onClick={() => onDiscountChange({ isDiscountApplied: !isDiscountApplied })}>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'টিকিটের মূল্য ম্যানুয়ালি ছাড় / কম রাখা হয়েছে কি?' : 'Is Ticket Fare Discounted / Less?'}</span>
                {isDiscountApplied && <Badge variant="primary" className="text-[10px] font-bold">Active</Badge>}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'ছাড় দিলে অবশ্যই অনুমোদনকারীর রেফারেন্স দিতে হবে'
                  : 'A reference or authorizer name is required when applying a discount'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDiscountChange({ isDiscountApplied: !isDiscountApplied })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isDiscountApplied ? 'bg-blue-600' : 'bg-slate-300'}`}
              aria-pressed={isDiscountApplied}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform ${isDiscountApplied ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {isDiscountApplied && (
            <div className="p-4 sm:p-5 bg-blue-50/50 dark:bg-blue-950/30 rounded-3xl border border-blue-200 dark:border-blue-800/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'ছাড়ের ধরণ (Discount Type)' : 'Discount Type'}
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={discountType === 'FIXED' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onDiscountChange({ discountType: 'FIXED' })}
                      className="flex-1 rounded-xl font-bold cursor-pointer"
                    >
                      {language === 'bn' ? 'নির্দিষ্ট টাকা (Fixed ৳)' : 'Fixed ৳'}
                    </Button>
                    <Button
                      type="button"
                      variant={discountType === 'PERCENTAGE' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onDiscountChange({ discountType: 'PERCENTAGE' })}
                      className="flex-1 rounded-xl font-bold"
                    >
                      {language === 'bn' ? 'শতাংশ (Percentage %)' : 'Percentage %'}
                    </Button>
                  </div>
                </div>

                <Input
                  label={language === 'bn' ? (discountType === 'FIXED' ? 'ছাড়ের পরিমাণ (টাকা) *' : 'ছাড়ের হার (%) *') : (discountType === 'FIXED' ? 'Discount Amount (৳) *' : 'Discount Rate (%) *')}
                  type="number"
                  min="0"
                  value={discountRate || ''}
                  onChange={(e) => onDiscountChange({ discountRate: Number(e.target.value) })}
                  placeholder="0"
                  required
                />

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'অনুমোদনকারী রেফারেন্স (কার নির্দেশে ছাড় দেওয়া হলো) *' : 'Authorized Reference (Who Approved the Discount) *'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={authorizerPresets.includes(discountReference) ? discountReference : (discountReference ? 'CUSTOM' : '')}
                      onChange={(e) => {
                        if (e.target.value !== 'CUSTOM') onDiscountChange({ discountReference: e.target.value });
                      }}
                      className="px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">{language === 'bn' ? '-- পদবী নির্বাচন করুন --' : '-- Select Authorizer Role --'}</option>
                      {authorizerPresets.map((preset) => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))}
                      <option value="CUSTOM">{language === 'bn' ? '✍️ অন্যান্য (ম্যানুয়ালি লিখুন / Custom)' : '✍️ Custom / Type Manually'}</option>
                    </select>

                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'অনুমোদনকারীর নাম বা রেফারেন্স লিখুন *' : 'Enter Authorizer Name or Reference *'}
                      value={discountReference}
                      onChange={(e) => onDiscountChange({ discountReference: e.target.value })}
                      className="px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'bn' ? 'ড্রপডাউন থেকে দ্রুত পদবী বাছাই করতে পারেন অথবা যেকোনো নাম/রেফারেন্স টাইপ করতে পারেন।' : 'Select a preset role or write custom reference details.'}
                  </p>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'ছাড়ের কারণ / বিবরণ (ঐচ্ছিক)' : 'Discount Reason / Details (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'যেমন: দরিদ্র ও মেধাবী শিক্ষার্থী সহায়তা, ভাই-বোন একসাথে বুকিং ছাড় (ঐচ্ছিক)' : 'e.g. Financial Subsidy, Sibling Bundle (Optional)'}
                    value={discountReason}
                    onChange={(e) => onDiscountChange({ discountReason: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Coupon section */}
          <div className="p-4 sm:p-5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-3xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <TicketPercent className="w-4 h-4 text-emerald-600" />
                {language === 'bn' ? 'কুপন কোড প্রয়োগ' : 'Apply Coupon Code'}
              </span>
              <button
                type="button"
                onClick={() => onSetStaffCouponModalOpen(true)}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Info className="w-3 h-3" />
                {language === 'bn' ? 'সক্রিয় কুপন তালিকা (স্টাফ)' : 'Active Coupons (Staff)'}
              </button>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-300 block truncate">{appliedCoupon.code}</span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{appliedCoupon.label}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCouponRemove();
                    setCouponInput('');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer shrink-0"
                >
                  {language === 'bn' ? 'কুপন সরান ✕' : 'Remove ✕'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder={language === 'bn' ? 'কুপন কোড লিখুন (যেমন: RAJSHAHI50)' : 'Enter coupon code (e.g. RAJSHAHI50)'}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold uppercase border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="success"
                  isLoading={couponApplying}
                  onClick={() => onCouponApply(couponInput)}
                  className="rounded-xl font-bold"
                >
                  {language === 'bn' ? 'কুপন প্রয়োগ করুন' : 'Apply Coupon'}
                </Button>
              </div>
            )}

            {couponMessage && (
              <p className={`text-[11px] font-bold px-3 py-2 rounded-xl border ${
                couponMessage.includes('সফল') || couponMessage.toLowerCase().includes('valid') || couponMessage.toLowerCase().includes('applied')
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}>
                {couponMessage}
              </p>
            )}
          </div>

          {/* Fare summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>{language === 'bn' ? 'মোট টিকিট মূল্য (Gross Fare):' : 'Gross Fare:'}</span>
              <span className="font-mono font-bold">{formatCurrency(grossAmount)}</span>
            </div>
            {isDiscountApplied && discountRate > 0 && (
              <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
                <span>{language === 'bn' ? `অনুমোদিত ছাড় (Less${discountReference ? ` - রেফ: ${discountReference}` : ''}):` : 'Total Discount:'}</span>
                <span className="font-mono font-bold">- {formatCurrency(Math.min(discountType === 'PERCENTAGE' ? Math.round((grossAmount * discountRate) / 100) : discountRate, grossAmount))}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-base font-black text-slate-900 dark:text-white">
              <span>{language === 'bn' ? 'চূড়ান্ত প্রদেয় নেট ভাড়া (Net Amount):' : 'Final Net Amount:'}</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(netAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Collection Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black">
                {language === 'bn' ? 'পেমেন্ট কালেকশন ও চালান তৈরি' : 'Payment Collection & Ticket Generation'}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'নেট ভাড়া ({formatCurrency(netAmount)}) এর বিপরীতে প্রাপ্ত টাকা ও প্রেরক তথ্য লিখুন'
                  : 'Record the collected amount and sender details against the net fare'}
              </p>
            </div>
            <Badge variant="success" className="font-mono text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {language === 'bn' ? 'নিরাপদ লেনদেন' : 'Secure'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
          {/* Payment method grid */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {language === 'bn' ? 'পেমেন্ট মেথড নির্বাচন করুন *' : 'Select Payment Method *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {PAYMENT_CHANNELS.map((m) => {
                const isSelected = paymentMethod === m.id;
                const LogoComp = m.Logo;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onPaymentMethodChange(m.id);
                      if (m.id === 'BANK_TRANSFER') onSenderSourceTypeChange('BANK_TO_MFS');
                      else if (m.id === 'HAND_CASH') onSenderSourceTypeChange('CASH_RECEIPT');
                      else onSenderSourceTypeChange('MFS_WALLET');
                    }}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? `${m.activeBorder} ${m.activeBg} ring-2 ${m.activeRing} shadow-sm font-black`
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <DynamicPaymentLogo method={m.id} customUrl={customLogos?.[m.id]} className="w-8 h-8 shrink-0 drop-shadow-xs" />
                    <div className="text-center leading-tight">
                      <span className={`block text-xs font-black ${isSelected ? m.activeText : ''}`}>{m.name}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">{m.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amounts, Due Option & Quick Settlement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'bn' ? 'টাকা পরিশোধ ও বকেয়া নির্ধারণ (Payment & Due Settlement) *' : 'Payment Settlement Mode *'}
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                মোট প্রদেয়: {formatCurrency(netAmount)}
              </span>
            </div>

            {/* 3-Way Mode Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Full Payment */}
              <div
                onClick={() => onPaidAmountChange(netAmount)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  paidAmount === netAmount
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400/40 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                    ✓ সম্পূর্ণ পরিশোধ
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded">
                    ০৳ বকেয়া
                  </span>
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(netAmount)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  যাত্রী পুরো টাকা এখনই পরিশোধ করেছেন
                </p>
              </div>

              {/* Card 2: Partial Payment with Due */}
              <div
                onClick={() => {
                  if (paidAmount === netAmount || paidAmount === 0) {
                    onPaidAmountChange(Math.round(netAmount / 2));
                  }
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  paidAmount > 0 && paidAmount < netAmount
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                    আংশিক জমা + বকেয়া
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">
                    বকেয়া থাকবে
                  </span>
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {paidAmount > 0 && paidAmount < netAmount ? formatCurrency(paidAmount) : `৫০% (${formatCurrency(Math.round(netAmount / 2))})`}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  কিছু টাকা অগ্রিম, বাকি টাকা পরে দিবে
                </p>
              </div>

              {/* Card 3: Full Due */}
              <div
                onClick={() => onPaidAmountChange(0)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  paidAmount === 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-400/40 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                    ⚠️ সম্পূর্ণ বকেয়া
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded">
                    ১০০% Due
                  </span>
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                  ০ ৳ জমা
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  কোনো অগ্রিম ছাড়া সম্পূর্ণ বকেয়া বুকিং
                </p>
              </div>
            </div>

            {/* Dual Editable Inputs: Paid & Due (Both Amount ৳ and Percentage % with Instant Sync) */}
            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/70 rounded-3xl border-2 border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>✍️ ম্যানুয়াল জমা ও বকেয়া এন্ট্রি (টাকা ৳ অথবা % লিখে দিন)</span>
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                  মোট ভাড়া: {formatCurrency(netAmount)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Paid (Amount + Percentage) */}
                <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800/80 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100 dark:border-emerald-950">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      {language === 'bn' ? 'জমা দেওয়ার হিসাব (Paid Amount)' : 'Paid Amount'}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/70 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      {displayPaidPct}% পরিশোধ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Paid Taka ৳ */}
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'জমা টাকা (৳) *' : 'Paid (৳) *'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={netAmount}
                          value={paidAmount}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setChosenExplicitPct(null);
                            if (raw === '') {
                              onPaidAmountChange(0);
                              return;
                            }
                            const val = Number(raw);
                            if (!isNaN(val)) {
                              onPaidAmountChange(Math.min(netAmount, Math.max(0, val)));
                            }
                          }}
                          className="w-full pl-3 pr-12 py-2.5 text-base font-black bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-2 border-slate-300 dark:border-slate-700 rounded-xl shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                          placeholder="0"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-black text-slate-500 dark:text-slate-400 select-none">BDT</span>
                      </div>
                    </div>

                    {/* Paid Percentage % */}
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'পার্সেন্টেজ (%)' : 'Percentage (%)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={activePctField === 'PAID' ? paidPctInput : displayPaidPct}
                          onFocus={() => {
                            setActivePctField('PAID');
                            setPaidPctInput(displayPaidPct);
                          }}
                          onBlur={() => setActivePctField(null)}
                          onChange={(e) => handlePaidPctInputChange(e.target.value)}
                          className="w-full pl-3 pr-9 py-2.5 text-base font-black bg-emerald-50/30 dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none font-mono"
                          placeholder="25"
                        />
                        <span className="absolute right-3 top-2 text-base font-black text-emerald-600 dark:text-emerald-400 select-none">%</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block truncate">
                    {paidAmount >= netAmount ? '✓ সম্পূর্ণ ১০০% পরিশোধিত' : `মোট ভাড়ার ${displayPaidPct}% জমা হচ্ছে (${formatCurrency(paidAmount)})`}
                  </span>
                </div>

                {/* Column 2: Due (Amount + Percentage) */}
                <div className={`p-4 bg-white dark:bg-slate-950 rounded-2xl border-2 space-y-3 shadow-2xs ${
                  dueAmount > 0 ? 'border-rose-300 dark:border-rose-800/80' : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900">
                    <span className={`text-xs font-black flex items-center gap-2 ${
                      dueAmount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${dueAmount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {language === 'bn' ? 'বকেয়া টাকার হিসাব (Remaining Due)' : 'Remaining Due'}
                    </span>
                    <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border ${
                      dueAmount > 0
                        ? 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/70 border-rose-200 dark:border-rose-800'
                        : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}>
                      {displayDuePct}% বকেয়া
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Due Taka ৳ */}
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'বকেয়া টাকা (৳)' : 'Due (৳)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={netAmount}
                          value={dueAmount}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setChosenExplicitPct(null);
                            if (raw === '') {
                              onPaidAmountChange(netAmount);
                              return;
                            }
                            const val = Number(raw);
                            if (!isNaN(val)) {
                              const validDue = Math.min(netAmount, Math.max(0, val));
                              onPaidAmountChange(netAmount - validDue);
                            }
                          }}
                          className={`w-full pl-3 pr-12 py-2.5 text-base font-black bg-white dark:bg-slate-900 border-2 rounded-xl shadow-xs focus:ring-2 focus:outline-none ${
                            dueAmount > 0
                              ? 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                              : 'text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                          }`}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-black text-slate-500 dark:text-slate-400 select-none">BDT</span>
                      </div>
                    </div>

                    {/* Due Percentage % */}
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'পার্সেন্টেজ (%)' : 'Percentage (%)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={activePctField === 'DUE' ? duePctInput : displayDuePct}
                          onFocus={() => {
                            setActivePctField('DUE');
                            setDuePctInput(displayDuePct);
                          }}
                          onBlur={() => setActivePctField(null)}
                          onChange={(e) => handleDuePctInputChange(e.target.value)}
                          className={`w-full pl-3 pr-9 py-2.5 text-base font-black bg-rose-50/20 dark:bg-slate-900 border-2 rounded-xl shadow-xs focus:ring-2 focus:outline-none font-mono ${
                            dueAmount > 0
                              ? 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                              : 'text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                          }`}
                          placeholder="75"
                        />
                        <span className={`absolute right-3 top-2 text-base font-black select-none ${dueAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>%</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold block truncate ${dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                    {dueAmount > 0 ? `⚠️ বাকি ${displayDuePct}% বকেয়া থাকবে (${formatCurrency(dueAmount)})` : '✓ কোনো বকেয়া নেই (০৳)'}
                  </span>
                </div>

                <div className="md:col-span-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span>💡</span>
                    <span><strong>সহজ নিয়ম:</strong> টাকা (৳) অথবা পার্সেন্টেজ (%) — যেকোনো ঘরে লিখলেই অপর সবগুলো নিজে থেকেই নির্ভুল সমন্বয় হয়ে যাবে।</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                    মোট: {formatCurrency(netAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Percentage (%) Live Calculator & Quick Shortcuts */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-slate-50/90 dark:from-slate-900/90 dark:via-indigo-950/30 dark:to-slate-900/90 rounded-3xl border-2 border-indigo-200/90 dark:border-indigo-800/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base font-black shadow-xs">
                    %
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {language === 'bn' ? 'সরাসরি পার্সেন্টেজ (%) লিখে দিন (যেমন: ২৫% বা ১৭%)' : 'Type Custom Percentage (%)'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {language === 'bn'
                        ? 'আপনার পছন্দমতো যেকোনো সংখ্যা লিখুন — সিস্টেম স্বয়ংক্রিয়ভাবে জমা ও বকেয়া টাকার হিসাব করে নিবে'
                        : 'Type any percentage (e.g. 25, 17, 50) — paid and due will calculate instantly'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-black text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    {displayPaidPct}% জমা / {displayDuePct}% বকেয়া
                  </span>
                </div>
              </div>

              {/* Prominent Custom % Input Bar with Instant Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white dark:bg-slate-950 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
                <div className="sm:col-span-5 flex items-center gap-3">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 shrink-0">
                    {language === 'bn' ? 'কত % দিবেন:' : 'Enter %:'}
                  </label>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={activePctField === 'CUSTOM' ? customPctInput : displayPaidPct}
                      onFocus={() => {
                        setActivePctField('CUSTOM');
                        setCustomPctInput(displayPaidPct);
                      }}
                      onBlur={() => setActivePctField(null)}
                      onChange={(e) => handleCustomPctInputChange(e.target.value)}
                      placeholder="25"
                      className="w-full pl-3.5 pr-10 py-2.5 text-lg font-black bg-white dark:bg-slate-900 text-indigo-950 dark:text-white border-2 border-indigo-500 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-base font-black text-indigo-600 dark:text-indigo-400 select-none">%</span>
                  </div>
                </div>

                {/* Live Real-time Explanation Banner */}
                <div className="sm:col-span-7 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="text-base">🎯</span>
                  <span className="leading-snug">
                    {language === 'bn' ? (
                      <>
                        <strong className="text-indigo-600 dark:text-indigo-400 text-sm">{displayPaidPct}%</strong> জমা = <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(paidAmount)}</strong> | বাকি <strong className="text-rose-600 dark:text-rose-400 text-sm">{displayDuePct}%</strong> বকেয়া = <strong className="text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(dueAmount)}</strong>
                      </>
                    ) : (
                      <>
                        <strong className="text-indigo-600 text-sm">{displayPaidPct}%</strong> Paid = <strong className="text-emerald-600 text-sm">{formatCurrency(paidAmount)}</strong> | Remaining <strong className="text-rose-600 text-sm">{displayDuePct}%</strong> Due = <strong className="text-rose-600 text-sm">{formatCurrency(dueAmount)}</strong>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Quick shortcut pills (including 17% sample & common presets) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-950/60">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 mr-1">
                  {language === 'bn' ? 'এক ক্লিকে প্রিসেট বাটন:' : 'Quick Shortcuts:'}
                </span>
                {[
                  { pct: 0, label: '০% (ফুল বকেয়া)' },
                  { pct: 10, label: '১০%' },
                  { pct: 17, label: '১৭% (কাস্টম)' },
                  { pct: 20, label: '২০%' },
                  { pct: 25, label: '২৫%' },
                  { pct: 33, label: '৩৩%' },
                  { pct: 50, label: '৫০% (অর্ধেক)' },
                  { pct: 75, label: '৭৫%' },
                  { pct: 100, label: '১০০% (ফুল ক্যাশ)' },
                ].map((item) => {
                  const isSelected = displayPaidPct === String(item.pct);
                  return (
                    <button
                      key={item.pct}
                      type="button"
                      onClick={() => {
                        applyPercentage(item.pct);
                        setCustomPctInput(String(item.pct));
                      }}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-400/50 scale-105'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* When Due is active: Due Payment Promise Date Section */}
            {dueAmount > 0 && (
              <div className="p-4 sm:p-5 bg-amber-50/80 dark:bg-amber-950/40 rounded-3xl border-2 border-amber-300 dark:border-amber-700 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📅</span>
                    <div>
                      <div className="text-xs font-black text-amber-950 dark:text-amber-100 uppercase tracking-wider">
                        বকেয়া পরিশোধের অঙ্গীকার ও শেষ সময় (Due Payment Promise Date) *
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        যাত্রী অবশিষ্ট {formatCurrency(dueAmount)} টাকা কবে পরিশোধ করবেন তা নির্বাচন করুন
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-amber-300">
                    বকেয়া: {formatCurrency(dueAmount)}
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDuePromiseDateChange?.('যাত্রার দিন বোর্ডিং কাউন্টারে')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      duePromiseDate === 'যাত্রার দিন বোর্ডিং কাউন্টারে'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                        : 'bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    🚌 যাত্রার দিন বোর্ডিং কাউন্টারে
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dateStr = tomorrow.toISOString().split('T')[0];
                      onDuePromiseDateChange?.(dateStr);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    📅 আগামীকাল
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuePromiseDateChange?.('যাত্রার ২৪ ঘণ্টা আগে')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    🕒 যাত্রার ২৪ ঘণ্টা আগে
                  </button>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-1">
                      বকেয়া পরিশোধের তারিখ / বিবরণ *
                    </label>
                    <input
                      type="text"
                      value={duePromiseDate || ''}
                      onChange={(e) => onDuePromiseDateChange?.(e.target.value)}
                      placeholder="যেমন: ২০২৬-০৯-১০ বা যাত্রার দিন কাউন্টারে"
                      className="w-full px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-amber-300 dark:border-amber-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-1">
                      বকেয়া সংক্রান্ত বিশেষ নোট (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={dueNote || ''}
                      onChange={(e) => onDueNoteChange?.(e.target.value)}
                      placeholder="যেমন: বোর্ডিংয়ের সময় টাকা দিয়ে টিকিট নেবে"
                      className="w-full px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-amber-300 dark:border-amber-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sender source & Challan details */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/80 rounded-3xl border-2 border-slate-200 dark:border-slate-800 space-y-5">
            {paymentMethod === 'HAND_CASH' ? (
              /* Dedicated Counter Cash Collection & Challan Box */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800/80 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                        <CashMoneyLogo className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                          <span>কাউন্টার সরাসরি নগদ ক্যাশ কালেকশন</span>
                          <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono px-2 py-0.5 rounded-full font-bold">
                            ডিফল্ট মেথড
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                          যাত্রী কাউন্টারে সরাসরি নগদ টাকা জমা দিচ্ছেন। চালান ও মানি রিসিট প্রস্তুত হবে।
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" className="font-bold text-xs shrink-0">
                      ✓ ক্যাশ অ্যাক্টিভ
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                        {language === 'bn' ? 'যাত্রীর মোবাইল নম্বর / প্রেরক ক্যাশ রেফারেন্স *' : 'Passenger Mobile / Cash Reference *'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        {senderRef && passengerPhoneOptions.some((p) => p.phone === senderRef) ? (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            {language === 'bn' ? 'ফর্মের নম্বর অটো-সংযুক্ত' : 'Auto-filled from form'}
                          </span>
                        ) : senderRef && senderRef !== 'কাউন্টার নগদ ক্যাশ' ? (
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                            {language === 'bn' ? 'কাস্টম / সম্পাদিত নম্বর' : 'Custom entered'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Quick Selection Pills: Render for all passengers and seats from the form */}
                    {passengerPhoneOptions.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                          <span>{language === 'bn' ? 'ফর্মে দেওয়া যাত্রীদের নম্বর (১-ক্লিকে নির্বাচন করুন):' : 'Passenger form numbers (1-click select):'}</span>
                          <span className="text-[10px] text-slate-500">
                            {passengerPhoneOptions.length > 1
                              ? (language === 'bn' ? `${passengerPhoneOptions.length}টি সিট/নম্বর উপলব্ধ` : `${passengerPhoneOptions.length} seats/phones`)
                              : (language === 'bn' ? '১টি নম্বর প্রাপ্ত' : '1 phone available')}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          {passengerPhoneOptions.map((opt, idx) => {
                            const isSelected = senderRef === opt.phone;
                            return (
                              <button
                                key={`${opt.phone}-${idx}`}
                                type="button"
                                onClick={() => onSenderRefChange(opt.phone)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/50 shadow-sm scale-105'
                                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                                title={`${opt.seatLabel}: ${opt.name} (${opt.phone})`}
                              >
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black ${
                                  isSelected ? 'bg-emerald-700 text-white' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                }`}>
                                  {opt.seatLabel}
                                </span>
                                <span className="truncate max-w-[100px]">{opt.name}</span>
                                <span className="font-mono">{opt.phone}</span>
                                {opt.hasWhatsapp && (
                                  <span title="WhatsApp সক্রিয়" className="shrink-0">
                                    <WhatsAppLogo className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 text-white" />}
                              </button>
                            );
                          })}

                          {/* If multiple unique phones, provide an option to combine them */}
                          {uniquePassengerPhones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onSenderRefChange(uniquePassengerPhones.join(', '))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border shadow-2xs ${
                                senderRef === uniquePassengerPhones.join(', ')
                                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/50'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                              }`}
                              title="সব যাত্রীর নম্বর একসাথে রেফারেন্সে যোগ করুন"
                            >
                              <span>🔗 সব নম্বর একসাথে ({uniquePassengerPhones.length} টি)</span>
                            </button>
                          )}

                          {/* Counter cash preset */}
                          <button
                            type="button"
                            onClick={() => onSenderRefChange('কাউন্টার নগদ ক্যাশ')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              senderRef === 'কাউন্টার নগদ ক্যাশ'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            🏢 কাউন্টার ক্যাশ
                          </button>

                          {/* Clear / New Custom Button */}
                          {senderRef && (
                            <button
                              type="button"
                              onClick={() => onSenderRefChange('')}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 cursor-pointer transition-colors"
                              title="কাস্টম নতুন নম্বর লিখতে এটি ক্লিয়ার করুন"
                            >
                              ✕ ক্লিয়ার
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Free Editable Phone / Cash Reference Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="যেমন: যাত্রীর মোবাইল নম্বর বা মানি রিসিট নং (সরাসরি পরিবর্তনযোগ্য) *"
                        value={senderRef}
                        onChange={(e) => onSenderRefChange(e.target.value)}
                        className="w-full pl-3.5 pr-20 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold border-2 border-emerald-400 dark:border-emerald-600 rounded-xl shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                        required
                      />
                      {senderRef && (
                        <button
                          type="button"
                          onClick={() => onSenderRefChange('')}
                          className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="ক্লিয়ার করুন"
                        >
                          ✕ ক্লিয়ার
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-1">
                      <span>
                        💡 <strong>টিপস:</strong> ফর্মের নম্বর স্বয়ংক্রিয়ভাবে বসেছে। আপনি চাইলে ওপরের বাটন ক্লিক করে পরিবর্তন করতে পারেন, অথবা সরাসরি বক্সে যেকোনো কাস্টম নম্বর টাইপ বা পরিবর্তন করতে পারেন।
                      </span>
                      {senderRef && (
                        <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          রেফারেন্স: {senderRef}
                        </span>
                      )}
                    </div>

                    {/* Real-time Cash Tender & Change Due Calculator */}
                    {paidAmount > 0 && (
                      <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-700/80 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                            <span>{language === 'bn' ? 'নগদ গ্রহণ ও ফেরত হিসাব (Tender & Change Calculator)' : 'Cash Tender & Change Due'}</span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-500">
                            প্রদেয় ক্যাশ: {formatCurrency(paidAmount)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          {/* Tendered input */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              {language === 'bn' ? 'গ্রাহকের দেওয়া নগদ নোট (Tendered) ৳' : 'Received Cash Amount (৳)'}
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={tenderedAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTenderedAmount(val === '' ? '' : Number(val));
                                }}
                                placeholder={String(paidAmount)}
                                className="w-full pl-3 pr-12 py-2 text-base font-black font-mono bg-emerald-50/40 dark:bg-slate-950 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                              <span className="absolute right-3 top-2 text-xs font-black text-slate-500 font-mono">BDT</span>
                            </div>
                          </div>

                          {/* Instant Change Indicator */}
                          <div className={`p-3 rounded-xl border-2 flex flex-col justify-center items-center text-center transition-all ${
                            changeDue > 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-xs'
                              : shortageAmount > 0
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-100'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {changeDue > 0
                                ? (language === 'bn' ? 'যাত্রীকে ফেরত দিতে হবে' : 'Change Due')
                                : shortageAmount > 0
                                ? (language === 'bn' ? 'আরও গ্রহণ করতে হবে' : 'Shortage')
                                : (language === 'bn' ? 'সঠিক নগদ গ্রহণ' : 'Exact Amount')}
                            </span>
                            <span className={`text-xl font-black font-mono mt-0.5 ${
                              changeDue > 0 ? 'text-emerald-600 dark:text-emerald-400' : shortageAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
                            }`}>
                              {changeDue > 0 ? `৳${changeDue}` : shortageAmount > 0 ? `৳${shortageAmount}` : '৳০ (Exact)'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Tender Note Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500 font-bold mr-1">দ্রুত নোট:</span>
                          <button
                            type="button"
                            onClick={() => setTenderedAmount(paidAmount)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            সঠিক (৳{paidAmount})
                          </button>
                          {[500, 1000, 1500, 2000, 3000, 5000].filter(n => n >= paidAmount).slice(0, 4).map(note => (
                            <button
                              key={note}
                              type="button"
                              onClick={() => setTenderedAmount(note)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-black font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              ৳{note}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Digital / Bank / MFS Channels */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {language === 'bn' ? 'প্রেরকের পেমেন্ট মাধ্যম / চ্যানেল নির্বাচন করুন *' : 'Sender Payment Source / Channel *'}
                  </label>
                  <Badge variant="primary" className="text-[10px] font-bold">
                    {language === 'bn' ? 'বাধ্যতামূলক' : 'Required'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* MFS wallet card */}
                  <div
                    onClick={() => onSenderSourceTypeChange('MFS_WALLET')}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                      senderSourceType === 'MFS_WALLET'
                        ? paymentMethod === 'BKASH'
                          ? 'bg-[#E2136E]/10 border-[#E2136E] shadow-md shadow-[#E2136E]/15 ring-2 ring-[#E2136E]/40'
                          : paymentMethod === 'NAGAD'
                          ? 'bg-[#F7941D]/10 border-[#F7941D] shadow-md shadow-[#F7941D]/15 ring-2 ring-[#F7941D]/40'
                          : paymentMethod === 'ROCKET'
                          ? 'bg-[#8C3494]/10 border-[#8C3494] shadow-md shadow-[#8C3494]/15 ring-2 ring-[#8C3494]/40'
                          : 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="shrink-0">
                      {paymentMethod === 'BKASH' ? (
                        <BkashLogo className="w-11 h-11 drop-shadow-md" />
                      ) : paymentMethod === 'NAGAD' ? (
                        <NagadLogo className="w-11 h-11 drop-shadow-md" />
                      ) : paymentMethod === 'ROCKET' ? (
                        <RocketLogo className="w-11 h-11 drop-shadow-md" />
                      ) : (
                        <BankTransferLogo className="w-11 h-11 drop-shadow-md" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {paymentMethod === 'BKASH'
                            ? (language === 'bn' ? 'বিকাশ ওয়ালেট নম্বর' : 'bKash Wallet Number')
                            : paymentMethod === 'NAGAD'
                            ? (language === 'bn' ? 'নগদ ওয়ালেট নম্বর' : 'Nagad Wallet Number')
                            : paymentMethod === 'ROCKET'
                            ? (language === 'bn' ? 'রকেট ওয়ালেট নম্বর' : 'Rocket Wallet Number')
                            : (language === 'bn' ? 'সরাসরি ব্যাংক ডিপোজিট' : 'Direct Bank Deposit')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {language === 'bn' ? 'গ্রাহকের নিজস্ব ওয়ালেট নম্বর' : 'Customer mobile wallet number'}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      senderSourceType === 'MFS_WALLET' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {senderSourceType === 'MFS_WALLET' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Bank to MFS card */}
                  <div
                    onClick={() => onSenderSourceTypeChange('BANK_TO_MFS')}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                      senderSourceType === 'BANK_TO_MFS'
                        ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-400/40'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center -space-x-2 shrink-0">
                      <IslamiBankLogo className="w-10 h-10 drop-shadow-sm z-30" />
                      <DbblLogo className="w-10 h-10 drop-shadow-sm z-20" />
                      <VisaMastercardLogo className="w-10 h-10 drop-shadow-sm z-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {language === 'bn' ? 'ব্যাংক অ্যাপ / কার্ড' : 'Internet Banking / Card'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        CellFin, NexusPay, Astha বা কার্ড
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      senderSourceType === 'BANK_TO_MFS' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                    }`}>
                      {senderSourceType === 'BANK_TO_MFS' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* MFS input */}
                {senderSourceType === 'MFS_WALLET' && (
                  <div className="space-y-2 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {paymentMethod === 'BKASH'
                          ? (language === 'bn' ? 'প্রেরকের বিকাশ মোবাইল নম্বর (১১ ডিজিট) *' : 'Sender bKash Mobile Number (11-digit) *')
                          : paymentMethod === 'NAGAD'
                          ? (language === 'bn' ? 'প্রেরকের নগদ মোবাইল নম্বর (১১ ডিজিট) *' : 'Sender Nagad Mobile Number (11-digit) *')
                          : paymentMethod === 'ROCKET'
                          ? (language === 'bn' ? 'প্রেরকের রকেট অ্যাকাউন্ট নম্বর (১১/১২ ডিজিট) *' : 'Sender Rocket Account Number *')
                          : (language === 'bn' ? 'প্রেরক নম্বর / রেফারেন্স *' : 'Sender Phone / Reference *')}
                      </label>
                      {senderRef && !/^01[3-9]\d{8}$/.test(senderRef.replace(/[\s-]/g, '')) ? (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                          ⚠️ {language === 'bn' ? 'সঠিক ১১ ডিজিট নম্বর লিখুন' : 'Invalid 11-digit BD Mobile'}
                        </span>
                      ) : senderRef && /^01[3-9]\d{8}$/.test(senderRef.replace(/[\s-]/g, '')) ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          ✅ {language === 'bn' ? 'নম্বর সঠিক' : 'Valid Number'}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1 flex items-center">
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold pointer-events-none select-none z-10">
                          {paymentMethod === 'BKASH' ? (
                            <BkashLogo className="w-4 h-4" />
                          ) : paymentMethod === 'NAGAD' ? (
                            <NagadLogo className="w-4 h-4" />
                          ) : paymentMethod === 'ROCKET' ? (
                            <RocketLogo className="w-4 h-4" />
                          ) : (
                            <BankTransferLogo className="w-4 h-4" />
                          )}
                          <span className="text-blue-600 dark:text-blue-400">+880</span>
                          <span className="text-[10px] text-slate-400 font-normal">(০৮৮)</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={11}
                          placeholder="017XXXXXXXX"
                          value={senderRef}
                          onChange={(e) => onSenderRefChange(cleanAndLimitPhoneNumber(e.target.value).slice(0, 11))}
                          className={`w-full pl-36 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold border rounded-xl shadow-2xs focus:ring-2 focus:outline-none ${
                            senderRef && !isValidBdMobile(senderRef)
                              ? 'border-rose-400 focus:ring-rose-400'
                              : 'border-slate-300 dark:border-slate-700/80 focus:ring-blue-500'
                          }`}
                          required
                        />
                      </div>

                      {passengers[0]?.passengerPhone && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onSenderRefChange(cleanAndLimitPhoneNumber(passengers[0].passengerPhone))}
                          className="rounded-xl text-xs font-bold shrink-0 bg-blue-50/50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          {language === 'bn' ? 'যাত্রীর নম্বর কপি' : 'Use Passenger Phone'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank to MFS input */}
                {senderSourceType === 'BANK_TO_MFS' && (
                  <div className="space-y-4 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'জনপ্রিয় ব্যাংক নির্বাচন করুন (অফিসিয়াল লোগোতে ক্লিক করুন) *' : 'Select Bank (Click Official Logo) *'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {BANK_OPTIONS.map((b) => {
                          const isSelected = selectedBankName === b.id;
                          const BankLogoComp = b.Logo;
                          return (
                            <div
                              key={b.id}
                              onClick={() => onSelectedBankChange(b.id)}
                              className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                                isSelected
                                  ? `${b.activeStyle} shadow-sm font-black`
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 hover:border-slate-300'
                              }`}
                            >
                              <BankLogoComp className="w-10 h-10 shrink-0 drop-shadow-xs" />
                              <div className="min-w-0 flex-1">
                                <span className="block text-xs font-black text-slate-800 dark:text-slate-200 truncate leading-tight">{b.name}</span>
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 font-mono ${b.badgeColor}`}>{b.app}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'প্রেরক অ্যাকাউন্ট / কার্ড নম্বর / ডিপোজিটর নাম *' : 'Sender Bank Account / Card Number / Depositor Name *'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'bn' ? 'যেমন: 2050XXXXXXXX বা প্রেরক অ্যাকাউন্ট নাম *' : 'e.g. 2050XXXXXXXX or Depositor Name *'}
                        value={senderRef}
                        onChange={(e) => onSenderRefChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TrxID */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'ট্রানজেকশন আইডি / TrxID (ঐচ্ছিক)' : 'Gateway Transaction ID (TrxID) (Optional)'}
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {language === 'bn' ? 'ঐচ্ছিক - না থাকলে ফাঁকা রাখুন' : 'Optional - Leave blank if not available'}
                </span>
              </div>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: BKASH9928X (ঐচ্ছিক)' : 'e.g. BKASH9928X (Optional)'}
                value={transactionId}
                onChange={(e) => onTransactionIdChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Final summary */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/70 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>{language === 'bn' ? 'টার্গেট বিশ্ববিদ্যালয়:' : 'Target University:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{targetUniversity}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>{language === 'bn' ? 'যাত্রী ও সিট তালিকা:' : 'Passengers & Seats:'}</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-right">
                {passengers.map((p) => `${p.passengerName || 'Unnamed'} (${allCurrentSeats.find((s) => s.seatId === p.seatId)?.seatNumber})`).join(', ')}
              </span>
            </div>
            {discountState.isDiscountApplied && (
              <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
                <span>{language === 'bn' ? 'অনুমোদিত ছাড় (Less):' : 'Discount / Less:'}</span>
                <span className="font-bold font-mono">
                  - {formatCurrency(Math.min(discountType === 'PERCENTAGE' ? Math.round((grossAmount * discountRate) / 100) : discountRate, grossAmount))} {discountReference ? `(রেফ: ${discountReference})` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>{language === 'bn' ? 'মোট নেট প্রদেয় বিল:' : 'Total Net Amount:'}</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(netAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span>{language === 'bn' ? 'জমা কালেকশন:' : 'Collected Cash/Digital:'}</span>
              <span className="font-bold font-mono">{formatCurrency(paidAmount)}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
                <span>{language === 'bn' ? 'বকেয়া থাকবে (Due):' : 'Remaining Due:'}</span>
                <span className="font-mono">{formatCurrency(dueAmount)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inline Validation / Submission Error Alert (Above Action Buttons) */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-400 dark:border-rose-600 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-100 text-sm shadow-md animate-pulse">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="block font-black text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300">
                {language === 'bn' ? '⚠️ বুকিং সম্পন্ন করার আগে সংশোধন করুন:' : 'Action Required:'}
              </span>
              <span className="font-bold text-sm mt-0.5 block">{errorMessage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onGoToStep && (errorMessage.includes('সিট') || errorMessage.includes('যাত্রী') || errorMessage.includes('Passenger') || errorMessage.includes('Seat') || errorMessage.includes('Guardian') || errorMessage.includes('Gender')) && (
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => onGoToStep(3)}
                className="rounded-xl font-black text-xs bg-white text-rose-700 hover:bg-rose-100 shadow-sm shrink-0 border border-rose-300 dark:bg-slate-900 dark:text-rose-300"
              >
                {language === 'bn' ? '← যাত্রী তথ্যে ফিরে যান (ধাপ ৩)' : '← Fix in Passenger Step 3'}
              </Button>
            )}
            {onSetErrorMessage && (
              <button
                type="button"
                onClick={() => onSetErrorMessage(null)}
                className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 font-black text-sm px-2 cursor-pointer"
                title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation - Spaced inward to prevent overlapping with bottom-right floating AI widget */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 pb-16 mr-0 sm:mr-32">
        <Button variant="outline" onClick={onGoBack} className="w-full sm:w-auto rounded-2xl px-5 font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'পেছনে যান (বোর্ডিং)' : 'Back to Boarding'}
        </Button>
        <Button
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          onClick={() => {
            if (onSetErrorMessage) onSetErrorMessage(null);

            // 1. Discount reference validation
            if (discountState.isDiscountApplied && discountState.discountRate > 0 && !discountState.discountReference?.trim()) {
              const msg = language === 'bn'
                ? 'টিকিটের মূল্য ছাড় দেওয়ার জন্য অনুমোদনকারী বা রেফারেন্সের নাম আবশ্যক।'
                : 'Authorizer or reference name is required when applying a discount.';
              if (onSetErrorMessage) onSetErrorMessage(msg);
              return;
            }

            // 2. Sender reference validation
            if (paymentMethod !== 'HAND_CASH') {
              if (senderSourceType === 'MFS_WALLET') {
                const clean = cleanAndLimitPhoneNumber(senderRef);
                if (!clean) {
                  const msg = language === 'bn'
                    ? 'প্রেরক বিকাশ/নগদ/রকেট মোবাইল নম্বর (১১ ডিজিট) আবশ্যক।'
                    : 'Sender mobile number is required.';
                  if (onSetErrorMessage) onSetErrorMessage(msg);
                  return;
                }
                if (!isValidBdMobile(clean)) {
                  const msg = language === 'bn'
                    ? `প্রেরক মোবাইল নম্বর (${senderRef}) সঠিক নয়! ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন।`
                    : 'Invalid 11-digit sender mobile number.';
                  if (onSetErrorMessage) onSetErrorMessage(msg);
                  return;
                }
              } else if (senderSourceType === 'BANK_TO_MFS') {
                if (!selectedBankName) {
                  const msg = language === 'bn'
                    ? 'অনুগ্রহ করে তালিকা থেকে প্রেরক ব্যাংক নির্বাচন করুন।'
                    : 'Please select a sender bank.';
                  if (onSetErrorMessage) onSetErrorMessage(msg);
                  return;
                }
                if (!senderRef?.trim()) {
                  const msg = language === 'bn'
                    ? 'প্রেরক ব্যাংক অ্যাকাউন্ট বা কার্ড নম্বর আবশ্যক।'
                    : 'Bank account or card number is required.';
                  if (onSetErrorMessage) onSetErrorMessage(msg);
                  return;
                }
              } else if (senderSourceType === 'CASH_RECEIPT') {
                if (!senderRef?.trim()) {
                  const msg = language === 'bn'
                    ? 'কাউন্টার ক্যাশ রিসিট নম্বর বা প্রদানকারীর নাম আবশ্যক।'
                    : 'Cash receipt number or payer name is required.';
                  if (onSetErrorMessage) onSetErrorMessage(msg);
                  return;
                }
              }
            }

            onConfirm();
          }}
          className="w-full sm:w-auto font-black shadow-lg shadow-blue-500/25 px-8 rounded-2xl text-sm sm:text-base py-3.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Check className="w-5 h-5 mr-2" />
          {language === 'bn' ? 'বুকিং নিশ্চিত করুন ও টিকিট প্রিন্ট নিন' : 'Confirm Booking & Print Invoice'}
        </Button>
      </div>

      {/* Staff coupon modal */}
      <Modal
        isOpen={isStaffCouponModalOpen}
        onClose={() => onSetStaffCouponModalOpen(false)}
        title={language === 'bn' ? '🔒 অফিস স্টাফ কুপন তালিকা (Internal Staff Reference)' : 'Active Marketing Coupons (Staff View)'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-900 dark:text-blue-200">
            {language === 'bn'
              ? '💡 এই তালিকাটি শুধুমাত্র কাউন্টার অপারেটর ও স্টাফদের জন্য। গ্রাহক মুখে কোড বললে যাচাই করে এখানে ক্লিক করে সরাসরি প্রয়োগ করতে পারেন।'
              : 'This list is for internal counter staff reference only. Select a coupon to apply it directly.'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {getMarketingCoupons().filter((c) => c.isActive).map((c) => (
              <div key={c.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-3 shadow-2xs hover:border-blue-400 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-blue-700 dark:text-blue-300">{c.code}</span>
                    <Badge variant="primary" className="text-[10px] font-mono font-bold">
                      {c.discountType === 'FIXED' ? formatCurrency(c.discountValue) : `${c.discountValue}%`} OFF
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{c.title}</h4>
                  {c.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{c.notes}</p>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">ব্যবহার: {c.usageCount}/{c.maxUsageLimit}</span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      await onStaffCouponApply(c.code);
                      onSetStaffCouponModalOpen(false);
                    }}
                    className="rounded-xl text-xs font-bold py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {language === 'bn' ? 'ব্যবহার করুন' : 'Apply'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <Link href="/marketing/coupons" target="_blank">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
                {language === 'bn' ? '⚙️ নতুন কুপন তৈরি বা ম্যানেজ করুন' : 'Manage All Coupons'}
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => onSetStaffCouponModalOpen(false)} className="rounded-xl text-xs font-bold px-4">
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
