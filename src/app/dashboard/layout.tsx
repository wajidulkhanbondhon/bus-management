import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATOMS Office Desk Dashboard',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
