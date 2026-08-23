'use server';

import { searchGlobal, GlobalSearchResult } from '@/services/search.service';

export async function searchGlobalAction(query: string): Promise<GlobalSearchResult> {
  try {
    return await searchGlobal(query);
  } catch (error) {
    console.error('Search error:', error);
    return {
      buses: [],
      bookings: [],
      trips: [],
      students: [],
      payments: []
    };
  }
}
