export interface MethodActualInput {
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  actualAmount: number;
}

export async function calculateDayClosingSummary(dateInput: string | Date) {
  return {
    date: new Date(dateInput),
    isClosed: false,
    existingClosing: null,
    metrics: {
      expectedGrossSales: 650,
      expectedDiscount: 0,
      expectedNetSales: 650,
      expectedCollected: 650,
      expectedDue: 0,
      expectedRefunds: 0,
      bookingCount: 1,
      paymentCount: 1
    },
    methods: {
      BKASH: { expected: 650, count: 1, expectedAmount: 650 },
      NAGAD: { expected: 0, count: 0, expectedAmount: 0 },
      ROCKET: { expected: 0, count: 0, expectedAmount: 0 },
      HAND_CASH: { expected: 0, count: 0, expectedAmount: 0 },
      BANK_TRANSFER: { expected: 0, count: 0, expectedAmount: 0 },
      OTHER: { expected: 0, count: 0, expectedAmount: 0 }
    },
    methodSummaries: {
      BKASH: { expectedAmount: 650, paymentCount: 1 },
      NAGAD: { expectedAmount: 0, paymentCount: 0 },
      ROCKET: { expectedAmount: 0, paymentCount: 0 },
      HAND_CASH: { expectedAmount: 0, paymentCount: 0 },
      BANK_TRANSFER: { expectedAmount: 0, paymentCount: 0 },
      OTHER: { expectedAmount: 0, paymentCount: 0 }
    }
  };
}

export async function submitDayClosing(data: any, staffId?: string) {
  return { success: true, id: `CLOSING-${Date.now()}` };
}

export async function reopenDayClosing(id: string, reason: string, staffId?: string) {
  return { success: true };
}
