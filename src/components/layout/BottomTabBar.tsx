import { useState } from "react";
import { Home, Briefcase, Wallet, CircleHelp, Menu, QrCode, ScanLine, ClipboardCheck, UserCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

interface BottomTabBarProps {
  userType: "employee" | "employer";
  onMenuClick: () => void;
  theme?: DashboardTheme;
}

const BottomTabBar = ({ userType, onMenuClick, theme = "black" }: BottomTabBarProps) => {
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const location = useLocation();
  const base =
    userType === "employer" ? "/employer" : location.pathname.startsWith("/freelancer") ? "/freelancer" : "/employee";

  const tabs = [
    { label: "Home", icon: Home, path: `${base}/dashboard` },
    { label: "Jobs", icon: Briefcase, path: `${base}/projects` },
    { label: "Wallet", icon: Wallet, path: "#" },
    { label: "Help", icon: CircleHelp, path: `${base}/help-support` },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "rgba(255,255,255,0.98)", // തീമിനനുസരിച്ച് മാറ്റാം
        height: "80px", // വലിപ്പം കൂട്ടി
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        borderTop: "1px solid rgba(0,0,0,0.1)",
        backdropFilter: "blur(10px)",
        paddingBottom: "env(safe-area-inset-bottom)", // iPhone notch സപ്പോർട്ടിന്
      }}
    >
      {tabs.map((tab) => (
        <div key={tab.label} onClick={() => (tab.label === "Wallet" ? setShowWalletMenu(!showWalletMenu) : null)}>
          <NavLink
            to={tab.path}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textDecoration: "none",
              color: "#333",
              gap: "4px",
            }}
          >
            <tab.icon size={26} /> {/* ഐക്കൺ വലിപ്പം കൂട്ടി */}
            <span style={{ fontSize: "11px", fontWeight: 600 }}>{tab.label}</span>
          </NavLink>
        </div>
      ))}

      <button
        onClick={onMenuClick}
        style={{
          border: "none",
          background: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Menu size={26} />
        <span style={{ fontSize: "11px", fontWeight: 600 }}>Menu</span>
      </button>
    </nav>
  );
};

export default BottomTabBar;
