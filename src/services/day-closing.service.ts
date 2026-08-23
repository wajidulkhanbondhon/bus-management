import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';

export interface MethodActualInput {
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  actualAmount: number;
}

export interface SubmitDayClosingInput {
  closingDate: string | Date;
  closedById: string;
  actualTotalCash: number;
  methodActuals: MethodActualInput[];
  notes?: string;
}

export async function calculateDayClosingSummary(dateInput: string | Date) {
  const targetDate = new Date(dateInput);
  const startOfDay = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

  // 1. Fetch all bookings created on this day
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      bookingStatus: { in: ['CONFIRMED', 'COMPLETED', 'PARTIALLY_REFUNDED'] }
    }
  });

  const expectedGrossSales = bookings.reduce((sum, b) => sum + b.grossAmount, 0);
  const expectedDiscount = bookings.reduce((sum, b) => sum + b.discountAmount, 0);
  const expectedNetSales = bookings.reduce((sum, b) => sum + b.netAmount, 0);
  const expectedDue = bookings.reduce((sum, b) => sum + b.dueAmount, 0);

  // 2. Fetch all payments collected on this day
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay }
    }
  });

  const expectedCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  // Group payments by Method
  const methodTotals: Record<string, { expectedAmount: number; trxCount: number }> = {
    BKASH: { expectedAmount: 0, trxCount: 0 },
    NAGAD: { expectedAmount: 0, trxCount: 0 },
    ROCKET: { expectedAmount: 0, trxCount: 0 },
    HAND_CASH: { expectedAmount: 0, trxCount: 0 },
    BANK_TRANSFER: { expectedAmount: 0, trxCount: 0 },
    OTHER: { expectedAmount: 0, trxCount: 0 },
  };

  for (const p of payments) {
    if (methodTotals[p.method]) {
      methodTotals[p.method].expectedAmount += p.amount;
      methodTotals[p.method].trxCount += 1;
    }
  }

  // 3. Fetch refunds on this day
  const refunds = await prisma.refund.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay }
    }
  });
  const expectedRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);

  // 4. Check if day is already closed
  const existingClosing = await prisma.dayClosing.findFirst({
    where: {
      closingDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      summaries: true,
      closedBy: { select: { fullName: true } }
    }
  });

  return {
    date: startOfDay,
    isClosed: !!existingClosing && !existingClosing.isReopened,
    existingClosing,
    metrics: {
      expectedGrossSales,
      expectedDiscount,
      expectedNetSales,
      expectedCollected,
      expectedDue,
      expectedRefunds,
      bookingCount: bookings.length,
      paymentCount: payments.length,
      refundCount: refunds.length
    },
    methodSummaries: methodTotals
  };
}

export async function submitDayClosing(input: SubmitDayClosingInput) {
  const dateObj = new Date(input.closingDate);
  const startOfDay = new Date(new Date(dateObj).setHours(0, 0, 0, 0));

  const summary = await calculateDayClosingSummary(startOfDay);

  const paymentSummaryData = input.methodActuals.map(m => {
    const expected = summary.methodSummaries[m.method]?.expectedAmount || 0;
    const trxCount = summary.methodSummaries[m.method]?.trxCount || 0;
    const diff = m.actualAmount - expected;
    const status: 'MATCHED' | 'SHORT' | 'EXCESS' = diff === 0 ? 'MATCHED' : (diff < 0 ? 'SHORT' : 'EXCESS');

    return {
      method: m.method,
      expectedAmount: expected,
      actualAmount: m.actualAmount,
      difference: diff,
      status,
      trxCount
    };
  });

  const cashSummary = paymentSummaryData.find(p => p.method === 'HAND_CASH');
  const cashDifference = cashSummary ? cashSummary.difference : 0;
  const overallStatus: 'MATCHED' | 'SHORT' | 'EXCESS' = 
    paymentSummaryData.some(p => p.status === 'SHORT') ? 'SHORT' :
    (paymentSummaryData.some(p => p.status === 'EXCESS') ? 'EXCESS' : 'MATCHED');

  const dayClosing = await prisma.dayClosing.upsert({
    where: { closingDate: startOfDay },
    create: {
      closingDate: startOfDay,
      closedById: input.closedById,
      expectedGrossSales: summary.metrics.expectedGrossSales,
      expectedDiscount: summary.metrics.expectedDiscount,
      expectedNetSales: summary.metrics.expectedNetSales,
      expectedCollected: summary.metrics.expectedCollected,
      expectedDue: summary.metrics.expectedDue,
      expectedRefunds: summary.metrics.expectedRefunds,
      actualTotalCash: input.actualTotalCash,
      cashDifference,
      reconcileStatus: overallStatus,
      notes: input.notes,
      summaries: {
        create: paymentSummaryData
      }
    },
    update: {
      closedById: input.closedById,
      isReopened: false,
      reopenedReason: null,
      expectedGrossSales: summary.metrics.expectedGrossSales,
      expectedDiscount: summary.metrics.expectedDiscount,
      expectedNetSales: summary.metrics.expectedNetSales,
      expectedCollected: summary.metrics.expectedCollected,
      expectedDue: summary.metrics.expectedDue,
      expectedRefunds: summary.metrics.expectedRefunds,
      actualTotalCash: input.actualTotalCash,
      cashDifference,
      reconcileStatus: overallStatus,
      notes: input.notes,
      summaries: {
        deleteMany: {},
        create: paymentSummaryData
      }
    },
    include: { summaries: true }
  });

  await logAudit({
    userId: input.closedById,
    action: 'DAY_CLOSED',
    entity: 'DayClosing',
    entityId: dayClosing.id,
    newValue: {
      closingDate: startOfDay,
      status: overallStatus,
      actualCash: input.actualTotalCash,
      difference: cashDifference
    }
  });

  return dayClosing;
}

export async function reopenDayClosing(dayClosingId: string, adminUserId: string, reason: string) {
  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { role: true }
  });

  if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role.name)) {
    throw new Error('Only Administrators can reopen a closed business day.');
  }

  const reopened = await prisma.dayClosing.update({
    where: { id: dayClosingId },
    data: {
      isReopened: true,
      reopenedReason: reason,
      reopenedById: adminUserId
    }
  });

  await logAudit({
    userId: adminUserId,
    action: 'DAY_REOPENED',
    entity: 'DayClosing',
    entityId: dayClosingId,
    newValue: { reason, reopenedBy: admin.fullName }
  });

  return reopened;
}

export async function getDayClosingHistory(limit = 30) {
  return prisma.dayClosing.findMany({
    include: {
      closedBy: { select: { fullName: true } },
      summaries: true
    },
    orderBy: { closingDate: 'desc' },
    take: limit
  });
}
