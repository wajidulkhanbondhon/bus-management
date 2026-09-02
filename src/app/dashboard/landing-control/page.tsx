import React from 'react';
import { LandingControlClient } from '@/components/settings/landing-control-client';

export const metadata = {
  title: 'Landing Page Control',
  description: 'Control which sections are visible or hidden on the public landing page.',
};

export default function DashboardLandingControlRedirect() {
  return <LandingControlClient />;
}
