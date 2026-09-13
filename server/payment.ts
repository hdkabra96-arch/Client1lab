/**
 * Payment Gateway Integration Layer (Razorpay / UPI / Cards / Pay-at-Collection)
 */

import crypto from 'crypto';
import { getDb, saveDb } from './db.ts';
import type { Appointment, PaymentStatus } from '../src/types/index.ts';

const PAYMENT_KEY_ID = process.env.PAYMENT_KEY_ID || 'rzp_test_ApexPath2026';
const PAYMENT_KEY_SECRET = process.env.PAYMENT_KEY_SECRET || 'apex_test_secret_key_9921';

export interface CreateOrderResult {
  orderId: string;
  amount: number; // in paise or rupees
  currency: string;
  keyId: string;
}

export function createPaymentOrder(appointment: Appointment): CreateOrderResult {
  const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  return {
    orderId,
    amount: Math.round(appointment.totalAmount * 100), // in paise for Razorpay
    currency: 'INR',
    keyId: PAYMENT_KEY_ID,
  };
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  // If in demo test mode or simulated gateway:
  if (signature.startsWith('simulated_sig_') || !PAYMENT_KEY_SECRET) {
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', PAYMENT_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
}

export function processSuccessfulPayment(
  appointmentId: string,
  transactionId: string
): Appointment | null {
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === appointmentId || a.bookingId === appointmentId);
  if (!apt) return null;

  apt.paymentStatus = 'PAID';
  apt.transactionId = transactionId;
  apt.updatedAt = new Date().toISOString();

  // Also add an audit log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    adminId: 'SYSTEM',
    adminName: 'Payment Gateway',
    action: 'PAYMENT_VERIFIED',
    bookingId: apt.bookingId,
    details: `Online payment of ₹${apt.totalAmount} verified. Transaction ID: ${transactionId}`,
    timestamp: new Date().toISOString(),
  });

  saveDb();
  return apt;
}
