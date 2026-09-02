import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CollectDueButton } from '@/components/payment/collect-due-button';

import { fastApiClient } from '@/lib/api-client';

export const revalidate = 0;

export default async function DuePaymentsPage() {
  let dueBookings: any[] = [];
  try {
    const res = await fastApiClient.get('/bookings/?has_due=true');
    if (res.success && res.data) {
      dueBookings = res.data.map((b: any) => ({
        id: b.id,
        bookingNumber: b.booking_number || b.bookingNumber || 'BK-000',
        dueAmount: Number(b.due_amount || b.dueAmount) || 0,
        paidAmount: Number(b.paid_amount || b.paidAmount) || 0,
        netAmount: Number(b.net_amount || b.netAmount) || 0,
        trip: {
          route: {
            routeName: b.trip?.route?.route_name || b.trip?.route?.routeName || 'Admission Route'
          }
        },
        passengers: [{
          passengerName: b.passengers?.[0]?.passenger_name || b.passengers?.[0]?.passengerName || b.contact_name || 'Student',
          passengerPhone: b.passengers?.[0]?.passenger_phone || b.passengers?.[0]?.passengerPhone || b.contact_phone || '—'
        }],
        seats: (b.seats || []).map((s: any) => ({
          seat: { seatNumber: s.seat?.seat_number || s.seat?.seatNumber || s.seat_id || 'A1' }
        }))
      }));
    }
  } catch {
    dueBookings = [];
  }


  const totalOutstandingDue = dueBookings.reduce((sum, b) => sum + b.dueAmount, 0);

  return (
    <div className="space-y-6 w-full">
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

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          {dueBookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              বর্তমানে কোনো বকেয়া বা ডিউ বুকিং নেই। সব পরিশোধ সম্পন্ন হয়েছে।
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Mobile Card View (md:hidden) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {dueBookings.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-medium">
            বর্তমানে কোনো বকেয়া বুকিং নেই।
          </div>
        ) : (
          dueBookings.map((b: any) => (
            <div
              key={b.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{b.bookingNumber}</span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{b.passengers?.[0]?.passengerName}</h4>
                  <p className="text-[11px] font-mono text-slate-500">{b.passengers?.[0]?.passengerPhone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">বকেয়া পরিমাণ:</span>
                  <span className="font-mono font-black text-rose-600 text-base">
                    {formatCurrency(b.dueAmount)}
                  </span>
                </div>
              </div>

              <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 font-mono">
                  পরিশোধ: {formatCurrency(b.paidAmount)} / {formatCurrency(b.netAmount)}
                </span>
                <CollectDueButton
                  bookingId={b.id}
                  bookingNumber={b.bookingNumber}
                  dueAmount={b.dueAmount}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
