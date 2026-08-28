import React from 'react';
import type { Metadata } from 'next';
import { PassengerPortalClient } from '@/components/passenger/passenger-portal-client';

export const metadata: Metadata = {
  title: 'শিক্ষার্থী ও প্যাসেঞ্জার পোর্টাল - টিকিট ও বুকিং',
  description: 'আপনার বিশ্ববিদ্যালয় ভর্তি স্পেশাল এক্সপ্রেস বাসের ডিজিটাল টিকিট ডাউনলোড, সিট স্ট্যাটাস এবং পরীক্ষার নোটিশ দেখুন।',
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = 'force-dynamic';

export default async function PassengerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const identifier = resolvedParams.q || resolvedParams.phone || resolvedParams.booking || '';

  return <PassengerPortalClient initialPhoneOrCode={identifier} />;
}
