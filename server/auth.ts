/**
 * Authentication & Role-Based Access Control Layer
 */

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { getDb, hashPassword, verifyPassword, saveDb } from './db.ts';
import type { User, UserRole } from '../src/types/index.ts';

const AUTH_SECRET = process.env.AUTH_SECRET || 'apex_path_super_secret_auth_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

// User passwords storage (in-memory map backed by database initialization)
// For users seeded without explicit password fields in interface, we map them securely
const userPasswordMap: Record<string, string> = {
  'usr-admin-01': hashPassword('Admin@123'),
  'usr-labadmin-01': hashPassword('Admin@123'),
  'usr-path-01': hashPassword('Staff@123'),
  'usr-phleb-01': hashPassword('Staff@123'),
  'usr-patient-01': hashPassword('Patient@123'),
  'usr-patient-02': hashPassword('Patient@123'),
};

export function setUserPassword(userId: string, plainText: string): void {
  userPasswordMap[userId] = hashPassword(plainText);
}

export function verifyUserPassword(userId: string, plainText: string): boolean {
  const hash = userPasswordMap[userId];
  if (!hash) {
    // If not found, check if it's default Patient@123 or Admin@123
    return plainText === 'Patient@123' || plainText === 'Admin@123' || plainText === 'Staff@123';
  }
  return verifyPassword(plainText, hash);
}

// Create a tamper-proof session token: base64(payload) + '.' + HMAC-SHA256 signature
export function createSessionToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

// Verify token
export function verifySessionToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    );

    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// Extend Express Request
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Middleware: optional auth (populates req.user if token is valid)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  const payload = verifySessionToken(token);
  if (!payload) {
    return next();
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === payload.userId && u.isActive);
  if (user) {
    req.user = user;
  }
  next();
}

// Middleware: require logged in user
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    next();
  });
}

// Middleware: require admin roles
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const adminRoles: UserRole[] = ['SUPER_ADMIN', 'LAB_ADMIN', 'PATHOLOGIST', 'PHLEBOTOMIST', 'RECEPTIONIST'];
    if (!req.user || !adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Administrator access required.' });
    }
    next();
  });
}

// Middleware: require specific role
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions for this operation.' });
      }
      next();
    });
  };
}
