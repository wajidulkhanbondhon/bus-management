import React from 'react';
import { notFound } from 'next/navigation';
import { getBookingById } from '@/services/booking.service';
import { BookingDetailView } from '@/components/booking/booking-detail-view';

export const revalidate = 0;

export default async function BookingDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ autoPrint?: string; success?: string; booked?: string; pnr?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const booking = await getBookingById(id);

  if (!booking) {
    notFound();
  }

  const isSuccess = sParams?.success === 'true' || sParams?.booked === 'true';

  return (
    <BookingDetailView
      booking={booking}
      autoPrint={sParams?.autoPrint === 'true' || sParams?.autoPrint === '1'}
      isSuccess={isSuccess}
    />
  );
}


