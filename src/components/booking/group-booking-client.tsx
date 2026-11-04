'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Phone,
  Ticket,
  Printer,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Percent,
  Bus,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  CreditCard,
  FileSpreadsheet,
  Copy,
  Check,
  Share2,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  FileText,
  HelpCircle,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  Armchair,
  Award,
  BookmarkCheck,
  CheckCheck,
  AlertTriangle,
  GraduationCap,
  Navigation,
  Radio,
  Footprints,
  Wifi,
  Wind,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, formatTime, cn } from '@/lib/utils';
import { useApp } from '@/lib/context';
import { QRCodeView } from '@/components/common/qr-code';
import {
  BkashLogo,
  NagadLogo,
  RocketLogo,
  BankTransferLogo,
  CashMoneyLogo,
  WhatsAppLogo
} from '@/components/booking/payment-brand-icons';
import { createBookingAction } from '@/actions/booking.actions';
import { adjacentPartners } from '@/services/rules.service';

export type PassengerRole = 'MALE' | 'FEMALE' | 'FATHER' | 'MOTHER' | 'BROTHER' | 'SISTER';

export interface StudentPassenger {
  id?: string;
  name: string;
  phone: string;
  roll: string;
  seat: string;
  role: PassengerRole;
  gender: 'MALE' | 'FEMALE';
}

export interface GroupBookingClientProps {
  initialTrips?: any[];
  initialBuses?: any[];
}

export type PaymentChannel = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER' | 'HAND_CASH';
export type PaymentMode = 'FULL' | 'PARTIAL' | 'BOARDING_PAY';
export type JourneyType = 'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY';

// Helper to resolve role metadata, icon, and colors
export function resolveRoleInfo(role: PassengerRole) {
  switch (role) {
    case 'MALE':
      return {
        label: 'ছাত্র (Male Student)',
        shortLabel: 'ছাত্র',
        gender: 'MALE' as const,
        isGuardian: false,
        icon: '👨',
        pillClass: 'bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-700 text-white border-blue-300 shadow-blue-500/40',
        armrestClass: 'bg-blue-400',
        headrestClass: 'bg-blue-500',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
      };
    case 'FEMALE':
      return {
        label: 'ছাত্রী (Female Student)',
        shortLabel: 'ছাত্রী',
        gender: 'FEMALE' as const,
        isGuardian: false,
        icon: '👩',
        pillClass: 'bg-gradient-to-b from-pink-500 via-pink-600 to-rose-700 text-white border-pink-300 shadow-pink-500/40',
        armrestClass: 'bg-pink-400',
        headrestClass: 'bg-pink-500',
        badgeClass: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 border-pink-300'
      };
    case 'FATHER':
      return {
        label: 'বাবা (Father - অভিভাবক)',
        shortLabel: 'বাবা',
        gender: 'MALE' as const,
        isGuardian: true,
        icon: '🧔',
        pillClass: 'bg-gradient-to-b from-amber-500 via-amber-600 to-orange-700 text-white border-amber-300 shadow-amber-500/40',
        armrestClass: 'bg-amber-400',
        headrestClass: 'bg-amber-500',
        badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
      };
    case 'MOTHER':
      return {
        label: 'মা (Mother - অভিভাবক)',
        shortLabel: 'মা',
        gender: 'FEMALE' as const,
        isGuardian: true,
        icon: '🧕',
        pillClass: 'bg-gradient-to-b from-purple-500 via-purple-600 to-violet-700 text-white border-purple-300 shadow-purple-500/40',
        armrestClass: 'bg-purple-400',
        headrestClass: 'bg-purple-500',
        badgeClass: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-300'
      };
    case 'BROTHER':
      return {
        label: 'ভাই (Brother - অভিভাবক)',
        shortLabel: 'ভাই',
        gender: 'MALE' as const,
        isGuardian: true,
        icon: '👦',
        pillClass: 'bg-gradient-to-b from-cyan-500 via-cyan-600 to-teal-700 text-white border-cyan-300 shadow-cyan-500/40',
        armrestClass: 'bg-cyan-400',
        headrestClass: 'bg-cyan-500',
        badgeClass: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300'
      };
    case 'SISTER':
      return {
        label: 'বোন (Sister - অভিভাবক)',
        shortLabel: 'বোন',
        gender: 'FEMALE' as const,
        isGuardian: true,
        icon: '👧',
        pillClass: 'bg-gradient-to-b from-rose-500 via-rose-600 to-pink-700 text-white border-rose-300 shadow-rose-500/40',
        armrestClass: 'bg-rose-400',
        headrestClass: 'bg-rose-500',
        badgeClass: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
      };
    default:
      return {
        label: 'ছাত্র (Male Student)',
        shortLabel: 'ছাত্র',
        gender: 'MALE' as const,
        isGuardian: false,
        icon: '👨',
        pillClass: 'bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-700 text-white',
        armrestClass: 'bg-blue-400',
        headrestClass: 'bg-blue-500',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300'
      };
  }
}

// Built-in fallback scheduled admission trips categorized by University
const FALLBACK_TRIPS = [
  {
    id: 'trip-sust-01',
    tripCode: 'TRIP-SUST-101',
    busName: 'হানিফ স্পেশাল ভর্তি এক্সপ্রেস',
    busNumber: 'COACH-101',
    operator: 'হানিফ এন্টারপ্রাইজ',
    route: { origin: 'ঢাকা (গাবতলী/ফার্মগেট)', destination: 'শাবিপ্রবি ক্যাম্পাস (SUST, সিলেট)' },
    targetUniversity: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (SUST)',
    uniKey: 'SUST',
    examUnit: 'A ও B ইউনিট (বিজ্ঞান ও মানবিক)',
    departureDate: '2026-11-05',
    departureTime: '22:30',
    reportingTime: 'রাত ০৯:৪৫ মিনিট',
    tripBusType: 'MIXED',
    isAc: false,
    capacity: 40,
    basePrice: 650
  },
  {
    id: 'trip-sust-02',
    tripCode: 'TRIP-SUST-102',
    busName: 'গ্রিন লাইন রয়েল ভলভো (AC)',
    busNumber: 'COACH-102',
    operator: 'গ্রিন লাইন পরিবহন',
    route: { origin: 'ঢাকা (ফার্মগেট/মহাখালী)', destination: 'শাবিপ্রবি প্রধান ফটক (সিলেট)' },
    targetUniversity: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (SUST)',
    uniKey: 'SUST',
    examUnit: 'A ইউনিট (বিজ্ঞান ও প্রযুক্তি)',
    departureDate: '2026-11-05',
    departureTime: '23:00',
    reportingTime: 'রাত ১০:১৫ মিনিট',
    tripBusType: 'MIXED',
    isAc: true,
    capacity: 40,
    basePrice: 850
  },
  {
    id: 'trip-ru-01',
    tripCode: 'TRIP-RU-204',
    busName: 'দেশ ট্রাভেলস রয়্যাল এক্সপ্রেস',
    busNumber: 'COACH-204',
    operator: 'দেশ ট্রাভেলস',
    route: { origin: 'ঢাকা (কল্যাণপুর/ফার্মগেট)', destination: 'রাজশাহী বিশ্ববিদ্যালয় ক্যাম্পাস (RU)' },
    targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
    uniKey: 'RU',
    examUnit: 'A ইউনিট (মানবিক ও আইন)',
    departureDate: '2026-11-08',
    departureTime: '23:00',
    reportingTime: 'রাত ১০:১৫ মিনিট',
    tripBusType: 'MIXED',
    isAc: true,
    capacity: 40,
    basePrice: 750
  },
  {
    id: 'trip-ru-02',
    tripCode: 'TRIP-RU-205',
    busName: 'একতা স্পেশাল এডমিশন বাস',
    busNumber: 'COACH-205',
    operator: 'একতা পরিবহন',
    route: { origin: 'ঢাকা (গাবতলী/ফার্মগেট)', destination: 'রাবি প্রধান ফটক / কাজলা গেট' },
    targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
    uniKey: 'RU',
    examUnit: 'C ইউনিট (বিজ্ঞান ও কৃষি)',
    departureDate: '2026-11-08',
    departureTime: '22:15',
    reportingTime: 'রাত ০৯:৩০ মিনিট',
    tripBusType: 'MIXED',
    isAc: false,
    capacity: 40,
    basePrice: 650
  },
  {
    id: 'trip-cu-01',
    tripCode: 'TRIP-CU-305',
    busName: 'শ্যামলী স্পেশাল ভর্তি সার্ভিস',
    busNumber: 'COACH-305',
    operator: 'শ্যামলী পরিবহন',
    route: { origin: 'ঢাকা (সায়েদাবাদ/ফার্মগেট)', destination: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU, ১নং গেট)' },
    targetUniversity: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
    uniKey: 'CU',
    examUnit: 'A ও C ইউনিট (বিজ্ঞান ও বাণিজ্য)',
    departureDate: '2026-11-12',
    departureTime: '22:00',
    reportingTime: 'রাত ০৯:১৫ মিনিট',
    tripBusType: 'MIXED',
    isAc: false,
    capacity: 40,
    basePrice: 680
  },
  {
    id: 'trip-ju-01',
    tripCode: 'TRIP-JU-401',
    busName: 'গ্রিন এক্সপ্রেস ডে-কোচ',
    busNumber: 'COACH-401',
    operator: 'গ্রিন লাইন স্পেশাল',
    route: { origin: 'ঢাকা (মতিঝিল/ফার্মগেট)', destination: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU, ডেইরি গেট)' },
    targetUniversity: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)',
    uniKey: 'JU',
    examUnit: 'D ইউনিট (জীববিজ্ঞান অনুষদ)',
    departureDate: '2026-11-15',
    departureTime: '06:30',
    reportingTime: 'সকাল ০৫:৪৫ মিনিট',
    tripBusType: 'MIXED',
    isAc: true,
    capacity: 40,
    basePrice: 450
  },
  {
    id: 'trip-engg-01',
    tripCode: 'TRIP-ENGG-501',
    busName: 'ইঞ্জিনিয়ারিং গুচ্ছ এক্সপ্রেস (CKRUET)',
    busNumber: 'COACH-501',
    operator: 'হানিফ বাউন্ড স্পেশাল',
    route: { origin: 'ঢাকা (ফার্মগেট/কল্যাণপুর)', destination: 'রুয়েট ও কুয়েট ভর্তি কেন্দ্র' },
    targetUniversity: 'ইঞ্জিনিয়ারিং গুচ্ছ (RUET, CUET, KUET)',
    uniKey: 'ENGG',
    examUnit: 'ক ও খ গ্রুপ (প্রকৌশল ও আর্কিটেকচার)',
    departureDate: '2026-11-20',
    departureTime: '22:30',
    reportingTime: 'রাত ০৯:৪৫ মিনিট',
    tripBusType: 'MIXED',
    isAc: true,
    capacity: 40,
    basePrice: 800
  },
  {
    id: 'trip-gst-01',
    tripCode: 'TRIP-GST-601',
    busName: 'জিএসটি গুচ্ছ সেন্ট্রাল বাস',
    busNumber: 'COACH-601',
    operator: 'সেন্ট্রাল ট্রাভেলস',
    route: { origin: 'ঢাকা (ফার্মগেট)', destination: 'জিএসটি সমন্বিত ভর্তি কেন্দ্র' },
    targetUniversity: 'জিএসটি গুচ্ছ (GST Cluster - ২৪ বিশ্ববিদ্যালয়)',
    uniKey: 'GST',
    examUnit: 'A ইউনিট (বিজ্ঞান শাখা)',
    departureDate: '2026-11-25',
    departureTime: '23:00',
    reportingTime: 'রাত ১০:১৫ মিনিট',
    tripBusType: 'MIXED',
    isAc: false,
    capacity: 40,
    basePrice: 650
  }
];

