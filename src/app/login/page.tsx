import React from 'react';
import { AuthCard, LoginForm } from '@/components/auth';

export const metadata = {
  title: 'Office Sign In | ATOMS Transport',
  description: 'Internal terminal and office portal login for ATOMS Admission Transport.',
};

export default function LoginPage() {
  return (
    <AuthCard
      title="ATOMS Transport Desk"
      subtitle="Internal Office & Terminal Management System"
    >
      <LoginForm onSuccessRedirect="/dashboard" />
    </AuthCard>
  );
}
