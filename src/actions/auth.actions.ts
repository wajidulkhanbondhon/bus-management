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

  await createSession(result.id, result.token);
  revalidatePath('/');
  return { success: true, role: result.role?.name, token: result.token };
}

export async function verifyOtpAction(userId: string, otp: string) {
  if (!userId || !otp) {
    return { success: false, error: 'OTP is required' };
  }

  const user = await verifyOtpCredentials(userId, otp);
  if (!user) {
    return { success: false, error: 'Invalid or expired OTP' };
  }

  await createSession(user.id, user.token);
  revalidatePath('/');
  return { success: true, role: user.role?.name, token: user.token };
}

export async function logoutAction() {
  await destroySession();
  revalidatePath('/');
  return { success: true };
}

export async function switchDemoUserAction(email?: string) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const targetEmail = normalizedEmail || 'admin@transport.office';

  const result = await verifyCredentials(targetEmail, 'admin1234');
  if (!result) {
    return { success: false, error: 'Failed to authenticate demo user. Please make sure the backend is seeded with admin1234 passwords.' };
  }

  await createSession(result.id, result.token);
  revalidatePath('/');
  return { success: true, role: result.role?.name, name: result.fullName };
}

