/**
 * Comprehensive Laboratory Admin & Clinical Management Console
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  PhoneCall,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Mail,
  MapPin,
  Sparkles,
  ChevronRight,
  TrendingUp,
  X,
  Truck,
  Building,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext.tsx';
import type {
  Appointment,
  BookingStatus,
  DiagnosticReport,
  DiagnosticTest,
  HealthPackage,
  UserRole,
} from '../../types/index.ts';
import { apiRequest } from '../../lib/api.ts';

export const AdminPortal: React.FC = () => {
  const { user, switchDemoAccount } = useAuth();

  // Navigation tabs
  const [adminTab, setAdminTab] = useState<
    | 'dashboard'
    | 'appointments'
    | 'calls'
    | 'tests'
    | 'packages'
    | 'reports'
    | 'emails'
    | 'inquiries'
    | 'pincodes'
  >('dashboard');

  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Appointment Management Detail Modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [apptStatusUpdate, setApptStatusUpdate] = useState<BookingStatus | ''>('');
  const [phlebotomistAssign, setPhlebotomistAssign] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('CONFIRMED_FASTING');

  // Report Generator / Verification Modal
  const [reportAppt, setReportAppt] = useState<Appointment | null>(null);
  const [reportParams, setReportParams] = useState<
    Array<{ parameterName: string; value: string; unit: string; referenceRange: string; status: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' }>
  >([
    { parameterName: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'NORMAL' },
    { parameterName: 'Total Leucocyte Count (WBC)', value: '6,800', unit: '/cu.mm', referenceRange: '4,000 - 11,000', status: 'NORMAL' },
    { parameterName: 'Platelet Count', value: '240,000', unit: '/cu.mm', referenceRange: '150,000 - 450,000', status: 'NORMAL' },
  ]);
  const [reportRemarks, setReportRemarks] = useState(
    'Morphology of red blood cells appears normocytic and normochromic. No immature blast cells detected.'
  );

  // Email Preview Modal
  const [previewEmail, setPreviewEmail] = useState<any | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, apptsRes, testsRes, pkgsRes, repsRes, emailsRes, enqRes, pincodesRes] =
        await Promise.all([
          apiRequest('/admin/analytics').catch(() => ({})),
          apiRequest<{ appointments: Appointment[] }>('/appointments').catch(() => ({ appointments: [] })),
          apiRequest<{ tests: DiagnosticTest[] }>('/tests').catch(() => ({ tests: [] })),
          apiRequest<{ packages: HealthPackage[] }>('/packages').catch(() => ({ packages: [] })),
          apiRequest<{ reports: DiagnosticReport[] }>('/reports/my').catch(() => ({ reports: [] })),
          apiRequest<{ emails: any[] }>('/admin/emails').catch(() => ({ emails: [] })),
          apiRequest<{ enquiries: any[] }>('/admin/enquiries').catch(() => ({ enquiries: [] })),
          apiRequest<{ pincodes: any[] }>('/pincodes').catch(() => ({ pincodes: [] })),
        ]);

      setAnalytics(analyticsRes);
      setAppointments(apptsRes.appointments);
      setTests(testsRes.tests);
      setPackages(pkgsRes.packages);
      setReports(repsRes.reports);
      setEmailLogs(emailsRes.emails);
      setEnquiries(enqRes.enquiries);
      setPincodes(pincodesRes.pincodes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRoleSwitch = async (role: UserRole) => {
    await switchDemoAccount(role);
    setFeedback({ type: 'success', message: `Switched active staff persona to ${role}` });
    await loadAllData();
  };

  const handleUpdateApptStatus = async (apptId: string, status: BookingStatus) => {
    try {
      await apiRequest(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setFeedback({ type: 'success', message: `Appointment status updated to ${status}` });
      await loadAllData();
      if (selectedAppt && selectedAppt.id === apptId) {
        setSelectedAppt((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Status update failed' });
    }
  };

  const handleAssignPhlebotomist = async (apptId: string) => {
    if (!phlebotomistAssign) return;
    try {
      await apiRequest(`/appointments/${apptId}/assign-phlebotomist`, {
        method: 'POST',
        body: JSON.stringify({
          phlebotomistId: 'usr-collector-01',
          phlebotomistName: phlebotomistAssign,
        }),
      });
      setFeedback({ type: 'success', message: `Assigned phlebotomist: ${phlebotomistAssign}` });
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Assignment failed' });
    }
  };

  const handleRecordCall = async (apptId: string) => {
    if (!callNotes.trim()) return;
    try {
      await apiRequest(`/appointments/${apptId}/record-call`, {
        method: 'POST',
        body: JSON.stringify({
          outcome: callOutcome,
          notes: callNotes,
        }),
      });
      setFeedback({ type: 'success', message: 'Patient call log recorded & verified.' });
      setCallNotes('');
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to log call' });
    }
  };

  const handleSignAndPublishReport = async () => {
    if (!reportAppt) return;
    try {
      await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: reportAppt.id,
          patientId: reportAppt.patientId || 'patient-guest',
          patientName: reportAppt.patientName,
          patientAge: reportAppt.patientAge,
          patientGender: reportAppt.patientGender,
          testName: reportAppt.testNames[0] || 'Complete Diagnostic Panel',
          specimenType: reportAppt.collectionMethod === 'HOME_COLLECTION' ? 'Venous Blood' : 'Whole Blood / Serum',
          sampleCollectedAt: reportAppt.scheduledDate,
          parameters: reportParams,
          clinicalRemarks: reportRemarks,
        }),
      });
      setFeedback({
        type: 'success',
        message: 'Clinical diagnostic report signed & released! Patient has been notified.',
      });
      setReportAppt(null);
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to release report' });
    }
  };

  // Recharts color palette
  const COLORS = ['#0284C7', '#0D9488', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Staff Identity & Role Banner */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900 text-purple-200 flex items-center justify-center font-bold text-sm border border-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {user?.name || 'Laboratory Staff'}
                </span>
                <span className="text-[10px] font-extrabold uppercase bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ApexPath Diagnostic Central Reference LIS (Laboratory Information System)
              </p>
            </div>
          </div>

          {/* Quick Staff Persona Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Role Switcher:</span>
            <button
              onClick={() => handleRoleSwitch('SUPER_ADMIN')}
              className={`px-2.5 py-1 rounded-lg font-medium border text-xs transition-colors ${
                user?.role === 'SUPER_ADMIN'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Medical Director (Super)
            </button>
            <button
              onClick={() => handleRoleSwitch('PATHOLOGIST')}
              className={`px-2.5 py-1 rounded-lg font-medium border text-xs transition-colors ${
                user?.role === 'PATHOLOGIST'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Pathologist (Reports)
            </button>
            <button
              onClick={() => handleRoleSwitch('PHLEBOTOMIST')}
              className={`px-2.5 py-1 rounded-lg font-medium border text-xs transition-colors ${
                user?.role === 'PHLEBOTOMIST'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Phlebotomist (Logistics)
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-950 text-emerald-300 border-b border-emerald-800' : 'bg-rose-950 text-rose-300 border-b border-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Main Console Layout */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none text-xs font-semibold">
          {[
            { id: 'dashboard', label: 'Overview Analytics', icon: Activity },
            { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
            { id: 'tests', label: `Tests Catalog (${tests.length})`, icon: FileText },
            { id: 'packages', label: `Health Packages (${packages.length})`, icon: Sparkles },
            { id: 'reports', label: 'Diagnostic Reports & Sign-off', icon: ShieldCheck },
            { id: 'emails', label: `Email Logs (${emailLogs.length})`, icon: Mail },
            { id: 'inquiries', label: `Inquiries (${enquiries.length})`, icon: PhoneCall },
            { id: 'pincodes', label: 'Serviceable Pincodes', icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  adminTab === tab.id
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
          <button
            onClick={loadAllData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 ml-auto"
            title="Reload Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Gross Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  ₹{analytics?.overview?.totalRevenue?.toLocaleString() || '184,200'}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +18.4% this month
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Bookings & Collections</span>
                  <Calendar className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {analytics?.overview?.totalAppointments || appointments.length}
                </div>
                <div className="text-[11px] text-slate-400">
                  {appointments.filter((a) => a.collectionMethod === 'HOME_COLLECTION').length} Home Collections
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Awaiting Confirmation</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {appointments.filter((a) => a.status === 'REQUESTED' || a.status === 'UNDER_REVIEW').length}
                </div>
                <div className="text-[11px] text-amber-400/80">Pending Fasting Call</div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Reports Released</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {reports.length || 142}
                </div>
                <div className="text-[11px] text-purple-400">NABL Digital Signatures</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Booking Volume Bar Chart */}
              <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Daily Specimen Volume</h3>
                    <p className="text-xs text-slate-400">Samples accessioned per day</p>
                  </div>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    Past 7 Days
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        analytics?.dailyBookings || [
                          { date: 'Mon', count: 18, revenue: 24000 },
                          { date: 'Tue', count: 22, revenue: 31000 },
                          { date: 'Wed', count: 28, revenue: 39500 },
                          { date: 'Thu', count: 25, revenue: 34200 },
                          { date: 'Fri', count: 32, revenue: 45000 },
                          { date: 'Sat', count: 35, revenue: 51200 },
                          { date: 'Sun', count: 15, revenue: 21000 },
                        ]
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution Pie Chart */}
              <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Clinical Workflow Distribution</h3>
                    <p className="text-xs text-slate-400">Current status of active pipeline</p>
                  </div>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    Live
                  </span>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Requested',
                            value: appointments.filter((a) => a.status === 'REQUESTED').length || 3,
                          },
                          {
                            name: 'Confirmed',
                            value: appointments.filter((a) => a.status === 'CONFIRMED').length || 5,
                          },
                          {
                            name: 'Collected',
                            value: appointments.filter((a) => a.status === 'SAMPLE_COLLECTED').length || 4,
                          },
                          {
                            name: 'Processing',
                            value: appointments.filter((a) => a.status === 'PROCESSING').length || 2,
                          },
                          {
                            name: 'Report Ready',
                            value: appointments.filter((a) => a.status === 'REPORT_READY').length || 6,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENTS MANAGEMENT */}
        {adminTab === 'appointments' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-white">Diagnostic Appointments Pipeline</h3>
                <p className="text-xs text-slate-400">
                  Review booking requests, schedule phlebotomists, record fasting calls, and progress status.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Ref Number</th>
                      <th className="py-3 px-4 font-semibold">Patient</th>
                      <th className="py-3 px-4 font-semibold">Tests / Package</th>
                      <th className="py-3 px-4 font-semibold">Date & Slot</th>
                      <th className="py-3 px-4 font-semibold">Method</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Total</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-700/30">
                        <td className="py-3 px-4 font-mono font-bold text-sky-400">
                          {appt.referenceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-white">{appt.patientName}</p>
                          <p className="text-[11px] text-slate-400">{appt.patientPhone}</p>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                          {appt.testNames.join(', ')}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <p>{appt.scheduledDate}</p>
                          <p className="text-[10px] text-slate-400">{appt.timeSlotLabel}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              appt.collectionMethod === 'HOME_COLLECTION'
                                ? 'bg-teal-950 text-teal-300 border border-teal-800'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {appt.collectionMethod === 'HOME_COLLECTION' ? 'Home Doorstep' : 'Clinic'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold uppercase bg-slate-900 text-slate-200 border border-slate-700 px-2 py-0.5 rounded">
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">₹{appt.grandTotal}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedAppt(appt)}
                              className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Manage
                            </button>
                            {appt.status !== 'REPORT_READY' && appt.status !== 'COMPLETED' && (
                              <button
                                onClick={() => setReportAppt(appt)}
                                className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                                title="Pathologist Report Sign-off"
                              >
                                Sign Report
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TESTS CATALOG */}
        {adminTab === 'tests' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-white">Diagnostic Tests Master Catalog</h3>
                <p className="text-xs text-slate-400">
                  Manage pricing, turnaround times, sample requirements, and fasting guidelines.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
                      {test.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{test.code}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{test.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{test.description}</p>

                  <div className="text-xs text-slate-300 space-y-1 border-t border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Report Time:</span>
                      <span>{test.reportTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sample Type:</span>
                      <span>{test.sampleType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price:</span>
                      <strong className="text-emerald-400">
                        ₹{test.discountPrice || test.price}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HEALTH PACKAGES */}
        {adminTab === 'packages' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-bold text-white">Preventive Health Check Packages</h3>
              <p className="text-xs text-slate-400">
                Bundled health profiles offering multi-parameter screenings with discount incentives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">{pkg.code}</span>
                    <span className="text-xs font-bold text-emerald-400">
                      ₹{pkg.discountedPrice}{' '}
                      <span className="text-slate-500 line-through">₹{pkg.originalPrice}</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                  <p className="text-xs text-slate-400">{pkg.tagline}</p>

                  <div className="border-t border-slate-700 pt-2 text-xs">
                    <p className="text-slate-400 mb-1">
                      Included Tests ({pkg.testsIncludedNames.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.testsIncludedNames.map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[11px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS SIGN-OFF */}
        {adminTab === 'reports' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-bold text-white">
                Consultant Pathologist Verification & Signed Reports
              </h3>
              <p className="text-xs text-slate-400">
                Audit trail of digitally released diagnostic certificates with physician credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {rep.accessionNumber}
                    </span>
                    <span className="text-[11px] font-bold text-purple-400">
                      Signed: {rep.verifiedByDoctorName}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{rep.testName}</h4>
                  <p className="text-xs text-slate-400">
                    Patient: {rep.patientName} ({rep.patientAge}y / {rep.patientGender})
                  </p>

                  <div className="border-t border-slate-700 pt-2 space-y-1 text-xs">
                    {rep.parameters.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>{p.parameterName}</span>
                        <span className="font-bold">
                          {p.value} {p.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: EMAIL LOGS */}
        {adminTab === 'emails' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-bold text-white">Transactional Email Audit Trail</h3>
              <p className="text-xs text-slate-400">
                Inspect triggered notification emails (Booking receipts, Phlebotomist dispatches, Fasting reminders). Click any email to preview HTML layout.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 divide-y divide-slate-700">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setPreviewEmail(log)}
                  className="p-4 hover:bg-slate-700/40 cursor-pointer flex items-center justify-between transition-colors text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{log.subject}</span>
                      <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded">
                        {log.template}
                      </span>
                    </div>
                    <p className="text-slate-400">To: {log.to}</p>
                  </div>
                  <div className="text-right text-slate-400">
                    <p>{new Date(log.sentAt).toLocaleTimeString()}</p>
                    <span className="text-emerald-400 font-bold">Delivered (200 OK)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: INQUIRIES */}
        {adminTab === 'inquiries' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-bold text-white">Patient Inquiries & Desk Messages</h3>
              <p className="text-xs text-slate-400">
                Direct messages submitted via the public contact and corporate enquiry form.
              </p>
            </div>

            <div className="space-y-3">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{enq.name}</span>
                    <span className="text-slate-400">
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-400">
                    Phone: <strong className="text-slate-200">{enq.phone}</strong> • Email:{' '}
                    <strong className="text-slate-200">{enq.email || 'N/A'}</strong>
                  </p>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300">
                    <p className="font-semibold text-sky-400 mb-1">{enq.subject || 'General Enquiry'}</p>
                    <p>{enq.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: PINCODES */}
        {adminTab === 'pincodes' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-bold text-white">Serviceable Home Collection Pincodes</h3>
              <p className="text-xs text-slate-400">
                Pincode serviceability database for doorstep phlebotomy routing and fees.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pincodes.map((pin) => (
                <div
                  key={pin.id}
                  className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1 text-xs"
                >
                  <span className="font-mono font-black text-sky-400 text-base">{pin.pincode}</span>
                  <p className="font-bold text-white">{pin.areaName}</p>
                  <p className="text-[11px] text-slate-400">{pin.city}</p>
                  <span className="text-[10px] text-emerald-400 font-bold block pt-1">
                    {pin.collectionFee === 0 ? 'Free Collection' : `Fee: ₹${pin.collectionFee}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: MANAGE APPOINTMENT */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100 animate-in fade-in">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {selectedAppt.referenceNumber}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Manage Patient Appointment
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient & Booking Details */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <strong className="text-white">
                  {selectedAppt.patientName} ({selectedAppt.patientGender}, {selectedAppt.patientAge}y)
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <strong className="text-white">{selectedAppt.patientPhone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled:</span>
                <strong className="text-white">
                  {selectedAppt.scheduledDate} ({selectedAppt.timeSlotLabel})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <strong className="text-white">
                  {selectedAppt.collectionMethod === 'HOME_COLLECTION'
                    ? 'Home Collection'
                    : 'Laboratory Visit'}
                </strong>
              </div>
              {selectedAppt.collectionAddress && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="text-white text-right max-w-xs truncate">
                    {selectedAppt.collectionAddress.street}, {selectedAppt.collectionAddress.city} -{' '}
                    {selectedAppt.collectionAddress.pincode}
                  </span>
                </div>
              )}
            </div>

            {/* Status Transition Control */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Advance Workflow Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {(
                  [
                    'REQUESTED',
                    'UNDER_REVIEW',
                    'CONFIRMED',
                    'SAMPLE_COLLECTED',
                    'PROCESSING',
                    'REPORT_READY',
                    'COMPLETED',
                    'CANCELLED',
                  ] as BookingStatus[]
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleUpdateApptStatus(selectedAppt.id, status)}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition-colors ${
                      selectedAppt.status === status
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Phlebotomist Assignment */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">
                Assign Certified Phlebotomist
              </label>
              <div className="flex gap-2">
                <select
                  value={phlebotomistAssign}
                  onChange={(e) => setPhlebotomistAssign(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">-- Choose Certified Phlebotomist --</option>
                  <option value="Rahul Deshmukh (Phlebotomy Lead - South)">
                    Rahul Deshmukh (Lead - South)
                  </option>
                  <option value="Suresh Verma (Zone 2 Logistics)">Suresh Verma (Zone 2)</option>
                  <option value="Ananya Nair (Morning Fasting Team)">Ananya Nair (Morning)</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleAssignPhlebotomist(selectedAppt.id)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Patient Call Logger */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">
                Record Patient Verification Call
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                >
                  <option value="CONFIRMED_FASTING">Confirmed Fasting & Address</option>
                  <option value="RESCHEDULED">Patient Requested Reschedule</option>
                  <option value="UNREACHABLE">Phone Unreachable / Busy</option>
                  <option value="CANCELLED">Patient Cancelled</option>
                </select>
                <input
                  type="text"
                  placeholder="Call notes e.g. instructed 12h fasting..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRecordCall(selectedAppt.id)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl py-2 text-xs font-bold mt-1"
              >
                Save Call Entry to Medical Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PATHOLOGIST REPORT SIGN-OFF */}
      {reportAppt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-4 text-slate-100 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Pathology Verification
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Sign & Release Diagnostic Report: {reportAppt.referenceNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Patient: {reportAppt.patientName} ({reportAppt.patientAge}y / {reportAppt.patientGender})
                </p>
              </div>
              <button onClick={() => setReportAppt(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Parameters Editor */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Observed Biological Parameters
              </label>
              <div className="space-y-2">
                {reportParams.map((param, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-4 gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-xs"
                  >
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">Parameter</span>
                      <strong className="text-white">{param.parameterName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Value</span>
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => {
                          const updated = [...reportParams];
                          updated[idx].value = e.target.value;
                          setReportParams(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Flag</span>
                      <select
                        value={param.status}
                        onChange={(e: any) => {
                          const updated = [...reportParams];
                          updated[idx].status = e.target.value;
                          setReportParams(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-1 text-white text-[11px]"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="LOW">Low</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Consultant Remarks & Clinical Correlation
              </label>
              <textarea
                rows={3}
                value={reportRemarks}
                onChange={(e) => setReportRemarks(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setReportAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSignAndPublishReport}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg"
              >
                <ShieldCheck className="w-4 h-4" />
                Sign & Electronically Release Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMAIL HTML PREVIEW */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-sky-700 uppercase">
                  Transactional Email Preview
                </span>
                <h3 className="text-base font-bold text-slate-900">{previewEmail.subject}</h3>
                <p className="text-xs text-slate-500">To: {previewEmail.to}</p>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="border border-slate-200 rounded-2xl p-4 bg-slate-50 overflow-x-auto text-xs"
              dangerouslySetInnerHTML={{ __html: previewEmail.htmlContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
