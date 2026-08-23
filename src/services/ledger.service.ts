import { prisma } from '@/lib/db';

export interface RecordLedgerParams {
  entryType: 'SALE' | 'DISCOUNT' | 'PAYMENT_RECEIVED' | 'REFUND_ISSUED' | 'ADJUSTMENT' | 'DAY_CLOSING_TRANSFER';
  debit?: number;
  credit?: number;
  paymentMethod?: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER' | null;
  bookingId?: string | null;
  paymentId?: string | null;
  refundId?: string | null;
  dayClosingId?: string | null;
  description: string;
}

export async function createLedgerEntry(params: RecordLedgerParams) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.financialLedger.count();
  const entryNumber = `LED-${dateStr}-${String(count + 1).padStart(5, '0')}`;

  const debit = params.debit || 0.0;
  const credit = params.credit || 0.0;
  const balance = Math.abs(debit - credit);

  return prisma.financialLedger.create({
    data: {
      entryNumber,
      entryType: params.entryType,
      debit,
      credit,
      balance,
      paymentMethod: params.paymentMethod || null,
      bookingId: params.bookingId || null,
      paymentId: params.paymentId || null,
      refundId: params.refundId || null,
      dayClosingId: params.dayClosingId || null,
      description: params.description
    }
  });
}

export async function getFinancialLedgerEntries(filters?: {
  startDate?: Date | string;
  endDate?: Date | string;
  entryType?: string;
  paymentMethod?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.entryType) where.entryType = filters.entryType;
  if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  return prisma.financialLedger.findMany({
    where,
    include: {
      booking: {
        select: {
          bookingNumber: true,
          trip: {
            select: {
              tripCode: true,
              route: { select: { routeName: true } }
            }
          }
        }
      },
      payment: {
        select: { receiptNumber: true, method: true }
      },
      refund: {
        select: { refundNumber: true, reason: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100
  });
}
