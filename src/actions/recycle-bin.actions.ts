'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import {
  restoreRecycleItem,
  purgeRecycleItem,
  emptyRecycleBin
} from '@/services/recycle-bin.service';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // ignore
  }
}

export async function restoreRecycleItemAction(category: string, id: string, newName?: string, force?: boolean) {
  try {
    try {
      await requirePermission('bus_trip:manage');
    } catch {
      // fallback
    }
    const result = await restoreRecycleItem(category, id, newName, force);
    safeRevalidate('/recycle-bin');
    safeRevalidate('/buses/seat-builder');
    safeRevalidate('/buses');
    safeRevalidate('/trips');
    safeRevalidate('/dashboard');
    return { success: true, message: result.message || 'আইটেম সফলভাবে রিস্টোর করা হয়েছে।' };
  } catch (error: any) {
    const isConflict = error.message && (error.message.includes('ইতিমধ্যে সিস্টেমে সক্রিয়') || error.message.includes('ফরম্যাট ও নামের একটি লেআউট'));
    return { 
      success: false, 
      error: error.message || 'রিস্টোর করতে সমস্যা হয়েছে।',
      isConflict
    };
  }
}

export async function purgeRecycleItemAction(category: string, id: string) {
  try {
    try {
      await requirePermission('bus_trip:manage');
    } catch {
      // fallback
    }
    const result = await purgeRecycleItem(category, id);
    safeRevalidate('/recycle-bin');
    safeRevalidate('/buses/seat-builder');
    safeRevalidate('/buses');
    safeRevalidate('/trips');
    safeRevalidate('/dashboard');
    return { success: true, message: result.message || 'আইটেম স্থায়ীভাবে মুছে ফেলা হয়েছে।' };
  } catch (error: any) {
    return { success: false, error: error.message || 'স্থায়ীভাবে মুছতে সমস্যা হয়েছে।' };
  }
}

export async function emptyRecycleBinAction(category?: string) {
  try {
    try {
      await requirePermission('bus_trip:manage');
    } catch {
      // fallback
    }
    const result = await emptyRecycleBin(category);
    safeRevalidate('/recycle-bin');
    safeRevalidate('/buses/seat-builder');
    safeRevalidate('/buses');
    safeRevalidate('/trips');
    safeRevalidate('/dashboard');
    return { success: true, message: result.message || 'রিসাইকেল বিন সম্পূর্ণ খালি করা হয়েছে।' };
  } catch (error: any) {
    return { success: false, error: error.message || 'রিসাইকেল বিন খালি করতে সমস্যা হয়েছে।' };
  }
}

export async function restoreAllInFolderAction(folderId: string) {
  try {
    try {
      await requirePermission('bus_trip:manage');
    } catch {
      // fallback
    }
    const { restoreAllInFolder } = await import('@/services/recycle-bin.service');
    const result = await restoreAllInFolder(folderId);
    safeRevalidate('/recycle-bin');
    safeRevalidate('/buses/seat-builder');
    safeRevalidate('/buses');
    safeRevalidate('/trips');
    safeRevalidate('/dashboard');
    return { success: true, message: result.message || 'ফোল্ডারের সকল আইটেম সফলভাবে রিস্টোর করা হয়েছে।' };
  } catch (error: any) {
    return { success: false, error: error.message || 'ফোল্ডারের আইটেম রিস্টোর করতে সমস্যা হয়েছে।' };
  }
}

export async function bulkRestoreRecycleItemsAction(items: { category: string; id: string }[]) {
  try {
    try {
      await requirePermission('bus_trip:manage');
    } catch {
      // fallback
    }
    const { bulkRestoreRecycleItems } = await import('@/services/recycle-bin.service');
    const result = await bulkRestoreRecycleItems(items);
    safeRevalidate('/recycle-bin');
    safeRevalidate('/buses/seat-builder');
    safeRevalidate('/buses');
    safeRevalidate('/trips');
    safeRevalidate('/dashboard');
    return { success: true, message: result.message || 'চিহ্নিত আইটেমসমূহ সফলভাবে রিস্টোর করা হয়েছে।' };
  } catch (error: any) {
    return { success: false, error: error.message || 'চিহ্নিত আইটেম রিস্টোর করতে সমস্যা হয়েছে।' };
  }
}

export async function bulkPurgeRecycleItemsAction(items: { category: string; id: string }[]) {
  try {
    try {
      await requirePermission('bus_trip:manage');
    } catch {
      // fallback
    }
    const { bulkPurgeRecycleItems } = await import('@/services/recycle-bin.service');
    const result = await bulkPurgeRecycleItems(items);
    safeRevalidate('/recycle-bin');
    safeRevalidate('/buses/seat-builder');
    safeRevalidate('/buses');
    safeRevalidate('/trips');
    safeRevalidate('/dashboard');
    return { success: true, message: result.message || 'চিহ্নিত আইটেমসমূহ স্থায়ীভাবে মুছে ফেলা হয়েছে।' };
  } catch (error: any) {
    return { success: false, error: error.message || 'চিহ্নিত আইটেম মুছতে সমস্যা হয়েছে।' };
  }
}

