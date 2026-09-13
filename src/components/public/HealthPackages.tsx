/**
 * Health Packages Showcase with Breakdown of Included Tests, Savings, and Booking triggers
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  Clock,
  AlertCircle,
  CalendarCheck,
  Shield,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { HealthPackage } from '../../types/index.ts';
import { apiRequest } from '../../lib/api.ts';

interface HealthPackagesProps {
  onBookPackage: (pkg: HealthPackage) => void;
}

export const HealthPackages: React.FC<HealthPackagesProps> = ({ onBookPackage }) => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await apiRequest<{ packages: HealthPackage[] }>('/packages');
        setPackages(data.packages);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <section className="py-14 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Preventive Health Screening
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Comprehensive Health Checkup Packages
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Curated full-body diagnostic profiles bundling high-impact biomarkers with up to 55% package savings, free home sample collection, and pathologist consultation.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const isExpanded = expandedPkgId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  pkg.popular
                    ? 'border-sky-500 shadow-xl ring-1 ring-sky-400'
                    : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                }`}
              >
                {/* Popular Pill */}
                {pkg.popular && (
                  <div className="bg-gradient-to-r from-sky-600 to-teal-500 text-white text-[11px] font-extrabold uppercase tracking-widest text-center py-1.5 px-4">
                    MOST RECOMMENDED BY DOCTORS
                  </div>
                )}

                <div className="p-6 sm:p-7 space-y-4">
                  {/* Title & Tagline */}
                  <div>
                    <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {pkg.code}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-2 leading-snug">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {pkg.tagline}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 line-through block">
                        Regular Price: ₹{pkg.originalPrice}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-slate-900">
                          ₹{pkg.discountedPrice}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">/ person</span>
                      </div>
                    </div>

                    <div className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-emerald-200">
                      Save ₹{pkg.savings}
                    </div>
                  </div>

                  {/* Key Highlights */}
                  <div className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Report: <strong>{pkg.reportTimeline}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Certified Home Sample Collection Available</span>
                    </div>
                  </div>

                  {/* Included Tests List */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">
                        Tests Included ({pkg.testsIncludedNames.length} Panels):
                      </span>
                      <button
                        onClick={() => setExpandedPkgId(isExpanded ? null : pkg.id)}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
                      >
                        {isExpanded ? 'Show Less' : 'View All'}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {(isExpanded ? pkg.testsIncludedNames : pkg.testsIncludedNames.slice(0, 4)).map(
                        (testName, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{testName}</span>
                          </li>
                        )
                      )}
                    </ul>

                    {!isExpanded && pkg.testsIncludedNames.length > 4 && (
                      <p className="text-[11px] text-slate-400 mt-1 pl-5">
                        + {pkg.testsIncludedNames.length - 4} more parameters...
                      </p>
                    )}
                  </div>

                  {/* Preparation Box */}
                  <div className="bg-amber-50/70 border border-amber-200/50 p-3 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{pkg.preparationInstructions}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => onBookPackage(pkg)}
                    className="w-full bg-slate-900 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Book This Health Package
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
