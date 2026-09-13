/**
 * Multi-Step Diagnostic Test Booking Workflow
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Calendar,
  Clock,
  Home,
  Building,
  User as UserIcon,
  CreditCard,
  Tag,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type {
  DiagnosticTest,
  HealthPackage,
  CollectionMethod,
  PaymentMethod,
  TimeSlotAvailability,
} from '../../types/index.ts';
import { apiRequest } from '../../lib/api.ts';

interface BookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: {
    type: 'TEST' | 'PACKAGE';
    itemId: string;
    name?: string;
    price?: number;
    collectionMethod?: CollectionMethod;
    pincode?: string;
  } | null;
  onBookingSuccess: (appointment: any) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  isOpen,
  onClose,
  initialItem,
  onBookingSuccess,
}) => {
  const { user } = useAuth();

  // Steps: 1: Tests Selection, 2: Collection & Date/Slot, 3: Patient & Medical Info, 4: Review & Payment, 5: Confirmed
  const [step, setStep] = useState<number>(1);

  // Catalogue data for test selection
  const [availableTests, setAvailableTests] = useState<DiagnosticTest[]>([]);
  const [availablePackages, setAvailablePackages] = useState<HealthPackage[]>([]);
  const [testSearch, setTestSearch] = useState('');

  // Selected items
  const [selectedTests, setSelectedTests] = useState<DiagnosticTest[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<HealthPackage | null>(null);

  // Booking config
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>('HOME_COLLECTION');
  const [address, setAddress] = useState({
    street: '',
    city: 'Mumbai',
    pincode: '400001',
    landmark: '',
  });

  // Date & Slot selection
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<TimeSlotAvailability[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Patient Info
  const [patient, setPatient] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || 32,
    gender: user?.gender || 'MALE',
    address: '',
  });

  // Medical Info
  const [referringDoctor, setReferringDoctor] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [fastingConfirmed, setFastingConfirmed] = useState(false);
  const [prescriptionAttached, setPrescriptionAttached] = useState(false);

  // Coupon & Payment
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discountPercent?: number;
    discountAmount?: number;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingError, setBookingError] = useState('');

  // Initial setup when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Load available tests and packages
    const loadData = async () => {
      try {
        const [testsRes, pkgsRes] = await Promise.all([
          apiRequest<{ tests: DiagnosticTest[] }>('/tests'),
          apiRequest<{ packages: HealthPackage[] }>('/packages'),
        ]);
        setAvailableTests(testsRes.tests);
        setAvailablePackages(pkgsRes.packages);

        // Pre-select if passed initialItem
        if (initialItem) {
          if (initialItem.type === 'PACKAGE') {
            const pkg = pkgsRes.packages.find((p) => p.id === initialItem.itemId);
            if (pkg) setSelectedPackage(pkg);
          } else if (initialItem.type === 'TEST') {
            const test = testsRes.tests.find((t) => t.id === initialItem.itemId);
            if (test) setSelectedTests([test]);
          }

          if (initialItem.collectionMethod) {
            setCollectionMethod(initialItem.collectionMethod);
          }
          if (initialItem.pincode) {
            setAddress((prev) => ({ ...prev, pincode: initialItem.pincode! }));
          }
        }
      } catch (err) {
        console.error('Error fetching catalogue for booking:', err);
      }
    };

    loadData();
  }, [isOpen, initialItem]);

  // Pre-fill user data if auth changes
  useEffect(() => {
    if (user) {
      setPatient((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone || prev.phone,
        age: user.age || prev.age,
        gender: user.gender || prev.gender,
      }));
    }
  }, [user]);

  // Load available time slots when date or collectionMethod changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const data = await apiRequest<{ slots: TimeSlotAvailability[] }>(
          `/slots/available?date=${selectedDate}&collectionMethod=${collectionMethod}`
        );
        setSlots(data.slots);
        // Select first available slot
        const firstAvail = data.slots.find((s) => s.available);
        if (firstAvail) setSelectedSlotId(firstAvail.id);
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, collectionMethod]);

  if (!isOpen) return null;

  // Calculate pricing
  const subtotal = selectedPackage
    ? selectedPackage.discountedPrice
    : selectedTests.reduce((acc, t) => acc + (t.discountPrice || t.price), 0);

  let discount = 0;
  if (couponApplied) {
    if (couponApplied.discountPercent) {
      discount = Math.round((subtotal * couponApplied.discountPercent) / 100);
    } else if (couponApplied.discountAmount) {
      discount = Math.min(couponApplied.discountAmount, subtotal);
    }
  }

  const collectionFee = collectionMethod === 'HOME_COLLECTION' ? 0 : 0; // Promotional Free Home Collection
  const grandTotal = Math.max(0, subtotal - discount + collectionFee);

  const applyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (code === 'FIRSTTEST') {
      setCouponApplied({ code, discountPercent: 15 });
    } else if (code === 'HEALTH10') {
      setCouponApplied({ code, discountPercent: 10 });
    } else if (code === 'WELLNESS200') {
      setCouponApplied({ code, discountAmount: 200 });
    } else {
      setCouponError('Invalid promo code. Try "FIRSTTEST" for 15% off.');
    }
  };

  const toggleTestSelection = (test: DiagnosticTest) => {
    // Deselect package if selecting individual tests
    setSelectedPackage(null);
    if (selectedTests.some((t) => t.id === test.id)) {
      setSelectedTests(selectedTests.filter((t) => t.id === test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleSelectPackage = (pkg: HealthPackage) => {
    setSelectedPackage(pkg);
    setSelectedTests([]);
  };

  const handleCompleteBooking = async () => {
    setIsSubmitting(true);
    setBookingError('');

    try {
      const selectedSlotObj = slots.find((s) => s.id === selectedSlotId);

      const payload = {
        patientName: patient.name,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        patientAge: Number(patient.age),
        patientGender: patient.gender,
        collectionMethod,
        collectionAddress:
          collectionMethod === 'HOME_COLLECTION'
            ? {
                street: address.street || 'Patient Residence',
                city: address.city,
                pincode: address.pincode,
                landmark: address.landmark,
              }
            : undefined,
        scheduledDate: selectedDate,
        timeSlotId: selectedSlotId,
        timeSlotLabel: selectedSlotObj ? selectedSlotObj.label : 'Morning (07:00 AM - 08:00 AM)',
        testIds: selectedPackage ? [] : selectedTests.map((t) => t.id),
        packageId: selectedPackage ? selectedPackage.id : undefined,
        referringDoctor: referringDoctor || undefined,
        specialInstructions: specialInstructions || undefined,
        fastingConfirmed,
        paymentMethod,
      };

      const data = await apiRequest<{ appointment: any }>('/appointments/book', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBookingResult(data.appointment);
      onBookingSuccess(data.appointment);
      setStep(5); // Show confirmation screen
    } catch (err: any) {
      setBookingError(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col justify-between animate-in fade-in zoom-in-95">
        {/* Header with Progress Steps */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-sky-50 text-sky-700 px-2.5 py-1 rounded-md border border-sky-100">
                ApexPath Diagnostic Booking
              </span>
              <span className="text-xs text-slate-400">Step {step} of 4</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[
              { num: 1, label: 'Select Tests' },
              { num: 2, label: 'Date & Slot' },
              { num: 3, label: 'Patient Info' },
              { num: 4, label: 'Payment' },
            ].map((s) => (
              <div
                key={s.num}
                className={`h-1.5 rounded-full transition-all ${
                  step >= s.num ? 'bg-sky-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {/* STEP 1: Select Tests / Packages */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Select Diagnostic Tests or Health Package
                </h3>
                <p className="text-xs text-slate-500">
                  Choose a bundled preventive package or individual blood test parameters.
                </p>
              </div>

              {/* Package Toggle vs Individual Tests */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Popular Preventive Health Packages
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availablePackages.slice(0, 2).map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'border-sky-600 bg-sky-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{pkg.name}</h4>
                        <span className="text-xs font-bold text-emerald-600">
                          ₹{pkg.discountedPrice}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                        {pkg.testsIncludedNames.slice(0, 3).join(', ')}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Or Select Individual Tests ({selectedTests.length} Selected)
                  </span>
                  {selectedPackage && (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Package is currently selected
                    </span>
                  )}
                </div>

                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Search tests (e.g. CBC, HbA1c, Thyroid, Lipid, Vitamin D)..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {availableTests
                    .filter((t) =>
                      t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
                      t.code.toLowerCase().includes(testSearch.toLowerCase())
                    )
                    .map((test) => {
                      const isSelected = selectedTests.some((t) => t.id === test.id);
                      return (
                        <div
                          key={test.id}
                          onClick={() => toggleTestSelection(test)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-sky-600 bg-sky-50 font-medium'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{test.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {test.sampleType} • {test.reportTime}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            ₹{test.discountPrice || test.price}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Collection Method, Date & Time Slot */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Choose Collection Method & Appointment Slot
                </h3>
                <p className="text-xs text-slate-500">
                  Select doorstep phlebotomy or visit our Central Laboratory.
                </p>
              </div>

              {/* Method Cards */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCollectionMethod('HOME_COLLECTION')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    collectionMethod === 'HOME_COLLECTION'
                      ? 'border-sky-600 bg-sky-50/80 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Home className="w-5 h-5 text-teal-600 mb-1.5" />
                  <h4 className="text-xs font-bold text-slate-900">Home Sample Collection</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Certified phlebotomist with cold-chain carrier arrives at your door.
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700 mt-2 inline-block">
                    FREE Doorstep Collection
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCollectionMethod('CLINIC_VISIT')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    collectionMethod === 'CLINIC_VISIT'
                      ? 'border-sky-600 bg-sky-50/80 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Building className="w-5 h-5 text-sky-600 mb-1.5" />
                  <h4 className="text-xs font-bold text-slate-900">Visit Laboratory</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Walk in to Central Laboratory, Medical Enclave with fast-track line.
                  </p>
                </button>
              </div>

              {/* Home Address if Home Collection */}
              {collectionMethod === 'HOME_COLLECTION' && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800">
                    Doorstep Address & Pincode
                  </h4>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat No, Apartment, Street name"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nearby Landmark"
                      value={address.landmark}
                      onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Pincode e.g. 400001"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Collection Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Available Time Slots with live capacity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Available Morning & Afternoon Slots *
                </label>
                {loadingSlots ? (
                  <div className="text-xs text-slate-400 py-4 text-center">
                    Checking laboratory slot capacity...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {slots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-sky-600 bg-sky-50 shadow-xs'
                              : slot.available
                              ? 'border-slate-200 hover:border-slate-300 bg-white'
                              : 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <p className="text-xs font-semibold text-slate-900">{slot.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {slot.available ? `${slot.remainingCapacity} slots left` : 'Fully Booked'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Patient & Clinical Information */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Patient & Medical Information
                </h3>
                <p className="text-xs text-slate-500">
                  Accurate biological demographics ensure correct clinical reference ranges on reports.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Mehta"
                    value={patient.name}
                    onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={patient.phone}
                      onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="patient@example.com"
                      value={patient.email}
                      onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={patient.age}
                      onChange={(e) => setPatient({ ...patient, age: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Biological Sex *
                    </label>
                    <select
                      value={patient.gender}
                      onChange={(e: any) => setPatient({ ...patient, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Referring Doctor / Clinic (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Kulkarni, MD"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* Prescription Upload Simulation */}
                <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Doctor's Prescription (Optional)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Upload prescription photo or PDF for pathologist review
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrescriptionAttached(!prescriptionAttached)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      prescriptionAttached
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {prescriptionAttached ? '✓ Attached' : 'Attach File'}
                  </button>
                </div>

                {/* Fasting Requirement Acknowledgment Checkbox */}
                <label className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastingConfirmed}
                    onChange={(e) => setFastingConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <div className="text-xs text-amber-900">
                    <span className="font-bold">Patient Preparation Confirmation:</span> I acknowledge the fasting requirements (e.g. 10–12 hours water only for fasting sugar / lipid assays) and will comply prior to blood draw.
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Review, Coupon & Payment */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review Appointment & Payment
                </h3>
                <p className="text-xs text-slate-500">
                  Verify your diagnostic package, slot, and select preferred payment mode.
                </p>
              </div>

              {bookingError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <div>
                    <span className="font-bold text-slate-900">
                      {selectedPackage ? selectedPackage.name : `${selectedTests.length} Selected Tests`}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {selectedPackage
                        ? selectedPackage.testsIncludedNames.slice(0, 3).join(', ')
                        : selectedTests.map((t) => t.name).join(', ')}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">₹{subtotal}</span>
                </div>

                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Collection Date:</span>
                    <strong className="text-slate-900">{selectedDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <strong className="text-slate-900">
                      {collectionMethod === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <strong className="text-slate-900">
                      {patient.name} ({patient.gender}, {patient.age}y)
                    </strong>
                  </div>
                </div>

                {/* Coupon Input */}
                <div className="pt-2 border-t border-slate-200/80 flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. FIRSTTEST)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs uppercase font-medium"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-rose-600">{couponError}</p>}
                {couponApplied && (
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    ✓ Promo applied: {couponApplied.code} (-₹{discount})
                  </p>
                )}

                {/* Total breakdown */}
                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Doorstep Phlebotomy:</span>
                    <span className="text-emerald-700 font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-sky-700">₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Payment Option *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'ONLINE'
                        ? 'border-sky-600 bg-sky-50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-sky-600 mb-1" />
                    <p className="text-xs font-bold text-slate-900">Instant Online Payment</p>
                    <p className="text-[10px] text-slate-500">
                      UPI, Credit/Debit Card, NetBanking (Encrypted)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PAY_AT_COLLECTION')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'PAY_AT_COLLECTION'
                        ? 'border-sky-600 bg-sky-50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 text-teal-600 mb-1" />
                    <p className="text-xs font-bold text-slate-900">Pay at Sample Collection</p>
                    <p className="text-[10px] text-slate-500">
                      Cash or Phlebotomist UPI QR upon arrival
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Confirmation Success Screen */}
          {step === 5 && bookingResult && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Appointment Confirmed
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Booking Reference: {bookingResult.referenceNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Thank you, <strong>{bookingResult.patientName}</strong>. Our clinical coordinator will call you to confirm your fasting instructions.
                </p>
              </div>

              {/* Summary Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 max-w-md mx-auto space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span>Date & Slot:</span>
                  <strong className="text-slate-900">
                    {bookingResult.scheduledDate} ({bookingResult.timeSlotLabel})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <strong className="text-slate-900">
                    {bookingResult.collectionMethod === 'HOME_COLLECTION'
                      ? 'Home Sample Collection'
                      : 'Laboratory Visit'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <strong className="text-slate-900">
                    ₹{bookingResult.grandTotal} ({bookingResult.paymentMethod})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Booking Status:</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                    {bookingResult.status}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STEP NAVIGATION BUTTONS (When not on confirmation screen) */}
        {step < 5 && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={
                  (step === 1 && selectedTests.length === 0 && !selectedPackage) ||
                  (step === 2 && !selectedSlotId)
                }
                onClick={() => setStep(step + 1)}
                className="bg-slate-900 hover:bg-sky-600 disabled:opacity-40 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow flex items-center gap-1.5"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !patient.name || !patient.phone}
                onClick={handleCompleteBooking}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-7 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting ? 'Confirming Appointment...' : 'Confirm & Complete Booking'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
