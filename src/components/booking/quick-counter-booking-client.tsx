'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bus,
  Zap,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Ticket,
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Tag,
  AlertCircle,
  X,
  Armchair,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingSummarySidebar, SelectedSeatItem, SeatPassengerDetail, GUARDIAN_RELATIONSHIPS } from './booking-summary-sidebar';
import { adjacentPartners } from '@/services/rules.service';
import { createBookingAction } from '@/actions/booking.actions';
import { formatCurrency, formatDate, formatTime, cleanAndLimitPhoneNumber, isValidBdMobile } from '@/lib/utils';
import { useApp } from '@/lib/context';
import { matchTripUniversityCode, getTripUniversityAndUnit } from './trip-selection-step';
import { lookupPassengerByPhone, recordPassengerInDirectory } from '@/services/passenger-directory.service';

interface Props {
  trips: any[];
  initialTripId?: string;
  currentUser?: any;
  recentPassengers?: any[];
}

/**
 * Domain rule: Only trips whose booking is currently running ("বুকিং চলছে") are allowed.
 * Completed, cancelled, arrived, closed, full, or past trips ("যে গুলো হয়ে গেছে, বা পরে হবে") are excluded.
 */
export function isTripBookingRunning(t: any): boolean {
  if (!t) return false;
  const busStatus = (t.bus?.status || 'ACTIVE').toUpperCase();
  if (busStatus !== 'ACTIVE') return false;

  const tripStatus = (t.status || 'SCHEDULED').toUpperCase();
  if (['COMPLETED', 'CANCELLED', 'ARRIVED', 'CLOSED', 'EXPIRED', 'DRAFT', 'PENDING', 'INACTIVE', 'MAINTENANCE'].includes(tripStatus)) {
    return false;
  }

  const totalSeats = t.stats?.totalSeats || t.bus?.capacity || 45;
  const bookedCount = t.stats?.bookedCount || 0;
  const availableCount = t.stats?.availableCount ?? Math.max(0, totalSeats - bookedCount);
  const soldPct = t.stats?.soldPercentage ?? (totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0);
  if (availableCount <= 0 || soldPct >= 100) {
    return false;
  }

  const dep = t.departureDate || t.departure_date;
  if (dep) {
    try {
      const depDateOnly = new Date(dep).toISOString().split('T')[0];
      const todayDateOnly = new Date().toISOString().split('T')[0];
      if (depDateOnly < todayDateOnly) {
        return false;
      }
    } catch {}
  }

  return true;
}

/**
 * Translates backend / validation / network error string to clear, friendly Bengali.
 */
export function translateErrorMessageToBn(errorMsg?: string | null): string {
  if (!errorMsg) return 'বুকিং সম্পন্ন করতে ব্যর্থ হয়েছে। অনুগ্রহ করে তথ্য যাচাই করে আবার চেষ্টা করুন।';
  const msg = errorMsg.trim();
  const lower = msg.toLowerCase();

  if (lower.includes('already booked') || lower.includes('is booked') || lower.includes('seat unavailable')) {
    return 'দুঃখিত, আপনার নির্বাচিত আসনের মধ্যে কোনো একটি ইতোমধ্যে বুক হয়ে গেছে। অনুগ্রহ করে অন্য আসন নির্বাচন করুন।';
  }
  if (lower.includes('locked') || lower.includes('held')) {
    return 'নির্বাচিত আসনটি বর্তমানে সাময়িকভাবে সংরক্ষিত বা অন্য কাউন্টার থেকে লক করা আছে।';
  }
  if (lower.includes('phone') && (lower.includes('invalid') || lower.includes('11') || lower.includes('digit') || lower.includes('must'))) {
    return 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।';
  }
  if (lower.includes('name') && (lower.includes('required') || lower.includes('invalid'))) {
    return 'যাত্রীর নাম প্রদান করা আবশ্যক।';
  }
  if (lower.includes('seat') && (lower.includes('required') || lower.includes('at least') || lower.includes('select'))) {
    return 'অনুগ্রহ করে অন্তত একটি আসন নির্বাচন করুন।';
  }
  if (lower.includes('trip') && (lower.includes('not found') || lower.includes('invalid') || lower.includes('required'))) {
    return 'বাস বা ট্রিপ নির্বাচন করা আবশ্যক।';
  }
  if (lower.includes('paid amount') || lower.includes('exceed')) {
    return 'পরিশোধের পরিমাণ সর্বমোট প্রদেয় টাকার চেয়ে বেশি হতে পারে না।';
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('connection')) {
    return 'সার্ভারের সাথে সংযোগ পাওয়া যায়নি। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।';
  }
  if (lower.includes('internal server') || lower.includes('500') || lower.includes('server error')) {
    return 'সার্ভারে অভ্যন্তরীণ সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।';
  }
  if (lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('401') || lower.includes('403')) {
    return 'এই কাজটি করার অনুমতি আপনার নেই। লগইন অবস্থা যাচাই করুন।';
  }

  // If already in Bengali, keep it
  const hasBengali = /[\u0980-\u09FF]/.test(msg);
  if (hasBengali) {
    return msg;
  }

  return `বুকিং সম্পন্ন করা যায়নি: ${msg}`;
}

