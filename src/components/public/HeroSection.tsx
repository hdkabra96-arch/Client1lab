/**
 * Hero Section with Clinical Visuals, Trust Badges, and Search Bar
 */

import React, { useState } from 'react';
import {
  Search,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  Home,
  Clock,
  Sparkles,
  ArrowRight,
  FlaskConical,
  Award,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenBooking: (item?: any) => void;
  onNavigate: (view: string, param?: any) => void;
  onSearchSelect: (query: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBooking,
  onNavigate,
  onSearchSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSelect(searchQuery.trim());
      onNavigate('tests', { search: searchQuery.trim() });
    }
  };

  const quickPills = [
    'Complete Blood Count (CBC)',
    'HbA1c Diabetes',
    'Lipid Profile',
    'Vitamin D',
    'Thyroid Total',
    'Full Body Packages',
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-12 pb-20 px-4 sm:px-6">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column: Value Proposition & Search */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Accreditation Tag */}
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NABL ISO 15189:2022 & CAP Reference Laboratory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Trusted Diagnostics.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
              Conveniently Booked.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
            Book your blood tests and diagnostic services online. Our certified laboratory team will confirm your appointment, guide you through fasting protocols, and provide home sample collection with same-day digital reports.
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tests e.g. CBC, Thyroid, Blood Sugar, Vitamin D, Lipid..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-32 py-3.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                Find Test
              </button>
            </div>

            {/* Quick search tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-slate-400">
              <span className="text-slate-400 font-medium">Popular:</span>
              {quickPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => {
                    setSearchQuery(pill);
                    onSearchSelect(pill);
                    onNavigate('tests', { search: pill });
                  }}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-[11px] transition-colors border border-slate-700/50"
                >
                  {pill}
                </button>
              ))}
            </div>
          </form>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenBooking()}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4 text-slate-950" />
              BOOK A TEST
            </button>
            <button
              onClick={() => onNavigate('tests')}
              className="bg-slate-800/90 hover:bg-slate-700 text-white font-semibold px-5 py-3 rounded-xl text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              VIEW TESTS
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigate('packages')}
              className="bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 font-semibold px-4 py-3 rounded-xl text-sm border border-teal-800/50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              HEALTH PACKAGES (SAVE 40%)
            </button>
          </div>

          {/* Trust Indicators Required by prompt */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Qualified Pathology Team</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Reliable Diagnostic Testing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Secure Booking Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Certified Home Collection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Transparent Pricing (No Hidden Fees)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>6-Hour Report Turnaround</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Laboratory Card & Quick Highlights */}
        <div className="lg:col-span-5">
          <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Central Pathology Hub</h3>
                  <p className="text-[11px] text-slate-400">Automated Clinical Chemistry & Haematology</p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                LIVE & READY
              </span>
            </div>

            {/* Diagnostic Stats Snapshot */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Accuracy Level</span>
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-white">99.98%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">6-Sigma Calibration</div>
              </div>

              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Average Report Time</span>
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-xl font-bold text-sky-300">Same Day</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Routine CBC & Glucose</div>
              </div>
            </div>

            {/* Featured Popular Package Quick Card */}
            <div className="bg-gradient-to-r from-sky-950/50 to-slate-900/80 p-4 rounded-xl border border-sky-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  ⭐ Top Recommended Package
                </span>
                <span className="text-[11px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded">
                  Save ₹1,991
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Comprehensive Vital Health Check</h4>
              <p className="text-xs text-slate-300">
                CBC, HbA1c, Fasting Sugar, Lipid Profile, Liver Panel, Kidney Panel, Thyroid (T3/T4/TSH)
              </p>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-emerald-400">₹2,299</span>
                  <span className="text-xs text-slate-500 line-through">₹4,290</span>
                </div>
                <button
                  onClick={() =>
                    onOpenBooking({
                      type: 'PACKAGE',
                      itemId: 'pkg-complete-02',
                      name: 'Comprehensive Vital Health Check',
                      price: 2299,
                    })
                  }
                  className="bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  Book Package
                </button>
              </div>
            </div>

            {/* Home Collection Badge */}
            <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Home className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                <strong>Home Sample Collection:</strong> Certified phlebotomist arrives with sterile vacutainers & cold box.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
