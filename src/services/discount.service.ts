export function calculateDiscountAmount(
  grossAmount: number,
  discountType: 'FIXED' | 'PERCENTAGE',
  discountRate: number
): number {
  if (discountType === 'PERCENTAGE') {
    return Math.min(grossAmount, (grossAmount * discountRate) / 100);
  }
  return Math.min(grossAmount, discountRate);
}

export async function applyDiscount(data: any, staffId: string) {
  return { success: true, id: `DISC-${Date.now()}` };
}

export async function approveDiscount(data: any, managerId: string) {
  return { success: true };
}
