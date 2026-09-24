'use client';

import React from 'react';
import {
  Armchair,
  Check,
  CreditCard,
  Printer,
  ShieldCheck,
  AlertTriangle,
  User,
  Phone,
  GraduationCap,
  Banknote,
  Sparkles,
  ArrowRight,
  X,
  BadgeAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

export interface SelectedSeatItem {
  seatId: string;
  seatNumber: string;
  fare: number;
  fareZoneName?: string;
  genderAllowed?: string;
}

interface BookingSummarySidebarProps {
  selectedSeats: SelectedSeatItem[];
  onRemoveSeat: (seatId: string) => void;
  grossAmount: number;
  discountAmount?: number;
  netAmount: number;
  paidAmount: number;
  onPaidAmountChange: (amt: number) => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  passengerName: string;
  onPassengerNameChange: (name: string) => void;
  passengerPhone: string;
  onPassengerPhoneChange: (phone: string) => void;
  passengerGender?: 'MALE' | 'FEMALE';
  onPassengerGenderChange?: (gender: 'MALE' | 'FEMALE') => void;
  isStudent?: boolean;
  onIsStudentChange?: (isStudent: boolean) => void;
  studentAdmissionId?: string;
  onStudentAdmissionIdChange?: (id: string) => void;
  processingFee?: number;
  onProcessingFeeChange?: (fee: number) => void;
  vatTaxAmount?: number;
  onVatTaxAmountChange?: (tax: number) => void;
  cashoutCharge?: number;
  onCashoutChargeChange?: (charge: number) => void;
  autoPrintTicket: boolean;
  onAutoPrintTicketChange: (autoPrint: boolean) => void;
  onConfirmBooking: () => void;
  isSubmitting: boolean;
  genderWarning?: string | null;
  trip?: any;
  className?: string;
}

export function BookingSummarySidebar({
  selectedSeats,
  onRemoveSeat,
  grossAmount,
  discountAmount = 0,
  netAmount,
  paidAmount,
  onPaidAmountChange,
  processingFee = 0,
  onProcessingFeeChange,
  vatTaxAmount = 0,
  onVatTaxAmountChange,
  cashoutCharge = 0,
  onCashoutChargeChange,
  paymentMethod,
  onPaymentMethodChange,
  passengerName,
  onPassengerNameChange,
  passengerPhone,
  onPassengerPhoneChange,
  passengerGender = 'MALE',
  onPassengerGenderChange,
  isStudent = false,
  onIsStudentChange,
  studentAdmissionId = '',
  onStudentAdmissionIdChange,
  autoPrintTicket,
  onAutoPrintTicketChange,
  onConfirmBooking,
  isSubmitting,
  genderWarning,
  trip,
  className = ''
}: BookingSummarySidebarProps) {
  const { language } = useApp();
  const [showFeeTaxSettings, setShowFeeTaxSettings] = React.useState(false);
  const dueAmount = Math.max(0, netAmount - paidAmount);

  return (
    <div suppressHydrationWarning className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-5 sticky top-20 z-20 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
            <Armchair className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
              {language === 'bn' ? 'বুকিং সামারি ও চেকআউট' : 'Booking Summary'}
            </h3>
            <p suppressHydrationWarning className="text-[11px] text-slate-500 font-medium">
              {trip?.bus?.busName || trip?.tripCode || (language === 'bn' ? 'কাউন্টার বুকিং' : 'Counter Session')}
            </p>
          </div>
        </div>
        <Badge variant={selectedSeats.length > 0 ? 'primary' : 'default'} className="font-mono font-bold text-xs">
          {selectedSeats.length} {language === 'bn' ? 'টি সিট' : 'Seats'}
        </Badge>
      </div>

      {/* Selected Seats Chips */}
      <div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
          {language === 'bn' ? 'নির্বাচিত আসনসমূহ' : 'Selected Seats'}
        </span>
        {selectedSeats.length === 0 ? (
          <div className="py-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
            {language === 'bn' ? 'সিট ম্যাপ থেকে আসন নির্বাচন করুন' : 'Click seats on the map to select'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map((seat) => (
              <div
                key={seat.seatId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-bold shadow-2xs group"
              >
                <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">{seat.seatNumber}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">৳{seat.fare}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSeat(seat.seatId)}
                  className="w-4 h-4 rounded-full bg-blue-200/60 dark:bg-blue-800/60 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] transition-colors ml-0.5"
                  title="Remove seat"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gender Rules Notice / Alert */}
      {genderWarning ? (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-black block">{language === 'bn' ? 'সতর্কবার্তা:' : 'Attention:'}</span>
            <span className="text-[11px] leading-tight">{genderWarning}</span>
          </div>
        </div>
      ) : selectedSeats.length > 0 ? (
        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{language === 'bn' ? 'সিট বিন্যাস নিরাপদ ও নিয়মসম্মত' : 'Seat arrangement compliant'}</span>
        </div>
      ) : null}

      {/* Passenger Basic Information */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          {language === 'bn' ? 'যাত্রী তথ্য' : 'Passenger Details'}
        </span>
        
        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {language === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Phone Number'}
          </label>
          <PhoneInput
            value={passengerPhone}
            onChange={(val) => onPassengerPhoneChange(val)}
            placeholder="017XXXXXXXX"
            className="rounded-xl font-mono text-sm"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {language === 'bn' ? 'যাত্রীর নাম' : 'Passenger Name'}
          </label>
          <Input
            value={passengerName}
            onChange={(e) => onPassengerNameChange(e.target.value)}
            placeholder={language === 'bn' ? 'নাম লিখুন...' : 'Enter name...'}
            className="rounded-xl text-sm"
          />
        </div>

        {onPassengerGenderChange && (
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onPassengerGenderChange('MALE')}
                className={`py-1.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                  passengerGender === 'MALE'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                👨 {language === 'bn' ? 'পুরুষ (Male)' : 'Male'}
              </button>
              <button
                type="button"
                onClick={() => onPassengerGenderChange('FEMALE')}
                className={`py-1.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                  passengerGender === 'FEMALE'
                    ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                👩 {language === 'bn' ? 'নারী (Female)' : 'Female'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment & Breakdown */}
      <div suppressHydrationWarning className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span>{language === 'bn' ? 'মোট টিকিট ভাড়া:' : 'Gross Fare:'}</span>
          <span className="font-mono font-bold">{formatCurrency(grossAmount)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
            <span>{language === 'bn' ? 'ডিসকাউন্ট / ছাড়:' : 'Discount:'}</span>
            <span className="font-mono">- {formatCurrency(discountAmount)}</span>
          </div>
        )}

        {/* Always Visible Processing Fee, VAT Tax & Cashout Rows (Defaulting to 0) */}
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span>{language === 'bn' ? 'অনলাইন প্রসেসিং ফি:' : 'Processing Fee:'}</span>
          <span className="font-mono font-bold">{processingFee > 0 ? `+ ${formatCurrency(processingFee)}` : formatCurrency(0)}</span>
        </div>

        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span>{language === 'bn' ? 'ভ্যাট ও সার্ভিস ট্যাক্স:' : 'VAT & Service Tax:'}</span>
          <span className="font-mono font-bold">{vatTaxAmount > 0 ? `+ ${formatCurrency(vatTaxAmount)}` : formatCurrency(0)}</span>
        </div>

        <div className={`flex justify-between items-center ${cashoutCharge > 0 ? 'text-pink-700 dark:text-pink-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
          <span>{language === 'bn' ? 'বিকাশ/নগদ ক্যাশআউট চার্জ:' : 'MFS Cashout Charge:'}</span>
          <span className="font-mono font-bold">{cashoutCharge > 0 ? `+ ${formatCurrency(cashoutCharge)}` : formatCurrency(0)}</span>
        </div>

        {/* Always Visible Fee, VAT & Cashout Direct Taka Input Controls */}
        {(onProcessingFeeChange || onVatTaxAmountChange || onCashoutChargeChange) && (
          <div className="pt-1.5 pb-1">
            <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">💵</span>
                  <span>{language === 'bn' ? 'ভ্যাট, ফি ও ক্যাশআউট (সরাসরি টাকা)' : 'Fee, VAT & Cashout (Direct Taka)'}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {language === 'bn' ? 'সরাসরি ৳' : 'Direct ৳'}
                </span>
              </div>

              {/* 1. Processing Fee & VAT/Tax Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Online Processing Fee */}
                {onProcessingFeeChange && (
                  <div className="space-y-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                        {language === 'bn' ? 'প্রসেসিং ফি' : 'Processing Fee'}
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">টাকা</span>
                    </div>

                    {/* Direct Taka Input */}
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 font-bold text-blue-600 text-xs">৳</span>
                      <Input
                        type="number"
                        min={0}
                        value={processingFee === 0 ? '' : processingFee}
                        onChange={(e) => onProcessingFeeChange(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="h-8 pl-6 pr-10 text-xs font-mono font-black rounded-lg bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-blue-500"
                        placeholder="০ টাকা"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400 font-mono">টাকা</span>
                    </div>

                    {/* Quick Direct Taka Presets */}
                    <div className="flex gap-1 pt-0.5">
                      {[0, 10, 20, 30, 50].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => onProcessingFeeChange(f)}
                          className={`flex-1 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                            processingFee === f 
                              ? 'bg-blue-600 text-white shadow-2xs' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600'
                          }`}
                        >
                          ৳{f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* VAT & Service Tax */}
                {onVatTaxAmountChange && (
                  <div className="space-y-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                        {language === 'bn' ? 'ভ্যাট / ট্যাক্স' : 'VAT / Tax'}
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">টাকা</span>
                    </div>

                    {/* Direct Taka Input */}
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 font-bold text-indigo-600 text-xs">৳</span>
                      <Input
                        type="number"
                        min={0}
                        value={vatTaxAmount === 0 ? '' : vatTaxAmount}
                        onChange={(e) => onVatTaxAmountChange(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="h-8 pl-6 pr-10 text-xs font-mono font-black rounded-lg bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        placeholder="০ টাকা"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400 font-mono">টাকা</span>
                    </div>

                    {/* Quick Direct Taka Presets */}
                    <div className="flex gap-1 pt-0.5">
                      {[0, 10, 25, 50].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => onVatTaxAmountChange(v)}
                          className={`flex-1 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                            vatTaxAmount === v 
                              ? 'bg-indigo-600 text-white shadow-2xs' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600'
                          }`}
                        >
                          ৳{v}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => onVatTaxAmountChange(Math.round(grossAmount * 0.05))}
                        className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                        title="৫% ভ্যাট"
                      >
                        ৫%
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. MFS Cashout Charge (bKash/Nagad) */}
              {onCashoutChargeChange && (
                <div className={`p-2.5 rounded-xl border transition-all ${
                  paymentMethod === 'BKASH' || paymentMethod === 'NAGAD'
                    ? 'bg-pink-50/90 dark:bg-pink-950/40 border-pink-300 dark:border-pink-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`font-bold text-[11px] flex items-center gap-1.5 ${
                      paymentMethod === 'BKASH' || paymentMethod === 'NAGAD' 
                        ? 'text-pink-900 dark:text-pink-200' 
                        : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      <span>📱</span>
                      <span>{language === 'bn' ? 'বিকাশ/নগদ ক্যাশআউট চার্জ' : 'MFS Cashout Charge'}</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">সরাসরি টাকা</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Direct Taka Input */}
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 font-bold text-pink-600 text-xs">৳</span>
                      <Input
                        type="number"
                        min={0}
                        value={cashoutCharge === 0 ? '' : cashoutCharge}
                        onChange={(e) => onCashoutChargeChange(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="h-8 pl-6 pr-10 text-xs font-mono font-black rounded-lg bg-white dark:bg-slate-950 border-pink-200 dark:border-pink-900 focus:border-pink-500"
                        placeholder="০ টাকা"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-bold text-pink-400 font-mono">টাকা</span>
                    </div>

                    {/* Quick Direct Taka Presets */}
                    <div className="flex gap-1 items-center">
                      {[0, 10, 15, 20].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onCashoutChargeChange(c)}
                          className={`flex-1 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                            cashoutCharge === c 
                              ? 'bg-pink-600 text-white shadow-2xs' 
                              : 'bg-pink-100/70 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200 hover:bg-pink-600 hover:text-white'
                          }`}
                        >
                          ৳{c}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => onCashoutChargeChange(Math.round(grossAmount * 0.015))}
                        className="px-1.5 py-1 rounded-lg bg-pink-600 text-white text-[9px] font-mono font-bold hover:bg-pink-700 transition-colors cursor-pointer shrink-0"
                        title="১.৫% ক্যাশআউট চার্জ"
                      >
                        ১.৫%
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>{language === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Net Payable:'}</span>
          <span className="font-mono text-base text-blue-600 dark:text-blue-400">{formatCurrency(netAmount)}</span>
        </div>

        {/* Payment Method Selector */}
        <div className="pt-2">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {['HAND_CASH', 'BKASH', 'NAGAD'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onPaymentMethodChange(m)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  paymentMethod === m
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {m === 'HAND_CASH' ? '💵 ক্যাশ' : m === 'BKASH' ? 'বিকাশ' : 'নগদ'}
              </button>
            ))}
          </div>

          {/* Quick Cashout Notification for bKash/Nagad */}
          {(paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') && onCashoutChargeChange && (
            <div className="mt-2 p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/80 flex items-center justify-between gap-1.5 text-[10px]">
              <span className="text-pink-900 dark:text-pink-200 font-bold">
                {paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'} ক্যাশআউট চার্জ: {cashoutCharge > 0 ? `৳${cashoutCharge}` : 'যুক্ত নেই'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onCashoutChargeChange(Math.round(grossAmount * 0.015))}
                  className="px-2 py-0.5 rounded bg-pink-600 hover:bg-pink-700 text-white font-mono font-black text-[9px] cursor-pointer"
                  title="১.৫% ক্যাশআউট চার্জ যুক্ত করুন"
                >
                  + ১.৫% (৳{Math.round(grossAmount * 0.015)})
                </button>
                {cashoutCharge > 0 && (
                  <button
                    type="button"
                    onClick={() => onCashoutChargeChange(0)}
                    className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] cursor-pointer"
                    title="ক্যাশআউট চার্জ মুছুন"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Paid and Due Amount Inputs */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              {language === 'bn' ? 'পরিশোধ (Paid)' : 'Paid'}
            </label>
            <Input
              type="number"
              min={0}
              max={netAmount}
              value={paidAmount}
              onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
              className="font-mono text-xs rounded-xl h-9"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              {language === 'bn' ? 'বকেয়া (Due)' : 'Due'}
            </label>
            <div className={`h-9 flex items-center px-3 rounded-xl font-mono font-black text-xs border ${
              dueAmount > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800'
            }`}>
              {formatCurrency(dueAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-print Toggle */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Printer className="w-4 h-4 text-blue-600" />
          <span>{language === 'bn' ? 'বুকিং শেষে সরাসরি প্রিন্ট' : 'Auto-Print Ticket'}</span>
        </div>
        <input
          type="checkbox"
          checked={autoPrintTicket}
          onChange={(e) => onAutoPrintTicketChange(e.target.checked)}
          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
        />
      </div>

      {/* Confirm Button */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        disabled={selectedSeats.length === 0 || !passengerPhone || passengerPhone.length < 11 || isSubmitting}
        onClick={onConfirmBooking}
        className="w-full font-black py-3 rounded-2xl shadow-lg shadow-blue-500/25 cursor-pointer text-sm"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{language === 'bn' ? 'টিকিট প্রস্তুত হচ্ছে...' : 'Processing...'}</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>{language === 'bn' ? 'টিকিট নিশ্চিত করুন' : 'Confirm Booking'}</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
