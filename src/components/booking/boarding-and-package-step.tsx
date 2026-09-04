'use client';

import React from 'react';
import { Bus, ArrowLeft, ArrowRight, Sparkles, Hotel, Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  includeHotelPackage: boolean;
  hotelFeePerPerson: number;
  hotelPackageDetails: string;
  estimatedNet: number;
  onJourneyTypeChange: (type: JourneyType) => void;
  onBoardingChange: (val: string) => void;
  onDroppingChange: (val: string) => void;
  onHotelToggle: (include: boolean) => void;
  onHotelFeeChange: (fee: number) => void;
  onGoBack: () => void;
  onContinue: () => void;
}

const JOURNEY_OPTIONS: { id: JourneyType; labelBn: string; labelEn: string; descBn: string; descEn: string }[] = [
  { id: 'ROUND_TRIP', labelBn: 'উভয়মুখী', labelEn: 'Round Trip', descBn: 'যাওয়া ও আসা (পূর্ণ ভাড়া)', descEn: 'Both ways (full fare)' },
  { id: 'OUTBOUND_ONLY', labelBn: 'শুধু যাওয়া', labelEn: 'Outbound Only', descBn: 'শুধু পরীক্ষার যাত্রা (অর্ধেক ভাড়া)', descEn: 'One-way to exam (half fare)' },
  { id: 'RETURN_ONLY', labelBn: 'শুধু আসা', labelEn: 'Return Only', descBn: 'শুধু ফেরত যাত্রা (অর্ধেক ভাড়া)', descEn: 'Return journey only (half fare)' },
  { id: 'ASYMMETRIC', labelBn: 'স্প্লিট', labelEn: 'Split', descBn: 'কিছু যাত্রী উভয়মুখী, কিছু একমুখী', descEn: 'Mix of round & one-way' }
];

