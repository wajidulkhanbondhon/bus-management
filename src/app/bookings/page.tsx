import React from 'react';
import Link from 'next/link';
import { Ticket, Plus, Search, Filter, ArrowRight, Clock, User, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllBookings } from '@/services/booking.service';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

export const revalidate = 0;

export default async function BookingsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; status?: string; paymentStatus?: string }>
}) {
  const params = await searchParams;
  const bookings = await getAllBookings({
    search: params.search,
    status: params.status,
    paymentStatus: params.paymentStatus
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Ticket Ledger</Badge>
            <span className="text-xs font-mono text-slate-500">CONFIRMED PASSENGER RESERVATIONS</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Bookings & Passenger Roster</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search student candidates by name, mobile number, ticket number, or filter by payment status.
          </p>
        </div>

        <Link href="/bookings/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            + New Booking
          </Button>
        </Link>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Booking # & Date</th>
                <th className="px-4 py-3">Student / Passengers</th>
                <th className="px-4 py-3">Trip & Coach</th>
                <th className="px-4 py-3 text-center">Seat(s)</th>
                <th className="px-4 py-3 text-right">Net Amount</th>
                <th className="px-4 py-3 text-center">Payment Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">{b.booking_number || b.bookingNumber}</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                      {formatDate(b.created_at || b.createdAt)} {formatTime(b.created_at || b.createdAt)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {b.contact_name || b.passengers?.[0]?.passengerName || 'Candidate'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {b.contact_phone || b.passengers?.[0]?.passengerPhone || '—'}
                      {(b.passengers?.length || 0) > 1 && (
                        <span className="ml-1 text-slate-400">+{b.passengers.length - 1} more</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                      {b.trip?.route?.routeName || b.trip?.route?.route_name || 'Dhaka to Rajshahi'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {b.trip?.trip_code || b.trip?.tripCode} ({b.trip?.bus?.bus_number || b.trip?.bus?.busNumber})
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {(b.seats || []).map((s: any) => s.seat_id || s.seat?.seatNumber || 'A1').join(', ')}
                    </span>
                  </td>



                  <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">
                    <div>{formatCurrency(b.netAmount)}</div>
                    {b.dueAmount > 0 ? (
                      <span className="text-[10px] text-rose-600 font-semibold block">Due: {formatCurrency(b.dueAmount)}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold block">Paid in full</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge variant={b.paymentStatus === 'PAID' ? 'success' : (b.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'danger')}>
                      {b.paymentStatus}
                    </Badge>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link href={`/bookings/${b.id}`}>
                      <Button size="sm" variant="outline" className="font-semibold">
                        View Ticket
                      </Button>
                    </Link>
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
