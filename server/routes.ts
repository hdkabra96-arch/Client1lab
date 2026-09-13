/**
 * Complete REST API Routing Engine for ApexPath Diagnostic Laboratories
 */

import { Router } from 'express';
import crypto from 'crypto';
import { getDb, saveDb, hashPassword, verifyPassword, runInTransaction } from './db.ts';
import {
  requireAuth,
  requireAdmin,
  optionalAuth,
  createSessionToken,
  setUserPassword,
  verifyUserPassword,
  type AuthenticatedRequest,
} from './auth.ts';
import { sendTransactionalEmail } from './email.ts';
import { createPaymentOrder, verifyPaymentSignature, processSuccessfulPayment } from './payment.ts';
import type {
  Appointment,
  BookingStatus,
  CallLog,
  CollectionMethod,
  DiagnosticReport,
  DiagnosticTest,
  HealthPackage,
  PaymentMethod,
  User,
} from '../src/types/index.ts';

const router = Router();

// ==========================================
// 1. HEALTH & GENERAL CONFIG
// ==========================================
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

router.get('/config', (req, res) => {
  const db = getDb();
  res.json({
    settings: db.settings,
    pincodes: db.serviceablePincodes.filter((p) => p.isActive),
    blockedDates: db.blockedDates,
  });
});

// Validate Coupon
router.get('/coupons/validate', (req, res) => {
  const code = ((req.query.code as string) || '').toUpperCase().trim();
  const amount = Number(req.query.amount) || 0;
  const db = getDb();

  const coupon = db.coupons.find((c) => c.code === code && c.isActive);
  if (!coupon) {
    return res.status(404).json({ error: 'Invalid coupon code.' });
  }

  if (amount < coupon.minOrderAmount) {
    return res.status(400).json({
      error: `Coupon applies on minimum order value of ₹${coupon.minOrderAmount}.`,
    });
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = Math.round((amount * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    valid: true,
    code: coupon.code,
    discount,
    discountType: coupon.discountType,
  });
});

// Check Pincode
router.get('/pincodes/check', (req, res) => {
  const pincode = ((req.query.pincode as string) || '').trim();
  const db = getDb();
  const match = db.serviceablePincodes.find((p) => p.pincode === pincode && p.isActive);

  if (match) {
    res.json({
      serviceable: true,
      areaName: match.areaName,
      city: match.city,
      collectionFee: match.collectionFee,
    });
  } else {
    res.json({
      serviceable: false,
      message: 'Home sample collection is not currently serviceable at this pincode. Clinic walk-in is available.',
    });
  }
});

// All serviceable pincodes list
router.get('/pincodes', (req, res) => {
  const db = getDb();
  res.json({ pincodes: db.serviceablePincodes || [] });
});

// ==========================================
// 2. AUTHENTICATION & PATIENT ACCOUNTS
// ==========================================
router.post('/auth/register', (req, res) => {
  const { name, email, phone, password, gender, dateOfBirth, address, city, state, pincode, emergencyContact } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, mobile phone, and password are required.' });
  }

  const db = getDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name,
    email: email.toLowerCase().trim(),
    phone,
    role: 'PATIENT',
    gender: gender || 'Male',
    dateOfBirth,
    address,
    city: city || 'Mumbai',
    state: state || 'Maharashtra',
    pincode,
    emergencyContact,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  db.users.push(newUser);
  setUserPassword(newUser.id, password);
  saveDb();

  const token = createSessionToken(newUser);
  res.status(201).json({ user: newUser, token });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.isActive);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!verifyUserPassword(user.id, password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createSessionToken(user);
  res.json({ user, token });
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

router.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const db = getDb();
  const target = db.users.find((u) => u.id === user.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const { name, phone, address, city, state, pincode, gender, dateOfBirth, emergencyContact } = req.body;
  if (name) target.name = name;
  if (phone) target.phone = phone;
  if (address) target.address = address;
  if (city) target.city = city;
  if (state) target.state = state;
  if (pincode) target.pincode = pincode;
  if (gender) target.gender = gender;
  if (dateOfBirth) target.dateOfBirth = dateOfBirth;
  if (emergencyContact) target.emergencyContact = emergencyContact;

  saveDb();
  res.json({ user: target });
});

router.post('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!verifyUserPassword(user.id, currentPassword)) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  setUserPassword(user.id, newPassword);
  res.json({ success: true, message: 'Password successfully updated.' });
});

// ==========================================
// 3. TESTS & HEALTH PACKAGES
// ==========================================
router.get('/tests', (req, res) => {
  const db = getDb();
  const search = ((req.query.search as string) || '').toLowerCase();
  const category = (req.query.category as string) || '';

  let filtered = db.tests.filter((t) => t.isActive);

  if (category && category !== 'All') {
    filtered = filtered.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.code.toLowerCase().includes(search) ||
        t.shortDescription.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
    );
  }

  res.json({ tests: filtered });
});

router.get('/tests/:id', (req, res) => {
  const db = getDb();
  const test = db.tests.find((t) => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: 'Test not found.' });
  res.json({ test });
});

// Admin test CRUD
router.post('/admin/tests', requireAdmin, (req, res) => {
  const db = getDb();
  const newTest: DiagnosticTest = {
    id: `t-${Date.now()}`,
    code: req.body.code || `TST${Math.floor(100 + Math.random() * 900)}`,
    name: req.body.name,
    category: req.body.category || 'General',
    shortDescription: req.body.shortDescription || '',
    description: req.body.description || '',
    preparationRequired: req.body.preparationRequired || 'No specific fasting required.',
    reportTime: req.body.reportTime || 'Same Day',
    price: Number(req.body.price) || 500,
    discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : undefined,
    sampleType: req.body.sampleType || 'Whole Blood',
    homeCollectionAvailable: req.body.homeCollectionAvailable ?? true,
    labVisitAvailable: req.body.labVisitAvailable ?? true,
    popular: req.body.popular ?? false,
    isActive: true,
  };

  db.tests.push(newTest);
  saveDb();
  res.status(201).json({ test: newTest });
});

router.put('/admin/tests/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const index = db.tests.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Test not found.' });

  db.tests[index] = { ...db.tests[index], ...req.body };
  saveDb();
  res.json({ test: db.tests[index] });
});

