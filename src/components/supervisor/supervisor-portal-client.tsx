'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Bus,
  Wallet,
  CheckCircle2,
  Receipt,
  Sparkles,
  PhoneCall,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { SupervisorTripHeader, AssignedBusInfo } from './supervisor-trip-header';
import { PassengerManifestRoster } from './passenger-manifest-roster';
import { PassengerRecord } from './passenger-attendance-card';
import { BusDetailsView } from './bus-details-view';
import { TripExpenseManager, TripExpenseItem } from './trip-expense-manager';
import { SupervisorAIAssistant } from '@/components/ai/supervisor-ai-assistant';
import { useToast } from '@/components/ui/toast';

// Initial realistic assigned bus info
const INITIAL_BUS_INFO: AssignedBusInfo = {
  id: 'trip-ru-01',
  tripCode: 'RU-EXPRESS-101',
  busName: 'Dhaka Express 01',
  busNumber: 'DHAKA-METRO-BA-11-2024',
  coachType: 'MIXED',
  origin: 'ঢাকা গাবতলী টার্মিনাল',
  destination: 'রাজশাহী বিশ্ববিদ্যালয়',
  departureDate: '2026-08-29',
  departureTime: '22:30',
  estimatedArrival: '2026-08-30T05:30:00',
  totalSeats: 40,
  driverName: 'মোঃ আনোয়ার হোসেন',
  driverPhone: '01712-345678',
  supervisorName: 'মোঃ শফিকুল ইসলাম',
  supervisorPhone: '01819-987654',
  issuedCash: 15000,
};

// Initial realistic boarding stops timeline
const INITIAL_BOARDING_STOPS = [
  {
    stopName: 'গাবতলী বাস টার্মিনাল কাউন্টার',
    landmark: 'কাউন্টার নং ১২, মেইন গেটের বিপরীতে',
    expectedTime: 'রাত ১০:১৫',
    passengerCount: 22,
  },
  {
    stopName: 'সাভার বাসস্ট্যান্ড (পাকুড়া ওভারব্রিজ)',
    landmark: 'সিটি সেন্টার ফুটওভার ব্রিজের নিচে',
    expectedTime: 'রাত ১০:৪৫',
    passengerCount: 9,
  },
  {
    stopName: 'নবীনগর স্মৃতিসৌধ মোড়',
    landmark: 'স্মৃতিসৌধ গোলচত্বর পুলিশ বক্স',
    expectedTime: 'রাত ১১:০০',
    passengerCount: 4,
  },
  {
    stopName: 'চন্দ্রা মোড় (বাইপাস বাস বে)',
    landmark: 'হাইওয়ে পুলিশ ফাঁড়ির সামনে',
    expectedTime: 'রাত ১১:২৫',
    passengerCount: 3,
  },
];

