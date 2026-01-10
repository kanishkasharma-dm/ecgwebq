/**
 * ECG Data Model - TypeScript Interfaces
 * Represents the structure of ECG data as stored in S3
 */

export interface ECGData {
  // Device Information
  device_id: string;
  device_serial?: string;
  device_type?: string;
  firmware_version?: string;

  // Patient Information
  patient_id: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female' | 'other';
  patient_dob?: string; // ISO date string

  // Recording Information
  recording_id: string;
  recording_timestamp: string; // ISO 8601 format
  recording_duration?: number; // in seconds
  recording_type?: '12-lead' | 'single-lead' | 'rhythm';

  // ECG Waveform Data
  leads: LeadData[];
  sample_rate?: number; // samples per second
  resolution?: number; // bits per sample

  // Analysis Results (if available)
  analysis?: {
    heart_rate?: number;
    rhythm?: string;
    pr_interval?: number;
    qrs_duration?: number;
    qt_interval?: number;
    qtc_interval?: number;
    axis?: number;
    interpretation?: string;
    abnormalities?: string[];
  };

  // Metadata
  metadata?: {
    technician_id?: string;
    facility_name?: string;
    facility_id?: string;
    notes?: string;
    tags?: string[];
    [key: string]: any;
  };

  // System Fields
  version?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadData {
  lead_name: string; // I, II, III, aVR, aVL, aVF, V1-V6, etc.
  lead_data: number[]; // Array of voltage values (mV)
  units?: string; // typically 'mV'
  gain?: number;
  filter_applied?: boolean;
}

export interface ECGRecord {
  id: string; // Unique record ID (UUID or S3 key-based)
  s3_key: string; // S3 object key/path
  device_id: string;
  patient_id: string;
  patient_name?: string;
  recording_timestamp: string;
  recording_id: string;
  created_at: string;
  size?: number; // File size in bytes
  metadata?: {
    recording_type?: string;
    duration?: number;
    sample_rate?: number;
    [key: string]: any;
  };
}

export interface ECGListResponse {
  records: ECGRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ECGUploadRequest {
  ecg_data: ECGData;
  metadata?: {
    [key: string]: any;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

