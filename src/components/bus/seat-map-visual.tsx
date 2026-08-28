'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Users, Armchair, Info } from 'lucide-react';

// ──────────────────────────────────────────
//  Types
// ──────────────────────────────────────────
export type SeatStatus = 'available' | 'booked' | 'booked_female' | 'booked_male' | 'held' | 'locked' | 'selected';

export interface SeatInfo {
  id: string;
  label: string;          // e.g. "A1", "B3"
  status: SeatStatus;
  passengerName?: string;
  passengerGender?: 'MALE' | 'FEMALE';
  zone?: string;          // e.g. "VIP", "Standard", "Rear"
}

export interface SeatRow {
  rowLabel: string;       // "A", "B", "C" …
  left: (SeatInfo | null)[];    // null = aisle gap
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
//  Legend entry
// ──────────────────────────────────────────
const LEGEND: { label: string; css: string }[] = [
  { label: 'খালি',         css: 'seat-luxury seat-available' },
  { label: 'পুরুষ (বুকড)',  css: 'seat-luxury seat-booked-male' },
  { label: 'মহিলা (বুকড)', css: 'seat-luxury seat-booked-female' },
  { label: 'হোল্ড',         css: 'seat-luxury seat-held' },
  { label: 'লক',           css: 'seat-luxury seat-locked' },
  { label: 'নির্বাচিত',    css: 'seat-luxury seat-selected' },
];

// ──────────────────────────────────────────
//  Helper: CSS class for seat status
// ──────────────────────────────────────────
function seatClass(status: SeatStatus, isSelected: boolean): string {
  if (isSelected) return 'seat-luxury seat-selected';
  switch (status) {
    case 'available':     return 'seat-luxury seat-available cursor-pointer';
    case 'booked':        return 'seat-luxury seat-booked cursor-not-allowed';
    case 'booked_female': return 'seat-luxury seat-booked-female cursor-not-allowed';
    case 'booked_male':   return 'seat-luxury seat-booked-male cursor-not-allowed';
    case 'held':          return 'seat-luxury seat-held cursor-not-allowed';
    case 'locked':        return 'seat-luxury seat-locked cursor-not-allowed';
    case 'selected':      return 'seat-luxury seat-selected cursor-pointer';
    default:              return 'seat-luxury seat-available';
  }
}

// ──────────────────────────────────────────
//  Tooltip
// ──────────────────────────────────────────
function SeatTooltip({ seat }: { seat: SeatInfo }) {
  const statusBn: Record<SeatStatus, string> = {
    available:     '✅ খালি',
    booked:        '🔴 বুকড',
    booked_female: '🩷 মহিলা বুকড',
    booked_male:   '💙 পুরুষ বুকড',
    held:          '⏳ হোল্ড',
    locked:        '🔒 লক',
    selected:      '✔️ নির্বাচিত',
  };
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
      <div className="bg-slate-900 dark:bg-slate-800 text-white text-[11px] rounded-lg px-2.5 py-2 whitespace-nowrap shadow-xl border border-slate-700 leading-snug min-w-[100px]">
        <p className="font-bold text-center text-sm mb-0.5">{seat.label}</p>
        <p className="text-slate-300">{statusBn[seat.status]}</p>
        {seat.passengerName && (
          <p className="text-slate-200 font-medium truncate max-w-[150px]">{seat.passengerName}</p>
        )}
        {seat.zone && (
          <p className="text-slate-400 text-[10px]">জোন: {seat.zone}</p>
        )}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
//  Single Seat Cell
// ──────────────────────────────────────────
function SeatCell({
  seat,
  isSelected,
  onClick,
}: {
  seat: SeatInfo | null;
  isSelected: boolean;
  onClick?: (s: SeatInfo) => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (!seat) {
    // aisle gap
    return <div className="w-9 h-9 sm:w-10 sm:h-10" aria-hidden />;
  }

  const isClickable = seat.status === 'available' || seat.status === 'selected';

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <SeatTooltip seat={seat} />}
      <button
        aria-label={`সিট ${seat.label} — ${seat.status}`}
        disabled={!isClickable && !isSelected}
        onClick={() => isClickable && onClick?.(seat)}
        className={cn(
          'w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all duration-150',
          seatClass(seat.status, isSelected)
        )}
      >
        {seat.label}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────
//  Main Component
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
  className,
}: SeatMapVisualProps) {
  const availableCount = totalSeats - bookedCount - heldCount - lockedCount;
  const occupancyPct = Math.round((bookedCount / totalSeats) * 100);

  return (
    <div className={cn('w-full', className)}>
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'মোট সিট', value: totalSeats, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'খালি', value: availableCount, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
          { label: 'বুকড', value: bookedCount, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50' },
          { label: 'ভর্তি %', value: `${occupancyPct}%`, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl px-3 py-2 text-center', s.bg)}>
            <p className={cn('text-lg font-black leading-none', s.color)}>{s.value}</p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Occupancy bar ── */}
      <div className="mb-4 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-red-500 transition-all duration-500"
          style={{ width: `${occupancyPct}%` }}
        />
      </div>

      {/* ── Bus frame ── */}
      <div className="relative bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 overflow-x-auto">
        {/* Driver area */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg">🚌</div>
            <span>চালকের আসন</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Info className="w-3.5 h-3.5" />
            সামনে → পেছনে
          </div>
        </div>

        {/* Seat rows */}
        <div className="flex flex-col gap-2">
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-2">
              {/* Row label */}
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-5 text-right shrink-0 font-mono">
                {row.rowLabel}
              </span>

              {/* Left cluster */}
              <div className="flex gap-1.5">
                {row.left.map((seat, sIdx) => (
                  <SeatCell
                    key={sIdx}
                    seat={seat}
                    isSelected={!!seat && selectedIds.includes(seat.id)}
                    onClick={!readOnly ? onSeatClick : undefined}
                  />
                ))}
              </div>

              {/* Aisle */}
              <div className="w-6 sm:w-8 shrink-0" />

              {/* Right cluster */}
              <div className="flex gap-1.5">
                {row.right.map((seat, sIdx) => (
                  <SeatCell
                    key={sIdx}
                    seat={seat}
                    isSelected={!!seat && selectedIds.includes(seat.id)}
                    onClick={!readOnly ? onSeatClick : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rear */}
        <div className="mt-4 pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 text-center text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
          🚪 পেছনের দরজা
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <div className={cn('w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold', l.css)}>
              A
            </div>
            <span>{l.label}</span>
          </div>
        ))}
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
      rowLabel: rowLetters[rowIdx] ?? String(rowIdx + 1),
      left,
      right,
    });
    rowIdx++;
  }

  return rows;
}
