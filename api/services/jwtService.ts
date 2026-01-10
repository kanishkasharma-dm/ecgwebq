/**
 * JWT Service - Service Layer
 * Handles JWT token verification and authentication
 */

import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

export interface JWTPayload {
  userId: string;
  role: 'admin' | 'doctor';
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Extract JWT token from request headers
 */
export function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Support direct token
  return authHeader;
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Authenticate request and return user payload
 */
export function authenticateRequest(req: VercelRequest): JWTPayload {
  const token = extractToken(req);

  if (!token) {
    throw new Error('No authentication token provided');
  }

  return verifyToken(token);
}

/**
 * Check if user has required role
 */
export function hasRole(payload: JWTPayload, requiredRole: 'admin' | 'doctor' | 'both'): boolean {
  if (requiredRole === 'both') {
    return payload.role === 'admin' || payload.role === 'doctor';
  }
  return payload.role === requiredRole;
}

/**
 * Require admin role (throw error if not admin)
 */
export function requireAdmin(payload: JWTPayload): void {
  if (payload.role !== 'admin') {
    throw new Error('Admin access required');
  }
}

