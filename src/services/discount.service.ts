import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';

export interface ApplyDiscountInput {
  bookingId: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountRate: number; // Amount in BDT or percentage number
  grossAmount: number;
  reason: string;
  appliedById: string;
}

export function calculateDiscountAmount(gross: number, type: 'FIXED' | 'PERCENTAGE', rate: number): number {
  if (type === 'PERCENTAGE') {
    const calculated = (gross * rate) / 100;
    return Math.min(calculated, gross);
  }
  return Math.min(rate, gross);
}

export async function createDiscountRequest(input: ApplyDiscountInput) {
  const staff = await prisma.user.findUnique({
    where: { id: input.appliedById },
    include: { role: true }
  });

  if (!staff) throw new Error('Staff user not found');

  const discountAmount = calculateDiscountAmount(input.grossAmount, input.discountType, input.discountRate);

  // Check if auto-approved within limit
  const isSuperAdmin = staff.role.name === 'SUPER_ADMIN';
  const isWithinLimit = isSuperAdmin || discountAmount <= staff.discountLimit;

  const discount = await prisma.discount.create({
    data: {
      bookingId: input.bookingId,
      discountType: input.discountType,
      discountRate: input.discountRate,
      discountAmount,
      reason: input.reason,
      appliedById: input.appliedById,
      approvals: isWithinLimit ? {
        create: {
          approvedById: staff.id,
          status: 'APPROVED',
          notes: 'Auto-approved within user role discount allowance limit'
        }
      } : undefined
    },
    include: { approvals: true }
  });

  await logAudit({
    userId: input.appliedById,
    action: isWithinLimit ? 'DISCOUNT_APPLIED_AUTO' : 'DISCOUNT_PENDING_APPROVAL',
    entity: 'Discount',
    entityId: discount.id,
    newValue: { amount: discountAmount, reason: input.reason, status: isWithinLimit ? 'APPROVED' : 'PENDING' }
  });

  return {
    discount,
    isApproved: isWithinLimit,
    discountAmount
  };
}

export async function approveDiscount(params: {
  discountId: string;
  approverId: string;
  status: 'APPROVED' | 'REJECTED';
  notes?: string;
}) {
  const approver = await prisma.user.findUnique({
    where: { id: params.approverId },
    include: { role: true }
  });

  if (!approver || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(approver.role.name)) {
    throw new Error('Only Managers or Admins can approve escalated discounts');
  }

  const approval = await prisma.discountApproval.create({
    data: {
      discountId: params.discountId,
      approvedById: params.approverId,
      status: params.status,
      notes: params.notes || `Manually ${params.status.toLowerCase()} by supervisor`
    }
  });

  await logAudit({
    userId: params.approverId,
    action: `DISCOUNT_${params.status}`,
    entity: 'Discount',
    entityId: params.discountId,
    newValue: { status: params.status, approver: approver.fullName }
  });

  return approval;
}
