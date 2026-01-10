/**
 * S3 Storage Abstraction - Model Layer
 * Represents S3 as the persistent data store (acts as Model in MVC)
 */

import type { ECGData, ECGRecord } from './types/ECGData';

/**
 * S3 Key Structure
 * 
 * Format: ecg-json/YYYY/MM/DD/{recording_id}-{timestamp}.json
 * 
 * Example: ecg-json/2024/01/15/ECG001-2024-01-15T10-30-00Z.json
 */
export function generateS3Key(ecgData: ECGData): string {
  const timestamp = new Date(ecgData.recording_timestamp);
  const year = timestamp.getUTCFullYear();
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getUTCDate()).padStart(2, '0');
  
  // Create filename-safe timestamp
  const filenameTimestamp = ecgData.recording_timestamp
    .replace(/:/g, '-')
    .replace(/\./g, '-')
    .split('T')[0] + 'T' + ecgData.recording_timestamp
    .split('T')[1]?.replace(/:/g, '-').replace(/\./g, '-').replace('Z', 'Z') || '';

  return `ecg-json/${year}/${month}/${day}/${ecgData.recording_id}-${filenameTimestamp}.json`;
}

/**
 * Parse S3 key to extract metadata
 */
export function parseS3Key(s3Key: string): {
  year: string;
  month: string;
  day: string;
  recordingId: string;
  timestamp: string;
} | null {
  const match = s3Key.match(/ecg-json\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)-(.+)\.json/);
  if (!match) {
    return null;
  }

  return {
    year: match[1],
    month: match[2],
    day: match[3],
    recordingId: match[4],
    timestamp: match[5],
  };
}

/**
 * Convert S3 object metadata to ECG Record
 */
export function s3ObjectToECGRecord(
  s3Key: string,
  metadata: Record<string, string> = {},
  size?: number
): ECGRecord {
  const parsed = parseS3Key(s3Key);
  
  return {
    id: s3Key.replace(/\.json$/, '').replace(/\//g, '-'), // Simple ID generation
    s3_key: s3Key,
    device_id: metadata['device_id'] || '',
    patient_id: metadata['patient_id'] || '',
    patient_name: metadata['patient_name'],
    recording_timestamp: metadata['recording_timestamp'] || parsed?.timestamp || '',
    recording_id: parsed?.recordingId || '',
    created_at: metadata['created_at'] || new Date().toISOString(),
    size,
    metadata: {
      recording_type: metadata['recording_type'],
      duration: metadata['duration'] ? parseFloat(metadata['duration']) : undefined,
      sample_rate: metadata['sample_rate'] ? parseFloat(metadata['sample_rate']) : undefined,
    },
  };
}

/**
 * S3 Prefix for listing (date-based)
 */
export function getS3Prefix(params: {
  year?: string;
  month?: string;
  day?: string;
  startDate?: Date;
  endDate?: Date;
}): string {
  if (params.year && params.month && params.day) {
    return `ecg-json/${params.year}/${params.month}/${params.day}/`;
  }
  
  if (params.year && params.month) {
    return `ecg-json/${params.year}/${params.month}/`;
  }
  
  if (params.year) {
    return `ecg-json/${params.year}/`;
  }

  if (params.startDate || params.endDate) {
    // For date range queries, we'll use a broader prefix
    // Service layer will handle filtering
    return 'ecg-json/';
  }

  return 'ecg-json/';
}

