import { fastApiClient } from '@/lib/api-client';

export interface RecordPaymentInput {
  bookingId: string;
  amount: number;
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  receivedById?: string;
  transactionId?: string;
  senderReference?: string;
  notes?: string;
}

export interface ProcessRefundInput {
  bookingId: string;
  paymentId?: string;
  amount: number;
  method: string;
  reason: string;
  processedById?: string;
}

export async function recordPayment(input: RecordPaymentInput) {
  try {
    const res = await fastApiClient.recordPayment({
      booking_id: input.bookingId,
      amount: input.amount,
      method: input.method,
      notes: input.notes || input.transactionId ? `TrxID: ${input.transactionId || ''}` : undefined
    });
    if (res.success && res.data) {
      return { success: true, paymentId: res.data.id, payment: res.data };
    }
    return { success: false, error: res.error || 'Failed to record payment' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Payment recording failed' };
  }
}

export async function processRefund(input: ProcessRefundInput) {
  try {
    const res = await fastApiClient.issueRefund({
      booking_id: input.bookingId,
      amount: input.amount,
      method: input.method,
      reason: input.reason,
      payment_id: input.paymentId
    });
    if (res.success && res.data) {
      return { success: true, refundId: res.data.id, refund: res.data };
    }
    return { success: false, error: res.error || 'Failed to issue refund' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Refund processing failed' };
  }
}

export async function getAllPayments() {
  try {
    const res = await fastApiClient.getPayments();
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  } catch {
    return [];
  }
}

export async function getAllRefunds() {
  try {
    const res = await fastApiClient.getRefunds();
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  } catch {
    return [];
  }
}
