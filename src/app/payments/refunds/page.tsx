import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

import { getAllRefunds } from '@/services/payment.service';

export const revalidate = 0;

export default async function RefundsPage() {
  const rawRefunds = await getAllRefunds();
  const refunds = (rawRefunds || []).map((r: any) => ({
    id: r.id,
    refundNumber: r.refund_number || r.refundNumber || 'RF-000',
    amount: Number(r.amount) || 0,
    method: r.method || 'BKASH',
    reason: r.reason || 'Customer Cancellation',
    createdAt: r.created_at ? new Date(r.created_at) : new Date(),
    booking: {
      bookingNumber: r.booking?.booking_number || r.booking?.bookingNumber || 'BK-CONF',
      passengers: [{
        passengerName: r.booking?.passengers?.[0]?.passenger_name || r.booking?.passengers?.[0]?.passengerName || r.booking?.contact_name || 'Passenger'
      }]
    }
  }));


  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="danger">Financial Reversals</Badge>
          <span className="text-xs font-mono text-slate-500">REFUNDS & CANCELLATIONS</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Processed Refunds Log</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditable refund register with financial ledger reversal tracing and documented reasons.
        </p>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          {refunds.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No refund transactions processed yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="px-5 py-3">Refund #</th>
                  <th className="px-4 py-3">Booking # & Passenger</th>
                  <th className="px-4 py-3">Refund Method</th>
                  <th className="px-4 py-3">Reason / Justification</th>
                  <th className="px-4 py-3 text-right">Refund Amount</th>
                  <th className="px-5 py-3 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {refunds.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-mono font-bold text-rose-600">{r.refundNumber}</td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-blue-600 font-bold block">{r.booking.bookingNumber}</span>
                      <span className="text-[11px] text-slate-500">{r.booking.passengers[0]?.passengerName}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="danger">{r.method}</Badge>
                    </td>
                    <td className="px-4 py-4 max-w-xs font-semibold text-slate-800">{r.reason}</td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-rose-600 text-sm">
                      -{formatCurrency(r.amount)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-slate-400">{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Mobile Card View (md:hidden) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {refunds.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            কোনো রিফান্ড ট্রানজ্যাকশন পাওয়া যায়নি।
          </div>
        ) : (
          refunds.map((r: any) => (
            <div
              key={r.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">{r.refundNumber}</span>
                  <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{r.booking.bookingNumber}</span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">{r.booking.passengers[0]?.passengerName}</h4>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-rose-600 text-sm block">
                    -{formatCurrency(r.amount)}
                  </span>
                  <Badge variant="danger" className="text-[9px] mt-1">{r.method}</Badge>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">কারণ: {r.reason}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
