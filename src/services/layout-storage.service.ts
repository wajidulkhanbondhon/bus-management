/**
 * ATOMS Standard Bus Seat Layout & University Fare Presets Service
 * Provides the 6 official standard bus layouts (45, 40, 42, 36, 32, 28 seats)
 * and enables configuring fares, university tags, and saved presets.
 */

export interface FareRangeSegment {
  id: string;
  name: string;
  startRow: string;
  endRow: string;
  fare: number;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';
  zoneId?: string;
}

export interface StandardLayoutDefinition {
  id: string;
  key: '45_SEATS' | '40_SEATS' | '42_SEATS' | '36_SEATS' | '32_SEATS' | '28_SEATS';
  name: string;
  nameBn: string;
  totalSeats: number;
  totalRows: number;
  totalCols: number;
  description: string;
  descriptionBn: string;
  isDefault?: boolean;
}

export interface BusSeatLayoutPreset {
  id: string;
  layoutKey: '45_SEATS' | '40_SEATS' | '42_SEATS' | '36_SEATS' | '32_SEATS' | '28_SEATS';
  name: string;
  targetUniversity: string;
  totalSeats: number;
  totalRows: number;
  totalCols: number;
  baseFare: number;
  fareSegments: FareRangeSegment[];
  description?: string;
  isCustomPreset?: boolean;
  createdAt: string;
}

export const STANDARD_6_LAYOUTS: StandardLayoutDefinition[] = [
  {
    id: 'layout-std-45',
    key: '45_SEATS',
    name: '45 Seats Standard Coach (11 Rows, 2+2 + 5 Back)',
    nameBn: '৪৫ সিট (স্ট্যান্ডার্ড ২+২ লেআউট, সবচেয়ে জনপ্রিয়)',
    totalSeats: 45,
    totalRows: 11,
    totalCols: 5,
    description: '10 rows of 4 seats (40) + Row K 5 seats bench (45 total)',
    descriptionBn: '১০ সারি × ৪ = ৪০ সিট + শেষ সারিতে ৫টি সিট (মোট ৪৫ সিট)',
    isDefault: true
  },
  {
    id: 'layout-std-40',
    key: '40_SEATS',
    name: '40 Seats Standard Coach (10 Rows, 2+2)',
    nameBn: '৪০ সিট (স্ট্যান্ডার্ড ১০ সারি ২+২ কোচ)',
    totalSeats: 40,
    totalRows: 10,
    totalCols: 5,
    description: '10 rows of 4 seats (Rows A to J, 40 total)',
    descriptionBn: '১০ সারি × ৪ = ৪০ সিট (A থেকে J সারি, ২+২ প্যাটার্ন)',
    isDefault: false
  },
  {
    id: 'layout-std-42',
    key: '42_SEATS',
    name: '42 Seats Coach (10 Rows + 2 Rear Bench)',
    nameBn: '৪২ সিট (১০ সারি + পেছনের বেঞ্চ স্পেশাল)',
    totalSeats: 42,
    totalRows: 11,
    totalCols: 5,
    description: '10 rows of 4 (40) + 2 extra middle seats in rear (42 total)',
    descriptionBn: '১০ সারি × ৪ = ৪০ সিট + পেছনে অতিরিক্ত ২ সিট (মোট ৪২ সিট)',
    isDefault: false
  },
  {
    id: 'layout-std-36',
    key: '36_SEATS',
    name: '36 Seats Comfort Coach (9 Rows, 2+2)',
    nameBn: '৩৬ সিট (৯ সারি কমফোর্ট ২+২ কোচ)',
    totalSeats: 36,
    totalRows: 9,
    totalCols: 5,
    description: '9 rows of 4 seats (Rows A to I, 36 total)',
    descriptionBn: '৯ সারি × ৪ = ৩৬ সিট (A থেকে I সারি, আরামদায়ক লেগরুম)',
    isDefault: false
  },
  {
    id: 'layout-std-32',
    key: '32_SEATS',
    name: '32 Seats Executive Coach (8 Rows, 2+2)',
    nameBn: '৩২ সিট (৮ সারি এক্সিকিউটিভ কোচ)',
    totalSeats: 32,
    totalRows: 8,
    totalCols: 5,
    description: '8 rows of 4 seats (Rows A to H, 32 total)',
    descriptionBn: '৮ সারি × ৪ = ৩২ সিট (A থেকে H সারি, এক্সিকিউটিভ ক্লাস)',
    isDefault: false
  },
  {
    id: 'layout-std-28',
    key: '28_SEATS',
    name: '28 Seats Premium / VIP Coach (7 Rows, 2+2)',
    nameBn: '২৮ সিট (৭ সারি প্রিমিয়াম / ভিআইপি কোচ)',
    totalSeats: 28,
    totalRows: 7,
    totalCols: 5,
    description: '7 rows of 4 seats (Rows A to G, 28 total)',
    descriptionBn: '৭ সারি × ৪ = ২৮ সিট (A থেকে G সারি, সর্বোচ্চ আরামদায়ক)',
    isDefault: false
  }
];

