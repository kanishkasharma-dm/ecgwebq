export type AuthRole = "admin" | "doctor";

export interface StoredUser {
  userId: string;
  role: string;
  name: string;
  email?: string;
  passwordResetRequired?: boolean;
}

export function isJwtLikeToken(value: string): boolean {
  const segments = value.split(".");
  return segments.length === 3 && segments.every((segment) => segment.trim().length > 0);
}

const STORAGE_KEYS = {
  adminToken: "ecg_admin_token",
  adminUser: "ecg_admin_user",
  doctorToken: "ecg_doctor_token",
  doctorUser: "ecg_doctor_user",
  legacyToken: "token",
  legacyUser: "user",
  legacyRole: "role",
  legacyAdminLoggedIn: "admin_logged_in",
  legacyDoctorName: "ecg_doctor_name",
  legacyDoctorId: "ecg_doctor_id",
} as const;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

function normalizeToken(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim().replace(/^Bearer\s+/i, "").replace(/^"+|"+$/g, "");
  if (!trimmed) {
    return null;
  }

  // Reject common malformed auth values so protected requests never send SigV4/base64 hash material.
  if (
    /^AWS4-HMAC-SHA256/i.test(trimmed) ||
    trimmed.includes("Credential=") ||
    trimmed.includes("SignedHeaders=") ||
    trimmed.includes("Signature=") ||
    trimmed.includes("bhmxMzYtLnfgCSSGnooRG3hFrXYXgdV+XUC4keblQ8Q=") // Specific bad signature from error
  ) {
    console.warn("Rejecting malformed AWS signature token:", trimmed.substring(0, 50) + "...");
    return null;
  }

  if (!isJwtLikeToken(trimmed)) {
    console.warn("Rejecting non-JWT token:", trimmed.substring(0, 50) + "...");
    return null;
  }

  return trimmed;
}

function parseUser(raw: string | null): StoredUser | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function getRoleKeys(role: AuthRole) {
  return role === "admin"
    ? { token: STORAGE_KEYS.adminToken, user: STORAGE_KEYS.adminUser }
    : { token: STORAGE_KEYS.doctorToken, user: STORAGE_KEYS.doctorUser };
}

export function getStoredToken(role: AuthRole): string | null {
  const roleKeys = getRoleKeys(role);
  const roleToken = normalizeToken(safeGet(roleKeys.token));

  // Return the correct role-specific token if available
  if (roleToken) {
    return roleToken;
  }

  // NO LEGACY FALLBACK - return null if correct token not found
  // This prevents using wrong tokens that cause auth errors
  return null;
}

export function getStoredUser(role: AuthRole): StoredUser | null {
  const roleKeys = getRoleKeys(role);
  const roleUser = parseUser(safeGet(roleKeys.user));

  // Return the correct role-specific user if available
  if (roleUser) {
    return roleUser;
  }

  // NO LEGACY FALLBACK - return null if correct user not found
  return null;
}

export function isRoleAuthenticated(role: AuthRole): boolean {
  return Boolean(getStoredToken(role) && getStoredUser(role));
}

export function setAuthSession(role: AuthRole, token: string, user: StoredUser): void {
  const roleKeys = getRoleKeys(role);
  const normalizedToken = normalizeToken(token);

  if (!normalizedToken) {
    throw new Error("Received an invalid authentication token");
  }

  // Save only to correct role-specific keys
  safeSet(roleKeys.token, normalizedToken);
  safeSet(roleKeys.user, JSON.stringify(user));

  // NO LEGACY SAVES - this prevents token confusion
  // Legacy keys are removed to ensure clean auth state
}

export function clearAuthSession(role: AuthRole): void {
  const roleKeys = getRoleKeys(role);

  // Clear only correct role-specific keys
  safeRemove(roleKeys.token);
  safeRemove(roleKeys.user);

  // NO LEGACY CLEARING - legacy keys should be handled separately
  // This prevents cross-contamination between auth sessions
}

export function clearAllAuthSessions(): void {
  clearAuthSession("admin");
  clearAuthSession("doctor");
}

export function clearMalformedTokens(): void {
  const allKeys = Object.values(STORAGE_KEYS);
  
  allKeys.forEach(key => {
    const value = safeGet(key);
    if (value && (
      value.includes("AWS4-HMAC-SHA256") ||
      value.includes("Credential=") ||
      value.includes("SignedHeaders=") ||
      value.includes("Signature=") ||
      value.includes("bhmxMzYtLnfgCSSGnooRG3hFrXYXgdV+XUC4keblQ8Q=")
    )) {
      console.warn("Clearing malformed token from localStorage:", key);
      safeRemove(key);
    }
  });

  // Also clear legacy keys to prevent confusion
  const legacyKeys = [
    STORAGE_KEYS.legacyToken,
    STORAGE_KEYS.legacyUser, 
    STORAGE_KEYS.legacyRole,
    STORAGE_KEYS.legacyAdminLoggedIn,
    STORAGE_KEYS.legacyDoctorName,
    STORAGE_KEYS.legacyDoctorId
  ];
  
  legacyKeys.forEach(key => {
    safeRemove(key);
  });
}

// Add global function for manual clearing in browser console
declare global {
  interface Window {
    clearBadAuthTokens: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.clearBadAuthTokens = clearMalformedTokens;
  console.log("Auth token cleanup loaded. Call window.clearBadAuthTokens() to manually clear malformed tokens.");
}

export function buildAuthHeaders(role: AuthRole, isJson: boolean = true): HeadersInit {
  // Clear any malformed tokens before building headers
  clearMalformedTokens();
  
  const headers: Record<string, string> = {};
  const token = getStoredToken(role);

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}
