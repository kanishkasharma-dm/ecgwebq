/**
 * S3 Service - Service Layer
 * Handles all AWS S3 operations for ECG data storage and retrieval
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import type { ECGData, ECGRecord } from '../models/types/ECGData';
import {
  generateS3Key,
  s3ObjectToECGRecord,
  getS3Prefix,
  parseS3Key,
} from '../models/s3Storage';

// Reuse S3 client across function invocations (Vercel caches)
let s3Client: S3Client | null = null;

/**
 * Get or create S3 client (cached for performance)
 */
function getS3Client(): S3Client {
  if (!s3Client) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      maxAttempts: 3,
    });
  }
  return s3Client;
}

/**
 * Upload ECG data to S3
 */
export async function uploadECGData(ecgData: ECGData): Promise<string> {
  const client = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET_NAME || 'cardiox-ecg-data';
  const s3Key = generateS3Key(ecgData);

  // Add system timestamps if not present
  const now = new Date().toISOString();
  if (!ecgData.created_at) {
    ecgData.created_at = now;
  }
  ecgData.updated_at = now;

  // Prepare metadata tags for S3
  const metadata: Record<string, string> = {
    device_id: ecgData.device_id,
    patient_id: ecgData.patient_id,
    recording_id: ecgData.recording_id,
    recording_timestamp: ecgData.recording_timestamp,
    created_at: ecgData.created_at,
    updated_at: ecgData.updated_at || now,
  };

  if (ecgData.patient_name) {
    metadata.patient_name = ecgData.patient_name;
  }

  if (ecgData.recording_type) {
    metadata.recording_type = ecgData.recording_type;
  }

  if (ecgData.recording_duration) {
    metadata.duration = ecgData.recording_duration.toString();
  }

  if (ecgData.sample_rate) {
    metadata.sample_rate = ecgData.sample_rate.toString();
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    Body: JSON.stringify(ecgData, null, 2),
    ContentType: 'application/json',
    Metadata: metadata,
    // Add tags for filtering
    Tagging: Object.entries({
      device_id: ecgData.device_id,
      patient_id: ecgData.patient_id,
      recording_type: ecgData.recording_type || 'unknown',
    })
      .map(([key, value]) => `${key}=${value}`)
      .join('&'),
  });

  try {
    await client.send(command);
    return s3Key;
  } catch (error: any) {
    throw new Error(`Failed to upload ECG data to S3: ${error.message}`);
  }
}

/**
 * Get ECG data from S3 by key
 */
export async function getECGData(s3Key: string): Promise<ECGData> {
  const client = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET_NAME || 'cardiox-ecg-data';

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  try {
    const response = await client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response from S3');
    }

    // Convert stream to string (Vercel handles this automatically in most cases)
    const bodyString = await response.Body.transformToString();
    const ecgData: ECGData = JSON.parse(bodyString);
    
    return ecgData;
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      throw new Error(`ECG record not found: ${s3Key}`);
    }
    throw new Error(`Failed to get ECG data from S3: ${error.message}`);
  }
}

/**
 * Get ECG record metadata (without full data)
 */
export async function getECGRecordMetadata(s3Key: string): Promise<ECGRecord> {
  const client = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET_NAME || 'cardiox-ecg-data';

  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  try {
    const response = await client.send(command);
    
    const record = s3ObjectToECGRecord(
      s3Key,
      response.Metadata || {},
      response.ContentLength
    );
    
    return record;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      throw new Error(`ECG record not found: ${s3Key}`);
    }
    throw new Error(`Failed to get ECG record metadata: ${error.message}`);
  }
}

/**
 * List ECG records from S3 with filtering and pagination
 */
export async function listECGRecords(params: {
  page?: number;
  pageSize?: number;
  device_id?: string;
  patient_id?: string;
  startDate?: Date;
  endDate?: Date;
  recording_type?: string;
}): Promise<{ records: ECGRecord[]; total: number; hasMore: boolean }> {
  const client = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET_NAME || 'cardiox-ecg-data';

  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const maxKeys = pageSize * page; // Fetch up to the last page we need

  // Build prefix based on date range
  const prefix = getS3Prefix({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const records: ECGRecord[] = [];
  let continuationToken: string | undefined;
  let hasMore = false;
  let totalFetched = 0;

  try {
    // Fetch objects in batches
    while (totalFetched < maxKeys) {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: Math.min(1000, maxKeys - totalFetched), // S3 max is 1000
        ContinuationToken: continuationToken,
      });

      const response = await client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        break;
      }

      // Process each object
      for (const object of response.Contents) {
        if (!object.Key || !object.Key.endsWith('.json')) {
          continue;
        }

        // Apply filters
        if (params.device_id || params.patient_id || params.recording_type || params.startDate || params.endDate) {
          // For detailed filtering, we need to check metadata
          // This is simplified - in production, consider using S3 Select or metadata queries
          try {
            const metadata = await getECGRecordMetadata(object.Key);
            
            // Filter by device_id
            if (params.device_id && metadata.device_id !== params.device_id) {
              continue;
            }

            // Filter by patient_id
            if (params.patient_id && metadata.patient_id !== params.patient_id) {
              continue;
            }

            // Filter by recording_type
            if (params.recording_type && metadata.metadata?.recording_type !== params.recording_type) {
              continue;
            }

            // Filter by date range
            if (params.startDate || params.endDate) {
              const recordDate = new Date(metadata.recording_timestamp);
              if (params.startDate && recordDate < params.startDate) {
                continue;
              }
              if (params.endDate && recordDate > params.endDate) {
                continue;
              }
            }

            records.push(metadata);
          } catch (error) {
            // Skip records that fail metadata fetch
            console.warn(`Failed to fetch metadata for ${object.Key}:`, error);
            continue;
          }
        } else {
          // No filters, just add the record
          try {
            const metadata = await getECGRecordMetadata(object.Key);
            records.push(metadata);
          } catch (error) {
            console.warn(`Failed to fetch metadata for ${object.Key}:`, error);
            continue;
          }
        }

        totalFetched++;
      }

      // Check if there are more objects
      if (response.IsTruncated && response.NextContinuationToken) {
        continuationToken = response.NextContinuationToken;
        hasMore = true;
      } else {
        hasMore = false;
        break;
      }

      // If we've collected enough for the current page, break
      if (records.length >= maxKeys) {
        hasMore = response.IsTruncated || false;
        break;
      }
    }

    // Sort by recording timestamp (newest first)
    records.sort((a, b) => {
      const dateA = new Date(a.recording_timestamp).getTime();
      const dateB = new Date(b.recording_timestamp).getTime();
      return dateB - dateA;
    });

    // Paginate results
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecords = records.slice(startIndex, endIndex);

    // Check if there are more pages
    const actualHasMore = records.length > endIndex || hasMore;

    return {
      records: paginatedRecords,
      total: records.length, // This is approximate for large datasets
      hasMore: actualHasMore,
    };
  } catch (error: any) {
    throw new Error(`Failed to list ECG records from S3: ${error.message}`);
  }
}

/**
 * Get ECG summary (data without waveform arrays)
 */
export async function getECGSummary(s3Key: string): Promise<Partial<ECGData>> {
  const fullData = await getECGData(s3Key);

  // Remove large waveform arrays
  const summary: Partial<ECGData> = {
    ...fullData,
    leads: fullData.leads.map((lead) => ({
      ...lead,
      lead_data: [], // Remove actual waveform data
      data_length: lead.lead_data.length, // Keep length info
    })) as any,
  };

  return summary;
}

