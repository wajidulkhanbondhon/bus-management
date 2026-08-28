import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBookingById } from '@/services/booking.service';
import { PrintTicketButton } from '@/components/booking/print-ticket-button';
import { PaymentReceiptCard } from '@/components/booking/payment-receipt';

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/bookings">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                {booking.bookingNumber}
              </span>
              <Badge variant={booking.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                {booking.paymentStatus}
              </Badge>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              অফিসিয়াল পেমেন্ট রসিদ ও টিকিট ইনভয়েস
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/bookings/new">
            <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl">
              + নতুন বুকিং
            </Button>
          </Link>
          <PrintTicketButton />
        </div>
      </div>

      {/* Official Payment Receipt Card */}
      <PaymentReceiptCard booking={booking} />
    </div>
  );
}