const PRESET_COACHINGS = [
  'উদ্ভাস-উন্মেষ শিক্ষা পরিবার',
  'ফোকাস বিশ্ববিদ্যালয় ভর্তি কোচিং',
  'রেটিনা মেডিকেল অ্যান্ড ডেন্টাল কোচিং',
  'প্যারাগন বিশ্ববিদ্যালয় কোচিং',
  'সানরাইজ এডমিশন সেন্টার',
  'ওমেগা ভর্তি কোচিং',
  'আইকন প্লাস কোচিং',
  'জেলা বিশ্ববিদ্যালয় ছাত্র সংসদ'
];

const BOARDING_POINTS = [
  'ফার্মগেট (আনন্দ সিনেমা হলের সামনে)',
  'মহাখালী বাস টার্মিনাল কাউন্টার',
  'গাবতলী মাজার রোড মোড়',
  'কল্যাণপুর বাস স্ট্যান্ড',
  'সায়েদাবাদ জনপথ মোড়',
  'উত্তরা রাজলক্ষ্মী ওভারব্রিজ',
  'মিরপুর ১০ নম্বর গোলচত্বর',
  'মতিঝিল আরামবাগ মোড়',
  'সাভার বাস স্ট্যান্ড'
];

const DROPPING_POINTS = [
  'শাবিপ্রবি মেইন গেট (সিলেট)',
  'রাবি প্রধান ফটক / কাজলা গেট (রাজশাহী)',
  'চবি ১ নম্বর গেট ও জিরো পয়েন্ট (চট্টগ্রাম)',
  'জাবি প্রধান ফটক / ডেইরি গেট (সাভার)',
  'খুবি মেইন গেট (গল্লামারী, খুলনা)',
  'বাকৃবি আব্দুল জব্বার মোড় (ময়মনসিংহ)',
  'কুয়েট মেইন গেট (খুলনা)',
  'রুয়েট কাজলা গেট (রাজশাহী)'
];

// 40-Seat Standard Bus Layout Matrix (Rows A to J)
const BUS_SEAT_ROWS = [
  { row: 'A', left: ['A1', 'A2'], right: ['A3', 'A4'] },
  { row: 'B', left: ['B1', 'B2'], right: ['B3', 'B4'] },
  { row: 'C', left: ['C1', 'C2'], right: ['C3', 'C4'] },
  { row: 'D', left: ['D1', 'D2'], right: ['D3', 'D4'] },
  { row: 'E', left: ['E1', 'E2'], right: ['E3', 'E4'] },
  { row: 'F', left: ['F1', 'F2'], right: ['F3', 'F4'] },
  { row: 'G', left: ['G1', 'G2'], right: ['G3', 'G4'] },
  { row: 'H', left: ['H1', 'H2'], right: ['H3', 'H4'] },
  { row: 'I', left: ['I1', 'I2'], right: ['I3', 'I4'] },
  { row: 'J', left: ['J1', 'J2'], right: ['J3', 'J4', 'J5'], isBackRow: true }
];

