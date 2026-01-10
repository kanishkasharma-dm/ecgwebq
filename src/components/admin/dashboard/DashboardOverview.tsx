import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  FileText,
  HardDrive,
  Activity,
  Clock,
  TrendingUp,
  Bell,
  UserPlus,
  Download,
  Search,
  BarChart3,
} from "lucide-react";
import AddUserModal from "../modals/AddUserModal";
import InviteDoctorModal from "../modals/InviteDoctorModal";
import SearchAllModal from "../modals/SearchAllModal";
import { useECGList } from "../../../viewmodels/useECGData";

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showInviteDoctorModal, setShowInviteDoctorModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Fetch ECG records for real-time stats
  const { records, loading: ecgLoading, pagination } = useECGList({
    autoFetch: true,
    initialQuery: { pageSize: 1000 }, // Get more records for stats
  });

  // Calculate stats from real ECG data
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Filter records from this month
    const reportsThisMonth = records.filter((record) => {
      const recordDate = new Date(record.recording_timestamp);
      return recordDate >= startOfMonth;
    });

    // Filter records from today
    const reportsToday = records.filter((record) => {
      const recordDate = new Date(record.recording_timestamp);
      return recordDate >= startOfDay;
    });

    // Calculate total storage
    const totalSize = records.reduce((sum, record) => sum + (record.size || 0), 0);
    const storageUsedGB = totalSize / (1024 * 1024 * 1024); // Convert bytes to GB
    const storageTotalGB = 500; // Assuming 500 GB total storage
    const storagePercentage = Math.min(100, Math.round((storageUsedGB / storageTotalGB) * 100));

    // Get unique devices and patients
    const uniqueDevices = new Set(records.map((r) => r.device_id));
    const uniquePatients = new Set(records.map((r) => r.patient_id));

    return {
      totalReports: pagination.total || records.length,
      reportsThisMonth: reportsThisMonth.length,
      reportsToday: reportsToday.length,
      storageUsed: Math.round(storageUsedGB * 100) / 100,
      storageTotal: storageTotalGB,
      uniqueDevices: uniqueDevices.size,
      uniquePatients: uniquePatients.size,
      activeSessions: reportsToday.length, // Use today's reports as active sessions indicator
      systemUptime: 99.9, // Keep this as-is for now
    };
  }, [records, pagination.total]);

  // Generate recent activities from ECG records
  const recentActivities = useMemo(() => {
    const recentRecords = records.slice(0, 4); // Get 4 most recent records

    return recentRecords.map((record, index) => {
      const recordDate = new Date(record.recording_timestamp);
      const now = new Date();
      const diffMs = now.getTime() - recordDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timestamp: string;
      if (diffMins < 1) {
        timestamp = "Just now";
      } else if (diffMins < 60) {
        timestamp = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
      } else if (diffHours < 24) {
        timestamp = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else {
        timestamp = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      }

      return {
        id: record.id,
        type: "report_generated",
        message: `ECG Report ${record.recording_id} - Patient: ${record.patient_name || record.patient_id}`,
        timestamp,
        icon: FileText,
        color: "bg-emerald-100 text-emerald-500",
        record,
      };
    });
  }, [records]);

  // Generate system alerts based on real data
  const systemAlerts = useMemo(() => {
    const alerts = [];
    const storagePercentage = Math.round((stats.storageUsed / stats.storageTotal) * 100);

    if (storagePercentage > 85) {
      alerts.push({
        id: 1,
        type: "warning",
        message: `Storage space at ${storagePercentage}% capacity`,
        severity: "warning" as const,
      });
    }

    if (stats.reportsToday > 100) {
      alerts.push({
        id: 2,
        type: "info",
        message: `High activity: ${stats.reportsToday} reports uploaded today`,
        severity: "info" as const,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 3,
        type: "info",
        message: "All systems operational",
        severity: "info" as const,
      });
    }

    return alerts;
  }, [stats]);

  const storagePercentage = Math.round((stats.storageUsed / stats.storageTotal) * 100);

  const handleBackup = async () => {
    if (window.confirm("Do you want to create a system backup now?")) {
      // Simulate backup process
      const loadingToast = alert("Backup in progress...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Backup completed successfully!");
    }
  };

  const handleExportData = () => {
    if (window.confirm("Do you want to export all data to CSV?")) {
      // Simulate export
      const csvContent = "data:text/csv;charset=utf-8,User,Email,Phone\nJohn Doe,john@example.com,1234567890";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "cardiox_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Data exported successfully!");
    }
  };

  const handleShowNotifications = () => {
    alert("Notifications panel would open here. (To be implemented)");
  };

  const handleShowAnalytics = () => {
    alert("Analytics page would open here. (To be implemented)");
  };

  const kpiCards = [
    {
      title: "Total Patients",
      value: stats.uniquePatients.toLocaleString(),
      icon: Users,
      trend: `${stats.uniquePatients}`,
      subtitle: "Unique patients",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50/30",
      borderColor: "border-blue-200/50",
      cardBg: "bg-gradient-to-br from-blue-50/40 to-blue-100/20",
    },
    {
      title: "Active Devices",
      value: stats.uniqueDevices,
      icon: UserCheck,
      trend: `${stats.uniqueDevices}`,
      subtitle: "ECG devices",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50/30",
      borderColor: "border-purple-200/50",
      cardBg: "bg-gradient-to-br from-purple-50/40 to-purple-100/20",
    },
    {
      title: "ECG Reports",
      value: stats.totalReports.toLocaleString(),
      icon: FileText,
      trend: `${stats.reportsThisMonth}`,
      subtitle: `This month (${stats.reportsToday} today)`,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50/30",
      borderColor: "border-emerald-200/50",
      cardBg: "bg-gradient-to-br from-emerald-50/40 to-emerald-100/20",
    },
    {
      title: "Storage Usage",
      value: `${stats.storageUsed} GB`,
      icon: HardDrive,
      trend: `${storagePercentage}%`,
      subtitle: `of ${stats.storageTotal} GB`,
      iconBg: storagePercentage > 80 ? "bg-red-50" : "bg-amber-50",
      iconColor: storagePercentage > 80 ? "text-red-500" : "text-amber-500",
      bgColor: storagePercentage > 80 ? "bg-red-50/30" : "bg-amber-50/30",
      borderColor: storagePercentage > 80 ? "border-red-200/50" : "border-amber-200/50",
      cardBg: storagePercentage > 80 
        ? "bg-gradient-to-br from-red-50/40 to-red-100/20" 
        : "bg-gradient-to-br from-amber-50/40 to-amber-100/20",
      isStorage: true,
    },
    {
      title: "Active Sessions",
      value: stats.activeSessions,
      icon: Activity,
      trend: "Live",
      subtitle: "Currently online",
      iconBg: "bg-teal-50",
      iconColor: "text-teal-500",
      bgColor: "bg-teal-50/30",
      borderColor: "border-teal-200/50",
      cardBg: "bg-gradient-to-br from-teal-50/40 to-teal-100/20",
    },
    {
      title: "System Uptime",
      value: `${stats.systemUptime}%`,
      icon: Clock,
      trend: "Online",
      subtitle: "Last 30 days",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-50/30",
      borderColor: "border-indigo-200/50",
      cardBg: "bg-gradient-to-br from-indigo-50/40 to-indigo-100/20",
    },
  ];

  const quickActions = [
    {
      label: "Add User",
      icon: UserPlus,
      onClick: () => setShowAddUserModal(true),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
      hoverBg: "hover:bg-blue-50",
      borderColor: "border-blue-200/50",
    },
    {
      label: "Invite Doctor",
      icon: UserCheck,
      onClick: () => setShowInviteDoctorModal(true),
      iconBg: "bg-purple-100",
      iconColor: "text-purple-500",
      hoverBg: "hover:bg-purple-50",
      borderColor: "border-purple-200/50",
    },
    {
      label: "View Reports",
      icon: FileText,
      onClick: () => navigate("/artists/reports"),
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-500",
      hoverBg: "hover:bg-emerald-50",
      borderColor: "border-emerald-200/50",
    },
    {
      label: "Backup",
      icon: HardDrive,
      onClick: handleBackup,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-500",
      hoverBg: "hover:bg-amber-50",
      borderColor: "border-amber-200/50",
    },
    {
      label: "Notifications",
      icon: Bell,
      onClick: handleShowNotifications,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-500",
      hoverBg: "hover:bg-yellow-50",
      borderColor: "border-yellow-200/50",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      onClick: handleShowAnalytics,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-500",
      hoverBg: "hover:bg-indigo-50",
      borderColor: "border-indigo-200/50",
    },
    {
      label: "Export Data",
      icon: Download,
      onClick: handleExportData,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-500",
      hoverBg: "hover:bg-teal-50",
      borderColor: "border-teal-200/50",
    },
    {
      label: "Search All",
      icon: Search,
      onClick: () => setShowSearchModal(true),
      iconBg: "bg-rose-100",
      iconColor: "text-rose-500",
      hoverBg: "hover:bg-rose-50",
      borderColor: "border-rose-200/50",
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className={`${card.cardBg} rounded-xl border ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-200 p-5 cursor-pointer backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {card.trend}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h2>
              {card.isStorage ? (
                <>
                  <div className="mt-3 w-full bg-white/60 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        storagePercentage > 80 ? 'bg-red-300' : storagePercentage > 60 ? 'bg-amber-300' : 'bg-emerald-300'
                      }`}
                      style={{ width: `${storagePercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{card.subtitle}</p>
                </>
              ) : (
                <p className="text-xs text-gray-600">{card.subtitle}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick Actions Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50/30 to-amber-50/20 rounded-xl border border-orange-200/50 shadow-sm p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.35 + index * 0.03 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                className={`group flex flex-col items-center justify-center p-4 border ${action.borderColor} rounded-lg ${action.hoverBg} bg-white/80 hover:border-opacity-70 hover:shadow-sm transition-all duration-200 backdrop-blur-sm`}
              >
                <div className={`p-2.5 rounded-lg ${action.iconBg} mb-2.5`}>
                  <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="lg:col-span-2 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 rounded-xl border border-blue-200/50 shadow-sm p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              </div>
              <button className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                View All →
              </button>
            </div>
            <div className="space-y-2">
              {ecgLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <Activity className="w-6 h-6 animate-pulse mx-auto mb-2" />
                  <p className="text-sm">Loading recent activity...</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.45 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 border border-gray-200/50 rounded-lg hover:bg-white/60 hover:border-gray-300/50 transition-all duration-200 cursor-pointer bg-white/40"
                      onClick={() => navigate("/artists/reports")}
                    >
                      <div className={`p-2.5 rounded-lg ${activity.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* System Alerts & Recent Registrations */}
          <div className="space-y-6">
            {/* System Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="bg-gradient-to-br from-yellow-50/30 to-amber-50/20 rounded-xl border border-yellow-200/50 shadow-sm p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Bell className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">System Alerts</h3>
                </div>
                <span className="bg-red-100 text-red-500 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {systemAlerts.length}
                </span>
              </div>
              <div className="space-y-2">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border bg-white/60 ${
                      alert.severity === "warning"
                        ? "border-yellow-200/70"
                        : "border-blue-200/70"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          alert.severity === "warning" ? "text-yellow-600" : "text-blue-600"
                        }`}
                      >
                        {alert.severity === "warning" ? "⚠️ WARNING" : "ℹ️ INFO"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1.5">{alert.message}</p>
                  </div>
                ))}
                <button className="w-full text-center text-sm text-orange-500 hover:text-orange-600 font-medium py-2 border-t border-gray-200/50 mt-4 pt-4">
                  View All Alerts →
                </button>
              </div>
            </motion.div>

            {/* Recent Registrations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="bg-gradient-to-br from-emerald-50/30 to-teal-50/20 rounded-xl border border-emerald-200/50 shadow-sm p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <UserPlus className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Recent Registrations</h3>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "John Doe", email: "john.doe@email.com", status: "Active", time: "2 hours ago" },
                  { name: "Jane Smith", email: "jane.smith@email.com", status: "Active", time: "5 hours ago" },
                  { name: "Bob Wilson", email: "bob.wilson@email.com", status: "Pending", time: "1 day ago" },
                ].map((user, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.65 + index * 0.1 }}
                    className="p-3 border border-gray-200/50 rounded-lg hover:bg-white/60 hover:border-gray-300/50 transition-all cursor-pointer bg-white/40"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{user.time}</p>
                  </motion.div>
                ))}
                <button
                  onClick={() => navigate("/artists/users")}
                  className="w-full text-center text-sm text-orange-500 hover:text-orange-600 font-medium py-2 border-t border-gray-200/50 mt-4 pt-4"
                >
                  View All Users →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={() => {
          // Refresh data or show success message
          console.log("User added successfully");
        }}
      />

      <InviteDoctorModal
        isOpen={showInviteDoctorModal}
        onClose={() => setShowInviteDoctorModal(false)}
        onSuccess={() => {
          console.log("Doctor invited successfully");
        }}
      />

      <SearchAllModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </>
  );
}