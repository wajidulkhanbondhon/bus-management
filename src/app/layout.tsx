import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AppContextProvider } from '@/lib/context';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'ATOMS - Admission Transport & Office Management System',
  description: 'Mission-critical internal office management system for admission student bus transportation in Bangladesh.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex antialiased">
        <AppContextProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
            <Header currentUser={user} />
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
              {children}
            </main>
          </div>
        </AppContextProvider>
      </body>
    </html>
  );
}
