import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchRecycleBinItems, fetchRecycleBinSummary } from '@/services/recycle-bin.service';
import { RecycleBinView } from '@/components/recycle-bin/recycle-bin-view';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'রিসাইকেল বিন ও ডেটা রিস্টোর | বাস ম্যানেজমেন্ট',
  description: 'সিস্টেম-ওয়াইড মুছে ফেলা বাস ও ট্রিপ রিস্টোর এবং পার্জ সেন্টার।'
};

export default async function RecycleBinPage() {
  const [items, summary] = await Promise.all([
    fetchRecycleBinItems('all'),
    fetchRecycleBinSummary()
  ]);

  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading Recycle Bin items...</div>}>
      <RecycleBinView initialItems={items} summary={summary} />
    </Suspense>
  );
}
