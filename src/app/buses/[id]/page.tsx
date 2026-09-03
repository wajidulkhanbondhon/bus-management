import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBusById } from '@/services/bus.service';
import { BusSeatMapModal } from '@/components/bus/bus-seat-map-modal';
import { SeatMapVisual, SeatRow, SeatInfo } from '@/components/bus/seat-map-visual';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Armchair,
  Bus as BusIcon,
  SlidersHorizontal,
  Ticket,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface BusDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BusDetailsPage({ params }: BusDetailsPageProps) {
  const { id } = await params;
  const bus = await getBusById(id);

  if (!bus) {
    notFound();
  }

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

    for (let c = 1; c <= 4; c++) {
      if (currentSeatNum <= capacity) {
        const isBooked = (currentSeatNum % 6 === 0 || currentSeatNum === 1 || currentSeatNum === 5);
        if (isBooked) booked++;
        const seatObj: SeatInfo = {
          id: `${bus.id}-${letter}${c}`,
          label: `${letter}${c}`,
          status: isBooked
            ? (isFemale ? 'booked_female' : isMale ? 'booked_male' : 'booked')
            : 'available',
          zone: r < 2 ? 'VIP Front' : 'Standard'
        };
        if (c <= 2) leftSeats.push(seatObj);
        else rightSeats.push(seatObj);
        currentSeatNum++;
      }
    }

    generatedRows.push({
      rowLabel: letter,
      left: leftSeats,
      right: rightSeats
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/buses"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>বাস তালিকায় ফিরে যান</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/buses/seat-builder?busId=${bus.id}`}>
            <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>সিট বিল্ডারে এডিট</span>
            </Button>
          </Link>
          <Link href={`/bookings/new?tripId=${bus.id}`}>
            <Button size="sm" variant="primary" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              <span>টিকিট ইস্যু করুন</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Bus Header Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
            <BusIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {bus.busName || bus.bus_name}
              </h1>
              <Badge variant="outline" className="font-mono text-xs font-bold">
                {bus.busNumber || bus.bus_number}
              </Badge>
              <Badge variant="default" className="bg-indigo-600 text-white text-xs font-bold">
                {capacity} টি সিট
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              অপারেটর: {bus.operator} • রেজিস্ট্রেশন: {bus.regNumber || bus.reg_number} • ধরন: {bus.busType || bus.bus_type}
            </p>
          </div>
        </div>
      </div>

      {/* Seat Map Visual Canvas Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Armchair className="w-5 h-5 text-indigo-500" />
              <span>বাসের সিট লেআউট ও ম্যাপ (Seat Map)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ড্রাইভার ক্যাবিন, প্রবেশদ্বার ও সিট অবস্থান
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <SeatMapVisual
            rows={generatedRows}
            totalSeats={capacity}
            bookedCount={booked}
            readOnly={false}
          />
        </div>
      </div>
    </div>
  );
}
