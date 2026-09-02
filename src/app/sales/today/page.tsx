import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSalesReport } from '@/services/report.service';
import { getLiveDashboardData } from '@/services/dashboard.service';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { ProgressiveSalesChart } from '@/components/dashboard/dashboard-charts';

export const revalidate = 0;

export default async function TodaySalesPage() {
  const [sales, dashboard] = await Promise.all([
    getSalesReport(),
    getLiveDashboardData()
  ]);

  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Sales Ledger</Badge>
          <span className="text-xs font-mono text-slate-500">TODAY'S ADMISSION SEAT SALES</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Today's Revenue & Tickets</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Gross Ticket Sales</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">{formatCurrency(sales.summary.totalGross)}</div>
          <span className="text-xs text-slate-400 mt-0.5 block">{sales.summary.totalSeats} seats sold</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-bold text-purple-700 uppercase font-mono">Discounts / Concessions</span>
          <div className="text-xl font-black text-purple-700 font-mono mt-1">{formatCurrency(sales.summary.totalDiscount)}</div>
          <span className="text-xs text-slate-400 mt-0.5 block">Approved concessions</span>
        </Card>
        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <span className="text-xs font-bold text-blue-900 uppercase font-mono">Net Sales</span>
          <div className="text-xl font-black text-blue-900 font-mono mt-1">{formatCurrency(sales.summary.totalNet)}</div>
          <span className="text-xs text-blue-600 mt-0.5 block">After discounts</span>
        </Card>
        <Card className="p-4 bg-emerald-50/50 border-emerald-200">
          <span className="text-xs font-bold text-emerald-800 uppercase font-mono">Collected Cash/Digital</span>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">{formatCurrency(sales.summary.totalPaid)}</div>
          <span className="text-xs text-emerald-600 mt-0.5 block">Paid to office</span>
        </Card>
      </div>

      {/* Progressive Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Progressive Sales Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressiveSalesChart data={dashboard.progressiveSales} />
        </CardContent>
      </Card>

      {/* Sales Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Tickets Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Booking #</th>
                <th className="px-4 py-3">Trip & Bus</th>
                <th className="px-4 py-3">Passenger Name</th>
                <th className="px-4 py-3 text-center">Seat(s)</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Net</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sales.bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{b.bookingNumber}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-900 block">{b.busNumber}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{b.tripCode}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-800 block">{b.passengerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{b.passengerPhone}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-blue-600">
                    {Array.isArray(b.seats) ? b.seats.map((s: any) => s.seat?.seatNumber || s.seat_id || 'A1').join(', ') : 'A1'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-600">{formatCurrency(b.grossAmount)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-purple-700">
                    {b.discountAmount > 0 ? `-${formatCurrency(b.discountAmount)}` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatCurrency(b.netAmount)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge variant={b.paymentStatus === 'PAID' ? 'success' : 'warning'}>{b.paymentStatus}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-400">{formatTime(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
