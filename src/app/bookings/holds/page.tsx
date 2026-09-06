import React from 'react';
import type { Metadata } from 'next';
import { SeatHoldsManagerClient } from '@/components/booking/seat-holds-manager-client';
import { getAllTrips } from '@/services/trip.service';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'হোল্ড ও সিট লক ম্যানেজার - এটিওএমএস বাস ম্যানেজমেন্ট',
  description: 'সাময়িক হোল্ড ও ভিআইপি সংরক্ষিত সিট রিলিজ ও তদারকি কনসোল।',
};

export default async function SeatHoldsPage() {
  const [trips, user] = await Promise.all([
    getAllTrips({ status: 'SCHEDULED' }).catch(() => []),
    getCurrentUser()
  ]);

  // Fetch seat holds/locks across scheduled trips
  const holdItems: any[] = [];
  await Promise.all(
    (trips || []).map(async (trip: any) => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/inventory/${trip.id}/seat-map`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          const seats = data.seats || [];
          seats.forEach((s: any) => {
            if (s.status === 'HELD') {
              holdItems.push({
                id: `hold-${trip.id}-${s.seat_id || s.seatId}`,
                type: 'HOLD',
                seatId: s.seat_id || s.seatId,
                seatNumber: s.seat_number || s.seatNumber || 'Seat',
                tripId: trip.id,
                tripCode: trip.tripCode || trip.trip_code || 'TRIP',
                busNumber: trip.bus?.busNumber || trip.bus?.bus_number,
                destination: trip.targetUniversity || trip.route?.destination,
                staffName: s.hold_info?.staff_name || 'Counter Operator',
                reason: s.hold_info?.reason || 'Counter Session Hold',
                expiresAt: s.payment_expires_at,
                createdAt: new Date().toISOString()
              });
            } else if (s.status === 'LOCKED') {
              holdItems.push({
                id: `lock-${trip.id}-${s.seat_id || s.seatId}`,
                type: 'LOCK',
                seatId: s.seat_id || s.seatId,
                seatNumber: s.seat_number || s.seatNumber || 'Seat',
                tripId: trip.id,
                tripCode: trip.tripCode || trip.trip_code || 'TRIP',
                busNumber: trip.bus?.busNumber || trip.bus?.bus_number,
                destination: trip.targetUniversity || trip.route?.destination,
                staffName: 'Admin / Manager',
                reason: s.lock_info?.reason || 'VIP / Reserved',
                createdAt: new Date().toISOString()
              });
            }
          });
        }
      } catch {}
    })
  );

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-6 lg:p-8">
      <SeatHoldsManagerClient
        initialItems={holdItems}
        allTrips={trips || []}
      />
    </div>
  );
}
