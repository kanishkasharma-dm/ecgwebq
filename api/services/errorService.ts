/**
 * Error Service - Service Layer
 * Provides standardized error responses and error handling
 */

import type { VercelResponse } from '@vercel/node';
import type { APIResponse } from '../models/types/ECGData';

/**
 * Standard error codes
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details?: any
): APIResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T): APIResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send error response
 */
export function sendErrorResponse(
  res: VercelResponse,
  statusCode: number,
  message: string,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details?: any
): void {
  const response = createErrorResponse(message, code, details);
  res.status(statusCode).json(response);
}

/**
 * Send success response
 */
export function sendSuccessResponse<T>(
  res: VercelResponse,
  data: T,
  statusCode: number = 200
): void {
  const response = createSuccessResponse(data);
  res.status(statusCode).json(response);
}

/**
 * Handle and log errors
 */
export function handleError(error: any, context?: string): {
  message: string;
  code: ErrorCode;
  details?: any;
} {
  // Log error (in production, use proper logging service)
  console.error(`[${context || 'Unknown'}] Error:`, error);

  // Handle known error types
  if (error.message?.includes('No authentication token')) {
    return {
      message: 'Authentication required',
      code: ErrorCode.UNAUTHORIZED,
    };
  }

  if (error.message?.includes('Token has expired') || error.message?.includes('Invalid token')) {
    return {
      message: 'Invalid or expired token',
      code: ErrorCode.UNAUTHORIZED,
    };
  }

  if (error.message?.includes('Admin access required') || error.message?.includes('Forbidden')) {
    return {
      message: 'Access denied',
      code: ErrorCode.FORBIDDEN,
    };
  }

  if (error.message?.includes('not found')) {
    return {
      message: error.message,
      code: ErrorCode.NOT_FOUND,
    };
  }

  if (error.message?.includes('validation') || error.message?.includes('Invalid')) {
    return {
      message: error.message,
      code: ErrorCode.VALIDATION_ERROR,
      details: error.details,
    };
  }

  // Default to internal error
  return {
    message: error.message || 'An unexpected error occurred',
    code: ErrorCode.INTERNAL_ERROR,
  };
}

