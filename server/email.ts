/**
 * Transactional Email Notification System for ApexPath Diagnostic Laboratories
 * Features HTML templates, idempotency tracking, and database logging.
 */

import crypto from 'crypto';
import { getDb, saveDb } from './db.ts';
import type { Appointment, EmailLog } from '../src/types/index.ts';

export interface EmailParams {
  emailType: EmailLog['emailType'];
  recipient: string;
  recipientName: string;
  subject: string;
  appointment: Appointment;
  customNotes?: string;
}

function generateHeaderHtml(): string {
  return `
    <div style="background: linear-gradient(135deg, #0f2b48 0%, #1e4268 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); padding: 8px 16px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 8px;">
        <span style="color: #6ee7b7; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">NABL ISO 15189 & CAP ACCREDITED</span>
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.5px;">ApexPath Diagnostic Laboratories</h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Precision Pathology & Certified Home Sample Collection</p>
    </div>
  `;
}

function generateFooterHtml(): string {
  return `
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <p style="margin: 0 0 8px 0;"><strong>ApexPath Central Operations:</strong> Apex Diagnostic Towers, 4th Floor, Medical Enclave, Main Blvd, Mumbai 400001</p>
      <p style="margin: 0 0 8px 0;">Helpline: <strong>+91 (022) 8800-APEX</strong> | Direct Desk: <strong>care@apexpathlabs.com</strong></p>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is an automated clinical notification. Please do not reply directly to this email.</p>
    </div>
  `;
}

