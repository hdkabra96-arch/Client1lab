/**
 * Diagnostic Tests Catalogue with Comprehensive Search, Filters, and Booking triggers
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  Droplet,
  Home,
  CheckCircle,
  AlertCircle,
  CalendarPlus,
  Info,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { DiagnosticTest } from '../../types/index.ts';
import { apiRequest } from '../../lib/api.ts';

interface TestCatalogueProps {
  initialSearch?: string;
  initialCategory?: string;
  onBookTest: (test: DiagnosticTest) => void;
}

export const TestCatalogue: React.FC<TestCatalogueProps> = ({
  initialSearch = '',
  initialCategory = 'All',
  onBookTest,
}) => {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTestDetail, setSelectedTestDetail] = useState<DiagnosticTest | null>(null);

  const categories = [
    'All',
    'Haematology',
    'Diabetes',
    'Cardiology',
    'Biochemistry',
    'Endocrinology',
    'Vitamins',
    'Pathology',
    'Immunology',
  ];

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ tests: DiagnosticTest[] }>(
        `/tests?search=${encodeURIComponent(search)}&category=${encodeURIComponent(selectedCategory)}`
      );
      setTests(data.tests);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [search, selectedCategory]);

  return (
    <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
          Tertiary Reference Laboratory Tests
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Comprehensive Diagnostic Test Catalogue
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Select individual diagnostic parameters with transparent pricing, strict fasting guidance, certified home collection, and NABL-certified reporting.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by test name, code or condition (e.g. Complete Blood Count, CBC, HbA1c, Cholesterol, Liver, Kidney, Vitamin D)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
          <Info className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Tests Found</h3>
          <p className="text-xs text-slate-500">
            No diagnostic tests matched your search "{search}". Try searching with a general medical term like "Blood", "Sugar", or "Vitamin".
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
            }}
            className="text-xs text-sky-600 font-semibold underline"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const finalPrice = test.discountPrice || test.price;
            const hasDiscount = test.discountPrice && test.discountPrice < test.price;

            return (
              <div
                key={test.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {test.category}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {test.code}
                    </span>
                  </div>

                  {/* Test Name */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-900 transition-colors mb-1.5 leading-snug">
                    {test.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {test.shortDescription}
                  </p>

                  {/* Metadata Chips */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Report: <strong>{test.reportTime}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Droplet className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Sample: {test.sampleType}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Home className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        Home Collection: {test.homeCollectionAvailable ? (
                          <strong className="text-emerald-700">Available</strong>
                        ) : (
                          'Clinic Only'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Preparation instruction highlight */}
                  <div className="mt-3 bg-amber-50 border border-amber-200/60 p-2 rounded-lg text-[11px] text-amber-800 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{test.preparationRequired}</span>
                  </div>
                </div>

                {/* Footer with Price & Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-slate-900">₹{finalPrice}</span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through">₹{test.price}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">All Taxes Included</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedTestDetail(test)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="View Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onBookTest(test)}
                      className="bg-slate-900 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Detail Modal */}
      {selectedTestDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  {selectedTestDetail.category} ({selectedTestDetail.code})
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedTestDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTestDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div>
                <strong className="block text-slate-900 mb-0.5">Clinical Significance:</strong>
                <p className="text-slate-600">{selectedTestDetail.description}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900">
                <strong className="block mb-1 text-amber-950">Patient Preparation Instructions:</strong>
                <p>{selectedTestDetail.preparationRequired}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Turnaround Time</span>
                  <span className="font-semibold text-slate-800">{selectedTestDetail.reportTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Biological Specimen</span>
                  <span className="font-semibold text-slate-800">{selectedTestDetail.sampleType}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <span className="text-xl font-bold text-slate-900">
                  ₹{selectedTestDetail.discountPrice || selectedTestDetail.price}
                </span>
                {selectedTestDetail.discountPrice && (
                  <span className="text-xs text-slate-400 line-through ml-2">
                    ₹{selectedTestDetail.price}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  const t = selectedTestDetail;
                  setSelectedTestDetail(null);
                  onBookTest(t);
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-all"
              >
                Book This Test
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