router.delete('/admin/tests/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const test = db.tests.find((t) => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: 'Test not found.' });

  test.isActive = false; // soft delete
  saveDb();
  res.json({ message: 'Test archived successfully.' });
});

// Packages
router.get('/packages', (req, res) => {
  const db = getDb();
  const active = db.packages.filter((p) => p.isActive);
  res.json({ packages: active });
});

router.post('/admin/packages', requireAdmin, (req, res) => {
  const db = getDb();
  const originalPrice = Number(req.body.originalPrice) || 0;
  const discountedPrice = Number(req.body.discountedPrice) || 0;
  const savings = Math.max(0, originalPrice - discountedPrice);

  const newPkg: HealthPackage = {
    id: `pkg-${Date.now()}`,
    code: req.body.code || `PKG-${Math.floor(100 + Math.random() * 900)}`,
    name: req.body.name,
    tagline: req.body.tagline || '',
    description: req.body.description || '',
    testIds: req.body.testIds || [],
    testsIncludedNames: req.body.testsIncludedNames || [],
    originalPrice,
    discountedPrice,
    savings,
    preparationInstructions: req.body.preparationInstructions || 'Overnight fasting required.',
    reportTimeline: req.body.reportTimeline || 'Same Day',
    recommendedFor: req.body.recommendedFor || 'All Adults',
    popular: req.body.popular ?? false,
    isActive: true,
  };

  db.packages.push(newPkg);
  saveDb();
  res.status(201).json({ package: newPkg });
});

router.put('/admin/packages/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const index = db.packages.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Package not found.' });

  const originalPrice = req.body.originalPrice ? Number(req.body.originalPrice) : db.packages[index].originalPrice;
  const discountedPrice = req.body.discountedPrice ? Number(req.body.discountedPrice) : db.packages[index].discountedPrice;
  const savings = Math.max(0, originalPrice - discountedPrice);

  db.packages[index] = { ...db.packages[index], ...req.body, originalPrice, discountedPrice, savings };
  saveDb();
  res.json({ package: db.packages[index] });
});

// ==========================================
// 4. TIME SLOTS & AVAILABILITY ENGINE
// ==========================================
const handleSlotAvailability = (req: any, res: any) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const method = (req.query.collectionMethod as CollectionMethod) || 'LAB_VISIT';

  const db = getDb();

  // Check if date is blocked or holiday
  if (db.blockedDates && db.blockedDates.includes(date)) {
    return res.json({
      date,
      isBlocked: true,
      message: 'The laboratory is closed on this date for holiday / scheduled maintenance.',
      slots: [],
    });
  }

  // Calculate booked appointments for this date
  const appointmentsOnDate = (db.appointments || []).filter(
    (a) => (a.appointmentDate === date || a.scheduledDate === date) && a.status !== 'CANCELLED'
  );

  const availability = (db.slots || []).filter((s) => s.isActive).map((slot) => {
    const bookedForSlot = appointmentsOnDate.filter(
      (a) => a.timeSlotId === slot.id || a.timeSlotRange === slot.timeRange || a.timeSlotLabel === slot.timeRange
    );
    const max = method === 'HOME_COLLECTION' ? (slot.homeCapacity ?? slot.maxCapacity ?? 6) : (slot.maxCapacity ?? 8);
    const bookedCount = bookedForSlot.length;
    const remaining = Math.max(0, max - bookedCount);
    const isAvailable = remaining > 0;

    return {
      id: slot.id,
      timeSlotId: slot.id,
      label: slot.timeRange,
      timeRange: slot.timeRange,
      startTime: slot.startTime,
      endTime: slot.endTime,
      date,
      capacity: max,
      maxCapacity: max,
      bookedCount,
      currentBookings: bookedCount,
      remainingCapacity: remaining,
      available: isAvailable,
      isAvailable,
      collectionMethod: method,
    };
  });

  res.json({ date, isBlocked: false, slots: availability });
};

router.get('/slots/availability', handleSlotAvailability);
router.get('/slots/available', handleSlotAvailability);

router.get('/slots/admin', requireAdmin, (req, res) => {
  const db = getDb();
  res.json({ slots: db.slots, blockedDates: db.blockedDates });
});

router.put('/slots/admin/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const slot = db.slots.find((s) => s.id === req.params.id);
  if (!slot) return res.status(404).json({ error: 'Slot not found.' });

  if (req.body.maxCapacity !== undefined) slot.maxCapacity = Number(req.body.maxCapacity);
  if (req.body.homeCapacity !== undefined) slot.homeCapacity = Number(req.body.homeCapacity);
  if (req.body.isActive !== undefined) slot.isActive = Boolean(req.body.isActive);

  saveDb();
  res.json({ slot });
});

router.post('/slots/block-date', requireAdmin, (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required.' });

  const db = getDb();
  if (db.blockedDates.includes(date)) {
    db.blockedDates = db.blockedDates.filter((d) => d !== date);
  } else {
    db.blockedDates.push(date);
  }
  saveDb();
  res.json({ blockedDates: db.blockedDates });
});

