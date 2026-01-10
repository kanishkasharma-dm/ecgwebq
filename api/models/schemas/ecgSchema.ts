/**
 * ECG Data Validation Schema using Joi
 * Validates incoming ECG JSON data before storage
 */

import Joi from 'joi';

// Lead Data Schema
const leadDataSchema = Joi.object({
  lead_name: Joi.string().required().pattern(/^[IV\d]+$|^a[VLRF]+$|^[LR]E$/, {
    name: 'lead_name',
  }).messages({
    'string.pattern.base': 'lead_name must be a valid ECG lead name (I, II, III, aVR, aVL, aVF, V1-V6, etc.)',
  }),
  lead_data: Joi.array().items(Joi.number()).min(1).required(),
  units: Joi.string().optional().default('mV'),
  gain: Joi.number().optional(),
  filter_applied: Joi.boolean().optional(),
});

// Analysis Schema (optional)
const analysisSchema = Joi.object({
  heart_rate: Joi.number().optional().min(0).max(300),
  rhythm: Joi.string().optional(),
  pr_interval: Joi.number().optional().min(0),
  qrs_duration: Joi.number().optional().min(0),
  qt_interval: Joi.number().optional().min(0),
  qtc_interval: Joi.number().optional().min(0),
  axis: Joi.number().optional().min(-180).max(180),
  interpretation: Joi.string().optional(),
  abnormalities: Joi.array().items(Joi.string()).optional(),
}).unknown(false);

// Main ECG Data Schema
export const ecgDataSchema = Joi.object({
  // Device Information
  device_id: Joi.string().required().min(1).max(100),
  device_serial: Joi.string().optional().max(200),
  device_type: Joi.string().optional().max(100),
  firmware_version: Joi.string().optional().max(50),

  // Patient Information
  patient_id: Joi.string().required().min(1).max(100),
  patient_name: Joi.string().optional().max(200),
  patient_age: Joi.number().optional().min(0).max(150),
  patient_gender: Joi.string().optional().valid('male', 'female', 'other'),
  patient_dob: Joi.string().optional().isoDate(),

  // Recording Information
  recording_id: Joi.string().required().min(1).max(100),
  recording_timestamp: Joi.string().required().isoDate(),
  recording_duration: Joi.number().optional().min(0),
  recording_type: Joi.string().optional().valid('12-lead', 'single-lead', 'rhythm'),

  // ECG Waveform Data
  leads: Joi.array().items(leadDataSchema).min(1).required(),
  sample_rate: Joi.number().optional().min(0).max(10000),
  resolution: Joi.number().optional().min(8).max(32),

  // Analysis Results (optional)
  analysis: analysisSchema.optional(),

  // Metadata (flexible object)
  metadata: Joi.object().unknown(true).optional(),

  // System Fields
  version: Joi.string().optional(),
  created_at: Joi.string().optional().isoDate(),
  updated_at: Joi.string().optional().isoDate(),
}).unknown(false); // Reject unknown fields for security

// Upload Request Schema (wrapper around ECG data)
export const ecgUploadRequestSchema = Joi.object({
  ecg_data: ecgDataSchema.required(),
  metadata: Joi.object().unknown(true).optional(),
});

// List Query Parameters Schema
export const ecgListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  pageSize: Joi.number().integer().min(1).max(1000).optional().default(50),
  device_id: Joi.string().optional().max(100),
  patient_id: Joi.string().optional().max(100),
  start_date: Joi.string().optional().isoDate(),
  end_date: Joi.string().optional().isoDate(),
  recording_type: Joi.string().optional().valid('12-lead', 'single-lead', 'rhythm'),
}).unknown(false);

/**
 * Validate ECG data
 */
export function validateECGData(data: any): { error?: string; value?: any } {
  const { error, value } = ecgDataSchema.validate(data, {
    abortEarly: false,
    stripUnknown: false, // Keep unknown fields but reject them
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join('; ');
    return { error: errorMessages };
  }

  return { value };
}

/**
 * Validate upload request
 */
export function validateUploadRequest(data: any): { error?: string; value?: any } {
  const { error, value } = ecgUploadRequestSchema.validate(data, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join('; ');
    return { error: errorMessages };
  }

  return { value };
}

/**
 * Validate list query parameters
 */
export function validateListQuery(query: any): { error?: string; value?: any } {
  const { error, value } = ecgListQuerySchema.validate(query, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join('; ');
    return { error: errorMessages };
  }

  return { value };
}

