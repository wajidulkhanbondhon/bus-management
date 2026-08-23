'use client';

export const DEFAULT_COMPANIES = [
  'দেশ ট্রাভেলস (Desh Travels)',
  'শ্যামলী এন.আর ট্রাভেলস (Shyamoli N.R)',
  'হানিফ এন্টারপ্রাইজ (Hanif Enterprise)',
  'গ্রিন লাইন পরিবহন (Green Line)',
  'একতা পরিবহন (Ekota Paribahan)',
  'সেন্টমার্টিন ট্রাভেলস (Saintmartin Travels)',
  'রিল্যাক্স পরিবহন (Relax Paribahan)',
  'বাবলু এন্টারপ্রাইজ (Bablu Enterprise)',
  'সোহাগ পরিবহন (Shohagh Paribahan)',
  'এনা ট্রান্সপোর্ট (Ena Transport)'
];

const STORAGE_KEY = 'custom_bus_companies_v1';

export function getStoredCompanies(): string[] {
  if (typeof window === 'undefined') return DEFAULT_COMPANIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored companies', e);
  }
  return DEFAULT_COMPANIES;
}

export function saveStoredCompanies(companies: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  } catch (e) {
    console.error('Failed to save companies', e);
  }
}
