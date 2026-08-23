import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';
import { validatePassengerRules } from './rules.service';
import { calculateDiscountAmount } from './discount.service';

export interface PassengerInput {
  passengerName: string;
  passengerPhone: string;
  passengerType: 'STUDENT' | 'GUARDIAN' | 'GUEST';
  gender: 'MALE' | 'FEMALE';
  seatId: string;
  admissionId?: string;
  institution?: string;
  groupCategory?: string;
  address?: string;
  guardianRelationship?: string;
}

export interface CreateBookingInput {
  tripId: string;
  seats: { seatId: string; fare: number }[];
  passengers: PassengerInput[];
  discountType?: 'FIXED' | 'PERCENTAGE';
  discountRate?: number;
  discountReason?: string;
  paymentMethod: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  paidAmount: number;
  transactionId?: string;
  senderReference?: string;
  notes?: string;
  createdById: string;
}

export async function createBooking(input: CreateBookingInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch Trip, Bus & Seat Information
    const trip = await tx.trip.findUnique({
      where: { id: input.tripId },
      include: {
        bus: { include: { seatLayout: { include: { seats: true } } } },
        fareRules: true
      }
    });

    if (!trip) throw new Error('Selected trip does not exist.');
    if (trip.status === 'CANCELLED' || trip.status === 'COMPLETED') {
      throw new Error(`Cannot book on a trip with status: ${trip.status}`);
    }

    const seatIds = input.seats.map(s => s.seatId);

    // 2. Concurrency Check: Check if any seat is already booked or locked
    const alreadyBooked = await tx.bookingSeat.findFirst({
      where: {
        seatId: { in: seatIds },
        booking: {
          tripId: input.tripId,
          bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      },
      include: { seat: true }
    });

    if (alreadyBooked) {
      throw new Error(`Seat ${alreadyBooked.seat.seatNumber} was just booked by another staff member.`);
    }

    const activeLock = await tx.seatLock.findFirst({
      where: {
        tripId: input.tripId,
        seatId: { in: seatIds },
        isActive: true,
        OR: [{ lockedUntil: null }, { lockedUntil: { gt: new Date() } }]
      },
      include: { seat: true }
    });

    if (activeLock) {
      throw new Error(`Seat ${activeLock.seat.seatNumber} is currently locked (${activeLock.reason}).`);
    }

    // 3. Validate Passenger & Gender Rules for each allocated seat
    for (const p of input.passengers) {
      const seatObj = trip.bus.seatLayout?.seats.find(s => s.id === p.seatId);
      if (seatObj) {
        const validation = validatePassengerRules({
          busType: trip.bus.busType,
          tripBusType: trip.tripBusType,
          seatGenderRule: seatObj.genderAllowed,
          passengerType: p.passengerType,
          passengerGender: p.gender,
          guardianRelationship: p.guardianRelationship
        });

        if (!validation.isValid) {
          throw new Error(`Validation Error for Seat ${seatObj.seatNumber}: ${validation.message}`);
        }
      }
    }

    // 4. Calculate Financials
    const grossAmount = input.seats.reduce((sum, s) => sum + s.fare, 0);
    let discountAmount = 0;
    if (input.discountRate && input.discountRate > 0 && input.discountType) {
      discountAmount = calculateDiscountAmount(grossAmount, input.discountType, input.discountRate);
    }
    const netAmount = Math.max(0, grossAmount - discountAmount);
    const paidAmount = Math.min(netAmount, Math.max(0, input.paidAmount || 0));
    const dueAmount = Math.max(0, netAmount - paidAmount);
    const paymentStatus = dueAmount === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIALLY_PAID' : 'UNPAID');

    // 5. Generate Unique Booking Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await tx.booking.count();
    const bookingNumber = `BK-${dateStr}-${String(count + 10001).padStart(5, '0')}`;

    // 6. Create Student Records if not existing
    const passengerDataToCreate: any[] = [];
    for (const p of input.passengers) {
      let studentId: string | null = null;
      let guardianId: string | null = null;

      if (p.passengerType === 'STUDENT') {
        let student = await tx.student.findFirst({
          where: {
            OR: [
              { phone: p.passengerPhone },
              ...(p.admissionId ? [{ admissionId: p.admissionId }] : [])
            ]
          }
        });

        if (!student) {
          student = await tx.student.create({
            data: {
              admissionId: p.admissionId || null,
              fullName: p.passengerName,
              phone: p.passengerPhone,
              gender: p.gender,
              institution: p.institution || null,
              groupCategory: p.groupCategory || null,
              address: p.address || null
            }
          });
        }
        studentId = student.id;
      }

      const seatObj = trip.bus.seatLayout?.seats.find(s => s.id === p.seatId);
      passengerDataToCreate.push({
        studentId,
        guardianId,
        passengerName: p.passengerName,
        passengerPhone: p.passengerPhone,
        passengerType: p.passengerType,
        gender: p.gender,
        seatNumber: seatObj ? seatObj.seatNumber : 'Unknown'
      });
    }

    // 7. Create Booking
    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        tripId: input.tripId,
        createdById: input.createdById,
        bookingStatus: 'CONFIRMED',
        paymentStatus,
        grossAmount,
        discountAmount,
        netAmount,
        paidAmount,
        dueAmount,
        notes: input.notes,
        seats: {
          create: input.seats.map(s => ({
            seatId: s.seatId,
            fareSnapshot: s.fare
          }))
        },
        passengers: {
          create: passengerDataToCreate
        }
      },
      include: {
        seats: { include: { seat: true } },
        passengers: true,
        trip: { include: { bus: true, route: true } }
      }
    });

    // 8. Delete active holds for these seats
    await tx.seatHold.deleteMany({
      where: {
        tripId: input.tripId,
        seatId: { in: seatIds }
      }
    });

    // 9. Record Discount if present
    if (discountAmount > 0) {
      await tx.discount.create({
        data: {
          bookingId: booking.id,
          discountType: input.discountType || 'FIXED',
          discountRate: input.discountRate || discountAmount,
          discountAmount,
          reason: input.discountReason || 'Office Counter Concession',
          appliedById: input.createdById
        }
      });
    }

    // 10. Record Initial Payment if paidAmount > 0
    let payment = null;
    if (paidAmount > 0) {
      const pCount = await tx.payment.count();
      const receiptNumber = `RCT-${dateStr}-${String(pCount + 1).padStart(4, '0')}`;

      payment = await tx.payment.create({
        data: {
          receiptNumber,
          bookingId: booking.id,
          amount: paidAmount,
          method: input.paymentMethod,
          receivedById: input.createdById,
          notes: input.notes || 'Initial booking payment',
          transactions: input.transactionId ? {
            create: {
              transactionId: input.transactionId.trim(),
              senderReference: input.senderReference ? input.senderReference.trim() : null,
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date()
            }
          } : undefined
        }
      });
    }

    // 11. Record Financial Ledger Entries
    const lCount = await tx.financialLedger.count();
    await tx.financialLedger.create({
      data: {
        entryNumber: `LED-${dateStr}-${String(lCount + 1).padStart(5, '0')}`,
        entryType: 'SALE',
        debit: grossAmount,
        credit: 0.0,
        balance: grossAmount,
        bookingId: booking.id,
        description: `Booking Sale ${bookingNumber} (${booking.seats.map(s => s.seat.seatNumber).join(', ')})`
      }
    });

    if (discountAmount > 0) {
      await tx.financialLedger.create({
        data: {
          entryNumber: `LED-${dateStr}-${String(lCount + 2).padStart(5, '0')}`,
          entryType: 'DISCOUNT',
          debit: 0.0,
          credit: discountAmount,
          balance: netAmount,
          bookingId: booking.id,
          description: `Discount applied to ${bookingNumber}: ${input.discountReason || 'Concession'}`
        }
      });
    }

    if (payment && paidAmount > 0) {
      await tx.financialLedger.create({
        data: {
          entryNumber: `LED-${dateStr}-${String(lCount + 3).padStart(5, '0')}`,
          entryType: 'PAYMENT_RECEIVED',
          debit: 0.0,
          credit: paidAmount,
          balance: dueAmount,
          paymentMethod: input.paymentMethod,
          bookingId: booking.id,
          paymentId: payment.id,
          description: `Collection for ${bookingNumber} via ${input.paymentMethod} (Receipt: ${payment.receiptNumber})`
        }
      });
    }

    // 12. Audit Log
    await logAudit({
      userId: input.createdById,
      action: 'BOOKING_CREATED',
      entity: 'Booking',
      entityId: booking.id,
      newValue: {
        bookingNumber: booking.bookingNumber,
        seats: booking.seats.map(s => s.seat.seatNumber),
        netAmount,
        paidAmount,
        dueAmount
      }
    });

    return booking;
  });
}

