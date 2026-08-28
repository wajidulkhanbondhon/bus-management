import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATOMS Supervisor Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans selection:bg-blue-500/30">
      {/* 
        The supervisor module is independent of the main AppShell 
        because it requires a simplified, mobile-first interface 
        without the admin sidebar.
      */}
      {children}
    </div>
  );
}
