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
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const {
    kpis = {},
    progressiveSales = [],
    busPerformance = [],
    paymentBreakdown = {},
    routeBreakdown = [],
    passengerDemographics = {},
    recentTransactions = [],
    activityFeed = []
  } = data || {};


  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {t.liveSalesMonitor}
            </span>
            <span className="text-xs text-slate-400 font-mono">• {t.dhakaHq}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {t.dashboardTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            {t.dashboardSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/day-closing">
            <Button variant="outline" size="md" className="font-semibold">
              <Lock className="w-4 h-4 mr-1.5" />
              {t.dayClosing}
            </Button>
          </Link>
          <Link href="/bookings/new">
            <Button variant="primary" size="md" className="font-bold shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 mr-1.5" />
              {t.newBooking}
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 5 KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Gross Sales */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase font-mono">
            <span>{t.grossSales}</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            {formatCurrency(kpis.grossSales)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{kpis.bookingsCount} {language === 'bn' ? 'টি টিকিট বুকিং' : 'bookings'}</span>
        </Card>

        {/* Discounts */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs font-semibold uppercase font-mono">
            <span>{t.discounts}</span>
            <span>%</span>
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-400 font-mono mt-1">
            {formatCurrency(kpis.totalDiscount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{language === 'bn' ? 'অনুমোদিত ছাড়' : 'Approved concessions'}</span>
        </Card>

        {/* Net Sales */}
        <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-blue-900 dark:text-blue-300 text-xs font-semibold uppercase font-mono">
            <span>{t.netSales}</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-900 dark:text-blue-300 font-mono mt-1">
            {formatCurrency(kpis.netSales)}
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 block">{language === 'bn' ? 'ছাড় বাদে মোট' : 'After discounts'}</span>
        </Card>

        {/* Total Collected */}
        <Card className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase font-mono">
            <span>{t.collected}</span>
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
            {formatCurrency(kpis.totalCollected)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">{language === 'bn' ? 'ক্যাশ ও ডিজিটাল জমা' : 'Cash & Gateways'}</span>
        </Card>

        {/* Due Remaining */}
        <Card className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs font-semibold uppercase font-mono">
            <span>{t.due}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            {formatCurrency(kpis.totalDue)}
          </div>
          <span className="text-[11px] text-rose-500 mt-0.5 block">{language === 'bn' ? 'বকেয়া কালেকশন বাকি' : 'Outstanding due'}</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {busPerformance.map((bus: any, index: number) => (
            <Card key={bus.tripId || bus.busId || bus.id || `bus-perf-${index}`} className="hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 flex flex-col justify-between group">
              <CardContent className="p-5 space-y-4">

                {/* Bus Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {bus.tripCode || bus.trip_code}
                      </span>
                      {(() => {
                        const type = bus.busType || bus.bus_type || 'MIXED';
                        return (
                          <Badge variant={type === 'FEMALE' ? 'danger' : (type === 'MALE' ? 'primary' : 'default')}>
                            {type === 'FEMALE' ? t.femaleBus : (type === 'MALE' ? t.maleBus : t.mixedBus)}
                          </Badge>
                        );
                      })()}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1 group-hover:text-blue-600 transition-colors">
                      {bus.busName || bus.bus_name || 'Express Coach'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{bus.busNumber || bus.bus_number} • {bus.routeName || bus.route_name}</p>

                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                    <Bus className="w-5 h-5" />
                  </div>
                </div>

                {/* Seating Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">{t.occupancy}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {bus.bookedSeats} / {bus.totalSeats} {t.seatsTotal} ({bus.occupancyPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        bus.occupancyPercent > 80 ? 'bg-rose-500' : (bus.occupancyPercent > 50 ? 'bg-blue-500' : 'bg-emerald-500')
                      }`}
                      style={{ width: `${bus.occupancyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">{t.netSales}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(bus.netSales)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 block font-mono">{t.collected}</span>
                    <span className="font-mono font-bold text-emerald-600">{formatCurrency(bus.collected)}</span>
                  </div>
                </div>

                {/* Direct Action Button: SELECT SEATS */}
                <div className="pt-2">
                  <Link href={`/trips/${bus.tripId}/seat-map`} className="block w-full">
                    <Button variant="primary" size="md" className="w-full font-bold shadow-md shadow-blue-500/20">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      {t.selectSeats}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {recentTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {tx.receiptNumber}
                      <span className="text-[10px] text-slate-400 block font-normal">{tx.booking?.bookingNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={tx.method === 'BKASH' ? 'danger' : (tx.method === 'NAGAD' ? 'warning' : 'success')}>
                        {tx.method}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {formatTime(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            {activityFeed.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 text-xs border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-none">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {act.action || 'ACTIVITY'}: <span className="font-normal text-slate-600 dark:text-slate-400">{act.entity || 'System'} {act.entityId ? `(${String(act.entityId).slice(0, 8)}...)` : ''}</span>
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>{act.user?.fullName || 'System'}</span>
                    <span>•</span>
                    <span>{formatTime(act.createdAt || act.timestamp || new Date())}</span>
                  </div>

                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
