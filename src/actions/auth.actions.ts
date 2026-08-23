'use server';

import { createSession, destroySession, verifyCredentials, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return { success: false, error: 'Invalid email or password. Please try again.' };
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

export async function switchDemoUserAction(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { role: true }
  });

  if (!user) {
    return { success: false, error: 'Demo user not found' };
  }

  await createSession(user.id);
  revalidatePath('/');
  return { success: true, role: user.role.name, name: user.fullName };
}
