import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const revalidate = 0;

export default async function RefundsPage() {
  const refunds: any[] = [];


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

      <Card>
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
                {refunds.map((r) => (
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
    </div>
  );
}
