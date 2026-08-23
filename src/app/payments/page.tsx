import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const revalidate = 0;

export default async function PaymentsPage({
  searchParams
}: {
  searchParams: Promise<{ method?: string }>
}) {
  const params = await searchParams;
  const where: any = {};
  if (params.method) where.method = params.method;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      booking: {
        include: {
          trip: { include: { bus: true, route: true } },
          passengers: true
        }
      },
      receivedBy: { select: { fullName: true } },
      transactions: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Cash & Gateways</Badge>
            <span className="text-xs font-mono text-slate-500">PAYMENT TRANSACTIONS LEDGER</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">All Received Payments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit bKash, Nagad, Rocket, Hand Cash and Bank Transfer transactions with receipts.
          </p>
        </div>

        <div className="text-right bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
          <span className="text-[10px] text-emerald-800 font-bold font-mono uppercase block">Total Collections</span>
          <span className="text-xl font-black text-emerald-700 font-mono">{formatCurrency(totalCollected)}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Receipt #</th>
                <th className="px-4 py-3">Booking # & Passenger</th>
                <th className="px-4 py-3">Channel / Method</th>
                <th className="px-4 py-3">Digital TrxID</th>
                <th className="px-4 py-3 text-right">Amount (BDT)</th>
                <th className="px-4 py-3">Received By</th>
                <th className="px-5 py-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-blue-600 font-bold block">{p.booking.bookingNumber}</span>
                    <span className="text-[11px] text-slate-500">{p.booking.passengers[0]?.passengerName}</span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={p.method === 'BKASH' ? 'danger' : (p.method === 'NAGAD' ? 'warning' : 'success')}>
                      {p.method}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-slate-800">
                    {p.transactions[0]?.transactionId || 'Counter Hand Cash'}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-emerald-700 text-sm">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{p.receivedBy.fullName}</td>
                  <td className="px-5 py-4 text-right font-mono text-slate-400">{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
