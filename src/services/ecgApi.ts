/**
 * ECG API Service - ViewModel Layer
 * Handles all API calls to the backend ECG endpoints
 */

import type {
  ECGData,
  ECGRecord,
  ECGListResponse,
  ECGUploadRequest,
  ECGUploadResponse,
  ECGListQuery,
  APIResponse,
} from '../models/ecg';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || '/api';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: APIResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API request failed: ${response.statusText}`);
  }

  if (!data.success) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data;
}

/**
 * Upload ECG data to the server
 */
export async function uploadECGData(request: ECGUploadRequest): Promise<ECGUploadResponse> {
  const response = await apiRequest<ECGUploadResponse>('/ecg/upload', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.data) {
    throw new Error('No data returned from upload endpoint');
  }

  return response.data;
}

/**
 * List ECG records with filtering and pagination
 */
export async function listECGRecords(query?: ECGListQuery): Promise<ECGListResponse> {
  // Build query string
  const params = new URLSearchParams();
  
  if (query?.page) {
    params.append('page', query.page.toString());
  }
  if (query?.pageSize) {
    params.append('pageSize', query.pageSize.toString());
  }
  if (query?.device_id) {
    params.append('device_id', query.device_id);
  }
  if (query?.patient_id) {
    params.append('patient_id', query.patient_id);
  }
  if (query?.start_date) {
    params.append('start_date', query.start_date);
  }
  if (query?.end_date) {
    params.append('end_date', query.end_date);
  }
  if (query?.recording_type) {
    params.append('recording_type', query.recording_type);
  }

  const queryString = params.toString();
  const endpoint = `/ecg/list${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<ECGListResponse>(endpoint, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No data returned from list endpoint');
  }

  return response.data;
}

/**
 * Get a specific ECG record by ID
 */
export async function getECGRecord(id: string): Promise<ECGData> {
  // Encode the ID for URL (handles S3 keys with special characters)
  const encodedId = encodeURIComponent(id);

  const response = await apiRequest<ECGData>(`/ecg/${encodedId}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No data returned from get endpoint');
  }

  return response.data;
}

/**
 * Get ECG summary (without waveform data)
 */
export async function getECGSummary(id: string): Promise<Partial<ECGData>> {
  // Encode the ID for URL
  const encodedId = encodeURIComponent(id);

  const response = await apiRequest<Partial<ECGData>>(`/ecg/${encodedId}/summary`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No data returned from summary endpoint');
  }

  return response.data;
}

/**
 * Helper function to format S3 key as ID
 * Converts S3 key format to a simpler ID format for URLs
 */
export function formatECGId(s3Key: string): string {
  // If it's already in a simple format, return as is
  if (!s3Key.includes('/')) {
    return s3Key;
  }

  // Convert "ecg-json/2024/01/15/recording-id-timestamp.json" 
  // to "ecg-json-2024-01-15-recording-id-timestamp"
  return s3Key
    .replace(/\.json$/, '')
    .replace(/\//g, '-');
}

/**
 * Helper function to parse ID back to S3 key
 */
export function parseECGId(id: string): string {
  // If it contains '/', it's already an S3 key
  if (id.includes('/')) {
    return id.endsWith('.json') ? id : `${id}.json`;
  }

  // Convert "ecg-json-2024-01-15-recording-id-timestamp"
  // back to "ecg-json/2024/01/15/recording-id-timestamp.json"
  if (id.startsWith('ecg-json-')) {
    const parts = id.replace('ecg-json-', '').split('-');
    if (parts.length >= 5) {
      const [year, month, day, ...rest] = parts;
      const remainder = rest.join('-');
      return `ecg-json/${year}/${month}/${day}/${remainder}.json`;
    }
  }

  // Fallback: assume it's already the S3 key format
  return id.endsWith('.json') ? id : `${id}.json`;
}

