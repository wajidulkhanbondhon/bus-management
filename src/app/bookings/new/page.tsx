import React from 'react';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { getAllTrips } from '@/services/trip.service';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0;

export default async function NewBookingPage() {
  const [trips, user] = await Promise.all([
    getAllTrips({ status: 'SCHEDULED' }),
    getCurrentUser()
  ]);

  return <BookingWizard trips={trips} currentUser={user} />;
}
