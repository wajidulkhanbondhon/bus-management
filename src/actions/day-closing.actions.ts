'use server';

import { submitDayClosing, reopenDayClosing, MethodActualInput } from '@/services/day-closing.service';
import { requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function submitDayClosingAction(data: {
  closingDate: string | Date;
  actualTotalCash: number;
  methodActuals: MethodActualInput[];
  notes?: string;
}) {
  try {
    const user = await requirePermission('day_closing:close');
    const result = await submitDayClosing({
      closingDate: data.closingDate,
      closedById: user.id,
      actualTotalCash: data.actualTotalCash,
      methodActuals: data.methodActuals,
      notes: data.notes
    });

    revalidatePath('/day-closing');
    revalidatePath('/dashboard');
    return { success: true, dayClosing: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to close business day' };
  }
}

export async function reopenDayAction(dayClosingId: string, reason: string) {
  try {
    const user = await requirePermission('day_closing:reopen');
    const result = await reopenDayClosing(dayClosingId, user.id, reason);
    revalidatePath('/day-closing');
    revalidatePath('/dashboard');
    return { success: true, dayClosing: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reopen business day' };
  }
}
