import { useState, useEffect } from "react";

export type DashboardTheme = "black" | "white" | "wb";

const STORAGE_KEY = "dashboard_theme";

// Apply immediately at module load so there's no flash-of-light-mode on startup
;(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Default theme is "black"; apply dark unless user explicitly chose white/wb
    if (!saved || saved === "black") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  } catch {}
})();

/** Apply / remove the Tailwind `dark` class on <html> so that all shadcn
 *  CSS variables (background, foreground, input, border, …) switch correctly. */
function applyDarkClass(t: DashboardTheme) {
  if (t === "black") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useDashboardTheme() {
  const [theme, setThemeState] = useState<DashboardTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "black" || saved === "white" || saved === "wb") return saved;
    } catch {}
    return "black";
  });

  // Apply dark class on initial mount and whenever theme changes
  useEffect(() => {
    applyDarkClass(theme);
  }, [theme]);

  const setTheme = (t: DashboardTheme) => {
    setThemeState(t);
    applyDarkClass(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  };

  return { theme, setTheme };
}
