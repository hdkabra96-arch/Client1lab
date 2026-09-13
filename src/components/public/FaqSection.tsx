/**
 * Interactive Searchable FAQ Accordion Section
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import type { FAQItem } from '../../types/index.ts';
import { apiRequest } from '../../lib/api.ts';

export const FaqSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-01': true });

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await apiRequest<{ faqs: FAQItem[] }>('/faqs');
        setFaqs(data.faqs);
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      }
    };
    fetchFaqs();
  }, []);

  const categories = ['All', 'Preparation', 'Home Collection', 'Booking', 'Reports', 'General'];

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-10 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
          Frequently Asked Questions
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Everything You Need to Know About Diagnostics
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Clear, medically accurate answers about fasting protocols, home collection scheduling, digital report turnaround, and billing.
        </p>
      </div>

      {/* Search & Category Pills */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search questions (e.g. fasting, payment, home collection, time)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const isOpen = openIds[faq.id];

          return (
            <div
              key={faq.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleOpen(faq.id)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {faq.category}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{faq.question}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            No matching questions found. Contact our lab team directly for personalized guidance.
          </div>
        )}
      </div>
    </section>
  );
};
