import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingByTrackingNumber } from '@/services/booking.service';
import { LiveBookingTrackerClient } from '@/components/booking/live-booking-tracker-client';

export const dynamic = 'force-dynamic';

export default async function TrackBookingPage({
  params
}: {
  params: Promise<{ bookingNumber: string }>;
}) {
  const resolvedParams = await params;
  const bookingNumber = decodeURIComponent(resolvedParams.bookingNumber);

  const booking = await getBookingByTrackingNumber(bookingNumber);

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold text-white">বুকিং রেকর্ড পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-400">
            &quot;{bookingNumber}&quot; নম্বরে কোনো সক্রিয় বুকিং খুঁজে পাওয়া যায়নি। নম্বরটি সঠিক কিনা যাচাই করুন।
          </p>
          <Link href="/track">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all">
              পুনরায় খুঁজুন
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return <LiveBookingTrackerClient initialBooking={booking} />;
}
