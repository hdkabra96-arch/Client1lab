/**
 * Authentication Context and Session Provider
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole } from '../types/index.ts';
import { apiRequest, getStoredToken, setStoredToken } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoAccount: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const stored = getStoredToken();
      if (!stored) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password = 'Patient@123'): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      setToken(data.token);
      setStoredToken(data.token);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      setUser(data.user);
      setToken(data.token);
      setStoredToken(data.token);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setStoredToken(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const switchDemoAccount = async (role: UserRole): Promise<User> => {
    const demoCredentials: Record<UserRole, { email: string; pass: string }> = {
      PATIENT: { email: 'patient@apexpathlabs.com', pass: 'Patient@123' },
      SUPER_ADMIN: { email: 'admin@apexpathlabs.com', pass: 'Admin@123' },
      LAB_ADMIN: { email: 'labadmin@apexpathlabs.com', pass: 'Admin@123' },
      PATHOLOGIST: { email: 'pathologist@apexpathlabs.com', pass: 'Staff@123' },
      PHLEBOTOMIST: { email: 'collector@apexpathlabs.com', pass: 'Staff@123' },
      RECEPTIONIST: { email: 'labadmin@apexpathlabs.com', pass: 'Admin@123' },
    };

    const target = demoCredentials[role] || demoCredentials.PATIENT;
    return await login(target.email, target.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        switchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
