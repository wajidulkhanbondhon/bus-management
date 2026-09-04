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
  DynamicPaymentLogo
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
  { id: 'BKASH', name: 'bKash', sub: 'বিকাশ', Logo: BkashLogo, activeBorder: 'border-[#E2136E]', activeBg: 'bg-[#E2136E]/10 dark:bg-[#E2136E]/20', activeRing: 'ring-[#E2136E]/50', activeText: 'text-[#E2136E]' },
  { id: 'NAGAD', name: 'Nagad', sub: 'নগদ', Logo: NagadLogo, activeBorder: 'border-[#F7941D]', activeBg: 'bg-[#F7941D]/10 dark:bg-[#F7941D]/20', activeRing: 'ring-[#F7941D]/50', activeText: 'text-[#E35205]' },
  { id: 'ROCKET', name: 'Rocket', sub: 'রকেট', Logo: RocketLogo, activeBorder: 'border-[#8C3494]', activeBg: 'bg-[#8C3494]/10 dark:bg-[#8C3494]/20', activeRing: 'ring-[#8C3494]/50', activeText: 'text-[#8C3494]' },
  { id: 'BANK_TRANSFER', name: 'Bank', sub: 'ব্যাংক', Logo: BankTransferLogo, activeBorder: 'border-[#003366]', activeBg: 'bg-[#003366]/10 dark:bg-[#003366]/20', activeRing: 'ring-[#003366]/50', activeText: 'text-[#003366] dark:text-blue-300' },
  { id: 'HAND_CASH', name: 'Cash', sub: 'কাউন্টার ক্যাশ', Logo: CashMoneyLogo, activeBorder: 'border-[#059669]', activeBg: 'bg-[#059669]/10 dark:bg-[#059669]/20', activeRing: 'ring-[#059669]/50', activeText: 'text-[#059669]' }
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
  onGoBack,
  onConfirm
}: FarePaymentProps) {
  const { language } = useApp();
  const { isDiscountApplied, discountType, discountRate, discountReference, discountReason } = discountState;
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || '');

  // Pre-fill senderRef from 1st passenger mobile if currently blank
  React.useEffect(() => {
    if (!senderRef && passengers[0]?.passengerPhone) {
      onSenderRefChange(passengers[0].passengerPhone);
    } else if (!senderRef && paymentMethod === 'HAND_CASH') {
      onSenderRefChange(passengers[0]?.passengerPhone || 'CASH-COUNTER');
    }
  }, [passengers, senderRef, paymentMethod, onSenderRefChange]);

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

          {/* Amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={language === 'bn' ? 'জমা দেওয়া টাকার পরিমাণ (Paid Amount) *' : 'Paid Amount (৳) *'}
              type="number"
              min="0"
              max={netAmount}
              value={paidAmount || ''}
              onChange={(e) => onPaidAmountChange(Number(e.target.value))}
              required
            />
            <Input label={language === 'bn' ? 'বকেয়া টাকা (Due Amount)' : 'Remaining Due (৳)'} value={formatCurrency(dueAmount)} disabled />
          </div>

          {/* Sender source */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/80 rounded-3xl border-2 border-slate-200 dark:border-slate-800 space-y-5">
            <div className="space-y-2">
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
                        : paymentMethod === 'HAND_CASH'
                        ? 'bg-[#059669]/10 border-[#059669] shadow-md shadow-[#059669]/15 ring-2 ring-[#059669]/40'
                        : 'bg-[#003366]/10 border-[#003366] shadow-md shadow-[#003366]/15 ring-2 ring-[#003366]/40'
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
                    ) : paymentMethod === 'HAND_CASH' ? (
                      <CashMoneyLogo className="w-11 h-11 drop-shadow-md" />
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
                          : paymentMethod === 'HAND_CASH'
                          ? (language === 'bn' ? 'কাউন্টার ক্যাশ রিসিট' : 'Counter Cash Receipt')
                          : (language === 'bn' ? 'সরাসরি ব্যাংক অ্যাকাউন্ট ডিপোজিট' : 'Direct Bank Deposit')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {language === 'bn'
                        ? 'গ্রাহকের ওয়ালেট / এজেন্ট নম্বর বা ক্যাশ রিসিট'
                        : 'Customer wallet / agent number or cash receipt'}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    senderSourceType === 'MFS_WALLET'
                      ? paymentMethod === 'BKASH'
                        ? 'border-[#E2136E] bg-[#E2136E] text-white'
                        : paymentMethod === 'NAGAD'
                        ? 'border-[#F7941D] bg-[#F7941D] text-white'
                        : paymentMethod === 'ROCKET'
                        ? 'border-[#8C3494] bg-[#8C3494] text-white'
                        : 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300'
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
                        {language === 'bn'
                          ? `ব্যাংক থেকে ${paymentMethod === 'NAGAD' ? 'নগদ' : paymentMethod === 'ROCKET' ? 'রকেট' : 'বিকাশ'} / ব্যাংক`
                          : `Bank to ${paymentMethod === 'NAGAD' ? 'Nagad' : paymentMethod === 'ROCKET' ? 'Rocket' : 'bKash'} / Bank`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {language === 'bn' ? 'CellFin, NexusPay, Astha, Citytouch বা কার্ড' : 'Internet banking or debit/credit card'}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${senderSourceType === 'BANK_TO_MFS' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                    {senderSourceType === 'BANK_TO_MFS' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
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
                      ) : paymentMethod === 'HAND_CASH' ? (
                        <CashMoneyLogo className="w-4 h-4" />
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
                      onKeyDown={(e) => {
                        const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                        if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
                        if (!/^[\d০-৯]$/.test(e.key)) {
                          e.preventDefault();
                          return;
                        }
                        const target = e.target as HTMLInputElement;
                        const hasSelection = target.selectionStart !== target.selectionEnd;
                        if (senderRef.length >= 11 && !hasSelection) e.preventDefault();
                      }}
                      onChange={(e) => onSenderRefChange(cleanAndLimitPhoneNumber(e.target.value).slice(0, 11))}
                      onPaste={(e) => {
                        e.preventDefault();
                        onSenderRefChange(cleanAndLimitPhoneNumber(e.clipboardData.getData('text')).slice(0, 11));
                      }}
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

            {/* Cash receipt input */}
            {senderSourceType === 'CASH_RECEIPT' && (
              <div className="space-y-1.5 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'কাউন্টার ক্যাশ রিসিট নম্বর / প্রদানকারীর নাম *' : 'Counter Cash Receipt / Payer Name *'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: MR-2026-0812 বা প্রদানকারীর নাম *"
                  value={senderRef}
                  onChange={(e) => onSenderRefChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
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
