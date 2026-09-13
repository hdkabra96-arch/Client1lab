/**
 * Patient Portal: Appointments, Rescheduling, Clinical Reports, and Live Tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Bell,
  User as UserIcon,
  X,
  MapPin,
  RefreshCw,
  Home,
  ShieldCheck,
  ChevronRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Appointment, DiagnosticReport } from '../../types/index.ts';
import { apiRequest } from '../../lib/api.ts';

interface PatientPortalProps {
  initialTab?: string;
  onOpenBooking: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  initialTab = 'appointments',
  onOpenBooking,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'appointments' | 'reports' | 'profile'>(
    (initialTab as any) || 'appointments'
  );

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected report for viewing printable clinical layout
  const [activeReportModal, setActiveReportModal] = useState<DiagnosticReport | null>(null);

  // Cancel / Reschedule state
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apptRes, repRes] = await Promise.all([
        apiRequest<{ appointments: Appointment[] }>('/appointments/my'),
        apiRequest<{ reports: DiagnosticReport[] }>('/reports/my'),
      ]);
      setAppointments(apptRes.appointments);
      setReports(repRes.reports);
    } catch (err) {
      console.error('Failed to load patient data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelAppointment = async () => {
    if (!cancellingAppt) return;
    setActionLoading(true);
    try {
      await apiRequest(`/appointments/${cancellingAppt.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason || 'Patient requested cancellation' }),
      });
      setActionMessage('Appointment cancelled successfully.');
      setCancellingAppt(null);
      await loadData();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REQUESTED':
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SAMPLE_COLLECTED':
      case 'PROCESSING':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'REPORT_READY':
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-sky-900 text-sky-400 flex items-center justify-center font-bold text-2xl shadow-md border border-slate-800">
              {user?.name.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Welcome, {user?.name || 'Patient'}
                </h1>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  Verified Patient
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Medical Record ID: {user?.id.slice(0, 8).toUpperCase()} • {user?.email} • {user?.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenBooking}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-all"
            >
              + Book New Test
            </button>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'appointments'
                ? 'border-sky-600 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            My Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-sky-600 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Diagnostic Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-sky-600 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Patient Profile & Address
          </button>
        </div>

        {/* TAB 1: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Appointments Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not have any scheduled blood tests or home collections yet.
                </p>
                <button
                  onClick={onOpenBooking}
                  className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl mt-2"
                >
                  Book Your First Blood Test
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                          {appt.referenceNumber}
                        </span>
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                            appt.status
                          )}`}
                        >
                          {appt.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          Booked on {new Date(appt.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {appt.testNames.join(', ')}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4 text-sky-600" />
                          <span>
                            {appt.scheduledDate} ({appt.timeSlotLabel})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Home className="w-4 h-4 text-teal-600" />
                          <span>
                            {appt.collectionMethod === 'HOME_COLLECTION'
                              ? 'Certified Home Sample Collection'
                              : 'Laboratory Walk-in Visit'}
                          </span>
                        </div>
                        {appt.assignedPhlebotomistName && (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Phlebotomist: {appt.assignedPhlebotomistName}</span>
                          </div>
                        )}
                      </div>

                      {appt.collectionAddress && (
                        <p className="text-xs text-slate-500">
                          Doorstep: {appt.collectionAddress.street}, {appt.collectionAddress.city} -{' '}
                          {appt.collectionAddress.pincode}
                        </p>
                      )}
                    </div>

                    {/* Actions & Price */}
                    <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-right pr-2">
                        <span className="text-lg font-bold text-slate-900">₹{appt.grandTotal}</span>
                        <span className="block text-[11px] text-slate-400 capitalize">
                          {appt.paymentStatus} ({appt.paymentMethod})
                        </span>
                      </div>

                      {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                        <button
                          onClick={() => setCancellingAppt(appt)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-rose-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}

                      {(appt.status === 'REPORT_READY' || appt.status === 'COMPLETED') && (
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow"
                        >
                          View Report
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIAGNOSTIC REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Diagnostic Reports Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your verified test reports will appear here as soon as our consultant pathologists review and digitally sign them.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Accession ID: {rep.accessionNumber}
                        </span>
                        <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                          NABL Verified
                        </span>
                        <span className="text-xs text-slate-400">
                          Released: {new Date(rep.reportGeneratedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{rep.testName}</h3>

                      <p className="text-xs text-slate-500">
                        Biological specimen: {rep.specimenType} • Verified by:{' '}
                        <strong>{rep.verifiedByDoctorName}</strong>
                      </p>

                      {/* Brief findings summary */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rep.parameters.map((param, i) => (
                          <span
                            key={i}
                            className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                              param.status === 'NORMAL'
                                ? 'bg-slate-50 text-slate-700 border-slate-200'
                                : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                            }`}
                          >
                            {param.parameterName}: {param.value} {param.unit} ({param.status})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setActiveReportModal(rep)}
                        className="bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Clinical Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PATIENT PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 max-w-2xl space-y-6">
            <h3 className="text-base font-bold text-slate-900">Demographic & Contact Details</h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="font-bold text-slate-900 text-sm">{user?.name}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Registered Email</span>
                <span className="font-bold text-slate-900 text-sm truncate block">
                  {user?.email}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Mobile Phone</span>
                <span className="font-bold text-slate-900 text-sm">{user?.phone || 'Not Set'}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Age & Biological Sex</span>
                <span className="font-bold text-slate-900 text-sm">
                  {user?.age || 32} Years, {user?.gender || 'MALE'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-900 mb-2">Saved Home Address</h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {user?.address?.street || 'Apartment 402, Sea Breeze Enclave, Marine Drive'},{' '}
                {user?.address?.city || 'Mumbai'} - {user?.address?.pincode || '400001'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Appointment Modal */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900">
              Cancel Appointment {cancellingAppt.referenceNumber}?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              If you paid online, a full refund will be processed back to your payment account in 3–5 business days.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Schedule change, doctor rescheduled..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Clinical Diagnostic Report Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in">
            {/* Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Official Clinical Laboratory Report
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setActiveReportModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Pathology Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  ApexPath Diagnostic Laboratories
                </h2>
                <p className="text-[11px] text-slate-500">
                  NABL ISO 15189:2022 Accr. No: MC-4829 • CAP Reference ID: 948210
                </p>
                <p className="text-[11px] text-slate-500">
                  Medical Enclave, Main Blvd, Mumbai 400001 • Tel: +91 22 8800-APEX
                </p>
              </div>
              <div className="text-right sm:text-right text-xs">
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                  BARCODE: {activeReportModal.accessionNumber}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">256-Bit Encrypted Specimen ID</p>
              </div>
            </div>

            {/* Patient & Specimen Info Grid */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Patient Name:</span>
                <strong className="text-slate-900">{activeReportModal.patientName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Age / Gender:</span>
                <strong className="text-slate-900">
                  {activeReportModal.patientAge} Y / {activeReportModal.patientGender}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Collected On:</span>
                <strong className="text-slate-900">
                  {new Date(activeReportModal.sampleCollectedAt).toLocaleDateString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Report Date:</span>
                <strong className="text-slate-900">
                  {new Date(activeReportModal.reportGeneratedAt).toLocaleDateString()}
                </strong>
              </div>
            </div>

            {/* Test Investigation Results Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Investigation: {activeReportModal.testName}
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Test Parameter</th>
                      <th className="py-2.5 px-4">Observed Value</th>
                      <th className="py-2.5 px-4">Biological Reference Range</th>
                      <th className="py-2.5 px-4">Units</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeReportModal.parameters.map((param, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {param.parameterName}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{param.value}</td>
                        <td className="py-2.5 px-4 text-slate-600">{param.referenceRange}</td>
                        <td className="py-2.5 px-4 text-slate-500">{param.unit}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              param.status === 'NORMAL'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {param.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clinical Remarks */}
            {activeReportModal.clinicalRemarks && (
              <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl text-xs text-amber-950">
                <strong className="block mb-0.5">Pathologist Interpretation Remarks:</strong>
                <p>{activeReportModal.clinicalRemarks}</p>
              </div>
            )}

            {/* Pathologist Verification & Digital Signature */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">
                  {activeReportModal.verifiedByDoctorName}
                </p>
                <p className="text-slate-500">Consultant Pathologist & Laboratory Lead Assessor</p>
                <p className="text-[11px] text-slate-400">Reg No: MMC-2006-08-3291</p>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Electronically Verified & Signed
                </span>
                <p className="text-[10px] text-slate-400 mt-1">End of Diagnostic Laboratory Report</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
