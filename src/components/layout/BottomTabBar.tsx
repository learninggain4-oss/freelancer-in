import { Home, Briefcase, Wallet, CircleHelp, Menu, ClipboardCheck, FileText } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";

interface BottomTabBarProps {
  userType: "employee" | "client";
  onMenuClick: () => void;
  theme?: DashboardTheme;
}

const BottomTabBar = ({ userType, onMenuClick, theme = "black" }: BottomTabBarProps) => {
  const location = useLocation();
  const base = userType === "employee" ? "/employee" : "/client";

  // Per-theme colours
  const isDark  = theme === "black" || theme === "wb";
  const barBg   = theme === "black" ? "rgba(7,7,20,.95)" : theme === "wb" ? "rgba(10,10,28,.97)" : "rgba(255,255,255,.97)";
  const barBdr  = isDark ? "rgba(255,255,255,.07)"     : "rgba(0,0,0,.09)";
  const activeC = "#a5b4fc";
  const inactC  = isDark ? "rgba(255,255,255,.32)"     : "#9ca3af";
  const activePill = isDark ? "rgba(99,102,241,.2)"    : "rgba(99,102,241,.1)";
  const labelActive = isDark ? "#a5b4fc"               : "#4f46e5";
  const labelInact  = isDark ? "rgba(255,255,255,.28)" : "#9ca3af";

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
      boxShadow: isDark ? "0 -8px 32px rgba(0,0,0,.4)" : "0 -4px 20px rgba(0,0,0,.08)",
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

        {/* Menu */}
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
