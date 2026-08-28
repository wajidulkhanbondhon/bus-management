'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  CreditCard,
  Printer,
  ExternalLink,
  Phone,
  Bus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface Props {
  initialBookings: any[];
}

export function BookingsRosterClient({ initialBookings }: Props) {
  const { language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'HOLD' | 'CANCELLED'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PARTIALLY_PAID' | 'UNPAID'>('ALL');

  const filteredBookings = useMemo(() => {
    return initialBookings.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const bNum = (b.booking_number || b.bookingNumber || '').toLowerCase();
      const name = (b.contact_name || b.contactName || b.passengers?.[0]?.passengerName || '').toLowerCase();
      const phone = (b.contact_phone || b.contactPhone || b.passengers?.[0]?.passengerPhone || '').toLowerCase();
      const uni = (b.trip?.bus?.busName || b.trip?.route?.destination || '').toLowerCase();

      const matchesSearch = !q || bNum.includes(q) || name.includes(q) || phone.includes(q) || uni.includes(q);

      const bStatus = b.booking_status || b.bookingStatus || 'CONFIRMED';
      const matchesStatus = statusFilter === 'ALL' || bStatus === statusFilter;

      const pStatus = b.payment_status || b.paymentStatus || 'PAID';
      const matchesPayment = paymentFilter === 'ALL' || pStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [initialBookings, searchQuery, statusFilter, paymentFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'যাত্রী ও বুকিং তালিকা (Bookings & Roster)' : 'Bookings & Passenger Roster'}
            </h1>
            <Badge variant="primary" className="font-mono text-xs font-bold px-2 py-0.5">
              {filteredBookings.length} {language === 'bn' ? 'টি বুকিং' : 'Bookings'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'শিক্ষার্থীর নাম, মোবাইল নম্বর, ভর্তি রোল, অথবা টিকিট ট্র্যাকিং নম্বর দিয়ে খুঁজুন'
              : 'Search student candidates by name, mobile, admission roll, or tracking number'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/bookings/new">
            <Button variant="primary" size="md" className="font-black shadow-lg shadow-blue-500/25 rounded-2xl">
              <Plus className="w-4 h-4 mr-1.5" />
              {language === 'bn' ? '+ নতুন টিকিট বুকিং' : '+ New Booking'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'নাম, মোবাইল বা টিকিট নং খুঁজুন...' : 'Search name, phone, ticket #...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all shadow-2xs"
          />
        </div>

        {/* Payment Filter */}
        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            aria-label={language === 'bn' ? 'পেমেন্ট স্ট্যাটাস ফিল্টার' : 'Payment Status Filter'}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all shadow-2xs"
          >
            <option value="ALL">{language === 'bn' ? 'সব পেমেন্ট স্ট্যাটাস (All Payments)' : 'All Payment Statuses'}</option>
            <option value="PAID">{language === 'bn' ? 'পরিশোধিত (Paid in Full)' : 'Paid'}</option>
            <option value="PARTIALLY_PAID">{language === 'bn' ? 'বকেয়া রয়েছে (Due / Partial)' : 'Partially Paid'}</option>
            <option value="UNPAID">{language === 'bn' ? 'অপরিশোধিত (Unpaid)' : 'Unpaid'}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label={language === 'bn' ? 'বুকিং স্ট্যাটাস ফিল্টার' : 'Booking Status Filter'}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all shadow-2xs"
          >
            <option value="ALL">{language === 'bn' ? 'সব বুকিং অবস্থা (All Status)' : 'All Booking Statuses'}</option>
            <option value="CONFIRMED">{language === 'bn' ? 'কনফার্মড (Confirmed)' : 'Confirmed'}</option>
            <option value="HOLD">{language === 'bn' ? 'হোল্ড / সংরক্ষিত (On Hold)' : 'On Hold'}</option>
            <option value="CANCELLED">{language === 'bn' ? 'বাতিলকৃত (Cancelled)' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* Bookings Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Ticket}
                title={language === 'bn' ? 'কোনো বুকিং রেকর্ড পাওয়া যায়নি' : 'No Bookings Found'}
                description={
                  searchQuery
                    ? language === 'bn'
                      ? `"${searchQuery}" এর সাথে মিলে এমন কোনো বুকিং নেই।`
                      : `No reservations matched your query "${searchQuery}".`
                    : language === 'bn'
                    ? 'এখনো কোনো টিকিট বুকিং সম্পন্ন হয়নি। নতুন টিকিট বুকিং করতে নিচের বাটনে চাপ দিন।'
                    : 'No passenger bookings have been recorded yet.'
                }
                actionLabel={language === 'bn' ? '+ নতুন টিকিট বুকিং' : '+ New Booking'}
                actionHref="/bookings/new"
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs uppercase">
                <tr>
                  <th className="px-5 py-3.5">{language === 'bn' ? 'বুকিং নম্বর ও সময়' : 'Booking # & Date'}</th>
                  <th className="px-4 py-3.5">{language === 'bn' ? 'পরীক্ষার্থী / যাত্রী' : 'Student / Passenger'}</th>
                  <th className="px-4 py-3.5">{language === 'bn' ? 'বাস ও রুট' : 'Trip & Coach'}</th>
                  <th className="px-4 py-3.5 text-center">{language === 'bn' ? 'আসন (Seat)' : 'Seat(s)'}</th>
                  <th className="px-4 py-3.5 text-right">{language === 'bn' ? 'মোট প্রদেয়' : 'Net Amount'}</th>
                  <th className="px-4 py-3.5 text-center">{language === 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                {filteredBookings.map((b: any) => {
                  const bNum = b.booking_number || b.bookingNumber || 'BK-2026';
                  const candidateName = b.contact_name || b.contactName || b.passengers?.[0]?.passengerName || 'Candidate';
                  const candidatePhone = b.contact_phone || b.contactPhone || b.passengers?.[0]?.passengerPhone || '—';
                  const pStatus = b.payment_status || b.paymentStatus || 'PAID';
                  const isPaid = pStatus === 'PAID';
                  const isDue = pStatus === 'PARTIALLY_PAID' || pStatus === 'UNPAID';
                  const netAmt = b.net_amount ?? b.netAmount ?? 0;
                  const dueAmt = b.due_amount ?? b.dueAmount ?? 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Booking Number & Date */}
                      <td className="px-5 py-4">
                        <Link href={`/track/${encodeURIComponent(bNum)}`} className="font-mono font-black text-blue-600 dark:text-blue-400 hover:underline block">
                          {bNum}
                        </Link>
                        <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                          {formatDate(b.created_at || b.createdAt)} • {formatTime(b.created_at || b.createdAt)}
                        </span>
                      </td>

                      {/* Student / Passenger Details */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{candidateName}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{candidatePhone}</span>
                          {(b.passengers?.length || 0) > 1 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-blue-600">
                              +{b.passengers.length - 1} {language === 'bn' ? 'জন' : 'more'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bus & Route */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-xs flex items-center gap-1.5">
                          <Bus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{b.trip?.bus?.busName || b.trip?.bus?.bus_name || 'Express Coach'}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                          {b.trip?.route?.origin || 'Dhaka'} ➔ {b.trip?.route?.destination || 'Campus'}
                        </div>
                      </td>

                      {/* Seats */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 inline-block">
                          {(b.seats || []).map((s: any) => s.seat?.seatNumber || s.seat_id || 'Seat').join(', ')}
                        </span>
                      </td>

                      {/* Net & Due Amount */}
                      <td className="px-4 py-4 text-right font-mono font-bold">
                        <div className="text-slate-900 dark:text-white text-sm">{formatCurrency(netAmt)}</div>
                        {dueAmt > 0 ? (
                          <span className="text-xs text-rose-600 font-semibold block">
                            {language === 'bn' ? 'বকেয়া: ' : 'Due: '} {formatCurrency(dueAmt)}
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold block">
                            {language === 'bn' ? 'পরিশোধিত' : 'Paid in full'}
                          </span>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="px-4 py-4 text-center">
                        <Badge
                          variant={isPaid ? 'success' : isDue ? 'warning' : 'danger'}
                          className="font-bold text-xs"
                        >
                          {isPaid
                            ? language === 'bn'
                              ? 'পরিশোধিত'
                              : 'PAID'
                            : isDue
                            ? language === 'bn'
                              ? 'বকেয়া রয়েছে'
                              : 'PARTIAL DUE'
                            : pStatus}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/track/${encodeURIComponent(bNum)}`}>
                            <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl px-2.5 py-1">
                              <Printer className="w-3.5 h-3.5 mr-1" />
                              {language === 'bn' ? 'রসিদ / ট্র্যাক' : 'Receipt'}
                            </Button>
                          </Link>
                          <Link href={`/bookings/${b.id}`}>
                            <Button size="sm" variant="primary" className="font-bold text-xs rounded-xl px-2.5 py-1 shadow-xs">
                              {language === 'bn' ? 'বিস্তারিত' : 'View'}
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
