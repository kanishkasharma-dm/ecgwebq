import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureProdStage(baseUrl?: string): string {
  const normalizedBase = trimTrailingSlashes((baseUrl || "").trim());

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
    // Keep the original value and let Vite surface invalid targets.
  }

  return normalizedBase;
}

function splitProxyTarget(baseUrl?: string): { target: string; basePath: string } {
  const normalizedBase = ensureProdStage(baseUrl);

  if (!normalizedBase) {
    return { target: "", basePath: "" };
  }

  if (normalizedBase.startsWith("/")) {
    return {
      target: normalizedBase,
      basePath: "",
    };
  }

  try {
    const parsedUrl = new URL(normalizedBase);
    const basePath = parsedUrl.pathname && parsedUrl.pathname !== "/" ? trimTrailingSlashes(parsedUrl.pathname) : "";
    parsedUrl.pathname = "";
    parsedUrl.search = "";
    parsedUrl.hash = "";

    return {
      target: trimTrailingSlashes(parsedUrl.toString()),
      basePath,
    };
  } catch {
    return {
      target: normalizedBase,
      basePath: "",
    };
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const adminAuthProxy = splitProxyTarget(env.VITE_ADMIN_AUTH_BASE_URL || env.VITE_API_BASE_URL);
  const adminProtectedProxy = splitProxyTarget(
    trimTrailingSlashes(env.VITE_ADMIN_PROTECTED_API_BASE_URL || env.VITE_API_BASE_URL || "")
  );
  const doctorAuthProxy = splitProxyTarget(env.VITE_DOCTOR_API_BASE_URL);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./public/assets"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@sections": path.resolve(__dirname, "./src/sections"),
        "@styles": path.resolve(__dirname, "./src/styles"),
        "@lib": path.resolve(__dirname, "./src/lib")
      }
    },
    optimizeDeps: {
      exclude: ['jsonwebtoken']
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        "/__admin_auth": {
          target: adminAuthProxy.target,
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) =>
            `${adminAuthProxy.basePath}${requestPath.replace(/^\/__admin_auth/, "")}`,
        },
        "/__admin_api": {
          target: adminProtectedProxy.target,
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) =>
            `${adminProtectedProxy.basePath}${requestPath.replace(/^\/__admin_api/, "")}`,
        },
        "/__doctor_api": {
          target: doctorAuthProxy.target,
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) =>
            `${doctorAuthProxy.basePath}${requestPath.replace(/^\/__doctor_api/, "")}`,
        },
      }
    }
  };
});

