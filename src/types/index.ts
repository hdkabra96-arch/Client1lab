/**
 * Core Data Models and Types for ApexPath Diagnostic Laboratories
 */

export type UserRole = 'PATIENT' | 'SUPER_ADMIN' | 'LAB_ADMIN' | 'PATHOLOGIST' | 'PHLEBOTOMIST' | 'RECEPTIONIST';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  age?: number;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'MALE' | 'FEMALE' | 'OTHER';
  address?: any;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContact?: string;
  createdAt: string;
  isActive: boolean;
}

export interface TimeSlotAvailability {
  id: string;
  label: string;
  startTime?: string;
  endTime?: string;
  maxCapacity: number;
  currentBookings: number;
  remainingCapacity: number;
  available: boolean;
}

export type CollectionMethod = 'LAB_VISIT' | 'HOME_COLLECTION';

export type BookingStatus =
  | 'PENDING_CONFIRMATION'
  | 'UNDER_REVIEW'
  | 'CONTACT_PENDING'
  | 'PATIENT_CONTACTED'
  | 'CONFIRMED'
  | 'RESCHEDULE_REQUESTED'
  | 'RESCHEDULED'
  | 'SAMPLE_COLLECTION_SCHEDULED'
  | 'SAMPLE_COLLECTED'
  | 'PROCESSING'
  | 'REPORT_READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentStatus =
  | 'PENDING'
  | 'INITIATED'
  | 'PAID'
  | 'FAILED'
  | 'PAY_AT_COLLECTION'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PaymentMethod = 'ONLINE_GATEWAY' | 'PAY_AT_COLLECTION';

export interface DiagnosticTest {
  id: string;
  code: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  preparationRequired: string;
  reportTime: string;
  price: number;
  discountPrice?: number;
  sampleType: string;
  homeCollectionAvailable: boolean;
  labVisitAvailable: boolean;
  popular?: boolean;
  isActive: boolean;
}

export interface HealthPackage {
  id: string;
  code: string;
  name: string;
  tagline: string;
  description: string;
  testIds: string[];
  testsIncludedNames: string[];
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  preparationInstructions: string;
  reportTimeline: string;
  recommendedFor: string;
  popular?: boolean;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  timeRange: string; // e.g., "08:00 AM – 09:00 AM"
  startTime: string; // "08:00"
  endTime: string;   // "09:00"
  maxCapacity: number;
  homeCapacity: number;
  isActive: boolean;
}

export interface SlotAvailability {
  timeSlotId: string;
  timeRange: string;
  date: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isAvailable: boolean;
  collectionMethod: CollectionMethod;
}

export interface CallLog {
  id: string;
  appointmentId: string;
  callDate: string;
  callTime: string;
  staffId: string;
  staffName: string;
  callOutcome:
    | 'Call Attempted'
    | 'Call Successful'
    | 'Call Not Answered'
    | 'Patient Requested Callback'
    | 'Patient Confirmed'
    | 'Patient Cancelled'
    | 'Reschedule Requested';
  notes: string;
  createdAt: string;
}

export interface AppointmentItem {
  type: 'TEST' | 'PACKAGE';
  itemId: string;
  name: string;
  price: number;
}

export interface Appointment {
  id: string;
  bookingId?: string; // e.g. "LAB-2026-000123"
  referenceNumber?: string;
  patientId?: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  patientDob?: string;
  
  items?: AppointmentItem[];
  testNames?: string[];
  
  collectionMethod: CollectionMethod | string;
  appointmentDate?: string; // "YYYY-MM-DD"
  scheduledDate?: string;
  timeSlotRange?: string;
  timeSlotLabel?: string;
  timeSlotId?: string;
  
  // Home collection address
  collectionAddress?: {
    street: string;
    landmark?: string;
    city: string;
    state?: string;
    pincode: string;
  };
  
