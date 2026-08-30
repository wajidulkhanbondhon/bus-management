'use server';

import { createSession, destroySession, verifyCredentials, verifyOtpCredentials } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const result = await verifyCredentials(email, password);
  if (!result) {
    return { success: false, error: 'Invalid email or password. Please try again.' };
  }

  if ('requiresOtp' in result) {
    return { success: true, requiresOtp: true, userId: result.userId, email: result.email };
  }

  await createSession(result.id);
  revalidatePath('/');
  return { success: true, role: result.role.name };
}

export async function verifyOtpAction(userId: string, otp: string) {
  if (!userId || !otp) {
    return { success: false, error: 'OTP is required' };
  }

  const user = await verifyOtpCredentials(userId, otp);
  if (!user) {
    return { success: false, error: 'Invalid or expired OTP' };
  }

  await createSession(user.id);
  revalidatePath('/');
  return { success: true, role: user.role.name };
}

export async function logoutAction() {
  await destroySession();
  revalidatePath('/');
  return { success: true };
}

export async function switchDemoUserAction(email?: string) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const demoUsers: Record<string, { id: string; name: string; role: string }> = {
    'admin@transport.office': { id: 'admin-super-001', name: 'Kamrul Hasan (Director)', role: 'SUPER_ADMIN' },
    'manager@transport.office': { id: 'usr-2', name: 'Tariqul Islam (Manager)', role: 'MANAGER' },
    'staff@transport.office': { id: 'usr-3', name: 'Rahim Chowdhury (Desk Officer)', role: 'BOOKING_STAFF' },
    'accountant@transport.office': { id: 'usr-4', name: 'Zubair Ahmed (Chief Cashier)', role: 'ACCOUNTANT' }
  };

  const user = demoUsers[normalizedEmail] || {
    id: 'admin-super-001',
    name: 'Kamrul Hasan (Director)',
    role: 'SUPER_ADMIN'
  };

  await createSession(user.id);
  revalidatePath('/');
  return { success: true, role: user.role, name: user.name };
}

