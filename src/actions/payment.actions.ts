'use server';

import { recordPayment, processRefund, RecordPaymentInput, ProcessRefundInput } from '@/services/payment.service';
import { requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function recordPaymentAction(input: Omit<RecordPaymentInput, 'receivedById'>) {
  try {
    const user = await requirePermission('payment:collect');
    const payment = await recordPayment({
      ...input,
      receivedById: user.id
    });

    revalidatePath('/payments');
    revalidatePath('/dashboard');
    revalidatePath('/bookings');
    return { success: true, payment };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to record payment' };
  }
}

export async function processRefundAction(input: Omit<ProcessRefundInput, 'processedById'>) {
  try {
    const user = await requirePermission('payment:refund');
    const refund = await processRefund({
      ...input,
      processedById: user.id
    });

    revalidatePath('/payments');
    revalidatePath('/payments/refunds');
    revalidatePath('/dashboard');
    revalidatePath('/bookings');
    return { success: true, refund };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to process refund' };
  }
}