export const DEFAULT_UNIVERSITY_LAYOUT_PRESETS: BusSeatLayoutPreset[] = [
  {
    id: 'preset-ru-45',
    layoutKey: '45_SEATS',
    name: 'রাজশাহী বিশ্ববিদ্যালয় (RU) স্পেশাল - ৪৫ সিট',
    targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
    totalSeats: 45,
    totalRows: 11,
    totalCols: 5,
    baseFare: 550,
    fareSegments: [
      { id: 'seg-ru-1', name: 'VIP Front (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' },
      { id: 'seg-ru-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 550, color: 'blue' },
      { id: 'seg-ru-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: 500, color: 'purple' },
      { id: 'seg-ru-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: 450, color: 'amber' }
    ],
    description: 'রাবি ভর্তি পরীক্ষা স্পেশাল ৪৫ সিট কোচ',
    isCustomPreset: false,
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'preset-du-40',
    layoutKey: '40_SEATS',
    name: 'ঢাকা বিশ্ববিদ্যালয় (DU) ডে এক্সপ্রেস - ৪০ সিট',
    targetUniversity: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
    totalSeats: 40,
    totalRows: 10,
    totalCols: 5,
    baseFare: 500,
    fareSegments: [
      { id: 'seg-du-1', name: 'Front VIP (A–D)', startRow: 'A', endRow: 'D', fare: 550, color: 'emerald' },
      { id: 'seg-du-2', name: 'Standard (E–J)', startRow: 'E', endRow: 'J', fare: 500, color: 'blue' }
    ],
    description: 'ঢাবি ডে এক্সপ্রেস ৪০ সিট স্ট্যান্ডার্ড কোচ',
    isCustomPreset: false,
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'preset-cu-45',
    layoutKey: '45_SEATS',
    name: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU) নাইট কোচ - ৪৫ সিট',
    targetUniversity: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
    totalSeats: 45,
    totalRows: 11,
    totalCols: 5,
    baseFare: 600,
    fareSegments: [
      { id: 'seg-cu-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' },
      { id: 'seg-cu-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 600, color: 'blue' },
      { id: 'seg-cu-3', name: 'Rear Economy (I–K)', startRow: 'I', endRow: 'K', fare: 550, color: 'purple' }
    ],
    description: 'চবি ভর্তি পরীক্ষা স্পেশাল ৪৫ সিট নাইট কোচ',
    isCustomPreset: false,
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'preset-gst-45',
    layoutKey: '45_SEATS',
    name: 'জিএসটি গুচ্ছ (GST) স্পেশাল - ৪৫ সিট',
    targetUniversity: 'জিএসটি গুচ্ছ (GST Cluster)',
    totalSeats: 45,
    totalRows: 11,
    totalCols: 5,
    baseFare: 550,
    fareSegments: [
      { id: 'seg-gst-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 600, color: 'emerald' },
      { id: 'seg-gst-2', name: 'Standard (F–K)', startRow: 'F', endRow: 'K', fare: 500, color: 'blue' }
    ],
    description: 'জিএসটি গুচ্ছ পরীক্ষা কেন্দ্র স্পেশাল কোচ',
    isCustomPreset: false,
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'preset-ju-36',
    layoutKey: '36_SEATS',
    name: 'জাহাঙ্গীরনগর (JU) শাটল বাস - ৩৬ সিট',
    targetUniversity: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)',
    totalSeats: 36,
    totalRows: 9,
    totalCols: 5,
    baseFare: 350,
    fareSegments: [
      { id: 'seg-ju-1', name: 'All Seats (A–I)', startRow: 'A', endRow: 'I', fare: 350, color: 'blue' }
    ],
    description: 'জাবি ভর্তি এক্সপ্রেস ৩৬ সিট শাটল কোচ',
    isCustomPreset: false,
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'preset-sust-45',
    layoutKey: '45_SEATS',
    name: 'সাস্ট সিলেট (SUST) এক্সপ্রেস - ৪৫ সিট',
    targetUniversity: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি (SUST)',
    totalSeats: 45,
    totalRows: 11,
    totalCols: 5,
    baseFare: 650,
    fareSegments: [
      { id: 'seg-sust-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 750, color: 'emerald' },
      { id: 'seg-sust-2', name: 'Standard (F–K)', startRow: 'F', endRow: 'K', fare: 650, color: 'blue' }
    ],
    description: 'সাস্ট সিলেট ভর্তি স্পেশাল ৪৫ সিট কোচ',
    isCustomPreset: false,
    createdAt: '2026-03-01T08:00:00.000Z'
  }
];

const ROW_LETTERS = 'ABCDEFGHIJKLMN';

/**
 * Generate seat cells for a given standard layout key and fare segments
 */
export function generateLayoutCells(
  layoutKey: StandardLayoutDefinition['key'],
  fareSegments: FareRangeSegment[] = [],
  fallbackBaseFare = 550
) {
  const stdDef = STANDARD_6_LAYOUTS.find(l => l.key === layoutKey) || STANDARD_6_LAYOUTS[0];
  const rows = stdDef.totalRows;
  const cols = stdDef.totalCols;

  const getFareForRow = (rowChar: string): number => {
    if (!fareSegments || fareSegments.length === 0) return fallbackBaseFare;
    const curIdx = ROW_LETTERS.indexOf(rowChar.toUpperCase());
    const matched = fareSegments.find(seg => {
      const sIdx = ROW_LETTERS.indexOf(seg.startRow.toUpperCase());
      const eIdx = ROW_LETTERS.indexOf(seg.endRow.toUpperCase());
      return curIdx >= sIdx && curIdx <= eIdx;
    });
    return matched ? matched.fare : fallbackBaseFare;
  };

  const getSegmentColorForRow = (rowChar: string): FareRangeSegment['color'] => {
    if (!fareSegments || fareSegments.length === 0) return 'blue';
    const curIdx = ROW_LETTERS.indexOf(rowChar.toUpperCase());
    const matched = fareSegments.find(seg => {
      const sIdx = ROW_LETTERS.indexOf(seg.startRow.toUpperCase());
      const eIdx = ROW_LETTERS.indexOf(seg.endRow.toUpperCase());
      return curIdx >= sIdx && curIdx <= eIdx;
    });
    return matched ? matched.color : 'blue';
  };

  const cells: Array<{
    rowIndex: number;
    colIndex: number;
    seatNumber: string;
    type: 'SEAT' | 'AISLE' | 'DRIVER' | 'DOOR' | 'EMPTY';
    genderRule: 'ANY' | 'FEMALE_ONLY' | 'MALE_ONLY';
    baseFare: number;
    color: FareRangeSegment['color'];
  }> = [];

  for (let r = 0; r < rows; r++) {
    const rowChar = ROW_LETTERS[r] || `R${r + 1}`;
    const rowFare = getFareForRow(rowChar);
    const rowColor = getSegmentColorForRow(rowChar);
    const isLastRow = r === rows - 1;

    for (let c = 0; c < cols; c++) {
      if (layoutKey === '45_SEATS' && isLastRow) {
        // Row K: 5 continuous seats K1, K2, K3 (middle aisle), K4, K5
        cells.push({
          rowIndex: r,
          colIndex: c,
          seatNumber: `${rowChar}${c + 1}`,
          type: 'SEAT',
          genderRule: 'ANY',
          baseFare: rowFare,
          color: rowColor
        });
      } else if (layoutKey === '42_SEATS' && isLastRow) {
        // Last row has 2 seats on ends, 1 in middle = total 42
        const isSeat = c !== 1 && c !== 3;
        cells.push({
          rowIndex: r,
          colIndex: c,
          seatNumber: isSeat ? `${rowChar}${c === 0 ? '1' : c === 2 ? '2' : '3'}` : '',
          type: isSeat ? 'SEAT' : 'AISLE',
          genderRule: 'ANY',
          baseFare: rowFare,
          color: rowColor
        });
      } else if (c === 2) {
        // Center Aisle
        cells.push({
          rowIndex: r,
          colIndex: c,
          seatNumber: '',
          type: 'AISLE',
          genderRule: 'ANY',
          baseFare: 0,
          color: 'blue'
        });
      } else {
        // 2+2 Seats (e.g. A1, A2, A3, A4)
        const seatLetter = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
        cells.push({
          rowIndex: r,
          colIndex: c,
          seatNumber: `${rowChar}${seatLetter}`,
          type: 'SEAT',
          genderRule: 'ANY',
          baseFare: rowFare,
          color: rowColor
        });
      }
    }
  }

  return cells;
}

const STORAGE_KEY = 'atoms_university_layout_presets';

/**
 * Get all stored layout presets (combines defaults + custom user university presets)
 */
export function getStoredLayoutPresets(): BusSeatLayoutPreset[] {
  if (typeof window === 'undefined') {
    return DEFAULT_UNIVERSITY_LAYOUT_PRESETS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_UNIVERSITY_LAYOUT_PRESETS));
      return DEFAULT_UNIVERSITY_LAYOUT_PRESETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored layout presets:', err);
  }
  return DEFAULT_UNIVERSITY_LAYOUT_PRESETS;
}

/**
 * Save or update a university layout preset
 */
export function saveStoredLayoutPreset(preset: BusSeatLayoutPreset): BusSeatLayoutPreset[] {
  const current = getStoredLayoutPresets();
  const existingIdx = current.findIndex(p => p.id === preset.id);

  let updated: BusSeatLayoutPreset[];
  if (existingIdx >= 0) {
    updated = current.map(p => (p.id === preset.id ? { ...preset } : p));
  } else {
    updated = [preset, ...current];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving layout preset:', err);
    }
  }
  return updated;
}

/**
 * Delete a layout preset
 */
export function deleteStoredLayoutPreset(presetId: string): BusSeatLayoutPreset[] {
  const current = getStoredLayoutPresets();
  const updated = current.filter(p => p.id !== presetId);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error deleting layout preset:', err);
    }
  }
  return updated;
}
