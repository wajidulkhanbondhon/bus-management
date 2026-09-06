import React from 'react';
import type { Metadata } from 'next';
import { QuickCounterBookingClient } from '@/components/booking/quick-counter-booking-client';
import { getAllTrips } from '@/services/trip.service';
import { getAllBuses } from '@/services/bus.service';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'কুইক কাউন্টার বুকিং - এটিওএমএস বাস ম্যানেজমেন্ট',
  description: 'রানিং বাসের লাইভ সিট নির্বাচন ও দ্রুত কাউন্টার টিকিট প্রিন্ট পোর্টাল।',
};

export default async function QuickBookingPage() {
  const [trips, buses, user] = await Promise.all([
    getAllTrips({ status: 'SCHEDULED' }).catch(() => []),
    getAllBuses().catch(() => []),
    getCurrentUser()
  ]);

  // Combine raw trips with active buses as fallback
  const busTrips = (buses || []).map((b: any, idx: number) => ({
    id: b.id,
    tripCode: b.busNumber ? `TRIP-${b.busNumber}` : `TRIP-${idx + 1}`,
    bus: b,
    route: {
      origin: b.routeOrigin || 'ঢাকা',
      destination: b.routeDestination || b.targetUniversity || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র',
      routeName: `${b.routeOrigin || 'ঢাকা'} ➔ ${b.routeDestination || b.targetUniversity || 'ক্যাম্পাস'}`
    },
    targetUniversity: b.targetUniversity || 'ভর্তি পরীক্ষা কেন্দ্র',
    departureDate: b.departureDate || new Date().toISOString(),
    departureTime: b.departureTime || '22:30',
    basePrice: b.basePrice || 550,
    status: 'SCHEDULED'
  }));

  const allAvailableTrips = (trips && trips.length > 0) ? trips : busTrips;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-6 lg:p-8">
      <QuickCounterBookingClient
        trips={allAvailableTrips}
        currentUser={user}
      />
    </div>
  );
}