// ==========================================
// 5. BOOKING ENGINE (TRANSACTION SAFE)
// ==========================================
router.post(['/bookings', '/appointments/book', '/appointments'], optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const {
      patient,
      collectionAddress,
      doctorName,
      prescriptionFileName,
      specialInstructions,
      fastingConfirmed,
      couponCode,
      paymentMethod,
    } = req.body;

    const patientName = req.body.patientName || patient?.name || req.user?.name;
    const patientEmail = req.body.patientEmail || patient?.email || req.user?.email;
    const patientPhone = req.body.patientPhone || patient?.phone || req.user?.phone;
    const patientAge = req.body.patientAge ? Number(req.body.patientAge) : (patient?.age ? Number(patient?.age) : undefined);
    const patientGender = req.body.patientGender || patient?.gender || req.user?.gender || 'Male';
    const appointmentDate = req.body.appointmentDate || req.body.scheduledDate;
    const timeSlotId = req.body.timeSlotId;
    const collectionMethod = req.body.collectionMethod || 'LAB_VISIT';

    let items = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      items = [];
      if (req.body.packageId) {
        items.push({ type: 'PACKAGE', itemId: req.body.packageId });
      }
      if (Array.isArray(req.body.testIds)) {
        for (const tid of req.body.testIds) {
          items.push({ type: 'TEST', itemId: tid });
        }
      }
    }

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Please select at least one test or health package.' });
    }

    if (!appointmentDate) {
      return res.status(400).json({ error: 'Please select an appointment date.' });
    }

    if (!patientName || !patientEmail || !patientPhone) {
      return res.status(400).json({ error: 'Patient name, email, and contact phone number are required.' });
    }

    if (collectionMethod === 'HOME_COLLECTION') {
      const pin = collectionAddress?.pincode || patient?.pincode || req.user?.pincode;
      const street = collectionAddress?.street || patient?.address || req.user?.address;
      if (!pin || !street) {
        return res.status(400).json({ error: 'Complete street address and pincode are required for home collection.' });
      }
    }

    // Execute in transaction to prevent slot race conditions
    const booking = runInTransaction((db) => {
      // 1. Verify slot exists and has capacity
      const slot = db.slots.find((s) => (s.id === timeSlotId || s.timeRange === timeSlotId) && s.isActive)
        || db.slots.find((s) => s.isActive)
        || { id: 'slot-01', timeRange: '08:00 AM – 09:00 AM', homeCapacity: 6, maxCapacity: 8, isActive: true };

      if (db.blockedDates && db.blockedDates.includes(appointmentDate)) {
        throw new Error('The laboratory is closed on the selected date.');
      }

      const bookedCount = (db.appointments || []).filter(
        (a) =>
          (a.appointmentDate === appointmentDate || a.scheduledDate === appointmentDate) &&
          a.timeSlotId === slot.id &&
          a.status !== 'CANCELLED'
      ).length;

      const max = collectionMethod === 'HOME_COLLECTION' ? (slot.homeCapacity ?? 6) : (slot.maxCapacity ?? 8);
      if (bookedCount >= max) {
        throw new Error('This time slot has reached full capacity. Please select another slot.');
      }

      // 2. Server-side price calculation
      const validatedItems: Appointment['items'] = [];
      let baseAmount = 0;

      for (const item of items) {
        if (item.type === 'PACKAGE') {
          const pkg = db.packages.find((p) => p.id === item.itemId && p.isActive);
          if (pkg) {
            validatedItems.push({
              type: 'PACKAGE',
              itemId: pkg.id,
              name: pkg.name,
              price: pkg.discountedPrice,
            });
            baseAmount += pkg.discountedPrice;
          }
        } else {
          const test = db.tests.find((t) => t.id === item.itemId && t.isActive);
          if (test) {
            const price = test.discountPrice || test.price;
            validatedItems.push({
              type: 'TEST',
              itemId: test.id,
              name: test.name,
              price,
            });
            baseAmount += price;
          }
        }
      }

      if (!validatedItems.length) {
        // Fallback for tests if only ids provided
        const test = db.tests[0];
        if (test) {
          validatedItems.push({
            type: 'TEST',
            itemId: test.id,
            name: test.name,
            price: test.discountPrice || test.price,
          });
          baseAmount += (test.discountPrice || test.price);
        }
      }

      // 3. Collection fee
      let collectionFee = 0;
      if (collectionMethod === 'HOME_COLLECTION') {
        const pin = collectionAddress?.pincode || patient?.pincode;
        const matchedPin = db.serviceablePincodes.find((p) => p.pincode === pin && p.isActive);
        collectionFee = matchedPin ? matchedPin.collectionFee : db.settings.homeCollectionFee;
      }

      // 4. Coupon calculation
      let discountAmount = 0;
      let appliedCoupon: string | undefined = undefined;
      if (couponCode) {
        const c = db.coupons.find((cp) => cp.code === couponCode.toUpperCase().trim() && cp.isActive);
        if (c && baseAmount >= c.minOrderAmount) {
          if (c.discountType === 'PERCENTAGE') {
            discountAmount = Math.round((baseAmount * c.discountValue) / 100);
            if (c.maxDiscount && discountAmount > c.maxDiscount) {
              discountAmount = c.maxDiscount;
            }
          } else {
            discountAmount = c.discountValue;
          }
          appliedCoupon = c.code;
        }
      }

      const totalAmount = Math.max(0, baseAmount + collectionFee - discountAmount);

      // 5. Generate Booking ID
      const count = db.appointments.length + 101;
      const bookingId = `LAB-2026-${String(count).padStart(6, '0')}`;

      // 6. Associate or create Patient user
      let patientId = req.user?.id;
      if (!patientId) {
        const existingPatient = db.users.find(
          (u) => u.email.toLowerCase() === patientEmail.toLowerCase()
        );
        if (existingPatient) {
          patientId = existingPatient.id;
        } else {
          const newPatient: User = {
            id: `usr-pat-${Date.now()}`,
            name: patientName,
            email: patientEmail.toLowerCase().trim(),
            phone: patientPhone,
            role: 'PATIENT',
            gender: patientGender,
            dateOfBirth: patient?.dateOfBirth,
            address: collectionAddress?.street || patient?.address,
            city: collectionAddress?.city || patient?.city || 'Mumbai',
            state: collectionAddress?.state || patient?.state || 'Maharashtra',
            pincode: collectionAddress?.pincode || patient?.pincode,
            createdAt: new Date().toISOString(),
            isActive: true,
          };
          db.users.push(newPatient);
          setUserPassword(newPatient.id, 'Patient@123'); // Default password for guest-booked patients
          patientId = newPatient.id;
        }
      }

      const newAppointment: Appointment = {
        id: `apt-${Date.now()}`,
        bookingId,
        referenceNumber: bookingId,
        patientId,
        patientName,
        patientEmail,
        patientPhone,
        patientAge,
        patientGender,
        patientDob: patient?.dateOfBirth || req.user?.dateOfBirth,
        items: validatedItems,
        testNames: validatedItems.map((i) => i.name),
        collectionMethod,
        appointmentDate,
        scheduledDate: appointmentDate,
        timeSlotRange: slot.timeRange,
        timeSlotLabel: slot.timeRange,
        timeSlotId: slot.id,
        collectionAddress:
          collectionMethod === 'HOME_COLLECTION'
            ? {
                street: collectionAddress?.street || patient?.address || '',
                landmark: collectionAddress?.landmark,
                city: collectionAddress?.city || 'Mumbai',
                state: collectionAddress?.state || 'Maharashtra',
                pincode: collectionAddress?.pincode || patient?.pincode || '400001',
              }
            : undefined,
        doctorName: doctorName || req.body.referringDoctor,
        referringDoctor: doctorName || req.body.referringDoctor,
        prescriptionFileName,
        specialInstructions,
        fastingConfirmed: Boolean(fastingConfirmed),
        baseAmount,
        collectionFee,
        discountAmount,
        couponCode: appliedCoupon,
        taxAmount: 0,
        totalAmount,
        grandTotal: totalAmount,
        paymentMethod: paymentMethod || 'PAY_AT_COLLECTION',
        paymentStatus: paymentMethod === 'ONLINE_GATEWAY' ? 'PENDING' : 'PAY_AT_COLLECTION',
        status: 'PENDING_CONFIRMATION',
        confirmationEmailSent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.appointments.unshift(newAppointment);

      // Create in-app notification for patient
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId: patientId,
        title: 'Booking Request Received',
        message: `Your test request ${bookingId} has been received. Our clinical coordinator will call you to confirm.`,
        type: 'BOOKING',
        bookingId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Create notification for admin desk
      db.notifications.unshift({
        id: `notif-adm-${Date.now()}`,
        recipientId: 'ADMIN',
        title: 'New Booking Request',
        message: `New booking ${bookingId} from ${patientName} (${collectionMethod === 'HOME_COLLECTION' ? 'Home' : 'Clinic'}).`,
        type: 'BOOKING',
        bookingId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return newAppointment;
    });

    // Send asynchronous transactional confirmation email
    sendTransactionalEmail({
      emailType: 'BOOKING_REQUEST_RECEIVED',
      recipient: booking.patientEmail,
      recipientName: booking.patientName,
      subject: `Your Diagnostic Test Booking Request – ${booking.bookingId}`,
      appointment: booking,
    }).catch((err) => console.error('Email send failure:', err));

    // If online payment, generate payment gateway order
    let paymentOrder = null;
    if (booking.paymentMethod === 'ONLINE_GATEWAY') {
      paymentOrder = createPaymentOrder(booking);
    }

    res.status(201).json({
      success: true,
      booking,
      appointment: booking,
      paymentOrder,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to complete booking.' });
  }
});

// Patient bookings list
router.get(['/bookings/patient', '/appointments/my'], optionalAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user;
  if (!user) {
    return res.json({ bookings: [], appointments: [] });
  }
  const patientBookings = db.appointments.filter(
    (a) => a.patientId === user.id || (user.email && a.patientEmail.toLowerCase() === user.email.toLowerCase())
  );
  res.json({ bookings: patientBookings, appointments: patientBookings });
});

// Single booking detail
router.get(['/bookings/:bookingId', '/appointments/:bookingId'], optionalAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const booking = db.appointments.find(
    (a) => a.bookingId === req.params.bookingId || a.id === req.params.bookingId || a.referenceNumber === req.params.bookingId
  );
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const callLogs = db.callLogs.filter((c) => c.appointmentId === booking.id);
  const reports = db.reports.filter((r) => r.bookingId === booking.bookingId);

  res.json({ booking, appointment: booking, callLogs, reports });
});

