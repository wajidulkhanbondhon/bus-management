import { fastApiClient } from '@/lib/api-client';

export interface RecycleBinFolder {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  color: string;
  badgeColor: string;
  count: number;
}

export interface RecycleBinSummary {
  total: number;
  counts: Record<string, number>;
  folders: RecycleBinFolder[];
}

export interface RecycleBinItem {
  id: string;
  folderId: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  title: string;
  subtitle: string;
  regNumber?: string;
  notes?: string;
  status: string;
  deletedAt: string;
  canRestore: boolean;
  canPurge: boolean;
}

export async function fetchRecycleBinSummary(): Promise<RecycleBinSummary> {
  const res = await fastApiClient.getRecycleBinSummary();
  if (res.success && res.data) {
    return {
      total: res.data.total || 0,
      counts: res.data.counts || {},
      folders: res.data.folders || []
    };
  }
  return { total: 0, counts: {}, folders: [] };
}

export async function fetchRecycleBinItems(folder?: string, search?: string): Promise<RecycleBinItem[]> {
  const res = await fastApiClient.getRecycleBinItems(folder, search);
  if (res.success && res.data && Array.isArray(res.data.items)) {
    return res.data.items;
  }
  return [];
}

export async function restoreRecycleItem(category: string, id: string, newName?: string, force?: boolean) {
  const res = await fastApiClient.restoreRecycleItem(category, id, newName, force);
  if (res.success) {
    return res.data || { success: true };
  }
  throw new Error(res.error || 'Failed to restore item');
}

export async function purgeRecycleItem(category: string, id: string) {
  const res = await fastApiClient.purgeRecycleItem(category, id);
  if (res.success) {
    return res.data || { success: true };
  }
  throw new Error(res.error || 'Failed to permanently delete item');
}

export async function emptyRecycleBin(category?: string) {
  const res = await fastApiClient.emptyRecycleBin(category);
  if (res.success) {
    return res.data || { success: true };
  }
  throw new Error(res.error || 'Failed to empty recycle bin');
}

export async function restoreAllInFolder(folderId: string) {
  const res = await fastApiClient.restoreAllInFolder(folderId);
  if (res.success) {
    return res.data || { success: true };
  }
  throw new Error(res.error || 'Failed to restore all items in folder');
}

export async function bulkRestoreRecycleItems(items: { category: string; id: string }[]) {
  const res = await fastApiClient.bulkRestoreRecycleItems(items);
  if (res.success) {
    return res.data || { success: true };
  }
  throw new Error(res.error || 'Failed to restore selected items');
}

export async function bulkPurgeRecycleItems(items: { category: string; id: string }[]) {
  const res = await fastApiClient.bulkPurgeRecycleItems(items);
  if (res.success) {
    return res.data || { success: true };
  }
  throw new Error(res.error || 'Failed to permanently delete selected items');
}
