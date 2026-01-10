/**
 * ECG Record Detail View Component
 * Displays full details of a single ECG record
 */

import { motion } from "framer-motion";
import { ArrowLeft, Download, Calendar, User, Activity, Heart, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useECGRecord } from "../../../viewmodels/useECGData";
import { formatECGId } from "../../../services/ecgApi";

export default function ECGRecordDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  // ID might be URL-encoded, try to decode first, then format if needed
  let formattedId: string | null = null;
  if (id) {
    try {
      const decoded = decodeURIComponent(id);
      // If it contains slashes, it's likely an S3 key, use as-is
      // Otherwise, try to format it
      formattedId = decoded.includes('/') ? decoded : formatECGId(decoded);
    } catch {
      // If decoding fails, try formatECGId on the original
      formattedId = formatECGId(id);
    }
  }

  const { data, loading, error, refresh } = useECGRecord({
    id: formattedId,
    autoFetch: true,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-12 h-12 animate-spin mx-auto text-orange-500 mb-4" />
        <p className="text-gray-500">Loading ECG record details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4">Error loading ECG record: {error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/artists/reports")}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Back to Reports
            </button>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/artists/reports")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Reports
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `ecg-${data.recording_id}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          <Download className="w-4 h-4" />
          Download JSON
        </motion.button>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border shadow-sm p-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ECG Record Details</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Information */}
          <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Patient ID:</span>
                <span className="ml-2 font-medium text-gray-900">{data.patient_id}</span>
              </div>
              {data.patient_name && (
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium text-gray-900">{data.patient_name}</span>
                </div>
              )}
              {data.patient_age && (
                <div>
                  <span className="text-gray-600">Age:</span>
                  <span className="ml-2 font-medium text-gray-900">{data.patient_age}</span>
                </div>
              )}
              {data.patient_gender && (
                <div>
                  <span className="text-gray-600">Gender:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">{data.patient_gender}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recording Information */}
          <div className="bg-emerald-50/30 rounded-lg p-4 border border-emerald-200/50">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recording Information</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Recording ID:</span>
                <span className="ml-2 font-medium text-gray-900 font-mono">{data.recording_id}</span>
              </div>
              <div>
                <span className="text-gray-600">Device ID:</span>
                <span className="ml-2 font-medium text-gray-900">{data.device_id}</span>
              </div>
              {data.recording_type && (
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">{data.recording_type}</span>
                </div>
              )}
              {data.recording_duration && (
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-medium text-gray-900">{data.recording_duration}s</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Timestamp:</span>
                <div className="ml-2 font-medium text-gray-900">{formatDate(data.recording_timestamp)}</div>
              </div>
            </div>
          </div>

          {/* Device Information */}
          {data.device_serial && (
            <div className="bg-purple-50/30 rounded-lg p-4 border border-purple-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">Device Information</h2>
              </div>
              <div className="space-y-2 text-sm">
                {data.device_serial && (
                  <div>
                    <span className="text-gray-600">Serial:</span>
                    <span className="ml-2 font-medium text-gray-900">{data.device_serial}</span>
                  </div>
                )}
                {data.device_type && (
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium text-gray-900">{data.device_type}</span>
                  </div>
                )}
                {data.firmware_version && (
                  <div>
                    <span className="text-gray-600">Firmware:</span>
                    <span className="ml-2 font-medium text-gray-900">{data.firmware_version}</span>
                  </div>
                )}
                {data.sample_rate && (
                  <div>
                    <span className="text-gray-600">Sample Rate:</span>
                    <span className="ml-2 font-medium text-gray-900">{data.sample_rate} Hz</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {data.analysis && (
            <div className="bg-red-50/30 rounded-lg p-4 border border-red-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
              </div>
              <div className="space-y-2 text-sm">
                {data.analysis.heart_rate !== undefined && (
                  <div>
                    <span className="text-gray-600">Heart Rate:</span>
                    <span className="ml-2 font-medium text-gray-900">{data.analysis.heart_rate} bpm</span>
                  </div>
                )}
                {data.analysis.rhythm && (
                  <div>
                    <span className="text-gray-600">Rhythm:</span>
                    <span className="ml-2 font-medium text-gray-900">{data.analysis.rhythm}</span>
                  </div>
                )}
                {data.analysis.interpretation && (
                  <div>
                    <span className="text-gray-600">Interpretation:</span>
                    <div className="ml-2 font-medium text-gray-900 mt-1">{data.analysis.interpretation}</div>
                  </div>
                )}
                {data.analysis.abnormalities && data.analysis.abnormalities.length > 0 && (
                  <div>
                    <span className="text-gray-600">Abnormalities:</span>
                    <ul className="ml-2 mt-1 list-disc list-inside">
                      {data.analysis.abnormalities.map((abnormality, idx) => (
                        <li key={idx} className="font-medium text-gray-900">
                          {abnormality}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Leads Information */}
        {data.leads && data.leads.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ECG Leads ({data.leads.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.leads.map((lead, index) => (
                <div key={index} className="bg-white rounded p-3 border border-gray-200">
                  <div className="font-medium text-gray-900">{lead.lead_name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {lead.lead_data.length} samples
                    {lead.units && ` • ${lead.units}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Metadata</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(data.metadata).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, " ")}:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

