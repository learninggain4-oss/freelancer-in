import { useState, useEffect } from "react";

export type DashboardTheme = "black" | "white" | "wb" | "warm" | "forest" | "ocean";
export type DashboardThemeKey = "black" | "white" | "wb";

const STORAGE_KEY = "dashboard_theme";

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

export function useDashboardTheme() {
  const [theme, setThemeState] = useState<DashboardTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "black" || saved === "white" || saved === "wb" || saved === "warm" || saved === "forest" || saved === "ocean") return saved;
    } catch {}
    return "ocean";
  });

  useEffect(() => {
    applyDarkClass(theme);
  }, [theme]);

  const themeKey: DashboardThemeKey = resolveThemeKey(theme);

  const setTheme = (t: DashboardTheme) => {
    setThemeState(t);
    applyDarkClass(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  };

  return { theme, themeKey, setTheme };
}
