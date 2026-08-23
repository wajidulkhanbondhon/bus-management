import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';
import { createLedgerEntry } from './ledger.service';

export interface RecordPaymentInput {
  bookingId: string;
  amount: number;
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  transactionId?: string;
  senderReference?: string;
  notes?: string;
  receivedById: string;
}

export interface ProcessRefundInput {
  bookingId: string;
  paymentId?: string;
  amount: number;
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER';
  reason: string;
  processedById: string;
}

export async function recordPayment(input: RecordPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { payments: true }
    });

    if (!booking) throw new Error('Booking record not found');
    if (input.amount <= 0) throw new Error('Payment amount must be greater than 0');

    // Generate Receipt Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await tx.payment.count();
    const receiptNumber = `RCT-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Create Payment
    const payment = await tx.payment.create({
      data: {
        receiptNumber,
        bookingId: input.bookingId,
        amount: input.amount,
        method: input.method,
        receivedById: input.receivedById,
        notes: input.notes,
        transactions: input.transactionId ? {
          create: {
            transactionId: input.transactionId.trim(),
            senderReference: input.senderReference ? input.senderReference.trim() : null,
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date()
          }
        } : undefined
      },
      include: { transactions: true }
    });

    // Update Booking paidAmount, dueAmount, paymentStatus
    const newPaidAmount = booking.paidAmount + input.amount;
    const newDueAmount = Math.max(0, booking.netAmount - newPaidAmount);
    const newPaymentStatus = newDueAmount <= 0 ? 'PAID' : (newPaidAmount > 0 ? 'PARTIALLY_PAID' : 'UNPAID');

    await tx.booking.update({
      where: { id: input.bookingId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        paymentStatus: newPaymentStatus
      }
    });

    // Create Financial Ledger Entry
    await tx.financialLedger.create({
      data: {
        entryNumber: `LED-${dateStr}-${String(await tx.financialLedger.count() + 1).padStart(5, '0')}`,
        entryType: 'PAYMENT_RECEIVED',
        debit: 0.0,
        credit: input.amount,
        balance: newDueAmount,
        paymentMethod: input.method,
        bookingId: input.bookingId,
        paymentId: payment.id,
        description: `Payment collected via ${input.method} (Receipt: ${receiptNumber}, Trx: ${input.transactionId || 'Counter Cash'})`
      }
    });

    await logAudit({
      userId: input.receivedById,
      action: 'PAYMENT_RECEIVED',
      entity: 'Payment',
      entityId: payment.id,
      newValue: {
        receiptNumber,
        amount: input.amount,
        method: input.method,
        bookingNumber: booking.bookingNumber,
        dueRemaining: newDueAmount
      }
    });

    return payment;
  });
}

export async function processRefund(input: ProcessRefundInput) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { payments: true }
    });

    if (!booking) throw new Error('Booking not found');
    if (input.amount <= 0) throw new Error('Refund amount must be positive');
    if (input.amount > booking.paidAmount) {
      throw new Error(`Refund amount (${input.amount}) exceeds total paid amount (${booking.paidAmount})`);
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await tx.refund.count();
    const refundNumber = `RF-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const refund = await tx.refund.create({
      data: {
        refundNumber,
        bookingId: input.bookingId,
        paymentId: input.paymentId || null,
        amount: input.amount,
        method: input.method,
        reason: input.reason,
        processedById: input.processedById
      }
    });

    const newPaidAmount = Math.max(0, booking.paidAmount - input.amount);
    const newPaymentStatus = newPaidAmount === 0 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    await tx.booking.update({
      where: { id: input.bookingId },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus,
        bookingStatus: newPaidAmount === 0 ? 'CANCELLED' : booking.bookingStatus
      }
    });

    await tx.financialLedger.create({
      data: {
        entryNumber: `LED-${dateStr}-${String(await tx.financialLedger.count() + 1).padStart(5, '0')}`,
        entryType: 'REFUND_ISSUED',
        debit: input.amount,
        credit: 0.0,
        balance: newPaidAmount,
        paymentMethod: input.method,
        bookingId: input.bookingId,
        refundId: refund.id,
        description: `Refund processed (${refundNumber}) for Booking ${booking.bookingNumber}. Reason: ${input.reason}`
      }
    });

    await logAudit({
      userId: input.processedById,
      action: 'REFUND_PROCESSED',
      entity: 'Refund',
      entityId: refund.id,
      newValue: { refundNumber, amount: input.amount, reason: input.reason }
    });

    return refund;
  });
}
