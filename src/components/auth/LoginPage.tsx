import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Stethoscope, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";

type Role = "admin" | "doctor";

interface LoginPageProps {
  mode?: Role;
}

export default function LoginPage({ mode = "doctor" }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const { login, isLoading } = useAuth();
  const [submittingRole, setSubmittingRole] = useState<Role | null>(null);

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (role: Role, username: string, password: string) => {
    if (isLoading) {
      return;
    }

    if (!username || !password) {
      showNotification("Please enter username and password", "warning");
      return;
    }

    setSubmittingRole(role);
    const success = await login(username, password, role);
    
    if (success) {
      const roleLabel = role === "doctor" ? "Healthcare Professional" : "Admin";
      showNotification(`Successfully logged in as ${roleLabel}`, "success");

      const defaultTarget = role === "admin" ? "/artists" : "/doctor";
      const requestedTarget = location.state?.from?.pathname;
      const target = typeof requestedTarget === "string" ? requestedTarget : defaultTarget;
      navigate(target, { replace: true });
    } else {
      showNotification("Invalid credentials. Access denied.", "error");
    }

    setSubmittingRole(null);
  };

  const role: Role = mode;
  const roleTitle = role === "admin" ? "Admin" : "Healthcare Professional";
  const RoleIcon = role === "admin" ? Shield : Stethoscope;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-orange via-brand-electric to-brand-focus bg-clip-text text-transparent mb-3">
            Welcome to CardioX
          </h1>
          <p className="text-gray-600 text-lg">Login to continue</p>
        </motion.div>

        {/* Login card */}
        <div className="mb-8 mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-orange-200 hover:shadow-2xl transition-all duration-300"
          >
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-orange via-brand-electric to-brand-focus shadow-lg">
                <RoleIcon className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-5">
              {roleTitle}
            </h2>

            {/* Input Fields */}
            <div className="space-y-4">
              {/* Username Input */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username / Email"
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      username: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const passwordInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input') as HTMLInputElement;
                      passwordInput?.focus();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      password: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin(
                        role,
                        credentials.username,
                        credentials.password
                      );
                    }
                  }}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                handleLogin(
                  role,
                  credentials.username,
                  credentials.password
                )
              }
              className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-orange via-brand-electric to-brand-focus text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading && submittingRole === role}
            >
              {isLoading && submittingRole === role ? "Signing In..." : `Login as ${roleTitle}`}
            </motion.button>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
