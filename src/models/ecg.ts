/**
 * Frontend ECG Model - TypeScript Interfaces
 * Matches backend API response contracts
 */

// Device Information
export interface DeviceInfo {
  device_id: string;
  device_serial?: string;
  device_type?: string;
  firmware_version?: string;
}

// Patient Information
export interface PatientInfo {
  patient_id: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female' | 'other';
  patient_dob?: string;
}

// Lead Data
export interface LeadData {
  lead_name: string;
  lead_data: number[];
  units?: string;
  gain?: number;
  filter_applied?: boolean;
}

// Analysis Results
export interface ECGAnalysis {
  heart_rate?: number;
  rhythm?: string;
  pr_interval?: number;
  qrs_duration?: number;
  qt_interval?: number;
  qtc_interval?: number;
  axis?: number;
  interpretation?: string;
  abnormalities?: string[];
}

// Main ECG Data Structure
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
  patient_dob?: string;

  // Recording Information
  recording_id: string;
  recording_timestamp: string;
  recording_duration?: number;
  recording_type?: '12-lead' | 'single-lead' | 'rhythm';

  // ECG Waveform Data
  leads: LeadData[];
  sample_rate?: number;
  resolution?: number;

  // Analysis Results
  analysis?: ECGAnalysis;

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

// ECG Record (Summary for lists)
export interface ECGRecord {
  id: string;
  s3_key: string;
  device_id: string;
  patient_id: string;
  patient_name?: string;
  recording_timestamp: string;
  recording_id: string;
  created_at: string;
  size?: number;
  metadata?: {
    recording_type?: string;
    duration?: number;
    sample_rate?: number;
    [key: string]: any;
  };
}

// List Response
export interface ECGListResponse {
  records: ECGRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Upload Request
export interface ECGUploadRequest {
  ecg_data: ECGData;
  metadata?: {
    [key: string]: any;
  };
}

// API Response Wrapper
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

// Upload Response
export interface ECGUploadResponse {
  s3_key: string;
  recording_id: string;
  message: string;
}

// List Query Parameters
export interface ECGListQuery {
  page?: number;
  pageSize?: number;
  device_id?: string;
  patient_id?: string;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  recording_type?: '12-lead' | 'single-lead' | 'rhythm';
}

