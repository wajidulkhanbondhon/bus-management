import React from 'react';
import Link from 'next/link';
import { FileBarChart, Filter, Download, ArrowRight, Bus, TrendingUp, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSalesReport, getBusWiseSalesReport } from '@/services/report.service';
import { getAllBuses } from '@/services/bus.service';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { ExportActions } from '@/components/reports/export-actions';

export const revalidate = 0;

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string; busId?: string }>
}) {
  const params = await searchParams;
  const [sales, busWiseSales, buses] = await Promise.all([
    getSalesReport({
      startDate: params.startDate,
      endDate: params.endDate,
      busId: params.busId
    }),
    getBusWiseSalesReport({
      startDate: params.startDate,
      endDate: params.endDate
    }),
    getAllBuses()
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Analytics & BI</Badge>
            <span className="text-xs font-mono text-slate-500">EXECUTIVE FINANCIAL REPORTS</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Financial & Fleet Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filterable performance metrics, bus-wise sales breakdowns, and spreadsheet data export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions reportData={sales.bookings} filename="ATOMS_Sales_Report" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-50">
          <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Total Bookings</span>
          <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{sales.summary.totalBookings}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{sales.summary.totalSeats} seats total</span>
        </Card>

        <Card className="p-4 bg-slate-50">
          <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Gross Sales</span>
          <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{formatCurrency(sales.summary.totalGross)}</div>
          <span className="text-[10px] text-purple-700 mt-0.5 block">Discounts: {formatCurrency(sales.summary.totalDiscount)}</span>
        </Card>

        <Card className="p-4 bg-blue-50/60 border-blue-200">
          <span className="text-[10px] text-blue-900 font-bold uppercase font-mono">Net Sales Volume</span>
          <div className="text-xl font-black text-blue-900 font-mono mt-0.5">{formatCurrency(sales.summary.totalNet)}</div>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Effective revenue</span>
        </Card>

        <Card className="p-4 bg-emerald-50/60 border-emerald-200">
          <span className="text-[10px] text-emerald-800 font-bold uppercase font-mono">Total Collected</span>
          <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">{formatCurrency(sales.summary.totalPaid)}</div>
          <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">Due: {formatCurrency(sales.summary.totalDue)}</span>
        </Card>
      </div>

      {/* Bus-wise Sales Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bus-Wise Sales Breakdown</CardTitle>
          <Link href="/reports/financial-ledger" className="text-xs text-blue-600 font-bold hover:underline">
            View Double-Entry Ledger ➔
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Bus Number</th>
                <th className="px-4 py-3 text-center">Bookings Count</th>
                <th className="px-4 py-3 text-center">Seats Sold</th>
                <th className="px-4 py-3 text-right">Gross Sales</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Net Sales</th>
                <th className="px-4 py-3 text-right">Collected</th>
                <th className="px-5 py-3 text-right">Due Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {busWiseSales.map((b) => (
                <tr key={b.busNumber} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">{b.busNumber}</td>
                  <td className="px-4 py-3.5 text-center font-mono">{b.bookingsCount}</td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-blue-600">{b.seatsSold}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-600">{formatCurrency(b.grossSales)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-purple-700">{formatCurrency(b.discount)}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatCurrency(b.netSales)}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatCurrency(b.collected)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600">
                    {b.due > 0 ? formatCurrency(b.due) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
