import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { AppContextProvider } from '@/lib/context';
import { getCurrentUser } from '@/lib/auth';

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
    <html lang="bn" data-color-theme="blue" suppressHydrationWarning>
      <head>
        {/* Google Fonts — Premium Bengali & Latin Typography */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen antialiased transition-colors duration-200" suppressHydrationWarning>
        <AppContextProvider>
          <AppShell currentUser={user}>
            {children}
          </AppShell>
        </AppContextProvider>
      </body>
    </html>
  );
}
