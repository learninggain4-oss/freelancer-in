import { Home, Briefcase, Wallet, CircleHelp, Menu, ClipboardCheck, FileText } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";

interface BottomTabBarProps {
  userType: "employee" | "employer";
  onMenuClick: () => void;
  theme?: DashboardTheme;
}

const BottomTabBar = ({ userType, onMenuClick, theme = "black" }: BottomTabBarProps) => {
  const location = useLocation();
  const base = userType === "employer"
    ? "/employer"
    : location.pathname.startsWith("/freelancer") ? "/freelancer" : "/employee";

  const isDark   = theme === "black" || theme === "wb";
  const isWarm   = theme === "warm";
  const isForest = theme === "forest";
  const isOcean  = theme === "ocean";

  const barBg = theme === "black"
    ? "rgba(7,7,20,.97)"
    : theme === "wb"
    ? "rgba(10,10,28,.97)"
    : isWarm
    ? "rgba(254,246,228,.98)"
    : isForest
    ? "rgba(241,250,244,.98)"
    : isOcean
    ? "rgba(240,249,255,.98)"
    : "rgba(255,255,255,.98)";

  const barBdr    = isDark ? "rgba(255,255,255,.07)"      : isWarm ? "rgba(180,83,9,.12)"    : isForest ? "rgba(21,128,61,.12)"   : isOcean ? "rgba(14,165,233,.12)"   : "rgba(0,0,0,.09)";
  const activeC   = isDark ? "#a5b4fc"                    : isWarm ? "#d97706"                : isForest ? "#16a34a"               : isOcean ? "#0284c7"                : "#4f46e5";
  const inactC    = isDark ? "rgba(255,255,255,.28)"      : isWarm ? "rgba(120,113,108,.45)"  : isForest ? "rgba(75,124,93,.45)"   : isOcean ? "rgba(75,131,163,.45)"   : "#b0b8c8";
  const activePill = isDark ? "rgba(99,102,241,.22)"      : isWarm ? "rgba(217,119,6,.14)"    : isForest ? "rgba(22,163,74,.14)"   : isOcean ? "rgba(2,132,199,.14)"    : "rgba(99,102,241,.12)";
  const activeGlow = isDark ? "rgba(99,102,241,.5)"       : isWarm ? "rgba(217,119,6,.4)"     : isForest ? "rgba(22,163,74,.4)"    : isOcean ? "rgba(2,132,199,.4)"     : "rgba(99,102,241,.4)";
  const labelActive = isDark ? "#a5b4fc"                  : isWarm ? "#d97706"                : isForest ? "#16a34a"               : isOcean ? "#0284c7"                : "#4f46e5";
  const labelInact  = isDark ? "rgba(255,255,255,.25)"    : isWarm ? "rgba(120,113,108,.45)"  : isForest ? "rgba(75,124,93,.45)"   : isOcean ? "rgba(75,131,163,.45)"   : "#b0b8c8";

  const tabs = userType === "employee"
    ? [
        { label: "Home",     icon: Home,          path: `${base}/dashboard` },
        { label: "Jobs",     icon: Briefcase,     path: `${base}/projects` },
        { label: "Attend",   icon: ClipboardCheck,path: `${base}/attendance` },
        { label: "Requests", icon: FileText,      path: `${base}/requests` },
        { label: "Wallet",   icon: Wallet,        path: `${base}/wallet` },
        { label: "Help",     icon: CircleHelp,    path: `${base}/help-support` },
      ]
    : [
        { label: "Home",   icon: Home,          path: `${base}/dashboard` },
        { label: "Attend", icon: ClipboardCheck,path: `${base}/attendance` },
        { label: "Jobs",   icon: Briefcase,     path: `${base}/projects` },
        { label: "Wallet", icon: Wallet,        path: `${base}/wallet` },
        { label: "Help",   icon: CircleHelp,    path: `${base}/help-support` },
      ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      background: barBg,
      borderTop: `1px solid ${barBdr}`,
      backdropFilter: "blur(28px)",
      WebkitBackdropFilter: "blur(28px)",
      boxShadow: isDark
        ? "0 -8px 32px rgba(0,0,0,.5)"
        : isOcean
        ? "0 -4px 24px rgba(14,165,233,.1)"
        : isWarm
        ? "0 -4px 24px rgba(180,83,9,.08)"
        : isForest
        ? "0 -4px 24px rgba(21,128,61,.08)"
        : "0 -4px 24px rgba(0,0,0,.08)",
    } as React.CSSProperties}>
      <div style={{ display: "flex", alignItems: "stretch", height: 64, maxWidth: 600, margin: "0 auto", padding: "0 2px" }}>
        {tabs.map(tab => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <NavLink key={tab.path} to={tab.path}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 2px", textDecoration: "none", position: "relative", transition: "all .2s" }}>

              {/* Active glow line at top */}
              {isActive && (
                <div style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: 28, height: 3, borderRadius: "0 0 4px 4px",
                  background: `linear-gradient(90deg, ${A1}, ${activeC})`,
                  boxShadow: `0 2px 10px ${activeGlow}`,
                }} />
              )}

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 38, height: 30, borderRadius: 10,
                background: isActive ? activePill : "transparent",
                transition: "all .2s",
                boxShadow: isActive ? `0 0 12px ${activeGlow}` : "none",
              }}>
                <tab.icon
                  size={isActive ? 19 : 18}
                  style={{
                    color: isActive ? activeC : inactC,
                    strokeWidth: isActive ? 2.4 : 1.7,
                    transition: "all .2s",
                    filter: isActive ? `drop-shadow(0 0 4px ${activeGlow})` : "none",
                  }}
                />
              </div>
              <span style={{
                fontSize: 9.5,
                fontWeight: isActive ? 800 : 500,
                color: isActive ? labelActive : labelInact,
                lineHeight: 1,
                transition: "all .2s",
                letterSpacing: isActive ? 0.1 : 0,
              }}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}

        <button onClick={onMenuClick}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 2px", background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 30, borderRadius: 10 }}>
            <Menu size={18} style={{ color: inactC, strokeWidth: 1.7 }} />
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 500, color: labelInact, lineHeight: 1 }}>Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomTabBar;
