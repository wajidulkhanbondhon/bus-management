'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Bus,
  Calendar,
  Clock,
  User,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  BadgePercent,
  Receipt,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { createBookingAction } from '@/actions/booking.actions';
import { PassengerInput } from '@/services/booking.service';

interface Props {
  trips: any[];
  currentUser?: any;
}

export function BookingWizard({ trips, currentUser }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTripId = searchParams.get('tripId') || trips[0]?.id || '';
  const initialSeatId = searchParams.get('seatId') || '';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialTripId && initialSeatId ? 2 : 1);
  const [selectedTripId, setSelectedTripId] = useState<string>(initialTripId);
  const [tripSeats, setTripSeats] = useState<any[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSeatId ? [initialSeatId] : []);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Step 2: Passenger details for each selected seat
  const [passengers, setPassengers] = useState<PassengerInput[]>([]);

  // Step 3: Discount calculation
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('Early Admission Concession');

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER'>('BKASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<string>('');
  const [senderRef, setSenderRef] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load seats when selectedTripId changes
  useEffect(() => {
    if (!selectedTripId) return;
    setIsLoadingSeats(true);
    fetch(`/api/v1/trips/${selectedTripId}/seats`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTripSeats(data.data.seats);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingSeats(false));
  }, [selectedTripId]);

  // Sync passenger forms with selected seats
  useEffect(() => {
    const newPassengerList: PassengerInput[] = selectedSeatIds.map((seatId, idx) => {
      const existing = passengers.find(p => p.seatId === seatId);
      if (existing) return existing;

      return {
        passengerName: idx === 0 ? '' : '',
        passengerPhone: '',
        passengerType: idx === 0 ? 'STUDENT' : 'GUARDIAN',
        gender: 'FEMALE',
        seatId: seatId,
        admissionId: '',
        institution: 'Rajshahi University (Unit-A Science)',
        guardianRelationship: idx === 0 ? undefined : 'FATHER'
      };
    });
    setPassengers(newPassengerList);
  }, [selectedSeatIds]);

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  // Financial Calculations
  const grossAmount = selectedSeatIds.reduce((sum, sId) => {
    const seatObj = tripSeats.find(s => s.seatId === sId);
    return sum + (seatObj?.fare || selectedTrip?.basePrice || 550);
  }, 0);

  const discountAmount = discountType === 'PERCENTAGE'
    ? Math.round((grossAmount * discountRate) / 100)
    : Math.min(discountRate, grossAmount);

  const netAmount = Math.max(0, grossAmount - discountAmount);
  const dueAmount = Math.max(0, netAmount - paidAmount);

  // Default paid amount to netAmount when reaching step 4
  useEffect(() => {
    if (step === 4 && paidAmount === 0) {
      setPaidAmount(netAmount);
    }
  }, [step, netAmount]);

  const toggleSeatSelection = (seatId: string, status: string) => {
    if (status !== 'AVAILABLE') return;
    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seatId));
    } else {
      setSelectedSeatIds(prev => [...prev, seatId]);
    }
  };

  const handleUpdatePassenger = (seatId: string, updates: Partial<PassengerInput>) => {
    setPassengers(prev =>
      prev.map(p => (p.seatId === seatId ? { ...p, ...updates } : p))
    );
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // Validate passengers
    for (const p of passengers) {
      if (!p.passengerName || !p.passengerPhone) {
        setErrorMessage('All passenger names and contact phone numbers are required.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const seatsPayload = selectedSeatIds.map(sId => {
        const sObj = tripSeats.find(s => s.seatId === sId);
        return {
          seatId: sId,
          fare: sObj?.fare || selectedTrip?.basePrice || 550
        };
      });

      const res = await createBookingAction({
        tripId: selectedTripId,
        seats: seatsPayload,
        passengers,
        discountType,
        discountRate: discountAmount > 0 ? discountRate : 0,
        discountReason: discountAmount > 0 ? discountReason : undefined,
        paymentMethod,
        paidAmount: Number(paidAmount),
        transactionId: transactionId || undefined,
        senderReference: senderRef || undefined,
        notes: bookingNotes || undefined
      });

      if (res.success && res.booking) {
        router.push(`/bookings/${res.booking.id}`);
      } else {
        setErrorMessage(res.error || 'Failed to complete booking');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          {[
            { stepNum: 1, label: '1. Select Trip & Seats' },
            { stepNum: 2, label: '2. Passenger Details' },
            { stepNum: 3, label: '3. Fare & Discounts' },
            { stepNum: 4, label: '4. Payment & Confirm' }
          ].map((s) => (
            <div key={s.stepNum} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.stepNum
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                    : step > s.stepNum
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.stepNum ? <Check className="w-4 h-4" /> : s.stepNum}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${step === s.stepNum ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: SELECT TRIP & SEATS */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Scheduled Admission Trip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trips.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTripId(t.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedTripId === t.id
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600">{t.tripCode}</span>
                      <Badge variant={t.tripBusType === 'FEMALE' ? 'danger' : 'default'}>
                        {t.tripBusType || t.bus.busType} Only
                      </Badge>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-1">{t.route.routeName}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                      <span>{t.bus.busName} ({t.bus.busNumber})</span>
                      <span className="font-mono font-bold text-slate-800">{formatTime(t.departureTime)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seat Grid Selector */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Select Available Passenger Seat(s)</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Click seats to add to this booking session</p>
              </div>
              <Badge variant="primary">{selectedSeatIds.length} Selected</Badge>
            </CardHeader>
            <CardContent className="flex justify-center p-6 bg-slate-50 overflow-x-auto min-h-[380px]">
              {isLoadingSeats ? (
                <div className="py-12 text-center text-slate-400 font-medium text-xs">Loading seat map...</div>
              ) : (
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-lg w-full max-w-sm space-y-2">
                  <div className="pb-2 border-b border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-500 font-mono">
                    <span>DOOR</span>
                    <span>DRIVER CABIN</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {tripSeats.map((s) => {
                      const isSelected = selectedSeatIds.includes(s.seatId);
                      const isAvailable = s.status === 'AVAILABLE';

                      return (
                        <button
                          key={s.seatId}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => toggleSeatSelection(s.seatId, s.status)}
                          className={`h-11 rounded-lg flex flex-col items-center justify-center font-mono text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-sm'
                              : isAvailable
                              ? 'bg-white border-2 border-slate-300 text-slate-800 hover:border-blue-500'
                              : 'bg-rose-100 border border-rose-200 text-rose-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-[11px] font-black">{s.seatNumber}</span>
                          <span className="text-[9px] opacity-80">৳{s.fare}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="lg"
              disabled={selectedSeatIds.length === 0}
              onClick={() => setStep(2)}
              className="font-bold shadow-md shadow-blue-500/20"
            >
              Continue to Passenger Details ({selectedSeatIds.length} Seats)
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: PASSENGER DETAILS */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Passenger Details ({passengers.length} Passengers)</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Enter student application details and guardian relations</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {passengers.map((p, idx) => {
                const seatObj = tripSeats.find(s => s.seatId === p.seatId);
                const seatLabel = seatObj?.seatNumber || `Seat #${idx+1}`;

                return (
                  <div key={p.seatId} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          Seat: <span className="font-mono text-blue-600">{seatLabel}</span>
                        </span>
                      </div>
                      <Badge variant="primary">{p.passengerType}</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Passenger Full Name"
                        placeholder="e.g. Farhana Yasmin"
                        value={p.passengerName}
                        onChange={e => handleUpdatePassenger(p.seatId, { passengerName: e.target.value })}
                        required
                      />

                      <Input
                        label="Contact Mobile (017...)"
                        placeholder="01712345678"
                        value={p.passengerPhone}
                        onChange={e => handleUpdatePassenger(p.seatId, { passengerPhone: e.target.value })}
                        required
                      />

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Gender</label>
                        <select
                          value={p.gender}
                          onChange={e => handleUpdatePassenger(p.seatId, { gender: e.target.value as any })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
                        >
                          <option value="FEMALE">Female Candidate / Passenger</option>
                          <option value="MALE">Male Candidate / Passenger</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Passenger Category</label>
                        <select
                          value={p.passengerType}
                          onChange={e => handleUpdatePassenger(p.seatId, { passengerType: e.target.value as any })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
                        >
                          <option value="STUDENT">Admission Student</option>
                          <option value="GUARDIAN">Accompanying Guardian / Parent</option>
                          <option value="GUEST">General Guest Passenger</option>
                        </select>
                      </div>

                      {p.passengerType === 'STUDENT' ? (
                        <>
                          <Input
                            label="Admission / Roll ID (Optional)"
                            placeholder="e.g. RU-2026-98124"
                            value={p.admissionId || ''}
                            onChange={e => handleUpdatePassenger(p.seatId, { admissionId: e.target.value })}
                          />
                          <Input
                            label="Target Institution"
                            placeholder="e.g. Rajshahi University Unit-A"
                            value={p.institution || ''}
                            onChange={e => handleUpdatePassenger(p.seatId, { institution: e.target.value })}
                          />
                        </>
                      ) : (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Guardian Relationship</label>
                          <select
                            value={p.guardianRelationship || 'FATHER'}
                            onChange={e => handleUpdatePassenger(p.seatId, { guardianRelationship: e.target.value })}
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
                          >
                            <option value="FATHER">Father</option>
                            <option value="MOTHER">Mother</option>
                            <option value="BROTHER">Brother</option>
                            <option value="SISTER">Sister</option>
                            <option value="UNCLE">Uncle</option>
                            <option value="OTHER">Other Guardian</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" size="md" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={() => setStep(3)} className="font-bold">
              Continue to Fare & Discounts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: FARE & DISCOUNTS */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fare Calculation & Concessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gross Ticket Amount ({selectedSeatIds.length} Seats):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(grossAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Staff Concession Allowance:</span>
                  <span className="font-mono text-blue-600 font-semibold">
                    ৳{currentUser?.discountLimit === 99999 ? 'Unlimited' : currentUser?.discountLimit || 50} Max Auto-Approved
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
                  >
                    <option value="FIXED">Fixed Amount (৳ BDT)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <Input
                  label={discountType === 'FIXED' ? 'Discount Amount (৳ BDT)' : 'Discount Percentage (%)'}
                  type="number"
                  value={discountRate}
                  onChange={e => setDiscountRate(Number(e.target.value))}
                />

                <Input
                  label="Discount Reason / Concession Policy"
                  placeholder="e.g. Student & Guardian combo concession"
                  value={discountReason}
                  onChange={e => setDiscountReason(e.target.value)}
                />
              </div>

              {/* Net Summary Card */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-900 uppercase font-mono">Net Payable Amount</span>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Gross {formatCurrency(grossAmount)} - Discount {formatCurrency(discountAmount)}
                  </p>
                </div>
                <div className="text-2xl font-black text-blue-900 font-mono">
                  {formatCurrency(netAmount)}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" size="md" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={() => setStep(4)} className="font-bold">
              Proceed to Payment Collection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT & CONFIRMATION */}
      {step === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Desk Payment Collection & Settlement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Methods */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'BKASH', label: 'bKash Merchant', color: 'border-rose-500 text-rose-700' },
                    { id: 'NAGAD', label: 'Nagad Counter', color: 'border-orange-500 text-orange-700' },
                    { id: 'ROCKET', label: 'Rocket DBBL', color: 'border-purple-500 text-purple-700' },
                    { id: 'HAND_CASH', label: 'Hand Cash', color: 'border-emerald-500 text-emerald-700' },
                    { id: 'BANK_TRANSFER', label: 'Bank Direct', color: 'border-blue-500 text-blue-700' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                        paymentMethod === m.id
                          ? `bg-slate-900 text-white ring-2 ring-blue-500 shadow-xs`
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Paid Amount (৳ BDT)"
                  type="number"
                  value={paidAmount}
                  onChange={e => setPaidAmount(Number(e.target.value))}
                  helperText={dueAmount > 0 ? `৳${dueAmount} will remain as DUE` : 'Full payment'}
                />

                {paymentMethod !== 'HAND_CASH' && (
                  <>
                    <Input
                      label="Digital Transaction ID (TrxID)"
                      placeholder="e.g. BKA9281928"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value.toUpperCase())}
                      required
                    />

                    <Input
                      label="Sender Mobile / Account Ref"
                      placeholder="e.g. 01712345678"
                      value={senderRef}
                      onChange={e => setSenderRef(e.target.value)}
                    />
                  </>
                )}
              </div>

              <Input
                label="Special Booking Notes / Boarding Instructions"
                placeholder="e.g. Passenger requested front window seat; Boarding at Rajshahi Central Gate"
                value={bookingNotes}
                onChange={e => setBookingNotes(e.target.value)}
              />

              {/* Settlement Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Net Payable:</span>
                  <span className="font-bold">{formatCurrency(netAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Collecting Now ({paymentMethod}):</span>
                  <span className="font-bold">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-400 border-t border-slate-800 pt-2 font-bold text-sm">
                  <span>Remaining Due:</span>
                  <span>{formatCurrency(dueAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" size="md" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={handleFinalSubmit}
              isLoading={isSubmitting}
              className="font-bold text-base px-8 shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirm & Generate Ticket Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