// Patient or Admin Cancel Booking
router.post(['/bookings/:id/cancel', '/appointments/:id/cancel'], optionalAuth, (req: AuthenticatedRequest, res) => {
  const { reason } = req.body;
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id || a.bookingId === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Booking not found.' });

  if (apt.status === 'COMPLETED' || apt.status === 'SAMPLE_COLLECTED') {
    return res.status(400).json({ error: 'Cannot cancel an appointment after sample collection has commenced.' });
  }

  apt.status = 'CANCELLED';
  apt.cancellationReason = reason || 'Patient requested cancellation.';
  apt.cancelledAt = new Date().toISOString();
  apt.updatedAt = new Date().toISOString();

  if (apt.paymentStatus === 'PAID') {
    apt.paymentStatus = 'REFUND_PENDING';
  }

  saveDb();

  sendTransactionalEmail({
    emailType: 'APPOINTMENT_CANCELLED',
    recipient: apt.patientEmail,
    recipientName: apt.patientName,
    subject: `Appointment Cancellation Notice – ${apt.bookingId}`,
    appointment: apt,
    customNotes: reason,
  }).catch(console.error);

  res.json({ success: true, booking: apt, appointment: apt });
});

// Patient or Admin Reschedule Booking
router.post(['/bookings/:id/reschedule', '/appointments/:id/reschedule'], optionalAuth, (req: AuthenticatedRequest, res) => {
  const { newDate, newSlotId, reason } = req.body;
  if (!newDate || !newSlotId) {
    return res.status(400).json({ error: 'New appointment date and slot are required.' });
  }

  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id || a.bookingId === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Booking not found.' });

  const slot = db.slots.find((s) => s.id === newSlotId && s.isActive);
  if (!slot) return res.status(400).json({ error: 'Selected slot is invalid.' });

  if (!apt.rescheduleHistory) apt.rescheduleHistory = [];
  apt.rescheduleHistory.push({
    previousDate: apt.appointmentDate,
    previousSlot: apt.timeSlotRange,
    newDate,
    newSlot: slot.timeRange,
    rescheduledAt: new Date().toISOString(),
    reason: reason || 'Rescheduled per request',
  });

  apt.appointmentDate = newDate;
  apt.scheduledDate = newDate;
  apt.timeSlotId = slot.id;
  apt.timeSlotRange = slot.timeRange;
  apt.timeSlotLabel = slot.timeRange;
  apt.status = 'RESCHEDULED';
  apt.updatedAt = new Date().toISOString();

  saveDb();

  sendTransactionalEmail({
    emailType: 'APPOINTMENT_RESCHEDULED',
    recipient: apt.patientEmail,
    recipientName: apt.patientName,
    subject: `Appointment Rescheduled – ${apt.bookingId}`,
    appointment: apt,
    customNotes: reason,
  }).catch(console.error);

  res.json({ success: true, booking: apt, appointment: apt });
});

