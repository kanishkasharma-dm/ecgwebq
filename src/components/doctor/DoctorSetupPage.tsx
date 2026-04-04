import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { setDoctorPassword, validateDoctorInvite, type DoctorInviteInfo } from "@/api/ecgApi";
import { useNotification } from "@/contexts/NotificationContext";
import { clearAuthSession, getStoredToken, getStoredUser } from "@/lib/auth";

type SetupStatus = "checking" | "ready" | "submitting" | "success" | "invalid";

function passwordStrengthLabel(password: string): string {
  if (password.length >= 12) return "Strong";
  if (password.length >= 8) return "Good";
  return "Needs 8+ characters";
}

export default function DoctorSetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const inviteToken = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [status, setStatus] = useState<SetupStatus>("checking");
  const [inviteInfo, setInviteInfo] = useState<DoctorInviteInfo | null>(null);
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function runValidation() {
      const doctorUser = getStoredUser("doctor");
      const doctorToken = getStoredToken("doctor");
      const isForcedPasswordReset =
        Boolean(doctorUser?.passwordResetRequired && doctorToken && inviteToken === doctorToken);

      if (isForcedPasswordReset && doctorUser) {
        setInviteInfo({
          name: doctorUser.name,
          email: doctorUser.email || "",
        });
        setEmail(doctorUser.email || "");
        setStatus("ready");
        setError("");
        return;
      }

      if (!inviteToken) {
        setStatus("invalid");
        setError("This setup link is incomplete. Please use the invitation email again.");
        return;
      }

      setStatus("checking");
      setError("");

      try {
        const info = await validateDoctorInvite(inviteToken);
        if (!isActive) return;
        setInviteInfo(info);
        setEmail(info.email || "");
        setStatus("ready");
      } catch (err) {
        if (!isActive) return;
        setStatus("invalid");
        setError(err instanceof Error ? err.message : "This invitation link is invalid or expired.");
      }
    }

    void runValidation();

    return () => {
      isActive = false;
    };
  }, [inviteToken]);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [navigate, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === "submitting") {
      return;
    }

    if (!inviteToken) {
      setStatus("invalid");
      setError("Missing invitation token. Please reopen your invitation link.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    if (!temporaryPassword.trim()) {
      setError("Please enter your temporary password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setStatus("submitting");
      setError("");
      await setDoctorPassword({
        token: inviteToken,
        email: email.trim(),
        temporaryPassword,
        newPassword,
        confirmPassword,
      });
      clearAuthSession("doctor");
      showNotification("Password set successfully. Redirecting to login...", "success");
      setStatus("success");
    } catch (err) {
      setStatus("ready");
      setError(err instanceof Error ? err.message : "Unable to finish setup. Please request a new invitation.");
    }
  };

  const passwordLabel = passwordStrengthLabel(newPassword);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] px-4 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.2),_transparent_35%),linear-gradient(135deg,_#07111f,_#0f172a_55%,_#111827)]" />
      <div className="absolute left-10 top-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-8 right-8 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            <HeartPulse className="h-4 w-4" />
            Secure doctor onboarding
          </div>
          <div className="space-y-4">
            <h1 className="max-w-xl text-5xl font-semibold leading-tight text-white">
              Activate your CardioX doctor account with one secure step.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Validate your invitation, choose your own password, and start reviewing ECG reports with a clean doctor-only workflow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Mail,
                title: "Token-based invite",
                description: "The setup link is validated directly against the backend and never stored locally.",
              },
              {
                icon: ShieldCheck,
                title: "One-time activation",
                description: "Expired or reused links fail safely with a dedicated error state.",
              },
              {
                icon: Stethoscope,
                title: "Normal login after setup",
                description: "Doctors sign in later with their own password and doctor JWT.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
              >
                <item.icon className="mb-3 h-6 w-6 text-cyan-300" />
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/25 backdrop-blur-2xl"
        >
          {status === "checking" && (
            <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 rounded-[28px] border border-white/10 bg-slate-950/35 p-10 text-center">
              <div className="h-14 w-14 animate-pulse rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Validating invitation</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                  We are checking your setup link and loading your doctor profile securely.
                </p>
              </div>
            </div>
          )}

          {status === "invalid" && (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-rose-400/25 bg-rose-500/10 p-10 text-center">
              <div className="mb-5 rounded-2xl bg-rose-500/15 p-4 text-rose-200">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Invitation unavailable</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-rose-100/90">
                {error || "This invitation link is invalid, expired, or has already been used."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Go to login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-emerald-400/25 bg-emerald-500/10 p-10 text-center">
              <div className="mb-5 rounded-2xl bg-emerald-500/15 p-4 text-emerald-200">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Password created</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-emerald-50/90">
                Your CardioX doctor account is ready. Redirecting you to doctor login now.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Continue to login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {(status === "ready" || status === "submitting") && (
            <div className="space-y-6 rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-orange-200">
                  One-time password setup
                </div>
                <h2 className="text-3xl font-semibold text-white">Complete your doctor account</h2>
                <p className="text-sm leading-6 text-slate-300">
                  Set your own password to finish onboarding. Your invitation token is used only for this page session.
                </p>
              </div>

              {inviteInfo && (
                <div className="grid gap-4 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-cyan-100">
                      <Stethoscope className="h-4 w-4" />
                      Doctor profile
                    </div>
                    <div className="text-xl font-semibold text-white">{inviteInfo.name}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <Mail className="h-4 w-4 text-cyan-200" />
                      {inviteInfo.email || "Email on file"}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-200">
                    {inviteInfo.specialization && <div>Specialization: {inviteInfo.specialization}</div>}
                    {inviteInfo.hospital && <div>Hospital: {inviteInfo.hospital}</div>}
                    {inviteInfo.expiresAt && (
                      <div className="text-cyan-100">
                        Link expires: {new Date(inviteInfo.expiresAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Registered email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-5 text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Temporary password</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showTemporaryPassword ? "text" : "password"}
                      value={temporaryPassword}
                      onChange={(event) => setTemporaryPassword(event.target.value)}
                      placeholder="Enter the temporary password from email"
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-14 text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTemporaryPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                      aria-label={showTemporaryPassword ? "Hide temporary password" : "Show temporary password"}
                    >
                      {showTemporaryPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">New password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Create a strong password"
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-14 text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <KeyRound className="h-3.5 w-3.5" />
                    {passwordLabel}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Confirm password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-14 text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "submitting" ? "Securing account..." : "Set password and continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