export function BoardingAndPackageStep({
  trip,
  selectedSeatCount,
  journeyType,
  boardingPoint,
  droppingPoint,
  hasHotelPackageOption,
  includeHotelPackage,
  hotelFeePerPerson,
  hotelPackageDetails,
  estimatedNet,
  onJourneyTypeChange,
  onBoardingChange,
  onDroppingChange,
  onHotelToggle,
  onHotelFeeChange,
  onGoBack,
  onContinue
}: BoardingStepProps) {
  const { language } = useApp();

  return (
    <div className="space-y-5">
      {/* Trip recap chip */}
      {trip && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 flex-wrap">
            <Bus className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-sm sm:text-base font-extrabold">{trip.bus?.busName || trip.bus?.bus_name}</span>
            {(trip.bus?.busNumber || trip.bus?.bus_number) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black font-mono text-sm sm:text-base rounded-lg shadow-2xs border border-amber-300">
                {trip.bus?.busNumber || trip.bus?.bus_number}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(trip.departureDate)}</span>
            <Clock className="w-3.5 h-3.5 ml-2" />
            <span>{formatTime(trip.departureTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <MapPin className="w-3.5 h-3.5" />
            <span>{trip.route?.routeName || trip.route?.route_name}</span>
          </div>
        </div>
      )}

      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg font-black">
            {language === 'bn' ? 'বোর্ডিং পয়েন্ট ও হোটেল প্যাকেজ' : 'Boarding Points & Hotel Tour Package'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
          {/* Journey Direction */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bus className="w-4 h-4 text-blue-600" />
              {language === 'bn' ? 'যাত্রার ধরণ নির্ধারণ করুন' : 'Journey Direction'}
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {JOURNEY_OPTIONS.map((opt) => {
                const isSelected = journeyType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onJourneyTypeChange(opt.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400/60'
                    }`}
                  >
                    <span className={`block text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {language === 'bn' ? opt.labelBn : opt.labelEn}
                    </span>
                    <span className={`block text-[10px] font-medium mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {language === 'bn' ? opt.descBn : opt.descEn}
                    </span>
                  </button>
                );
              })}
            </div>
            {journeyType === 'ASYMMETRIC' && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
                💡 {language === 'bn'
                  ? 'পরবর্তী ধাপে প্রতিটি সিটের জন্য আলাদাভাবে যাত্রার ধরণ বাছাই করার সুযোগ থাকবে।'
                  : 'In the next step you will be able to choose the journey type per seat.'}
              </p>
            )}
          </div>

          {/* Boarding / Dropping */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <BoardingPointSelector
              boardingPoint={boardingPoint}
              onBoardingChange={onBoardingChange}
              droppingPoint={droppingPoint}
              onDroppingChange={onDroppingChange}
            />
          </div>

          {/* Hotel Package */}
          <div className="p-4 sm:p-5 bg-purple-50/70 dark:bg-purple-950/30 rounded-3xl border-2 border-purple-300 dark:border-purple-800 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
                  <Hotel className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-black text-sm text-purple-950 dark:text-purple-100 block">
                    {language === 'bn' ? 'হোটেল ও আবাসন প্যাকেজ' : 'Hotel Tour Package'}
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                    {language === 'bn'
                      ? 'পরীক্ষা শেষে আবাসনের ব্যবস্থা (ঐচ্ছিক)'
                      : 'Accommodation after the exam (optional)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onHotelToggle(!includeHotelPackage)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${includeHotelPackage ? 'bg-purple-600' : 'bg-slate-300'}`}
                aria-pressed={includeHotelPackage}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${includeHotelPackage ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {!hasHotelPackageOption && (
              <p className="text-[11px] text-purple-800 dark:text-purple-300 font-bold bg-white/60 dark:bg-white/5 border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-2">
                {language === 'bn'
                  ? 'এই বাসে কোনো নির্ধারিত হোটেল প্যাকেজ নেই। প্যাকেজ টগল চালু করে ম্যানুয়ালি আবাসন যোগ করতে পারবেন।'
                  : 'No preset hotel package on this bus. You can manually add accommodation using the toggle.'}
              </p>
            )}

            {includeHotelPackage && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'হোটেল / আবাসনের বিবরণ' : 'Hotel / Accommodation Details'}
                  </label>
                  <Input
                    type="text"
                    value={hotelPackageDetails}
                    onChange={(e) => {
                      // keep details in wizard state through the shared handler is not exposed here;
                      // details live in the wizard — display only for now
                    }}
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? `জনপ্রতি আবাসন ফি (${selectedSeatCount} জন) *` : `Hotel Fee per Person (${selectedSeatCount} pax) *`}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={hotelFeePerPerson}
                    onChange={(e) => onHotelFeeChange(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>
                      {language === 'bn'
                        ? `আবাসন মোট: ${selectedSeatCount} × ৳${hotelFeePerPerson}`
                        : `Hotel total: ${selectedSeatCount} × ৳${hotelFeePerPerson}`}
                    </span>
                  </div>
                  <span className="text-base font-black font-mono text-purple-700 dark:text-purple-300">
                    {formatCurrency(selectedSeatCount * hotelFeePerPerson)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Error Alert */}
      {(!boardingPoint?.trim() || !droppingPoint?.trim()) && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-bold">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{language === 'bn' ? 'যাত্রার বোর্ডিং ও ড্রপিং পয়েন্ট নিশ্চিত করে এগিয়ে যান।' : 'Please ensure both boarding and dropping points are selected.'}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 pb-12 mr-0 sm:mr-32">
        <Button variant="outline" onClick={onGoBack} className="w-full sm:w-auto rounded-2xl px-5 font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'পেছনে যান (যাত্রী তথ্য)' : 'Back to Passenger Details'}
        </Button>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{language === 'bn' ? 'আনুমানিক মোট' : 'Estimated Total'}</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{formatCurrency(estimatedNet)}</span>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              if (!boardingPoint?.trim()) {
                alert(language === 'bn' ? 'অনুগ্রহ করে বোর্ডিং পয়েন্ট নির্বাচন করুন।' : 'Please select a boarding point.');
                return;
              }
              if (!droppingPoint?.trim()) {
                alert(language === 'bn' ? 'অনুগ্রহ করে ড্রপিং পয়েন্ট নির্বাচন করুন।' : 'Please select a dropping point.');
                return;
              }
              onContinue();
            }}
            className="w-full sm:w-auto font-black rounded-2xl shadow-lg shadow-blue-500/25 px-8 text-sm sm:text-base py-3 cursor-pointer"
          >
            {language === 'bn' ? 'ছাড় ও ভাড়া ধাপে যান' : 'Continue to Discounts & Fare'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
