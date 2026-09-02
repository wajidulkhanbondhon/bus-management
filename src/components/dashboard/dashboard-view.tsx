'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  Bus,
  Users,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Compass,
  AlertTriangle,
  Coins,
  Percent,
  Receipt,
  Inbox,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import {
  ProgressiveSalesChart,
  PaymentDistributionBar,
  RouteRevenueBarChart,
  PaymentMethodsDonutChart,
  PassengerDemographicsChart
} from '@/components/dashboard/dashboard-charts';
import { InteractiveDashboardAnalytics } from '@/components/dashboard/interactive-dashboard-analytics';
import { useApp } from '@/lib/context';

interface Props {
  data: any;
  currentUser?: any;
}

export function DashboardView({ data, currentUser }: Props) {
  const { t, language } = useApp();

  const kpis = data?.kpis || {
    grossSales: 0,
    totalDiscount: 0,
    netSales: 0,
    totalCollected: 0,
    totalDue: 0,
    bookingsCount: 0
  };

  const busPerformance = data?.busPerformance || [];
  const progressiveSales = data?.progressiveSales || [];
  const routeBreakdown = data?.routeBreakdown || [];
  const paymentBreakdown = data?.paymentBreakdown || [];
  const passengerDemographics = data?.passengerDemographics || { male: 0, female: 0, student: 0, guardian: 0 };
  const recentTransactions = data?.recentTransactions || [];
  const activityFeed = data?.activityFeed || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header / Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.dashboardTitle}
            </h1>
            <Badge variant="primary" className="font-mono text-xs font-bold px-2 py-0.5">
              {language === 'bn' ? 'লাইভ টার্মিনাল' : 'Live Operations'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বিশেষ বাস সার্ভিস, লাইভ টিকিট কাউন্টার ও কালেকশন ড্যাশবোর্ড'
              : 'University Admission Transit Fleet & Live Ticket Sales Operations Center'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/day-closing">
            <Button variant="outline" size="md" className="font-bold rounded-2xl">
              <Lock className="w-4 h-4 mr-1.5" />
              {t.dayClosing}
            </Button>
          </Link>
          <Link href="/bookings/new">
            <Button variant="primary" size="md" className="font-black shadow-lg shadow-blue-500/25 rounded-2xl">
              <Sparkles className="w-4 h-4 mr-1.5" />
              {t.newBooking}
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 5 KPI Metrics Cards - Fully Responsive & Visual Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Gross Sales */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase font-mono">
              {t.grossSales}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
            {formatCurrency(kpis.grossSales)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{kpis.bookingsCount}</span>
            <span>{language === 'bn' ? 'টি টিকিট বিক্রয়' : 'tickets booked'}</span>
          </div>
        </Card>

        {/* 2. Discounts */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-purple-200/60 dark:border-purple-900/40 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-purple-700 dark:text-purple-400 text-xs font-bold uppercase font-mono">
              {t.discounts}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-purple-700 dark:text-purple-400 font-mono mt-2">
            {formatCurrency(kpis.totalDiscount)}
          </div>
          <span className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1 block font-medium">
            {language === 'bn' ? 'অনুমোদিত ছাড় ও কুপন' : 'Approved concessions'}
          </span>
        </Card>

        {/* 3. Net Sales */}
        <Card className="p-4 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/40 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 dark:text-blue-300 text-xs font-bold uppercase font-mono">
              {t.netSales}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-300 font-mono mt-2">
            {formatCurrency(kpis.netSales)}
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block font-medium">
            {language === 'bn' ? 'ছাড় বাদে প্রদেয় ভাড়া' : 'After discounts'}
          </span>
        </Card>

        {/* 4. Total Collected */}
        <Card className="p-4 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase font-mono">
              {t.collected}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-2">
            {formatCurrency(kpis.totalCollected)}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
            {language === 'bn' ? 'ক্যাশ ও ডিজিটাল জমা' : 'Cash & MFS Received'}
          </span>
        </Card>

        {/* 5. Due Remaining */}
        <Card className="p-4 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/40 dark:from-rose-950/30 dark:via-slate-900 dark:to-amber-950/20 border-rose-200 dark:border-rose-800 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-rose-800 dark:text-rose-300 text-xs font-bold uppercase font-mono">
              {t.due}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-2">
            {formatCurrency(kpis.totalDue)}
          </div>
          <span className="text-xs text-rose-500 mt-1 block font-medium">
            {language === 'bn' ? 'বকেয়া কালেকশন বাকি' : 'Outstanding due'}
          </span>
        </Card>
      </div>

      {/* BUS OVERVIEW SECTION: Active Scheduled Buses with Direct "Select Seats" Trigger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {t.activeTripsFleet}
              </h2>
              <Badge variant="primary">{busPerformance.length} {language === 'bn' ? 'বাস রুট চালু' : 'Active Buses'}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.activeTripsSubtitle}
            </p>
          </div>

          <Link href="/trips" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            {language === 'bn' ? 'সব ট্রিপ দেখুন' : 'View All Trips'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {busPerformance.length === 0 ? (
          <EmptyState
            icon={Bus}
            title={language === 'bn' ? 'কোনো সক্রিয় বাস বা ট্রিপ শিডিউল নেই' : 'No Active Bus Trips Found'}
            description={language === 'bn' ? 'যাত্রী সেবা এবং টিকিট বিক্রি শুরু করার জন্য একটি নতুন বাস ট্রিপ তৈরি করুন।' : 'Create a new trip schedule to start passenger ticketing.'}
            actionLabel={language === 'bn' ? 'নতুন ট্রিপ তৈরি করুন' : 'Create New Trip'}
            actionHref="/trips/create"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {busPerformance.map((bus: any, index: number) => {
              const busType = bus.busType || bus.bus_type || 'MIXED';
              const isFemale = busType === 'FEMALE';
              const isMale = busType === 'MALE';

              return (
                <Card
                  key={bus.tripId || bus.busId || bus.id || `bus-perf-${index}`}
                  className="hover:shadow-xl transition-all border-slate-200 dark:border-slate-800 flex flex-col justify-between group overflow-hidden"
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Bus Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {bus.tripCode || bus.trip_code}
                          </span>
                          <Badge variant={isFemale ? 'danger' : isMale ? 'primary' : 'default'} className="font-bold text-xs">
                            {isFemale ? t.femaleBus : isMale ? t.maleBus : t.mixedBus}
                          </Badge>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base mt-1 group-hover:text-blue-600 transition-colors">
                          {bus.busName || bus.bus_name || 'Express Coach'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                          {bus.busNumber || bus.bus_number} • {bus.routeName || bus.route_name}
                        </p>
                      </div>

                      {/* Dynamic Gradient Bus Icon Box */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-105 ${
                          isFemale
                            ? 'bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-rose-500/25'
                            : isMale
                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/25'
                            : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
                        }`}
                      >
                        <Bus className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Seating Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">{t.occupancy}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {bus.bookedSeats} / {bus.totalSeats} {t.seatsTotal} ({bus.occupancyPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            bus.occupancyPercent > 80
                              ? 'bg-rose-500'
                              : bus.occupancyPercent > 50
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${bus.occupancyPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-xs text-slate-400 block font-mono font-medium">{t.netSales}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(bus.netSales)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-emerald-600 block font-mono font-medium">{t.collected}</span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">{formatCurrency(bus.collected)}</span>
                      </div>
                    </div>

                    {/* Direct Action Button: SELECT SEATS */}
                    <div className="pt-2">
                      <Link href={`/trips/${bus.tripId}/seat-map`} className="block w-full">
                        <Button
                          variant="primary"
                          size="md"
                          className={`w-full font-black rounded-xl shadow-md ${
                            isFemale
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25'
                              : 'shadow-blue-500/25'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 mr-1.5" />
                          {t.selectSeats}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Unified Analytics with Chart Type & Metric Switchers */}
      <InteractiveDashboardAnalytics
        progressiveSales={progressiveSales}
        routeBreakdown={routeBreakdown}
        paymentBreakdown={paymentBreakdown}
        passengerDemographics={passengerDemographics}
        busPerformance={busPerformance}
      />

      {/* Multi-Chart Analytics Grid: Row 1 - Progressive Sales & Route Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xs">
          <CardHeader>
            <div>
              <CardTitle>{t.liveProgressiveSales}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t.liveProgressiveSubtitle}</p>
            </div>
            <Badge variant="primary">{language === 'bn' ? 'আজকের কার্যদিবস' : 'Live Monitor'}</Badge>
          </CardHeader>
          <CardContent>
            <ProgressiveSalesChart data={progressiveSales} />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader>
            <div>
              <CardTitle>{t.routeRevenueChart}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t.routeRevenueSubtitle}</p>
            </div>
            <Badge variant="info">{routeBreakdown.length} {language === 'bn' ? 'টি রুট' : 'Routes'}</Badge>
          </CardHeader>
          <CardContent>
            <RouteRevenueBarChart data={routeBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Multi-Chart Analytics Grid: Row 2 - Payment Methods Share & Passenger Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xs">
          <CardHeader>
            <div>
              <CardTitle>{t.paymentMethods}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t.paymentSubtitle}</p>
            </div>
            <Badge variant="success">{language === 'bn' ? 'ডিজিটাল ও ক্যাশ' : 'Share Breakdown'}</Badge>
          </CardHeader>
          <CardContent>
            <PaymentMethodsDonutChart data={paymentBreakdown} />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader>
            <div>
              <CardTitle>{t.passengerDemographics}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t.passengerDemographicsSubtitle}</p>
            </div>
            <Badge variant="purple">{language === 'bn' ? 'ভর্তি পরীক্ষার্থী ও অভিভাবক' : 'Demographics'}</Badge>
          </CardHeader>
          <CardContent>
            <PassengerDemographicsChart data={passengerDemographics} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Recent Transactions & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>{t.recentTransactions}</CardTitle>
            <Link href="/payments" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
              {language === 'bn' ? 'সব দেখুন' : 'View All'} ➔
            </Link>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {recentTransactions.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Receipt}
                  title={language === 'bn' ? 'কোনো সাম্প্রতিক লেনদেন নেই' : 'No Recent Transactions'}
                  description={language === 'bn' ? 'কাউন্টারে টিকিট বুকিং বা পেমেন্ট সম্পন্ন হলে এখানে লাইভ তালিকা প্রদর্শিত হবে।' : 'Transactions will appear here as payments are made.'}
                />
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono text-xs uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">{language === 'bn' ? 'মানি রিসিট #' : 'Receipt #'}</th>
                    <th className="px-4 py-3">{language === 'bn' ? 'পদ্ধতি' : 'Method'}</th>
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'সময়' : 'Time'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {tx.receiptNumber}
                        <span className="text-xs text-slate-400 block font-normal">{tx.booking?.bookingNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tx.method === 'BKASH' ? 'danger' : tx.method === 'NAGAD' ? 'warning' : 'success'}>
                          {tx.method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 text-sm">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td suppressHydrationWarning className="px-4 py-3 text-right font-mono text-slate-400">
                        {formatTime(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>{t.liveActivityFeed}</CardTitle>
            <Link href="/audit-logs" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
              {language === 'bn' ? 'অডিট লগ' : 'Audit Logs'} ➔
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {activityFeed.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={language === 'bn' ? 'কোনো সাম্প্রতিক অ্যাক্টিভিটি নেই' : 'No Activity Logged'}
                description={language === 'bn' ? 'সিস্টেমের সাম্প্রতিক ইউজার কার্যক্রম এখানে লাইভ দেখা যাবে।' : 'User actions will be recorded here.'}
              />
            ) : (
              activityFeed.map((act: any) => {
                const actionType = (act.action || '').toUpperCase();
                const dotColor =
                  actionType.includes('CREATE') || actionType.includes('BOOK')
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                    : actionType.includes('PAY') || actionType.includes('COLLECT')
                    ? 'bg-cyan-500 ring-4 ring-cyan-500/20'
                    : actionType.includes('UPDATE') || actionType.includes('EDIT')
                    ? 'bg-blue-500 ring-4 ring-blue-500/20'
                    : actionType.includes('DELETE') || actionType.includes('CANCEL') || actionType.includes('REFUND')
                    ? 'bg-rose-500 ring-4 ring-rose-500/20'
                    : 'bg-amber-500 ring-4 ring-amber-500/20';

                const entityTitle =
                  act.entity === 'BOOKING'
                    ? 'টিকিট বুকিং'
                    : act.entity === 'TRIP'
                    ? 'বাস ট্রিপ'
                    : act.entity === 'PAYMENT'
                    ? 'পেমেন্ট রসিদ'
                    : act.entity === 'BUS'
                    ? 'বাস রেকর্ড'
                    : act.entity || 'সিস্টেম';

                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-none">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor} mt-1 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {act.action || 'ACTIVITY'}:{' '}
                        <span className="font-normal text-slate-600 dark:text-slate-400">
                          {entityTitle} {act.entityName ? `[${act.entityName}]` : ''}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span className="font-bold text-slate-600 dark:text-slate-300">{act.user?.fullName || 'System Staff'}</span>
                        <span>•</span>
                        <span suppressHydrationWarning>{formatTime(act.createdAt || act.timestamp || new Date())}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
