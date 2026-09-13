/**
 * Laboratory Footer with Clinical Accreditations, Legal Disclaimers, and Contact Info
 */

import React from 'react';
import {
  Activity,
  ShieldCheck,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'refund') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLegal }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      {/* Upper Clinical Guarantee Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-900/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-0.5">NABL & CAP Certified</h4>
              <p className="text-xs text-slate-400">Strict compliance with ISO 15189:2022 international standard.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-900/60">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-0.5">Automated Dual Analyzers</h4>
              <p className="text-xs text-slate-400">Roche & Beckman Coulter systems with 6-sigma daily calibration.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-900/60">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-0.5">Rapid Same-Day Delivery</h4>
              <p className="text-xs text-slate-400">Routine hematology and biochemical reports released in 4–6 hours.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-900/60">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-0.5">Senior Pathologist Review</h4>
              <p className="text-xs text-slate-400">Every single report verified with electronic medical signature.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">ApexPath Diagnostic</span>
                <p className="text-xs text-sky-400 font-medium">Laboratories & Clinical Research</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              ApexPath Diagnostic Laboratories is an accredited tertiary reference pathology laboratory delivering precision diagnostic testing, preventive health checkups, and certified phlebotomist home sample collection.
            </p>

            <div className="pt-2 text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Apex Diagnostic Towers, 4th Floor, Medical Enclave, Main Blvd, Mumbai 400001</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Helpline: +91 (022) 8800-APEX / +91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>care@apexpathlabs.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Diagnostic Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('tests')} className="hover:text-white transition-colors">
                  Routine Blood Tests
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('packages')} className="hover:text-white transition-colors">
                  Annual Health Packages
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home-collection')} className="hover:text-white transition-colors">
                  Home Sample Collection
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tests', { category: 'Diabetes' })} className="hover:text-white transition-colors">
                  Diabetes Monitoring (HbA1c)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tests', { category: 'Cardiology' })} className="hover:text-white transition-colors">
                  Cardiovascular Lipid Profile
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tests', { category: 'Vitamins' })} className="hover:text-white transition-colors">
                  Vitamin D & B12 Panels
                </button>
              </li>
            </ul>
          </div>

          {/* Patient Support */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Patient Helpdesk</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors">
                  How Online Booking Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faqs')} className="hover:text-white transition-colors">
                  Fasting & Test Preparation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('doctors')} className="hover:text-white transition-colors">
                  Our Consultant Pathologists
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Contact Laboratory Desk
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors">
                  Patient Health Data Privacy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('refund')} className="hover:text-white transition-colors">
                  Cancellation & Refund Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Laboratory Hours</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <p className="text-white font-medium">Monday – Friday</p>
                <p className="text-slate-400">07:00 AM – 08:00 PM</p>
              </div>
              <div>
                <p className="text-white font-medium">Saturday</p>
                <p className="text-slate-400">07:00 AM – 06:00 PM</p>
              </div>
              <div>
                <p className="text-white font-medium">Sunday</p>
                <p className="text-slate-400">07:00 AM – 01:00 PM</p>
                <span className="text-[10px] text-amber-400">Emergency & Home collection only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Medical Notice */}
        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ApexPath Diagnostic Laboratories. NABL Lic No. MC-4829. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onOpenLegal('privacy')} className="hover:text-slate-400">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => onOpenLegal('terms')} className="hover:text-slate-400">
              Terms of Service
            </button>
            <span>•</span>
            <button onClick={() => onOpenLegal('refund')} className="hover:text-slate-400">
              Refund Policy
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 mt-4 text-center">
          Medical Disclaimer: Diagnostic laboratory investigation findings are meant for clinical diagnosis by qualified physicians and registered medical practitioners. Values must be correlated with clinical symptoms and findings.
        </p>
      </div>
    </footer>
  );
};
