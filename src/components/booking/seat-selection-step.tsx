'use client';

import React from 'react';
import { Bus, Armchair, Palette, PlusCircle, ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

const COLOR_OPTIONS: { id: string; bgClass: string; borderClass: string; textClass: string; dotClass: string }[] = [
  { id: 'emerald', bgClass: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/70 dark:to-emerald-900/70', borderClass: 'border-emerald-500 dark:border-emerald-400', textClass: 'text-emerald-950 dark:text-emerald-100', dotClass: 'bg-emerald-500' },
  { id: 'blue', bgClass: 'from-blue-50 to-blue-100 dark:from-blue-950/70 dark:to-blue-900/70', borderClass: 'border-blue-500 dark:border-blue-400', textClass: 'text-blue-950 dark:text-blue-100', dotClass: 'bg-blue-500' },
  { id: 'purple', bgClass: 'from-purple-50 to-purple-100 dark:from-purple-950/70 dark:to-purple-900/70', borderClass: 'border-purple-500 dark:border-purple-400', textClass: 'text-purple-950 dark:text-purple-100', dotClass: 'bg-purple-500' },
  { id: 'amber', bgClass: 'from-amber-50 to-amber-100 dark:from-amber-950/70 dark:to-amber-900/70', borderClass: 'border-amber-500 dark:border-amber-400', textClass: 'text-amber-950 dark:text-amber-100', dotClass: 'bg-amber-500' },
  { id: 'rose', bgClass: 'from-rose-50 to-rose-100 dark:from-rose-950/70 dark:to-rose-900/70', borderClass: 'border-rose-500 dark:border-rose-400', textClass: 'text-rose-950 dark:text-rose-100', dotClass: 'bg-rose-500' },
  { id: 'cyan', bgClass: 'from-cyan-50 to-cyan-100 dark:from-cyan-950/70 dark:to-cyan-900/70', borderClass: 'border-cyan-500 dark:border-cyan-400', textClass: 'text-cyan-950 dark:text-cyan-100', dotClass: 'bg-cyan-500' }
];

export interface FareRangeSegment {
  id: string;
  name: string;
  startRow: string;
  endRow: string;
  fare: number;
  color: string;
}

export interface SeatStepProps {
  trip: any;
  activeCapacity: number;
  activeSegments: FareRangeSegment[];
  tripSeats: any[];
  extraSeats: any[];
  selectedSeatIds: string[];
  isLoadingSeats: boolean;
  dynamicAdjacentLocks: Map<string, { genderAllowed: string; adjacentBookedSeat: string; reason: string }>;
  onToggleSeat: (seatId: string, status: string) => void;
  onAddExtraSeat: () => void;
  onRemoveExtraSeat: (seatId: string) => void;
  onGoBack: () => void;
  onContinue: () => void;
  onErrorMessage?: (msg: string) => void;
}

const rowLetters = 'ABCDEFGHIJKLMN';

function parseSeatPosition(seat: any, totalRowsCount: number, activeCapacity: number) {
  if (!seat) return { rowIndex: 0, colIndex: 0, isExtra: false };
  const numStr = (seat?.seatNumber || seat?.seat_number || seat?.label || seat?.seatId || seat?.id || '').toString().trim().toUpperCase();

  if (numStr.startsWith('EX') || seat?.isExtra || seat?.seatType === 'EXTRA') {
    return { rowIndex: 999, colIndex: seat?.colIndex ?? 0, isExtra: true };
  }

  const match = numStr.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    const rowChar = match[1];
    const colDigit = parseInt(match[2], 10);
    const rIdx = rowLetters.indexOf(rowChar);

    if (rIdx >= 0) {
      if (rIdx === totalRowsCount - 1 && (totalRowsCount === 11 || activeCapacity === 45 || activeCapacity === 42)) {
        if (colDigit >= 1 && colDigit <= 5) {
          return { rowIndex: rIdx, colIndex: colDigit - 1, isExtra: false };
        }
      }
      if (colDigit === 1) return { rowIndex: rIdx, colIndex: 0, isExtra: false };
      if (colDigit === 2) return { rowIndex: rIdx, colIndex: 1, isExtra: false };
      if (colDigit === 3) return { rowIndex: rIdx, colIndex: 3, isExtra: false };
      if (colDigit === 4) return { rowIndex: rIdx, colIndex: 4, isExtra: false };
      if (colDigit === 5) return { rowIndex: rIdx, colIndex: 4, isExtra: false };
    }
  }

  let r = seat.rowIndex ?? seat.row ?? 0;
  const c = seat.colIndex ?? seat.col ?? 0;
  if (r >= 1 && seat.rowIndex === undefined) r = r - 1;
  return { rowIndex: r, colIndex: c, isExtra: false };
}

function getSegmentForRow(rowChar: string, currentSegments: FareRangeSegment[], rowLettersArr: string): FareRangeSegment | undefined {
  if (!rowChar || typeof rowChar !== 'string') return undefined;
  return currentSegments.find((seg) => {
    if (!seg?.startRow || !seg?.endRow) return false;
    const startIdx = rowLettersArr.indexOf(seg.startRow.toUpperCase());
    const endIdx = rowLettersArr.indexOf(seg.endRow.toUpperCase());
    const curIdx = rowLettersArr.indexOf(rowChar.toUpperCase());
    return curIdx >= startIdx && curIdx <= endIdx;
  });
}

export function SeatSelectionStep({
  trip,
  activeCapacity,
  activeSegments,
  tripSeats,
  extraSeats,
  selectedSeatIds,
  isLoadingSeats,
  dynamicAdjacentLocks,
  onToggleSeat,
  onAddExtraSeat,
  onRemoveExtraSeat,
  onGoBack,
  onContinue
}: SeatStepProps) {
  const { language } = useApp();
  const allCurrentSeats = [...tripSeats, ...extraSeats];

  const totalRows = Math.max(
    activeCapacity === 45 ? 11 : activeCapacity === 40 ? 10 : Math.ceil(activeCapacity / 4),
    Math.max(1, ...tripSeats.map((s) => (s.rowIndex ?? 0) + 1))
  );

  const grossAmount = selectedSeatIds.reduce((sum, sId) => {
    const seatObj = allCurrentSeats.find((s) => s.seatId === sId);
    return sum + (seatObj?.fare || trip?.basePrice || 550);
  }, 0);

  function renderRealisticCoachSeat(seatObj?: any, isMiddleSeat = false, segment?: FareRangeSegment) {
    if (!seatObj) return <div className="w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] shrink-0" />;

    const isSelected = selectedSeatIds.includes(seatObj.seatId);
    const isBooked = seatObj.status === 'BOOKED';
    const isHeld = seatObj.status === 'HELD';
    const isAvailable = seatObj.status === 'AVAILABLE' || (!isBooked && !isHeld);

    const seatNum = (seatObj.seatNumber || (seatObj as any).seat_number || (seatObj as any).label || '').trim().toUpperCase();
    const dynamicLock = seatNum ? dynamicAdjacentLocks.get(seatNum) : undefined;
    const isFemaleOnly = seatObj.genderAllowed === 'FEMALE_ONLY' || dynamicLock?.genderAllowed === 'FEMALE_ONLY';
    const isMaleOnly = seatObj.genderAllowed === 'MALE_ONLY' || dynamicLock?.genderAllowed === 'MALE_ONLY';

    const segColorCfg = segment ? COLOR_OPTIONS.find((c) => c.id === segment.color) : undefined;
    const seatPrice = seatObj.fare || segment?.fare || 550;

    return (
      <button
        key={seatObj.seatId}
        type="button"
        disabled={!isAvailable}
        onClick={() => onToggleSeat(seatObj.seatId, seatObj.status)}
        title={dynamicLock ? `${dynamicLock.reason} (${dynamicLock.genderAllowed === 'FEMALE_ONLY' ? 'শুধুমাত্র নারী' : 'শুধুমাত্র পুরুষ'})` : `সিট: ${seatNum || 'Seat'}`}
        className={`w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] shrink-0 p-1.5 rounded-2xl flex flex-col items-center justify-between text-base font-black transition-all duration-200 ease-out relative select-none cursor-pointer ${
          isBooked
            ? 'bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200 dark:from-rose-950/70 dark:to-rose-900/70 text-rose-950 dark:text-rose-200 border-2 border-rose-300 dark:border-rose-700 opacity-60 shadow-xs cursor-not-allowed'
            : isHeld
            ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/70 dark:to-amber-900/70 text-amber-950 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 opacity-75 shadow-xs cursor-not-allowed'
            : isSelected
            ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white border-2 border-blue-300 shadow-xl shadow-blue-500/40 ring-4 ring-blue-400/40 -translate-y-1 z-10'
            : seatObj.isExtra
            ? 'bg-gradient-to-b from-purple-50 via-purple-100 to-purple-200 dark:from-purple-950/80 dark:to-purple-900/80 text-purple-950 dark:text-purple-100 border-2 border-purple-400 dark:border-purple-500 shadow-sm hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
            : isFemaleOnly
            ? 'bg-gradient-to-b from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950/80 dark:to-pink-900/80 text-pink-950 dark:text-pink-100 border-2 border-pink-400 dark:border-pink-500 shadow-sm shadow-pink-500/10 hover:shadow-lg hover:shadow-pink-500/30 hover:border-pink-500 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
            : isMaleOnly
            ? 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/80 dark:to-blue-900/80 text-blue-950 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-500 shadow-sm shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/30 hover:border-blue-500 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
            : isMiddleSeat
            ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/80 dark:to-amber-900/80 text-amber-950 dark:text-amber-100 border-2 border-amber-400 dark:border-amber-500 shadow-sm hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
            : segColorCfg
            ? `bg-gradient-to-b ${segColorCfg.bgClass} ${segColorCfg.textClass} border-2 ${segColorCfg.borderClass} shadow-sm hover:shadow-lg hover:-translate-y-1 active:translate-y-0.5 active:scale-95`
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 shadow-sm hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
        }`}
      >
        <div
          className={`w-10 h-1.5 rounded-full shadow-inner transition-all ${
            isSelected
              ? 'bg-white/95 shadow-white/40'
              : isBooked
              ? 'bg-rose-400'
              : isHeld
              ? 'bg-amber-400'
              : seatObj.isExtra
              ? 'bg-purple-500'
              : isFemaleOnly
              ? 'bg-pink-500'
              : isMaleOnly
              ? 'bg-blue-500'
              : isMiddleSeat
              ? 'bg-amber-500'
              : segColorCfg
              ? segColorCfg.dotClass
              : 'bg-slate-400'
          }`}
        />

        <span className={`text-base sm:text-lg font-black tracking-tight leading-none font-mono drop-shadow-xs ${isSelected ? 'text-white' : ''}`}>
          {seatObj.seatNumber}
        </span>

        <div
          className={`w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded-lg overflow-hidden backdrop-blur-xs transition-colors ${
            isSelected ? 'bg-black/25 text-white border border-white/20' : 'bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5'
          }`}
        >
          {isSelected ? (
            <span className="text-xs sm:text-sm font-black font-mono leading-none tracking-tight flex items-center gap-1 text-white">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> ৳{seatPrice}
            </span>
          ) : isBooked ? (
            <span className="text-[10px] sm:text-xs font-black tracking-tight text-rose-800 dark:text-rose-200 leading-none">বুকড</span>
          ) : isHeld ? (
            <span className="text-[10px] sm:text-xs font-black tracking-tight text-amber-800 dark:text-amber-200 leading-none">হোল্ড</span>
          ) : (
            <span className="text-xs sm:text-sm font-black font-mono leading-none tracking-tight truncate">৳{seatPrice}</span>
          )}

          {!isSelected && !isBooked && !isHeld && isFemaleOnly && (
            <span className="text-[9px] text-pink-800 dark:text-pink-300 font-black leading-none" title={dynamicLock?.reason || 'নারী সংরক্ষিত'}>
              {dynamicLock ? '♀ Lock' : '♀'}
            </span>
          )}
          {!isSelected && !isBooked && !isHeld && isMaleOnly && (
            <span className="text-[9px] text-blue-800 dark:text-blue-300 font-black leading-none" title={dynamicLock?.reason || 'পুরুষ সংরক্ষিত'}>
              {dynamicLock ? '♂ Lock' : '♂'}
            </span>
          )}
          {!isSelected && !isBooked && !isHeld && isMiddleSeat && (
            <span className="text-[8px] text-amber-800 dark:text-amber-200 font-black leading-none">MID</span>
          )}
        </div>
      </button>
    );
  }

  function renderSeatSlot(rowCells: any[], r: number, c: number, isMiddle = false, segment?: FareRangeSegment) {
    let seatObj = rowCells.find((cell) => cell.colIndex === c);

    if (!seatObj && (!isMiddle || (r === totalRows - 1 && (activeCapacity === 45 || activeCapacity === 42)))) {
      const rowChar = rowLetters[r] || `R${r + 1}`;
      let seatNum = '';
      if (r === totalRows - 1 && (activeCapacity === 45 || activeCapacity === 42)) {
        seatNum = `${rowChar}${c + 1}`;
      } else {
        const colDigit = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
        seatNum = `${rowChar}${colDigit}`;
      }

      seatObj = {
        seatId: `seat-${trip?.id || 'trip'}-${seatNum}`,
        seatNumber: seatNum,
        rowIndex: r,
        colIndex: c,
        seatType: r < 5 ? 'VIP' : 'STANDARD',
        genderAllowed: 'ANY',
        fare: segment?.fare || (r < 5 ? 650 : r < 8 ? 550 : 500),
        fareZoneName: segment?.name || 'Standard',
        status: 'AVAILABLE'
      };
    }

    return renderRealisticCoachSeat(seatObj, isMiddle, segment);
  }

  return (
    <div className="space-y-5">
      {/* Selected Bus Banner */}
      {trip && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 sm:p-5 rounded-3xl shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black bg-white/25 px-2.5 py-0.5 rounded-md">
                  {trip.tripCode || trip.trip_code}
                </span>
                <span className="font-bold text-sm sm:text-base">
                  {trip.bus?.busName || trip.bus?.bus_name} ({trip.bus?.busNumber || trip.bus?.bus_number})
                </span>
                <Badge variant="default" className="bg-white/30 text-white font-bold text-xs">
                  {trip.tripBusType === 'FEMALE' ? '👩 ছাত্রী স্পেশাল' : trip.tripBusType === 'MALE' ? '👨 ছাত্র স্পেশাল' : '👥 মিক্সড কোচ'}
                </Badge>
              </div>
              <div className="text-xs text-white/90 mt-1 flex items-center gap-2 flex-wrap font-medium">
                <span>📍 {trip.route?.routeName || trip.route?.route_name}</span>
                <span>•</span>
                <span>🕒 {formatDate(trip.departureDate)} • {formatTime(trip.departureTime)}</span>
                <span>•</span>
                <span className="font-mono font-bold">ভাড়া: {formatCurrency(trip.basePrice || 550)}</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGoBack}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-bold text-xs shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            {language === 'bn' ? 'বাস পরিবর্তন করুন' : 'Change Bus'}
          </Button>
        </div>
      )}

      {/* Fare Range Segmentation */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm sm:text-base font-black">
              {language === 'bn' ? 'সারি ভিত্তিক ভাড়া সেগমেন্টেশন ও কালার কোডিং' : 'Fare Range & Color Segmentation'}
            </CardTitle>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {activeSegments.length} {language === 'bn' ? 'ভাড়া স্তর' : 'Fare Zones'}
          </span>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {activeSegments.map((seg) => {
              const colorCfg = COLOR_OPTIONS.find((c) => c.id === seg.color) || COLOR_OPTIONS[0];
              return (
                <div
                  key={seg.id}
                  className={`p-3.5 rounded-2xl border-2 ${colorCfg.borderClass} bg-gradient-to-br ${colorCfg.bgClass} flex flex-col justify-between shadow-2xs`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${colorCfg.dotClass}`} />
                    <span className="font-black text-xs text-slate-900 dark:text-white leading-tight">{seg.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/10 dark:border-white/10">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                      {seg.startRow}–{seg.endRow}
                    </span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white">৳{seg.fare}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coach Seat Map */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-black">
              <Armchair className="w-5 h-5 text-blue-600" />
              <span>{language === 'bn' ? 'বাসের লাইভ সিট নির্বাচন (Live Bus Seat Map)' : 'Select Passenger Seat(s)'}</span>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'বাসের খালি সিটে ক্লিক করে নির্বাচন করুন — উভয় পাশের (২+২) সব সিট থেকে পছন্দমতো বাছাই করুন'
                : 'Click any available seat to select for this booking session (2+2 layout fully interactive)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddExtraSeat}
              className="text-xs font-bold border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 rounded-xl"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              {language === 'bn' ? '+ অতিরিক্ত সিট' : '+ Extra Seat'}
            </Button>
          </div>
        </CardHeader>

        {/* Legend */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600"></span>
              <span className="text-slate-600 dark:text-slate-300">{language === 'bn' ? 'খালি' : 'Available'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-blue-600 border border-blue-400"></span>
              <span className="text-slate-900 dark:text-white font-bold">{language === 'bn' ? 'নির্বাচিত' : 'Selected'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-pink-100 dark:bg-pink-950/80 border-2 border-pink-400"></span>
              <span className="text-pink-700 dark:text-pink-300 font-bold">{language === 'bn' ? '♀ নারী সংরক্ষিত / সংলগ্ন লক' : 'Female Protected'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-blue-100 dark:bg-blue-950/80 border-2 border-blue-400"></span>
              <span className="text-blue-700 dark:text-blue-300 font-bold">{language === 'bn' ? '♂ পুরুষ সংরক্ষিত / সংলগ্ন লক' : 'Male Protected'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500"></span>
              <span className="text-slate-600 dark:text-slate-300">{language === 'bn' ? 'বুকড' : 'Booked'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-500"></span>
              <span className="text-slate-600 dark:text-slate-300">{language === 'bn' ? 'হোল্ড' : 'Held'}</span>
            </div>
          </div>

          <div className="font-mono text-xs font-bold text-blue-600">
            {selectedSeatIds.length} {language === 'bn' ? 'সিট সিলেক্টেড' : 'Seats Selected'}
          </div>
        </div>

        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-100/70 dark:bg-slate-950/70 overflow-x-auto min-h-[600px]">
          {isLoadingSeats ? (
            <div className="py-20 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>লাইভ সিট ম্যাপ লোড হচ্ছে...</span>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-9 rounded-[3.5rem] border-4 border-slate-300 dark:border-slate-700 shadow-2xl w-full max-w-xl relative">
              <div className="absolute -top-3.5 left-12 right-12 h-3.5 bg-slate-300 dark:bg-slate-700 rounded-t-2xl opacity-70" />
              <div className="absolute -left-3.5 top-10 w-3 h-12 bg-slate-400 dark:bg-slate-600 rounded-l-md shadow-xs" title="Left Mirror" />
              <div className="absolute -right-3.5 top-10 w-3 h-12 bg-slate-400 dark:bg-slate-600 rounded-r-md shadow-xs" title="Right Mirror" />

              {/* Cockpit */}
              <div className="mb-5 pb-3.5 border-b-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="h-6 sm:h-7 bg-blue-100/80 dark:bg-blue-950/60 rounded-t-2xl border-t-2 border-blue-300 dark:border-blue-800 mb-2.5 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 font-mono">
                    {language === 'bn' ? 'সামনের উইন্ডশিল্ড গ্লাস' : 'FRONT WINDSHIELD GLASS'}
                  </span>
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-white shadow-inner relative overflow-hidden">
                  <div className="flex items-center gap-2.5 bg-emerald-950 border-2 border-emerald-500/80 px-3.5 py-2 rounded-xl shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-black text-emerald-400 leading-tight">
                        {language === 'bn' ? 'বাসের গেট' : 'ENTRY DOOR'}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-emerald-300 font-bold leading-none mt-0.5">
                        {language === 'bn' ? 'প্রবেশদ্বার (Entry)' : 'Entry Gate'}
                      </div>
                    </div>
                  </div>
                  <div className="text-center px-3.5 py-1.5 bg-slate-800 rounded-xl border-2 border-slate-600 shadow-md">
                    <div className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-wide">
                      {language === 'bn' ? 'বনেট / ইঞ্জিন' : 'ENGINE BONNET'}
                    </div>
                    <div className="text-[9px] text-slate-300 font-bold mt-0.5">Front Chassis</div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-blue-950 border-2 border-blue-500/80 px-3.5 py-2 rounded-xl text-right shadow-md">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-blue-400 leading-tight">
                        {language === 'bn' ? 'ড্রাইভার কেবিন' : 'DRIVER CABIN'}
                      </div>
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600/50 border-2 border-blue-300 flex items-center justify-center text-xs font-black text-blue-100">✇</div>
                  </div>
                </div>
              </div>

              {/* Seating grid */}
              <div className="space-y-3.5">
                {Array.from({ length: totalRows }).map((_, r) => {
                  const rowCells = tripSeats.filter((c) => c.rowIndex === r);
                  const isLastRow = r === totalRows - 1;
                  const rowLabel = rowLetters[r] || `R${r + 1}`;
                  const rowSegment = getSegmentForRow(rowLabel, activeSegments, rowLetters);

                  return (
                    <div key={r} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {renderSeatSlot(rowCells, r, 0, false, rowSegment)}
                        {renderSeatSlot(rowCells, r, 1, false, rowSegment)}
                      </div>
                      <div className="flex-1 text-center font-mono flex items-center justify-center">
                        {isLastRow && (activeCapacity === 45 || activeCapacity === 42) ? (
                          renderSeatSlot(rowCells, r, 2, true, rowSegment)
                        ) : (
                          <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[3.75rem]">
                            <span className="text-sm sm:text-base font-black tracking-wider text-slate-800 dark:text-slate-100 leading-none">
                              {rowLabel}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        {renderSeatSlot(rowCells, r, 3, false, rowSegment)}
                        {renderSeatSlot(rowCells, r, 4, false, rowSegment)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extra seats strip */}
      {extraSeats.length > 0 && (
        <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 rounded-3xl border-2 border-purple-200 dark:border-purple-800/60 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{language === 'bn' ? 'অতিরিক্ত আসনসমূহ (Extra Seats - বুকিংয়ের জন্য ক্লিক করুন):' : 'Extra Seats (Click to toggle for booking):'}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddExtraSeat}
              className="text-xs font-bold h-7 rounded-xl border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
            >
              + {language === 'bn' ? 'আরেকটি অতিরিক্ত সিট' : 'Add Another'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {extraSeats.map((s) => {
              const isSelected = selectedSeatIds.includes(s.seatId);
              return (
                <div
                  key={s.seatId}
                  className={`flex items-center gap-1.5 p-1.5 pl-3 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md shadow-purple-500/30'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-purple-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleSeat(s.seatId, s.status || 'AVAILABLE')}
                    className="flex items-center gap-2 cursor-pointer text-xs font-black font-mono"
                  >
                    <span>{isSelected ? '✓' : '○'}</span>
                    <span className="font-bold">{s.seatNumber}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300'
                    }`}>
                      ৳{s.fare || 450}
                    </span>
                    <span className="text-[10px] font-sans font-bold">
                      {isSelected ? (language === 'bn' ? '(নির্বাচিত)' : '(Selected)') : (language === 'bn' ? '(সিলেক্ট করুন)' : '(Select)')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveExtraSeat(s.seatId)}
                    className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black hover:bg-rose-500 hover:text-white transition-colors cursor-pointer ${
                      isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-500'
                    }`}
                    title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove Extra Seat'}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
            {language === 'bn' ? 'মোট নির্বাচিত সিট ও আনুমানিক ভাড়া:' : 'Selected Seats & Estimated Fare:'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatCurrency(grossAmount)}</span>
            <Badge variant="primary" className="font-mono font-bold text-xs px-2.5 py-1">
              {selectedSeatIds.length} {language === 'bn' ? 'সিট সিলেক্টেড' : 'Seats'}
            </Badge>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          disabled={selectedSeatIds.length === 0}
          onClick={onContinue}
          className="w-full sm:w-auto font-black shadow-lg shadow-blue-500/25 rounded-2xl px-8 text-sm sm:text-base py-3 cursor-pointer"
        >
          {language === 'bn'
            ? `যাত্রী তথ্যে এগিয়ে যান (ধাপ ৩ - ${selectedSeatIds.length} সিট)`
            : `Continue to Passenger Details (Step 3 - ${selectedSeatIds.length} Seats)`}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
