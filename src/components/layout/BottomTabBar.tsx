import { useState } from "react";
import {
  Home,
  Briefcase,
  Wallet,
  CircleHelp,
  Menu,
  ClipboardCheck,
  FileText,
  QrCode,
  ScanLine,
  UserCircle,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";

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

  const isDark = theme === "black" || theme === "wb";
  const isWarm = theme === "warm";
  const isForest = theme === "forest";
  const isOcean = theme === "ocean";

  // Styles remain same as your original code for consistency
  const barBg =
    theme === "black"
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
  const barBdr = isDark
    ? "rgba(255,255,255,.07)"
    : isWarm
      ? "rgba(180,83,9,.12)"
      : isForest
        ? "rgba(21,128,61,.12)"
        : isOcean
          ? "rgba(14,165,233,.12)"
          : "rgba(0,0,0,.09)";
  const activeC = isDark ? "#a5b4fc" : isWarm ? "#d97706" : isForest ? "#16a34a" : isOcean ? "#0284c7" : "#4f46e5";
  const inactC = isDark
    ? "rgba(255,255,255,.28)"
    : isWarm
      ? "rgba(120,113,108,.45)"
      : isForest
        ? "rgba(75,124,93,.45)"
        : isOcean
          ? "rgba(75,131,163,.45)"
          : "#b0b8c8";
  const activePill = isDark
    ? "rgba(99,102,241,.22)"
    : isWarm
      ? "rgba(217,119,6,.14)"
      : isForest
        ? "rgba(22,163,74,.14)"
        : isOcean
          ? "rgba(2,132,199,.14)"
          : "rgba(99,102,241,.12)";
  const activeGlow = isDark
    ? "rgba(99,102,241,.5)"
    : isWarm
      ? "rgba(217,119,6,.4)"
      : isForest
        ? "rgba(22,163,74,.4)"
        : isOcean
          ? "rgba(2,132,199,.4)"
          : "rgba(99,102,241,.4)";
  const labelActive = isDark ? "#a5b4fc" : isWarm ? "#d97706" : isForest ? "#16a34a" : isOcean ? "#0284c7" : "#4f46e5";
  const labelInact = isDark
    ? "rgba(255,255,255,.25)"
    : isWarm
      ? "rgba(120,113,108,.45)"
      : isForest
        ? "rgba(75,124,93,.45)"
        : isOcean
          ? "rgba(75,131,163,.45)"
          : "#b0b8c8";

  const tabs = [
    { label: "Home", icon: Home, path: `${base}/dashboard` },
    { label: "Jobs", icon: Briefcase, path: `${base}/projects` },
    { label: "Wallet", icon: Wallet, path: "#" },
    { label: "Help", icon: CircleHelp, path: `${base}/help-support` },
  ];

  const walletSubItems = [
    { label: "Account", icon: UserCircle, path: `${base}/wallet` },
    { label: "My QR", icon: QrCode, path: `${base}/my-qr` },
    { label: "Scan QR", icon: ScanLine, path: `${base}/scan-qr` },
    { label: "Attend", icon: ClipboardCheck, path: `${base}/attendance` },
  ];

  return (
    <nav
      style={
        {
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: barBg,
          borderTop: `1px solid ${barBdr}`,
          backdropFilter: "blur(28px)",
        } as React.CSSProperties
      }
    >
      {/* Wallet Sub-menu Popup */}
      {showWalletMenu && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: "5%",
            width: "90%",
            background: barBg,
            border: `1px solid ${barBdr}`,
            borderRadius: 12,
            padding: 10,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          }}
        >
          {walletSubItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setShowWalletMenu(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 10,
                textDecoration: "none",
                color: labelInact,
              }}
            >
              <item.icon size={20} />
              <span style={{ fontSize: 12 }}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "stretch", height: 64, maxWidth: 600, margin: "0 auto" }}>
        {tabs.map((tab) => (
          <div
            key={tab.label}
            style={{ flex: 1 }}
            onClick={() => (tab.label === "Wallet" ? setShowWalletMenu(!showWalletMenu) : null)}
          >
            <NavLink
              to={tab.path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                textDecoration: "none",
              }}
            >
              <tab.icon size={20} color={showWalletMenu && tab.label === "Wallet" ? activeC : inactC} />
              <span
                style={{ fontSize: 9.5, color: showWalletMenu && tab.label === "Wallet" ? labelActive : labelInact }}
              >
                {tab.label}
              </span>
            </NavLink>
          </div>
        ))}
        <button
          onClick={onMenuClick}
          style={{
            flex: 1,
            border: "none",
            background: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={20} color={inactC} />
          <span style={{ fontSize: 9.5, color: labelInact }}>Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomTabBar;
