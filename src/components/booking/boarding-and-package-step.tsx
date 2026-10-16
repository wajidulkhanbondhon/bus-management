'use client';

import React from 'react';
import {
  Bus,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Hotel,
  Calendar,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Luggage,
  Navigation,
  Info,
  Check,
  Layers,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { BoardingPointSelector } from './boarding-point-selector';
import { useApp } from '@/lib/context';

export type JourneyType = 'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY' | 'ASYMMETRIC';

export interface BoardingStepProps {
  trip: any;
  selectedSeatCount: number;
  journeyType: JourneyType;
  boardingPoint: string;
  droppingPoint: string;
  hasHotelPackageOption: boolean;
  includeHotelPackage?: boolean;
  hotelFeePerPerson?: number;
  hotelPackageDetails?: string;
  estimatedNet: number;
  onJourneyTypeChange: (type: JourneyType) => void;
  onBoardingChange: (val: string) => void;
  onDroppingChange: (val: string) => void;
  onHotelToggle?: (include: boolean) => void;
  onHotelFeeChange?: (fee: number) => void;
  onGoBack: () => void;
  onContinue: () => void;
}

const JOURNEY_OPTIONS: {
  id: JourneyType;
  labelBn: string;
  labelEn: string;
  badgeBn: string;
  descBn: string;
  descEn: string;
  icon: string;
}[] = [
  {
    id: 'ROUND_TRIP',
    labelBn: 'উভয়মুখী যাত্রা',
    labelEn: 'Round Trip',
    badgeBn: 'পূর্ণ ভাড়া',
    descBn: 'পরীক্ষার আগের দিন যাওয়া এবং পরীক্ষা শেষে ফেরত আসা।',
    descEn: 'Both outbound & return journey (full fare)',
    icon: '🔁'
  },
  {
    id: 'OUTBOUND_ONLY',
    labelBn: 'শুধু যাওয়া',
    labelEn: 'Outbound Only',
    badgeBn: 'একমুখী',
    descBn: 'পরীক্ষা কেন্দ্রে পৌঁছানোর একমুখী যাত্রা।',
    descEn: 'One-way to exam destination',
    icon: '➡️'
  },
  {
    id: 'RETURN_ONLY',
    labelBn: 'শুধু আসা (ফেরত)',
    labelEn: 'Return Only',
    badgeBn: 'একমুখী',
    descBn: 'পরীক্ষা শেষে ক্যাম্পাস থেকে ফেরার একমুখী যাত্রা।',
    descEn: 'One-way return back home',
    icon: '⬅️'
  },
  {
    id: 'ASYMMETRIC',
    labelBn: 'স্প্লিট / মিশ্র যাত্রা',
    labelEn: 'Split / Mixed',
    badgeBn: 'কাস্টম',
    descBn: 'কিছু যাত্রী উভয়মুখী এবং কিছু যাত্রী একমুখী ভ্রমণ করবেন।',
    descEn: 'Mix of round-trip & one-way for different seats',
    icon: '🔀'
  }
];

export function BoardingAndPackageStep({
  trip,
  selectedSeatCount,
  journeyType,
  boardingPoint,
  droppingPoint,
  hasHotelPackageOption,
  hotelFeePerPerson = 1200,
  hotelPackageDetails = 'ক্যাম্পাস রেসিডেনসিয়াল হোটেল অ্যান্ড স্যুটস',
  estimatedNet,
  onJourneyTypeChange,
  onBoardingChange,
  onDroppingChange,
  onGoBack,
  onContinue
}: BoardingStepProps) {
  const { language } = useApp();
  const isBn = language === 'bn';

  const totalHotelAmount = hasHotelPackageOption ? selectedSeatCount * hotelFeePerPerson : 0;

  return (
    <div className="space-y-6">
      {/* ── 1. Trip Recap Header Chip ── */}
      {trip && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-lg border border-blue-700/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-full bg-radial from-blue-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            {/* Bus & Coach Identity */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sky-300 shadow-inner shrink-0">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {trip.bus?.busName || trip.bus?.bus_name || 'বিশ্ববিদ্যালয় স্পেশাল বাস'}
                  </h3>
                  {(trip.bus?.busNumber || trip.bus?.bus_number) && (
                    <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black font-mono text-xs sm:text-sm rounded-lg shadow-xs border border-amber-300">
                      {trip.bus?.busNumber || trip.bus?.bus_number}
                    </span>
                  )}
                  {hasHotelPackageOption && (
                    <span className="px-2.5 py-0.5 bg-purple-500/30 text-purple-200 border border-purple-400/50 font-bold text-xs rounded-full flex items-center gap-1">
                      <Hotel className="w-3.5 h-3.5 text-purple-300" />
                      {isBn ? 'হোটেল সুবিধা যুক্ত' : 'Hotel Bundled'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-sky-200/90 font-medium flex items-center gap-1.5 mt-0.5">
                  <Navigation className="w-3.5 h-3.5 text-sky-400" />
                  <span>{trip.route?.routeName || trip.route?.route_name || 'ঢাকা ➔ বিশ্ববিদ্যালয় ক্যাম্পাস'}</span>
                </p>
              </div>
            </div>

            {/* Schedule & Pax Count */}
            <div className="flex items-center gap-4 text-xs font-semibold bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/15">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>{formatDate(trip.departureDate)}</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-1.5 text-slate-200">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{formatTime(trip.departureTime)}</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <span>{selectedSeatCount} {isBn ? 'সিট নির্বাচিত' : 'Seats'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Journey Direction Selector ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
          <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl">
              <Navigation className="w-4 h-4" />
            </span>
            {isBn ? 'যাত্রার ধরণ নির্বাচন করুন (Journey Direction)' : 'Select Journey Direction'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {JOURNEY_OPTIONS.map((opt) => {
              const isSelected = journeyType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onJourneyTypeChange(opt.id)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50 scale-[1.01]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xl">{opt.icon}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isBn ? opt.badgeBn : opt.badgeBn}
                      </span>
                    </div>
                    <span className={`block text-xs sm:text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {isBn ? opt.labelBn : opt.labelEn}
                    </span>
                    <p className={`text-[11px] leading-relaxed font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {isBn ? opt.descBn : opt.descEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 dark:border-slate-800">
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {isSelected ? (isBn ? '✓ নির্বাচিত' : '✓ Selected') : (isBn ? 'নির্বাচন করতে ক্লিক করুন' : 'Click to select')}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-black shadow-xs">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {journeyType === 'ASYMMETRIC' && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-bold">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isBn
                  ? '💡 স্প্লিট জার্নি সক্রিয়: পরের ধাপে প্রতিটি সিটের জন্য আলাদাভাবে যাওয়া/আসা বা উভয়মুখী নির্ধারণ করার সুযোগ পাবেন।'
                  : '💡 Split journey active: You can assign outbound, return, or round-trip separately per seat in the next step.'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Boarding & Dropping Point Selector ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
                <MapPin className="w-4 h-4" />
              </span>
              {isBn ? 'বোর্ডিং ও ড্রপিং পয়েন্ট নির্বাচন' : 'Boarding & Dropping Points'}
            </CardTitle>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isBn ? 'কাউন্টার ও ড্রপ লোকেশন' : 'Pick-up & Drop-off'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <BoardingPointSelector
            boardingPoint={boardingPoint}
            onBoardingChange={onBoardingChange}
            droppingPoint={droppingPoint}
            onDroppingChange={onDroppingChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white font-bold">কাউন্টার উপস্থিতি সময়:</strong>
                বাস ছাড়ার অন্তত ৩০-৪৫ মিনিট আগে নির্বাচিত বোর্ডিং পয়েন্টে উপস্থিত থাকতে হবে।
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white font-bold">সরাসরি ক্যাম্পাস ড্রপ:</strong>
                পরীক্ষার্থীদের সুবিধার্থে বাস সরাসরি বিশ্ববিদ্যালয়ের প্রধান ফটকে পৌঁছাবে।
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Hotel Accommodation Section (Automatic Extra Fare - No Manual Option) ── */}
      {hasHotelPackageOption && (
        <div className="p-5 sm:p-6 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-slate-900 rounded-3xl border-2 border-purple-300 dark:border-purple-800 shadow-md space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/80 dark:border-purple-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
                <Hotel className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-base text-purple-950 dark:text-purple-100">
                    {isBn ? 'ক্যাম্পাস হোটেল ও আবাসন সুবিধা সংযুক্ত' : 'Campus Accommodation Included'}
                  </h4>
                  <span className="px-2.5 py-0.5 bg-purple-600 text-white text-[11px] font-black rounded-full shadow-xs uppercase tracking-wide">
                    {isBn ? 'বাস ভাড়ার সাথে যুক্ত' : 'Extra Fare Added'}
                  </span>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-300 font-medium mt-0.5">
                  {isBn
                    ? 'এই বাসের প্রতিটি সিটের সাথে আবাসন ব্যবস্থা নিশ্চিত করা হয়েছে।'
                    : 'Accommodation is automatically attached to this bus trip.'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-purple-200 dark:border-purple-800 shrink-0">
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
                {isBn ? 'জনপ্রতি আবাসন ফি' : 'Hotel Fee per Person'}
              </span>
              <span className="text-lg font-black font-mono text-purple-950 dark:text-purple-100">
                ৳{hotelFeePerPerson}
              </span>
            </div>
          </div>

          {/* Hotel Spec Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-purple-900/60 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                {isBn ? 'হোটেল / আবাসন' : 'Hotel Name'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                {hotelPackageDetails}
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-purple-900/60 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                {isBn ? 'রুম ও সুযোগ-সুবিধা' : 'Room & Amenities'}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                ডিলাক্স এসি রুম • ফ্রি সকালের নাস্তা • শাটল
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-purple-900/60 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                {isBn ? 'মোট আবাসন অতিরিক্ত ভাড়া' : 'Total Hotel Fare'}
              </span>
              <span className="text-xs font-black font-mono text-purple-700 dark:text-purple-300 block">
                {selectedSeatCount} জন × ৳{hotelFeePerPerson} = {formatCurrency(totalHotelAmount)}
              </span>
            </div>
          </div>

          {/* Dual Ticket Issuance Alert */}
          <div className="p-3 bg-purple-100/70 dark:bg-purple-900/30 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center gap-3 text-xs text-purple-900 dark:text-purple-200 font-bold">
            <span className="p-1 rounded-lg bg-purple-600 text-white shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <span>
              {isBn
                ? '📋 এই বুকিংয়ের জন্য দুটি আলাদা টিকিট তৈরি হবে: (১) বাসের ভ্রমণ টিকিট এবং (২) হোটেলের আবাসন পাস।'
                : '📋 Two separate passes will be issued: (1) Bus Travel Ticket and (2) Hotel Accommodation Pass.'}
            </span>
          </div>
        </div>
      )}

      {/* ── 5. Travel Perks & Luggage Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Luggage className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] font-black text-slate-900 dark:text-white">২০ কেজি লাগেজ</span>
            <span className="block text-[10px] text-slate-500 font-medium">সম্পূর্ণ ফ্রি বহনযোগ্য</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] font-black text-slate-900 dark:text-white">ডিজিটাল ভেরিফায়েড</span>
            <span className="block text-[10px] text-slate-500 font-medium">নিরাপদ সিট নিশ্চয়তা</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] font-black text-slate-900 dark:text-white">পরীক্ষার্থী স্পেশাল</span>
            <span className="block text-[10px] text-slate-500 font-medium">সময়মতো কেন্দ্রে পৌঁছানো</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] font-black text-slate-900 dark:text-white">সার্বক্ষণিক হেল্পডেস্ক</span>
            <span className="block text-[10px] text-slate-500 font-medium">২৪/৭ প্রতিনিধি সেবা</span>
          </div>
        </div>
      </div>

      {/* ── 6. Step Error Alert ── */}
      {(!boardingPoint?.trim() || !droppingPoint?.trim()) && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-bold">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isBn
              ? 'অনুগ্রহ করে বাসের বোর্ডিং এবং ড্রপিং পয়েন্ট নির্বাচন করে পরবর্তী ধাপে এগিয়ে যান।'
              : 'Please ensure both boarding and dropping points are selected before continuing.'}
          </span>
        </div>
      )}

      {/* ── 7. Bottom Navigation & Fare Counter ── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 pb-12 mr-0 sm:mr-32">
        <Button
          variant="outline"
          onClick={onGoBack}
          className="w-full sm:w-auto rounded-2xl px-5 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isBn ? 'পেছনে যান (যাত্রী তথ্য)' : 'Back to Passenger Details'}
        </Button>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {isBn ? 'মোট আনুমানিক ভাড়া (ভ্রমণ' : 'Estimated Total'}
              {hasHotelPackageOption ? (isBn ? ' + হোটেল)' : ' + Hotel)') : (isBn ? ')' : '')}
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(estimatedNet)}
            </span>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              if (!boardingPoint?.trim()) {
                alert(isBn ? 'অনুগ্রহ করে বোর্ডিং পয়েন্ট নির্বাচন করুন।' : 'Please select a boarding point.');
                return;
              }
              if (!droppingPoint?.trim()) {
                alert(isBn ? 'অনুগ্রহ করে ড্রপিং পয়েন্ট নির্বাচন করুন।' : 'Please select a dropping point.');
                return;
              }
              onContinue();
            }}
            className="w-full sm:w-auto font-black rounded-2xl shadow-lg shadow-blue-500/25 px-8 text-sm sm:text-base py-3 cursor-pointer"
          >
            {isBn ? 'ভাড়া ও পেমেন্ট ধাপে যান' : 'Continue to Fare & Payment'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
