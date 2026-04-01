import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Circle } from "lucide-react";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

interface ThemeToggleProps {
  theme: DashboardTheme;
  setTheme: (t: DashboardTheme) => void;
}

const themes: { value: DashboardTheme; labelEn: string; labelMl: string; icon: React.ReactNode; bg: string; fg: string }[] = [
  { value: "black", labelEn: "Black", labelMl: "കറുത്ത", icon: <Moon size={13} />, bg: "#0d0d24", fg: "white" },
  { value: "white", labelEn: "White", labelMl: "വെളുത്ത", icon: <Sun size={13} />, bg: "#ffffff", fg: "#0d0d24" },
  { value: "wb",    labelEn: "White & Black", labelMl: "വ & ക", icon: <Circle size={13} />, bg: "linear-gradient(135deg,#ffffff 50%,#0d0d24 50%)", fg: "#6366f1" },
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

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 100 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Change Theme"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", borderRadius: 10,
          background: theme === "black" ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)",
          border: theme === "black" ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(0,0,0,.1)",
          color: theme === "black" ? "rgba(255,255,255,.7)" : "rgba(0,0,0,.6)",
          cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = ".8")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        {/* Color swatch */}
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

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: theme === "black" ? "rgba(13,13,36,.97)" : "#ffffff",
          border: theme === "black" ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(0,0,0,.1)",
          borderRadius: 14, overflow: "hidden", minWidth: 180,
          boxShadow: "0 16px 40px rgba(0,0,0,.35)", backdropFilter: "blur(20px)",
        }}>
          {/* Header */}
          <div style={{ padding: "10px 14px 8px", borderBottom: theme === "black" ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(0,0,0,.06)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: theme === "black" ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.35)" }}>
              തീം തിരഞ്ഞെടുക്കുക
            </p>
          </div>

          {themes.map(t => {
            const isActive = t.value === theme;
            return (
              <button
                key={t.value}
                onClick={() => { setTheme(t.value); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", border: "none", cursor: "pointer", textAlign: "left",
                  background: isActive
                    ? (theme === "black" ? "rgba(99,102,241,.15)" : "rgba(99,102,241,.08)")
                    : "transparent",
                  transition: "background .15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = theme === "black" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Swatch */}
                <span style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  background: t.bg,
                  border: isActive ? "2px solid #6366f1" : "1.5px solid rgba(128,128,128,.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isActive ? "0 0 8px rgba(99,102,241,.5)" : "none",
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: theme === "black" ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.8)", lineHeight: 1.2 }}>{t.labelEn}</p>
                  <p style={{ fontSize: 10, color: theme === "black" ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.4)", marginTop: 1 }}>{t.labelMl}</p>
                </div>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="7" fill="#6366f1" fillOpacity=".2" />
                    <path d="M4 7L6.2 9.2L10 5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
