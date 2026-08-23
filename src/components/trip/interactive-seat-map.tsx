'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bus,
  Calendar,
  Clock,
  Lock,
  Unlock,
  Sparkles,
  User,
  Shield,
  CreditCard,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  Heart,
  Users,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { SeatStatusDetail } from '@/services/inventory.service';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { lockSeatAction, unlockSeatAction, holdSeatAction, releaseSeatHoldAction } from '@/actions/inventory.actions';
import { useApp } from '@/lib/context';

interface Props {
  trip: any;
  seats: SeatStatusDetail[];
  summary: any;
  currentUserId?: string;
}

export function InteractiveSeatMap({ trip, seats, summary, currentUserId }: Props) {
  const router = useRouter();
  const { t, language } = useApp();
  const [selectedSeat, setSelectedSeat] = useState<SeatStatusDetail | null>(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState('VIP');
  const [lockType, setLockType] = useState<'PERMANENT' | 'TEMPORARY'>('TEMPORARY');
  const [lockNotes, setLockNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Group seats into a grid matrix
  const maxRow = Math.max(...seats.map(s => s.rowIndex), 10);
  const maxCol = Math.max(...seats.map(s => s.colIndex), 4);

  const seatGrid: (SeatStatusDetail | null)[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    seatGrid[r] = [];
    for (let c = 0; c <= maxCol; c++) {
      seatGrid[r][c] = null;
    }
  }

  seats.forEach(s => {
    if (seatGrid[s.rowIndex]) {
      seatGrid[s.rowIndex][s.colIndex] = s;
    }
  });

  const handleLockSubmit = async () => {
    if (!selectedSeat) return;
    setActionLoading(true);
    try {
      const res = await lockSeatAction({
        tripId: trip.id,
        seatId: selectedSeat.seatId,
        lockType,
        reason: lockReason,
        notes: lockNotes
      });
      if (res.success) {
        setIsLockModalOpen(false);
        setSelectedSeat(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to lock seat');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (seatId: string) => {
    setActionLoading(true);
    try {
      const res = await unlockSeatAction(trip.id, seatId);
      if (res.success) {
        setSelectedSeat(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to unlock seat');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async (seatId: string) => {
    setActionLoading(true);
    try {
      const res = await holdSeatAction(trip.id, seatId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to hold seat');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseHold = async (seatId: string) => {
    setActionLoading(true);
    try {
      const res = await releaseSeatHoldAction(trip.id, seatId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to release seat hold');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {trip.tripCode}
            </span>
            <Badge variant={trip.tripBusType === 'FEMALE' ? 'danger' : (trip.tripBusType === 'MALE' ? 'primary' : 'default')}>
              {trip.tripBusType === 'FEMALE' ? t.femaleBus : (trip.tripBusType === 'MALE' ? t.maleBus : t.mixedBus)}
            </Badge>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{trip.route.routeName}</h1>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            <span className="flex items-center gap-1">
              <Bus className="w-3.5 h-3.5 text-slate-400" />
              {trip.bus.busName} ({trip.bus.busNumber})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(trip.departureDate)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {formatTime(trip.departureTime)} (ঢাকা)
            </span>
          </div>
        </div>

        {/* Quick Inventory Metric Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase font-mono">{t.available}</span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono">{summary.availableSeats}</span>
          </div>
          <div className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-center">
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block uppercase font-mono">{t.booked}</span>
            <span className="text-lg font-black text-rose-800 dark:text-rose-300 font-mono">{summary.bookedSeats}</span>
          </div>
          <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block uppercase font-mono">{t.held}</span>
            <span className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono">{summary.heldSeats}</span>
          </div>
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-center">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block uppercase font-mono">{t.occupancy}</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{summary.occupancyPercent}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Bus Layout + Seat Details Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Realistic Bus Visual Seat Map */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader>
            <div>
              <CardTitle>{t.seatMap}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn'
                  ? 'সিটে ক্লিক করে প্যাসেঞ্জার তথ্য দেখুন, সিট লক করুন অথবা সরাসরি বুকিং করুন'
                  : 'Click any seat to view passenger info, lock/unlock, or start direct booking'}
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-800 border-2 border-slate-300"></span>
                <span>{t.available}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-pink-500"></span>
                <span>{language === 'bn' ? 'মেয়ে শিক্ষার্থী' : 'Female'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-500"></span>
                <span>{language === 'bn' ? 'ছেলে শিক্ষার্থী' : 'Male'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-500"></span>
                <span>{t.held}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-600"></span>
                <span>{t.locked}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center p-6 bg-slate-100/70 dark:bg-slate-950/70 overflow-x-auto min-h-[520px]">
            {/* Ultra-Realistic Bus Body Frame */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-4 border-slate-300 dark:border-slate-700 shadow-2xl w-full max-w-md relative">
              {/* Bus Headlights & Windshield */}
              <div className="mb-5 pb-3 border-b-2 border-dashed border-slate-300 dark:border-slate-700">
                <div className="flex items-center justify-between px-3 mb-2">
                  <div className="w-4 h-2 bg-amber-400 rounded-full shadow-md shadow-amber-400/50"></div>
                  <div className="text-[10px] font-black text-slate-400 font-mono tracking-widest uppercase">
                    {language === 'bn' ? 'সামনের ড্রাইভার কেবিন' : 'FRONT WINDSHIELD'}
                  </div>
                  <div className="w-4 h-2 bg-amber-400 rounded-full shadow-md shadow-amber-400/50"></div>
                </div>

                <div className="h-10 bg-slate-900 dark:bg-slate-950 rounded-2xl flex items-center justify-between px-4 text-white text-xs font-bold shadow-inner">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    {t.door}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-mono">
                    <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    {t.driver}
                  </div>
                </div>
              </div>

              {/* Rows Seating Grid */}
              <div className="space-y-3">
                {seatGrid.map((row, rIdx) => {
                  const hasSeatsInRow = row.some(s => s !== null);
                  if (!hasSeatsInRow) return null;

                  const isLastRow = rIdx === maxRow; // Row K or back row

                  return (
                    <div key={rIdx} className="space-y-1">
                      {/* Row Pricing Indicator on Left Margin */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Left 2 Seats */}
                        <div className="flex items-center gap-2">
                          {row[0] ? renderSeatButton(row[0]) : <div className="w-12 h-12" />}
                          {row[1] ? renderSeatButton(row[1]) : <div className="w-12 h-12" />}
                        </div>

                        {/* Walking Aisle OR Middle Seat (e.g. Row K 5th seat K3) */}
                        <div className="flex-1 text-center font-mono text-[9px] text-slate-300 dark:text-slate-600 font-bold flex items-center justify-center">
                          {row[2] ? renderSeatButton(row[2]) : isLastRow ? '—' : 'AISLE'}
                        </div>

                        {/* Right 2 Seats */}
                        <div className="flex items-center gap-2">
                          {row[3] ? renderSeatButton(row[3]) : <div className="w-12 h-12" />}
                          {row[4] ? renderSeatButton(row[4]) : <div className="w-12 h-12" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rear Bus Bumper */}
              <div className="mt-5 pt-3 border-t-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                  {t.rearSeats}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Col: Seat Details Drawer */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>{language === 'bn' ? 'সিট বিবরণ ও অ্যাকশন' : 'Seat Details & Actions'}</CardTitle>
            {selectedSeat && (
              <Badge variant="primary" className="font-mono text-xs">
                Seat {selectedSeat.seatNumber}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSeat ? (
              <div className="space-y-4">
                {/* Status Card */}
                <div className={`p-4 rounded-xl border ${
                  selectedSeat.status === 'BOOKED'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                    : selectedSeat.status === 'HELD'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    : selectedSeat.status === 'LOCKED'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase font-mono">
                      {language === 'bn' ? 'বর্তমান স্ট্যাটাস' : 'Status'}
                    </span>
                    <Badge variant={
                      selectedSeat.status === 'BOOKED' ? 'danger' :
                      selectedSeat.status === 'HELD' ? 'warning' :
                      selectedSeat.status === 'LOCKED' ? 'default' : 'success'
                    }>
                      {selectedSeat.status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                    Seat {selectedSeat.seatNumber}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {language === 'bn' ? 'নির্ধারিত ভাড়া:' : 'Effective Fare:'}{' '}
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(selectedSeat.fare)}</span>
                    {selectedSeat.fareZoneName && (
                      <span className="text-slate-400 block text-[11px] mt-0.5">{selectedSeat.fareZoneName}</span>
                    )}
                  </div>
                </div>

                {/* Booking Information if Booked */}
                {selectedSeat.booking && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs border border-slate-200/80 dark:border-slate-700">
                    <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center justify-between">
                      <span>{language === 'bn' ? 'যাত্রীর তথ্য' : 'Passenger Details'}</span>
                      <Link href={`/bookings/${selectedSeat.booking.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-[10px]">
                        {language === 'bn' ? 'ইনভয়েস দেখুন' : 'View Invoice'}
                      </Link>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t.studentName}:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedSeat.booking.passengerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t.passengerType}:</span>
                      <Badge variant="primary">{selectedSeat.booking.passengerType}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t.gender}:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedSeat.booking.passengerGender}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">পেমেন্ট:</span>
                      <Badge variant={selectedSeat.booking.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                        {selectedSeat.booking.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">বুকিং করেছেন:</span>
                      <span className="text-slate-700 dark:text-slate-300">{selectedSeat.booking.createdBy}</span>
                    </div>
                  </div>
                )}

                {/* Lock Information if Locked */}
                {selectedSeat.lock && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs border border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1">
                      {language === 'bn' ? 'লক সম্পর্কিত তথ্য' : 'Lock Information'}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">কারণ:</span> {selectedSeat.lock.reason}</p>
                    {selectedSeat.lock.notes && (
                      <p className="text-slate-500 italic text-[11px]">{selectedSeat.lock.notes}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {selectedSeat.status === 'AVAILABLE' && (
                    <>
                      <Link
                        href={`/bookings/new?tripId=${trip.id}&seatId=${selectedSeat.seatId}`}
                        className="w-full block"
                      >
                        <Button variant="primary" size="md" className="w-full font-bold">
                          <Sparkles className="w-4 h-4 mr-1.5" />
                          {language === 'bn' ? 'এই সিট বুকিং করুন' : 'Book This Seat Now'}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => handleHold(selectedSeat.seatId)}
                        isLoading={actionLoading}
                        className="w-full font-semibold"
                      >
                        {language === 'bn' ? '১০ মিনিটের জন্য হোল্ড করুন' : 'Temporary 10m Hold'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setIsLockModalOpen(true)}
                        className="w-full font-semibold"
                      >
                        <Lock className="w-4 h-4 mr-1.5" />
                        {language === 'bn' ? 'সিট লক করুন (ইমার্জেন্সি/ভিআইপি)' : 'Lock Seat (VIP/Staff/Emergency)'}
                      </Button>
                    </>
                  )}

                  {selectedSeat.status === 'HELD' && (
                    <>
                      <Link
                        href={`/bookings/new?tripId=${trip.id}&seatId=${selectedSeat.seatId}`}
                        className="w-full block"
                      >
                        <Button variant="primary" size="md" className="w-full font-bold">
                          {language === 'bn' ? 'বুকিং সম্পন্ন করুন' : 'Finalize Booking'}
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="md"
                        onClick={() => handleReleaseHold(selectedSeat.seatId)}
                        isLoading={actionLoading}
                        className="w-full font-semibold"
                      >
                        {language === 'bn' ? 'হোল্ড বাতিল করুন' : 'Release Hold'}
                      </Button>
                    </>
                  )}

                  {selectedSeat.status === 'LOCKED' && (
                    <Button
                      variant="success"
                      size="md"
                      onClick={() => handleUnlock(selectedSeat.seatId)}
                      isLoading={actionLoading}
                      className="w-full font-bold"
                    >
                      <Unlock className="w-4 h-4 mr-1.5" />
                      {t.unlockSeat}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <Bus className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">
                  {language === 'bn'
                    ? 'যাত্রীর তথ্য দেখতে বা সিট লক/আনলক করতে বাসের যেকোনো সিটের উপর ক্লিক করুন।'
                    : 'Click any seat on the bus layout to view passenger ticket information and desk controls.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lock Seat Modal */}
      <Modal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        title={`${t.lockSeat} ${selectedSeat?.seatNumber}`}
        description={language === 'bn' ? 'এই সিটটি জরুরি বা বিশেষ প্রয়োজনে লক করে রাখুন' : 'Prevent counter staff and online bookings for this seat'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'লক করার কারণ' : 'Lock Reason'}
            </label>
            <select
              value={lockReason}
              onChange={e => setLockReason(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="EMERGENCY">{language === 'bn' ? 'ইমার্জেন্সি / জরুরি রিজার্ভ' : 'Emergency / Contingency Reserve'}</option>
              <option value="VIP">{language === 'bn' ? 'ভিআইপি (বিশ্ববিদ্যালয় প্রতিনিধি / শিক্ষক)' : 'VIP (Faculty / University Observer)'}</option>
              <option value="STAFF">{language === 'bn' ? 'অফিস স্টাফ / বাস কো-অর্ডিনেটর' : 'Transit Coordinator / Office Staff'}</option>
              <option value="MAINTENANCE">{language === 'bn' ? 'সিট মেরামত / ড্যামেজ' : 'Seat Damage / Maintenance'}</option>
              <option value="OTHER">{language === 'bn' ? 'অন্যান্য বিশেষ কারণ' : 'Other Custom Hold'}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'লকের স্থায়িত্ব' : 'Lock Duration Type'}
            </label>
            <select
              value={lockType}
              onChange={e => setLockType(e.target.value as any)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="PERMANENT">{language === 'bn' ? 'স্থায়ী (বাস ছাড়া পর্যন্ত লক)' : 'Permanent (Until departure)'}</option>
              <option value="TEMPORARY">{language === 'bn' ? 'অস্থায়ী লক' : 'Temporary Lock'}</option>
            </select>
          </div>

          <Input
            label={language === 'bn' ? 'লক নোট / বিবরণ' : 'Internal Justification Notes'}
            placeholder="e.g. ভর্তি পরীক্ষার টিম কো-অর্ডিনেটরের জন্য সংরক্ষিত"
            value={lockNotes}
            onChange={e => setLockNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsLockModalOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button variant="danger" size="sm" onClick={handleLockSubmit} isLoading={actionLoading} className="font-bold">
              {t.lockSeat}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  function renderSeatButton(seat: SeatStatusDetail) {
    const isSelected = selectedSeat?.seatId === seat.seatId;

    let seatClasses = 'seat-available';
    if (seat.status === 'BOOKED') {
      if (seat.booking?.passengerGender === 'FEMALE') {
        seatClasses = 'seat-booked-female';
      } else {
        seatClasses = 'seat-booked-male';
      }
    } else if (seat.status === 'HELD') {
      seatClasses = 'seat-held';
    } else if (seat.status === 'LOCKED') {
      seatClasses = 'seat-locked';
    }

    return (
      <button
        key={seat.seatId}
        onClick={() => setSelectedSeat(seat)}
        className={`w-12 h-12 seat-luxury flex flex-col items-center justify-center text-xs font-extrabold transition-all relative select-none ${seatClasses} ${
          isSelected ? 'seat-selected' : ''
        }`}
      >
        <span className="text-[11px] leading-none font-black">{seat.seatNumber}</span>
        <span className="text-[9px] opacity-85 font-mono leading-none mt-0.5">৳{seat.fare}</span>

        {/* Gender rule marker */}
        {seat.genderAllowed === 'FEMALE_ONLY' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full text-white text-[7px] flex items-center justify-center font-bold shadow-xs">
            F
          </span>
        )}
        {seat.genderAllowed === 'MALE_ONLY' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-white text-[7px] flex items-center justify-center font-bold shadow-xs">
            M
          </span>
        )}
      </button>
    );
  }
}
