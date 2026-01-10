/**
 * ECG Get Controller - GET /api/ecg/:id
 * Retrieves a specific ECG record by ID (S3 key)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../services/jwtService';
import { getECGData } from '../services/s3Service';
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
    logger.info('ECG get request', { userId: user.userId, id: req.query.id });

    // Get ID from query params (Vercel dynamic route)
    const id = req.query.id as string;

    if (!id) {
      return sendErrorResponse(res, 400, 'ECG record ID is required', ErrorCode.BAD_REQUEST);
    }

    // ID can be either:
    // 1. S3 key directly (if it contains '/' or starts with 'ecg-json')
    // 2. A formatted ID (ecg-json-YYYY-MM-DD-recordingId-timestamp)
    let s3Key: string;
    
    // Check if it's already an S3 key format (contains slashes)
    if (id.includes('/')) {
      s3Key = id.endsWith('.json') ? id : `${id}.json`;
    } else if (id.startsWith('ecg-json-')) {
      // Format: ecg-json-YYYY-MM-DD-recordingId-timestamp
      // Convert back to S3 key: ecg-json/YYYY/MM/DD/recordingId-timestamp.json
      const withoutPrefix = id.replace('ecg-json-', '');
      // Pattern: YYYY-MM-DD-recordingId-timestamp
      // We need to split carefully - first 3 parts are date, rest is recordingId-timestamp
      const parts = withoutPrefix.split('-');
      if (parts.length >= 5) {
        const [year, month, day, ...rest] = parts;
        const remainder = rest.join('-'); // Rejoin recordingId and timestamp parts
        s3Key = `ecg-json/${year}/${month}/${day}/${remainder}.json`;
      } else {
        return sendErrorResponse(res, 400, 'Invalid ECG record ID format', ErrorCode.BAD_REQUEST);
      }
    } else {
      // Try to decode as URL-encoded S3 key
      try {
        const decoded = decodeURIComponent(id);
        if (decoded.includes('/')) {
          s3Key = decoded.endsWith('.json') ? decoded : `${decoded}.json`;
        } else {
          return sendErrorResponse(
            res,
            400,
            'Invalid ECG record ID. Please use the full S3 key or formatted ID.',
            ErrorCode.BAD_REQUEST
          );
        }
      } catch {
        return sendErrorResponse(
          res,
          400,
          'Invalid ECG record ID format',
          ErrorCode.BAD_REQUEST
        );
      }
    }

    // Get ECG data from S3
    const ecgData = await getECGData(s3Key);
    logger.info('ECG data retrieved successfully', { s3Key });

    return sendSuccessResponse(res, ecgData);
  } catch (error: any) {
    const errorInfo = handleError(error, 'ECG Get');
    logger.error('ECG get failed', { error: errorInfo });

    const statusCode =
      errorInfo.code === ErrorCode.UNAUTHORIZED
        ? 401
        : errorInfo.code === ErrorCode.NOT_FOUND
        ? 404
        : 500;

    return sendErrorResponse(res, statusCode, errorInfo.message, errorInfo.code, errorInfo.details);
  }
}

