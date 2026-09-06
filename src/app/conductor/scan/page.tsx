import React from 'react';
import { getAllBookings } from '@/services/booking.service';
import { ConductorQrScannerClient } from '@/components/conductor/conductor-qr-scanner-client';

export const revalidate = 0;

export default async function ConductorScanPage() {
  const bookings = await getAllBookings({});
  return <ConductorQrScannerClient initialBookings={bookings || []} />;
}
