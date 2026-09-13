/**
 * Legal Documents: Privacy Policy, Terms & Conditions, Refund & Cancellation Policy
 */

import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'refund' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const contentMap = {
    privacy: {
      title: 'Patient Health Information Privacy Policy (HIPAA / DISHA Compliant)',
      date: 'Last Updated: September 2026',
      body: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            At ApexPath Diagnostic Laboratories, protecting your confidential biological specimen records, diagnostic values, and identifying demographic data is fundamental to our medical ethics.
          </p>
          <h4 className="font-bold text-slate-900 text-sm">1. Collection of Health Data</h4>
          <p>
            We collect only the essential personal information required to execute clinical assays safely: full legal name, date of birth, contact number, biological sex, residential collection address, prescribing physician, and test results.
          </p>
          <h4 className="font-bold text-slate-900 text-sm">2. Laboratory Security & Confidentiality</h4>
          <p>
            Specimens are barcoded with non-identifiable numerical accession IDs during transit. Diagnostic report PDFs are encrypted and accessible strictly by authenticated patient accounts and verified laboratory staff.
          </p>
          <h4 className="font-bold text-slate-900 text-sm">3. Non-Disclosure Guarantee</h4>
          <p>
            ApexPath Diagnostic Laboratories never sells, rents, or commercializes patient medical data to third-party insurance brokers, pharmaceutical marketers, or advertising brokers under any circumstances.
          </p>
        </div>
      ),
    },
    terms: {
      title: 'Laboratory Services Terms & Conditions',
      date: 'Effective Date: September 2026',
      body: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            By booking a diagnostic laboratory test, health package, or home phlebotomy service with ApexPath Diagnostic Laboratories, you acknowledge and agree to the following clinical terms.
          </p>
          <h4 className="font-bold text-slate-900 text-sm">1. Clinical Interpretation</h4>
          <p>
            Laboratory test findings are biological indicators designed to assist registered medical doctors in formulating a clinical diagnosis. Test results must be clinically correlated with physical signs and patient history.
          </p>
          <h4 className="font-bold text-slate-900 text-sm">2. Patient Preparation Adherence</h4>
          <p>
            Accurate biochemical testing depends on strict patient compliance with fasting and medication protocols. ApexPath is not liable for physiological variations caused by non-compliance with fasting instructions.
          </p>
          <h4 className="font-bold text-slate-900 text-sm">3. Turnaround Timelines</h4>
          <p>
            Report delivery timelines are stated for routine sample flows. In instances of biological ambiguity, reflex duplicate runs, or analyzer calibration checks, our clinical director reserves the right to repeat testing to assure accuracy.
          </p>
        </div>
      ),
    },
    refund: {
      title: 'Appointment Cancellation & Refund Policy',
      date: 'Updated: September 2026',
      body: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <h4 className="font-bold text-slate-900 text-sm">1. Cancellation Window</h4>
          <p>
            You may cancel or reschedule your diagnostic test appointment up to 2 hours prior to the scheduled collection window with zero penalty fees.
          </p>
          <h4 className="font-bold text-slate-900 text-sm">2. Online Payment Refunds</h4>
          <p>
            If you paid online via UPI or Credit/Debit card and cancelled within the eligible window, a 100% refund is initiated automatically to your original payment method within 3–5 working banking days.
          </p>
          <h4 className="font-bold text-slate-900 text-sm">3. Ineligibility After Phlebotomy Commenced</h4>
          <p>
            Once our phlebotomist has arrived at your address or sample collection has occurred, tests cannot be cancelled or refunded as sterile single-use materials and analyzer reagents are committed.
          </p>
        </div>
      ),
    },
  };

  const item = contentMap[type];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              Legal & Compliance
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{item.title}</h3>
            <p className="text-[11px] text-slate-400">{item.date}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2">{item.body}</div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