export async function getBookingById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      trip: {
        include: {
          bus: { include: { seatLayout: true } },
          route: true
        }
      },
      seats: {
        include: { seat: { include: { fareZone: true } } }
      },
      passengers: {
        include: { student: true, guardian: true }
      },
      discounts: {
        include: {
          appliedBy: { select: { fullName: true } },
          approvals: { include: { approvedBy: { select: { fullName: true } } } }
        }
      },
      payments: {
        include: {
          transactions: true,
          receivedBy: { select: { fullName: true } }
        }
      },
      refunds: {
        include: { payment: true }
      },
      ledgerEntries: true,
      createdBy: { select: { fullName: true, email: true } }
    }
  });
}

export async function getAllBookings(filters?: {
  tripId?: string;
  status?: string;
  paymentStatus?: string;
  search?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.tripId) where.tripId = filters.tripId;
  if (filters?.status) where.bookingStatus = filters.status;
  if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;
  
  if (filters?.search) {
    const q = filters.search.trim();
    where.OR = [
      { bookingNumber: { contains: q } },
      { passengers: { some: { passengerName: { contains: q } } } },
      { passengers: { some: { passengerPhone: { contains: q } } } }
    ];
  }

  return prisma.booking.findMany({
    where,
    include: {
      trip: {
        include: {
          bus: true,
          route: true
        }
      },
      seats: {
        include: { seat: true }
      },
      passengers: true,
      payments: true,
      createdBy: { select: { fullName: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 50
  });
}

export async function cancelBooking(id: string, reason: string, staffId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payments: true }
  });

  if (!booking) throw new Error('Booking not found');
  if (booking.bookingStatus === 'CANCELLED') throw new Error('Booking is already cancelled');

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      bookingStatus: 'CANCELLED',
      notes: `${booking.notes || ''} [Cancelled by staff: ${reason}]`
    }
  });

  await logAudit({
    userId: staffId,
    action: 'BOOKING_CANCELLED',
    entity: 'Booking',
    entityId: id,
    newValue: { reason, bookingNumber: booking.bookingNumber }
  });

  return updated;
}
