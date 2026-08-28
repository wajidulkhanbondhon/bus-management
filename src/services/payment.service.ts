export interface RecordPaymentInput {
  bookingId: string;
  amount: number;
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  receivedById: string;
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
  processedById: string;
}

export async function recordPayment(input: RecordPaymentInput) {
  return { success: true, paymentId: `PAY-${Date.now()}` };
}

export async function processRefund(input: ProcessRefundInput) {
  return { success: true, refundId: `RF-${Date.now()}` };
}
