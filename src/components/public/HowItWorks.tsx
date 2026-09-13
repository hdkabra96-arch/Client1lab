/**
 * How It Works & Quality Assurance Protocols
 */

import React from 'react';
import {
  CalendarPlus,
  PhoneCall,
  Droplet,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface HowItWorksProps {
  onOpenBooking: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenBooking }) => {
  const steps = [
    {
      number: '01',
      icon: CalendarPlus,
      title: 'Select Tests & Slot',
      desc: 'Browse individual blood tests or discounted health packages. Select home collection or clinic visit, choose your date and preferred morning time slot.',
    },
    {
      number: '02',
      icon: PhoneCall,
      title: 'Lab Team Confirmation',
      desc: 'Our clinical coordination team contacts you promptly to verify fasting preparation, answer queries, and confirm phlebotomist assignment.',
    },
    {
      number: '03',
      icon: Droplet,
      title: 'Cold-Chain Sample Collection',
      desc: 'Certified phlebotomist arrives with sterile single-use vacutainers. Blood is drawn painlessly, barcoded at your doorstep, and stored in a cold carrier.',
    },
    {
      number: '04',
      icon: FileCheck2,
      title: 'Verified Digital Report',
      desc: 'Samples run on automated Roche/Beckman analyzers. Verified and signed by consultant pathologists, with instant PDF download and comparative analytics.',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 border border-sky-200 px-3 py-1 rounded-full">
            Transparent Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How ApexPath Diagnostics Works
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            From easy online scheduling to automated laboratory analysis and prompt pathologist-verified reports — every step prioritizes clinical precision and patient comfort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-slate-200">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Quality Assured</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-left">
            <h3 className="text-base font-bold text-slate-900">
              Ready to schedule your routine or specialized blood test?
            </h3>
            <p className="text-xs text-slate-500">
              Choose from 250+ certified tests or full body screening packages.
            </p>
          </div>
          <button
            onClick={onOpenBooking}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow transition-all shrink-0 active:scale-98"
          >
            BOOK AN APPOINTMENT NOW
          </button>
        </div>
      </div>
    </section>
  );
};
