'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Armchair,
  Info,
  Check,
  ShieldAlert,
  Sparkles,
  Navigation,
  Disc,
  Wifi,
  Wind,
  Tv,
  Coffee,
  Zap,
  Radio,
  Footprints
} from 'lucide-react';

// ──────────────────────────────────────────
//  Types
// ──────────────────────────────────────────
export type SeatStatus =
  | 'available'
  | 'booked'
  | 'booked_female'
  | 'booked_male'
  | 'held'
  | 'locked'
  | 'selected';

export interface SeatInfo {
  id: string;
  label: string; // e.g. "A1", "B3"
  status: SeatStatus;
  passengerName?: string;
  passengerGender?: 'MALE' | 'FEMALE';
  zone?: string; // e.g. "VIP Front", "Standard", "Executive"
  fare?: number;
}

export interface SeatRow {
  rowLabel: string; // "A", "B", "C" …
  left: (SeatInfo | null)[]; // null = aisle gap
  right: (SeatInfo | null)[];
}

interface SeatMapVisualProps {
  rows: SeatRow[];
  totalSeats: number;
  bookedCount: number;
  heldCount?: number;
  lockedCount?: number;
  onSeatClick?: (seat: SeatInfo) => void;
  selectedIds?: string[];
  readOnly?: boolean;
  className?: string;
}

