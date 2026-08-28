'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bus,
  Search,
  RotateCcw,
  Sparkles,
  Flame,
  CreditCard,
  X,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import {
  getOnlinePreBookingsAction,
  verifyAndStartTimerAction,
  confirmPreBookingPaymentAction,
  rejectPreBookingAction
} from '@/actions/booking.actions';
import { BkashLogo, NagadLogo, RocketLogo, CashMoneyLogo, DynamicPaymentLogo } from './payment-brand-icons';
import { PrintTicketButton } from './print-ticket-button';
import { PaymentReceiptModal } from './payment-receipt';
import { useApp } from '@/lib/context';

interface Props {
  initialBookings: any[];
  currentUser: any;
}

export function OnlineRequestsClient({ initialBookings, currentUser }: Props) {
  const router = useRouter();
  const { customLogos } = useApp();
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'TIMER_ACTIVE' | 'CONFIRMED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Verification Modal State
  const [selectedBookingForVerify, setSelectedBookingForVerify] = useState<any | null>(null);
  const [verifyGender, setVerifyGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [verifyIsStudent, setVerifyIsStudent] = useState(true);
  const [verifyAdmissionId, setVerifyAdmissionId] = useState('');
  const [timerDuration, setTimerDuration] = useState(15);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Payment Confirmation Modal State
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER'>('BKASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Reject Modal State
  const [selectedBookingForReject, setSelectedBookingForReject] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('যাত্রী কল রিসিভ করেননি');
  const [confirmedBookingForReceipt, setConfirmedBookingForReceipt] = useState<any | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Auto refresh every 10 seconds
  const fetchBookings = async () => {
    setIsRefreshing(true);
    try {
      const res = await getOnlinePreBookingsAction();
      if (res.success && res.bookings) {
        setBookings(res.bookings);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'PENDING' && b.bookingStatus !== 'PRE_BOOKED') return false;
    if (activeTab === 'TIMER_ACTIVE' && b.bookingStatus !== 'PAYMENT_TIMER_ACTIVE') return false;
    if (activeTab === 'CONFIRMED' && b.bookingStatus !== 'CONFIRMED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = b.bookingNumber?.toLowerCase().includes(q);
      const matchName = b.contactName?.toLowerCase().includes(q);
      const matchPhone = b.contactPhone?.toLowerCase().includes(q);
      const matchAdmission = b.studentAdmissionId?.toLowerCase().includes(q);
      if (!matchNumber && !matchName && !matchPhone && !matchAdmission) return false;
    }

    return true;
  });

  // Open Verify Modal
  const handleOpenVerify = (booking: any) => {
    setSelectedBookingForVerify(booking);
    setVerifyGender(booking.passengerGender || 'MALE');
    setVerifyIsStudent(booking.isStudent ?? true);
    setVerifyAdmissionId(booking.studentAdmissionId || '');
    setTimerDuration(15);
    setVerifyNotes('');
  };

  // Submit Verification & Start Timer
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForVerify) return;

    setVerifyLoading(true);
    try {
      const res = await verifyAndStartTimerAction({
        bookingId: selectedBookingForVerify.id,
        durationMinutes: timerDuration,
        passengerGender: verifyGender,
        isStudent: verifyIsStudent,
        studentAdmissionId: verifyAdmissionId || undefined,
        notes: verifyNotes || undefined
      });

      if (res.success) {
        setSelectedBookingForVerify(null);
        await fetchBookings();
        router.refresh();
      } else {
        alert(res.error || 'ভেরিফিকেশন সম্পন্ন করতে ব্যর্থ হয়েছে।');
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (booking: any) => {
    setSelectedBookingForPayment(booking);
    setPaidAmount(booking.netAmount);
    setPaymentMethod('BKASH');
    setTransactionId('');
    setPaymentNotes('');
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;

    setPaymentLoading(true);
    try {
      const res = await confirmPreBookingPaymentAction({
        bookingId: selectedBookingForPayment.id,
        paymentMethod,
        paidAmount: Number(paidAmount),
        transactionId: transactionId || undefined,
        notes: paymentNotes || undefined
      });

      if (res.success) {
        const fullReceiptData = {
          ...selectedBookingForPayment,
          payments: [
            {
              id: 'pmt-online-success',
              receiptNumber: `RCT-${selectedBookingForPayment.bookingNumber ? selectedBookingForPayment.bookingNumber.replace('BK-', '') : 'ONLINE'}`,
              amount: Number(paidAmount),
              method: paymentMethod,
              createdAt: new Date(),
              transactions: [
                {
                  transactionId: transactionId || 'ONLINE-CONFIRMED',
                  verificationStatus: 'VERIFIED'
                }
              ]
            }
          ],
          paidAmount: Number(paidAmount),
          dueAmount: Math.max(0, (selectedBookingForPayment.netAmount || 0) - Number(paidAmount)),
          paymentStatus: Number(paidAmount) >= (selectedBookingForPayment.netAmount || 0) ? 'PAID' : 'PARTIAL'
        };
        setSelectedBookingForPayment(null);
        setConfirmedBookingForReceipt(fullReceiptData);
        await fetchBookings();
        router.refresh();
      } else {
        alert(res.error || 'পেমেন্ট রেকর্ড করতে সমস্যা হয়েছে।');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // Submit Reject
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReject) return;

    setRejectLoading(true);
    try {
      const res = await rejectPreBookingAction(selectedBookingForReject.id, rejectReason);
      if (res.success) {
        setSelectedBookingForReject(null);
        await fetchBookings();
        router.refresh();
      } else {
        alert(res.error || 'বাতিল করতে সমস্যা হয়েছে।');
      }
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              অনলাইন প্রি-বুকিং ও ভেরিফিকেশন কিউ
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            যাত্রীদের পাঠানো বুকিং রিকোয়েস্ট কল দিয়ে ভেরিফাই করুন এবং পেমেন্ট টাইমার শুরু করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookings}
            isLoading={isRefreshing}
            className="text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            রিফ্রেশ
          </Button>
          <Link href="/bookings/new">
            <Button variant="primary" size="sm" className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold">
              + কাউন্টার বুকিং
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Badges / Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'ALL'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block">সব রিকোয়েস্ট</span>
          <span className="text-xl font-black font-mono mt-0.5 block">{bookings.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PENDING')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'PENDING'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <PhoneCall className="w-3 h-3" /> কলের অপেক্ষায়
          </span>
          <span className="text-xl font-black font-mono mt-0.5 block text-amber-600 dark:text-amber-400">
            {bookings.filter(b => b.bookingStatus === 'PRE_BOOKED').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TIMER_ACTIVE')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'TIMER_ACTIVE'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1 text-purple-600 dark:text-purple-400">
            <Flame className="w-3 h-3 animate-pulse" /> টাইমার চলছে
          </span>
          <span className="text-xl font-black font-mono mt-0.5 block text-purple-600 dark:text-purple-400">
            {bookings.filter(b => b.bookingStatus === 'PAYMENT_TIMER_ACTIVE').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CONFIRMED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'CONFIRMED'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> কনফার্মড
          </span>
          <span className="text-xl font-black font-mono mt-0.5 block text-emerald-600 dark:text-emerald-400">
            {bookings.filter(b => b.bookingStatus === 'CONFIRMED').length}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="নাম, মোবাইল নম্বর, বা বুকিং কোড দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 text-xs"
          />
        </div>
      </div>

      {/* Bookings Queue Cards / Table */}
      {filteredBookings.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
          <PhoneCall className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            বর্তমানে কোনো অনলাইন প্রি-বুকিং নেই
          </h3>
          <p className="text-xs">নতুন কোনো যাত্রী ওয়েবসাইটে রিকোয়েস্ট পাঠালে এখানে তাৎক্ষণিক প্রদর্শিত হবে।</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map(booking => {
            const isTimerActive = booking.bookingStatus === 'PAYMENT_TIMER_ACTIVE';
            const isPending = booking.bookingStatus === 'PRE_BOOKED';
            const isConfirmed = booking.bookingStatus === 'CONFIRMED';

            return (
              <Card
                key={booking.id}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Booking Number & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block">
                        {booking.bookingNumber}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {booking.contactName || booking.passengers?.[0]?.passengerName}
                      </h3>
                    </div>

                    <Badge
                      variant={
                        isConfirmed
                          ? 'success'
                          : isTimerActive
                          ? 'warning'
                          : isPending
                          ? 'info'
                          : 'default'
                      }
                      className="text-[10px]"
                    >
                      {isConfirmed
                        ? 'কনফার্মড'
                        : isTimerActive
                        ? 'টাইমার চালু'
                        : isPending
                        ? 'কলের অপেক্ষায়'
                        : booking.bookingStatus}
                    </Badge>
                  </div>

                  {/* Passenger Phone & Quick Call Action */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">মোবাইল নম্বর:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {booking.contactPhone}
                      </span>
                    </div>

                    <a
                      href={`tel:${booking.contactPhone}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                      কল দিন
                    </a>
                  </div>

                  {/* Trip Details & Seats */}
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">বাস ও ট্রিপ:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{booking.trip?.bus?.busName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">রুট:</span>
                      <span>{booking.trip?.route?.origin} ➔ {booking.trip?.route?.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">সিট নম্বর:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {booking.seats?.map((s: any) => s.seat?.seatNumber || 'Seat').join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ক্যাটাগরি / লিঙ্গ:</span>
                      <span>
                        {booking.passengerGender === 'MALE' ? 'ছাত্র' : 'ছাত্রী'} ({booking.isStudent ? 'ভর্তি পরীক্ষার্থী' : 'সাধারণ'})
                      </span>
                    </div>
                    {booking.studentAdmissionId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">ভর্তি রোল:</span>
                        <span className="font-mono font-semibold">{booking.studentAdmissionId}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-bold">
                      <span className="text-slate-400">মোট ভাড়া:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(booking.netAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Timer Active countdown highlight */}
                  {isTimerActive && booking.paymentExpiresAt && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block flex items-center justify-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        পেমেন্ট টাইমার শেষ হবে: {formatTime(booking.paymentExpiresAt)}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {isPending && (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenVerify(booking)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          ভেরিফাই ও টাইমার
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedBookingForReject(booking);
                            setRejectReason('যাত্রী কল রিসিভ করেননি');
                          }}
                          className="text-xs px-2.5"
                        >
                          বাতিল
                        </Button>
                      </>
                    )}

                    {isTimerActive && (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenPayment(booking)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          পেমেন্ট কনফার্ম করুন
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedBookingForReject(booking);
                            setRejectReason('টাইমার বাতিল করা হলো');
                          }}
                          className="text-xs px-2.5"
                        >
                          বাতিল
                        </Button>
                      </>
                    )}

                    {isConfirmed && (
                      <div className="w-full">
                        <PrintTicketButton booking={booking} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Verification & Payment Timer Activation */}
      <Modal
        isOpen={!!selectedBookingForVerify}
        onClose={() => setSelectedBookingForVerify(null)}
        size="lg"
        title="যাত্রী ভেরিফিকেশন ও পেমেন্ট টাইমার শুরু"
      >
        {selectedBookingForVerify && (
          <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-1">
              <div className="flex justify-between font-bold">
                <span>বুকিং: {selectedBookingForVerify.bookingNumber}</span>
                <span className="font-mono text-emerald-600">{formatCurrency(selectedBookingForVerify.netAmount)}</span>
              </div>
              <p className="text-slate-500">
                যাত্রী: {selectedBookingForVerify.contactName} ({selectedBookingForVerify.contactPhone})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  লিঙ্গ যাচাই (Gender) *
                </label>
                <select
                  value={verifyGender}
                  onChange={e => setVerifyGender(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
                >
                  <option value="MALE">ছাত্র / পুরুষ (Male)</option>
                  <option value="FEMALE">ছাত্রী / মহিলা (Female)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  ক্যাটাগরি *
                </label>
                <select
                  value={verifyIsStudent ? 'STUDENT' : 'GUEST'}
                  onChange={e => setVerifyIsStudent(e.target.value === 'STUDENT')}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
                >
                  <option value="STUDENT">ভর্তি পরীক্ষার্থী (Student)</option>
                  <option value="GUEST">অভিভাবক / সাধারণ যাত্রী</option>
                </select>
              </div>
            </div>

            {verifyIsStudent && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  ভর্তি রোল / ইউনিট
                </label>
                <Input
                  type="text"
                  placeholder="যেমন: RU-Unit-A-12894"
                  value={verifyAdmissionId}
                  onChange={e => setVerifyAdmissionId(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}

            {/* Timer Duration Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                🔒 সিট লক ও পেমেন্ট টাইমার মেয়াদ (Duration) *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimerDuration(mins)}
                    className={`py-2 rounded-lg border font-bold text-xs transition-all ${
                      timerDuration === mins
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {mins} মিনিট
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                এই সময়ের মধ্যে অন্য কেউ এই সিট নিতে পারবে না। সময় শেষ হলে স্বয়ংক্রিয়ভাবে সিট উন্মুক্ত হয়ে যাবে।
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                ভেরিফিকেশন নোট (ঐচ্ছিক)
              </label>
              <Input
                type="text"
                placeholder="যেমন: ফোনে কথা বলে ছাত্রত্ব নিশ্চিত করা হয়েছে"
                value={verifyNotes}
                onChange={e => setVerifyNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedBookingForVerify(null)}
                className="text-xs"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={verifyLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                <Flame className="w-3.5 h-3.5 mr-1 text-amber-300" />
                ভেরিফাই ও টাইমার শুরু করুন ({timerDuration} মিনিট)
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 2: Payment Confirmation */}
      <Modal
        isOpen={!!selectedBookingForPayment}
        onClose={() => setSelectedBookingForPayment(null)}
        size="lg"
        title="পেমেন্ট রেকর্ড ও টিকিট কনফার্মেশন"
      >
        {selectedBookingForPayment && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-200">
                <span>বুকিং: {selectedBookingForPayment.bookingNumber}</span>
                <span className="font-mono text-sm">{formatCurrency(selectedBookingForPayment.netAmount)}</span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-400">
                যাত্রী: {selectedBookingForPayment.contactName} ({selectedBookingForPayment.contactPhone})
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                পেমেন্ট মেথড (Payment Channel) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BKASH')}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    paymentMethod === 'BKASH'
                      ? 'border-[#E2136E] bg-pink-50/60 dark:bg-pink-950/30 text-[#E2136E] font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <DynamicPaymentLogo method="BKASH" customUrl={customLogos?.['BKASH']} className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs">bKash (বিকাশ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('NAGAD')}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    paymentMethod === 'NAGAD'
                      ? 'border-[#F37023] bg-orange-50/60 dark:bg-orange-950/30 text-[#F37023] font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <DynamicPaymentLogo method="NAGAD" customUrl={customLogos?.['NAGAD']} className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs">Nagad (নগদ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('HAND_CASH')}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    paymentMethod === 'HAND_CASH'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <DynamicPaymentLogo method="HAND_CASH" customUrl={customLogos?.['HAND_CASH']} className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs">Hand Cash</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                  অন্যান্য মেথড (Other)
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-bold"
                >
                  <option value="BKASH">bKash (বিকাশ)</option>
                  <option value="NAGAD">Nagad (নগদ)</option>
                  <option value="ROCKET">Rocket (রকেট)</option>
                  <option value="HAND_CASH">Hand Cash (কাউন্টার ক্যাশ)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  পরিশোধের পরিমাণ (Amount BDT) *
                </label>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={e => setPaidAmount(Number(e.target.value))}
                  className="text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                ট্রানজেকশন আইডি (bKash/Nagad TrxID)
              </label>
              <Input
                type="text"
                placeholder="যেমন: 9J87X1K2P"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                className="text-xs font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                নোট (Notes)
              </label>
              <Input
                type="text"
                placeholder="পেমেন্ট সম্পর্কিত কোনো মন্তব্য"
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedBookingForPayment(null)}
                className="text-xs"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={paymentLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                পেমেন্ট কনফার্ম ও টিকিট ইস্যু করুন
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 3: Reject Pre-Booking */}
      <Modal
        isOpen={!!selectedBookingForReject}
        onClose={() => setSelectedBookingForReject(null)}
        size="md"
        title="বুকিং রিকোয়েস্ট বাতিল করুন"
      >
        {selectedBookingForReject && (
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              আপনি কি নিশ্চিত যে <strong className="text-slate-900 dark:text-white">{selectedBookingForReject.bookingNumber}</strong> বাতিল করতে চান? সিটটি অবিলম্বে উন্মুক্ত করা হবে।
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                বাতিলের কারণ *
              </label>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
              >
                <option value="যাত্রী কল রিসিভ করেননি">যাত্রী কল রিসিভ করেননি (No Response)</option>
                <option value="যাত্রী বুকিং বাতিল করতে চেয়েছেন">যাত্রী নিজেই বুকিং বাতিল করতে চেয়েছেন</option>
                <option value="ছাত্রত্ব বা তথ্যে অসংগতি পাওয়া গেছে">ছাত্রত্ব বা তথ্যে অসংগতি পাওয়া গেছে</option>
                <option value="পেমেন্ট টাইমার অতিক্রান্ত হয়েছে">পেমেন্ট টাইমার অতিক্রান্ত হয়েছে</option>
                <option value="অন্যান্য কারণ">অন্যান্য কারণ</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedBookingForReject(null)}
                className="text-xs"
              >
                ফিরে যান
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={rejectLoading}
                className="text-xs font-bold"
              >
                বুকিং বাতিল ও সিট উন্মুক্ত করুন
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Payment Receipt Modal */}
      {confirmedBookingForReceipt && (
        <PaymentReceiptModal
          isOpen={!!confirmedBookingForReceipt}
          booking={confirmedBookingForReceipt}
          onClose={() => setConfirmedBookingForReceipt(null)}
        />
      )}
    </div>
  );
}