// ==========================================
// 6. ADMIN BOOKING MANAGEMENT & WORKFLOW
// ==========================================
router.get(['/admin/bookings', '/appointments'], optionalAuth, (req, res) => {
  const db = getDb();
  const { status, payment, collectionMethod, search, date } = req.query;

  let results = [...db.appointments];

  if (status && status !== 'ALL') {
    results = results.filter((a) => a.status === status);
  }
  if (payment && payment !== 'ALL') {
    results = results.filter((a) => a.paymentStatus === payment);
  }
  if (collectionMethod && collectionMethod !== 'ALL') {
    results = results.filter((a) => a.collectionMethod === collectionMethod);
  }
  if (date) {
    results = results.filter((a) => a.appointmentDate === date);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(
      (a) =>
        a.bookingId.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.patientPhone.includes(q) ||
        a.patientEmail.toLowerCase().includes(q)
    );
  }

  res.json({ appointments: results, bookings: results, total: results.length, totalCount: results.length });
});

// Confirm appointment workflow trigger (Sends confirmation email + audit trail)
router.post(['/admin/bookings/:id/confirm', '/appointments/:id/confirm'], optionalAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id || a.bookingId === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  const staff = req.user || { id: 'usr-admin-01', name: 'Dr. Alistair Vance' };
  apt.status = 'CONFIRMED';
  apt.confirmedAt = new Date().toISOString();
  apt.updatedAt = new Date().toISOString();

  // Audit log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    adminId: staff.id,
    adminName: staff.name,
    action: 'APPOINTMENT_CONFIRMED',
    bookingId: apt.bookingId,
    details: `Appointment confirmed by ${staff.name}. Confirmation email dispatched.`,
    timestamp: new Date().toISOString(),
  });

  // Patient notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientId: apt.patientId,
    title: 'Appointment Confirmed',
    message: `Your booking ${apt.bookingId} for ${apt.appointmentDate} is confirmed.`,
    type: 'CONFIRMATION',
    bookingId: apt.bookingId,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Trigger Confirmation Email idempotently
  if (!apt.confirmationEmailSent) {
    apt.confirmationEmailSent = true;
    sendTransactionalEmail({
      emailType: 'APPOINTMENT_CONFIRMED',
      recipient: apt.patientEmail,
      recipientName: apt.patientName,
      subject: `Your Diagnostic Appointment is Confirmed – ${apt.bookingId}`,
      appointment: apt,
    }).catch(console.error);
  }

  saveDb();
  res.json({ success: true, booking: apt, appointment: apt });
});

// Update appointment lifecycle status
const handleUpdateStatus = (req: AuthenticatedRequest, res: any) => {
  const { status, notes } = req.body;
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id || a.bookingId === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  const previousStatus = apt.status;
  apt.status = status as BookingStatus;
  apt.statusNotes = notes || apt.statusNotes;
  apt.updatedAt = new Date().toISOString();

  // Audit log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    adminId: req.user?.id || 'usr-admin-01',
    adminName: req.user?.name || 'Lab Admin',
    action: `STATUS_CHANGED_${status}`,
    bookingId: apt.bookingId,
    details: `Status transitioned from ${previousStatus} to ${status}. Notes: ${notes || 'None'}`,
    timestamp: new Date().toISOString(),
  });

  saveDb();
  res.json({ success: true, booking: apt, appointment: apt });
};

router.post('/admin/bookings/:id/status', optionalAuth, handleUpdateStatus);
router.patch('/appointments/:id/status', optionalAuth, handleUpdateStatus);
router.post('/appointments/:id/status', optionalAuth, handleUpdateStatus);

// Record Lab Team Call
const handleRecordCall = (req: AuthenticatedRequest, res: any) => {
  const { callOutcome, outcome, notes } = req.body;
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id || a.bookingId === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  const staff = req.user || { id: 'usr-admin-01', name: 'Clinical Coordinator' };
  const now = new Date();

  const newCallLog: CallLog = {
    id: `call-${Date.now()}`,
    appointmentId: apt.id,
    callDate: now.toISOString().split('T')[0],
    callTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    staffId: staff.id,
    staffName: staff.name,
    callOutcome: callOutcome || outcome || 'Call Successful',
    notes: notes || 'Coordinator spoke with patient regarding preparation.',
    createdAt: now.toISOString(),
  };

  db.callLogs.unshift(newCallLog);

  // If call confirmed, optionally advance status to PATIENT_CONTACTED
  if (apt.status === 'PENDING_CONFIRMATION' || apt.status === 'CONTACT_PENDING') {
    apt.status = 'PATIENT_CONTACTED';
    apt.updatedAt = now.toISOString();
  }

  saveDb();
  res.status(201).json({ success: true, callLog: newCallLog, booking: apt, appointment: apt });
};

router.post('/admin/bookings/:id/call', optionalAuth, handleRecordCall);
router.post('/appointments/:id/record-call', optionalAuth, handleRecordCall);

// Assign Staff (Phlebotomist / Lab Tech)
const handleAssignStaff = (req: AuthenticatedRequest, res: any) => {
  const { staffId, phlebotomistId, phlebotomistName } = req.body;
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id || a.bookingId === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  const targetStaffId = staffId || phlebotomistId;
  const staff = targetStaffId ? db.users.find((u) => u.id === targetStaffId) : null;
  const assignedName = phlebotomistName || staff?.name || 'Assigned Phlebotomist';

  apt.assignedStaffId = staff?.id || targetStaffId || 'usr-phleb-01';
  apt.assignedStaffName = assignedName;
  apt.assignedPhlebotomistName = assignedName;
  apt.updatedAt = new Date().toISOString();

  saveDb();
  res.json({ success: true, booking: apt, appointment: apt });
};

router.post('/admin/bookings/:id/assign-staff', optionalAuth, handleAssignStaff);
router.post('/appointments/:id/assign-phlebotomist', optionalAuth, handleAssignStaff);

// ==========================================
// 7. PAYMENTS & TRANSACTIONS
// ==========================================
router.post('/payments/create-order', optionalAuth, (req, res) => {
  const { bookingId } = req.body;
  const db = getDb();
  const apt = db.appointments.find((a) => a.bookingId === bookingId || a.id === bookingId);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  const order = createPaymentOrder(apt);
  res.json({ order });
});

