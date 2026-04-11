export function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureProdStage(baseUrl: string): string {
  const normalizedBase = trimTrailingSlashes(baseUrl.trim());

  if (!normalizedBase) {
    return normalizedBase;
  }

  if (normalizedBase.startsWith("/")) {
    return normalizedBase;
  }

  try {
    const parsedUrl = new URL(normalizedBase);
    if (!parsedUrl.pathname || parsedUrl.pathname === "/") {
      parsedUrl.pathname = "/prod";
      return trimTrailingSlashes(parsedUrl.toString());
    }
  } catch {
    // If parsing fails, keep the original base and let fetch surface the issue.
  }

  return normalizedBase;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getAdminApiBase(): string {
  return ensureProdStage(
    import.meta.env.VITE_ADMIN_AUTH_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod"
  );
}

export function getAdminProtectedApiBase(): string {
  // DEV aur PROD dono mein same gateway use karo - no proxy
  return trimTrailingSlashes(
    import.meta.env.VITE_ADMIN_PROTECTED_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com"
  );
}

export function getDoctorApiBase(): string {
  return ensureProdStage(
    import.meta.env.VITE_DOCTOR_API_BASE_URL ||
    "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod"
  );
}

export function getDoctorAuthUrl(path: string): string {
  return joinApiUrl(getDoctorApiBase(), path);
}

export function getAdminAuthUrl(path: string): string {
  return joinApiUrl(getAdminApiBase(), path);
}

export function joinApiUrl(base: string, path: string): string {
  return `${trimTrailingSlashes(base)}${normalizePath(path)}`;
}
