import React from 'react';
import { getLiveDashboardData } from '@/services/dashboard.service';
import { getCurrentUser } from '@/lib/auth';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export const revalidate = 0;

export default async function DashboardPage() {
  const [data, user] = await Promise.all([
    getLiveDashboardData(),
    getCurrentUser()
  ]);

  return <DashboardView data={data} currentUser={user} />;
}
