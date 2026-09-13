/**
 * Authentication Modal: Patient Sign In, Registration, and Staff Portal Access
 */

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'admin';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { login, register, switchDemoAccount } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number>(32);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login' || mode === 'admin') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          phone,
          password,
          age: Number(age),
          gender,
          role: 'PATIENT',
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setError('');
    setIsLoading(true);
    try {
      await switchDemoAccount(role);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header with Mode Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Patient Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'register'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              New Patient
            </button>
            <button
              onClick={() => {
                setMode('admin');
                setError('');
                setEmail('admin@apexpathlabs.com');
                setPassword('Admin@123');
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'admin'
                  ? 'bg-purple-900 text-white'
                  : 'text-purple-600 hover:bg-purple-50'
              }`}
            >
              Staff Portal
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant 1-Click Demo Accounts:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleDemoLogin('PATIENT')}
              className="bg-white hover:bg-sky-50 text-slate-700 font-medium py-1.5 px-2 rounded-lg border border-slate-200 text-left transition-colors truncate"
            >
              👤 Patient (Rohan)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('SUPER_ADMIN')}
              className="bg-white hover:bg-purple-50 text-slate-700 font-medium py-1.5 px-2 rounded-lg border border-slate-200 text-left transition-colors truncate"
            >
              🛡️ Admin (Dr. Alistair)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('PATHOLOGIST')}
              className="bg-white hover:bg-emerald-50 text-slate-700 font-medium py-1.5 px-2 rounded-lg border border-slate-200 text-left transition-colors truncate"
            >
              🔬 Pathologist (Dr. Priya)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('PHLEBOTOMIST')}
              className="bg-white hover:bg-amber-50 text-slate-700 font-medium py-1.5 px-2 rounded-lg border border-slate-200 text-left transition-colors truncate"
            >
              🩸 Phlebotomist (Rahul)
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Sen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age & Gender *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-16 px-2 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <select
                      value={gender}
                      onChange={(e: any) => setGender(e.target.value)}
                      className="flex-1 px-2 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder={mode === 'admin' ? 'admin@apexpathlabs.com' : 'patient@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password *</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail('patient@apexpathlabs.com');
                    setPassword('Patient@123');
                  }}
                  className="text-[11px] text-sky-600 hover:underline"
                >
                  Auto-fill demo patient
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              'Processing...'
            ) : mode === 'register' ? (
              'Create Patient Account'
            ) : (
              'Sign In'
            )}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center pt-2 text-[11px] text-slate-400">
          Secure 256-bit encrypted health session • HIPAA / DISHA compliant
        </div>
      </div>
    </div>
  );
};