  // Medical notes
  doctorName?: string;
  referringDoctor?: string;
  prescriptionFileName?: string;
  prescriptionUrl?: string;
  specialInstructions?: string;
  fastingConfirmed: boolean;
  
  // Financials
  baseAmount?: number;
  collectionFee?: number;
  discountAmount?: number;
  couponCode?: string;
  taxAmount?: number;
  totalAmount?: number;
  grandTotal?: number;
  
  // Payment
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus | string;
  transactionId?: string;
  paymentCollectedBy?: string;
  paymentCollectedAt?: string;
  
  // Lifecycle
  status: BookingStatus | string;
  statusNotes?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedPhlebotomistName?: string;
  
  // Confirmation tracking
  confirmedAt?: string;
  confirmationEmailSent?: boolean;
  
  // Reschedule / Cancellation
  rescheduleHistory?: Array<{
    previousDate: string;
    previousSlot: string;
    newDate: string;
    newSlot: string;
    rescheduledAt: string;
    reason: string;
  }>;
  cancellationReason?: string;
  cancelledAt?: string;

  // Audit
  createdAt: string;
  updatedAt?: string;
}

export interface DiagnosticReportParameter {
  parameterName?: string;
  name?: string;
  value?: string;
  result?: string;
  unit: string;
  referenceRange: string;
  status?: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
  flag?: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
}

export interface DiagnosticReport {
  id: string;
  bookingId?: string;
  accessionNumber?: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  testName: string;
  testDate?: string;
  specimenType?: string;
  sampleCollectedAt: string;
  reportDate?: string;
  reportGeneratedAt?: string;
  verifiedBy?: string; // e.g. "Dr. Alistair Vance, MD Pathologist"
  verifiedByDoctorName?: string;
  pathologistRegNo?: string;
  notes?: string;
  clinicalRemarks?: string;
  parameters: DiagnosticReportParameter[];
  status: 'PENDING_APPROVAL' | 'VERIFIED' | 'PUBLISHED' | string;
  pdfUrl?: string;
  createdAt?: string;
}

export interface InAppNotification {
  id: string;
  recipientId: string; // user id or "ADMIN"
  title: string;
  message: string;
  type: 'BOOKING' | 'CONFIRMATION' | 'STATUS_CHANGE' | 'PAYMENT' | 'REPORT' | 'CALL';
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  recipientName: string;
  subject: string;
  emailType:
    | 'BOOKING_REQUEST_RECEIVED'
    | 'APPOINTMENT_CONFIRMED'
    | 'APPOINTMENT_RESCHEDULED'
    | 'APPOINTMENT_CANCELLED'
    | 'PAYMENT_SUCCESSFUL'
    | 'PAYMENT_FAILED'
    | 'REPORT_READY'
    | 'APPOINTMENT_REMINDER'
    | 'BOOKING_FOLLOW_UP';
  bookingId: string;
  htmlContent: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  bookingId?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Testimonial {
  id: string;
  patientName: string;
  location: string;
  rating: number;
  review: string;
  testTaken: string;
  date: string;
  isPublished: boolean;
}

export interface FAQItem {
  id: string;
  category: 'General' | 'Booking' | 'Preparation' | 'Home Collection' | 'Reports';
  question: string;
  answer: string;
  displayOrder: number;
  isPublished: boolean;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: 'NEW' | 'RESPONDED' | 'ARCHIVED';
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  isActive: boolean;
}

export interface ServiceablePincode {
  pincode: string;
  areaName: string;
  city: string;
  collectionFee: number;
  isActive: boolean;
}

export interface WebsiteSettings {
  laboratoryName: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  workingHoursWeekday: string;
  workingHoursSaturday: string;
  workingHoursSunday: string;
  homeCollectionFee: number;
  taxPercentage: number;
  minAdvanceBookingHours: number;
  maxAdvanceBookingDays: number;
  cancellationWindowHours: number;
  reschedulingWindowHours: number;
  defaultSlotCapacity: number;
  nablLicense: string;
  capAccredited: boolean;
}