router.post('/payments/verify', optionalAuth, (req, res) => {
  const { bookingId, orderId, paymentId, signature } = req.body;
  const verified = verifyPaymentSignature(orderId, paymentId, signature);

  if (!verified) {
    return res.status(400).json({ error: 'Payment signature verification failed.' });
  }

  const updatedApt = processSuccessfulPayment(bookingId, paymentId);
  if (!updatedApt) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  sendTransactionalEmail({
    emailType: 'PAYMENT_SUCCESSFUL',
    recipient: updatedApt.patientEmail,
    recipientName: updatedApt.patientName,
    subject: `Payment Successful – Receipt for ${updatedApt.bookingId}`,
    appointment: updatedApt,
    customNotes: `Payment of ₹${updatedApt.totalAmount} received successfully via online gateway.`,
  }).catch(console.error);

  res.json({ success: true, booking: updatedApt });
});

// Admin Mark Pay-at-Collection as Collected
router.post('/admin/payments/:id/collect', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { collectedAmount, paymentMethod, notes } = req.body;
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id || a.bookingId === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  const staff = req.user!;
  apt.paymentStatus = 'PAID';
  apt.paymentCollectedBy = staff.name;
  apt.paymentCollectedAt = new Date().toISOString();
  apt.transactionId = `CASH_COLLECT_${Date.now()}`;
  apt.updatedAt = new Date().toISOString();

  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    adminId: staff.id,
    adminName: staff.name,
    action: 'PAYMENT_COLLECTED_AT_COLLECTION',
    bookingId: apt.bookingId,
    details: `Collected ₹${collectedAmount || apt.totalAmount} in ${paymentMethod || 'Cash'} by ${staff.name}. Notes: ${notes || 'None'}`,
    timestamp: new Date().toISOString(),
  });

  saveDb();
  res.json({ success: true, booking: apt });
});

// ==========================================
// 8. DIAGNOSTIC REPORTS
// ==========================================
router.get(['/reports/patient', '/reports/my', '/reports'], optionalAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user;
  if (!user) {
    return res.json({ reports: db.reports });
  }
  if (['SUPER_ADMIN', 'LAB_ADMIN', 'PATHOLOGIST', 'PHLEBOTOMIST'].includes(user.role)) {
    return res.json({ reports: db.reports });
  }
  const patientReports = db.reports.filter(
    (r) => r.patientId === user.id || (user.name && r.patientName.toLowerCase() === user.name.toLowerCase())
  );
  res.json({ reports: patientReports });
});

router.get('/reports/booking/:bookingId', (req, res) => {
  const db = getDb();
  const report = db.reports.find((r) => r.bookingId === req.params.bookingId);
  if (!report) return res.status(404).json({ error: 'Report not ready yet.' });
  res.json({ report });
});

// Admin / Pathologist Upload & Verify Report
const handleCreateReport = (req: AuthenticatedRequest, res: any) => {
  const { bookingId, appointmentId, parameters, notes, clinicalRemarks, testName } = req.body;
  const db = getDb();
  const targetId = bookingId || appointmentId;
  const apt = db.appointments.find((a) => a.bookingId === targetId || a.id === targetId);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  const pathologist = req.user || { name: 'Dr. Priya Sharma, MBBS, MD Pathology' };
  const now = new Date();

  const report: DiagnosticReport = {
    id: `rep-${Date.now()}`,
    bookingId: apt.bookingId,
    appointmentId: apt.id,
    patientId: apt.patientId,
    patientName: apt.patientName,
    testName: testName || (apt.items ? apt.items.map((i) => i.name).join(', ') : 'Diagnostic Panel'),
    testDate: apt.appointmentDate,
    sampleCollectedAt: `${apt.appointmentDate} ${(apt.timeSlotRange || '').split('–')[0].trim()}`,
    reportDate: now.toISOString().replace('T', ' ').substring(0, 16),
    verifiedBy: pathologist.name,
    pathologistRegNo: 'MCI-REG-847291-PATH',
    notes: clinicalRemarks || notes || 'Clinical correlation suggested. Test verified under standard reference intervals.',
    parameters: parameters || [
      { name: 'Hemoglobin', result: '14.2', unit: 'g/dL', referenceRange: '13.0 – 17.0', flag: 'NORMAL' },
      { name: 'Total Leukocyte Count', result: '7,200', unit: '/cumm', referenceRange: '4,000 – 11,000', flag: 'NORMAL' },
      { name: 'Platelet Count', result: '260,000', unit: '/cumm', referenceRange: '150,000 – 450,000', flag: 'NORMAL' },
    ],
    status: 'VERIFIED',
    pdfUrl: `/api/reports/${apt.bookingId}/download`,
    createdAt: now.toISOString(),
  };

  db.reports.push(report);

  // Update appointment status to REPORT_READY
  apt.status = 'REPORT_READY';
  apt.updatedAt = now.toISOString();

  // Create patient notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientId: apt.patientId,
    title: 'Diagnostic Report Ready',
    message: `Your clinical report for ${apt.bookingId} has been published by ${pathologist.name}.`,
    type: 'REPORT',
    bookingId: apt.bookingId,
    isRead: false,
    createdAt: now.toISOString(),
  });

  // Send email notification
  sendTransactionalEmail({
    emailType: 'REPORT_READY',
    recipient: apt.patientEmail,
    recipientName: apt.patientName,
    subject: `Your Clinical Diagnostic Report is Ready – ${apt.bookingId}`,
    appointment: apt,
  }).catch(console.error);

  saveDb();
  res.status(201).json({ success: true, report, booking: apt, appointment: apt });
};

router.post('/admin/reports', optionalAuth, handleCreateReport);
router.post('/reports', optionalAuth, handleCreateReport);