// Initial realistic admission student passengers dataset
const INITIAL_PASSENGERS: PassengerRecord[] = [
  {
    id: 'p-1',
    bookingRef: 'BK-20260829-101',
    name: 'তানজিলা রহমান',
    phone: '01711223344',
    seatNumbers: ['A1', 'A2'],
    gender: 'FEMALE',
    userType: 'STUDENT',
    unitOrExam: 'RU Unit-A (মানবিক)',
    boardingPoint: 'গাবতলী বাস টার্মিনাল কাউন্টার',
    boardingTime: 'রাত ১০:১৫',
    droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয় প্রধান ফটক',
    totalAmount: 1800,
    paidAmount: 1800,
    dueAmount: 0,
    attendanceStatus: 'BOARDED',
    hasAccommodation: true,
  },
  {
    id: 'p-2',
    bookingRef: 'BK-20260829-102',
    name: 'আব্দুল্লাহ আল নোমান',
    phone: '01819887766',
    seatNumbers: ['A3', 'A4'],
    gender: 'MALE',
    userType: 'STUDENT',
    unitOrExam: 'RU Unit-C (বিজ্ঞান)',
    boardingPoint: 'গাবতলী বাস টার্মিনাল কাউন্টার',
    boardingTime: 'রাত ১০:১৫',
    droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয় কাজলা গেট',
    totalAmount: 1800,
    paidAmount: 1300,
    dueAmount: 500,
    attendanceStatus: 'BOARDED',
    hasAccommodation: true,
  },
  {
    id: 'p-3',
    bookingRef: 'BK-20260829-103',
    name: 'নুসরাত জাহান মিম',
    phone: '01912345678',
    seatNumbers: ['B1', 'B2'],
    gender: 'FEMALE',
    userType: 'STUDENT',
    unitOrExam: 'RU Unit-B (বাণিজ্য)',
    boardingPoint: 'সাভার বাসস্ট্যান্ড (পাকুড়া ওভারব্রিজ)',
    boardingTime: 'রাত ১০:৪৫',
    droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয় প্রধান ফটক',
    totalAmount: 1800,
    paidAmount: 1800,
    dueAmount: 0,
    attendanceStatus: 'WAITING',
  },
  {
    id: 'p-4',
    bookingRef: 'BK-20260829-104',
    name: 'মাহমুদুল হাসান ফুয়াদ',
    phone: '01511223344',
    seatNumbers: ['B3', 'B4'],
    gender: 'MALE',
    userType: 'STUDENT',
    unitOrExam: 'RU Unit-C (বিজ্ঞান)',
    boardingPoint: 'সাভার বাসস্ট্যান্ড (পাকুড়া ওভারব্রিজ)',
    boardingTime: 'রাত ১০:৪৫',
    droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয় কাজলা গেট',
    totalAmount: 1800,
    paidAmount: 1000,
    dueAmount: 800,
    attendanceStatus: 'WAITING',
  },
  {
    id: 'p-5',
    bookingRef: 'BK-20260829-105',
    name: 'সাদিয়া আফরিন স্নিগ্ধা',
    phone: '01611002233',
    seatNumbers: ['C1'],
    gender: 'FEMALE',
    userType: 'STUDENT',
    unitOrExam: 'RU Unit-A (মানবিক)',
    boardingPoint: 'গাবতলী বাস টার্মিনাল কাউন্টার',
    boardingTime: 'রাত ১০:১৫',
    droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয় প্রধান ফটক',
    totalAmount: 900,
    paidAmount: 900,
    dueAmount: 0,
    attendanceStatus: 'BOARDED',
  },
  {
    id: 'p-6',
    bookingRef: 'BK-20260829-106',
    name: 'মোঃ জাহিদ হাসান',
    phone: '01715667788',
    seatNumbers: ['C2', 'C3'],
    gender: 'MALE',
    userType: 'STUDENT',
    unitOrExam: 'RU Unit-A (আইন অনুষদ)',
    boardingPoint: 'চন্দ্রা মোড় (বাইপাস বাস বে)',
    boardingTime: 'রাত ১১:২৫',
    droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয় বিনোদপুর গেট',
    totalAmount: 1800,
    paidAmount: 1800,
    dueAmount: 0,
    attendanceStatus: 'WAITING',
  },
  {
    id: 'p-7',
    bookingRef: 'BK-20260829-107',
    name: 'ফারহানা ইয়াসমিন',
    phone: '01811445566',
    seatNumbers: ['D1', 'D2'],
    gender: 'FEMALE',
    userType: 'STUDENT',
    unitOrExam: 'RU Unit-C (বিজ্ঞান)',
    boardingPoint: 'নবীনগর স্মৃতিসৌধ মোড়',
    boardingTime: 'রাত ১১:০০',
    droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয় প্রধান ফটক',
    totalAmount: 1800,
    paidAmount: 1800,
    dueAmount: 0,
    attendanceStatus: 'WAITING',
  },
  {
    id: 'p-8',
    bookingRef: 'BK-20260829-108',
    name: 'রাকিবুল ইসলাম রনি',
    phone: '01918776655',
    seatNumbers: ['D3', 'D4'],
    gender: 'MALE',
    userType: 'STUDENT',
    unitOrExam: 'RU Unit-B (বাণিজ্য)',
    boardingPoint: 'গাবতলী বাস টার্মিনাল কাউন্টার',
    boardingTime: 'রাত ১০:১৫',
    droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয় প্রধান ফটক',
    totalAmount: 1800,
    paidAmount: 1800,
    dueAmount: 0,
    attendanceStatus: 'ABSENT',
  },
];

const INITIAL_EXPENSES: TripExpenseItem[] = [
  {
    id: '1',
    category: 'FUEL',
    amount: 5000,
    desc: 'গাবতলী সিএনজি/ডিজেল পাম্প ফুয়েল',
    time: new Date().toISOString(),
  },
  {
    id: '2',
    category: 'FOOD',
    amount: 450,
    desc: 'ড্রাইভার ও সুপারভাইজার নাস্তা/ডিনার',
    time: new Date().toISOString(),
  },
];

