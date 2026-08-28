import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StudentSeatBookingView } from '@/components/booking/student-seat-booking-view';
import { getTripSeatInventory } from '@/services/inventory.service';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'শিক্ষার্থী সিট নির্বাচন ও প্রি-বুকিং - অ্যাটমস ট্রানজিট',
  description: 'বিশ্ববিদ্যালয় ভর্তি স্পেশাল বাসের লাইভ সিট নির্বাচন ও প্রি-বুকিং পোর্টাল।',
};

export default async function PassengerBookTripPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  try {
    const inventory = await getTripSeatInventory(id);

    return (
      <StudentSeatBookingView
        trip={inventory.trip}
        seats={inventory.seats}
        summary={inventory.summary}
      />
    );
  } catch (error) {
    notFound();
  }
}
