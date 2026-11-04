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
  BadgeAlert,
  ChevronDown,
  ChevronUp
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

export const GUARDIAN_RELATIONSHIPS: { value: string; label: string; defaultGender?: 'MALE' | 'FEMALE' }[] = [
  { value: 'FATHER', label: 'বাবা (Father)', defaultGender: 'MALE' },
  { value: 'MOTHER', label: 'মা (Mother)', defaultGender: 'FEMALE' },
  { value: 'BROTHER', label: 'আপন ভাই (Brother)', defaultGender: 'MALE' },
  { value: 'SISTER', label: 'আপন বোন (Sister)', defaultGender: 'FEMALE' },
  { value: 'SPOUSE', label: 'স্বামী / স্ত্রী (Spouse)' },
  { value: 'PATERNAL_GRANDFATHER', label: 'দাদা (Grandfather)', defaultGender: 'MALE' },
  { value: 'MATERNAL_GRANDFATHER', label: 'নানা (Grandfather)', defaultGender: 'MALE' },
  { value: 'PATERNAL_GRANDMOTHER', label: 'দাদি (Grandmother)', defaultGender: 'FEMALE' },
  { value: 'MATERNAL_GRANDMOTHER', label: 'নানি (Grandmother)', defaultGender: 'FEMALE' },
  { value: 'UNCLE', label: 'চাচা / মামা / খালু (Uncle)', defaultGender: 'MALE' },
  { value: 'AUNT', label: 'চাচি / খালা / ফুফু (Aunt)', defaultGender: 'FEMALE' },
  { value: 'OTHER', label: 'অন্যান্য রক্তীয় অভিভাবক (Other)' },
];

export interface SeatPassengerDetail {
  seatId: string;
  seatNumber: string;
  name: string;
  phone: string;
  gender: 'MALE' | 'FEMALE';
  passengerType?: 'STUDENT' | 'GUARDIAN';
  guardianRelationship?: string;
  guardianPhone?: string;
  isStudent?: boolean;
  admissionId?: string;
  suggestedPassenger?: any | null;
}

