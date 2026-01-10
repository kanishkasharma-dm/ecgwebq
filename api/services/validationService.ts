/**
 * Validation Service - Service Layer
 * Wraps validation schemas and provides validation utilities
 */

import {
  validateECGData,
  validateUploadRequest,
  validateListQuery,
} from '../models/schemas/ecgSchema';
import type { ECGData } from '../models/types/ECGData';

/**
 * Validate ECG data
 */
export function validateECGDataInput(data: any): { error?: string; value?: ECGData } {
  return validateECGData(data);
}

/**
 * Validate upload request
 */
export function validateUploadRequestInput(data: any): { error?: string; value?: any } {
  return validateUploadRequest(data);
}

/**
 * Validate list query parameters
 */
export function validateListQueryParams(query: any): { error?: string; value?: any } {
  return validateListQuery(query);
}

