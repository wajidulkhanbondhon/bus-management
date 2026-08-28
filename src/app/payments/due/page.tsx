import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CollectDueButton } from '@/components/payment/collect-due-button';

export const revalidate = 0;

export default async function DuePaymentsPage() {
  const dueBookings: any[] = [];


  const totalOutstandingDue = dueBookings.reduce((sum, b) => sum + b.dueAmount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="danger">Due Recovery</Badge>
            <span className="text-xs font-mono text-slate-500">OUTSTANDING CUSTOMER BALANCES</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Pending Due Payments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student candidates with partial advance payments requiring settlement prior to boarding departure.
          </p>
        </div>

        <div className="text-right bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl">
          <span className="text-[10px] text-rose-800 font-bold font-mono uppercase block">Total Due Balance</span>
          <span className="text-xl font-black text-rose-600 font-mono">{formatCurrency(totalOutstandingDue)}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Booking #</th>
                <th className="px-4 py-3">Student Passenger</th>
                <th className="px-4 py-3">Contact Phone</th>
                <th className="px-4 py-3">Trip & Seat(s)</th>
                <th className="px-4 py-3 text-right">Net Fare</th>
                <th className="px-4 py-3 text-right">Paid Advance</th>
                <th className="px-4 py-3 text-right">Due Amount</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {dueBookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4 font-mono font-bold text-blue-600">{b.bookingNumber}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{b.passengers?.[0]?.passengerName}</td>
                  <td className="px-4 py-4 font-mono text-slate-600">{b.passengers?.[0]?.passengerPhone}</td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-slate-900 block">{b.trip?.route?.routeName}</span>
                    <span className="font-mono text-blue-600 text-[11px]">
                      Seats: {(b.seats || []).map((s: any) => s.seat?.seatNumber || s.seat_id || 'A1').join(', ')}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right font-mono text-slate-600">{formatCurrency(b.netAmount)}</td>
                  <td className="px-4 py-4 text-right font-mono text-emerald-700">{formatCurrency(b.paidAmount)}</td>
                  <td className="px-4 py-4 text-right font-mono font-black text-rose-600 text-sm">
                    {formatCurrency(b.dueAmount)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <CollectDueButton
                      bookingId={b.id}
                      bookingNumber={b.bookingNumber}
                      dueAmount={b.dueAmount}
                    />
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