export function SupervisorPortalClient() {
  const router = useRouter();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<'attendance' | 'bus' | 'expenses' | 'ai'>('attendance');
  const [busInfo, setBusInfo] = useState<AssignedBusInfo>(INITIAL_BUS_INFO);
  const [passengers, setPassengers] = useState<PassengerRecord[]>(INITIAL_PASSENGERS);
  const [expenses, setExpenses] = useState<TripExpenseItem[]>(INITIAL_EXPENSES);
  const [collectedDuesTotal, setCollectedDuesTotal] = useState(500);

  // Authentication & persistence setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('supervisor_auth');
      if (!auth) {
        router.push('/supervisor/login');
        return;
      }

      // Check if auth contains JSON profile
      try {
        if (auth.startsWith('{')) {
          const profile = JSON.parse(auth);
          setBusInfo((prev) => ({
            ...prev,
            supervisorName: profile.name || prev.supervisorName,
            supervisorPhone: profile.phone || prev.supervisorPhone,
            busName: profile.busName || prev.busName,
            route: profile.route || prev.origin + ' ➔ ' + prev.destination,
          }));
        }
      } catch {
        // use default profile
      }

      // Load cached attendance state if available
      try {
        const savedAttendance = localStorage.getItem(`atoms_supervisor_passengers_${busInfo.id}`);
        if (savedAttendance) {
          setPassengers(JSON.parse(savedAttendance));
        }

        const savedExpenses = localStorage.getItem(`atoms_supervisor_expenses_${busInfo.id}`);
        if (savedExpenses) {
          setExpenses(JSON.parse(savedExpenses));
        }
      } catch {
        // use default state
      }
    }
  }, [router, busInfo.id]);

  // Persist state changes
  const handleStatusChange = (id: string, newStatus: 'BOARDED' | 'WAITING' | 'ABSENT') => {
    const updated = passengers.map((p) =>
      p.id === id ? { ...p, attendanceStatus: newStatus } : p
    );
    setPassengers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`atoms_supervisor_passengers_${busInfo.id}`, JSON.stringify(updated));
    }
    const passenger = passengers.find((p) => p.id === id);
    const statusLabel =
      newStatus === 'BOARDED'
        ? 'উপস্থিত (Boarded)'
        : newStatus === 'WAITING'
        ? 'অপেক্ষমাণ (Waiting)'
        : 'অনুপস্থিত (Absent)';
    info(`হাজিরা আপডেট`, `${passenger?.name || 'যাত্রী'}-কে "${statusLabel}" মার্ক করা হয়েছে।`);
  };

  // Collect cash due on the bus
  const handleCollectDue = (id: string, amount: number) => {
    const updated = passengers.map((p) =>
      p.id === id ? { ...p, paidAmount: p.totalAmount, dueAmount: 0 } : p
    );
    setPassengers(updated);
    setCollectedDuesTotal((prev) => prev + amount);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`atoms_supervisor_passengers_${busInfo.id}`, JSON.stringify(updated));
    }
    success('ক্যাশ আদায় সফল', `যাত্রী থেকে ৳${amount} ক্যাশ আদায় করা হয়েছে এবং আপনার ব্যালেন্সে যোগ হয়েছে।`);
  };

  // Add expense
  const handleAddExpense = (item: Omit<TripExpenseItem, 'id' | 'time'>) => {
    const newExpense: TripExpenseItem = {
      ...item,
      id: Date.now().toString(),
      time: new Date().toISOString(),
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`atoms_supervisor_expenses_${busInfo.id}`, JSON.stringify(updated));
    }
  };

  // Delete expense
  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`atoms_supervisor_expenses_${busInfo.id}`, JSON.stringify(updated));
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supervisor_auth');
    }
    router.push('/supervisor/login');
  };

  // Aggregated metrics
  const totalBoarded = passengers.filter((p) => p.attendanceStatus === 'BOARDED').length;
  const totalPassengers = passengers.length;
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingCash = busInfo.issuedCash + collectedDuesTotal - totalExpenseAmount;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-20 select-none">
      {/* 1. Header Component with assigned bus specs & live attendance summary */}
      <SupervisorTripHeader
        busInfo={busInfo}
        totalBoarded={totalBoarded}
        totalPassengers={totalPassengers}
        remainingCash={remainingCash}
        onLogout={handleLogout}
      />

      {/* 2. Sticky Tab Navigation Bar */}
      <div className="sticky top-[168px] sm:top-[160px] z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>যাত্রী তালিকা ও হাজিরা ({passengers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bus')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'bus'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>বাস ও স্টপ ডিটেইলস</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>খরচ ও ক্যাশ ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>এআই কন্ডাক্টর</span>
          </button>
        </div>
      </div>

      {/* 3. Main Viewport Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PassengerManifestRoster
              passengers={passengers}
              busName={busInfo.busName}
              busNumber={busInfo.busNumber}
              onStatusChange={handleStatusChange}
              onCollectDue={handleCollectDue}
            />
          </motion.div>
        )}

        {activeTab === 'bus' && (
          <motion.div
            key="bus"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <BusDetailsView busInfo={busInfo} stops={INITIAL_BOARDING_STOPS} />
          </motion.div>
        )}

        {activeTab === 'expenses' && (
          <motion.div
            key="expenses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TripExpenseManager
              issuedCash={busInfo.issuedCash}
              collectedDues={collectedDuesTotal}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[600px] bg-white dark:bg-slate-900"
          >
            <SupervisorAIAssistant />
          </motion.div>
        )}
      </main>
    </div>
  );
}
