import React from 'react';
import { DayClosingForm } from '@/components/day-closing/day-closing-form';
import { calculateDayClosingSummary } from '@/services/day-closing.service';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0;

export default async function DayClosingPage() {
  const [summary, user] = await Promise.all([
    calculateDayClosingSummary(new Date()),
    getCurrentUser()
  ]);

  return <DayClosingForm summary={summary} currentUser={user} />;
}
