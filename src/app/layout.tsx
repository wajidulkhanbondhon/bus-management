import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { AppContextProvider } from '@/lib/context';
import { AnalyticsProvider } from '@/components/analytics-provider';
import { getCurrentUser } from '@/lib/auth';
import { AutoLogout } from '@/components/AutoLogout';
import { Inter, Noto_Sans_Bengali } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-noto-bengali',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ATOMS Transit - বাংলাদেশ বিশ্ববিদ্যালয় ভর্তি স্পেশাল এক্সপ্রেস বাস',
    template: '%s | ATOMS Transit'
  },
  description: 'ঢাকা থেকে রাজশাহী, চট্টগ্রাম, সিলেট, খুলনা সহ বাংলাদেশের সকল বিশ্ববিদ্যালয় ক্যাম্পাসে সরাসরি ও নিরাপদ ভর্তি পরীক্ষার্থী বাস সার্ভিস ও লাইভ সিট বুকিং।',
  keywords: [
    'Admission Bus Bangladesh',
    'University Admission Transport',
    'Rajshahi University Admission Bus',
    'Chittagong University Bus Booking',
    'GST Admission Bus',
    'ভর্তি পরীক্ষা বাস',
    'অ্যাডমিশন বাস সার্ভিস'
  ],
  authors: [{ name: 'ATOMS Transit Bangladesh' }],
  creator: 'ATOMS Transit Management',
  metadataBase: new URL('https://atomstransit.com'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: 'https://atomstransit.com',
    siteName: 'ATOMS Admission Transit',
    title: 'ATOMS Transit - বাংলাদেশ বিশ্ববিদ্যালয় ভর্তি স্পেশাল এক্সপ্রেস বাস',
    description: 'ঢাকা ও প্রধান শহর থেকে বাংলাদেশের সকল বিশ্ববিদ্যালয়ে নিরাপদ ও সরাসরি শিক্ষার্থী বাস পরিবহন সেবা।',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="bn" data-color-theme="blue" suppressHydrationWarning className={`${inter.variable} ${notoBengali.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen antialiased transition-colors duration-200 font-sans" suppressHydrationWarning>
        <AppContextProvider>
          <AnalyticsProvider />
          <AutoLogout isLoggedIn={!!user} />
          <AppShell currentUser={user}>
            {children}
          </AppShell>
        </AppContextProvider>
      </body>
    </html>
  );
}

