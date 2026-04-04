import { useEffect, useState } from "react";

type DoctorTheme = "dark" | "light";

const STORAGE_KEY = "ecg_doctor_theme";

function getStoredTheme(): DoctorTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useDoctorTheme() {
  const [theme, setTheme] = useState<DoctorTheme>(() => getStoredTheme());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage failures
    }
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
