import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Bus,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBookingById } from '@/services/booking.service';
import { formatDate, formatTime, formatDateTime, formatCurrency } from '@/lib/utils';
import { PrintTicketButton } from '@/components/booking/print-ticket-button';

export const revalidate = 0;

export default async function BookingDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const booking = await getBookingById(id);

  if (!booking) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/bookings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {booking.bookingNumber}
              </span>
              <Badge variant={booking.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                {booking.paymentStatus}
              </Badge>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">Official Admission Bus Ticket & Invoice</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrintTicketButton />
        </div>
      </div>

      {/* Printable Ticket Receipt Card */}
      <Card className="border-2 border-slate-300 shadow-lg overflow-hidden bg-white" id="printable-ticket">
        {/* Ticket Header */}
        <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-dashed border-slate-700">
          <div>
            <div className="text-[11px] font-bold text-blue-400 font-mono tracking-widest uppercase">
              Admission Student Transport Transit Pass
            </div>
            <h2 className="text-xl font-black tracking-tight mt-0.5">Central Transport Office Desk</h2>
            <p className="text-xs text-slate-400 mt-0.5">Dhaka HQ ⇄ University Transit Wing</p>
          </div>

          <div className="text-right font-mono">
            <div className="text-xs text-slate-400">TICKET INVOICE NO</div>
            <div className="text-lg font-black text-white">{booking.bookingNumber}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Issued: {formatDateTime(booking.createdAt)}</div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Trip & Schedule Grid */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-mono text-[10px] uppercase block font-bold">Transit Route</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{booking.trip.route.routeName}</span>
              <span className="text-slate-500 text-[11px]">{booking.trip.route.origin} ➔ {booking.trip.route.destination}</span>
            </div>

            <div>
              <span className="text-slate-400 font-mono text-[10px] uppercase block font-bold">Departure Schedule</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{formatDate(booking.trip.departureDate)}</div>
              <div className="flex items-center gap-1 font-mono text-blue-600 font-bold mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(booking.trip.departureTime)} (Dhaka Local)
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-mono text-[10px] uppercase block font-bold">Coach Telemetry</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{booking.trip.bus.busName}</span>
              <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-600">
                <span>{booking.trip.bus.busNumber}</span>
                <span>•</span>
                <Badge variant="primary">{booking.trip.tripBusType || booking.trip.bus.busType}</Badge>
              </div>
            </div>
          </div>

          {/* Passenger Roster */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-2">
              Allocated Passenger(s) & Seats
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-mono text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Seat #</th>
                    <th className="px-4 py-2.5">Passenger Name</th>
                    <th className="px-4 py-2.5">Contact Phone</th>
                    <th className="px-4 py-2.5">Category & Gender</th>
                    <th className="px-4 py-2.5">Admission / Roll ID</th>
                    <th className="px-4 py-2.5 text-right">Fare Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {booking.passengers.map((p, idx) => {
                    const seatSnapshot = booking.seats[idx]?.fareSnapshot || booking.trip.basePrice;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-black text-blue-600 text-sm">
                          {p.seatNumber}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {p.passengerName}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {p.passengerPhone}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Badge variant="primary">{p.passengerType}</Badge>
                            <span className="text-[11px] text-slate-500 font-semibold">({p.gender})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {p.student?.admissionId || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(seatSnapshot)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Settlements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {/* Payment Transactions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Payment Collections
              </h4>
              <div className="space-y-2">
                {booking.payments.map((pmt) => (
                  <div key={pmt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{pmt.receiptNumber}</span>
                      <span className="font-mono font-bold text-emerald-700">{formatCurrency(pmt.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Method: <Badge variant="primary">{pmt.method}</Badge></span>
                      <span className="font-mono">{formatTime(pmt.createdAt)}</span>
                    </div>
                    {pmt.transactions[0] && (
                      <div className="text-[10px] font-mono text-blue-600 pt-1">
                        TrxID: {pmt.transactions[0].transactionId} ({pmt.transactions[0].verificationStatus})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Calculations Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Gross Fare:</span>
                <span className="font-bold">{formatCurrency(booking.grossAmount)}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>Concession Discount:</span>
                  <span className="font-bold">-{formatCurrency(booking.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 border-t border-slate-200 pt-2 font-bold text-sm">
                <span>Net Total:</span>
                <span>{formatCurrency(booking.netAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Paid to Desk:</span>
                <span className="font-bold">{formatCurrency(booking.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-600 border-t border-dashed border-slate-300 pt-2 font-bold text-sm">
                <span>Remaining Due:</span>
                <span>{formatCurrency(booking.dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Desk Officer Sign-off */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
            <div>
              <span>Issued By: {booking.createdBy.fullName} ({booking.createdBy.email})</span>
              <p className="mt-0.5">Please present this transit pass at the boarding terminal.</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-700">Admission Transport Office System (ATOMS)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
