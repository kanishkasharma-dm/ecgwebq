/**
 * ECG List Controller - GET /api/ecg/list
 * Lists ECG records with filtering and pagination
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../services/jwtService';
import { validateListQueryParams } from '../services/validationService';
import { listECGRecords } from '../services/s3Service';
import {
  sendErrorResponse,
  sendSuccessResponse,
  handleError,
  ErrorCode,
} from '../services/errorService';
import { logger } from '../utils/logger';
import type { ECGListResponse } from '../models/types/ECGData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.BAD_REQUEST);
  }

  try {
    // Authenticate request
    const user = authenticateRequest(req);
    logger.info('ECG list request', { userId: user.userId, role: user.role });

    // Validate query parameters
    const validation = validateListQueryParams(req.query);
    if (validation.error) {
      return sendErrorResponse(
        res,
        400,
        `Validation error: ${validation.error}`,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const query = validation.value!;
    const page = query.page || 1;
    const pageSize = query.pageSize || 50;

    // Parse date filters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.start_date) {
      startDate = new Date(query.start_date);
      if (isNaN(startDate.getTime())) {
        return sendErrorResponse(res, 400, 'Invalid start_date format', ErrorCode.VALIDATION_ERROR);
      }
    }

    if (query.end_date) {
      endDate = new Date(query.end_date);
      if (isNaN(endDate.getTime())) {
        return sendErrorResponse(res, 400, 'Invalid end_date format', ErrorCode.VALIDATION_ERROR);
      }
    }

    // List records from S3
    const result = await listECGRecords({
      page,
      pageSize,
      device_id: query.device_id as string | undefined,
      patient_id: query.patient_id as string | undefined,
      startDate,
      endDate,
      recording_type: query.recording_type as string | undefined,
    });

    logger.info('ECG list retrieved', {
      count: result.records.length,
      page,
      hasMore: result.hasMore,
    });

    // Format response
    const response: ECGListResponse = {
      records: result.records,
      total: result.total,
      page,
      pageSize,
      hasMore: result.hasMore,
    };

    return sendSuccessResponse(res, response);
  } catch (error: any) {
    const errorInfo = handleError(error, 'ECG List');
    logger.error('ECG list failed', { error: errorInfo });

    const statusCode =
      errorInfo.code === ErrorCode.UNAUTHORIZED
        ? 401
        : errorInfo.code === ErrorCode.FORBIDDEN
        ? 403
        : 500;

    return sendErrorResponse(res, statusCode, errorInfo.message, errorInfo.code, errorInfo.details);
  }
}

