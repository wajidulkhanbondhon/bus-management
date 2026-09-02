'use client';

import React, { useState } from 'react';
import { Shield, ArrowLeft, ArrowRight, Phone, UserCheck, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { useApp } from '@/lib/context';
import { validateMultiSeatBookingPairRules } from '@/services/rules.service';
import { lookupPassengerByPhone, DirectoryPassenger } from '@/services/passenger-directory.service';

export interface PassengerInput {
  passengerName: string;
  passengerPhone: string;
  phoneType: 'WHATSAPP' | 'NORMAL';
  passengerType: 'STUDENT' | 'GUARDIAN';
  gender: 'MALE' | 'FEMALE';
  seatId: string;
  admissionId?: string;
  institution?: string;
  guardianPhone?: string;
  guardianPhoneType?: 'WHATSAPP' | 'NORMAL';
  guardianRelationship?: 'FATHER' | 'MOTHER' | 'BROTHER' | 'SISTER' | 'SPOUSE' | 'UNCLE' | 'AUNT' | 'OTHER';
}

export interface PassengerStepProps {
  passengers: PassengerInput[];
  allCurrentSeats: any[];
  targetUniversity: string;
  suggestedPassengerMap: Record<string, DirectoryPassenger>;
  onUpdatePassenger: (seatId: string, updates: Partial<PassengerInput>) => void;
  onSetErrorMessage: (msg: string | null) => void;
  onGoBack: () => void;
  onContinue: () => void;
}

const RELATIONSHIP_OPTIONS: { value: PassengerInput['guardianRelationship']; labelBn: string; labelEn: string }[] = [
  { value: 'FATHER', labelBn: 'বাবা (Father)', labelEn: 'Father' },
  { value: 'MOTHER', labelBn: 'মা (Mother)', labelEn: 'Mother' },
  { value: 'BROTHER', labelBn: 'আপন ভাই (Brother)', labelEn: 'Brother' },
  { value: 'SISTER', labelBn: 'আপন বোন (Sister)', labelEn: 'Sister' },
  { value: 'SPOUSE', labelBn: 'স্বামী / স্ত্রী (Spouse)', labelEn: 'Spouse' },
  { value: 'UNCLE', labelBn: 'চাচা / মামা (Uncle)', labelEn: 'Uncle' },
  { value: 'AUNT', labelBn: 'খালা / ফুপু (Aunt)', labelEn: 'Aunt' },
  { value: 'OTHER', labelBn: 'অন্যান্য (Other)', labelEn: 'Other' }
];

export function PassengerDetailsStep({
  passengers,
  allCurrentSeats,
  targetUniversity,
  suggestedPassengerMap,
  onUpdatePassenger,
  onSetErrorMessage,
  onGoBack,
  onContinue
}: PassengerStepProps) {
  const { language } = useApp();
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Record<string, boolean>>({});

  const applySuggestion = (seatId: string, found: DirectoryPassenger) => {
    onUpdatePassenger(seatId, {
      passengerName: found.name,
      gender: found.gender,
      passengerType: found.passengerType,
      admissionId: found.admissionId,
      institution: found.institution
    });
    setDismissedSuggestions((prev) => ({ ...prev, [seatId]: true }));
  };

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black">
                {language === 'bn'
                  ? `শিক্ষার্থী ও অভিভাবক তথ্য (${passengers.length} জন যাত্রী)`
                  : `Passenger Details (${passengers.length} Passengers)`}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'প্রতিটি নির্বাচিত সিটের জন্য শিক্ষার্থী বা অভিভাবকের নাম ও মোবাইল নম্বর লিখুন'
                  : 'Enter student and guardian contact details for each allocated seat'}
              </p>
            </div>
            <Badge variant="primary" className="font-bold">
              {targetUniversity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex items-start gap-3 text-xs text-blue-950 dark:text-blue-200 shadow-2xs">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-blue-900 dark:text-blue-300">
                {language === 'bn' ? '🛡️ সংলগ্ন সিট জেন্ডার প্রোটেকশন' : 'Gender-Adjacent Seat Protection'}
              </div>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'bn'
                  ? 'যদি কোনো নারী বা পুরুষ একা সিট কাটেন, তবে তার পাশের সংলগ্ন সিটটি একই জেন্ডারের জন্য স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে। তবে শিক্ষার্থী ও তার বৈধ অভিভাবক (বাবা, মা, ভাই, বোন, স্বামী/স্ত্রী) একসাথে উভয় সিট বুক করতে পারবেন।'
                  : 'When a single seat is booked, the adjacent seat is automatically gender-protected. Students accompanied by legal guardians may book adjacent seats together.'}
              </p>
            </div>
          </div>

          {passengers.map((p, idx) => {
            const seatObj = allCurrentSeats.find((s) => s.seatId === p.seatId);
            const seatLabel = seatObj?.seatNumber || `Seat #${idx + 1}`;
            const suggestion = suggestedPassengerMap[p.seatId] && !dismissedSuggestions[p.seatId] ? suggestedPassengerMap[p.seatId] : undefined;

            return (
              <div key={p.seatId} className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      suppressHydrationWarning
                      className="w-8 h-8 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-black text-base text-slate-900 dark:text-white">
                        {language === 'bn' ? `সিট নম্বর ${seatLabel}` : `Seat ${seatLabel}`}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                        {seatObj?.fareZoneName || ''} {seatObj?.fare ? `• ৳${seatObj.fare}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={p.passengerType}
                      onChange={(e) => onUpdatePassenger(p.seatId, { passengerType: e.target.value as any })}
                      className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
                    >
                      <option value="STUDENT">{language === 'bn' ? 'ভর্তি পরীক্ষার্থী' : 'Admission Student'}</option>
                      <option value="GUARDIAN">{language === 'bn' ? 'অভিভাবক' : 'Guardian'}</option>
                    </select>

                    <select
                      value={p.gender}
                      onChange={(e) => onUpdatePassenger(p.seatId, { gender: e.target.value as any })}
                      className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
                    >
                      <option value="FEMALE">{language === 'bn' ? 'মহিলা (Female)' : 'Female'}</option>
                      <option value="MALE">{language === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                    </select>
                  </div>
                </div>

                {/* Passenger directory suggestion */}
                {suggestion && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-emerald-900 dark:text-emerald-300">
                          {language === 'bn' ? 'আগের যাত্রী মিলেছে!' : 'Known passenger found!'}
                        </div>
                        <div className="text-emerald-800 dark:text-emerald-400 font-bold truncate">
                          {suggestion.name} {suggestion.gender === 'FEMALE' ? '(মহিলা)' : '(পুরুষ)'} {suggestion.passengerType === 'GUARDIAN' ? '• অভিভাবক' : '• শিক্ষার্থী'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="success" onClick={() => applySuggestion(p.seatId, suggestion)} className="rounded-xl text-xs font-bold">
                        {language === 'bn' ? 'তথ্য পূরণ করুন' : 'Autofill'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDismissedSuggestions((prev) => ({ ...prev, [p.seatId]: true }))}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Input
                      label={language === 'bn' ? (p.passengerType === 'STUDENT' ? 'শিক্ষার্থীর পুরো নাম *' : 'অভিভাবকের পুরো নাম *') : 'Full Name *'}
                      value={p.passengerName}
                      onChange={(e) => onUpdatePassenger(p.seatId, { passengerName: e.target.value })}
                      placeholder={p.passengerType === 'STUDENT' ? 'যেমন: নুসরাত জাহান' : 'যেমন: মোঃ রফিকুল ইসলাম'}
                      required
                      aria-required="true"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <PhoneInput
                      label={language === 'bn' ? 'যাত্রীর মোবাইল নম্বর (১১ ডিজিট) *' : 'Passenger Mobile Number *'}
                      value={p.passengerPhone}
                      onChange={(val) => onUpdatePassenger(p.seatId, { passengerPhone: val })}
                      required
                      showOperatorBadge
                      showCharacterCount
                    />
                  </div>

                  <div className="space-y-1.5">
                    <PhoneInput
                      label={language === 'bn' ? 'জরুরি যোগাযোগ নম্বর (ঐচ্ছিক)' : 'Emergency Phone (Optional)'}
                      value={p.guardianPhone || ''}
                      onChange={(val) => onUpdatePassenger(p.seatId, { guardianPhone: val })}
                      placeholder="01XXXXXXXXX"
                      showOperatorBadge
                      showCharacterCount
                    />
                  </div>

                  {p.passengerType === 'GUARDIAN' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'শিক্ষার্থীর সাথে সম্পর্ক (Guardian Relationship) *' : 'Relationship with Student *'}
                      </label>
                      <select
                        value={p.guardianRelationship || 'FATHER'}
                        onChange={(e) => onUpdatePassenger(p.seatId, { guardianRelationship: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        {RELATIONSHIP_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {language === 'bn' ? r.labelBn : r.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {passengers.length === 0 && (
            <div className="p-10 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {language === 'bn' ? 'কোনো সিট নির্বাচন করা হয়নি — আগের ধাপে ফিরে সিট বেছে নিন।' : 'No seats selected — go back and pick seats first.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onGoBack} className="rounded-2xl px-5 font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'পেছনে যান (সিট নির্বাচন)' : 'Back to Seat Selection'}
        </Button>
        <Button
          variant="primary"
          disabled={passengers.length === 0}
          onClick={() => {
            onSetErrorMessage(null);
            const pairValidation = validateMultiSeatBookingPairRules(passengers, allCurrentSeats);
            if (!pairValidation.isValid) {
              onSetErrorMessage(pairValidation.message || 'Gender or Guardian validation failed.');
              return;
            }
            onContinue();
          }}
          className="font-bold rounded-2xl shadow-md px-6 cursor-pointer"
        >
          {language === 'bn' ? 'বোর্ডিং ও প্যাকেজ ধাপে যান' : 'Continue to Boarding & Hotel'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
