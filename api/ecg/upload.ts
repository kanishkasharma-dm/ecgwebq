/**
 * ECG Upload Controller - POST /api/ecg/upload
 * Handles ECG data upload to S3
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../services/jwtService';
import { validateUploadRequestInput } from '../services/validationService';
import { uploadECGData } from '../services/s3Service';
import {
  sendErrorResponse,
  sendSuccessResponse,
  handleError,
  ErrorCode,
} from '../services/errorService';
import { logger } from '../utils/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.BAD_REQUEST);
  }

  try {
    // Authenticate request
    const user = authenticateRequest(req);
    logger.info('ECG upload request', { userId: user.userId, role: user.role });

    // Validate request body
    const validation = validateUploadRequestInput(req.body);
    if (validation.error) {
      return sendErrorResponse(
        res,
        400,
        `Validation error: ${validation.error}`,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const { ecg_data } = validation.value!;

    // Upload to S3
    const s3Key = await uploadECGData(ecg_data);
    logger.info('ECG data uploaded successfully', { s3Key, recordingId: ecg_data.recording_id });

    // Return success response
    return sendSuccessResponse(
      res,
      {
        s3_key: s3Key,
        recording_id: ecg_data.recording_id,
        message: 'ECG data uploaded successfully',
      },
      201
    );
  } catch (error: any) {
    const errorInfo = handleError(error, 'ECG Upload');
    logger.error('ECG upload failed', { error: errorInfo });

    const statusCode =
      errorInfo.code === ErrorCode.UNAUTHORIZED
        ? 401
        : errorInfo.code === ErrorCode.FORBIDDEN
        ? 403
        : errorInfo.code === ErrorCode.VALIDATION_ERROR
        ? 400
        : 500;

    return sendErrorResponse(res, statusCode, errorInfo.message, errorInfo.code, errorInfo.details);
  }
}

