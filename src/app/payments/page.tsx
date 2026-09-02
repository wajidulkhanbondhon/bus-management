import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  BkashLogo,
  NagadLogo,
  RocketLogo,
  CashMoneyLogo,
  BankTransferLogo
} from '@/components/booking/payment-brand-icons';

import { getAllPayments } from '@/services/payment.service';

export const revalidate = 0;

export default async function PaymentsPage({
  searchParams
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const params = await searchParams;
  const rawPayments = await getAllPayments();

  const payments = (rawPayments || []).map((p: any) => ({
    id: p.id,
    receiptNumber: p.receipt_number || p.receiptNumber || 'RCT-000',
    amount: Number(p.amount) || 0,
    method: p.method || 'HAND_CASH',
    createdAt: p.created_at ? new Date(p.created_at) : new Date(),
    booking: {
      bookingNumber: p.booking?.booking_number || p.booking?.bookingNumber || 'BK-CONF',
      trip: {
        bus: { busName: p.booking?.trip?.bus?.bus_name || p.booking?.trip?.bus?.busName || 'Express Bus' },
        route: { routeName: p.booking?.trip?.route?.route_name || p.booking?.trip?.route?.routeName || 'Campus Express' }
      },
      passengers: [{
        passengerName: p.booking?.passengers?.[0]?.passenger_name || p.booking?.passengers?.[0]?.passengerName || p.booking?.contact_name || 'Passenger'
      }]
    },
    receivedBy: {
      fullName: p.received_by?.full_name || p.received_by?.fullName || p.receivedBy?.fullName || 'Staff Member'
    },
    transactions: [{
      transactionId: p.notes?.replace('TrxID: ', '') || p.transaction_id || 'Counter'
    }]
  })).filter((p: any) => {
    if (!params.method) return true;
    return p.method.toLowerCase() === params.method.toLowerCase();
  });

  const totalCollected = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

  return (
    <div className="space-y-6 w-full">
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

      {/* Desktop Table View */}
      <Card className="hidden md:block">
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
              {payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-blue-600 font-bold block">{p.booking.bookingNumber}</span>
                    <span className="text-[11px] text-slate-500">{p.booking.passengers[0]?.passengerName}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {p.method === 'BKASH' && <BkashLogo className="w-5 h-5 flex-shrink-0 shadow-xs" />}
                      {p.method === 'NAGAD' && <NagadLogo className="w-5 h-5 flex-shrink-0 shadow-xs" />}
                      {p.method === 'ROCKET' && <RocketLogo className="w-5 h-5 flex-shrink-0 shadow-xs" />}
                      {p.method === 'HAND_CASH' && <CashMoneyLogo className="w-5 h-5 flex-shrink-0 shadow-xs" />}
                      {p.method === 'BANK_TRANSFER' && <BankTransferLogo className="w-5 h-5 flex-shrink-0 shadow-xs" />}
                      <Badge variant={p.method === 'BKASH' ? 'danger' : (p.method === 'NAGAD' ? 'warning' : 'success')}>
                        {p.method}
                      </Badge>
                    </div>
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

      {/* Mobile Card List (md:hidden) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {payments.map((p: any) => (
          <div
            key={p.id}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{p.receiptNumber}</span>
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{p.booking.bookingNumber}</span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">{p.booking.passengers[0]?.passengerName}</h4>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm block">
                  {formatCurrency(p.amount)}
                </span>
                <Badge variant={p.method === 'BKASH' ? 'danger' : (p.method === 'NAGAD' ? 'warning' : 'success')} className="text-[9px] mt-1">
                  {p.method}
                </Badge>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span>গ্রহীতা: {p.receivedBy.fullName}</span>
              <span className="font-mono text-[10px] text-slate-400">{formatDateTime(p.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