// ──────────────────────────────────────────────
// Ultra-Luxury 3D Ergonomic Recliner Seat Cell
// ──────────────────────────────────────────────
function LuxuryReclinerSeat({
  seatCode,
  isSelected,
  student,
  isConflicted,
  onClick
}: {
  seatCode: string;
  isSelected: boolean;
  student?: StudentPassenger;
  isConflicted: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const roleMeta = student ? resolveRoleInfo(student.role) : null;

  return (
    <div
      className="relative shrink-0 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 3D Left Armrest */}
      <div
        className={cn(
          'absolute -left-1 sm:-left-1.5 top-3 bottom-3 w-1 sm:w-1.5 rounded-full transition-all duration-200 z-10',
          isSelected
            ? isConflicted
              ? 'bg-rose-400 shadow-sm shadow-rose-500/50'
              : roleMeta?.armrestClass || 'bg-blue-400 shadow-sm shadow-blue-500/50'
            : 'bg-slate-300 dark:bg-slate-700 shadow-2xs group-hover:bg-indigo-400'
        )}
      />

      {/* 3D Right Armrest */}
      <div
        className={cn(
          'absolute -right-1 sm:-right-1.5 top-3 bottom-3 w-1 sm:w-1.5 rounded-full transition-all duration-200 z-10',
          isSelected
            ? isConflicted
              ? 'bg-rose-400 shadow-sm shadow-rose-500/50'
              : roleMeta?.armrestClass || 'bg-blue-400 shadow-sm shadow-blue-500/50'
            : 'bg-slate-300 dark:bg-slate-700 shadow-2xs group-hover:bg-indigo-400'
        )}
      />

      {/* Floating Holographic Tooltip on Hover */}
      {hovered && (
        <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-950 text-white text-[11px] rounded-2xl p-2.5 whitespace-nowrap shadow-2xl border border-slate-700 leading-snug min-w-[130px] text-center backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="font-mono font-black text-sm text-amber-300">{seatCode}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white font-bold">
                {isSelected ? (student?.role ? resolveRoleInfo(student.role).shortLabel : 'সিলেক্টেড') : 'খালি আসন'}
              </span>
            </div>
            {student ? (
              <div className="space-y-0.5">
                <div className="text-emerald-300 font-bold truncate max-w-[150px]">
                  {roleMeta?.icon} {student.name || 'নাম লিখা হয়নি'}
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  {student.phone || 'মোবাইল অপূর্ণ'}
                </div>
                {isConflicted && (
                  <div className="text-rose-400 font-black text-[10px] mt-1">
                    ⚠️ জেন্ডার নীতি লঙ্ঘন!
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-300 font-bold">✅ ক্লিক করে বুকিং করুন</p>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950" />
          </div>
        </div>
      )}

      {/* MAIN SEAT CHAIR BODY */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-12 h-14 sm:w-16 sm:h-18 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-between font-black transition-all duration-200 ease-out relative select-none cursor-pointer overflow-hidden border-2',
          isSelected
            ? isConflicted
              ? 'bg-gradient-to-b from-rose-500 via-rose-600 to-red-700 text-white border-rose-300 shadow-lg shadow-rose-500/50 ring-2 ring-rose-400 scale-105 z-20 animate-pulse'
              : `${roleMeta?.pillClass || 'bg-gradient-to-b from-blue-500 via-indigo-600 to-blue-700 text-white'} shadow-xl ring-2 sm:ring-4 ring-indigo-400/40 -translate-y-0.5 sm:-translate-y-1 z-20 scale-105`
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 shadow-sm hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0'
        )}
      >
        {/* Subtle Sheen Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none" />

        {/* 1. Ergonomic Contoured Headrest Pillow with stitch */}
        <div
          className={cn(
            'w-7 sm:w-10 h-1.5 sm:h-2 rounded-full shadow-xs transition-all duration-200 border border-black/10 flex items-center justify-center',
            isSelected
              ? isConflicted
                ? 'bg-white text-rose-700'
                : 'bg-white/90 text-indigo-700'
              : 'bg-emerald-500 text-white shadow-emerald-500/30'
          )}
        >
          <div className="w-4 h-0.5 bg-black/20 rounded-full" />
        </div>

        {/* 2. Seat Code Label */}
        <div className="relative z-10 flex flex-col items-center justify-center my-0.5">
          <span
            className={cn(
              'text-xs sm:text-sm font-black font-mono tracking-tight leading-none',
              isSelected ? 'text-white drop-shadow-sm' : 'text-slate-800 dark:text-slate-200'
            )}
          >
            {seatCode}
          </span>
          {isSelected && student?.name && (
            <span className="text-[8px] sm:text-[9px] font-sans truncate max-w-[42px] sm:max-w-[56px] mt-0.5 opacity-90 leading-none">
              {student.name.split(' ')[0]}
            </span>
          )}
        </div>

        {/* 3. Role / Price Inset Bottom Pill */}
        <div
          className={cn(
            'w-full flex items-center justify-center gap-0.5 px-0.5 py-0.5 rounded-md sm:rounded-lg overflow-hidden backdrop-blur-md transition-colors relative z-10 border text-[9px] sm:text-[10px] font-black leading-none',
            isSelected
              ? 'bg-black/25 text-white border-white/20'
              : 'bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/5 text-slate-600 dark:text-slate-400'
          )}
        >
          {isSelected ? (
            <span className="flex items-center gap-0.5 truncate">
              <span>{roleMeta?.icon}</span>
              <span className="truncate">{roleMeta?.shortLabel}</span>
            </span>
          ) : (
            <span className="font-mono">খালি</span>
          )}
        </div>
      </button>
    </div>
  );
}

export function GroupBookingClient({ initialTrips = [] }: GroupBookingClientProps) {
  const { language } = useApp();

  // Combine fetched trips with fallback admission trips
  const allTrips = useMemo(() => {
    if (initialTrips && initialTrips.length > 0) {
      return initialTrips.map((t: any, idx: number) => {
        const u = t.targetUniversity || t.route?.destination || 'অন্যান্য বিশ্ববিদ্যালয়';
        let uniKey = 'OTHER';
        if (/SUST|শাবিপ্রবি|শাহজালাল/i.test(u)) uniKey = 'SUST';
        else if (/RU|রাবি|রাজশাহী/i.test(u)) uniKey = 'RU';
        else if (/CU|চবি|চট্টগ্রাম/i.test(u)) uniKey = 'CU';
        else if (/JU|জাবি|জাহাঙ্গীরনগর/i.test(u)) uniKey = 'JU';
        else if (/ENGG|RUET|CUET|KUET|বুয়েট|ইঞ্জিনিয়ারিং/i.test(u)) uniKey = 'ENGG';
        else if (/GST|গুচ্ছ/i.test(u)) uniKey = 'GST';

        return {
          id: t.id || `trip-loaded-${idx}`,
          tripCode: t.tripCode || t.trip_code || `TRIP-${t.bus?.busNumber || idx + 101}`,
          busName: t.bus?.busName || t.bus?.bus_name || 'স্পেশাল এডমিশন বাস',
          busNumber: t.bus?.busNumber || t.bus?.bus_number || `COACH-${idx + 101}`,
          operator: t.bus?.operator || 'পরবর্তী সময়ে নির্ধারিত',
          route: {
            origin: t.route?.origin || 'ঢাকা',
            destination: t.route?.destination || t.targetUniversity || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র'
          },
          targetUniversity: t.targetUniversity || t.route?.destination || 'বিশ্ববিদ্যালয় ক্যাম্পাস',
          uniKey,
          examUnit: t.examUnit || 'সাধারণ ভর্তি পরীক্ষা',
          departureDate: (t.departureDate || t.departure_date || new Date().toISOString()).split('T')[0],
          departureTime: t.departureTime || t.departure_time || '22:30',
          reportingTime: 'রাত ০৯:৪৫ মিনিট',
          tripBusType: t.tripBusType || t.trip_bus_type || 'MIXED',
          isAc: Boolean(t.isAc || (t.bus?.busName && t.bus.busName.includes('AC'))),
          capacity: Number(t.bus?.capacity || 40),
          basePrice: Number(t.basePrice || t.base_price || 650)
        };
      });
    }
    return FALLBACK_TRIPS;
  }, [initialTrips]);

  // DYNAMIC UNIVERSITY FILTERS: ONLY SHOW UNIVERSITIES WHERE BUSES ARE ACTIVELY SCHEDULED
  const activeUniversityFilters = useMemo(() => {
    const uniMap = new Map<string, { id: string; name: string; count: number }>();

    allTrips.forEach((trip) => {
      const uniName = trip.targetUniversity || trip.route?.destination || 'অন্যান্য বিশ্ববিদ্যালয়';
      const id = trip.uniKey || uniName;
      if (!uniMap.has(id)) {
        uniMap.set(id, { id, name: uniName, count: 1 });
      } else {
        uniMap.get(id)!.count += 1;
      }
    });

    return Array.from(uniMap.values());
  }, [allTrips]);

  // Selected University Filter State
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    activeUniversityFilters[0]?.id || 'SUST'
  );

  // Filtered Buses
  const filteredBuses = useMemo(() => {
    return allTrips.filter((t) => t.uniKey === selectedUniversity || t.targetUniversity === selectedUniversity);
  }, [allTrips, selectedUniversity]);

  // Selected Bus State
  const [selectedTripId, setSelectedTripId] = useState<string>(filteredBuses[0]?.id || allTrips[0]?.id || 'trip-sust-01');
  const [isCharteredBus, setIsCharteredBus] = useState<boolean>(false);
  const [charteredBusName, setCharteredBusName] = useState('উদ্ভাস স্পেশাল রিজার্ভ কোচ - ১');
  const [charteredOperator, setCharteredOperator] = useState('হানিফ বাউন্ড স্পেশাল');
  const [charteredRoute, setCharteredRoute] = useState('ঢাকা (ফার্মগেট) ➔ শাবিপ্রবি (সিলেট)');
  const [charteredDepDate, setCharteredDepDate] = useState('2026-11-05');
  const [charteredDepTime, setCharteredDepTime] = useState('22:30');

  useEffect(() => {
    if (filteredBuses.length > 0 && !filteredBuses.some((b) => b.id === selectedTripId)) {
      setSelectedTripId(filteredBuses[0].id);
    }
  }, [filteredBuses, selectedTripId]);

  const activeTrip = useMemo(() => {
    return allTrips.find((t) => t.id === selectedTripId) || filteredBuses[0] || allTrips[0] || FALLBACK_TRIPS[0];
  }, [allTrips, selectedTripId, filteredBuses]);

  // Coaching & Coordinator Details
  const [groupName, setGroupName] = useState('উদ্ভাস-উন্মেষ শিক্ষা পরিবার');
  const [branchName, setBranchName] = useState('ফার্মগেট প্রধান শাখা');
  const [coordinatorName, setCoordinatorName] = useState('ইঞ্জিনিয়ার আরিফুর রহমান');
  const [organizerPhone, setOrganizerPhone] = useState('01712345678');
  const [journeyType, setJourneyType] = useState<JourneyType>('ROUND_TRIP');
  const [boardingPoint, setBoardingPoint] = useState(BOARDING_POINTS[0]);
  const [droppingPoint, setDroppingPoint] = useState(DROPPING_POINTS[0]);
  const [reportingTime, setReportingTime] = useState('রাত ০৯:৪৫ মিনিট');
  const [specialInstructions, setSpecialInstructions] = useState('এডমিট কার্ড ও মূল রেজিস্ট্রেশন কার্ড সাথে রাখতে হবে।');

  // Pricing & Discount
  const [seatPrice, setSeatPrice] = useState<number>(activeTrip?.basePrice || 650);

  useEffect(() => {
    if (!isCharteredBus && activeTrip) {
      setSeatPrice(activeTrip.basePrice);
    }
  }, [activeTrip, isCharteredBus]);

  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [discountReason, setDiscountReason] = useState('কোচিং বাল্ক কর্পোরেট ছাড় (১০%)');

  // Students Passenger Roster with Father, Mother, Brother, Sister roles
  const [students, setStudents] = useState<StudentPassenger[]>([
    { name: 'আরিফুল ইসলাম', phone: '01711000001', roll: '2026-GST-101', seat: 'A1', role: 'MALE', gender: 'MALE' },
    { name: 'মোহাম্মদ রফিক', phone: '01711000002', roll: 'N/A', seat: 'A2', role: 'FATHER', gender: 'MALE' },
    { name: 'তানজিলা আক্তার', phone: '01711000003', roll: '2026-GST-103', seat: 'A3', role: 'FEMALE', gender: 'FEMALE' },
    { name: 'সালমা বেগম', phone: '01711000004', roll: 'N/A', seat: 'A4', role: 'MOTHER', gender: 'FEMALE' },
    { name: 'রাকিবুল হাসান', phone: '01711000005', roll: '2026-GST-105', seat: 'B1', role: 'MALE', gender: 'MALE' },
    { name: 'তাহমিদ আহমেদ', phone: '01711000006', roll: '2026-GST-106', seat: 'B2', role: 'BROTHER', gender: 'MALE' },
    { name: 'মুমতাহিনা তাবাসসুম', phone: '01711000007', roll: '2026-GST-107', seat: 'B3', role: 'FEMALE', gender: 'FEMALE' },
    { name: 'ফারহানা ইসলাম', phone: '01711000008', roll: '2026-GST-108', seat: 'B4', role: 'SISTER', gender: 'FEMALE' }
  ]);

  // Bulk Import Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRawText, setBulkRawText] = useState('');

  // Payment Options
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('FULL');
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('BKASH');
  const [transactionId, setTransactionId] = useState('TRX-BK-' + Math.floor(100000 + Math.random() * 900000));
  const [senderPhone, setSenderPhone] = useState('01712345678');
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState<number>(0);

  // Confirmed Ticket State
  const [bookingDone, setBookingDone] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Financial Calculations
  const totalSeats = students.length;
  const subtotal = totalSeats * seatPrice;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const netTotal = Math.max(0, subtotal - discountAmount);

  const paidAmount = useMemo(() => {
    if (paymentMode === 'FULL') return netTotal;
    if (paymentMode === 'BOARDING_PAY') return 0;
    return Math.min(netTotal, customAdvanceAmount || Math.round(netTotal * 0.5));
  }, [paymentMode, netTotal, customAdvanceAmount]);

  const dueAmount = Math.max(0, netTotal - paidAmount);

  // Fast Seat Mapping
  const studentBySeatMap = useMemo(() => {
    const map = new Map<string, StudentPassenger>();
    students.forEach((s) => {
      map.set(s.seat.toUpperCase().trim(), s);
    });
    return map;
  }, [students]);

  // GENDER & GUARDIAN RULE AUDIT:
  // "ছেলের পাশে ছেলে, মেয়ের পাশে মেয়ে"
  // Exception: Student + Family Guardian (Father, Mother, Brother, Sister) is an allowed family pair!
  const genderRuleViolations = useMemo(() => {
    const conflicts: { seat1: string; seat2: string; reason: string }[] = [];
    const checkedPairs = new Set<string>();

    students.forEach((st) => {
      const seat = st.seat.toUpperCase().trim();
      const partners = adjacentPartners(seat, { fiveSeatRows: ['J'] });

      partners.forEach((adjSeat) => {
        const pairKey = [seat, adjSeat].sort().join('-');
        if (checkedPairs.has(pairKey)) return;
        checkedPairs.add(pairKey);

        const adjStudent = studentBySeatMap.get(adjSeat);
        if (adjStudent) {
          const isOppositeGender = st.gender !== adjStudent.gender;
          if (isOppositeGender) {
            const stIsFamily = ['FATHER', 'MOTHER', 'BROTHER', 'SISTER'].includes(st.role);
            const adjIsFamily = ['FATHER', 'MOTHER', 'BROTHER', 'SISTER'].includes(adjStudent.role);

            if (!stIsFamily && !adjIsFamily) {
              const role1 = resolveRoleInfo(st.role).shortLabel;
              const role2 = resolveRoleInfo(adjStudent.role).shortLabel;
              conflicts.push({
                seat1: seat,
                seat2: adjSeat,
                reason: `সিট ${seat} (${role1}) এবং সিট ${adjSeat} (${role2}) পাশাপাশি। অভিভাবক ব্যতিরেকে অপরিচিত ছাত্র ও ছাত্রীর পাশাপাশি সিট বরাদ্দ নিষিদ্ধ!`
              });
            }
          }
        }
      });
    });

    return conflicts;
  }, [students, studentBySeatMap]);

  // Conflicting seat set for quick visual highlighting
  const conflictingSeatSet = useMemo(() => {
    const set = new Set<string>();
    genderRuleViolations.forEach((v) => {
      set.add(v.seat1);
      set.add(v.seat2);
    });
    return set;
  }, [genderRuleViolations]);

  // Auto-Align Gender Rule: Assign males to left pairs and females to right pairs
  const handleAutoAlignGender = () => {
    const males = students.filter((s) => s.gender === 'MALE');
    const females = students.filter((s) => s.gender === 'FEMALE');

    const leftSeats: string[] = [];
    const rightSeats: string[] = [];

    BUS_SEAT_ROWS.forEach((r) => {
      r.left.forEach((s) => leftSeats.push(s));
      r.right.forEach((s) => rightSeats.push(s));
    });

    const updatedStudents: StudentPassenger[] = [];

    males.forEach((m, i) => {
      updatedStudents.push({
        ...m,
        seat: leftSeats[i] || `S${i + 1}`
      });
    });

    females.forEach((f, i) => {
      updatedStudents.push({
        ...f,
        seat: rightSeats[i] || `S${males.length + i + 1}`
      });
    });

    setStudents(updatedStudents);
  };

  // Toggle seat from interactive bus map
  const handleToggleSeat = (seatCode: string) => {
    const norm = seatCode.toUpperCase().trim();
    if (studentBySeatMap.has(norm)) {
      setStudents(students.filter((s) => s.seat.toUpperCase().trim() !== norm));
    } else {
      const partners = adjacentPartners(norm, { fiveSeatRows: ['J'] });
      let suggestedRole: PassengerRole = 'MALE';
      for (const p of partners) {
        const partner = studentBySeatMap.get(p);
        if (partner) {
          suggestedRole = partner.gender === 'FEMALE' ? 'FEMALE' : 'MALE';
          break;
        }
      }

      const roleInfo = resolveRoleInfo(suggestedRole);
      setStudents([
        ...students,
        {
          name: '',
          phone: '',
          roll: `2026-GST-${101 + students.length}`,
          seat: norm,
          role: suggestedRole,
          gender: roleInfo.gender
        }
      ]);
    }
  };

  // Quick batch selection
  const handleSelectFirstNSeats = (n: number) => {
    const allSeats: string[] = [];
    BUS_SEAT_ROWS.forEach((r) => {
      r.left.forEach((s) => allSeats.push(s));
      r.right.forEach((s) => allSeats.push(s));
    });

    const targetSeats = allSeats.slice(0, n);
    const newStudents: StudentPassenger[] = targetSeats.map((seatName, i) => {
      const isLeft = seatName.endsWith('1') || seatName.endsWith('2');
      const role: PassengerRole = isLeft ? 'MALE' : 'FEMALE';
      return {
        name: '',
        phone: '',
        roll: `2026-GST-${101 + i}`,
        seat: seatName,
        role,
        gender: isLeft ? 'MALE' : 'FEMALE'
      };
    });
    setStudents(newStudents);
  };

  const handleClearAllSeats = () => {
    setStudents([]);
  };

  const handleAddStudentRow = () => {
    const allSeats: string[] = [];
    BUS_SEAT_ROWS.forEach((r) => {
      r.left.forEach((s) => allSeats.push(s));
      r.right.forEach((s) => allSeats.push(s));
    });

    const nextAvailable = allSeats.find((s) => !studentBySeatMap.has(s)) || `S${students.length + 1}`;
    const isLeft = nextAvailable.endsWith('1') || nextAvailable.endsWith('2');
    const role: PassengerRole = isLeft ? 'MALE' : 'FEMALE';

    setStudents([
      ...students,
      {
        name: '',
        phone: '',
        roll: `2026-GST-${101 + students.length}`,
        seat: nextAvailable,
        role,
        gender: isLeft ? 'MALE' : 'FEMALE'
      }
    ]);
  };

  const handleRemoveStudentRow = (idx: number) => {
    setStudents(students.filter((_, i) => i !== idx));
  };

  const handleUpdateStudent = (idx: number, field: keyof StudentPassenger, val: any) => {
    const updated = [...students];
    if (field === 'role') {
      const role = val as PassengerRole;
      const roleInfo = resolveRoleInfo(role);
      updated[idx] = {
        ...updated[idx],
        role,
        gender: roleInfo.gender
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: val };
    }
    setStudents(updated);
  };

  // Smart Bulk Import Parser
  const handleProcessBulkImport = () => {
    if (!bulkRawText.trim()) return;

    const lines = bulkRawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsed: StudentPassenger[] = [];

    const allSeats: string[] = [];
    BUS_SEAT_ROWS.forEach((r) => {
      r.left.forEach((s) => allSeats.push(s));
      r.right.forEach((s) => allSeats.push(s));
    });

    lines.forEach((line, i) => {
      let clean = line.replace(/^\s*\d+[\.\)\-\]\s]+/, '').trim();
      let parts = clean.split(/[,;\t|]+/).map((s) => s.trim());

      if (parts.length === 0 || !parts[0]) return;

      const name = parts[0] || `যাত্রী ${i + 1}`;
      let phone = '';
      let roll = `2026-GST-${201 + i}`;
      let role: PassengerRole = 'MALE';
      let customSeat = '';

      for (let pIdx = 1; pIdx < parts.length; pIdx++) {
        const val = parts[pIdx];
        if (/^01[3-9]\d{8}$/.test(val.replace(/[^0-9]/g, ''))) {
          phone = val.replace(/[^0-9]/g, '');
        } else if (/FATHER|বাবা|পিতা/i.test(val)) {
          role = 'FATHER';
        } else if (/MOTHER|মা|মাতা/i.test(val)) {
          role = 'MOTHER';
        } else if (/BROTHER|ভাই/i.test(val)) {
          role = 'BROTHER';
        } else if (/SISTER|বোন/i.test(val)) {
          role = 'SISTER';
        } else if (/FEMALE|ছাত্রী|মহিলা|মেয়ে/i.test(val)) {
          role = 'FEMALE';
        } else if (/MALE|ছাত্র|পুরুষ|ছেলে/i.test(val)) {
          role = 'MALE';
        } else if (/^[A-J][1-5]$/i.test(val)) {
          customSeat = val.toUpperCase();
        } else if (val.length > 2) {
          roll = val;
        }
      }

      if (!phone) {
        phone = `0171${String(1000000 + i).slice(-7)}`;
      }

      const assignedSeat = customSeat || allSeats[i] || `S${i + 1}`;
      const roleInfo = resolveRoleInfo(role);

      parsed.push({
        name,
        phone,
        roll,
        seat: assignedSeat,
        role,
        gender: roleInfo.gender
      });
    });

    if (parsed.length > 0) {
      setStudents(parsed);
      setIsBulkModalOpen(false);
      setBulkRawText('');
    }
  };

  // Confirm Final Booking
  const handleConfirmGroupBooking = async () => {
    if (students.length === 0) {
      alert('অনুগ্রহ করে কমপক্ষে ১ জন শিক্ষার্থী বা সিট নির্বাচন করুন।');
      return;
    }

    if (genderRuleViolations.length > 0) {
      const confirmContinue = window.confirm(
        `সতর্কতা: ${genderRuleViolations.length} টি পাশাপাশি সিটে জেন্ডার নীতি লঙ্ঘন রয়েছে (অপরিচিত ছাত্র ও ছাত্রীর পাশাপাশি সিট)।\nআপনি কি নিশ্চিত যে এই সিটে টিকিট বুকিং করতে চান?`
      );
      if (!confirmContinue) return;
    }

    const pnrCode = `VIP-GRP-${Date.now().toString().slice(-6)}`;
    const effectiveBusName = isCharteredBus ? charteredBusName : activeTrip.busName;
    const effectiveCoachNo = isCharteredBus ? 'CHARTER-01' : activeTrip.busNumber;
    const effectiveOperator = isCharteredBus ? charteredOperator : activeTrip.operator;
    const effectiveRoute = isCharteredBus ? charteredRoute : `${activeTrip.route.origin} ➔ ${activeTrip.route.destination}`;
    const effectiveDepDate = isCharteredBus ? charteredDepDate : activeTrip.departureDate;
    const effectiveDepTime = isCharteredBus ? charteredDepTime : activeTrip.departureTime;
    const effectiveUni = isCharteredBus ? 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র' : activeTrip.targetUniversity;

    const payload = {
      pnr: pnrCode,
      createdAt: new Date().toISOString(),
      groupName,
      branchName,
      coordinatorName,
      organizerPhone,
      journeyType,
      boardingPoint,
      droppingPoint,
      reportingTime,
      specialInstructions,
      bus: {
        busName: effectiveBusName,
        coachNo: effectiveCoachNo,
        operator: effectiveOperator,
        route: effectiveRoute,
        departureDate: effectiveDepDate,
        departureTime: effectiveDepTime,
        targetUniversity: effectiveUni,
        isAc: isCharteredBus ? true : activeTrip.isAc
      },
      pricing: {
        seatPrice,
        totalSeats,
        subtotal,
        discountPercent,
        discountAmount,
        discountReason,
        netTotal,
        paymentMode,
        paidAmount,
        dueAmount
      },
      payment: {
        channel: paymentChannel,
        transactionId: paymentChannel === 'HAND_CASH' ? 'CASH-COUNTER-' + pnrCode : transactionId,
        senderPhone: paymentChannel === 'HAND_CASH' ? organizerPhone : senderPhone,
        status: dueAmount === 0 ? 'FULLY_PAID' : paidAmount > 0 ? 'PARTIAL_PAID' : 'PAY_ON_BOARD'
      },
      students: students.map((s, idx) => ({
        ...s,
        ticketNo: `${pnrCode}-${s.seat || idx + 1}`
      }))
    };

    try {
      const existing = JSON.parse(localStorage.getItem('group_booking_records') || '[]');
      existing.unshift(payload);
      localStorage.setItem('group_booking_records', JSON.stringify(existing.slice(0, 30)));
    } catch {
      // Ignore storage errors
    }

    try {
      if (activeTrip?.id && !isCharteredBus) {
        await createBookingAction({
          tripId: activeTrip.id,
          seats: students.map((s) => ({ seatId: s.seat, fare: seatPrice })),
          passengers: students.map((s) => ({
            passengerName: s.name || `যাত্রী (${s.seat})`,
            passengerPhone: s.phone || organizerPhone,
            admissionId: s.roll,
            seatId: s.seat,
            gender: s.gender,
            passengerType: ['FATHER', 'MOTHER', 'BROTHER', 'SISTER'].includes(s.role) ? 'GUARDIAN' : 'STUDENT',
            hasWhatsapp: true
          })),
          contactName: coordinatorName,
          contactPhone: organizerPhone,
          journeyType: journeyType === 'ROUND_TRIP' ? 'ROUND_TRIP' : 'OUTBOUND_ONLY',
          boardingPoint,
          droppingPoint,
          paymentMethod: paymentChannel === 'HAND_CASH' ? 'HAND_CASH' : paymentChannel,
          paidAmount,
          isDiscountApplied: discountAmount > 0,
          discountType: 'PERCENTAGE',
          discountRate: discountPercent,
          discountReason,
          transactionId,
          notes: `[গ্রুপ বুকিং: ${groupName} - ${branchName}]`
        });
      }
    } catch {
      // Offline fallback
    }

    setConfirmedBookingData(payload);
    setBookingDone(true);
  };

  const handleCopySummary = () => {
    if (!confirmedBookingData) return;
    const b = confirmedBookingData;
    const summaryText = `🎓 *${b.groupName} - স্পেশাল এডমিশন বাস টিকিট ও কনফার্মেশন স্লিপ*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎫 *মাস্টার টিকিট নম্বর:* ${b.pnr}\n` +
      `🚌 *বাস:* ${b.bus.busName} (${b.bus.coachNo})\n` +
      `📍 *রুট:* ${b.bus.route}\n` +
      `🏛️ *টার্গেট বিশ্ববিদ্যালয়:* ${b.bus.targetUniversity}\n` +
      `🗓️ *যাত্রার সময়:* ${b.bus.departureDate} | রাত ${b.bus.departureTime}\n` +
      `⏰ *রিপোর্টিং সময়:* ${b.reportingTime}\n` +
      `🚩 *বোর্ডিং পয়েন্ট:* ${b.boardingPoint}\n` +
      `🏁 *ড্রপিং পয়েন্ট:* ${b.droppingPoint}\n` +
      `👥 *মোট যাত্রী:* ${b.pricing.totalSeats} জন\n` +
      `💺 *বরাদ্দকৃত আসন:* ${b.students.map((s: any) => s.seat).join(', ')}\n` +
      `💵 *মোট ভাড়া:* ৳${b.pricing.netTotal} (পরিশোধিত: ৳${b.pricing.paidAmount}, বকেয়া: ৳${b.pricing.dueAmount})\n` +
      `👤 *সমন্বয়কারী:* ${b.coordinatorName} (${b.organizerPhone})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_সেন্ট্রাল এডমিশন বাস ম্যানেজমেন্ট সার্ভিস_`;

    navigator.clipboard.writeText(summaryText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!confirmedBookingData) return;
    const b = confirmedBookingData;
    const message = encodeURIComponent(
      `🎓 *${b.groupName} - স্পেশাল এডমিশন বাস রসিদ*\n` +
      `মাস্টার টিকিট: ${b.pnr}\n` +
      `বাস: ${b.bus.busName} (${b.bus.coachNo})\n` +
      `রুট: ${b.bus.route}\n` +
      `তারিখ: ${b.bus.departureDate} (${b.bus.departureTime})\n` +
      `বোর্ডিং: ${b.boardingPoint}\n` +
      `যাত্রী: ${b.pricing.totalSeats} জন\n` +
      `সিট তালিকা: ${b.students.map((s: any) => s.seat).join(', ')}\n` +
      `পরিশোধ: ৳${b.pricing.paidAmount} | বকেয়া: ৳${b.pricing.dueAmount}`
    );
    const phone = organizerPhone.replace(/[^0-9]/g, '');
    const fullPhone = phone.startsWith('88') ? phone : `88${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-16 px-3 sm:px-4">
      {/* Print Specific CSS to enforce STRICT A4 1-PAGE */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 5mm !important;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
          }
          .a4-print-sheet {
            width: 100% !important;
            max-width: 195mm !important;
            height: auto !important;
            max-height: 280mm !important;
            box-shadow: none !important;
            border: 1px solid #94a3b8 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            margin: 0 auto !important;
            padding: 4mm !important;
          }
        }
      `}} />

      {/* Top Banner (Hidden in Print) */}
      <div className="no-print relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold tracking-wide">
              <Award className="w-3.5 h-3.5" />
              বিশ্ববিদ্যালয় ভর্তি স্পেশাল কোচিং কনসোল
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-400 shrink-0" />
              কোচিং সেন্টার ও গ্রুপ বুকিং কনসোল
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl font-normal leading-relaxed">
              সক্রিয় বিশ্ববিদ্যালয় নির্বাচন করে বাস বাছাই করুন, রিয়ালিস্টিক ৩ডি লাক্সারি রিক্লাইনার বাস সিট লেআউট থেকে আসন নিন, ছাত্র-ছাত্রী ও
              অভিভাবক (বাবা, মা, ভাই, বোন) জেন্ডার নীতি অনুযায়ী বসান এবং A4 ১-পৃষ্ঠার স্পেশাল টিকিট তৈরি করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/bookings">
              <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 border-white/20 text-white">
                <Ticket className="w-3.5 h-3.5 mr-1.5" />
                সব বুকিং তালিকা
              </Button>
            </Link>
            <Link href="/trips">
              <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 border-white/20 text-white">
                <Bus className="w-3.5 h-3.5 mr-1.5" />
                ট্রিপ শিডিউল
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CONFIRMED A4 1-PAGE SPECIAL TICKET HUB */}
      {bookingDone && confirmedBookingData ? (
        <div className="space-y-6">
          {/* Top Control Bar (Hidden on Print) */}
          <div className="no-print p-5 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 dark:bg-emerald-950/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    A4 ১-পৃষ্ঠার স্পেশাল টিকিট প্রস্তুত!
                  </h2>
                  <Badge className="bg-emerald-600 text-white font-mono font-bold text-xs">A4 READY</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  মাস্টার PNR: <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{confirmedBookingData.pnr}</span>{' '}
                  • টিকিটে পূর্ণাঙ্গ বাস সিট ম্যাপ চার্ট ও জেন্ডার আইকন রয়েছে।
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md px-5"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                A4 ১-পেজে প্রিন্ট করুন
              </Button>
              <Button
                variant="outline"
                onClick={handleCopySummary}
                className="font-bold rounded-xl text-xs"
              >
                {copiedLink ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copiedLink ? 'কপি হয়েছে' : 'বিবরণ কপি'}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenWhatsApp}
                className="font-bold rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              >
                <WhatsAppLogo className="w-4 h-4 mr-1.5" />
                হোয়াটসঅ্যাপ
              </Button>
              <Button
                variant="outline"
                onClick={() => setBookingDone(false)}
                className="font-bold rounded-xl text-xs"
              >
                নতুন গ্রুপ বুকিং
              </Button>
            </div>
          </div>

          {/* STRICT A4 1-PAGE PRINT SHEET */}
          <div className="a4-print-sheet bg-white text-slate-900 rounded-3xl border-2 border-indigo-200 shadow-2xl p-6 sm:p-7 max-w-4xl mx-auto space-y-3.5">
            {/* Header: Crest & PNR */}
            <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-2.5 gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-indigo-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    বিশ্ববিদ্যালয় ভর্তি স্পেশাল সার্ভিস • অফিশিয়াল গ্রুপ ট্রাভেল ভাউচার
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {confirmedBookingData.groupName}
                  </h3>
                  <div className="text-xs text-slate-600 font-semibold">
                    {confirmedBookingData.branchName} • সমন্বয়কারী: {confirmedBookingData.coordinatorName} ({confirmedBookingData.organizerPhone})
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[9px] font-mono uppercase text-slate-400 font-bold">মাস্টার বুকিং PNR</div>
                <div className="text-xl sm:text-2xl font-mono font-black text-indigo-700 tracking-wider">
                  {confirmedBookingData.pnr}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  ইস্যু: {formatDate(confirmedBookingData.createdAt)}
                </div>
              </div>
            </div>

            {/* Trip Details Bar */}
            <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[9px] text-slate-500 block">টার্গেট বিশ্ববিদ্যালয়:</span>
                <span className="font-black text-slate-900 truncate block text-[11px]">
                  {confirmedBookingData.bus.targetUniversity}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">বাস ও কোচ নম্বর:</span>
                <span className="font-bold text-slate-900 truncate block text-[11px]">
                  {confirmedBookingData.bus.busName} ({confirmedBookingData.bus.coachNo})
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">যাত্রার সময়:</span>
                <span className="font-bold text-slate-900 truncate block text-[11px]">
                  {confirmedBookingData.bus.departureDate} ({confirmedBookingData.bus.departureTime})
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">রিপোর্টিং সময়:</span>
                <span className="font-black text-rose-600 truncate block text-[11px]">
                  {confirmedBookingData.reportingTime}
                </span>
              </div>
            </div>

            {/* Stoppages */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl border border-slate-200 bg-white">
                <span className="text-[9px] font-bold text-slate-400 block">বোর্ডিং পয়েন্ট (পিকআপ):</span>
                <span className="font-bold text-slate-900 text-[11px]">{confirmedBookingData.boardingPoint}</span>
              </div>
              <div className="p-2 rounded-xl border border-slate-200 bg-white">
                <span className="text-[9px] font-bold text-slate-400 block">ড্রপিং পয়েন্ট (গন্তব্য ক্যাম্পাস ফটক):</span>
                <span className="font-bold text-slate-900 text-[11px]">{confirmedBookingData.droppingPoint}</span>
              </div>
            </div>

            {/* REALISTIC 2+2 BUS SEAT MAP ON THE TICKET */}
            <div className="p-3 rounded-2xl border-2 border-indigo-100 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="font-black text-slate-900 flex items-center gap-1.5">
                  <Armchair className="w-4 h-4 text-indigo-600" />
                  বাসের আসন বিন্যাস ও বরাদ্দকৃত সিট চার্ট (Bus Seat Layout Map)
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-blue-600" />
                    ছাত্র (👨)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-pink-600" />
                    ছাত্রী (👩)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-amber-600" />
                    বাবা (🧔)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-purple-600" />
                    মা (🧕)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-cyan-600" />
                    ভাই (👦)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-rose-600" />
                    বোন (👧)
                  </span>
                </div>
              </div>

              {/* Realistic 2+2 Seat Grid on Ticket */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-1.5 border-b border-dashed border-slate-200 pb-1">
                  <span>🚪 প্রবেশদ্বার</span>
                  <span>🛞 ড্রাইভার আসন</span>
                </div>

                <div className="grid grid-cols-10 gap-1 text-[10px]">
                  {BUS_SEAT_ROWS.map((r) => {
                    const rowSeats = [...r.left, ...r.right];
                    return rowSeats.map((seatCode) => {
                      const student = confirmedBookingData.students.find((s: any) => s.seat === seatCode);
                      const isBooked = !!student;
                      const roleMeta = student ? resolveRoleInfo(student.role) : null;
                      return (
                        <div
                          key={seatCode}
                          className={`py-1 px-0.5 rounded-lg border text-center transition-all ${
                            isBooked
                              ? `${roleMeta?.pillClass || 'bg-indigo-600 text-white'} border-transparent shadow-2xs`
                              : 'bg-slate-50 border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <div className="font-mono font-bold leading-none">{seatCode}</div>
                          {isBooked && (
                            <div className="text-[8px] truncate mt-0.5 font-sans leading-none px-0.5 opacity-95">
                              {roleMeta?.icon} {student.name.split(' ')[0] || roleMeta?.shortLabel}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>

            {/* Compact Passenger Manifest Table */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>শিক্ষার্থী ও অভিভাবক তালিকা ({confirmedBookingData.students.length} জন):</span>
                <span className="text-[10px] font-mono text-slate-500">
                  সিট সমূহ: {confirmedBookingData.students.map((s: any) => s.seat).join(', ')}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[9px] uppercase font-mono">
                    <tr>
                      <th className="px-2 py-1 w-12 text-center">সিট</th>
                      <th className="px-2 py-1">যাত্রীর পুরো নাম</th>
                      <th className="px-2 py-1">মোবাইল নম্বর</th>
                      <th className="px-2 py-1">ভর্তি রোল / আইডি</th>
                      <th className="px-2 py-1">ভূমিকা / পরিচয়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px]">
                    {confirmedBookingData.students.slice(0, 10).map((st: any, idx: number) => {
                      const roleMeta = resolveRoleInfo(st.role);
                      return (
                        <tr key={idx}>
                          <td className="px-2 py-1 text-center font-mono font-black text-indigo-700">
                            {st.seat}
                          </td>
                          <td className="px-2 py-1 font-bold text-slate-800 truncate max-w-[150px]">
                            {st.name || 'যাত্রী'}
                          </td>
                          <td className="px-2 py-1 font-mono text-slate-600">
                            {st.phone || confirmedBookingData.organizerPhone}
                          </td>
                          <td className="px-2 py-1 font-mono text-slate-500">{st.roll}</td>
                          <td className="px-2 py-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleMeta.badgeClass}`}>
                              {roleMeta.icon} {roleMeta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {confirmedBookingData.students.length > 10 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-1 text-center text-[9px] text-slate-500 italic bg-slate-50">
                          + আরও {confirmedBookingData.students.length - 10} জন যাত্রীর তথ্য সংযুক্ত ফাইলে সংরক্ষিত।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & QR Block */}
            <div className="grid grid-cols-12 gap-2.5 pt-2 border-t border-slate-200 text-xs">
              <div className="col-span-8 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">ভাড়ার হিসাব:</span>
                  <span className="font-mono">
                    {confirmedBookingData.pricing.totalSeats} সিট × ৳{confirmedBookingData.pricing.seatPrice} = ৳{confirmedBookingData.pricing.subtotal}
                  </span>
                </div>
                {confirmedBookingData.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                    <span>গ্রুপ ছাড় ({confirmedBookingData.pricing.discountPercent}%):</span>
                    <span className="font-mono">-৳{confirmedBookingData.pricing.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs text-slate-900 border-t border-slate-200 pt-1">
                  <span>সর্বমোট নিট প্রদেয়:</span>
                  <span className="font-mono text-indigo-700">৳{confirmedBookingData.pricing.netTotal}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-0.5">
                  <span className="text-slate-600">পরিশোধিত মাধ্যম ({confirmedBookingData.payment.channel}):</span>
                  <span className="font-mono font-bold text-emerald-600">৳{confirmedBookingData.pricing.paidAmount}</span>
                </div>
                {confirmedBookingData.pricing.dueAmount > 0 ? (
                  <div className="flex justify-between font-bold text-rose-600 text-[10px]">
                    <span>বকেয়া (বাসে উঠার পূর্বে প্রদেয়):</span>
                    <span className="font-mono">৳{confirmedBookingData.pricing.dueAmount}</span>
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> সম্পূর্ণ ভাড়া পরিশোধিত (Verified)
                  </div>
                )}
              </div>

              <div className="col-span-4 flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <QRCodeView
                  value={`https://atoms.app/track?pnr=${confirmedBookingData.pnr}`}
                  size={70}
                  className="bg-white p-1 rounded-lg border border-slate-200"
                />
                <div className="font-mono font-black text-xs text-indigo-700 mt-1">
                  {confirmedBookingData.pnr}
                </div>
                <div className="text-[8px] text-slate-400">সুপারভাইজার ভেরিফিকেশন QR</div>
              </div>
            </div>

            {/* Official Signatures & Seal */}
            <div className="grid grid-cols-2 gap-6 pt-5 border-t border-slate-200 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 w-36 mx-auto pt-1 font-bold text-slate-700 text-[11px]">
                  কোচিং সমন্বয়কারী স্বাক্ষর
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">{confirmedBookingData.coordinatorName}</div>
              </div>
              <div>
                <div className="border-t border-slate-400 w-36 mx-auto pt-1 font-bold text-slate-700 text-[11px]">
                  অনুমোদিত পরিবহন কর্মকর্তা
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">সেন্ট্রাল এডমিশন বাস ম্যানেজমেন্ট</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* WORKSPACE CONSOLE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLS: University Selector, Bus Selector, Seat Map, Passenger Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. DYNAMIC UNIVERSITY & BUS SELECTOR */}
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      ১. বিশ্ববিদ্যালয় ফিল্টার (যেসব বিশ্ববিদ্যালয়ে বাস বুকিং চলছে)
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      শুধুমাত্র যে বিশ্ববিদ্যালয়ের বাস বুকিং সক্রিয় আছে সেগুলো প্রদর্শিত হচ্ছে
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCharteredBus(false)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        !isCharteredBus ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600' : 'text-slate-500'
                      }`}
                    >
                      বিশ্ববিদ্যালয় বাস
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCharteredBus(true)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        isCharteredBus ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600' : 'text-slate-500'
                      }`}
                    >
                      চার্টার্ড কোচ
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {!isCharteredBus ? (
                  <>
                    {/* DYNAMIC University Filter Buttons (ONLY UNIVERSITIES WITH ACTIVE BUSES) */}
                    <div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-indigo-600" />
                        টার্গেট বিশ্ববিদ্যালয় ফিল্টার করুন ({activeUniversityFilters.length} টি বিশ্ববিদ্যালয়ে বুকিং চলছে):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeUniversityFilters.map((u) => {
                          const isSelected = selectedUniversity === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => setSelectedUniversity(u.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-102'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                              }`}
                            >
                              <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />
                              <span>{u.name}</span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                              }`}>
                                {u.count} বাস
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filtered Buses Grid */}
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-slate-500">
                        {activeUniversityFilters.find((u) => u.id === selectedUniversity)?.name || 'বিশ্ববিদ্যালয়'} এর সক্রিয় বাসসমূহ ({filteredBuses.length} টি):
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredBuses.map((trip) => {
                          const isSelected = selectedTripId === trip.id;
                          return (
                            <div
                              key={trip.id}
                              onClick={() => setSelectedTripId(trip.id)}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Badge className="bg-indigo-600 text-white font-mono text-[10px]">
                                      {trip.busNumber}
                                    </Badge>
                                    {trip.isAc ? (
                                      <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-[10px] font-bold">
                                        AC
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-slate-400 text-[10px]">
                                        Non-AC
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-sm">
                                    {formatCurrency(trip.basePrice)}
                                  </span>
                                </div>

                                <div className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                                  {trip.busName}
                                </div>

                                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                                  {trip.route.origin} ➔ {trip.route.destination}
                                </div>

                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span className="truncate">{trip.targetUniversity} ({trip.examUnit})</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 font-mono">
                                <span>{trip.departureDate}</span>
                                <span>{trip.departureTime}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Chartered Coach Setup */
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-xs font-bold mb-1">কোচ / বাসের নাম</label>
                      <input
                        type="text"
                        value={charteredBusName}
                        onChange={(e) => setCharteredBusName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">অপারেটর</label>
                      <input
                        type="text"
                        value={charteredOperator}
                        onChange={(e) => setCharteredOperator(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">রুট বিবরণ</label>
                      <input
                        type="text"
                        value={charteredRoute}
                        onChange={(e) => setCharteredRoute(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-semibold"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. COACHING & COORDINATOR DETAILS */}
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  ২. কোচিং সেন্টার ও সমন্বয়কারী তথ্য
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5">জনপ্রিয় কোচিং বা প্রতিষ্ঠান প্রিসেট:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COACHINGS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGroupName(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          groupName === preset
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1">কোচিং / প্রতিষ্ঠানের নাম</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">শাখা / ক্যাম্পাস</label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">সমন্বয়কারী / লিডারের নাম</label>
                    <input
                      type="text"
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">সমন্বয়কারীর মোবাইল (WhatsApp)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={organizerPhone}
                        onChange={(e) => setOrganizerPhone(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                      />
                      <WhatsAppLogo className="w-4 h-4 absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block font-bold mb-1">বোর্ডিং পয়েন্ট (পিকআপ)</label>
                    <select
                      value={boardingPoint}
                      onChange={(e) => setBoardingPoint(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                    >
                      {BOARDING_POINTS.map((bp) => (
                        <option key={bp} value={bp}>{bp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">ড্রপিং পয়েন্ট (গন্তব্য ক্যাম্পাস ফটক)</label>
                    <select
                      value={droppingPoint}
                      onChange={(e) => setDroppingPoint(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                    >
                      {DROPPING_POINTS.map((dp) => (
                        <option key={dp} value={dp}>{dp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">রিপোর্টিং সময়</label>
                    <input
                      type="text"
                      value={reportingTime}
                      onChange={(e) => setReportingTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. ULTRA-PREMIUM 3D RECLINER BUS SEAT MAP */}
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Armchair className="w-5 h-5 text-indigo-600" />
                    ৩. লাক্সারি রিক্লাইনার বাস সিট লেআউট (Luxury 2+2 Bus Cabin)
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    আসন নির্বাচন করতে সিটে ক্লিক করুন • ৩ডি আর্মরেস্ট ও হেডরেস্ট পিলো সংবলিত এক্সিকিউটিভ কেবিন
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAutoAlignGender}
                    className="text-xs h-8 rounded-xl font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    অটো জেন্ডার ক্লাস্টার
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectFirstNSeats(10)}
                    className="text-xs h-8 rounded-xl font-bold"
                  >
                    ১০ সিট
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectFirstNSeats(40)}
                    className="text-xs h-8 rounded-xl font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    ৪০ সিট
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAllSeats}
                    className="text-xs h-8 rounded-xl font-bold text-rose-600 border-rose-200"
                  >
                    রিসেট
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Gender Violation Alert Banner */}
                {genderRuleViolations.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 flex items-start gap-3 shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-black text-rose-700 dark:text-rose-300">
                        ⚠️ জেন্ডার নীতি সতর্কতা: অপরিচিত ছাত্র ও ছাত্রীর পাশাপাশি সিট বরাদ্দ নিষিদ্ধ!
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                        {genderRuleViolations[0].reason}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        (নোট: রক্তের প্রথম ডিগ্রির অভিভাবক যেমন বাবা, মা, ভাই বা বোন হলে পাশে বসা অনুমোদিত)।
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoAlignGender}
                        className="text-xs font-bold text-indigo-600 underline mt-1"
                      >
                        স্বয়ংক্রিয়ভাবে জেন্ডার অনুযায়ী সিট ভাগ করে সমাধান করুন ➔
                      </button>
                    </div>
                  </div>
                )}

                {/* REALISTIC 2+2 BUS CHASSIS FRAME */}
                <div className="max-w-2xl mx-auto bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4 sm:p-7 rounded-3xl border-2 sm:border-4 border-slate-300 dark:border-slate-800 shadow-2xl overflow-x-auto ring-1 ring-white/20">
                  {/* Front Aerodynamic Windshield */}
                  <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-dashed border-slate-300 dark:border-slate-700">
                    <div className="h-9 sm:h-11 rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-b from-blue-900/60 via-indigo-950/40 to-transparent border-t-2 sm:border-t-3 border-x-2 sm:border-x-3 border-blue-400/50 mb-3 flex items-center justify-between px-4 sm:px-6 shadow-inner">
                      <div className="w-8 sm:w-12 h-1 bg-slate-400 rounded-full transform -rotate-12 opacity-40" />
                      <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[10px] font-mono text-cyan-300 font-bold tracking-widest uppercase">
                        <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                        <span>LUXURY EXPRESS COACH • FRONT</span>
                      </div>
                      <div className="w-8 sm:w-12 h-1 bg-slate-400 rounded-full transform rotate-12 opacity-40" />
                    </div>

                    {/* Entrance Gate vs Driver Area */}
                    <div className="flex items-center justify-between px-2 sm:px-4">
                      {/* Left: Passenger Entry Door */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-black shadow-xs backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <Footprints className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>🚪 প্রবেশদ্বার</span>
                      </div>

                      {/* Direction Vector */}
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                        <span>সামনে ➔ পেছনে</span>
                      </div>

                      {/* Right: Driver Cockpit */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-750 border border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-xs font-black shadow-xs">
                        <span className="text-base animate-spin-slow">🛞</span>
                        <span>ড্রাইভার</span>
                      </div>
                    </div>
                  </div>

                  {/* Column Indicators */}
                  <div className="grid grid-cols-5 text-center text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 px-3">
                    <div>🪟 জানালা (১)</div>
                    <div>🚶 আইল (২)</div>
                    <div className="text-slate-300 dark:text-slate-600 font-mono text-[10px]">ওয়াকওয়ে</div>
                    <div>🚶 আইল (৩)</div>
                    <div>🪟 জানালা (৪)</div>
                  </div>

                  {/* Seat Grid Rows */}
                  <div className="flex flex-col gap-3 sm:gap-4 items-center w-full py-1">
                    {BUS_SEAT_ROWS.map((rowItem) => {
                      return (
                        <div key={rowItem.row} className="flex items-center gap-2 sm:gap-4 justify-center w-full">
                          {/* Row Letter Tag */}
                          <div className="w-5 sm:w-6 text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-slate-400 dark:text-slate-500 font-mono">
                              {rowItem.row}
                            </span>
                          </div>

                          {/* Left 2 Recliners */}
                          <div className="flex gap-2 sm:gap-3.5">
                            {rowItem.left.map((seatCode) => {
                              const student = studentBySeatMap.get(seatCode);
                              const isSelected = !!student;
                              const isConflicted = conflictingSeatSet.has(seatCode);

                              return (
                                <LuxuryReclinerSeat
                                  key={seatCode}
                                  seatCode={seatCode}
                                  isSelected={isSelected}
                                  student={student}
                                  isConflicted={isConflicted}
                                  onClick={() => handleToggleSeat(seatCode)}
                                />
                              );
                            })}
                          </div>

                          {/* Ambient Center Aisle Runner */}
                          <div className="w-8 sm:w-12 h-12 sm:h-14 flex items-center justify-center shrink-0">
                            <div className="h-full w-0.5 sm:w-1 border-r border-dashed border-slate-300 dark:border-slate-700/80" />
                          </div>

                          {/* Right 2 Recliners (or 3 in back row) */}
                          <div className="flex gap-2 sm:gap-3.5">
                            {rowItem.right.map((seatCode) => {
                              const student = studentBySeatMap.get(seatCode);
                              const isSelected = !!student;
                              const isConflicted = conflictingSeatSet.has(seatCode);

                              return (
                                <LuxuryReclinerSeat
                                  key={seatCode}
                                  seatCode={seatCode}
                                  isSelected={isSelected}
                                  student={student}
                                  isConflicted={isConflicted}
                                  onClick={() => handleToggleSeat(seatCode)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend Strip with All Roles */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-5 mt-5 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-blue-600 shadow-2xs" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">👨 ছাত্র</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-pink-600 shadow-2xs" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">👩 ছাত্রী</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-amber-600 shadow-2xs" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">🧔 বাবা</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-purple-600 shadow-2xs" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">🧕 মা</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-cyan-600 shadow-2xs" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">👦 ভাই</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-rose-600 shadow-2xs" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">👧 বোন</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300" />
                      <span className="text-slate-500">খালি আসন</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. PASSENGER ROSTER: NAMES, PHONES & ROLE (FATHER/MOTHER/BROTHER/SISTER) */}
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    ৪. যাত্রী ও অভিভাবক বিবরণ ({students.length} জন)
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    যাত্রীর ভূমিকা নির্ধারণ করুন: ছাত্র, ছাত্রী, বাবা, মা, ভাই অথবা বোন
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsBulkModalOpen(true)}
                    className="text-xs h-8 rounded-xl font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                    স্মার্ট বাল্ক পেস্ট
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleAddStudentRow}
                    className="text-xs h-8 rounded-xl font-bold bg-indigo-600 text-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    + ১ জন যোগ করুন
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {students.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    উপরের বাস সিট ম্যাপ থেকে সিট নির্বাচন করুন অথবা উপরে &quot;+ ১ জন যোগ করুন&quot; বাটনে চাপুন।
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px] uppercase sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5 w-16 text-center">সিট</th>
                          <th className="px-3 py-2.5 min-w-[170px]">যাত্রীর নাম</th>
                          <th className="px-3 py-2.5 min-w-[140px]">মোবাইল নম্বর</th>
                          <th className="px-3 py-2.5 min-w-[110px]">ভর্তি রোল / আইডি</th>
                          <th className="px-3 py-2.5 min-w-[140px]">ভূমিকা ও জেন্ডার</th>
                          <th className="px-3 py-2.5 text-right w-12">মুছুন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {students.map((st, idx) => {
                          const roleMeta = resolveRoleInfo(st.role);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2.5 py-1 font-mono font-black text-xs rounded-lg border ${roleMeta.badgeClass}`}>
                                  {st.seat}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={st.name}
                                  onChange={(e) => handleUpdateStudent(idx, 'name', e.target.value)}
                                  placeholder="যাত্রীর পুরো নাম..."
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={st.phone}
                                    onChange={(e) => handleUpdateStudent(idx, 'phone', e.target.value)}
                                    placeholder="0171xxxxxxx"
                                    className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs font-mono font-semibold"
                                  />
                                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={st.roll}
                                  onChange={(e) => handleUpdateStudent(idx, 'roll', e.target.value)}
                                  placeholder="GST-101 / N/A"
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs font-mono"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={st.role}
                                  onChange={(e) => handleUpdateStudent(idx, 'role', e.target.value as PassengerRole)}
                                  className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                                >
                                  <option value="MALE">👨 ছাত্র (Male Student)</option>
                                  <option value="FEMALE">👩 ছাত্রী (Female Student)</option>
                                  <option value="FATHER">🧔 বাবা (Father - অভিভাবক)</option>
                                  <option value="MOTHER">🧕 মা (Mother - অভিভাবক)</option>
                                  <option value="BROTHER">👦 ভাই (Brother - অভিভাবক)</option>
                                  <option value="SISTER">👧 বোন (Sister - অভিভাবক)</option>
                                </select>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudentRow(idx)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT 4 COLS: STICKY BILLING & PAYMENT CONSOLE */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-black flex items-center justify-between">
                  <span>ভাড়া হিসাব ও পেমেন্ট কনসোল</span>
                  <Badge className="bg-indigo-600 text-white font-mono text-[10px]">
                    {students.length} SEATS
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                {/* Selected Bus & University */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {activeTrip.targetUniversity}
                  </div>
                  <div className="font-black text-slate-900 dark:text-white">
                    {isCharteredBus ? charteredBusName : activeTrip.busName}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {isCharteredBus ? charteredRoute : `${activeTrip.route.origin} ➔ ${activeTrip.route.destination}`}
                  </div>
                </div>

                {/* Fare & Discount Settings */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">প্রতি সিট ভাড়া (৳)</label>
                    <input
                      type="number"
                      value={seatPrice}
                      onChange={(e) => setSeatPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">গ্রুপ ছাড় (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold text-xs text-emerald-600"
                    />
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">মোট যাত্রী / আসন:</span>
                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">{totalSeats} টি</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">সাবটোটাল:</span>
                    <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>গ্রুপ ছাড় ({discountPercent}%):</span>
                    <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/60 flex justify-between font-black text-sm">
                    <span>সর্বমোট নিট প্রদেয়:</span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-300">{formatCurrency(netTotal)}</span>
                  </div>
                </div>

                {/* 5. PAYMENT CHANNEL SELECTION */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    কি মাধ্যমে পেমেন্ট করবো:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('BKASH')}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        paymentChannel === 'BKASH'
                          ? 'border-[#DF146E] bg-pink-50/50 dark:bg-pink-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <BkashLogo className="w-6 h-6" />
                      <span className="text-[10px] font-bold">বিকাশ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChannel('NAGAD')}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        paymentChannel === 'NAGAD'
                          ? 'border-[#F7941D] bg-orange-50/50 dark:bg-orange-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <NagadLogo className="w-6 h-6" />
                      <span className="text-[10px] font-bold">নগদ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChannel('HAND_CASH')}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        paymentChannel === 'HAND_CASH'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <CashMoneyLogo className="w-6 h-6" />
                      <span className="text-[10px] font-bold">নগদ ক্যাশ</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('ROCKET')}
                      className={`p-2 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${
                        paymentChannel === 'ROCKET'
                          ? 'border-[#8C3494] bg-purple-50/50 dark:bg-purple-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <RocketLogo className="w-5 h-5" />
                      <span className="text-[10px] font-bold">রকেট</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChannel('BANK_TRANSFER')}
                      className={`p-2 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${
                        paymentChannel === 'BANK_TRANSFER'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <BankTransferLogo className="w-5 h-5" />
                      <span className="text-[10px] font-bold">ব্যাংক / চেক</span>
                    </button>
                  </div>
                </div>

                {/* TrxID / Reference Input */}
                {paymentChannel !== 'HAND_CASH' && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ট্রানজেকশন আইডি (TrxID)</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="TrxID..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Payment Mode (Full vs Partial) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">পেমেন্ট স্ট্যাটাস:</span>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border rounded-lg font-bold text-[11px]"
                    >
                      <option value="FULL">সম্পূর্ণ পরিশোধিত (Full)</option>
                      <option value="PARTIAL">অগ্রিম জমা ও বকেয়া</option>
                      <option value="BOARDING_PAY">কাউন্টার / বাসে প্রদেয়</option>
                    </select>
                  </div>

                  {paymentMode === 'PARTIAL' && (
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">অগ্রিম জমা (৳):</span>
                        <input
                          type="number"
                          value={customAdvanceAmount || Math.round(netTotal * 0.5)}
                          onChange={(e) => setCustomAdvanceAmount(Number(e.target.value))}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono font-bold text-right"
                        />
                      </div>
                      <div className="flex justify-between font-bold text-rose-600">
                        <span>অবশিষ্ট বকেয়া:</span>
                        <span className="font-mono">{formatCurrency(dueAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Action Button */}
                <Button
                  variant="primary"
                  onClick={handleConfirmGroupBooking}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl py-3.5 shadow-lg shadow-indigo-600/30 text-xs mt-2"
                >
                  <Award className="w-4 h-4 mr-1.5" />
                  কনফার্ম ও A4 স্পেশাল টিকিট তৈরি করুন
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="স্মার্ট বাল্ক প্যাসেঞ্জার পেস্ট (Bulk Passenger Import)"
        description="এক্সেল (Excel), গুগল শিট অথবা হোয়াটসঅ্যাপ থেকে নাম, মোবাইল, রোল ও ভূমিকা (যেমন: ছাত্র, ছাত্রী, বাবা, মা, ভাই, বোন) কপি করে নিচে পেস্ট করুন।"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/40 text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>ফরম্যাট নির্দেশিকা:</strong> প্রতি লাইনে একজন যাত্রী লিখুন (কমা বা ট্যাব দিয়ে আলাদা করুন):
            <div className="font-mono text-[11px] mt-1 text-indigo-700 dark:text-indigo-300 space-y-0.5">
              <div>১. আরিফুল ইসলাম, 01711000001, GST-101, ছাত্র, A1</div>
              <div>২. মোহাম্মদ রফিক, 01711000002, N/A, বাবা, A2</div>
              <div>৩. তানজিলা আক্তার, 01811000003, GST-102, ছাত্রী, A3</div>
              <div>৪. সালমা বেগম, 01811000004, N/A, মা, A4</div>
            </div>
          </div>

          <textarea
            rows={10}
            value={bulkRawText}
            onChange={(e) => setBulkRawText(e.target.value)}
            placeholder="এখানে পেস্ট করুন..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)} className="rounded-xl text-xs font-bold">
              বাতিল
            </Button>
            <Button
              variant="primary"
              onClick={handleProcessBulkImport}
              className="bg-indigo-600 text-white rounded-xl text-xs font-black px-6"
            >
              তালিকায় রূপান্তর করুন
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
