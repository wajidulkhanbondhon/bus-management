'use client';

export interface UniversityItem {
  id: string;
  nameBn: string;
  nameEn: string;
  cluster: 'GENERAL' | 'ENGG' | 'AGRI' | 'MED' | 'SCIENCE_TECH' | 'PRIVATE' | 'SPECIAL' | 'OTHER';
  district?: string;
  isCustom?: boolean;
}

export const DEFAULT_UNIVERSITIES: UniversityItem[] = [
  { id: 'RU', nameBn: 'রাজশাহী বিশ্ববিদ্যালয় (RU)', nameEn: 'Rajshahi University (RU)', cluster: 'GENERAL', district: 'রাজশাহী' },
  { id: 'DU', nameBn: 'ঢাকা বিশ্ববিদ্যালয় (DU)', nameEn: 'Dhaka University (DU)', cluster: 'GENERAL', district: 'ঢাকা' },
  { id: 'CU', nameBn: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)', nameEn: 'Chittagong University (CU)', cluster: 'GENERAL', district: 'চট্টগ্রাম' },
  { id: 'JU', nameBn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)', nameEn: 'Jahangirnagar University (JU)', cluster: 'GENERAL', district: 'সাভার, ঢাকা' },
  { id: 'GST', nameBn: 'জিএসটি গুচ্ছ (GST Cluster - ২৪ বিশ্ববিদ্যালয়)', nameEn: 'GST Cluster (24 Universities)', cluster: 'GENERAL', district: 'সারাদেশ' },
  { id: 'BUET', nameBn: 'বুয়েট (BUET)', nameEn: 'BUET Engineering', cluster: 'ENGG', district: 'ঢাকা' },
  { id: 'ENGG', nameBn: 'ইঞ্জিনিয়ারিং গুচ্ছ (RUET, CUET, KUET)', nameEn: 'Engg Cluster (CKRUET)', cluster: 'ENGG', district: 'রাজশাহী/খুলনা/চট্টগ্রাম' },
  { id: 'KUET', nameBn: 'কুয়েট খুলনা (KUET)', nameEn: 'KUET Khulna', cluster: 'ENGG', district: 'খুলনা' },
  { id: 'RUET', nameBn: 'রুয়েট রাজশাহী (RUET)', nameEn: 'RUET Rajshahi', cluster: 'ENGG', district: 'রাজশাহী' },
  { id: 'CUET', nameBn: 'চুয়েট চট্টগ্রাম (CUET)', nameEn: 'CUET Chittagong', cluster: 'ENGG', district: 'চট্টগ্রাম' },
  { id: 'SUST', nameBn: 'সাস্ট সিলেট (SUST)', nameEn: 'SUST Sylhet', cluster: 'SCIENCE_TECH', district: 'সিলেট' },
  { id: 'AGRI', nameBn: 'কৃষি গুচ্ছ (Agri Cluster - ৯ বিশ্ববিদ্যালয়)', nameEn: 'Agri Universities Cluster', cluster: 'AGRI', district: 'সারাদেশ' },
  { id: 'BAU', nameBn: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (BAU)', nameEn: 'BAU Mymensingh', cluster: 'AGRI', district: 'ময়মনসিংহ' },
  { id: 'MED', nameBn: 'মেডিকেল ও ডেন্টাল (Medical & Dental)', nameEn: 'Medical & Dental Colleges', cluster: 'MED', district: 'সারাদেশ' },
  { id: 'JNU', nameBn: 'জগন্নাথ বিশ্ববিদ্যালয় (JnU)', nameEn: 'Jagannath University (JnU)', cluster: 'GENERAL', district: 'ঢাকা' },
  { id: 'BUP', nameBn: 'বিইউপি (BUP)', nameEn: 'Bangladesh University of Professionals (BUP)', cluster: 'SPECIAL', district: 'মিরপুর, ঢাকা' },
  { id: 'IU', nameBn: 'ইসলামী বিশ্ববিদ্যালয় কুষ্টিয়া (IU)', nameEn: 'Islamic University (IU)', cluster: 'GENERAL', district: 'কুষ্টিয়া' },
  { id: 'COU', nameBn: 'কুমিল্লা বিশ্ববিদ্যালয় (CoU)', nameEn: 'Comilla University (CoU)', cluster: 'GENERAL', district: 'কুমিল্লা' },
  { id: 'BRUR', nameBn: 'বেগম রোকেয়া বিশ্ববিদ্যালয় (BRUR)', nameEn: 'Begum Rokeya University (BRUR)', cluster: 'GENERAL', district: 'রংপুর' },
  { id: 'PSTU', nameBn: 'পটুয়াখালী বিজ্ঞান ও প্রযুক্তি (PSTU)', nameEn: 'Patuakhali Science & Tech Univ (PSTU)', cluster: 'SCIENCE_TECH', district: 'পটুয়াখালী' },
  { id: 'HSTU', nameBn: 'হাজী দানেশ বিজ্ঞান ও প্রযুক্তি (HSTU)', nameEn: 'Hajee Danesh Science & Tech (HSTU)', cluster: 'SCIENCE_TECH', district: 'দিনাজপুর' },
  { id: 'MBSTU', nameBn: 'মওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি (MBSTU)', nameEn: 'Mawlana Bhashani Science & Tech (MBSTU)', cluster: 'SCIENCE_TECH', district: 'টাঙ্গাইল' },
  { id: 'NSTU', nameBn: 'নোয়াখালী বিজ্ঞান ও প্রযুক্তি (NSTU)', nameEn: 'Noakhali Science & Tech Univ (NSTU)', cluster: 'SCIENCE_TECH', district: 'নোয়াখালী' },
  { id: 'JUST', nameBn: 'যশোর বিজ্ঞান ও প্রযুক্তি (JUST)', nameEn: 'Jashore Science & Tech Univ (JUST)', cluster: 'SCIENCE_TECH', district: 'যশোর' },
  { id: 'BSMRSTU', nameBn: 'বশেমুরবিপ্রবি গোপালগঞ্জ (BSMRSTU)', nameEn: 'Bangabandhu Science & Tech (BSMRSTU)', cluster: 'SCIENCE_TECH', district: 'গোপালগঞ্জ' }
];

const STORAGE_KEY = 'custom_universities_v1';

export function getStoredUniversities(): UniversityItem[] {
  if (typeof window === 'undefined') return DEFAULT_UNIVERSITIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UNIVERSITIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored universities', e);
  }
  return DEFAULT_UNIVERSITIES;
}

export function saveStoredUniversities(universities: UniversityItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(universities));
  } catch (e) {
    console.error('Failed to save universities', e);
  }
}

export function addStoredUniversity(newUni: UniversityItem): UniversityItem[] {
  const current = getStoredUniversities();
  let uniqueId = newUni.id.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
  if (!uniqueId) {
    uniqueId = `UNI_${Date.now().toString().slice(-4)}`;
  }

  const existingIdx = current.findIndex(u => u.id.toUpperCase() === uniqueId);
  let updated: UniversityItem[];
  if (existingIdx > -1) {
    updated = current.map((u, idx) => idx === existingIdx ? { ...newUni, id: uniqueId, isCustom: true } : u);
  } else {
    updated = [{ ...newUni, id: uniqueId, isCustom: true }, ...current];
  }

  saveStoredUniversities(updated);
  return updated;
}

export function deleteStoredUniversity(id: string): UniversityItem[] {
  const current = getStoredUniversities();
  const updated = current.filter(u => u.id !== id);
  saveStoredUniversities(updated);
  return updated;
}
