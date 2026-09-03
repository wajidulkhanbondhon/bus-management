'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  Bus as BusIcon,
  Armchair,
  Ticket,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  Wind,
  Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';
import { SeatMapVisual, SeatRow, SeatInfo } from './seat-map-visual';

interface BusSeatMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  bus: any | null;
}

export function BusSeatMapModal({ isOpen, onClose, bus }: BusSeatMapModalProps) {
  const { language } = useApp();

  // Generate rows for this bus
  const { rows, totalSeats, bookedCount } = useMemo(() => {
    if (!bus) return { rows: [], totalSeats: 0, bookedCount: 0 };

    const capacity = bus.capacity || 40;
    const isFemale = bus.busType === 'FEMALE' || bus.bus_type === 'FEMALE';
    const isMale = bus.busType === 'MALE' || bus.bus_type === 'MALE';

    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
    const generatedRows: SeatRow[] = [];
    const numRows = Math.ceil(capacity / 4);

    let currentSeatNum = 1;
    let booked = 0;

    for (let r = 0; r < numRows; r++) {
      const letter = rowLetters[r] || `R${r + 1}`;
      const leftSeats: (SeatInfo | null)[] = [];
      const rightSeats: (SeatInfo | null)[] = [];

      // Left column 1
      if (currentSeatNum <= capacity) {
        const isBooked = (currentSeatNum % 7 === 0 || currentSeatNum === 1 || currentSeatNum === 4);
        if (isBooked) booked++;
        leftSeats.push({
          id: `${bus.id}-${letter}1`,
          label: `${letter}1`,
          status: isBooked
            ? (isFemale ? 'booked_female' : isMale ? 'booked_male' : 'booked')
            : 'available',
          zone: r < 2 ? 'VIP Front' : 'Standard'
        });
        currentSeatNum++;
      }

      // Left column 2
      if (currentSeatNum <= capacity) {
        const isBooked = (currentSeatNum % 5 === 0);
        if (isBooked) booked++;
        leftSeats.push({
          id: `${bus.id}-${letter}2`,
          label: `${letter}2`,
          status: isBooked
            ? (isFemale ? 'booked_female' : isMale ? 'booked_male' : 'booked')
            : 'available',
          zone: r < 2 ? 'VIP Front' : 'Standard'
        });
        currentSeatNum++;
      }

      // Right column 1
      if (currentSeatNum <= capacity) {
        const isBooked = (currentSeatNum % 6 === 0);
        if (isBooked) booked++;
        rightSeats.push({
          id: `${bus.id}-${letter}3`,
          label: `${letter}3`,
          status: isBooked
            ? (isFemale ? 'booked_female' : isMale ? 'booked_male' : 'booked')
            : 'available',
          zone: r < 2 ? 'VIP Front' : 'Standard'
        });
        currentSeatNum++;
      }

      // Right column 2
      if (currentSeatNum <= capacity) {
        const isBooked = (currentSeatNum % 8 === 0);
        if (isBooked) booked++;
        rightSeats.push({
          id: `${bus.id}-${letter}4`,
          label: `${letter}4`,
          status: isBooked
            ? (isFemale ? 'booked_female' : isMale ? 'booked_male' : 'booked')
            : 'available',
          zone: r < 2 ? 'VIP Front' : 'Standard'
        });
        currentSeatNum++;
      }

      generatedRows.push({
        rowLabel: letter,
        left: leftSeats,
        right: rightSeats
      });
    }

    return {
      rows: generatedRows,
      totalSeats: capacity,
      bookedCount: booked
    };
  }, [bus]);

  if (!isOpen || !bus) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200 my-auto ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Luxury Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
              <Armchair className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {bus.busName || bus.bus_name}
                </h3>
                <Badge variant="outline" className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5">
                  {bus.busNumber || bus.bus_number}
                </Badge>
                <Badge variant="default" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-0.5">
                  {bus.capacity} {language === 'bn' ? 'রিক্লাইনার সিট' : 'Recliner Seats'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2 flex-wrap">
                <span>{language === 'bn' ? `অপারেটর: ${bus.operator}` : `Operator: ${bus.operator}`}</span>
                <span>•</span>
                <span className="font-mono">{bus.regNumber || bus.reg_number}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'সক্রিয় কোচ' : 'Active Coach'}</span>
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seat Map Visual Canvas */}
        <div className="max-h-[62vh] overflow-y-auto px-1 py-1">
          <SeatMapVisual
            rows={rows}
            totalSeats={totalSeats}
            bookedCount={bookedCount}
            readOnly={false}
          />
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href={`/buses/seat-builder?busId=${bus.id}`}
            onClick={onClose}
            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1.5 hover:underline"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{language === 'bn' ? 'সিট বিল্ডারে লেআউট কাস্টমাইজ করুন ➔' : 'Customize in Seat Builder ➔'}</span>
          </Link>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button variant="ghost" size="md" onClick={onClose} className="rounded-xl font-bold">
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </Button>
            <Link href={`/bookings/new?tripId=${bus.id}`} onClick={onClose}>
              <Button
                size="md"
                variant="primary"
                className="rounded-2xl font-black flex items-center gap-2 px-5 shadow-lg shadow-blue-600/30 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              >
                <Ticket className="w-4 h-4" />
                <span>{language === 'bn' ? '🎟️ এই বাসের টিকিট কাটুন' : '🎟️ Book Tickets'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
