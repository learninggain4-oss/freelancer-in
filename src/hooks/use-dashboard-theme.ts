import { useState, useEffect } from "react";

export type DashboardTheme = "black" | "white" | "wb";

const STORAGE_KEY = "dashboard_theme";

export function useDashboardTheme() {
  const [theme, setThemeState] = useState<DashboardTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "black" || saved === "white" || saved === "wb") return saved;
    } catch {}
    return "black";
  });

  const setTheme = (t: DashboardTheme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  };

  return { theme, setTheme };
}
