import { useState, useEffect } from "react";

export type DashboardTheme = "black" | "white" | "wb" | "warm" | "forest" | "ocean";
export type DashboardThemeKey = "black" | "white" | "wb";

const STORAGE_KEY = "dashboard_theme";
const ADMIN_STORAGE_KEY = "admin_dashboard_theme";

;(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "black") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  } catch {}
})();

function applyDarkClass(t: DashboardTheme) {
  if (t === "black") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function resolveThemeKey(t: DashboardTheme): DashboardThemeKey {
  if (t === "warm" || t === "forest" || t === "ocean") return "white";
  return t;
}

const VALID = new Set<DashboardTheme>(["black", "white", "wb", "warm", "forest", "ocean"]);

function readTheme(key: string, fallback: DashboardTheme): DashboardTheme {
  try {
    const saved = localStorage.getItem(key) as DashboardTheme | null;
    if (saved && VALID.has(saved)) return saved;
  } catch {}
  return fallback;
}

interface ThemeOptions {
  storageKey?: string;
  defaultTheme?: DashboardTheme;
}

export function useDashboardTheme(opts?: ThemeOptions) {
  const key = opts?.storageKey ?? STORAGE_KEY;
  const fallback = opts?.defaultTheme ?? "ocean";

  const [theme, setThemeState] = useState<DashboardTheme>(() => readTheme(key, fallback));

  useEffect(() => {
    applyDarkClass(theme);
  }, [theme]);

  const themeKey: DashboardThemeKey = resolveThemeKey(theme);

  const setTheme = (t: DashboardTheme) => {
    setThemeState(t);
    applyDarkClass(t);
    try { localStorage.setItem(key, t); } catch {}
  };

  return { theme, themeKey, setTheme };
}

export function useAdminTheme() {
  return {
    theme: "ocean" as DashboardTheme,
    themeKey: "white" as DashboardThemeKey,
    setTheme: (_: DashboardTheme) => {},
  };
}