interface BookingSummarySidebarProps {
  selectedSeats: SelectedSeatItem[];
  onRemoveSeat: (seatId: string) => void;
  passengersBySeat?: Record<string, SeatPassengerDetail>;
  onPassengerDataChange?: (seatId: string, updates: Partial<SeatPassengerDetail>) => void;
  onCopyFirstPassengerPhoneToAll?: () => void;
  grossAmount: number;
  discountAmount?: number;
  netAmount: number;
  paidAmount: number;
  onPaidAmountChange: (amt: number) => void;
  dueAmount?: number;
  onDueAmountChange?: (due: number) => void;
  isPayOnBus?: boolean;
  onIsPayOnBusChange?: (val: boolean) => void;
  duePromiseDate?: string;
  onDuePromiseDateChange?: (date: string) => void;
  dueNote?: string;
  onDueNoteChange?: (note: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  passengerName?: string;
  onPassengerNameChange?: (name: string) => void;
  passengerPhone?: string;
  onPassengerPhoneChange?: (phone: string) => void;
  passengerGender?: 'MALE' | 'FEMALE';
  onPassengerGenderChange?: (gender: 'MALE' | 'FEMALE') => void;
  isStudent?: boolean;
  onIsStudentChange?: (isStudent: boolean) => void;
  guardianRelationship?: string;
  onGuardianRelationshipChange?: (rel: string) => void;
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
  suggestedPassenger?: {
    name: string;
    phone: string;
    gender?: 'MALE' | 'FEMALE';
    passengerType?: string;
    admissionId?: string;
  } | null;
  onApplySuggestedPassenger?: (passenger: any, seatId?: string) => void;
}

export function BookingSummarySidebar({
  selectedSeats,
  onRemoveSeat,
  passengersBySeat,
  onPassengerDataChange,
  onCopyFirstPassengerPhoneToAll,
  grossAmount,
  discountAmount = 0,
  netAmount,
  paidAmount,
  onPaidAmountChange,
  dueAmount: propDueAmount,
  onDueAmountChange,
  isPayOnBus = false,
  onIsPayOnBusChange,
  duePromiseDate = '',
  onDuePromiseDateChange,
  dueNote = '',
  onDueNoteChange,
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
  isStudent = true,
  onIsStudentChange,
  guardianRelationship = 'FATHER',
  onGuardianRelationshipChange,
  studentAdmissionId = '',
  onStudentAdmissionIdChange,
  autoPrintTicket,
  onAutoPrintTicketChange,
  onConfirmBooking,
  isSubmitting,
  genderWarning,
  trip,
  className = '',
  suggestedPassenger = null,
  onApplySuggestedPassenger
}: BookingSummarySidebarProps) {
  const { language } = useApp();
  const [isFeeBoxOpen, setIsFeeBoxOpen] = React.useState(false);
  const [tenderedAmount, setTenderedAmount] = React.useState<number | ''>('');
  const numTendered = typeof tenderedAmount === 'number' ? tenderedAmount : 0;
  const changeDue = numTendered > paidAmount ? numTendered - paidAmount : 0;
  const shortageAmount = paidAmount > numTendered && numTendered > 0 ? paidAmount - numTendered : 0;
  const dueAmount = propDueAmount !== undefined ? propDueAmount : Math.max(0, netAmount - paidAmount);

  return (
    <div suppressHydrationWarning className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 sm:gap-5 sticky top-20 z-20 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
            <Armchair className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight truncate">
              {language === 'bn' ? 'বুকিং সামারি ও চেকআউট' : 'Booking Summary'}
            </h3>
            <p suppressHydrationWarning className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {trip?.bus?.busName || trip?.tripCode || (language === 'bn' ? 'কাউন্টার বুকিং' : 'Counter Session')}
            </p>
          </div>
        </div>
        <Badge variant={selectedSeats.length > 0 ? 'primary' : 'default'} className="font-mono font-bold text-xs sm:text-sm px-2.5 py-1 shrink-0">
          {selectedSeats.length} {language === 'bn' ? 'টি সিট' : 'Seats'}
        </Badge>
      </div>

      {/* Selected Seats Chips */}
      <div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
          {language === 'bn' ? 'নির্বাচিত আসনসমূহ' : 'Selected Seats'}
        </span>
        {selectedSeats.length === 0 ? (
          <div className="py-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs sm:text-sm font-medium">
            {language === 'bn' ? 'সিট ম্যাপ থেকে আসন নির্বাচন করুন' : 'Click seats on the map to select'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {selectedSeats.map((seat) => (
              <div
                key={seat.seatId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs sm:text-sm font-bold shadow-2xs group"
              >
                <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">{seat.seatNumber}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">৳{seat.fare}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSeat(seat.seatId)}
                  className="w-4 h-4 rounded-full bg-blue-200/60 dark:bg-blue-800/60 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs transition-colors ml-0.5 cursor-pointer"
                  title="Remove seat"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gender Rules Notice / Alert */}
      {genderWarning ? (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-black block">{language === 'bn' ? 'সতর্কবার্তা:' : 'Attention:'}</span>
            <span className="text-xs font-medium leading-relaxed break-words">{genderWarning}</span>
          </div>
        </div>
      ) : selectedSeats.length > 0 ? (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{language === 'bn' ? 'সিট বিন্যাস নিরাপদ ও নিয়মসম্মত' : 'Seat arrangement compliant'}</span>
        </div>
      ) : null}

      {/* Passenger Information (Supports Single & Multiple Seats) */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
            {language === 'bn' ? 'যাত্রী তথ্য' : 'Passenger Details'}
            {selectedSeats.length > 1 ? ` (${selectedSeats.length} জন)` : ''}
          </span>
          {selectedSeats.length > 1 && onCopyFirstPassengerPhoneToAll && (
            <button
              type="button"
              onClick={onCopyFirstPassengerPhoneToAll}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              title="১ম যাত্রীর ফোন নম্বর বাকি সব সিটে কপি করুন"
            >
              <span>📋 ১ম নম্বর সবাইকে দিন</span>
            </button>
          )}
        </div>

        {selectedSeats.length === 0 ? (
          <div className="py-2 text-center text-slate-400 text-xs">
            {language === 'bn' ? 'যাত্রী তথ্য দিতে প্রথমে সিট নির্বাচন করুন' : 'Select seats to enter passenger details'}
          </div>
        ) : passengersBySeat && onPassengerDataChange ? (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {selectedSeats.map((seat, idx) => {
              const pData = passengersBySeat[seat.seatId] || {
                seatId: seat.seatId,
                seatNumber: seat.seatNumber,
                name: '',
                phone: '',
                gender: 'MALE',
                isStudent: true,
                admissionId: '',
              };
              const isFirst = idx === 0;

              return (
                <div
                  key={seat.seatId}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2.5 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-mono font-black text-xs sm:text-sm">
                        {seat.seatNumber}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                        {isFirst
                          ? (language === 'bn' ? 'প্রধান যাত্রী (১)' : 'Primary Passenger')
                          : (language === 'bn' ? `যাত্রী ${idx + 1}` : `Passenger ${idx + 1}`)}
                      </span>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(seat.fare)}
                    </span>
                  </div>

                  {/* Phone input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Phone Number'}
                    </label>
                    <PhoneInput
                      value={pData.phone || ''}
                      onChange={(val) => onPassengerDataChange(seat.seatId, { phone: val })}
                      placeholder="017XXXXXXXX"
                      className="rounded-xl font-mono text-sm w-full h-9"
                    />

                    {/* Passenger suggestion box */}
                    {pData.suggestedPassenger && (
                      <div className="mt-1.5 p-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/80 dark:to-indigo-950/80 border border-blue-400 dark:border-blue-600 flex items-center justify-between gap-1.5 text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-blue-950 dark:text-blue-100 text-xs sm:text-sm truncate block">
                            👤 {pData.suggestedPassenger.name}
                          </span>
                          <span className="text-xs text-blue-700 dark:text-blue-300 truncate block">
                            পূর্বে ভ্রমণকৃত যাত্রী
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onApplySuggestedPassenger?.(pData.suggestedPassenger, seat.seatId)}
                          className="px-2.5 py-1 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700 active:scale-95 transition-all shrink-0 cursor-pointer"
                        >
                          নাম ব্যবহার ✓
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Passenger Type (Student vs Guardian) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'যাত্রীর ধরন' : 'Passenger Type'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onPassengerDataChange(seat.seatId, {
                            passengerType: 'STUDENT',
                            isStudent: true,
                            guardianRelationship: undefined
                          });
                        }}
                        className={`py-1.5 px-2 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                          pData.passengerType !== 'GUARDIAN'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        🎓 {language === 'bn' ? 'শিক্ষার্থী' : 'Student'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onPassengerDataChange(seat.seatId, {
                            passengerType: 'GUARDIAN',
                            isStudent: false,
                            guardianRelationship: pData.guardianRelationship || 'FATHER'
                          });
                        }}
                        className={`py-1.5 px-2 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                          pData.passengerType === 'GUARDIAN'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        👨‍👩‍👧 {language === 'bn' ? 'অভিভাবক' : 'Guardian'}
                      </button>
                    </div>
                  </div>

                  {/* Student vs Guardian Details */}
                  {pData.passengerType !== 'GUARDIAN' ? (
                    <>
                      {/* Student Name input */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                        </label>
                        <Input
                          value={pData.name || ''}
                          onChange={(e) => onPassengerDataChange(seat.seatId, { name: e.target.value })}
                          placeholder={language === 'bn' ? `শিক্ষার্থীর নাম লিখুন...` : `Student name...`}
                          className="rounded-xl text-sm h-9"
                        />
                      </div>

                      {/* Gender toggle */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPassengerDataChange(seat.seatId, { gender: 'MALE' })}
                            className={`py-1.5 px-2 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                              (pData.gender || 'MALE') === 'MALE'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            👨 {language === 'bn' ? 'পুরুষ (Male)' : 'Male'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onPassengerDataChange(seat.seatId, { gender: 'FEMALE' })}
                            className={`py-1.5 px-2 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                              pData.gender === 'FEMALE'
                                ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            👩 {language === 'bn' ? 'নারী (Female)' : 'Female'}
                          </button>
                        </div>
                      </div>

                      {/* Student Roll Input (Optional) */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          🎓 {language === 'bn' ? 'ভর্তি পরীক্ষা রোল / আইডি (ঐচ্ছিক)' : 'Admission Roll (Optional)'}
                        </label>
                        <Input
                          value={pData.admissionId || ''}
                          onChange={(e) => onPassengerDataChange(seat.seatId, { admissionId: e.target.value })}
                          placeholder={language === 'bn' ? 'যেমন: A-102934...' : 'e.g. Roll number...'}
                          className="h-8 text-sm rounded-lg bg-white dark:bg-slate-900"
                        />
                      </div>
                    </>
                  ) : (
                    /* Guardian Details (Name not required; Relationship + Gender sufficient) */
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2 animate-in fade-in">
                      <div>
                        <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                          👨‍👩‍👧 {language === 'bn' ? 'শিক্ষার্থীর সাথে সম্পর্ক (বাধ্যতামূলক)' : 'Relationship with Student'}
                        </label>
                        <select
                          value={pData.guardianRelationship || 'FATHER'}
                          onChange={(e) => {
                            const rel = e.target.value;
                            const found = GUARDIAN_RELATIONSHIPS.find((r) => r.value === rel);
                            const newGender = found?.defaultGender || pData.gender || 'MALE';
                            onPassengerDataChange(seat.seatId, {
                              guardianRelationship: rel,
                              gender: newGender,
                            });
                          }}
                          className="w-full h-9 text-xs sm:text-sm font-semibold rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 focus:ring-amber-500 cursor-pointer"
                        >
                          {GUARDIAN_RELATIONSHIPS.map((rel) => (
                            <option key={rel.value} value={rel.value}>
                              {rel.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Guardian Gender */}
                      <div>
                        <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                          {language === 'bn' ? 'অভিভাবকের লিঙ্গ' : 'Guardian Gender'}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPassengerDataChange(seat.seatId, { gender: 'MALE' })}
                            className={`py-1.5 px-2 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                              (pData.gender || 'MALE') === 'MALE'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            👨 {language === 'bn' ? 'পুরুষ (Male)' : 'Male'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onPassengerDataChange(seat.seatId, { gender: 'FEMALE' })}
                            className={`py-1.5 px-2 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                              pData.gender === 'FEMALE'
                                ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            👩 {language === 'bn' ? 'নারী (Female)' : 'Female'}
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-amber-800 dark:text-amber-300 font-medium bg-amber-100/60 dark:bg-amber-900/30 px-2.5 py-1.5 rounded-lg">
                        ✓ অভিভাবকের আলাদা নাম প্রয়োজন নেই; সম্পর্ক অনুযায়ী টিকিটে যুক্ত হবে।
                      </div>

                      <div>
                        <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                          📞 {language === 'bn' ? 'জরুরি / বিকল্প যোগাযোগ নম্বর (ঐচ্ছিক)' : 'Emergency Phone (Optional)'}
                        </label>
                        <Input
                          value={pData.guardianPhone || ''}
                          onChange={(e) => onPassengerDataChange(seat.seatId, { guardianPhone: e.target.value })}
                          placeholder={language === 'bn' ? 'বিকল্প মোবাইল নম্বর...' : 'Alternative phone...'}
                          className="h-8 text-sm rounded-lg bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Passenger Fallback */
          <>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Phone Number'}
              </label>
              <PhoneInput
                value={passengerPhone || ''}
                onChange={(val) => onPassengerPhoneChange?.(val)}
                placeholder="017XXXXXXXX"
                className="rounded-xl font-mono text-sm w-full"
              />

              {suggestedPassenger && (
                <div className="mt-2 p-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/80 dark:to-indigo-950/80 border-2 border-blue-400 dark:border-blue-600 flex items-center justify-between gap-2 text-xs shadow-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">👤</span>
                      <span className="font-black text-blue-950 dark:text-blue-100 truncate block text-xs sm:text-sm">
                        {suggestedPassenger.name}
                      </span>
                    </div>
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-mono block truncate">
                      পূর্বে ভ্রমণকৃত যাত্রী {suggestedPassenger.admissionId ? `• রোল: ${suggestedPassenger.admissionId}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplySuggestedPassenger?.(suggestedPassenger)}
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-xl shrink-0 shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <span>নাম ব্যবহার করুন</span>
                    <span>✓</span>
                  </button>
                </div>
              )}
            </div>

            {/* Passenger Type (Single Passenger) */}
            {onIsStudentChange && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'bn' ? 'যাত্রীর ধরন' : 'Passenger Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onIsStudentChange(true)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                      isStudent
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🎓 {language === 'bn' ? 'শিক্ষার্থী (Student)' : 'Student'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onIsStudentChange(false)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                      !isStudent
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    👨‍👩‍👧 {language === 'bn' ? 'অভিভাবক (Guardian)' : 'Guardian'}
                  </button>
                </div>
              </div>
            )}

            {isStudent ? (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                </label>
                <Input
                  value={passengerName || ''}
                  onChange={(e) => onPassengerNameChange?.(e.target.value)}
                  placeholder={language === 'bn' ? 'শিক্ষার্থীর নাম লিখুন...' : 'Enter student name...'}
                  className="rounded-xl text-sm h-9"
                />
              </div>
            ) : (
              <div className="text-xs text-amber-800 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-xl">
                ✓ অভিভাবকের আলাদা নাম প্রয়োজন নেই; সম্পর্ক অনুযায়ী টিকিটে যুক্ত হবে।
              </div>
            )}

            {!isStudent && onGuardianRelationshipChange && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                  👨‍👩‍👧 {language === 'bn' ? 'শিক্ষার্থীর সাথে সম্পর্ক (বাধ্যতামূলক)' : 'Relationship with Student'}
                </label>
                <select
                  value={guardianRelationship || 'FATHER'}
                  onChange={(e) => {
                    const rel = e.target.value;
                    onGuardianRelationshipChange(rel);
                    const found = GUARDIAN_RELATIONSHIPS.find((r) => r.value === rel);
                    if (found?.defaultGender && onPassengerGenderChange) {
                      onPassengerGenderChange(found.defaultGender);
                    }
                  }}
                  className="w-full h-9 text-xs sm:text-sm font-semibold rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 focus:ring-amber-500 cursor-pointer"
                >
                  {GUARDIAN_RELATIONSHIPS.map((rel) => (
                    <option key={rel.value} value={rel.value}>
                      {rel.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onPassengerGenderChange && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onPassengerGenderChange('MALE')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
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
                    className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
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
          </>
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

        {(processingFee > 0 || vatTaxAmount > 0 || cashoutCharge > 0) && (
          <div className="space-y-1.5 pt-1 text-[11px] border-t border-dashed border-slate-200 dark:border-slate-800">
            {processingFee > 0 && (
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{language === 'bn' ? 'অনলাইন প্রসেসিং ফি:' : 'Processing Fee:'}</span>
                <span className="font-mono font-bold">+ {formatCurrency(processingFee)}</span>
              </div>
            )}
            {vatTaxAmount > 0 && (
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{language === 'bn' ? 'ভ্যাট ও সার্ভিস ট্যাক্স:' : 'VAT & Tax:'}</span>
                <span className="font-mono font-bold">+ {formatCurrency(vatTaxAmount)}</span>
              </div>
            )}
            {cashoutCharge > 0 && (
              <div className="flex justify-between items-center text-pink-700 dark:text-pink-400 font-bold">
                <span>{language === 'bn' ? 'ক্যাশআউট চার্জ:' : 'Cashout Charge:'}</span>
                <span className="font-mono font-bold">+ {formatCurrency(cashoutCharge)}</span>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Fee & Tax Controls (Clean, Non-overflowing) */}
        {(onProcessingFeeChange || onVatTaxAmountChange || onCashoutChargeChange) && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsFeeBoxOpen((prev) => !prev)}
              className="text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between w-full py-1 cursor-pointer"
            >
              <span>{language === 'bn' ? '⚙️ ভ্যাট, ফি ও চার্জ সেটিংস' : '⚙️ Fee & Tax Adjustments'}</span>
              {isFeeBoxOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isFeeBoxOpen && (
              <div className="mt-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in">
                {onProcessingFeeChange && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span>{language === 'bn' ? 'প্রসেসিং ফি' : 'Processing Fee'}</span>
                      <div className="flex gap-1">
                        {[0, 20, 50].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => onProcessingFeeChange(f)}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-blue-50"
                          >
                            ৳{f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={processingFee === 0 ? '' : processingFee}
                      onChange={(e) => onProcessingFeeChange(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-7 text-xs font-mono font-bold rounded-lg"
                      placeholder="০ টাকা"
                    />
                  </div>
                )}

                {onVatTaxAmountChange && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span>{language === 'bn' ? 'ভ্যাট / ট্যাক্স' : 'VAT / Tax'}</span>
                      <div className="flex gap-1">
                        {[0, 20, 50].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onVatTaxAmountChange(t)}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-blue-50"
                          >
                            ৳{t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={vatTaxAmount === 0 ? '' : vatTaxAmount}
                      onChange={(e) => onVatTaxAmountChange(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-7 text-xs font-mono font-bold rounded-lg"
                      placeholder="০ টাকা"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Net Amount Banner */}
        <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
          <span>{language === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Net Payable:'}</span>
          <span className="font-mono text-lg text-blue-600 dark:text-blue-400">{formatCurrency(netAmount)}</span>
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
        </div>

        {/* Paid and Due Amount Inputs with 1-Click Full Paid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                {language === 'bn' ? 'পরিশোধ (Paid)' : 'Paid'}
              </label>
              <button
                type="button"
                onClick={() => {
                  onPaidAmountChange(netAmount);
                  onDueAmountChange?.(0);
                }}
                className="text-[9px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                title="পুরো টাকা পরিশোধ করুন"
              >
                {language === 'bn' ? 'পুরো পরিশোধ' : 'Full Paid'}
              </button>
            </div>
            <Input
              type="number"
              min={0}
              max={netAmount}
              value={paidAmount === 0 ? '' : paidAmount}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                const boundedPaid = Math.min(val, netAmount);
                onPaidAmountChange(boundedPaid);
                onDueAmountChange?.(Math.max(0, netAmount - boundedPaid));
              }}
              placeholder="০"
              className="font-mono text-xs rounded-xl h-9 font-bold"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                {language === 'bn' ? 'বকেয়া (Due)' : 'Due'}
              </label>
              {dueAmount > 0 && (
                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">
                  {language === 'bn' ? 'বকেয়া আছে' : 'Has Due'}
                </span>
              )}
            </div>
            <Input
              type="number"
              min={0}
              max={netAmount}
              value={dueAmount === 0 ? '' : dueAmount}
              onChange={(e) => {
                const dueVal = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                const boundedDue = Math.min(dueVal, netAmount);
                onDueAmountChange?.(boundedDue);
                onPaidAmountChange(Math.max(0, netAmount - boundedDue));
              }}
              placeholder="০"
              className={`font-mono text-xs rounded-xl h-9 font-black transition-colors ${
                dueAmount > 0
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-300 dark:border-rose-800 focus:ring-rose-500'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-800'
              }`}
            />
          </div>
        </div>

        {/* Due Settlement Details (Rendered when Due > 0) */}
        {dueAmount > 0 && (
          <div className="p-3 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-800/40 pb-1.5">
              <span className="text-[11px] font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{language === 'bn' ? 'বকেয়া পরিশোধের বিবরণ' : 'Due Settlement Details'}</span>
              </span>
              <span className="text-[10px] font-mono font-black text-rose-600 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-rose-200">
                {formatCurrency(dueAmount)}
              </span>
            </div>

            {/* Pay on Bus Option */}
            <label className="flex items-start gap-2.5 p-2 bg-white/80 dark:bg-slate-900/80 border border-rose-200/80 dark:border-rose-800/60 rounded-xl cursor-pointer select-none hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={!!isPayOnBus}
                onChange={(e) => onIsPayOnBusChange?.(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  🚌 {language === 'bn' ? 'বাসে উঠে প্রদান করবে (Pay on Bus)' : 'Pay Remaining on Bus'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                  {language === 'bn' ? 'যাত্রী বাসে উঠার পর সুপারভাইজারকে বকেয়া টাকা পরিশোধ করবে' : 'Passenger will pay supervisor before or during trip'}
                </span>
              </div>
            </label>

            {/* Due Settlement Date Picker */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                📅 {language === 'bn' ? 'বকেয়া পরিশোধের তারিখ' : 'Due Settlement Date'}
              </label>
              <Input
                type="date"
                value={duePromiseDate || ''}
                onChange={(e) => onDuePromiseDateChange?.(e.target.value)}
                className="h-8 text-xs font-medium rounded-xl bg-white dark:bg-slate-900"
              />
            </div>

            {/* Due Note / Remark */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                📝 {language === 'bn' ? 'বকেয়া সংক্রান্ত নোট / মন্তব্য (ঐচ্ছিক)' : 'Due Note (Optional)'}
              </label>
              <Input
                type="text"
                value={dueNote || ''}
                onChange={(e) => onDueNoteChange?.(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: বাসে উঠে ২০০ টাকা দিবে...' : 'e.g., will pay supervisor on bus...'}
                className="h-8 text-xs rounded-xl bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        )}

        {/* Auto Print Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input
              type="checkbox"
              checked={autoPrintTicket}
              onChange={(e) => onAutoPrintTicketChange(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>{language === 'bn' ? 'বুকিং শেষে টিকিট স্বয়ংক্রিয় প্রিন্ট করুন' : 'Auto print ticket on confirm'}</span>
          </label>
        </div>

        {/* Submit Booking Button */}
        <div className="pt-2">
          <Button
            type="button"
            disabled={isSubmitting || selectedSeats.length === 0}
            onClick={onConfirmBooking}
            className="w-full h-11 text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{language === 'bn' ? 'টিকিট নিশ্চিত হচ্ছে...' : 'Processing...'}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Printer className="w-4 h-4" />
                <span>{language === 'bn' ? `টিকিট নিশ্চিত করুন (৳${paidAmount})` : `Confirm Ticket (${formatCurrency(paidAmount)})`}</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
