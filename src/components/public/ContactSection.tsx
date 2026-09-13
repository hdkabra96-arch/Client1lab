/**
 * Contact & Clinical Support Desk with Real Enquiry Form
 */

import React, { useState } from 'react';
import {
  MapPin,
  PhoneCall,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      setErrorMessage('Please fill in your name, contact phone, and message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await apiRequest('/enquiries', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setSubmitSuccess(true);
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit enquiry. Please call our helpline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
          Clinical Desk & Support
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Get in Touch with Our Diagnostic Specialists
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Need help preparing for a test, corporate group bookings, or physician consultations? Reach out anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-lg font-bold">Central Laboratory Hub</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apex Diagnostic Towers, 4th Floor, Medical Enclave, Main Boulevard, Mumbai 400001
            </p>

            <div className="space-y-3 pt-2 text-xs border-t border-slate-800">
              <div className="flex items-center gap-3">
                <PhoneCall className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white">+91 (022) 8800-APEX</p>
                  <p className="text-slate-400 text-[11px]">Direct Lab Booking & Enquiries</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white">+91 98765 43210</p>
                  <p className="text-slate-400 text-[11px]">24/7 Phlebotomy Dispatch Desk</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white">care@apexpathlabs.com</p>
                  <p className="text-slate-400 text-[11px]">Report Queries & Doctor Verification</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Diagnostic Working Hours</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Monday – Friday:</span>
                <strong className="text-slate-800">07:00 AM – 08:00 PM</strong>
              </div>
              <div className="flex justify-between">
                <span>Saturday:</span>
                <strong className="text-slate-800">07:00 AM – 06:00 PM</strong>
              </div>
              <div className="flex justify-between">
                <span>Sunday:</span>
                <strong className="text-slate-800">07:00 AM – 01:00 PM</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Enquiry Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Send an Inquiry to the Lab</h3>
          </div>

          {submitSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2 animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-900">Thank You! Your Message is Received.</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Our clinical coordinator has logged your request and will reach out to your contact number within 2 hours.
              </p>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="mt-2 text-xs font-bold text-emerald-800 underline"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditi Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="aditi@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inquiry Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fasting instructions, Corporate Package"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  How can our laboratory team help you? *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide any details about the tests you are seeking or questions about sample collection..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Transmitting to Lab...' : 'Submit Inquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
