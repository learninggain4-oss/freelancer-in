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
  const base = userType === "employee" ? "/employee" : "/employer";

  const isDark   = theme === "black" || theme === "wb";
  const isWarm   = theme === "warm";
  const isForest = theme === "forest";
  const isOcean  = theme === "ocean";

  const barBg = theme === "black"
    ? "rgba(7,7,20,.95)"
    : theme === "wb"
    ? "rgba(10,10,28,.97)"
    : isWarm
    ? "rgba(254,246,228,.97)"
    : isForest
    ? "rgba(241,250,244,.97)"
    : isOcean
    ? "rgba(240,249,255,.97)"
    : "rgba(255,255,255,.97)";

  const barBdr    = isDark ? "rgba(255,255,255,.07)"      : isWarm ? "rgba(180,83,9,.12)"    : isForest ? "rgba(21,128,61,.12)"   : isOcean ? "rgba(14,165,233,.12)"   : "rgba(0,0,0,.09)";
  const activeC   = isDark ? "#a5b4fc"                    : isWarm ? "#d97706"                : isForest ? "#16a34a"               : isOcean ? "#0284c7"                : "#4f46e5";
  const inactC    = isDark ? "rgba(255,255,255,.32)"      : isWarm ? "rgba(120,113,108,.55)"  : isForest ? "rgba(75,124,93,.55)"   : isOcean ? "rgba(75,131,163,.55)"   : "#9ca3af";
  const activePill = isDark ? "rgba(99,102,241,.2)"       : isWarm ? "rgba(217,119,6,.15)"    : isForest ? "rgba(22,163,74,.15)"   : isOcean ? "rgba(14,165,233,.15)"   : "rgba(99,102,241,.12)";
  const labelActive = isDark ? "#a5b4fc"                  : isWarm ? "#d97706"                : isForest ? "#16a34a"               : isOcean ? "#0284c7"                : "#4f46e5";
  const labelInact  = isDark ? "rgba(255,255,255,.28)"    : isWarm ? "rgba(120,113,108,.5)"   : isForest ? "rgba(75,124,93,.5)"    : isOcean ? "rgba(75,131,163,.5)"    : "#9ca3af";

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
      backdropFilter: "blur(24px)",
      boxShadow: isDark ? "0 -8px 32px rgba(0,0,0,.4)" : isWarm ? "0 -4px 20px rgba(180,83,9,.08)" : isForest ? "0 -4px 20px rgba(21,128,61,.08)" : isOcean ? "0 -4px 20px rgba(14,165,233,.08)" : "0 -4px 20px rgba(0,0,0,.08)",
    }}>
      <div style={{ display: "flex", alignItems: "center", height: 64, maxWidth: 600, margin: "0 auto", padding: "0 4px" }}>
        {tabs.map(tab => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <NavLink key={tab.path} to={tab.path}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 4px", textDecoration: "none", transition: "all .15s" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 28, borderRadius: 8,
                background: isActive ? activePill : "transparent",
                transition: "all .2s",
              }}>
                <tab.icon size={18} style={{ color: isActive ? activeC : inactC, strokeWidth: isActive ? 2.5 : 1.8 }} />
              </div>
              <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, color: isActive ? labelActive : labelInact, lineHeight: 1 }}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}

        <button onClick={onMenuClick}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 4px", background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 28, borderRadius: 8 }}>
            <Menu size={18} style={{ color: inactC, strokeWidth: 1.8 }} />
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 500, color: labelInact, lineHeight: 1 }}>Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomTabBar;
