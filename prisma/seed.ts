import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ATOMS comprehensive database seeding...');

  // Clean existing tables (order respecting foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dayClosingPaymentSummary.deleteMany();
  await prisma.dayClosing.deleteMany();
  await prisma.financialLedger.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.discountApproval.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.bookingPassenger.deleteMany();
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seatLock.deleteMany();
  await prisma.seatHold.deleteMany();
  await prisma.fareRule.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.busRoute.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.seatLayout.deleteMany();
  await prisma.fareZone.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 1. SYSTEM SETTINGS
  await prisma.systemSetting.createMany({
    data: [
      { key: 'HOLD_DURATION_MINUTES', value: '10', description: 'Duration in minutes for temporary seat holds during booking' },
      { key: 'BASE_CURRENCY', value: 'BDT', description: 'System base currency (Bangladeshi Taka)' },
      { key: 'TIMEZONE', value: 'Asia/Dhaka', description: 'Default system timezone' },
      { key: 'OFFICE_NAME', value: 'Central Admission Student Transit Office', description: 'Main office legal trading name' },
      { key: 'ALLOW_STAFF_OVERBOOKING', value: 'false', description: 'Strict lock against simultaneous double booking' },
      { key: 'AUTO_CLOSE_TIME', value: '23:59', description: 'Recommended day closing cutoff time' }
    ]
  });

  // 2. ROLES & PERMISSIONS
  const permissionsList = [
    { code: 'dashboard:view', name: 'View Dashboard & KPIs', category: 'Dashboard' },
    { code: 'booking:create', name: 'Create Seat Booking', category: 'Booking' },
    { code: 'booking:edit', name: 'Modify Booking Information', category: 'Booking' },
    { code: 'booking:cancel', name: 'Cancel Booking', category: 'Booking' },
    { code: 'discount:apply_basic', name: 'Apply Basic Discount (<= 50 BDT)', category: 'Discounts' },
    { code: 'discount:approve_high', name: 'Approve High / Unlimited Discounts', category: 'Discounts' },
    { code: 'seat:lock_unlock', name: 'Lock or Unlock Bus Seats', category: 'Inventory' },
    { code: 'bus_trip:manage', name: 'Manage Buses, Routes & Trips', category: 'Fleet' },
    { code: 'payment:collect', name: 'Collect & Record Payments', category: 'Finance' },
    { code: 'payment:refund', name: 'Process Payment Refunds', category: 'Finance' },
    { code: 'day_closing:close', name: 'Close Business Day & Reconcile', category: 'Finance' },
    { code: 'day_closing:reopen', name: 'Reopen Closed Financial Day', category: 'Finance' },
    { code: 'reports:financial', name: 'View & Export Financial Reports', category: 'Reports' },
    { code: 'staff:manage', name: 'Manage Staff Accounts & RBAC', category: 'Admin' },
    { code: 'audit:view', name: 'Inspect Audit Logs & Revisions', category: 'Admin' },
    { code: 'settings:manage', name: 'Configure System Settings', category: 'Admin' },
  ];

  for (const p of permissionsList) {
    await prisma.permission.create({ data: p });
  }

  const allPerms = await prisma.permission.findMany();

  const superAdminRole = await prisma.role.create({
    data: { name: 'SUPER_ADMIN', description: 'Full Unrestricted System Governance' }
  });
  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN', description: 'Office Administration & Management' }
  });
  const managerRole = await prisma.role.create({
    data: { name: 'MANAGER', description: 'Duty Manager & Booking Supervisor' }
  });
  const bookingStaffRole = await prisma.role.create({
    data: { name: 'BOOKING_STAFF', description: 'Counter Desk Booking & Passenger Intake' }
  });
  const accountantRole = await prisma.role.create({
    data: { name: 'ACCOUNTANT', description: 'Cashier & Financial Ledger Reconciliation' }
  });
  const viewerRole = await prisma.role.create({
    data: { name: 'VIEWER', description: 'Read-Only Audit & Monitoring Observer' }
  });

  // Assign permissions
  for (const perm of allPerms) {
    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: perm.id }
    });
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id }
    });

    if (['dashboard:view', 'booking:create', 'booking:edit', 'discount:apply_basic', 'discount:approve_high', 'seat:lock_unlock', 'bus_trip:manage', 'payment:collect', 'reports:financial', 'audit:view'].includes(perm.code)) {
      await prisma.rolePermission.create({
        data: { roleId: managerRole.id, permissionId: perm.id }
      });
    }

    if (['dashboard:view', 'booking:create', 'discount:apply_basic', 'payment:collect'].includes(perm.code)) {
      await prisma.rolePermission.create({
        data: { roleId: bookingStaffRole.id, permissionId: perm.id }
      });
    }

    if (['dashboard:view', 'payment:collect', 'payment:refund', 'day_closing:close', 'reports:financial', 'audit:view'].includes(perm.code)) {
      await prisma.rolePermission.create({
        data: { roleId: accountantRole.id, permissionId: perm.id }
      });
    }

    if (['dashboard:view', 'reports:financial'].includes(perm.code)) {
      await prisma.rolePermission.create({
        data: { roleId: viewerRole.id, permissionId: perm.id }
      });
    }
  }

  // 3. USERS (STAFF)
  const defaultPassword = await bcrypt.hash('admin1234', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@transport.office',
      phone: '01711000001',
      fullName: 'Kamrul Hasan (Director)',
      passwordHash: defaultPassword,
      roleId: superAdminRole.id,
      discountLimit: 99999,
    }
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@transport.office',
      phone: '01811000002',
      fullName: 'Tariqul Islam (Operations Manager)',
      passwordHash: defaultPassword,
      roleId: managerRole.id,
      discountLimit: 200.0,
    }
  });

  const bookingStaff = await prisma.user.create({
    data: {
      email: 'staff@transport.office',
      phone: '01911000003',
      fullName: 'Rahim Chowdhury (Desk Officer)',
      passwordHash: defaultPassword,
      roleId: bookingStaffRole.id,
      discountLimit: 50.0,
    }
  });

  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@transport.office',
      phone: '01611000004',
      fullName: 'Zubair Ahmed (Chief Cashier)',
      passwordHash: defaultPassword,
      roleId: accountantRole.id,
      discountLimit: 0.0,
    }
  });

  // 4. FARE ZONES
  const vipZone = await prisma.fareZone.create({
    data: {
      name: 'VIP Front Cabin (Rows A-B)',
      description: 'Extra legroom front rows with priority exit',
      defaultFare: 650.0,
    }
  });

  const standardZone = await prisma.fareZone.create({
    data: {
      name: 'Standard Central (Rows C-G)',
      description: 'Standard comfortable admission student seats',
      defaultFare: 550.0,
    }
  });

  const rearZone = await prisma.fareZone.create({
    data: {
      name: 'Rear Economy (Rows H-J)',
      description: 'Budget rear passenger cabin seats',
      defaultFare: 500.0,
    }
  });

  // 5. SEAT LAYOUTS
  // Standard 40-Seat (10 rows of 2x2 with center aisle)
  const layout40Matrix = {
    driver: { row: 0, col: 4, label: 'Driver' },
    door: { row: 0, col: 0, label: 'Entry Door' },
    grid: [
      // Row 0: Front
      [ { type: 'DOOR', label: 'Door' }, { type: 'EMPTY' }, { type: 'EMPTY' }, { type: 'EMPTY' }, { type: 'DRIVER', label: 'Driver' } ],
      // Row 1 to 10: Seats
      [ { type: 'SEAT', label: 'A1', zone: 'VIP' }, { type: 'SEAT', label: 'A2', zone: 'VIP' }, { type: 'AISLE' }, { type: 'SEAT', label: 'A3', zone: 'VIP' }, { type: 'SEAT', label: 'A4', zone: 'VIP' } ],
      [ { type: 'SEAT', label: 'B1', zone: 'VIP' }, { type: 'SEAT', label: 'B2', zone: 'VIP' }, { type: 'AISLE' }, { type: 'SEAT', label: 'B3', zone: 'VIP' }, { type: 'SEAT', label: 'B4', zone: 'VIP' } ],
      [ { type: 'SEAT', label: 'C1', zone: 'STD' }, { type: 'SEAT', label: 'C2', zone: 'STD' }, { type: 'AISLE' }, { type: 'SEAT', label: 'C3', zone: 'STD' }, { type: 'SEAT', label: 'C4', zone: 'STD' } ],
      [ { type: 'SEAT', label: 'D1', zone: 'STD' }, { type: 'SEAT', label: 'D2', zone: 'STD' }, { type: 'AISLE' }, { type: 'SEAT', label: 'D3', zone: 'STD' }, { type: 'SEAT', label: 'D4', zone: 'STD' } ],
      [ { type: 'SEAT', label: 'E1', zone: 'STD' }, { type: 'SEAT', label: 'E2', zone: 'STD' }, { type: 'AISLE' }, { type: 'SEAT', label: 'E3', zone: 'STD' }, { type: 'SEAT', label: 'E4', zone: 'STD' } ],
      [ { type: 'SEAT', label: 'F1', zone: 'STD' }, { type: 'SEAT', label: 'F2', zone: 'STD' }, { type: 'AISLE' }, { type: 'SEAT', label: 'F3', zone: 'STD' }, { type: 'SEAT', label: 'F4', zone: 'STD' } ],
      [ { type: 'SEAT', label: 'G1', zone: 'STD' }, { type: 'SEAT', label: 'G2', zone: 'STD' }, { type: 'AISLE' }, { type: 'SEAT', label: 'G3', zone: 'STD' }, { type: 'SEAT', label: 'G4', zone: 'STD' } ],
      [ { type: 'SEAT', label: 'H1', zone: 'REAR' }, { type: 'SEAT', label: 'H2', zone: 'REAR' }, { type: 'AISLE' }, { type: 'SEAT', label: 'H3', zone: 'REAR' }, { type: 'SEAT', label: 'H4', zone: 'REAR' } ],
      [ { type: 'SEAT', label: 'I1', zone: 'REAR' }, { type: 'SEAT', label: 'I2', zone: 'REAR' }, { type: 'AISLE' }, { type: 'SEAT', label: 'I3', zone: 'REAR' }, { type: 'SEAT', label: 'I4', zone: 'REAR' } ],
      [ { type: 'SEAT', label: 'J1', zone: 'REAR' }, { type: 'SEAT', label: 'J2', zone: 'REAR' }, { type: 'AISLE' }, { type: 'SEAT', label: 'J3', zone: 'REAR' }, { type: 'SEAT', label: 'J4', zone: 'REAR' } ],
    ]
  };

  const layout40 = await prisma.seatLayout.create({
    data: {
      name: 'Hino 1J Standard 40-Seat (2x2)',
      description: 'Standard 40 passenger configuration with center aisle',
      totalRows: 11,
      totalCols: 5,
      totalSeats: 40,
      layoutJson: JSON.stringify(layout40Matrix),
    }
  });

  // Create individual seats for Layout 40
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  for (let r = 0; r < rows.length; r++) {
    const rowChar = rows[r];
    const zone = r < 2 ? vipZone : r < 7 ? standardZone : rearZone;
    const baseFare = zone.defaultFare;

    for (let c = 1; c <= 4; c++) {
      const seatNum = `${rowChar}${c}`;
      const colIndex = c <= 2 ? c - 1 : c; // col 0, 1, (2 is aisle), 3, 4
      
      // Female reserved in front rows on mixed buses by default
      const genderRule = r < 2 && (c === 1 || c === 2) ? 'FEMALE_ONLY' : 'ANY';

      await prisma.seat.create({
        data: {
          seatLayoutId: layout40.id,
          seatNumber: seatNum,
          rowIndex: r + 1,
          colIndex: colIndex,
          seatType: r === 0 ? 'VIP' : 'STANDARD',
          genderAllowed: genderRule,
          fareZoneId: zone.id,
          baseFare: baseFare,
        }
      });
    }
  }

  // 6. BUSES
  const bus1 = await prisma.bus.create({
    data: {
      busName: 'Desh Travels Express-01',
      busNumber: 'BUS-101',
      operator: 'Desh Travels Central Fleet',
      regNumber: 'DHAKA-METRO-BA-11-9081',
      capacity: 40,
      busType: 'MIXED',
      status: 'ACTIVE',
      notes: 'Air-conditioned Hyundai Chassis, GPS equipped',
      seatLayoutId: layout40.id,
    }
  });

  const bus2 = await prisma.bus.create({
    data: {
      busName: 'Ekattor Star Admission-Female Direct',
      busNumber: 'BUS-102',
      operator: 'Ekattor Transport Admission Wing',
      regNumber: 'DHAKA-METRO-BA-14-3022',
      capacity: 40,
      busType: 'FEMALE',
      status: 'ACTIVE',
      notes: 'Exclusively for female students and accompanying guardians',
      seatLayoutId: layout40.id,
    }
  });

  const bus3 = await prisma.bus.create({
    data: {
      busName: 'Hanif Pioneer Male Special',
      busNumber: 'BUS-103',
      operator: 'Hanif Enterprise',
      regNumber: 'DHAKA-METRO-BA-09-4411',
      capacity: 40,
      busType: 'MALE',
      status: 'ACTIVE',
      notes: 'Male admission candidates direct route',
      seatLayoutId: layout40.id,
    }
  });

  const bus4 = await prisma.bus.create({
    data: {
      busName: 'Shyamoli Admission Express-04',
      busNumber: 'BUS-104',
      operator: 'Shyamoli NR Travels',
      regNumber: 'DHAKA-METRO-BA-12-8877',
      capacity: 40,
      busType: 'MIXED',
      status: 'MAINTENANCE',
      notes: 'Scheduled for tire maintenance and AC overhaul',
      seatLayoutId: layout40.id,
    }
  });

  // 7. BUS ROUTES & STOPS
  const route1 = await prisma.busRoute.create({
    data: {
      routeName: 'Rajshahi University ⇄ Dhaka Farmgate (Direct Admission Line)',
      origin: 'Rajshahi University Central Gate',
      destination: 'Dhaka Farmgate / Ananda Hall',
      distanceKm: 255.0,
      estDuration: '5 hrs 30 mins',
      stops: {
        create: [
          { stopName: 'Rajshahi University Gate', sequenceNo: 1, fareOffset: 0 },
          { stopName: 'Natore Bypass', sequenceNo: 2, fareOffset: 0 },
          { stopName: 'Sirajganj Food Village Rest Stop', sequenceNo: 3, fareOffset: 0 },
          { stopName: 'Dhaka Gabtoli Terminal', sequenceNo: 4, fareOffset: 0 },
          { stopName: 'Dhaka Farmgate / Ananda', sequenceNo: 5, fareOffset: 0 }
        ]
      }
    }
  });

  const route2 = await prisma.busRoute.create({
    data: {
      routeName: 'Chittagong University ⇄ Dhaka Gabtoli (Night Express)',
      origin: 'Chittagong University 1 No Gate',
      destination: 'Dhaka Gabtoli Terminal',
      distanceKm: 248.0,
      estDuration: '6 hrs 00 mins',
      stops: {
        create: [
          { stopName: 'CU 1 No Gate', sequenceNo: 1, fareOffset: 0 },
          { stopName: 'Comilla Highway Point', sequenceNo: 2, fareOffset: 0 },
          { stopName: 'Dhaka Sayedabad', sequenceNo: 3, fareOffset: 0 },
          { stopName: 'Dhaka Gabtoli', sequenceNo: 4, fareOffset: 0 }
        ]
      }
    }
  });

  // 8. TRIPS (SCHEDULED)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const departure1 = new Date(today);
  departure1.setHours(20, 30, 0, 0); // 08:30 PM Today

  const departure2 = new Date(today);
  departure2.setHours(21, 15, 0, 0); // 09:15 PM Today

  const departure3 = new Date(today);
  departure3.setDate(departure3.getDate() + 1);
  departure3.setHours(8, 30, 0, 0); // 08:30 AM Tomorrow

  const trip1 = await prisma.trip.create({
    data: {
      tripCode: 'TRIP-20260823-001',
      busId: bus1.id,
      routeId: route1.id,
      departureDate: today,
      departureTime: departure1,
      basePrice: 550.0,
      status: 'SCHEDULED',
      notes: 'Direct transit for Rajshahi University Unit-A Admission Candidates'
    }
  });

  const trip2 = await prisma.trip.create({
    data: {
      tripCode: 'TRIP-20260823-002',
      busId: bus2.id,
      routeId: route1.id,
      departureDate: today,
      departureTime: departure2,
      tripBusType: 'FEMALE',
      basePrice: 550.0,
      status: 'SCHEDULED',
      notes: 'Female candidates special coach with female coordinator on board'
    }
  });

  const trip3 = await prisma.trip.create({
    data: {
      tripCode: 'TRIP-20260824-003',
      busId: bus3.id,
      routeId: route2.id,
      departureDate: new Date(today.getTime() + 86400000),
      departureTime: departure3,
      tripBusType: 'MALE',
      basePrice: 600.0,
      status: 'SCHEDULED',
      notes: 'Morning express for Chittagong University Candidates'
    }
  });

  // 9. STUDENTS & GUARDIANS
  const student1 = await prisma.student.create({
    data: {
      admissionId: 'RU-2026-98124',
      fullName: 'Farhana Yasmin',
      phone: '01712345678',
      gender: 'FEMALE',
      institution: 'Rajshahi University (Unit-A Science)',
      groupCategory: 'Science',
      address: 'House 14, Road 5, Dhanmondi, Dhaka',
      notes: 'Exam Center: RU Science Building Room 302',
      guardians: {
        create: [
          {
            name: 'Md. Rafiqul Islam',
            phone: '01711998877',
            relationship: 'FATHER',
            gender: 'MALE',
            notes: 'Accompanying student on admission journey'
          }
        ]
      }
    }
  });

  const student2 = await prisma.student.create({
    data: {
      admissionId: 'DU-2026-44109',
      fullName: 'Tanvir Ahmed',
      phone: '01898765432',
      gender: 'MALE',
      institution: 'Dhaka University (Ka Unit)',
      groupCategory: 'Science',
      address: 'Kazihata, Rajshahi Sadar',
      notes: 'Traveling from Rajshahi to Dhaka'
    }
  });

  const student3 = await prisma.student.create({
    data: {
      admissionId: 'RU-2026-77211',
      fullName: 'Sadia Sultana',
      phone: '01987654321',
      gender: 'FEMALE',
      institution: 'Rajshahi University (Unit-B Arts)',
      groupCategory: 'Arts',
      address: 'Uttara Sector 7, Dhaka'
    }
  });

  // 10. REALISTIC SAMPLE BOOKINGS
  const seats = await prisma.seat.findMany({
    where: { seatLayoutId: layout40.id }
  });
  const seatMap = new Map(seats.map(s => [s.seatNumber, s]));

  // Booking 1: Farhana & Father on Trip 1 (Seats A1 & A2)
  const seatA1 = seatMap.get('A1')!;
  const seatA2 = seatMap.get('A2')!;

  const booking1 = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-20260823-10284',
      tripId: trip1.id,
      createdById: bookingStaff.id,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      grossAmount: 1300.0, // 650 + 650
      discountAmount: 100.0,
      netAmount: 1200.0,
      paidAmount: 1200.0,
      dueAmount: 0.0,
      notes: 'Paid in full via bKash Merchant TrxID',
      seats: {
        create: [
          { seatId: seatA1.id, fareSnapshot: 650.0 },
          { seatId: seatA2.id, fareSnapshot: 650.0 },
        ]
      },
      passengers: {
        create: [
          {
            studentId: student1.id,
            passengerName: 'Farhana Yasmin',
            passengerPhone: '01712345678',
            passengerType: 'STUDENT',
            gender: 'FEMALE',
            seatNumber: 'A1'
          },
          {
            passengerName: 'Md. Rafiqul Islam',
            passengerPhone: '01711998877',
            passengerType: 'GUARDIAN',
            gender: 'MALE',
            seatNumber: 'A2'
          }
        ]
      }
    }
  });

  // Discount record for Booking 1
  const discount1 = await prisma.discount.create({
    data: {
      bookingId: booking1.id,
      discountType: 'FIXED',
      discountRate: 100.0,
      discountAmount: 100.0,
      reason: 'Special concession for student & guardian combo',
      appliedById: bookingStaff.id,
      approvals: {
        create: [
          {
            approvedById: manager.id,
            status: 'APPROVED',
            notes: 'Approved under admission combo allowance policy'
          }
        ]
      }
    }
  });

  // Payment record for Booking 1 (bKash)
  const payment1 = await prisma.payment.create({
    data: {
      receiptNumber: 'RCT-20260823-0042',
      bookingId: booking1.id,
      amount: 1200.0,
      method: 'BKASH',
      receivedById: bookingStaff.id,
      notes: 'bKash personal merchant counter payment',
      transactions: {
        create: [
          {
            transactionId: 'BKA928192837',
            senderReference: '01712345678',
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date()
          }
        ]
      }
    }
  });

  // Ledger for Booking 1
  await prisma.financialLedger.create({
    data: {
      entryNumber: 'LED-20260823-00101',
      entryType: 'SALE',
      debit: 1300.0,
      credit: 0.0,
      balance: 1300.0,
      bookingId: booking1.id,
      description: 'Admission Seat Sale for Booking BK-20260823-10284 (A1, A2)'
    }
  });

  await prisma.financialLedger.create({
    data: {
      entryNumber: 'LED-20260823-00102',
      entryType: 'DISCOUNT',
      debit: 0.0,
      credit: 100.0,
      balance: 1200.0,
      bookingId: booking1.id,
      description: 'Approved Combo Concession Discount for BK-20260823-10284'
    }
  });

  await prisma.financialLedger.create({
    data: {
      entryNumber: 'LED-20260823-00103',
      entryType: 'PAYMENT_RECEIVED',
      debit: 0.0,
      credit: 1200.0,
      balance: 0.0,
      paymentMethod: 'BKASH',
      bookingId: booking1.id,
      paymentId: payment1.id,
      description: 'bKash Collection Trx: BKA928192837'
    }
  });

  // Booking 2: Tanvir Ahmed on Trip 1 (Seat C1 - Partial Payment)
  const seatC1 = seatMap.get('C1')!;
  const booking2 = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-20260823-10285',
      tripId: trip1.id,
      createdById: bookingStaff.id,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PARTIALLY_PAID',
      grossAmount: 550.0,
      discountAmount: 0.0,
      netAmount: 550.0,
      paidAmount: 300.0,
      dueAmount: 250.0,
      notes: 'Hand cash advance ৳300, remaining ৳250 due before boarding',
      seats: {
        create: [
          { seatId: seatC1.id, fareSnapshot: 550.0 }
        ]
      },
      passengers: {
        create: [
          {
            studentId: student2.id,
            passengerName: 'Tanvir Ahmed',
            passengerPhone: '01898765432',
            passengerType: 'STUDENT',
            gender: 'MALE',
            seatNumber: 'C1'
          }
        ]
      }
    }
  });

  const payment2 = await prisma.payment.create({
    data: {
      receiptNumber: 'RCT-20260823-0043',
      bookingId: booking2.id,
      amount: 300.0,
      method: 'HAND_CASH',
      receivedById: bookingStaff.id,
      notes: 'Partial advance booking payment received at counter'
    }
  });

  await prisma.financialLedger.create({
    data: {
      entryNumber: 'LED-20260823-00104',
      entryType: 'SALE',
      debit: 550.0,
      credit: 0.0,
      balance: 550.0,
      bookingId: booking2.id,
      description: 'Admission Seat Sale BK-20260823-10285 (C1)'
    }
  });

  await prisma.financialLedger.create({
    data: {
      entryNumber: 'LED-20260823-00105',
      entryType: 'PAYMENT_RECEIVED',
      debit: 0.0,
      credit: 300.0,
      balance: 250.0,
      paymentMethod: 'HAND_CASH',
      bookingId: booking2.id,
      paymentId: payment2.id,
      description: 'Counter Cash Advance Collection'
    }
  });

  // Booking 3: Sadia Sultana on Trip 2 (Female Bus - Seat B1 - Nagad Paid)
  const seatB1 = seatMap.get('B1')!;
  const booking3 = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-20260823-10286',
      tripId: trip2.id,
      createdById: bookingStaff.id,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      grossAmount: 650.0,
      discountAmount: 50.0,
      netAmount: 600.0,
      paidAmount: 600.0,
      dueAmount: 0.0,
      notes: 'Paid via Nagad counter QR scan',
      seats: {
        create: [
          { seatId: seatB1.id, fareSnapshot: 650.0 }
        ]
      },
      passengers: {
        create: [
          {
            studentId: student3.id,
            passengerName: 'Sadia Sultana',
            passengerPhone: '01987654321',
            passengerType: 'STUDENT',
            gender: 'FEMALE',
            seatNumber: 'B1'
          }
        ]
      }
    }
  });

  const payment3 = await prisma.payment.create({
    data: {
      receiptNumber: 'RCT-20260823-0044',
      bookingId: booking3.id,
      amount: 600.0,
      method: 'NAGAD',
      receivedById: bookingStaff.id,
      notes: 'Nagad counter QR payment',
      transactions: {
        create: [
          {
            transactionId: 'NAG778100234',
            senderReference: '01987654321',
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date()
          }
        ]
      }
    }
  });

  await prisma.financialLedger.create({
    data: {
      entryNumber: 'LED-20260823-00106',
      entryType: 'SALE',
      debit: 650.0,
      credit: 0.0,
      balance: 650.0,
      bookingId: booking3.id,
      description: 'Female Special Seat Sale BK-20260823-10286 (B1)'
    }
  });

  await prisma.financialLedger.create({
    data: {
      entryNumber: 'LED-20260823-00107',
      entryType: 'DISCOUNT',
      debit: 0.0,
      credit: 50.0,
      balance: 600.0,
      bookingId: booking3.id,
      description: 'Early Admission Registration Discount (Staff Approved)'
    }
  });

  await prisma.financialLedger.create({
    data: {
      entryNumber: 'LED-20260823-00108',
      entryType: 'PAYMENT_RECEIVED',
      debit: 0.0,
      credit: 600.0,
      balance: 0.0,
      paymentMethod: 'NAGAD',
      bookingId: booking3.id,
      paymentId: payment3.id,
      description: 'Nagad Payment Trx: NAG778100234'
    }
  });

  // 11. SAMPLE SEAT LOCK
  const seatD4 = seatMap.get('D4')!;
  await prisma.seatLock.create({
    data: {
      tripId: trip1.id,
      seatId: seatD4.id,
      lockType: 'PERMANENT',
      reason: 'VIP',
      notes: 'Reserved for University Admission Faculty Observer',
      lockedBy: manager.id,
      isActive: true,
    }
  });

  // 12. AUDIT LOGS
  await prisma.auditLog.createMany({
    data: [
      {
        userId: bookingStaff.id,
        action: 'BOOKING_CREATED',
        entity: 'Booking',
        entityId: booking1.id,
        newValue: JSON.stringify({ bookingNumber: booking1.bookingNumber, seats: ['A1', 'A2'], netAmount: 1200 }),
        ipAddress: '192.168.1.10',
        userAgent: 'Chrome / ATOMS Internal Desktop'
      },
      {
        userId: manager.id,
        action: 'DISCOUNT_APPROVED',
        entity: 'Discount',
        entityId: discount1.id,
        newValue: JSON.stringify({ discountAmount: 100, reason: 'Student & guardian combo' }),
        ipAddress: '192.168.1.2',
        userAgent: 'Chrome / ATOMS Internal Desktop'
      },
      {
        userId: manager.id,
        action: 'SEAT_LOCKED',
        entity: 'Seat',
        entityId: seatD4.id,
        newValue: JSON.stringify({ seatNumber: 'D4', tripCode: trip1.tripCode, reason: 'VIP Faculty Observer' }),
        ipAddress: '192.168.1.2',
        userAgent: 'Chrome / ATOMS Internal Desktop'
      }
    ]
  });

  // 13. NOTIFICATIONS
  await prisma.notification.createMany({
    data: [
      {
        userId: manager.id,
        title: 'Trip 85% Capacity Alert',
        message: 'Trip TRIP-20260823-001 (Rajshahi to Dhaka) is currently at 85% booked capacity.',
        type: 'INFO',
        isRead: false,
        linkUrl: `/trips/${trip1.id}/seat-map`
      },
      {
        userId: accountant.id,
        title: 'Pending Day Reconciliation',
        message: 'Business day 2026-08-23 has 3 recorded transactions awaiting end-of-day cash reconciliation.',
        type: 'WARNING',
        isRead: false,
        linkUrl: '/day-closing'
      }
    ]
  });

  console.log('✅ ATOMS database seed completed successfully!');
  console.log(`👤 Super Admin: admin@transport.office (pwd: admin1234)`);
  console.log(`👤 Manager: manager@transport.office (pwd: admin1234)`);
  console.log(`👤 Booking Staff: staff@transport.office (pwd: admin1234)`);
  console.log(`👤 Accountant: accountant@transport.office (pwd: admin1234)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