// ──────────────────────────────────────────
//  Ultra-Premium Luxury Recliner Seat Component
// ──────────────────────────────────────────
export function LuxuryCoachSeatCell({
  seat,
  isSelected,
  onClick,
  readOnly = false
}: {
  seat: SeatInfo | null;
  isSelected: boolean;
  onClick?: (s: SeatInfo) => void;
  readOnly?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  if (!seat) {
    // aisle space
    return <div className="w-14 h-15 sm:w-16 sm:h-17 shrink-0" aria-hidden />;
  }

  const isBooked =
    seat.status === 'booked' ||
    seat.status === 'booked_female' ||
    seat.status === 'booked_male';
  const isHeld = seat.status === 'held';
  const isLocked = seat.status === 'locked';
  const isAvailable = seat.status === 'available' || seat.status === 'selected';
  const isFemale =
    seat.status === 'booked_female' || seat.passengerGender === 'FEMALE';
  const isMale =
    seat.status === 'booked_male' || seat.passengerGender === 'MALE';

  const isClickable = !readOnly && (isAvailable || isSelected);
  const seatFare = seat.fare || 550;

  return (
    <div
      className="relative shrink-0 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 3D Left Armrest */}
      <div
        className={cn(
          'absolute -left-1.5 top-3.5 bottom-3.5 w-1.5 rounded-full transition-all duration-200 z-10',
          isSelected
            ? 'bg-blue-400 shadow-sm shadow-blue-500/50'
            : isBooked
            ? 'bg-rose-300 dark:bg-rose-800'
            : isFemale
            ? 'bg-pink-300 dark:bg-pink-800'
            : isMale
            ? 'bg-blue-300 dark:bg-blue-800'
            : 'bg-slate-300 dark:bg-slate-700 shadow-2xs group-hover:bg-indigo-400'
        )}
      />

      {/* 3D Right Armrest */}
      <div
        className={cn(
          'absolute -right-1.5 top-3.5 bottom-3.5 w-1.5 rounded-full transition-all duration-200 z-10',
          isSelected
            ? 'bg-blue-400 shadow-sm shadow-blue-500/50'
            : isBooked
            ? 'bg-rose-300 dark:bg-rose-800'
            : isFemale
            ? 'bg-pink-300 dark:bg-pink-800'
            : isMale
            ? 'bg-blue-300 dark:bg-blue-800'
            : 'bg-slate-300 dark:bg-slate-700 shadow-2xs group-hover:bg-indigo-400'
        )}
      />

      {/* Floating Holographic Tooltip on Hover */}
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-950 text-white text-[11px] rounded-2xl p-3 whitespace-nowrap shadow-2xl border border-slate-700 leading-snug min-w-[130px] text-center backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="font-mono font-black text-sm text-amber-300">{seat.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white font-bold">
                {seat.zone || 'Executive'}
              </span>
            </div>
            <p className="text-slate-200 font-bold">
              {isSelected
                ? '✔️ নির্বাচিত আসন'
                : isBooked
                ? isFemale
                  ? '🩷 নারী সংরক্ষিত (বুকড)'
                  : isMale
                  ? '💙 পুরুষ সংরক্ষিত (বুকড)'
                  : '🔴 টিকিট বুকড'
                : isHeld
                ? '⏳ সাময়িক হোল্ড'
                : isLocked
                ? '🔒 সংরক্ষিত / লক'
                : `✅ খালি আসন • ভাড়া ৳${seatFare}`}
            </p>
            {seat.passengerName && (
              <p className="text-emerald-300 font-semibold truncate max-w-[160px] mt-1 text-[10px] bg-emerald-950/60 py-0.5 px-1.5 rounded-md border border-emerald-800/60">
                👤 {seat.passengerName}
              </p>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950" />
          </div>
        </div>
      )}

      {/* RECLINER SEAT MAIN CUSHION BODY */}
      <button
        type="button"
        aria-label={`সিট ${seat.label} — ${seat.status}`}
        disabled={!isClickable && !isSelected}
        onClick={() => isClickable && onClick?.(seat)}
        className={cn(
          'w-14 h-15 sm:w-16 sm:h-17 shrink-0 p-1 sm:p-1.5 rounded-2xl flex flex-col items-center justify-between font-black transition-all duration-200 ease-out relative select-none cursor-pointer overflow-hidden border-2',
          // Selected: Solid royal indigo/blue with neon glow & ring
          isSelected
            ? 'bg-gradient-to-b from-blue-500 via-indigo-600 to-blue-700 text-white border-blue-300 shadow-xl shadow-blue-500/50 ring-4 ring-blue-400/50 -translate-y-1 z-20 scale-105'
            : // Booked Female: Luxury rose-pink quilted leather
            isFemale && isBooked
            ? 'bg-gradient-to-b from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950/80 dark:via-pink-900/80 dark:to-pink-950/90 text-pink-950 dark:text-pink-100 border-pink-400 dark:border-pink-600 shadow-xs cursor-not-allowed opacity-85'
            : // Booked Male: Luxury cobalt-blue quilted leather
            isMale && isBooked
            ? 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/80 dark:via-blue-900/80 dark:to-blue-950/90 text-blue-950 dark:text-blue-100 border-blue-400 dark:border-blue-600 shadow-xs cursor-not-allowed opacity-85'
            : // General Booked: Deep crimson
            isBooked
            ? 'bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200 dark:from-rose-950/80 dark:via-rose-900/80 dark:to-rose-950/90 text-rose-950 dark:text-rose-200 border-rose-400 dark:border-rose-700 opacity-80 shadow-xs cursor-not-allowed'
            : // Held: Amber glow
            isHeld
            ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/80 dark:to-amber-900/80 text-amber-950 dark:text-amber-200 border-amber-400 dark:border-amber-600 opacity-85 shadow-xs cursor-not-allowed'
            : // Locked
            isLocked
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-700 opacity-55 cursor-not-allowed'
            : // Female Reserved (Available)
            isFemale
            ? 'bg-gradient-to-b from-pink-50 via-white to-pink-100 dark:from-slate-900 dark:via-pink-950/30 dark:to-slate-850 text-pink-950 dark:text-pink-100 border-pink-400/80 dark:border-pink-500/80 shadow-sm hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20 hover:-translate-y-1'
            : // Male Reserved (Available)
            isMale
            ? 'bg-gradient-to-b from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-850 text-blue-950 dark:text-blue-100 border-blue-400/80 dark:border-blue-500/80 shadow-sm hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1'
            : // Standard Executive Leather Cushion (Available)
              'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-1 active:translate-y-0.5'
        )}
      >
        {/* Subtle Glassmorphic Sheen Highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* 1. Ergonomic Contoured Headrest Pillow */}
        <div
          className={cn(
            'w-8 sm:w-10 h-2 rounded-full shadow-md transition-all duration-200 border border-black/10 flex items-center justify-center',
            isSelected
              ? 'bg-white text-blue-700 shadow-white/40'
              : isBooked
              ? isFemale
                ? 'bg-pink-500 text-white'
                : isMale
                ? 'bg-blue-500 text-white'
                : 'bg-rose-500 text-white'
              : isHeld
              ? 'bg-amber-400 text-amber-950'
              : isLocked
              ? 'bg-slate-500 text-white'
              : isFemale
              ? 'bg-pink-500 text-white shadow-pink-500/30'
              : isMale
              ? 'bg-blue-500 text-white shadow-blue-500/30'
              : 'bg-emerald-500 text-white shadow-emerald-500/30'
          )}
        >
          {/* Subtle Stitch line in headrest */}
          <div className="w-4 h-0.5 bg-white/40 rounded-full" />
        </div>

        {/* 2. Extra Crisp Metallic Monospace Seat Number */}
        <div className="relative z-10 flex items-center justify-center my-0.5">
          <span
            className={cn(
              'text-sm sm:text-base font-black tracking-tight leading-none font-mono drop-shadow-xs',
              isSelected
                ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
                : 'text-slate-900 dark:text-slate-100'
            )}
          >
            {seat.label}
          </span>
        </div>

        {/* 3. Luxury Inset Fare / Status Badge with Micro-Indicators */}
        <div
          className={cn(
            'w-full flex items-center justify-center gap-0.5 px-1 py-0.5 rounded-lg overflow-hidden backdrop-blur-md transition-colors relative z-10 border',
            isSelected
              ? 'bg-black/30 text-white border-white/30'
              : 'bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/5'
          )}
        >
          {isSelected ? (
            <span className="text-[10px] sm:text-xs font-black font-mono leading-none tracking-tight flex items-center gap-0.5 text-white">
              <Check className="w-3 h-3 stroke-[3]" /> ৳{seatFare}
            </span>
          ) : isBooked ? (
            <span className="text-[9px] sm:text-[10px] font-black tracking-tight text-rose-800 dark:text-rose-200 leading-none flex items-center gap-0.5">
              {isFemale ? '♀ বুকড' : isMale ? '♂ বুকড' : 'বুকড'}
            </span>
          ) : isHeld ? (
            <span className="text-[9px] sm:text-[10px] font-black tracking-tight text-amber-800 dark:text-amber-200 leading-none">
              হোল্ড
            </span>
          ) : isLocked ? (
            <span className="text-[9px] sm:text-[10px] font-black tracking-tight text-slate-700 dark:text-slate-300 leading-none">
              লক
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-black font-mono leading-none tracking-tight flex items-center gap-0.5">
              <span>৳{seatFare}</span>
              {isFemale && <span className="text-[8px] text-pink-600 dark:text-pink-400">♀</span>}
              {isMale && <span className="text-[8px] text-blue-600 dark:text-blue-400">♂</span>}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

// ──────────────────────────────────────────
//  Main SeatMapVisual Component
// ──────────────────────────────────────────
export function SeatMapVisual({
  rows,
  totalSeats,
  bookedCount,
  heldCount = 0,
  lockedCount = 0,
  onSeatClick,
  selectedIds = [],
  readOnly = false,
  className
}: SeatMapVisualProps) {
  const availableCount = totalSeats - bookedCount - heldCount - lockedCount;
  const occupancyPct = Math.round((bookedCount / Math.max(totalSeats, 1)) * 100);

  return (
    <div className={cn('w-full space-y-5', className)}>
      {/* ── 1. Luxury Executive HUD Overview Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          {
            label: 'মোট আসন সংখ্যা',
            value: `${totalSeats} টি`,
            color: 'text-slate-900 dark:text-white',
            bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
            icon: Armchair,
            iconColor: 'text-slate-500'
          },
          {
            label: 'বুকিংয়ের জন্য খালি',
            value: `${availableCount} টি`,
            color: 'text-emerald-700 dark:text-emerald-400',
            bg: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
            icon: Sparkles,
            iconColor: 'text-emerald-500'
          },
          {
            label: 'ইতোমধ্যে বুকড',
            value: `${bookedCount} টি`,
            color: 'text-rose-700 dark:text-rose-400',
            bg: 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
            icon: ShieldAlert,
            iconColor: 'text-rose-500'
          },
          {
            label: 'যাত্রী ধারণ হার',
            value: `${occupancyPct}%`,
            color: 'text-indigo-700 dark:text-indigo-400',
            bg: 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
            icon: Zap,
            iconColor: 'text-indigo-500'
          }
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={cn(
                'rounded-3xl p-3.5 border shadow-sm flex items-center justify-between gap-2',
                s.bg
              )}
            >
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <p className={cn('text-lg sm:text-xl font-black font-mono leading-tight mt-0.5', s.color)}>
                  {s.value}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center shrink-0">
                <Icon className={cn('w-5 h-5', s.iconColor)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. Cabin Amenities Feature Strip ── */}
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 overflow-x-auto gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Wind className="w-4 h-4 text-cyan-500" />
          <span>সেন্ট্রাল এসি</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Wifi className="w-4 h-4 text-emerald-500" />
          <span>হাই-স্পিড ওয়াইফাই</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>প্রতি সিটে চার্জিং পোর্ট</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Armchair className="w-4 h-4 text-indigo-500" />
          <span>রিক্লাইনার লাক্সারি সিট</span>
        </div>
      </div>

      {/* ── 3. Ultra-Luxury Realistic Coach Frame (Metallic Chassis) ── */}
      <div className="relative bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl overflow-x-auto ring-1 ring-white/20">
        {/* Exterior Aerodynamic Windshield Hood */}
        <div className="mb-6 pb-5 border-b-2 border-dashed border-slate-300 dark:border-slate-700/80">
          {/* Tinted Aerodynamic Glass Windshield with Wiper Accents */}
          <div className="relative h-10 rounded-t-3xl bg-gradient-to-b from-blue-900/60 via-indigo-950/40 to-transparent border-t-3 border-x-3 border-blue-400/50 mb-4 flex items-center justify-between px-6 shadow-inner overflow-hidden">
            <div className="w-12 h-1 bg-slate-400 rounded-full transform -rotate-12 opacity-40" />
            <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[10px] font-mono text-cyan-300 font-bold tracking-widest uppercase shadow-sm">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>LUXURY EXPRESS COACH • FRONT CABIN</span>
            </div>
            <div className="w-12 h-1 bg-slate-400 rounded-full transform rotate-12 opacity-40" />
          </div>

          {/* Cabin Dashboard: Passenger Door vs Driver Steering Area */}
          <div className="flex items-center justify-between px-2 sm:px-4">
            {/* Passenger Entry Staircase & LED Runner */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-black shadow-md backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <Footprints className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>🚪 প্যাসেঞ্জার প্রবেশদ্বার (Entry Gate)</span>
            </div>

            {/* Direction Vector */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-bold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Navigation className="w-3.5 h-3.5 text-indigo-500" />
              <span>সামনে ➔ পেছনে</span>
            </div>

            {/* Driver Cockpit Console */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-750 border-2 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-xs font-black shadow-md">
              <span className="text-base animate-spin-slow">🛞</span>
              <span>ড্রাইভার কন্ট্রোল কেবিন</span>
            </div>
          </div>
        </div>

        {/* ── 4. Coach Recliner Grid (2x2 with Ambient Illuminated Aisle) ── */}
        <div className="flex flex-col gap-3.5 items-center min-w-[340px] py-1">
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-3 sm:gap-4 relative group/row">
              {/* Row Letter Metallic Embossed Tag */}
              <div className="w-6 text-right shrink-0">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono tracking-tight group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors">
                  {row.rowLabel}
                </span>
              </div>

              {/* Left 2 Recliners */}
              <div className="flex gap-2.5 sm:gap-3.5">
                {row.left.map((seat, sIdx) => (
                  <LuxuryCoachSeatCell
                    key={sIdx}
                    seat={seat}
                    isSelected={!!seat && selectedIds.includes(seat.id)}
                    onClick={onSeatClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>

              {/* Ambient Center Aisle Runner with Glowing Floor Guideway */}
              <div className="w-8 sm:w-12 flex flex-col items-center justify-center shrink-0 px-1">
                <div className="h-full w-1 rounded-full bg-gradient-to-b from-indigo-500/20 via-blue-500/40 to-indigo-500/20 shadow-xs shadow-indigo-500/20" />
                <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest my-1 select-none">
                  AISLE
                </span>
                <div className="h-full w-1 rounded-full bg-gradient-to-b from-indigo-500/20 via-blue-500/40 to-indigo-500/20 shadow-xs shadow-indigo-500/20" />
              </div>

              {/* Right 2 Recliners */}
              <div className="flex gap-2.5 sm:gap-3.5">
                {row.right.map((seat, sIdx) => (
                  <LuxuryCoachSeatCell
                    key={sIdx}
                    seat={seat}
                    isSelected={!!seat && selectedIds.includes(seat.id)}
                    onClick={onSeatClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rear Exit & Executive Last Lounge */}
        <div className="mt-7 pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-700/80 flex items-center justify-between px-3 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span>🛡️</span>
            <span>সিট বেল্ট ও ফার্স্ট এইড বক্স</span>
          </span>
          <span className="px-3.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-2xs">
            🚪 ইমার্জেন্সি রিয়ার এক্সিট
          </span>
          <span className="flex items-center gap-1.5">
            <span>🧯</span>
            <span>ফায়ার এক্সটিংগুইশার</span>
          </span>
        </div>
      </div>

      {/* ── 5. Executive Recliner Legend ── */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-xs font-black text-slate-600 dark:text-slate-300 mb-3 text-center">
          আসন নির্দেশিকা ও বুকিং কালার কোডিং (Executive Legend):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-bold">
          {/* Available */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex flex-col items-center justify-between p-0.5 shrink-0 shadow-2xs">
              <div className="w-4 h-1 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-mono leading-none">A1</span>
            </div>
            <div>
              <span className="text-slate-900 dark:text-white block leading-tight">খালি আসন</span>
              <span className="text-[10px] text-slate-500 font-normal">বুকিংযোগ্য</span>
            </div>
          </div>

          {/* Booked General */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
            <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-900 border-2 border-rose-400 flex flex-col items-center justify-between p-0.5 shrink-0 shadow-2xs">
              <div className="w-4 h-1 rounded-full bg-rose-500" />
              <span className="text-[9px] font-mono text-rose-900 dark:text-rose-200 leading-none">B1</span>
            </div>
            <div>
              <span className="text-rose-900 dark:text-rose-200 block leading-tight">বুকড আসন</span>
              <span className="text-[10px] text-rose-700/80 dark:text-rose-400 font-normal">বিক্রিত</span>
            </div>
          </div>

          {/* Female Reserved */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-pink-50/70 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900">
            <div className="w-7 h-7 rounded-xl bg-pink-100 dark:bg-pink-900 border-2 border-pink-400 flex flex-col items-center justify-between p-0.5 shrink-0 shadow-2xs">
              <div className="w-4 h-1 rounded-full bg-pink-500" />
              <span className="text-[9px] font-mono text-pink-900 dark:text-pink-200 leading-none">♀</span>
            </div>
            <div>
              <span className="text-pink-900 dark:text-pink-200 block leading-tight">নারী সংরক্ষিত</span>
              <span className="text-[10px] text-pink-700/80 dark:text-pink-400 font-normal">শুধুমাত্র নারী</span>
            </div>
          </div>

          {/* Male Reserved */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900 border-2 border-blue-400 flex flex-col items-center justify-between p-0.5 shrink-0 shadow-2xs">
              <div className="w-4 h-1 rounded-full bg-blue-500" />
              <span className="text-[9px] font-mono text-blue-900 dark:text-blue-200 leading-none">♂</span>
            </div>
            <div>
              <span className="text-blue-900 dark:text-blue-200 block leading-tight">পুরুষ সংরক্ষিত</span>
              <span className="text-[10px] text-blue-700/80 dark:text-blue-400 font-normal">শুধুমাত্র পুরুষ</span>
            </div>
          </div>

          {/* Selected */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 border-2 border-blue-300 flex flex-col items-center justify-between p-0.5 shrink-0 shadow-md text-white">
              <div className="w-4 h-1 rounded-full bg-white" />
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div>
              <span className="text-indigo-900 dark:text-indigo-200 block leading-tight">নির্বাচিত আসন</span>
              <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400 font-normal">আপনার সিলেকশন</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
//  Helper: Convert flat seat list → SeatRow[]
// ──────────────────────────────────────────
export function buildSeatRows(seats: SeatInfo[], seatsPerRow: number = 4): SeatRow[] {
  const rows: SeatRow[] = [];
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rowIdx = 0;

  for (let i = 0; i < seats.length; i += seatsPerRow) {
    const chunk = seats.slice(i, i + seatsPerRow);
    const left = chunk.slice(0, 2);
    const right = chunk.slice(2);
    rows.push({
      rowLabel: rowLetters[rowIdx] || `R${rowIdx + 1}`,
      left: [left[0] || null, left[1] || null],
      right: [right[0] || null, right[1] || null]
    });
    rowIdx++;
  }

  return rows;
}
