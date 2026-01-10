/**
 * ECG Data ViewModel Hook
 * Manages state and data fetching for ECG records
 */

import { useState, useEffect, useCallback } from 'react';
import type { ECGData, ECGRecord, ECGListQuery, ECGListResponse } from '../models/ecg';
import * as ecgApi from '../services/ecgApi';

interface UseECGListOptions {
  autoFetch?: boolean;
  initialQuery?: ECGListQuery;
}

interface UseECGListReturn {
  records: ECGRecord[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  fetchRecords: (query?: ECGListQuery) => Promise<void>;
  refresh: () => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  updateQuery: (newQuery: Partial<ECGListQuery>) => void;
}

/**
 * Hook for fetching and managing ECG records list
 */
export function useECGList(options: UseECGListOptions = {}): UseECGListReturn {
  const { autoFetch = true, initialQuery = {} } = options;

  const [records, setRecords] = useState<ECGRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: initialQuery.page || 1,
    pageSize: initialQuery.pageSize || 50,
    total: 0,
    hasMore: false,
  });
  const [currentQuery, setCurrentQuery] = useState<ECGListQuery>(initialQuery);

  const fetchRecords = useCallback(async (query?: ECGListQuery) => {
    setLoading(true);
    setError(null);

    try {
      const queryToUse = query || currentQuery;
      const response: ECGListResponse = await ecgApi.listECGRecords(queryToUse);

      setRecords(response.records);
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        total: response.total,
        hasMore: response.hasMore,
      });
      setCurrentQuery(queryToUse);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ECG records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [currentQuery]);

  const refresh = useCallback(() => {
    return fetchRecords(currentQuery);
  }, [fetchRecords, currentQuery]);

  const nextPage = useCallback(() => {
    if (pagination.hasMore) {
      const nextQuery = { ...currentQuery, page: pagination.page + 1 };
      return fetchRecords(nextQuery);
    }
    return Promise.resolve();
  }, [pagination, currentQuery, fetchRecords]);

  const previousPage = useCallback(() => {
    if (pagination.page > 1) {
      const prevQuery = { ...currentQuery, page: pagination.page - 1 };
      return fetchRecords(prevQuery);
    }
    return Promise.resolve();
  }, [pagination, currentQuery, fetchRecords]);

  const updateQuery = useCallback((newQuery: Partial<ECGListQuery>) => {
    const updatedQuery = { ...currentQuery, ...newQuery, page: 1 }; // Reset to page 1 on filter change
    setCurrentQuery(updatedQuery);
    fetchRecords(updatedQuery);
  }, [currentQuery, fetchRecords]);

  useEffect(() => {
    if (autoFetch) {
      fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return {
    records,
    loading,
    error,
    pagination,
    fetchRecords,
    refresh,
    nextPage,
    previousPage,
    updateQuery,
  };
}

interface UseECGRecordOptions {
  id: string | null;
  autoFetch?: boolean;
}

interface UseECGRecordReturn {
  data: ECGData | null;
  loading: boolean;
  error: string | null;
  fetchRecord: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching a single ECG record
 */
export function useECGRecord(options: UseECGRecordOptions): UseECGRecordReturn {
  const { id, autoFetch = true } = options;

  const [data, setData] = useState<ECGData | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch && !!id);
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!id) {
      setError('No record ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse ID to S3 key format
      const s3Key = ecgApi.parseECGId(id);
      const record = await ecgApi.getECGRecord(s3Key);
      setData(record);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ECG record');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refresh = useCallback(() => {
    return fetchRecord();
  }, [fetchRecord]);

  useEffect(() => {
    if (autoFetch && id) {
      fetchRecord();
    }
  }, [autoFetch, id, fetchRecord]);

  return {
    data,
    loading,
    error,
    fetchRecord,
    refresh,
  };
}

interface UseECGSummaryOptions {
  id: string | null;
  autoFetch?: boolean;
}

interface UseECGSummaryReturn {
  summary: Partial<ECGData> | null;
  loading: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching ECG summary (without waveform data)
 */
export function useECGSummary(options: UseECGSummaryOptions): UseECGSummaryReturn {
  const { id, autoFetch = true } = options;

  const [summary, setSummary] = useState<Partial<ECGData> | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch && !!id);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!id) {
      setError('No record ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const s3Key = ecgApi.parseECGId(id);
      const data = await ecgApi.getECGSummary(s3Key);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ECG summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refresh = useCallback(() => {
    return fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (autoFetch && id) {
      fetchSummary();
    }
  }, [autoFetch, id, fetchSummary]);

  return {
    summary,
    loading,
    error,
    fetchSummary,
    refresh,
  };
}

/**
 * Hook for uploading ECG data
 */
export function useECGUpload() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (ecgData: ECGData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ecgApi.uploadECGData({ ecg_data: ecgData });
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to upload ECG data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    upload,
    loading,
    error,
  };
}

