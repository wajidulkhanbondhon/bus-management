'use client';

import React from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Building,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OfficialWhatsAppIcon } from '@/components/home/public-helpline-bar';

export interface PassengerRecord {
  id: string;
  bookingRef: string;
  name: string;
  phone: string;
  seatNumbers: string[];
  gender: 'MALE' | 'FEMALE';
  userType: 'STUDENT' | 'GUARDIAN';
  unitOrExam: string;
  boardingPoint: string;
  boardingTime: string;
  droppingPoint: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  attendanceStatus: 'BOARDED' | 'WAITING' | 'ABSENT';
  hasAccommodation?: boolean;
  notes?: string;
}

interface PassengerAttendanceCardProps {
  passenger: PassengerRecord;
  busName: string;
  busNumber: string;
  onStatusChange: (id: string, newStatus: 'BOARDED' | 'WAITING' | 'ABSENT') => void;
  onCollectDue: (id: string, amount: number) => void;
}

export function PassengerAttendanceCard({
  passenger,
  busName,
  busNumber,
  onStatusChange,
  onCollectDue,
}: PassengerAttendanceCardProps) {
  const isPaid = passenger.dueAmount <= 0;
  const isBoarded = passenger.attendanceStatus === 'BOARDED';
  const isWaiting = passenger.attendanceStatus === 'WAITING';
  const isAbsent = passenger.attendanceStatus === 'ABSENT';

  // Format clean phone number for whatsapp
  const cleanPhone = passenger.phone.replace(/[^0-9]/g, '').replace(/^0/, '880');
  const whatsappMessage = encodeURIComponent(
    `আসসালামু আলাইকুম ${passenger.name},\nATOMS Transport-এর বাস "${busName} (${busNumber})" আপনার নির্ধারিত বোর্ডিং পয়েন্ট "${passenger.boardingPoint}"-এ পৌঁছাতে যাচ্ছে।\nআপনার আসন নং: ${passenger.seatNumbers.join(', ')}।\nদয়া করে প্রস্তুত থাকুন।\nহেল্পলাইন: 01711-000001`
  );

  return (
    <div
      className={`rounded-3xl border transition-all p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm ${
        isBoarded
          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-emerald-500/5'
          : isAbsent
          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 opacity-90'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
      }`}
    >
      {/* Top: Seats badge, Name, Roll/Unit & Status */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Seat Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {passenger.seatNumbers.map((seat) => (
              <span
                key={seat}
                className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-xs font-mono shadow-xs"
              >
                সিট {seat}
              </span>
            ))}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                passenger.gender === 'FEMALE'
                  ? 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800'
                  : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
              }`}
            >
              {passenger.gender === 'FEMALE' ? 'মহিলা' : 'ছাত্র'}
            </span>
          </div>

          {/* Booking Ref */}
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
            {passenger.bookingRef}
          </span>
        </div>

        {/* Passenger Info */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              {passenger.name}
              {passenger.userType === 'STUDENT' ? (
                <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
              ) : (
                <User className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <span>{passenger.unitOrExam}</span>
              {passenger.hasAccommodation && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  • <Building className="w-3 h-3" /> আবাসন
                </span>
              )}
            </p>
          </div>

          {/* Attendance State Indicator */}
          <div>
            {isBoarded && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                উপস্থিত
              </span>
            )}
            {isWaiting && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5" />
                অপেক্ষমাণ
              </span>
            )}
            {isAbsent && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                <XCircle className="w-3.5 h-3.5" />
                অনুপস্থিত
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Boarding Point & Dropping Point Box */}
      <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
        {/* Pickup */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
              বোর্ডিং পয়েন্ট (কোথা থেকে উঠবে)
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {passenger.boardingPoint}
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
              ({passenger.boardingTime})
            </span>
          </div>
        </div>

        {/* Dropoff */}
        <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/50">
          <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
              গন্তব্য (কোথায় নামবে)
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              {passenger.droppingPoint}
            </span>
          </div>
        </div>
      </div>

      {/* Payment & Due Status */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 text-xs">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">ভাড়া:</span>
          <span className="font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(passenger.totalAmount)}
          </span>
        </div>

        <div>
          {isPaid ? (
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700">
              পরিশোধিত (Paid)
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-700">
                বকেয়া: {formatCurrency(passenger.dueAmount)}
              </span>
              <button
                type="button"
                onClick={() => onCollectDue(passenger.id, passenger.dueAmount)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
              >
                ক্যাশ সংগ্রহ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: 1-Click Call, WhatsApp & 3-State Attendance Controls */}
      <div className="space-y-2 pt-1">
        {/* Contact Passenger Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${passenger.phone}`}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>কল দিন ({passenger.phone})</span>
          </a>

          <a
            href={`https://wa.me/${cleanPhone}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-green-50 dark:bg-green-950/60 hover:bg-green-100 dark:hover:bg-green-900/60 text-green-700 dark:text-green-300 text-xs font-bold border border-green-200 dark:border-green-800 transition-colors shadow-xs"
          >
            <OfficialWhatsAppIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span>WhatsApp মেসেজ</span>
          </a>
        </div>

        {/* 3-State Attendance Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => onStatusChange(passenger.id, 'BOARDED')}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              isBoarded
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>উপস্থিত</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(passenger.id, 'WAITING')}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              isWaiting
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>অপেক্ষমাণ</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(passenger.id, 'ABSENT')}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              isAbsent
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>অনুপস্থিত</span>
          </button>
        </div>
      </div>
    </div>
  );
}
