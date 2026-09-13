/**
 * Home Sample Collection Protocol & Interactive Pincode Serviceability Checker
 */

import React, { useState } from 'react';
import {
  Home,
  CheckCircle2,
  ShieldCheck,
  ThermometerSnowflake,
  Clock,
  CalendarCheck,
  Search,
  MapPin,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface HomeCollectionSectionProps {
  onOpenBooking: (initial?: any) => void;
}

export const HomeCollectionSection: React.FC<HomeCollectionSectionProps> = ({
  onOpenBooking,
}) => {
  const [pincode, setPincode] = useState('');
  const [checkResult, setCheckResult] = useState<{
    checked: boolean;
    serviceable: boolean;
    areaName?: string;
    city?: string;
    collectionFee?: number;
    message?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handlePincodeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim()) return;

    setIsChecking(true);
    try {
      const data = await apiRequest<{
        serviceable: boolean;
        areaName?: string;
        city?: string;
        collectionFee?: number;
        message?: string;
      }>(`/pincodes/check?pincode=${encodeURIComponent(pincode.trim())}`);

      setCheckResult({
        checked: true,
        ...data,
      });
    } catch (err: any) {
      setCheckResult({
        checked: true,
        serviceable: false,
        message: err.message || 'Error verifying pincode.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const steps = [
    {
      icon: Clock,
      title: '1. Select Date & Slot',
      desc: 'Pick your preferred morning collection slot (07:00 AM – 11:00 AM) or afternoon slot.',
    },
    {
      icon: ShieldCheck,
      title: '2. Phlebotomist Assigned',
      desc: 'A background-verified, vaccinated phlebotomist calls ahead to verify address and fasting instructions.',
    },
    {
      icon: ThermometerSnowflake,
      title: '3. Cold-Chain Blood Draw',
      desc: 'Painless venipuncture with single-use sterile BD vacutainers, barcoded at your doorstep and placed in cold storage.',
    },
    {
      icon: CheckCircle2,
      title: '4. Digital Report in Hours',
      desc: 'Automated sample processing in our NABL lab with digital PDF reports sent via dashboard and email.',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Home className="w-3.5 h-3.5" />
            Doorstep Diagnostics
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Certified Home Blood Sample Collection
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Experience painless, hygienic blood sample collection in the comfort of your home. Cold-chain preserved and barcode-tracked directly to our certified analyzers.
          </p>
        </div>

        {/* Pincode Checker Card */}
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Check Home Collection Service in Your Area
              </h3>
              <p className="text-xs text-slate-500">
                Enter your 6-digit postal pincode to check instant slot serviceability
              </p>
            </div>
          </div>

          <form onSubmit={handlePincodeCheck} className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 400001, 400050, 400053, 110001, 560001..."
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={isChecking || !pincode}
              className="bg-slate-900 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow"
            >
              {isChecking ? 'Checking...' : 'Verify Pincode'}
            </button>
          </form>

          {/* Result Alert */}
          {checkResult && (
            <div className="mt-4 animate-in fade-in">
              {checkResult.serviceable ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        ✓ Home Sample Collection is Fully Serviceable!
                      </h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Area: <strong>{checkResult.areaName}, {checkResult.city}</strong>.
                        Collection Fee: <strong>{checkResult.collectionFee === 0 ? 'FREE (Special Promotion)' : `₹${checkResult.collectionFee}`}</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenBooking({ collectionMethod: 'HOME_COLLECTION', pincode })}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0 transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950">Area Outside Standard Direct Radius</h4>
                    <p className="mt-0.5">
                      {checkResult.message || 'Pincode not currently available for direct home collection. You can visit our Central Laboratory at Medical Enclave.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4 Feature Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Cold-Chain Assurance Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-400">
              <Truck className="w-4 h-4" />
              TEMPERATURE-MONITORED SPECIMEN LOGISTICS
            </div>
            <h3 className="text-lg sm:text-xl font-bold">
              100% Pre-analytical Sample Stability Guaranteed
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every blood tube is labeled with your unique encrypted barcoded ID in front of you and transported in a 2°C – 8°C cold box to prevent hemolysis or degradation.
            </p>
          </div>

          <button
            onClick={() => onOpenBooking({ collectionMethod: 'HOME_COLLECTION' })}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4 text-slate-950" />
            BOOK HOME COLLECTION
          </button>
        </div>
      </div>
    </section>
  );
};
