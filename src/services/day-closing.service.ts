import { fastApiClient } from '@/lib/api-client';

export interface MethodActualInput {
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  actualAmount: number;
}

export async function calculateDayClosingSummary(dateInput: string | Date) {
  const dateStr = typeof dateInput === 'string' ? dateInput : (dateInput ? dateInput.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  try {
    const res = await fastApiClient.getDayClosingSummary(dateStr);
    if (res.success && res.data) {
      return {
        date: new Date(dateStr),
        isClosed: res.data.is_closed || false,
        existingClosing: res.data.existing_closing || null,
        metrics: {
          expectedGrossSales: res.data.expected_gross_sales || res.data.metrics?.expectedGrossSales || 0,
          expectedDiscount: res.data.expected_discount || res.data.metrics?.expectedDiscount || 0,
          expectedNetSales: res.data.expected_net_sales || res.data.metrics?.expectedNetSales || 0,
          expectedCollected: res.data.expected_collected || res.data.metrics?.expectedCollected || 0,
          expectedDue: res.data.expected_due || res.data.metrics?.expectedDue || 0,
          expectedRefunds: res.data.expected_refunds || res.data.metrics?.expectedRefunds || 0,
          bookingCount: res.data.booking_count || res.data.metrics?.bookingCount || 0,
          paymentCount: res.data.payment_count || res.data.metrics?.paymentCount || 0
        },
        methods: res.data.methods || {
          BKASH: { expected: 0, count: 0, expectedAmount: 0 },
          NAGAD: { expected: 0, count: 0, expectedAmount: 0 },
          ROCKET: { expected: 0, count: 0, expectedAmount: 0 },
          HAND_CASH: { expected: 0, count: 0, expectedAmount: 0 },
          BANK_TRANSFER: { expected: 0, count: 0, expectedAmount: 0 },
          OTHER: { expected: 0, count: 0, expectedAmount: 0 }
        },
        methodSummaries: res.data.method_summaries || res.data.methodSummaries || {
          BKASH: { expectedAmount: 0, paymentCount: 0 },
          NAGAD: { expectedAmount: 0, paymentCount: 0 },
          ROCKET: { expectedAmount: 0, paymentCount: 0 },
          HAND_CASH: { expectedAmount: 0, paymentCount: 0 },
          BANK_TRANSFER: { expectedAmount: 0, paymentCount: 0 },
          OTHER: { expectedAmount: 0, paymentCount: 0 }
        }
      };
    }
  } catch (err) {
    console.warn('Day closing API warning:', err);
  }

  return {
    date: new Date(dateStr),
    isClosed: false,
    existingClosing: null,
    metrics: {
      expectedGrossSales: 0,
      expectedDiscount: 0,
      expectedNetSales: 0,
      expectedCollected: 0,
      expectedDue: 0,
      expectedRefunds: 0,
      bookingCount: 0,
      paymentCount: 0
    },
    methods: {
      BKASH: { expected: 0, count: 0, expectedAmount: 0 },
      NAGAD: { expected: 0, count: 0, expectedAmount: 0 },
      ROCKET: { expected: 0, count: 0, expectedAmount: 0 },
      HAND_CASH: { expected: 0, count: 0, expectedAmount: 0 },
      BANK_TRANSFER: { expected: 0, count: 0, expectedAmount: 0 },
      OTHER: { expected: 0, count: 0, expectedAmount: 0 }
    },
    methodSummaries: {
      BKASH: { expectedAmount: 0, paymentCount: 0 },
      NAGAD: { expectedAmount: 0, paymentCount: 0 },
      ROCKET: { expectedAmount: 0, paymentCount: 0 },
      HAND_CASH: { expectedAmount: 0, paymentCount: 0 },
      BANK_TRANSFER: { expectedAmount: 0, paymentCount: 0 },
      OTHER: { expectedAmount: 0, paymentCount: 0 }
    }
  };
}

export async function submitDayClosing(data: any, staffId?: string) {
  try {
    const res = await fastApiClient.submitDayClosing(data);
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit day closing' };
  }
}

export async function reopenDayClosing(id: string, reason: string, staffId?: string) {
  try {
    const res = await fastApiClient.post(`/day-closing/${id}/reopen`, { reason });
    return res;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
