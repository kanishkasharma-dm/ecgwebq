import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Eye, Filter, Calendar } from "lucide-react";
import SearchBar from "../common/SearchBar";
import SummaryCard from "../common/SummaryCard";
import { useECGList } from "../../../viewmodels/useECGData";
import type { ECGRecord } from "../../../models/ecg";
import { formatECGId } from "../../../services/ecgApi";

export default function ReportsPage() {
  const navigate = useNavigate();
  const {
    records,
    loading,
    error,
    pagination,
    refresh,
    nextPage,
    previousPage,
    updateQuery,
  } = useECGList({ autoFetch: true, initialQuery: { pageSize: 50 } });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({});

  // Extract unique devices for filter
  const uniqueDevices = Array.from(new Set(records.map((r) => r.device_id)));

  // Filter records locally based on search term
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.recording_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice = !selectedDevice || record.device_id === selectedDevice;

    return matchesSearch && matchesDevice;
  });

  // Calculate total size
  const totalSize = records.reduce((sum, record) => sum + (record.size || 0), 0);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (record: ECGRecord) => {
    // Navigate to detail page
    const id = formatECGId(record.s3_key);
    // URL encode the ID to handle special characters
    const encodedId = encodeURIComponent(id);
    navigate(`/artists/reports/${encodedId}`);
  };

  const handleApplyDateFilter = () => {
    updateQuery({
      start_date: dateFilter.start,
      end_date: dateFilter.end,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedDevice("");
    setDateFilter({});
    updateQuery({
      device_id: undefined,
      start_date: undefined,
      end_date: undefined,
    });
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Search bar + Actions */}
      <div className="col-span-12 flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <SearchBar
            placeholder="Search by patient name, ID, or recording ID..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refresh}
          disabled={loading}  
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </motion.button>
      </div>

      {/* Filters */}
      <div className="col-span-12 bg-white rounded-xl border p-4 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={selectedDevice}
            onChange={(e) => {
              setSelectedDevice(e.target.value);
              updateQuery({ device_id: e.target.value || undefined });
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Devices</option>
            {uniqueDevices.map((device) => (
              <option key={device} value={device}>
                {device}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateFilter.start || ""}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateFilter.end || ""}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="End Date"
            />
            <button
              onClick={handleApplyDateFilter}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm"
            >
              Apply
            </button>
          </div>

          {(selectedDevice || dateFilter.start || dateFilter.end || searchTerm) && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="col-span-6">
        <SummaryCard
          title="Total Reports"
          value={pagination.total || filteredRecords.length}
          color="green"
        />
      </div>

      <div className="col-span-6">
        <SummaryCard
          title="Total Size"
          value={formatSize(totalSize)}
          color="red"
        />
      </div>

      {/* Reports table */}
      <div className="col-span-12 bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-4" />
            <p className="text-gray-500">Loading ECG reports...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">
            <p className="mb-4">Error loading reports: {error}</p>
            <button
              onClick={refresh}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p className="mb-2">No ECG reports found</p>
            {searchTerm || selectedDevice ? (
              <button
                onClick={handleClearFilters}
                className="text-orange-500 hover:underline"
              >
                Clear filters to see all reports
              </button>
            ) : (
              <p className="text-sm">Upload ECG data to see reports here</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                  <tr>
                    <th className="p-3 text-left">Patient</th>
                    <th className="p-3 text-left">Device ID</th>
                    <th className="p-3 text-left">Recording ID</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Size</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record, idx) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 border-b border-gray-100"
                    >
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {record.patient_name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">{record.patient_id}</div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-700">{record.device_id}</td>
                      <td className="p-3 text-gray-700 font-mono text-xs">
                        {record.recording_id}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {record.metadata?.recording_type || "N/A"}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{formatDate(record.recording_timestamp)}</td>
                      <td className="p-3 text-gray-600">{formatSize(record.size || 0)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewDetails(record)}
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredRecords.length} of {pagination.total} reports
              </div>
              <div className="flex gap-2">
                <button
                  onClick={previousPage}
                  disabled={pagination.page === 1 || loading}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {pagination.page}
                </span>
                <button
                  onClick={nextPage}
                  disabled={!pagination.hasMore || loading}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
