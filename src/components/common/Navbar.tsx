/**
 * Main Navigation Bar with Quick Demo Role Switcher, Portal Links, and Mobile Menu
 */

import React, { useState } from 'react';
import {
  Activity,
  PhoneCall,
  CalendarCheck,
  User as UserIcon,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  LogOut,
  FileText,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/index.ts';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenBooking: (initialItem?: any) => void;
  onOpenAuthModal: (initialMode?: 'login' | 'register' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenBooking,
  onOpenAuthModal,
}) => {
  const { user, logout, switchDemoAccount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', view: 'home' },
    { name: 'Diagnostic Tests', view: 'tests' },
    { name: 'Health Packages', view: 'packages' },
    { name: 'Home Collection', view: 'home-collection' },
    { name: 'Our Doctors', view: 'doctors' },
    { name: 'How It Works', view: 'how-it-works' },
    { name: 'FAQs', view: 'faqs' },
    { name: 'Contact', view: 'contact' },
  ];

  const handleDemoSwitch = async (role: UserRole) => {
    await switchDemoAccount(role);
    setDemoMenuOpen(false);
    if (role === 'PATIENT') {
      onNavigate('patient-portal');
    } else {
      onNavigate('admin-portal');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Clinical Accreditation & Helpline Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              NABL ISO 15189:2022 & CAP Certified
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-300">
              Automated 6-Sigma Analyzers • 100% Barcoded Cold-Chain Samples
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="tel:+912288002739"
              className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-medium">+91 (022) 8800-APEX</span>
            </a>

            {/* Quick Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-sky-300 px-2 py-0.5 rounded border border-slate-700 text-[11px] font-medium transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Demo Switcher
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-slate-800 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] text-slate-400 font-semibold uppercase">
                    Test Active Roles
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('PATIENT')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-700">Patient (Rohan Mehta)</span>
                    <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">Patient</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('SUPER_ADMIN')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-700">Medical Director (Admin)</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Super</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('PATHOLOGIST')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-700">Pathologist (Dr. Priya)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Reports</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('PHLEBOTOMIST')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-700">Phlebotomist (Rahul)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Logistics</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Clinical Brand */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-900 to-sky-950 flex items-center justify-center text-sky-400 shadow-md border border-slate-800">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-sky-900 transition-colors">
                  ApexPath
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded">
                  Labs
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Precision Pathology & Diagnostics
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.view}
                onClick={() => onNavigate(link.view)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === link.view
                    ? 'text-sky-900 bg-sky-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-800"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-sky-400 flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[110px] truncate">{user.name.split(' ')[0]}</span>
                  <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                    {user.role === 'PATIENT' ? 'Patient' : 'Staff'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    {user.role === 'PATIENT' ? (
                      <>
                        <button
                          onClick={() => {
                            onNavigate('patient-portal');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <Clock className="w-4 h-4 text-sky-600" />
                          Patient Dashboard
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('patient-portal', { tab: 'reports' });
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <FileText className="w-4 h-4 text-emerald-600" />
                          My Diagnostic Reports
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          onNavigate('admin-portal');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        Admin Laboratory Console
                      </button>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          onNavigate('home');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Patient Login
                </button>
                <button
                  onClick={() => onOpenAuthModal('admin')}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1"
                >
                  Admin
                </button>
              </div>
            )}

            {/* Primary Business CTA */}
            <button
              onClick={() => onOpenBooking()}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-98"
            >
              <CalendarCheck className="w-4 h-4" />
              BOOK A TEST
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onOpenBooking()}
              className="bg-sky-600 text-white text-xs font-semibold px-3 py-2 rounded-lg"
            >
              Book Test
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 animate-in fade-in">
          {navLinks.map((link) => (
            <button
              key={link.view}
              onClick={() => {
                onNavigate(link.view);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentView === link.view
                  ? 'bg-sky-50 text-sky-900 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </button>
          ))}

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate(user.role === 'PATIENT' ? 'patient-portal' : 'admin-portal');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-slate-100 text-slate-800 text-sm font-medium py-2.5 rounded-lg"
                >
                  {user.role === 'PATIENT' ? 'Open Patient Dashboard' : 'Open Admin Portal'}
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-rose-600 text-sm font-medium py-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full border border-slate-300 text-slate-800 text-sm font-medium py-2 rounded-lg"
                >
                  Patient Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenAuthModal('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full border border-slate-300 text-slate-800 text-sm font-medium py-2 rounded-lg"
                >
                  Admin Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
