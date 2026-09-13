/**
 * ApexPath Diagnostic Laboratories - Main Application
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { Footer } from './components/common/Footer.tsx';
import { HeroSection } from './components/public/HeroSection.tsx';
import { TestCatalogue } from './components/public/TestCatalogue.tsx';
import { HealthPackages } from './components/public/HealthPackages.tsx';
import { HomeCollectionSection } from './components/public/HomeCollectionSection.tsx';
import { DoctorsSection } from './components/public/DoctorsSection.tsx';
import { HowItWorks } from './components/public/HowItWorks.tsx';
import { TestimonialsSection } from './components/public/TestimonialsSection.tsx';
import { FaqSection } from './components/public/FaqSection.tsx';
import { ContactSection } from './components/public/ContactSection.tsx';
import { BookingFlow } from './components/booking/BookingFlow.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { LegalModal } from './components/public/LegalModal.tsx';
import { PatientPortal } from './components/patient/PatientPortal.tsx';
import { AdminPortal } from './components/admin/AdminPortal.tsx';
import type { DiagnosticTest, HealthPackage } from './types/index.ts';

function MainAppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<any>({});

  // Modals
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingInitialItem, setBookingInitialItem] = useState<any>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'admin'>('login');

  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'refund' | null>(null);

  const handleNavigate = (view: string, params: any = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBooking = (initialItem?: any) => {
    setBookingInitialItem(initialItem || null);
    setBookingModalOpen(true);
  };

  const handleOpenAuth = (mode: 'login' | 'register' | 'admin' = 'login') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenBooking={handleOpenBooking}
        onOpenAuthModal={handleOpenAuth}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <div>
            <HeroSection
              onOpenBooking={handleOpenBooking}
              onNavigate={handleNavigate}
              onSearchSelect={(q) => handleNavigate('tests', { search: q })}
            />
            <HealthPackages
              onBookPackage={(pkg: HealthPackage) =>
                handleOpenBooking({
                  type: 'PACKAGE',
                  itemId: pkg.id,
                  name: pkg.name,
                  price: pkg.discountedPrice,
                })
              }
            />
            <div className="bg-slate-50 border-y border-slate-200">
              <TestCatalogue
                onBookTest={(test: DiagnosticTest) =>
                  handleOpenBooking({
                    type: 'TEST',
                    itemId: test.id,
                    name: test.name,
                    price: test.discountPrice || test.price,
                  })
                }
              />
            </div>
            <HomeCollectionSection onOpenBooking={handleOpenBooking} />
            <HowItWorks onOpenBooking={() => handleOpenBooking()} />
            <DoctorsSection />
            <TestimonialsSection />
            <FaqSection />
            <div className="bg-slate-50 border-t border-slate-200">
              <ContactSection />
            </div>
          </div>
        )}

        {currentView === 'tests' && (
          <div className="pt-6">
            <TestCatalogue
              initialSearch={viewParams.search || ''}
              initialCategory={viewParams.category || 'All'}
              onBookTest={(test: DiagnosticTest) =>
                handleOpenBooking({
                  type: 'TEST',
                  itemId: test.id,
                  name: test.name,
                  price: test.discountPrice || test.price,
                })
              }
            />
          </div>
        )}

        {currentView === 'packages' && (
          <div className="pt-6">
            <HealthPackages
              onBookPackage={(pkg: HealthPackage) =>
                handleOpenBooking({
                  type: 'PACKAGE',
                  itemId: pkg.id,
                  name: pkg.name,
                  price: pkg.discountedPrice,
                })
              }
            />
          </div>
        )}

        {currentView === 'home-collection' && (
          <div className="pt-6">
            <HomeCollectionSection onOpenBooking={handleOpenBooking} />
          </div>
        )}

        {currentView === 'doctors' && (
          <div className="pt-6">
            <DoctorsSection />
          </div>
        )}

        {currentView === 'how-it-works' && (
          <div className="pt-6">
            <HowItWorks onOpenBooking={() => handleOpenBooking()} />
          </div>
        )}

        {currentView === 'faqs' && (
          <div className="pt-6">
            <FaqSection />
          </div>
        )}

        {currentView === 'contact' && (
          <div className="pt-6">
            <ContactSection />
          </div>
        )}

        {currentView === 'patient-portal' && (
          <PatientPortal
            initialTab={viewParams.tab || 'appointments'}
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentView === 'admin-portal' && <AdminPortal />}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} onOpenLegal={(type) => setLegalModalType(type)} />

      {/* Booking Flow Modal */}
      <BookingFlow
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialItem={bookingInitialItem}
        onBookingSuccess={(appt) => {
          // If logged in, navigate to patient portal
          if (user) {
            handleNavigate('patient-portal');
          }
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          if (authInitialMode === 'admin') {
            handleNavigate('admin-portal');
          } else {
            handleNavigate('patient-portal');
          }
        }}
      />

      {/* Legal & Compliance Modal */}
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