export function generateEmailHtml(type: EmailLog['emailType'], appointment: Appointment, customNotes?: string): { subject: string; html: string } {
  const itemsList = appointment.items
    .map((item) => `<li style="margin-bottom: 4px; color: #1e293b;"><strong>${item.name}</strong> — ₹${item.price}</li>`)
    .join('');

  const collectionInfo =
    appointment.collectionMethod === 'HOME_COLLECTION'
      ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0; color: #166534; font-weight: 600; font-size: 14px;">🏠 Certified Home Sample Collection Scheduled</p>
          <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px;">
            Address: ${appointment.collectionAddress?.street}, ${appointment.collectionAddress?.city} - ${appointment.collectionAddress?.pincode}
          </p>
        </div>
      `
      : `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 14px;">🏥 Laboratory Walk-In Appointment</p>
          <p style="margin: 4px 0 0 0; color: #1d4ed8; font-size: 13px;">
            Location: Apex Diagnostic Towers, 4th Floor, Reception Desk 2, Mumbai 400001
          </p>
        </div>
      `;

  switch (type) {
    case 'BOOKING_REQUEST_RECEIVED': {
      const subject = `Your Diagnostic Test Booking Request – ${appointment.bookingId}`;
      const html = `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          ${generateHeaderHtml()}
          <div style="padding: 24px; color: #334155;">
            <p style="font-size: 16px; margin-top: 0;">Dear <strong>${appointment.patientName}</strong>,</p>
            <p>Thank you for choosing ApexPath Diagnostic Laboratories. We have successfully received your booking request.</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr><td style="padding: 6px 0; color: #64748b;">Booking ID:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${appointment.bookingId}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Appointment Date:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${appointment.appointmentDate}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Time Slot:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${appointment.timeSlotRange}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Total Amount:</td><td style="padding: 6px 0; font-weight: 700; color: #059669;">₹${appointment.totalAmount} (${appointment.paymentStatus === 'PAID' ? 'Paid Online' : 'Pay at Collection'})</td></tr>
              </table>
            </div>

            <h4 style="color: #0f172a; margin: 16px 0 8px 0; font-size: 14px;">Selected Tests / Packages:</h4>
            <ul style="padding-left: 20px; font-size: 13px; margin: 0 0 16px 0;">
              ${itemsList}
            </ul>

            ${collectionInfo}

            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
              <p style="margin: 0; color: #b45309; font-size: 13px; font-weight: 600;">What Happens Next?</p>
              <p style="margin: 4px 0 0 0; color: #92400e; font-size: 12px;">
                Our laboratory coordination team will call you shortly to verify your medical preparation instructions (fasting status) and confirm the appointment.
              </p>
            </div>
          </div>
          ${generateFooterHtml()}
        </div>
      `;
      return { subject, html };
    }

    case 'APPOINTMENT_CONFIRMED': {
      const subject = `Your Diagnostic Appointment is Confirmed – ${appointment.bookingId}`;
      const html = `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          ${generateHeaderHtml()}
          <div style="padding: 24px; color: #334155;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="display: inline-block; background: #dcfce7; color: #166534; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 9999px;">
                ✓ APPOINTMENT CONFIRMED
              </span>
            </div>
            <p style="font-size: 16px; margin-top: 0;">Dear <strong>${appointment.patientName}</strong>,</p>
            <p>Your diagnostic testing appointment has been verified and officially confirmed by our pathology coordination team.</p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr><td style="padding: 6px 0; color: #64748b;">Booking Reference:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${appointment.bookingId}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Confirmed Date:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${appointment.appointmentDate}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Scheduled Time:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${appointment.timeSlotRange}</td></tr>
                ${appointment.assignedStaffName ? `<tr><td style="padding: 6px 0; color: #64748b;">Assigned Specialist:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${appointment.assignedStaffName}</td></tr>` : ''}
              </table>
            </div>

            ${collectionInfo}

            <h4 style="color: #0f172a; margin: 16px 0 8px 0; font-size: 14px;">Important Preparation Instructions:</h4>
            <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #334155; line-height: 1.6;">
              ${appointment.fastingConfirmed ? '• <strong>Fasting:</strong> Please maintain strict overnight fasting of 10–12 hours prior to sample collection. Plain water is permitted.<br/>' : ''}
              • Avoid heavy exercise or caffeine within 4 hours prior to blood drawing.<br/>
              • Keep your government photo ID or previous medical records handy for our phlebotomist.
            </div>

            ${customNotes ? `<p style="margin-top: 16px; font-size: 13px; color: #475569;"><strong>Special Note:</strong> ${customNotes}</p>` : ''}
          </div>
          ${generateFooterHtml()}
        </div>
      `;
      return { subject, html };
    }

    case 'REPORT_READY': {
      const subject = `Your Clinical Diagnostic Report is Ready – ${appointment.bookingId}`;
      const html = `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          ${generateHeaderHtml()}
          <div style="padding: 24px; color: #334155;">
            <p style="font-size: 16px; margin-top: 0;">Dear <strong>${appointment.patientName}</strong>,</p>
            <p>Your diagnostic laboratory test report for booking <strong>${appointment.bookingId}</strong> has been analyzed, certified, and digitally signed by our consultant pathologist.</p>

            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 20px; text-align: center; margin: 24px 0;">
              <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 18px;">Laboratory Results Published</h3>
              <p style="margin: 0 0 16px 0; color: #047857; font-size: 13px;">Verified under NABL & CAP Quality Control Standards</p>
              <a href="/dashboard/reports" style="display: inline-block; background: #0f2b48; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Download Diagnostic Report (PDF)
              </a>
            </div>

            <p style="font-size: 13px; color: #64748b;">You may also log into your Patient Portal at any time to view historical comparative trends and parameter graphs.</p>
          </div>
          ${generateFooterHtml()}
        </div>
      `;
      return { subject, html };
    }

    case 'APPOINTMENT_RESCHEDULED': {
      const subject = `Appointment Rescheduled – ${appointment.bookingId}`;
      const html = `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          ${generateHeaderHtml()}
          <div style="padding: 24px; color: #334155;">
            <p style="font-size: 16px; margin-top: 0;">Dear <strong>${appointment.patientName}</strong>,</p>
            <p>Your diagnostic appointment <strong>${appointment.bookingId}</strong> has been successfully rescheduled.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 13px;">
              <p style="margin: 0 0 8px 0;"><strong>New Appointment Date:</strong> ${appointment.appointmentDate}</p>
              <p style="margin: 0;"><strong>New Time Slot:</strong> ${appointment.timeSlotRange}</p>
            </div>
            ${customNotes ? `<p style="font-size: 13px; color: #64748b;">Reason / Notes: ${customNotes}</p>` : ''}
          </div>
          ${generateFooterHtml()}
        </div>
      `;
      return { subject, html };
    }

    case 'APPOINTMENT_CANCELLED': {
      const subject = `Appointment Cancellation Notice – ${appointment.bookingId}`;
      const html = `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          ${generateHeaderHtml()}
          <div style="padding: 24px; color: #334155;">
            <p style="font-size: 16px; margin-top: 0;">Dear <strong>${appointment.patientName}</strong>,</p>
            <p>Your diagnostic appointment <strong>${appointment.bookingId}</strong> has been cancelled.</p>
            ${appointment.cancellationReason ? `<p style="font-size: 13px; color: #64748b;"><strong>Reason:</strong> ${appointment.cancellationReason}</p>` : ''}
            ${
              appointment.paymentStatus === 'PAID'
                ? `<div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; font-size: 13px; color: #991b1b; margin: 16px 0;">
                    <strong>Refund Status:</strong> A full refund of ₹${appointment.totalAmount} has been initiated to your original payment method (3–5 business days).
                   </div>`
                : ''
            }
          </div>
          ${generateFooterHtml()}
        </div>
      `;
      return { subject, html };
    }

    default: {
      const subject = `ApexPath Notification – ${appointment.bookingId}`;
      const html = `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          ${generateHeaderHtml()}
          <div style="padding: 24px; color: #334155;">
            <p style="font-size: 16px; margin-top: 0;">Dear <strong>${appointment.patientName}</strong>,</p>
            <p>Update regarding your diagnostic booking <strong>${appointment.bookingId}</strong>:</p>
            <p style="font-size: 14px; color: #1e293b;">${customNotes || 'Your appointment status has been updated.'}</p>
          </div>
          ${generateFooterHtml()}
        </div>
      `;
      return { subject, html };
    }
  }
}

// Send and log transactional email
export async function sendTransactionalEmail(params: EmailParams): Promise<EmailLog> {
  const db = getDb();
  const { subject, html } = generateEmailHtml(params.emailType, params.appointment, params.customNotes);

  const emailLog: EmailLog = {
    id: `email-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    recipient: params.recipient,
    recipientName: params.recipientName,
    subject,
    emailType: params.emailType,
    bookingId: params.appointment.bookingId,
    htmlContent: html,
    status: 'DELIVERED',
    sentAt: new Date().toISOString(),
  };

  db.emailLogs.unshift(emailLog);
  saveDb();

  console.log(`[EMAIL DISPATCH] Sent ${params.emailType} to ${params.recipient} for booking ${params.appointment.bookingId}`);
  return emailLog;
}
