import { Home, Briefcase, Wallet, CircleHelp, Menu, ClipboardCheck, FileText, MessagesSquare, Crown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const A1 = "#6366f1";

interface BottomTabBarProps {
  userType: "employee" | "client";
  onMenuClick: () => void;
}

const BottomTabBar = ({ userType, onMenuClick }: BottomTabBarProps) => {
  const location = useLocation();
  const base = userType === "employee" ? "/employee" : "/client";

  const tabs = userType === "employee"
    ? [
        { label: "Home",       icon: Home,          path: `${base}/dashboard` },
        { label: "Jobs",       icon: Briefcase,     path: `${base}/projects` },
        { label: "Attend",     icon: ClipboardCheck,path: `${base}/attendance` },
        { label: "Requests",   icon: FileText,      path: `${base}/requests` },
        { label: "Wallet",     icon: Wallet,        path: `${base}/wallet` },
        { label: "Chat",       icon: MessagesSquare,path: `${base}/help-support` },
      ]
    : [
        { label: "Home",       icon: Home,          path: `${base}/dashboard` },
        { label: "Attend",     icon: ClipboardCheck,path: `${base}/attendance` },
        { label: "Jobs",       icon: Briefcase,     path: `${base}/projects` },
        { label: "Wallet",     icon: Wallet,        path: `${base}/wallet` },
        { label: "Help",       icon: CircleHelp,    path: `${base}/help-support` },
      ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      background: "rgba(7,7,20,.95)",
      borderTop: "1px solid rgba(255,255,255,.07)",
      backdropFilter: "blur(24px)",
      boxShadow: "0 -8px 32px rgba(0,0,0,.4)",
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
                background: isActive ? "rgba(99,102,241,.2)" : "transparent",
                transition: "all .2s",
              }}>
                <tab.icon size={18} style={{ color: isActive ? "#a5b4fc" : "rgba(255,255,255,.35)", strokeWidth: isActive ? 2.5 : 1.8 }} />
              </div>
              <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, color: isActive ? "#a5b4fc" : "rgba(255,255,255,.3)", lineHeight: 1 }}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
        {/* Menu button */}
        <button onClick={onMenuClick}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 4px", background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 28, borderRadius: 8, background: "transparent" }}>
            <Menu size={18} style={{ color: "rgba(255,255,255,.35)", strokeWidth: 1.8 }} />
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 500, color: "rgba(255,255,255,.3)", lineHeight: 1 }}>Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomTabBar;
