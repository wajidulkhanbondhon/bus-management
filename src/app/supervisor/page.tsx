import React from 'react';
import { SupervisorPortalClient } from '@/components/supervisor';

export const metadata = {
  title: 'Supervisor Portal | ATOMS Transport',
  description: 'On-trip supervisor portal for passenger attendance, manifest, and bus details.',
};

export default function SupervisorPage() {
  return <SupervisorPortalClient />;
}