// Printable / Downloadable HTML Diagnostic Report
router.get('/reports/:bookingId/download', (req, res) => {
  const db = getDb();
  const report = db.reports.find((r) => r.bookingId === req.params.bookingId);
  const apt = db.appointments.find((a) => a.bookingId === req.params.bookingId);

  if (!report || !apt) {
    return res.status(404).send('Report not ready or appointment not found.');
  }

  const parametersRows = report.parameters
    .map(
      (p) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">${p.name}</td>
        <td style="padding: 10px 14px; font-weight: 700; color: ${p.flag === 'NORMAL' ? '#0f172a' : '#b91c1c'};">${p.result}</td>
        <td style="padding: 10px 14px; color: #64748b;">${p.unit}</td>
        <td style="padding: 10px 14px; color: #475569;">${p.referenceRange}</td>
        <td style="padding: 10px 14px; text-align: center;">
          <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: ${p.flag === 'NORMAL' ? '#dcfce7' : '#fee2e2'}; color: ${p.flag === 'NORMAL' ? '#166534' : '#991b1b'};">
            ${p.flag || 'NORMAL'}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>ApexPath Official Diagnostic Report - ${report.bookingId}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
        .report-page { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #0f2b48; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; background: #f8fafc; border-radius: 6px; overflow: hidden; }
        .meta-table td { padding: 8px 14px; border: 1px solid #e2e8f0; }
        .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        .table th { background: #0f2b48; color: #ffffff; padding: 10px 14px; text-align: left; font-size: 12px; letter-spacing: 0.5px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
        @media print { body { background: #ffffff; padding: 0; } .report-page { border: none; box-shadow: none; padding: 20px; } button { display: none; } }
      </style>
    </head>
    <body>
      <div style="max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end;">
        <button onclick="window.print()" style="background: #0f2b48; color: #ffffff; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">
          🖨️ Print / Save as PDF
        </button>
      </div>
      <div class="report-page">
        <div class="header">
          <div>
            <h1 style="margin: 0; color: #0f2b48; font-size: 24px;">ApexPath Diagnostic Laboratories</h1>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;">ISO 15189:2022 & CAP Accredited Central Pathology Center</p>
            <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">Apex Diagnostic Towers, Medical Enclave, Mumbai 400001 | Lic: MC-4829</p>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: #0f2b48; font-size: 14px;">BARCODE ID</div>
            <div style="font-family: monospace; font-size: 16px; letter-spacing: 2px; color: #0284c7;">*${report.bookingId}*</div>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td><strong>Patient Name:</strong> ${report.patientName}</td>
            <td><strong>Booking ID:</strong> ${report.bookingId}</td>
          </tr>
          <tr>
            <td><strong>Age / Gender:</strong> ${apt.patientGender || 'Adult'}</td>
            <td><strong>Sample Collected:</strong> ${report.sampleCollectedAt}</td>
          </tr>
          <tr>
            <td><strong>Referred By:</strong> ${apt.doctorName || 'Self Referral'}</td>
            <td><strong>Report Released:</strong> ${report.reportDate}</td>
          </tr>
        </table>

        <h3 style="color: #0f2b48; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin: 24px 0 12px 0;">
          Department of Clinical Pathology & Haematology
        </h3>
        <p style="font-size: 13px; color: #475569; margin: 0 0 12px 0;">Investigation: <strong>${report.testName}</strong></p>

        <table class="table">
          <thead>
            <tr>
              <th>TEST PARAMETER</th>
              <th>OBSERVED VALUE</th>
              <th>UNIT</th>
              <th>REFERENCE RANGE</th>
              <th style="text-align: center;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${parametersRows}
          </tbody>
        </table>

        <div style="background: #f1f5f9; padding: 14px; border-radius: 6px; margin-top: 24px; font-size: 12px; color: #334155;">
          <strong>Pathologist Remarks:</strong> ${report.notes}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px;">
          <div style="font-size: 11px; color: #64748b;">
            <p style="margin: 0;">• Automated Chemiluminescence & 5-Part Cell Counter</p>
            <p style="margin: 4px 0 0 0;">• Dual Internal Calibrations verified daily</p>
          </div>
          <div style="text-align: right;">
            <div style="font-family: cursive; font-size: 18px; color: #0f2b48; margin-bottom: 4px;">Priya Sharma / Alistair Vance</div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${report.verifiedBy}</div>
            <div style="font-size: 11px; color: #64748b;">Reg No: ${report.pathologistRegNo}</div>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0; text-align: center;">End of Diagnostic Test Report. This laboratory report is verified electronically and complies with digital clinical diagnostic protocols.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ==========================================
// 9. ADMIN DASHBOARD ANALYTICS & AUDITING
// ==========================================
router.get('/admin/analytics', requireAdmin, (req, res) => {
  const db = getDb();
  const appointments = db.appointments;
  const todayStr = new Date().toISOString().split('T')[0];

  const todayBookings = appointments.filter((a) => a.appointmentDate === todayStr);
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMED');
  const pendingConfirmation = appointments.filter((a) => a.status === 'PENDING_CONFIRMATION');
  const reportsPending = appointments.filter(
    (a) => a.status === 'SAMPLE_COLLECTED' || a.status === 'PROCESSING'
  );
  const completed = appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'REPORT_READY');
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED');

  const totalRevenue = appointments
    .filter((a) => a.paymentStatus === 'PAID')
    .reduce((sum, a) => sum + a.totalAmount, 0);

  const onlinePaymentsCount = appointments.filter((a) => a.paymentMethod === 'ONLINE_GATEWAY').length;
  const payAtCollectionCount = appointments.filter((a) => a.paymentMethod === 'PAY_AT_COLLECTION').length;

  const homeCollectionCount = appointments.filter((a) => a.collectionMethod === 'HOME_COLLECTION').length;
  const labVisitCount = appointments.filter((a) => a.collectionMethod === 'LAB_VISIT').length;

  // Chart data: Bookings over recent days
  const bookingsByDayMap: Record<string, number> = {};
  const revenueByDayMap: Record<string, number> = {};

  // Default past 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    bookingsByDayMap[dStr] = 0;
    revenueByDayMap[dStr] = 0;
  }

  appointments.forEach((a) => {
    if (bookingsByDayMap[a.appointmentDate] !== undefined) {
      bookingsByDayMap[a.appointmentDate]++;
      if (a.paymentStatus === 'PAID') {
        revenueByDayMap[a.appointmentDate] += a.totalAmount;
      }
    }
  });

  const dailyTrend = Object.keys(bookingsByDayMap).map((d) => ({
    date: d.substring(5),
    bookings: bookingsByDayMap[d],
    revenue: revenueByDayMap[d],
  }));

  // Popular tests tally
  const testCounts: Record<string, number> = {};
  appointments.forEach((a) => {
    a.items.forEach((item) => {
      testCounts[item.name] = (testCounts[item.name] || 0) + 1;
    });
  });

  const popularTests = Object.keys(testCounts)
    .map((name) => ({ name, count: testCounts[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  res.json({
    metrics: {
      totalBookings: appointments.length,
      todayBookings: todayBookings.length,
      confirmedCount: confirmed.length,
      pendingConfirmationCount: pendingConfirmation.length,
      reportsPendingCount: reportsPending.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      totalRevenue,
      onlinePaymentsCount,
      payAtCollectionCount,
      homeCollectionCount,
      labVisitCount,
      totalPatients: db.users.filter((u) => u.role === 'PATIENT').length,
    },
    dailyTrend,
    popularTests,
    paymentBreakdown: [
      { name: 'Online Gateway (UPI/Card)', value: onlinePaymentsCount },
      { name: 'Pay at Collection', value: payAtCollectionCount },
    ],
    collectionBreakdown: [
      { name: 'Certified Home Collection', value: homeCollectionCount },
      { name: 'Laboratory Walk-in', value: labVisitCount },
    ],
  });
});

router.get('/admin/patients', requireAdmin, (req, res) => {
  const db = getDb();
  const search = ((req.query.search as string) || '').toLowerCase();

  let patients = db.users.filter((u) => u.role === 'PATIENT');

  if (search) {
    patients = patients.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search) ||
        p.phone.includes(search)
    );
  }

  // Enrich with booking stats
  const enriched = patients.map((p) => {
    const userBookings = db.appointments.filter(
      (a) => a.patientId === p.id || a.patientEmail.toLowerCase() === p.email.toLowerCase()
    );
    const totalSpent = userBookings
      .filter((a) => a.paymentStatus === 'PAID')
      .reduce((sum, a) => sum + a.totalAmount, 0);

    return {
      ...p,
      totalBookings: userBookings.length,
      completedBookings: userBookings.filter((a) => a.status === 'COMPLETED' || a.status === 'REPORT_READY').length,
      upcomingBookings: userBookings.filter((a) => a.status === 'CONFIRMED').length,
      cancelledBookings: userBookings.filter((a) => a.status === 'CANCELLED').length,
      totalSpent,
    };
  });

  res.json({ patients: enriched });
});

router.get('/admin/staff', requireAdmin, (req, res) => {
  const db = getDb();
  const staff = db.users.filter((u) => u.role !== 'PATIENT');
  res.json({ staff });
});

router.get('/admin/audit-logs', requireAdmin, (req, res) => {
  const db = getDb();
  res.json({ auditLogs: db.auditLogs.slice(0, 100) });
});

router.get(['/admin/email-logs', '/admin/emails'], optionalAuth, (req, res) => {
  const db = getDb();
  const logs = db.emailLogs.slice(0, 100);
  res.json({ emailLogs: logs, emails: logs, logs });
});

// Notifications
router.get('/notifications', optionalAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const targetId = req.user?.id || 'ADMIN';
  const notifs = db.notifications.filter(
    (n) => n.recipientId === targetId || (req.user?.role !== 'PATIENT' && n.recipientId === 'ADMIN')
  );
  res.json({ notifications: notifs });
});

router.post('/notifications/:id/read', optionalAuth, (req, res) => {
  const db = getDb();
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    saveDb();
  }
  res.json({ success: true });
});

// ==========================================
// 10. CMS, ENQUIRIES, REVIEWS, SETTINGS
// ==========================================
router.get('/faqs', (req, res) => {
  const db = getDb();
  res.json({ faqs: db.faqs.filter((f) => f.isPublished).sort((a, b) => a.displayOrder - b.displayOrder) });
});

router.post('/admin/faqs', requireAdmin, (req, res) => {
  const db = getDb();
  const newFaq = {
    id: `faq-${Date.now()}`,
    category: req.body.category || 'General',
    question: req.body.question,
    answer: req.body.answer,
    displayOrder: db.faqs.length + 1,
    isPublished: true,
  };
  db.faqs.push(newFaq);
  saveDb();
  res.status(201).json({ faq: newFaq });
});

router.put('/admin/faqs/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const index = db.faqs.findIndex((f) => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'FAQ not found' });
  db.faqs[index] = { ...db.faqs[index], ...req.body };
  saveDb();
  res.json({ faq: db.faqs[index] });
});

router.delete('/admin/faqs/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.faqs = db.faqs.filter((f) => f.id !== req.params.id);
  saveDb();
  res.json({ success: true });
});

router.get('/testimonials', (req, res) => {
  const db = getDb();
  res.json({ testimonials: db.testimonials.filter((t) => t.isPublished) });
});

router.post('/admin/testimonials', requireAdmin, (req, res) => {
  const db = getDb();
  const item = {
    id: `tstm-${Date.now()}`,
    patientName: req.body.patientName,
    location: req.body.location || 'Mumbai',
    rating: Number(req.body.rating) || 5,
    review: req.body.review,
    testTaken: req.body.testTaken || 'Health Checkup',
    date: new Date().toISOString().split('T')[0],
    isPublished: true,
  };
  db.testimonials.push(item);
  saveDb();
  res.status(201).json({ testimonial: item });
});

router.post('/enquiries', (req, res) => {
  const { name, phone, email, subject, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Name, phone number, and message are required.' });
  }

  const db = getDb();
  const enq = {
    id: `enq-${Date.now()}`,
    name,
    phone,
    email: email || '',
    subject: subject || 'General Inquiry',
    message,
    status: 'NEW' as const,
    createdAt: new Date().toISOString(),
  };

  db.enquiries.unshift(enq);
  saveDb();
  res.status(201).json({ success: true, enquiry: enq });
});

router.get('/admin/enquiries', requireAdmin, (req, res) => {
  const db = getDb();
  res.json({ enquiries: db.enquiries });
});

router.put('/admin/enquiries/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const enq = db.enquiries.find((e) => e.id === req.params.id);
  if (!enq) return res.status(404).json({ error: 'Enquiry not found' });
  if (req.body.status) enq.status = req.body.status;
  saveDb();
  res.json({ enquiry: enq });
});

router.get('/settings', (req, res) => {
  const db = getDb();
  res.json({ settings: db.settings });
});

router.put('/admin/settings', requireAdmin, (req, res) => {
  const db = getDb();
  db.settings = { ...db.settings, ...req.body };
  saveDb();
  res.json({ settings: db.settings });
});

export default router;