export function QuickCounterBookingClient({ trips, initialTripId, currentUser, recentPassengers = [] }: Props) {
  const router = useRouter();
  const { language } = useApp();
  const { success: toastSuccess, error: toastError } = useToast();

  // Filter only trips where booking is currently running
  const runningTrips = useMemo(() => {
    return (trips || []).filter(isTripBookingRunning);
  }, [trips]);

  // Group running trips by University
  const universityList = useMemo(() => {
    const uniMap = new Map<string, { code: string; nameBn: string; trips: any[] }>();

    runningTrips.forEach((t) => {
      const code = matchTripUniversityCode(t);
      const uniInfo = getTripUniversityAndUnit(t);
      const nameBn = uniInfo?.nameBn || t.targetUniversity || code;

      if (!uniMap.has(code)) {
        uniMap.set(code, { code, nameBn, trips: [] });
      }
      uniMap.get(code)!.trips.push(t);
    });

    return Array.from(uniMap.values());
  }, [runningTrips]);

  // Selected Target University State
  const [selectedUniversityCode, setSelectedUniversityCode] = useState<string>(() => {
    if (initialTripId) {
      const found = runningTrips.find((t) => t.id === initialTripId);
      if (found) return matchTripUniversityCode(found);
    }
    const firstTrip = runningTrips[0];
    return firstTrip ? matchTripUniversityCode(firstTrip) : (universityList[0]?.code || '');
  });

  // Trip selection state (within selected university)
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    if (initialTripId && runningTrips.some((t) => t.id === initialTripId)) {
      return initialTripId;
    }
    return runningTrips[0]?.id || '';
  });

  // Handle Target University change
  const handleUniversityChange = (code: string) => {
    setSelectedUniversityCode(code);
    if (!code) {
      setSelectedTripId('');
      return;
    }
    const matchingBuses = runningTrips.filter((t) => matchTripUniversityCode(t) === code);
    if (matchingBuses.length > 0) {
      setSelectedTripId(matchingBuses[0].id);
    } else {
      setSelectedTripId('');
    }
  };

  // Buses available for selected university right now
  const universityBuses = useMemo(() => {
    if (!selectedUniversityCode) return [];
    return runningTrips.filter((t) => matchTripUniversityCode(t) === selectedUniversityCode);
  }, [runningTrips, selectedUniversityCode]);

  // Ensure selectedTripId is synchronized with universityBuses
  useEffect(() => {
    if (universityBuses.length > 0) {
      const exists = universityBuses.some((t) => t.id === selectedTripId);
      if (!exists) {
        setSelectedTripId(universityBuses[0].id);
      }
    } else if (selectedUniversityCode) {
      setSelectedTripId('');
    }
  }, [universityBuses, selectedTripId, selectedUniversityCode]);

  // Seat selection states (Regular seats ONLY; extra seats excluded)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [tripSeats, setTripSeats] = useState<any[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Multi-seat passenger details state: mapped by seatId
  const [passengersBySeat, setPassengersBySeat] = useState<Record<string, SeatPassengerDetail>>({});

  // Form states (kept as fallbacks)
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerGender, setPassengerGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [isStudent, setIsStudent] = useState(true);
  const [studentAdmissionId, setStudentAdmissionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('HAND_CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueAmount, setDueAmount] = useState<number>(0);
  const [isPayOnBus, setIsPayOnBus] = useState<boolean>(false);
  const [duePromiseDate, setDuePromiseDate] = useState<string>('');
  const [dueNote, setDueNote] = useState<string>('');
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Passenger Auto-suggestion state
  const [suggestedPassenger, setSuggestedPassenger] = useState<any | null>(null);

  // Pricing & Organization Defaults
  const [processingFee, setProcessingFee] = useState<number>(0);
  const [vatTaxAmount, setVatTaxAmount] = useState<number>(0);
  const [cashoutCharge, setCashoutCharge] = useState<number>(0);

  // Confirmed booking modal/alert data
  const [confirmedBookingData, setConfirmedBookingData] = useState<any | null>(null);

  // Load fee settings from organization defaults
  useEffect(() => {
    try {
      const orgSettings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('atoms_organization_settings') || '{}') : {};
      if (orgSettings?.finance) {
        if (orgSettings.finance.defaultProcessingFee !== undefined) {
          setProcessingFee(Number(orgSettings.finance.defaultProcessingFee) || 0);
        }
        if (orgSettings.finance.taxCalculationType === 'FIXED' && orgSettings.finance.taxFixedAmount !== undefined) {
          setVatTaxAmount(Number(orgSettings.finance.taxFixedAmount) || 0);
        }
        if (orgSettings.finance.autoApplyMfsCashout) {
          if (orgSettings.finance.mfsCashoutCalculationType === 'FIXED' && orgSettings.finance.defaultMfsCashoutFixed !== undefined) {
            setCashoutCharge(Number(orgSettings.finance.defaultMfsCashoutFixed) || 0);
          }
        }
      }
    } catch {}
  }, []);

  // Current active trip
  const activeTrip = useMemo(() => {
    if (selectedTripId) {
      const found = runningTrips.find((t) => t.id === selectedTripId);
      if (found) return found;
    }
    return universityBuses[0] || runningTrips[0] || null;
  }, [runningTrips, selectedTripId, universityBuses]);

  // Extract human-readable details from active trip
  const activeBusInfo = useMemo(() => {
    if (!activeTrip) return null;
    const bus = activeTrip.bus || {};
    const route = activeTrip.route || {};
    const busNumber = bus.busNumber || bus.bus_number || 'COACH';
    const busName = bus.busName || bus.bus_name || `বাস ${busNumber}`;
    const targetUni = activeTrip.targetUniversity || bus.targetUniversity || route.destination || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';
    const examUnit = activeTrip.examUnit || bus.examUnit || 'A Unit';
    const uniqueCode = activeTrip.uniqueCode || bus.uniqueCode || 'ATOMS-BUS';
    const origin = route.origin || 'ঢাকা';
    const destination = route.destination || targetUni;
    const routeName = route.routeName || route.route_name || `${origin} ➔ ${destination}`;
    const depDate = activeTrip.departureDate || activeTrip.departure_date || new Date().toISOString();
    const depTime = activeTrip.departureTime || activeTrip.departure_time || '22:30';
    const basePrice = Number(activeTrip.basePrice ?? activeTrip.base_price ?? 550);
    const capacity = Number(bus.capacity) || 45;
    const busType = activeTrip.tripBusType || activeTrip.trip_bus_type || bus.busType || bus.bus_type || 'MIXED';

    return {
      busNumber,
      busName,
      targetUni,
      examUnit,
      uniqueCode,
      origin,
      destination,
      routeName,
      depDate,
      depTime,
      basePrice,
      capacity,
      busType,
    };
  }, [activeTrip]);

  // Helper to generate fallback standard 45 seats (NO extra seats)
  const generateFallbackSeats = useCallback((tId: string) => {
    const defaultCapacity = activeBusInfo?.capacity || 45;
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    const seats: any[] = [];
    let count = 0;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const rowChar = rows[rIdx];
      const isLastRow = (rIdx === rows.length - 1) && defaultCapacity >= 45;
      const cols = isLastRow ? 5 : 4;

      for (let c = 1; c <= cols; c++) {
        if (count >= defaultCapacity) break;
        const seatNum = `${rowChar}${c}`;
        seats.push({
          seatId: `seat-${tId}-${seatNum}`,
          seat_id: `seat-${tId}-${seatNum}`,
          seatNumber: seatNum,
          seat_number: seatNum,
          rowIndex: rIdx,
          colIndex: c - 1,
          seatType: rIdx < 2 ? 'VIP' : 'STANDARD',
          genderAllowed: 'ANY',
          fare: activeTrip?.basePrice || (rIdx < 2 ? 650 : 550),
          status: 'AVAILABLE',
          passengerName: '',
          passengerPhone: ''
        });
        count++;
      }
    }
    setTripSeats(seats);
  }, [activeBusInfo?.capacity, activeTrip?.basePrice]);

  // Default due promise date to departure date of active trip
  useEffect(() => {
    if (activeTrip) {
      const dep = activeTrip.departureDate || activeTrip.departure_date;
      if (dep) {
        try {
          const dStr = new Date(dep).toISOString().split('T')[0];
          setDuePromiseDate(dStr);
        } catch {
          setDuePromiseDate(new Date().toISOString().split('T')[0]);
        }
      } else {
        setDuePromiseDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [activeTrip]);

  // Fetch live seat inventory when selected trip changes (STRICTLY filter out extra seats)
  const fetchLiveSeats = useCallback(async (tId: string, keepSelectedSeats = false) => {
    if (!tId) {
      setTripSeats([]);
      if (!keepSelectedSeats) setSelectedSeatIds([]);
      return;
    }
    setIsLoadingSeats(true);
    if (!keepSelectedSeats) {
      setSelectedSeatIds([]);
    }
    try {
      const res = await fetch(`/api/backend/inventory/${tId}/seat-map`);
      if (res.ok) {
        const data = await res.json();
        const rawSeats = data.seats || [];
        if (Array.isArray(rawSeats) && rawSeats.length > 0) {
          // Extra seats are completely excluded from Quick Counter Booking
          const regularSeatsOnly = rawSeats.filter((s: any) => {
            const rawNum = (s.seat_number || s.seatNumber || s.label || s.seatId || '').toString().trim().toUpperCase();
            return !rawNum.startsWith('EX') && !rawNum.includes('EXTRA');
          });

          const normalized = regularSeatsOnly.map((s: any, idx: number) => {
            const rawNum = (s.seat_number || s.seatNumber || s.label || s.seatId || `S${idx + 1}`).toString().trim().toUpperCase();
            return {
              seatId: s.seat_id || s.seatId || `seat-${tId}-${rawNum}`,
              seat_id: s.seat_id || s.seatId || `seat-${tId}-${rawNum}`,
              seatNumber: rawNum,
              seat_number: rawNum,
              rowIndex: typeof s.row_index === 'number' ? s.row_index : (typeof s.rowIndex === 'number' ? s.rowIndex : 0),
              colIndex: typeof s.col_index === 'number' ? s.col_index : (typeof s.colIndex === 'number' ? s.colIndex : 0),
              seatType: s.seat_type || s.seatType || 'STANDARD',
              genderAllowed: s.gender_allowed || s.genderAllowed || 'ANY',
              fare: Number(s.fare) || activeTrip?.basePrice || 550,
              status: (s.status || 'AVAILABLE').toUpperCase(),
              passengerName: s.passenger_name || s.passengerName || '',
              passengerPhone: s.passenger_phone || s.passengerPhone || '',
              bookingNumber: s.booking_number || s.bookingNumber || '',
              holdInfo: s.hold_info || s.holdInfo,
              lockInfo: s.lock_info || s.lockInfo,
            };
          });
          setTripSeats(normalized);

          if (keepSelectedSeats) {
            setSelectedSeatIds((prev) => {
              const stillValid = prev.filter((id) => {
                const found = normalized.find((st: any) => st.seatId === id);
                return found && found.status === 'AVAILABLE';
              });
              if (stillValid.length < prev.length) {
                toastError('আপনার নির্বাচিত কিছু আসন ইতোমধ্যে বুক হয়ে যাওয়ায় বাদ দেওয়া হয়েছে।');
              }
              return stillValid;
            });
          }
        } else {
          generateFallbackSeats(tId);
        }
      } else {
        generateFallbackSeats(tId);
      }
    } catch {
      generateFallbackSeats(tId);
    } finally {
      setIsLoadingSeats(false);
    }
  }, [activeTrip?.basePrice, generateFallbackSeats, toastError]);

  useEffect(() => {
    if (activeTrip?.id) {
      fetchLiveSeats(activeTrip.id, false);
    } else {
      setTripSeats([]);
      setSelectedSeatIds([]);
    }
  }, [activeTrip?.id, fetchLiveSeats]);

  // Seat toggle logic
  const handleToggleSeat = (seatId: string, status: string) => {
    if (status !== 'AVAILABLE') return;
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= 6) {
        alert(language === 'bn' ? 'একসাথে সর্বোচ্চ ৬টি সিট বুক করা যাবে।' : 'Maximum 6 seats per booking.');
        return prev;
      }
      return [...prev, seatId];
    });
  };

  // Build selected seat items for sidebar
  const selectedSeatItems: SelectedSeatItem[] = useMemo(() => {
    return selectedSeatIds.map((id) => {
      const found = tripSeats.find((s) => s.seatId === id || s.seat_id === id);
      const sNum = found?.seatNumber || found?.seat_number || id.split('-').pop() || 'Seat';
      const fare = Number(found?.fare) || activeBusInfo?.basePrice || 550;
      return {
        seatId: id,
        seatNumber: sNum,
        fare,
        genderAllowed: found?.genderAllowed || found?.gender_allowed || 'ANY'
      };
    });
  }, [selectedSeatIds, tripSeats, activeBusInfo?.basePrice]);

  const grossAmount = useMemo(() => {
    return selectedSeatItems.reduce((acc, s) => acc + s.fare, 0);
  }, [selectedSeatItems]);

  const netAmount = selectedSeatItems.length > 0
    ? grossAmount + processingFee + vatTaxAmount + cashoutCharge
    : 0;

  // Track whether the operator manually entered a partial/due amount
  const isManualPaymentRef = React.useRef<boolean>(false);

  // Two-way synchronization handlers for Paid and Due
  const handlePaidAmountChange = useCallback((newPaid: number) => {
    const safePaid = Math.min(newPaid, netAmount);
    const computedDue = Math.max(0, netAmount - safePaid);
    isManualPaymentRef.current = computedDue > 0;
    setPaidAmount(safePaid);
    setDueAmount(computedDue);
  }, [netAmount]);

  const handleDueAmountChange = useCallback((newDue: number) => {
    const safeDue = Math.min(newDue, netAmount);
    isManualPaymentRef.current = safeDue > 0;
    setDueAmount(safeDue);
    setPaidAmount(Math.max(0, netAmount - safeDue));
  }, [netAmount]);

  // Keep paid and due synced when netAmount changes (e.g. seats selected/removed or fee modified)
  useEffect(() => {
    if (netAmount === 0) {
      isManualPaymentRef.current = false;
      setPaidAmount(0);
      setDueAmount(0);
      return;
    }

    if (!isManualPaymentRef.current) {
      setPaidAmount(netAmount);
      setDueAmount(0);
    } else {
      setPaidAmount((prevPaid) => {
        const safePaid = Math.min(prevPaid, netAmount);
        setDueAmount(Math.max(0, netAmount - safePaid));
        return safePaid;
      });
    }
  }, [netAmount]);

  // Auto-synchronize passengersBySeat when selectedSeatIds changes
  useEffect(() => {
    setPassengersBySeat((prev) => {
      const next = { ...prev };
      // Remove unselected seats
      Object.keys(next).forEach((sId) => {
        if (!selectedSeatIds.includes(sId)) {
          delete next[sId];
        }
      });
      // Primary passenger info to propagate if available
      const primarySeatId = selectedSeatIds[0];
      const primaryPhone = primarySeatId && next[primarySeatId]?.phone ? next[primarySeatId].phone : '';
      const primaryGender = primarySeatId && next[primarySeatId]?.gender ? next[primarySeatId].gender : 'MALE';

      selectedSeatIds.forEach((sId, idx) => {
        if (!next[sId]) {
          const foundSeat = tripSeats.find((s) => (s.seatId || s.seat_id) === sId);
          const sNum = foundSeat?.seatNumber || foundSeat?.seat_number || sId.split('-').pop() || `S${idx + 1}`;
          next[sId] = {
            seatId: sId,
            seatNumber: sNum,
            name: '',
            phone: idx > 0 ? primaryPhone : '',
            gender: primaryGender,
            passengerType: idx === 0 ? 'STUDENT' : 'GUARDIAN',
            isStudent: idx === 0,
            guardianRelationship: idx > 0 ? 'FATHER' : undefined,
            admissionId: '',
            suggestedPassenger: null,
          };
        }
      });
      return next;
    });
  }, [selectedSeatIds, tripSeats]);

  // Handle passenger data change for a specific seat
  const handlePassengerDataChange = useCallback((seatId: string, updates: Partial<SeatPassengerDetail>) => {
    setPassengersBySeat((prev) => {
      const current = prev[seatId] || {
        seatId,
        seatNumber: '',
        name: '',
        phone: '',
        gender: 'MALE',
        isStudent: true,
        admissionId: '',
      };
      const updated: SeatPassengerDetail = { ...current, ...updates };

      if (updates.phone !== undefined) {
        const clean = cleanAndLimitPhoneNumber(updates.phone);
        if (clean.length >= 4) {
          const foundInRecent = recentPassengers.find((p) => {
            const pClean = (p.phone || '').replace(/[\s\-\+]/g, '');
            return pClean.includes(clean) || clean.includes(pClean);
          });
          if (foundInRecent) {
            updated.suggestedPassenger = foundInRecent;
            if (clean.length === 11 && !updated.name) {
              updated.name = foundInRecent.name;
              if (foundInRecent.gender) updated.gender = foundInRecent.gender;
              if (foundInRecent.admissionId) updated.admissionId = foundInRecent.admissionId;
            }
          } else {
            const foundInDir = lookupPassengerByPhone(clean);
            if (foundInDir) {
              updated.suggestedPassenger = foundInDir;
              if (clean.length === 11 && !updated.name) {
                updated.name = foundInDir.name;
                if (foundInDir.gender) updated.gender = foundInDir.gender;
                if (foundInDir.admissionId) updated.admissionId = foundInDir.admissionId;
              }
            } else {
              updated.suggestedPassenger = null;
            }
          }
        } else {
          updated.suggestedPassenger = null;
        }
      }

      return {
        ...prev,
        [seatId]: updated,
      };
    });
  }, [recentPassengers]);

  // 1-Click copy first passenger's phone to all other selected seats
  const handleCopyFirstPassengerPhoneToAll = useCallback(() => {
    if (selectedSeatIds.length <= 1) return;
    const firstSeatId = selectedSeatIds[0];
    const firstPhone = passengersBySeat[firstSeatId]?.phone;
    if (!firstPhone) {
      toastError(language === 'bn' ? 'প্রথমে ১ম যাত্রীর মোবাইল নম্বর লিখুন।' : 'Enter first passenger phone first.');
      return;
    }
    setPassengersBySeat((prev) => {
      const next = { ...prev };
      selectedSeatIds.forEach((sId, idx) => {
        if (idx > 0 && next[sId]) {
          next[sId] = {
            ...next[sId],
            phone: firstPhone,
          };
        }
      });
      return next;
    });
    toastSuccess(language === 'bn' ? '✓ ১ম যাত্রীর মোবাইল নম্বর বাকি সব আসনে কপি করা হয়েছে।' : 'Copied to all seats.');
  }, [selectedSeatIds, passengersBySeat, language, toastError, toastSuccess]);

  // Apply suggested passenger details into a specific seat
  const handleApplySuggestedPassenger = useCallback((p: any, seatId?: string) => {
    if (!p) return;
    const targetSeatId = seatId || selectedSeatIds[0];
    if (!targetSeatId) return;

    setPassengersBySeat((prev) => {
      const current = prev[targetSeatId];
      if (!current) return prev;
      const isGuard = p.passengerType === 'GUARDIAN';
      return {
        ...prev,
        [targetSeatId]: {
          ...current,
          name: p.name || current.name,
          gender: p.gender === 'MALE' || p.gender === 'FEMALE' ? p.gender : current.gender,
          passengerType: isGuard ? 'GUARDIAN' : 'STUDENT',
          isStudent: !isGuard,
          guardianRelationship: isGuard ? (p.guardianRelationship || current.guardianRelationship || 'FATHER') : undefined,
          admissionId: p.admissionId || current.admissionId,
          suggestedPassenger: null,
        },
      };
    });
    toastSuccess(language === 'bn' ? `✓ ${p.name}-এর তথ্য স্বয়ংক্রিয়ভাবে বসানো হয়েছে!` : 'Passenger details applied!');
  }, [selectedSeatIds, language, toastSuccess]);

  // Handle phone change with instant passenger suggestion lookup (Fallback)
  const handlePassengerPhoneChange = useCallback((rawPhone: string) => {
    setPassengerPhone(rawPhone);
    const clean = cleanAndLimitPhoneNumber(rawPhone);
    if (clean.length >= 4) {
      const foundInRecent = recentPassengers.find((p) => {
        const pClean = (p.phone || '').replace(/[\s\-\+]/g, '');
        return pClean.includes(clean) || clean.includes(pClean);
      });
      if (foundInRecent) {
        setSuggestedPassenger(foundInRecent);
        if (clean.length === 11 && !passengerName) {
          setPassengerName(foundInRecent.name);
          if (foundInRecent.gender) setPassengerGender(foundInRecent.gender);
          if (foundInRecent.admissionId) setStudentAdmissionId(foundInRecent.admissionId);
        }
        return;
      }

      const foundInDir = lookupPassengerByPhone(clean);
      if (foundInDir) {
        setSuggestedPassenger(foundInDir);
        if (clean.length === 11 && !passengerName) {
          setPassengerName(foundInDir.name);
          if (foundInDir.gender) setPassengerGender(foundInDir.gender);
          if (foundInDir.admissionId) setStudentAdmissionId(foundInDir.admissionId);
        }
        return;
      }
    }
    setSuggestedPassenger(null);
  }, [recentPassengers, passengerName]);

  // Handle MFS payment cashout auto-calculation
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method === 'BKASH' || method === 'NAGAD' || method === 'ROCKET') {
      try {
        const orgSettings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('atoms_organization_settings') || '{}') : {};
        const autoApply = orgSettings.finance?.autoApplyMfsCashout ?? true;
        if (autoApply && cashoutCharge === 0 && grossAmount > 0) {
          if (orgSettings.finance?.mfsCashoutCalculationType === 'FIXED') {
            setCashoutCharge(orgSettings.finance?.defaultMfsCashoutFixed ?? 0);
          } else {
            const pct = orgSettings.finance?.defaultMfsCashoutPercent ?? 1.5;
            setCashoutCharge(Math.round(grossAmount * (pct / 100)));
          }
        }
      } catch {
        if (cashoutCharge === 0 && grossAmount > 0) {
          setCashoutCharge(Math.round(grossAmount * 0.015));
        }
      }
    } else if (method === 'HAND_CASH') {
      setCashoutCharge(0);
    }
  };

  // Dynamically compute gender warning for selected passengers / adjacent seats
  const genderWarning = useMemo(() => {
    if (!activeTrip || selectedSeatItems.length === 0) return null;
    const busType = (activeBusInfo?.busType || 'MIXED').toUpperCase();

    if (busType === 'FEMALE' || busType === 'FEMALE_ONLY') {
      const hasMale = selectedSeatItems.some((s) => (passengersBySeat[s.seatId]?.gender || passengerGender) === 'MALE');
      if (hasMale) return 'এই বাসটি শুধুমাত্র নারী যাত্রীদের জন্য সংরক্ষিত। কোনো পুরুষ যাত্রী নির্বাচন করা যাবে না।';
    }
    if (busType === 'MALE' || busType === 'MALE_ONLY') {
      const hasFemale = selectedSeatItems.some((s) => (passengersBySeat[s.seatId]?.gender || passengerGender) === 'FEMALE');
      if (hasFemale) return 'এই বাসটি শুধুমাত্র পুরুষ যাত্রীদের জন্য সংরক্ষিত। কোনো নারী যাত্রী নির্বাচন করা যাবে না।';
    }

    // Check adjacent pairs when multiple seats are selected
    for (let i = 0; i < selectedSeatItems.length; i++) {
      for (let j = i + 1; j < selectedSeatItems.length; j++) {
        const s1 = selectedSeatItems[i];
        const s2 = selectedSeatItems[j];
        const p1 = passengersBySeat[s1.seatId];
        const p2 = passengersBySeat[s2.seatId];
        const partners = adjacentPartners(s1.seatNumber);
        if (partners.includes(s2.seatNumber)) {
          const g1 = p1?.gender || passengerGender;
          const g2 = p2?.gender || passengerGender;
          if (g1 && g2 && g1 !== g2) {
            return `সংলগ্ন পাশাপাশি আসন (${s1.seatNumber} ও ${s2.seatNumber})-এ পুরুষ ও নারী যাত্রী একসাথে বসছেন (অভিভাবক/পরিবার হিসেবে নিশ্চিত করুন)।`;
          }
        }
      }
    }
    return null;
  }, [activeTrip, selectedSeatItems, passengersBySeat, passengerGender, activeBusInfo?.busType]);

  // Confirm booking handler
  const handleConfirmBooking = async () => {
    if (!activeTrip) {
      toastError(language === 'bn' ? 'অনুগ্রহ করে প্রথমে একটি বাস নির্বাচন করুন।' : 'Please select a bus first.');
      return;
    }
    if (selectedSeatIds.length === 0) {
      toastError(language === 'bn' ? 'অনুগ্রহ করে অন্তত একটি আসন নির্বাচন করুন।' : 'Please select at least one seat.');
      return;
    }

    const firstPassenger = passengersBySeat[selectedSeatItems[0]?.seatId];
    const firstIsGuard = firstPassenger?.passengerType === 'GUARDIAN' || (!isStudent && selectedSeatItems.length === 1);
    const primaryPhone = cleanAndLimitPhoneNumber(firstPassenger?.phone || passengerPhone);
    const primaryName = firstPassenger?.name?.trim() || passengerName.trim() || (firstIsGuard ? 'কাউন্টার অভিভাবক' : 'কাউন্টার যাত্রী');

    // Validate details for every passenger in the selected seats
    for (let i = 0; i < selectedSeatItems.length; i++) {
      const seat = selectedSeatItems[i];
      const p = passengersBySeat[seat.seatId];
      const isGuard = p?.passengerType === 'GUARDIAN' || (!isStudent && i === 0 && selectedSeatItems.length === 1);
      const pName = p?.name?.trim() || (i === 0 ? passengerName.trim() : '');
      const pPhone = cleanAndLimitPhoneNumber(p?.phone || (i === 0 ? passengerPhone : primaryPhone));

      // For Student: Name is required. For Guardian: Name is NOT required (relationship is enough!)
      if (!isGuard && !pName) {
        toastError(
          language === 'bn'
            ? `অনুগ্রহ করে আসন ${seat.seatNumber}-এর শিক্ষার্থীর নাম লিখুন।`
            : `Please enter student name for seat ${seat.seatNumber}.`
        );
        return;
      }
      if (!pPhone || !isValidBdMobile(pPhone)) {
        toastError(
          language === 'bn'
            ? `আসন ${seat.seatNumber}-এর যাত্রীর সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।`
            : `Please enter valid 11-digit mobile number for seat ${seat.seatNumber}.`
        );
        return;
      }
      if (isGuard && !p?.guardianRelationship) {
        toastError(
          language === 'bn'
            ? `আসন ${seat.seatNumber}-এর অভিভাবকের সম্পর্ক (বাবা/মা/ভাই/বোন ইত্যাদি) নির্বাচন করুন।`
            : `Please select relationship for guardian in seat ${seat.seatNumber}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const finalPaid = Number(paidAmount) || 0;
      const finalDue = Math.max(0, netAmount - finalPaid);
      const isPaidFull = finalDue <= 0;

      const dueNotesCombined = [
        isPayOnBus ? '🚌 বাসে উঠে সুপারভাইজারকে বকেয়া পরিশোধ করবে (Pay on Bus)' : '',
        dueNote.trim()
      ].filter(Boolean).join(' | ');

      const payload = {
        tripId: activeTrip.id,
        seats: selectedSeatItems.map((s) => ({
          seatId: s.seatId,
          fare: Number(s.fare) || activeBusInfo?.basePrice || 550,
        })),
        passengers: selectedSeatItems.map((s, idx) => {
          const p = passengersBySeat[s.seatId];
          const isGuard = p?.passengerType === 'GUARDIAN' || (!isStudent && idx === 0 && selectedSeatItems.length === 1);
          const relCode = p?.guardianRelationship || 'FATHER';
          const relObj = GUARDIAN_RELATIONSHIPS.find((r) => r.value === relCode);
          const relLabel = relObj ? relObj.label.split(' ')[0] : 'অভিভাবক';

          let pName = p?.name?.trim();
          if (isGuard) {
            // For guardian: if name is not manually given, automatically label as "অভিভাবক (সম্পর্ক)"
            pName = pName || `অভিভাবক (${relLabel})`;
          } else {
            pName = pName || (idx === 0 ? passengerName.trim() : `শিক্ষার্থী ${idx + 1}`);
          }

          const pPhone = cleanAndLimitPhoneNumber(p?.phone || primaryPhone);
          const pGender = p?.gender || (idx === 0 ? passengerGender : (isGuard && relObj?.defaultGender ? relObj.defaultGender : 'MALE'));
          const pAdmission = !isGuard ? (p?.admissionId?.trim() || (idx === 0 ? studentAdmissionId.trim() : undefined)) : undefined;

          return {
            passengerName: pName,
            passengerPhone: pPhone,
            passengerType: isGuard ? 'GUARDIAN' : 'STUDENT',
            gender: pGender,
            seatId: s.seatId,
            admissionId: pAdmission || undefined,
            guardianRelationship: isGuard ? relCode : undefined,
            guardianPhone: isGuard ? (p?.guardianPhone ? cleanAndLimitPhoneNumber(p.guardianPhone) : undefined) : undefined,
          };
        }),
        contactName: primaryName,
        contactPhone: primaryPhone,
        journeyType: 'ROUND_TRIP',
        paymentMethod: paymentMethod,
        paymentStatus: isPaidFull ? 'PAID' : (finalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
        paidAmount: finalPaid,
        paid_amount: finalPaid,
        dueAmount: finalDue,
        due_amount: finalDue,
        duePromiseDate: duePromiseDate || undefined,
        due_promise_date: duePromiseDate || undefined,
        dueNote: dueNotesCombined || undefined,
        due_note: dueNotesCombined || undefined,
        isPayOnBus: isPayOnBus,
        processingFee: Number(processingFee) || 0,
        vatAmount: Number(vatTaxAmount) || 0,
        cashoutFee: Number(cashoutCharge) || 0,
        notes: `কুইক কাউন্টার বুকিং - বাস: ${activeBusInfo?.busNumber} | বিশ্ববিদ্যালয়: ${activeBusInfo?.targetUni}${dueNotesCombined ? ` | বকেয়া বিবরণ: ${dueNotesCombined}` : ''} | অপারেটর: ${currentUser?.name || 'কাউন্টার স্টাফ'}`
      };

      const result = await createBookingAction(payload as any);
      if (result.success && result.booking) {
        // Save each passenger into directory for future instant suggestion
        selectedSeatItems.forEach((s) => {
          const p = passengersBySeat[s.seatId];
          const pName = p?.name?.trim() || primaryName;
          const pPhone = cleanAndLimitPhoneNumber(p?.phone || primaryPhone);
          if (pName && pPhone) {
            recordPassengerInDirectory({
              name: pName,
              phone: pPhone,
              gender: p?.gender || passengerGender || 'MALE',
              passengerType: (p?.isStudent ?? isStudent) ? 'STUDENT' : 'GUARDIAN',
              admissionId: p?.admissionId?.trim() || studentAdmissionId.trim() || undefined
            });
          }
        });

        const bNumber = result.booking.bookingNumber || result.booking.booking_number || 'BK-SUCCESS';
        toastSuccess(
          language === 'bn'
            ? `🎉 টিকিট বুকিং সফল হয়েছে! ট্র্যাকিং নম্বর: ${bNumber}`
            : `🎉 Booking confirmed successfully! Tracking: ${bNumber}`
        );
        setConfirmedBookingData(result.booking);
        if (autoPrintTicket) {
          router.push(`/bookings/${result.booking.id}?success=true&autoPrint=true`);
        } else {
          // Stay on counter page and refresh seats immediately
          isManualPaymentRef.current = false;
          fetchLiveSeats(activeTrip.id, false);
          setSelectedSeatIds([]);
          setPassengersBySeat({});
          setPaidAmount(0);
          setDueAmount(0);
          setIsPayOnBus(false);
          setDueNote('');
        }
      } else {
        const translatedErr = translateErrorMessageToBn(result.error);
        toastError(translatedErr);
        // Do NOT wipe selected seats, passenger details, or paid amounts on error!
        // Revalidate seat map while preserving user's valid selected seats
        fetchLiveSeats(activeTrip.id, true);
      }
    } catch (e: any) {
      toastError(translateErrorMessageToBn(e?.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seat counts computation
  const totalSeatsCount = tripSeats.length || activeBusInfo?.capacity || 45;
  const bookedSeatsCount = tripSeats.filter((s) => s.status === 'BOOKED').length;
  const heldSeatsCount = tripSeats.filter((s) => s.status === 'HELD').length;
  const lockedSeatsCount = tripSeats.filter((s) => s.status === 'LOCKED' || s.status === 'MAINTENANCE').length;
  const availableSeatsCount = Math.max(0, totalSeatsCount - bookedSeatsCount - heldSeatsCount - lockedSeatsCount);

  // Render individual regular seat button (Fully responsive, no font overflowing)
  const renderSeatButton = (sNum: string, isWindow: boolean) => {
    const seatObj = tripSeats.find((s) => (s.seatNumber || s.seat_number) === sNum);
    const seatId = seatObj?.seatId || seatObj?.seat_id || `seat-${activeTrip?.id}-${sNum}`;
    const status = (seatObj?.status || 'AVAILABLE').toUpperCase();
    const isBooked = status === 'BOOKED';
    const isHeld = status === 'HELD';
    const isLocked = status === 'LOCKED' || status === 'MAINTENANCE';
    const isDisabled = isBooked || isHeld || isLocked;
    const isSelected = selectedSeatIds.includes(seatId);
    const seatPrice = Number(seatObj?.fare) || activeBusInfo?.basePrice || 550;
    const isFemaleOnly = seatObj?.genderAllowed === 'FEMALE_ONLY' || seatObj?.gender_allowed === 'FEMALE_ONLY';
    const isMaleOnly = seatObj?.genderAllowed === 'MALE_ONLY' || seatObj?.gender_allowed === 'MALE_ONLY';

    let tooltip = `সিট: ${sNum} ${isWindow ? '• জানালা (Window)' : ''} | ভাড়া: ৳${seatPrice}`;
    if (isBooked) tooltip += ` | বুকড (${seatObj?.passengerName || 'যাত্রী'})`;
    if (isHeld) tooltip += ' | সাময়িকভাবে হোল্ড করা';
    if (isLocked) tooltip += ' | সংরক্ষিত / লকড';

    return (
      <button
        key={sNum}
        type="button"
        disabled={isDisabled}
        onClick={() => handleToggleSeat(seatId, status)}
        title={tooltip}
        className={`w-11 h-14 xs:w-12 xs:h-15 sm:w-14 sm:h-16 shrink-0 p-1 rounded-xl flex flex-col items-center justify-between font-black transition-all duration-150 select-none cursor-pointer relative border xs:border-2 overflow-hidden ${
          isSelected
            ? 'bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 text-white border-blue-400 shadow-md shadow-blue-600/30 scale-105 z-10 ring-2 ring-blue-500/40'
            : isBooked
            ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800 opacity-75 cursor-not-allowed'
            : isHeld
            ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 opacity-80 cursor-not-allowed'
            : isLocked
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 opacity-60 cursor-not-allowed'
            : isFemaleOnly
            ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-950 dark:text-pink-200 border-pink-400 dark:border-pink-600 hover:border-pink-500 shadow-2xs'
            : isMaleOnly
            ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-950 dark:text-blue-100 border-blue-400 dark:border-blue-500 shadow-2xs hover:border-blue-500'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 shadow-2xs hover:border-blue-500 hover:shadow-sm'
        }`}
      >
        {/* Headrest Cushion */}
        <div
          className={`w-5 xs:w-6 h-1 rounded-full shadow-inner transition-all shrink-0 mt-0.5 ${
            isSelected
              ? 'bg-white/95 shadow-white/40'
              : isBooked
              ? 'bg-rose-400'
              : isHeld
              ? 'bg-amber-400'
              : isLocked
              ? 'bg-slate-400'
              : isFemaleOnly
              ? 'bg-pink-500'
              : isMaleOnly
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* Seat Number & Window Indicator */}
        <div className="flex items-center justify-center gap-0.5 my-auto px-0.5 w-full">
          <span className={`text-xs sm:text-sm font-black tracking-tight leading-none font-mono truncate ${isSelected ? 'text-white' : ''}`}>
            {sNum}
          </span>
          {isWindow && (
            <span className="text-[9px] sm:text-[10px] opacity-80 select-none shrink-0" title="জানালা (Window)">
              🪟
            </span>
          )}
        </div>

        {/* Fare / Status Pill */}
        <div
          className={`w-full flex items-center justify-center px-0.5 py-0.5 rounded-b text-center overflow-hidden shrink-0 ${
            isSelected
              ? 'bg-black/35 text-white'
              : 'bg-black/5 dark:bg-white/10'
          }`}
        >
          {isSelected ? (
            <span className="text-[10px] sm:text-[11px] font-black font-mono leading-none tracking-tight text-white truncate">
              ✓৳{seatPrice}
            </span>
          ) : isBooked ? (
            <span className="text-[10px] sm:text-[11px] font-black text-rose-700 dark:text-rose-300 leading-none truncate">
              বুকড
            </span>
          ) : isHeld ? (
            <span className="text-[10px] sm:text-[11px] font-black text-amber-700 dark:text-amber-300 leading-none truncate">
              হোল্ড
            </span>
          ) : isLocked ? (
            <span className="text-[10px] sm:text-[11px] font-black text-slate-600 dark:text-slate-400 leading-none truncate">
              লকড
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] font-black font-mono leading-none tracking-tight truncate">
              ৳{seatPrice}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div suppressHydrationWarning className="space-y-6 pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black shadow-inner shrink-0">
            <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-md">
                Fast Counter Mode
              </span>
              <Badge variant="default" className="bg-amber-400 text-slate-950 font-black text-xs">
                {language === 'bn' ? '৩০ সেকেন্ড কুইক বুকিং' : '30-Sec Fast Booking'}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {language === 'bn' ? 'কুইক কাউন্টার টিকিট বুকিং' : 'Rapid Counter Seat Booking'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveSeats(activeTrip?.id)}
            className="bg-white/15 hover:bg-white/25 text-white border-white/40 rounded-xl font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>
          <Link href="/bookings/new">
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-bold text-xs">
              {language === 'bn' ? 'উইজার্ড মোড ➔' : 'Full Wizard ➔'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Target University Selection & Live Buses List Card */}
      <Card className="border-2 border-blue-500/30 shadow-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Target University Selector: ONLY university name select option */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>
                  {language === 'bn' ? 'টার্গেট বিশ্ববিদ্যালয় নির্বাচন করুন:' : 'Select Target University:'}
                </span>
              </label>
              <span className="text-xs font-bold text-slate-500">
                {universityList.length} {language === 'bn' ? 'টি বিশ্ববিদ্যালয়ের বাসের বুকিং চলছে' : 'universities with live booking'}
              </span>
            </div>

            <div className="relative">
              <select
                value={selectedUniversityCode}
                onChange={(e) => handleUniversityChange(e.target.value)}
                className="w-full px-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm font-black border-2 border-blue-400 dark:border-blue-600 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/20 cursor-pointer appearance-none pr-10"
              >
                <option value="">
                  {language === 'bn' ? '-- বিশ্ববিদ্যালয় নির্বাচন করুন --' : '-- Select University --'}
                </option>
                {universityList.map((uni) => (
                  <option key={uni.code} value={uni.code}>
                    {uni.nameBn} ({uni.trips.length}টি বাসের বুকিং চলছে)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-blue-600 dark:text-blue-400">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* When Target University is selected, immediately display all buses for that university right underneath */}
          {selectedUniversityCode ? (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'bn'
                      ? `ঐ বিশ্ববিদ্যালয়ের চলমান বাসসমূহ (${universityBuses.length}টি বাসের বুকিং চলছে):`
                      : `Buses for this University (${universityBuses.length} buses live):`}
                  </span>
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{language === 'bn' ? 'বুকিং চলছে' : 'Booking Active'}</span>
                </span>
              </div>

              {universityBuses.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-200">
                  {language === 'bn'
                    ? 'এই বিশ্ববিদ্যালয়ের জন্য বর্তমানে কোনো রানিং বাসের বুকিং চলছে না।'
                    : 'No active running buses for this university right now.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {universityBuses.map((t) => {
                    const isSelected = t.id === selectedTripId;
                    const busNum = t.bus?.busNumber || t.bus?.bus_number || 'COACH';
                    const busName = t.bus?.busName || t.bus?.bus_name || `বাস ${busNum}`;
                    const uniInfo = getTripUniversityAndUnit(t);
                    const unitName = t.examUnit || t.bus?.examUnit || uniInfo.unitText || '';
                    const fare = t.basePrice || t.base_price || 550;
                    const depDate = t.departureDate || t.departure_date;
                    const depStr = depDate ? formatDate(depDate) : '';
                    const depTime = t.departureTime || t.departure_time || '22:30';
                    const totalCap = t.stats?.totalSeats || t.bus?.capacity || 45;
                    const avail = t.stats?.availableCount ?? (totalCap - (t.stats?.bookedCount || 0));

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTripId(t.id)}
                        className={`p-3.5 rounded-2xl text-left transition-all border-2 flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden min-w-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30 ring-2 sm:ring-4 ring-blue-400/40'
                            : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-md'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white text-blue-700 flex items-center gap-1 font-black text-xs shadow-xs shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{language === 'bn' ? 'নির্বাচিত' : 'Selected'}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2.5 min-w-0 pr-16">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            <Bus className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-mono font-black text-sm leading-none block truncate">{busNum}</span>
                            <span className="text-xs opacity-90 font-mono font-bold block mt-0.5">ভাড়া: ৳{fare}</span>
                          </div>
                        </div>

                        <div className="text-sm font-black truncate leading-tight mt-0.5 w-full" title={busName}>
                          {busName}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-90 w-full overflow-hidden">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs truncate max-w-[140px] shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}
                            title={unitName}
                          >
                            {unitName || 'সকল ইউনিট'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            🟢 {avail} সিট খালি
                          </span>
                        </div>

                        <div className="text-xs opacity-90 flex items-center gap-2 font-mono pt-1.5 border-t border-white/20 dark:border-slate-700 w-full truncate">
                          {depStr && (
                            <span className="flex items-center gap-1 shrink-0 font-medium">
                              <Calendar className="w-3 h-3" />
                              <span>{depStr}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 shrink-0 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(depTime)}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 font-bold">
              👆 {language === 'bn' ? 'উপরে প্রথমে টার্গেট বিশ্ববিদ্যালয় নির্বাচন করুন। বিশ্ববিদ্যালয়ের অধীনে যেসব বাসের বুকিং চলছে তা এখানে প্রদর্শিত হবে।' : 'Please select a target university above to view its running buses.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prominent Active Bus Identifier Banner */}
      {activeBusInfo && (
        <Card className="border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-blue-50/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-blue-950/30 shadow-md rounded-3xl overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0 max-w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-600 text-white font-mono font-black text-xs px-2.5 py-0.5 shrink-0">
                    {activeBusInfo.busNumber}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                    {activeBusInfo.uniqueCode}
                  </span>
                  <Badge variant="outline" className="border-blue-400 text-blue-700 dark:text-blue-300 font-bold text-xs truncate max-w-[200px]">
                    <GraduationCap className="w-3.5 h-3.5 mr-1 text-blue-600 shrink-0" />
                    <span className="truncate">{activeBusInfo.targetUni}</span>
                  </Badge>
                  <Badge variant="outline" className="border-purple-400 text-purple-700 dark:text-purple-300 font-bold text-xs truncate max-w-[160px]">
                    <Tag className="w-3.5 h-3.5 mr-1 text-purple-600 shrink-0" />
                    <span className="truncate">{activeBusInfo.examUnit}</span>
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate max-w-md">
                    {activeBusInfo.busName}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <span className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-bold truncate max-w-xs">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{activeBusInfo.routeName}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(activeBusInfo.depDate)}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTime(activeBusInfo.depTime)}
                  </span>
                </div>
              </div>

              {/* Live Seat Stats */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase">{language === 'bn' ? 'খালি' : 'Avail'}</div>
                    <div className="font-mono text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {availableSeatsCount}
                    </div>
                  </div>
                  <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase">{language === 'bn' ? 'বুকড' : 'Booked'}</div>
                    <div className="font-mono text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                      {bookedSeatsCount}
                    </div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-xs font-bold text-slate-500 uppercase">{language === 'bn' ? 'ভাড়া' : 'Fare'}</div>
                    <div className="font-mono text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                      ৳{activeBusInfo.basePrice}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Coach Seat Map (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Coach Top Bar Info */}
            <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
              <div className="space-y-0.5 min-w-0 max-w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-black text-amber-400 bg-white/10 px-2 py-0.5 rounded shrink-0">
                    {activeBusInfo?.busNumber || activeTrip?.tripCode}
                  </span>
                  <span className="font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-md">{activeBusInfo?.busName}</span>
                </div>
                <p className="text-xs font-medium text-slate-300 truncate max-w-full">
                  {activeBusInfo?.routeName} • {activeBusInfo?.targetUni} {activeBusInfo?.examUnit ? `(${activeBusInfo.examUnit})` : ''}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm font-mono shrink-0">
                <span className="text-emerald-400 font-bold">{availableSeatsCount} খালি</span>
                <span className="text-slate-500">•</span>
                <span className="text-rose-400 font-bold">{bookedSeatsCount} বুকড</span>
                {heldSeatsCount > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-400 font-bold">{heldSeatsCount} হোল্ড</span>
                  </>
                )}
                {lockedSeatsCount > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 font-bold">{lockedSeatsCount} লকড</span>
                  </>
                )}
              </div>
            </div>

            {/* Seat Map Legend */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-800 border-2 border-slate-300"></span>
                <span>খালি আসন</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-600 border border-blue-400"></span>
                <span className="font-bold text-blue-600 dark:text-blue-400">নির্বাচিত সিট</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-500"></span>
                <span className="text-rose-600 dark:text-rose-400">বুকড</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-400"></span>
                <span className="text-amber-600 dark:text-amber-400">হোল্ড</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-xs">
                <span>🪟 জানালা (Window)</span>
              </div>
            </div>

            {/* Seat Grid Frame */}
            <CardContent className="p-2 sm:p-6 bg-slate-100/60 dark:bg-slate-950/60 flex flex-col items-center justify-center min-h-[460px] overflow-x-auto">
              {isLoadingSeats ? (
                <div className="py-20 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span>সিট ম্যাপ ও রানিং ইনভেন্টরি লোড হচ্ছে...</span>
                </div>
              ) : !activeTrip ? (
                <div className="py-20 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center gap-2">
                  <GraduationCap className="w-8 h-8 text-slate-300" />
                  <span>উপরে টার্গেট বিশ্ববিদ্যালয় নির্বাচন করে বাস পছন্দ করুন।</span>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border-2 sm:border-4 border-slate-300 dark:border-slate-700 shadow-xl w-full max-w-md mx-auto">
                  {/* Cockpit / Driver Cabin Header */}
                  <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1 gap-1.5">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs sm:text-sm font-black shadow-xs shrink-0 whitespace-nowrap">
                      <span>🚪</span>
                      <span>{language === 'bn' ? 'গেট (DOOR)' : 'DOOR'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-xl text-xs sm:text-sm font-black shadow-xs shrink-0 whitespace-nowrap">
                      <span>✇</span>
                      <span>{language === 'bn' ? 'ড্রাইভার কেবিন' : 'DRIVER CABIN'}</span>
                    </div>
                  </div>

                  {/* Seat Rows Matrix */}
                  <div className="space-y-2 xs:space-y-2.5 sm:space-y-3">
                    {Array.from({ length: 11 }).map((_, r) => {
                      const rowChar = 'ABCDEFGHIJKLMN'[r] || `R${r + 1}`;
                      const isLastRow = r === 10;
                      return (
                        <div key={r} className="flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2">
                          {/* Left Seats: 1, 2 */}
                          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                            {renderSeatButton(`${rowChar}1`, true)}
                            {renderSeatButton(`${rowChar}2`, false)}
                          </div>

                          {/* Center Walkway / Aisle */}
                          <div className="w-6 xs:w-7 sm:w-8 text-center font-mono text-xs sm:text-sm font-black text-slate-400 flex items-center justify-center shrink-0">
                            {isLastRow ? (
                              renderSeatButton(`${rowChar}3`, false)
                            ) : (
                              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs sm:text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {rowChar}
                              </span>
                            )}
                          </div>

                          {/* Right Seats: 3, 4 (or 4, 5 on last row) */}
                          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                            {renderSeatButton(`${rowChar}${isLastRow ? 4 : 3}`, false)}
                            {renderSeatButton(`${rowChar}${isLastRow ? 5 : 4}`, true)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Notice: Extra Seats Excluded by Rule */}
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium leading-normal">
                          {language === 'bn'
                            ? 'কুইক কাউন্টারে শুধুমাত্র নিয়মিত আসন বুকিং করা যাবে। অতিরিক্ত সিট কাটতে নতুন টিকিট বুকিং-এ যান।'
                            : 'Only regular seats can be booked in Quick Counter. For extra seats, please go to New Ticket Booking.'}
                        </span>
                      </div>
                      <Link href="/bookings/new" className="shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-100 hover:bg-amber-100 shrink-0 whitespace-nowrap"
                        >
                          {language === 'bn' ? 'নতুন টিকিট বুকিং ➔' : 'New Booking ➔'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Summary Sidebar (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <BookingSummarySidebar
            selectedSeats={selectedSeatItems}
            onRemoveSeat={(id) => setSelectedSeatIds((prev) => prev.filter((sId) => sId !== id))}
            passengersBySeat={passengersBySeat}
            onPassengerDataChange={handlePassengerDataChange}
            onCopyFirstPassengerPhoneToAll={handleCopyFirstPassengerPhoneToAll}
            grossAmount={grossAmount}
            netAmount={netAmount}
            paidAmount={paidAmount}
            onPaidAmountChange={handlePaidAmountChange}
            dueAmount={dueAmount}
            onDueAmountChange={handleDueAmountChange}
            isPayOnBus={isPayOnBus}
            onIsPayOnBusChange={setIsPayOnBus}
            duePromiseDate={duePromiseDate}
            onDuePromiseDateChange={setDuePromiseDate}
            dueNote={dueNote}
            onDueNoteChange={setDueNote}
            processingFee={processingFee}
            onProcessingFeeChange={(fee) => setProcessingFee(fee)}
            vatTaxAmount={vatTaxAmount}
            onVatTaxAmountChange={(tax) => setVatTaxAmount(tax)}
            cashoutCharge={cashoutCharge}
            onCashoutChargeChange={(charge) => setCashoutCharge(charge)}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={handlePaymentMethodChange}
            passengerName={passengerName}
            onPassengerNameChange={(val) => setPassengerName(val)}
            passengerPhone={passengerPhone}
            onPassengerPhoneChange={handlePassengerPhoneChange}
            passengerGender={passengerGender}
            onPassengerGenderChange={(g) => setPassengerGender(g)}
            isStudent={isStudent}
            onIsStudentChange={(val) => setIsStudent(val)}
            studentAdmissionId={studentAdmissionId}
            onStudentAdmissionIdChange={(id) => setStudentAdmissionId(id)}
            autoPrintTicket={autoPrintTicket}
            onAutoPrintTicketChange={(val) => setAutoPrintTicket(val)}
            onConfirmBooking={handleConfirmBooking}
            isSubmitting={isSubmitting}
            genderWarning={genderWarning}
            trip={activeTrip}
            suggestedPassenger={suggestedPassenger}
            onApplySuggestedPassenger={handleApplySuggestedPassenger}
          />
        </div>
      </div>
    </div>
  );
}
