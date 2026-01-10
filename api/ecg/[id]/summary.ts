/**
 * ECG Summary Controller - GET /api/ecg/:id/summary
 * Retrieves ECG summary (without waveform data)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../../services/jwtService';
import { getECGSummary } from '../../services/s3Service';
import {
  sendErrorResponse,
  sendSuccessResponse,
  handleError,
  ErrorCode,
} from '../../services/errorService';
import { logger } from '../../utils/logger';

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
    logger.info('ECG summary request', { userId: user.userId, id: req.query.id });

    // Get ID from query params (Vercel dynamic route)
    const id = req.query.id as string;

    if (!id) {
      return sendErrorResponse(res, 400, 'ECG record ID is required', ErrorCode.BAD_REQUEST);
    }

    // ID can be either S3 key or formatted ID (same logic as [id].ts)
    let s3Key: string;
    
    if (id.includes('/')) {
      s3Key = id.endsWith('.json') ? id : `${id}.json`;
    } else if (id.startsWith('ecg-json-')) {
      const withoutPrefix = id.replace('ecg-json-', '');
      const parts = withoutPrefix.split('-');
      if (parts.length >= 5) {
        const [year, month, day, ...rest] = parts;
        const remainder = rest.join('-');
        s3Key = `ecg-json/${year}/${month}/${day}/${remainder}.json`;
      } else {
        return sendErrorResponse(res, 400, 'Invalid ECG record ID format', ErrorCode.BAD_REQUEST);
      }
    } else {
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

    // Get ECG summary from S3
    const summary = await getECGSummary(s3Key);
    logger.info('ECG summary retrieved successfully', { s3Key });

    return sendSuccessResponse(res, summary);
  } catch (error: any) {
    const errorInfo = handleError(error, 'ECG Summary');
    logger.error('ECG summary failed', { error: errorInfo });

    const statusCode =
      errorInfo.code === ErrorCode.UNAUTHORIZED
        ? 401
        : errorInfo.code === ErrorCode.NOT_FOUND
        ? 404
        : 500;

    return sendErrorResponse(res, statusCode, errorInfo.message, errorInfo.code, errorInfo.details);
  }
}

