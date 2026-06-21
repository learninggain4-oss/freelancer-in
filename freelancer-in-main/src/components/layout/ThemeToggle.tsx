import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Circle, Flame, Leaf, Waves } from "lucide-react";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

interface ThemeToggleProps {
  theme: DashboardTheme;
  setTheme: (t: DashboardTheme) => void;
}

const themes: { value: DashboardTheme; labelEn: string; labelSub: string; bg: string }[] = [
  { value: "black",  labelEn: "Dark",         labelSub: "Dark navy background",    bg: "#0d0d24" },
  { value: "white",  labelEn: "Light",        labelSub: "Light blue-grey",         bg: "#f0f4ff" },
  { value: "wb",     labelEn: "Light & Dark", labelSub: "Light content, dark nav", bg: "linear-gradient(135deg,#f0f4ff 50%,#0d0d24 50%)" },
  { value: "warm",   labelEn: "Warm",         labelSub: "Cream & amber tones",     bg: "linear-gradient(135deg,#fef6e4 40%,#f59e0b 100%)" },
  { value: "forest", labelEn: "Forest",       labelSub: "Fresh green tones",       bg: "linear-gradient(135deg,#f1faf4 40%,#16a34a 100%)" },
  { value: "ocean",  labelEn: "Ocean",        labelSub: "Sky blue & calm water",   bg: "linear-gradient(135deg,#f0f9ff 40%,#0284c7 100%)" },
];

const ThemeToggle = ({ theme, setTheme }: ThemeToggleProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = themes.find(t => t.value === theme) || themes[0];
  const isDark   = theme === "black" || theme === "wb";
  const isWarm   = theme === "warm";
  const isForest = theme === "forest";
  const isOcean  = theme === "ocean";

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 100 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change Theme"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", borderRadius: 10,
          background: isDark ? "rgba(255,255,255,.08)" : isWarm ? "rgba(180,83,9,.1)" : isForest ? "rgba(21,128,61,.1)" : isOcean ? "rgba(14,165,233,.1)" : "rgba(0,0,0,.06)",
          border: isDark ? "1px solid rgba(255,255,255,.12)" : isWarm ? "1px solid rgba(180,83,9,.18)" : isForest ? "1px solid rgba(21,128,61,.18)" : isOcean ? "1px solid rgba(14,165,233,.18)" : "1px solid rgba(0,0,0,.1)",
          color: isDark ? "rgba(255,255,255,.7)" : isWarm ? "#b45309" : isForest ? "#15803d" : isOcean ? "#0369a1" : "rgba(0,0,0,.6)",
          cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = ".8")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        <span style={{
          width: 14, height: 14, borderRadius: "50%",
          background: current.bg, border: "1px solid rgba(128,128,128,.3)",
          display: "inline-block", flexShrink: 0,
        }} />
        <span style={{ lineHeight: 1 }}>{current.labelEn}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ opacity: .5 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: isDark ? "rgba(13,13,36,.97)" : isWarm ? "#fffdf7" : isForest ? "#f1faf4" : isOcean ? "#f0f9ff" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,.1)" : isWarm ? "1px solid rgba(180,83,9,.15)" : isForest ? "1px solid rgba(21,128,61,.15)" : isOcean ? "1px solid rgba(14,165,233,.15)" : "1px solid rgba(0,0,0,.1)",
          borderRadius: 14, overflow: "hidden", minWidth: 192,
          boxShadow: "0 16px 40px rgba(0,0,0,.35)", backdropFilter: "blur(20px)",
        }}>
          <div style={{ padding: "10px 14px 8px", borderBottom: isDark ? "1px solid rgba(255,255,255,.06)" : isWarm ? "1px solid rgba(180,83,9,.1)" : isForest ? "1px solid rgba(21,128,61,.1)" : isOcean ? "1px solid rgba(14,165,233,.1)" : "1px solid rgba(0,0,0,.06)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: isDark ? "rgba(255,255,255,.3)" : isWarm ? "rgba(180,83,9,.5)" : isForest ? "rgba(21,128,61,.5)" : isOcean ? "rgba(14,165,233,.5)" : "rgba(0,0,0,.35)", margin: 0 }}>
              Select Theme
            </p>
          </div>

          {themes.map(t => {
            const isActive = t.value === theme;
            const accentColor = t.value === "warm" ? "#d97706" : t.value === "forest" ? "#16a34a" : t.value === "ocean" ? "#0284c7" : "#6366f1";
            return (
              <button
                key={t.value}
                onClick={() => { setTheme(t.value); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", border: "none", cursor: "pointer", textAlign: "left",
                  background: isActive
                    ? (isDark ? "rgba(99,102,241,.15)" : isWarm ? "rgba(217,119,6,.1)" : isForest ? "rgba(22,163,74,.1)" : isOcean ? "rgba(14,165,233,.1)" : "rgba(99,102,241,.08)")
                    : "transparent",
                  transition: "background .15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? "rgba(255,255,255,.05)" : isWarm ? "rgba(180,83,9,.06)" : isForest ? "rgba(21,128,61,.06)" : isOcean ? "rgba(14,165,233,.06)" : "rgba(0,0,0,.04)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  background: t.bg,
                  border: isActive ? `2px solid ${accentColor}` : "1.5px solid rgba(128,128,128,.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isActive ? `0 0 8px ${accentColor}80` : "none",
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? "rgba(255,255,255,.85)" : isWarm ? "#1c1a17" : isForest ? "#0f2d18" : isOcean ? "#0c4a6e" : "rgba(0,0,0,.8)", lineHeight: 1.2, margin: 0 }}>{t.labelEn}</p>
                  <p style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,.3)" : isWarm ? "rgba(120,113,108,.7)" : isForest ? "rgba(75,124,93,.7)" : isOcean ? "rgba(75,131,163,.7)" : "rgba(0,0,0,.4)", marginTop: 1, marginBottom: 0 }}>{t.labelSub}</p>
                </div>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="7" fill={accentColor} fillOpacity=".2" />
                    <path d="M4 7L6.2 9.2L10 5" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
