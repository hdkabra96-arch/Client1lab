/**
 * Testimonials & Verified Patient Reviews
 */

import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Quote, UserCheck } from 'lucide-react';
import type { Testimonial } from '../../types/index.ts';
import { apiRequest } from '../../lib/api.ts';

export const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await apiRequest<{ testimonials: Testimonial[] }>('/testimonials');
        setTestimonials(data.testimonials);
      } catch (err) {
        console.error('Failed to load testimonials:', err);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
          Patient Experience
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Trusted by Thousands of Patients & Families
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Read candid reviews from individuals, corporate executives, and senior citizens who rely on our prompt home sample collection and uncompromising laboratory precision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Star Rating & Quote mark */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-slate-200" />
              </div>

              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{t.review}"
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{t.patientName}</h4>
                <p className="text-[11px] text-slate-400">{t.location}</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {t.testTaken}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
