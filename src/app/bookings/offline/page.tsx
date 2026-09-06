import React from 'react';
import type { Metadata } from 'next';
import { OfflineQueueManagerClient } from '@/components/booking/offline-queue-manager-client';

export const metadata: Metadata = {
  title: 'অফলাইন বুকিং সিঙ্ক কিউ - এটিওএমএস বাস ম্যানেজমেন্ট',
  description: 'ইন্টারনেট বিচ্ছিন্ন অবস্থায় কাউন্টার বুকিং সংরক্ষণ ও সার্ভার সিঙ্ক ড্যাশবোর্ড।',
};

export default function OfflineBookingsPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-6 lg:p-8">
      <OfflineQueueManagerClient />
    </div>
  );
}
