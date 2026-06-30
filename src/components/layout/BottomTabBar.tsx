import React, { useState } from "react";
import {
  Home,
  Briefcase,
  Wallet,
  CircleHelp,
  Menu,
  ClipboardCheck,
  FileText,
  QrCode,
  Scan,
  CreditCard,
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
  const location = useLocation();
  const [activeSubMenu, setActiveSubMenu] = useState<"jobs" | "wallet" | null>(null);

  const base =
    userType === "employer" ? "/employer" : location.pathname.startsWith("/freelancer") ? "/freelancer" : "/employee";

  const isDark = theme === "black" || theme === "wb";
  const isWarm = theme === "warm";
  const isForest = theme === "forest";
  const isOcean = theme === "ocean";

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

  // Updated Main Tabs Layout
  const tabs = [
    { id: "home", label: "Home", icon: Home, path: `${base}/dashboard` },
    { id: "jobs", label: "Jobs", icon: Briefcase, action: "jobs" },
    { id: "wallet", label: "Wallet", icon: Wallet, action: "wallet" },
    { id: "help", label: "Help", icon: CircleHelp, path: `${base}/help-support` },
  ];

  const handleMenuToggle = (menuId: "jobs" | "wallet") => {
    setActiveSubMenu((prev) => (prev === menuId ? null : menuId));
  };

  // Submenu Link Common Styles
  const submenuLinkStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: "14px",
    gap: "5px",
    transition: "all .2s",
  };

  // Submenu Container Common Styles
  const subMenuContainerStyle: React.CSSProperties = {
    position: "absolute",
    display: "flex",
    gap: "10px",
    padding: "12px",
    background: barBg,
    border: `1px solid ${barBdr}`,
    borderRadius: "22px",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    boxShadow: isDark ? "0 -8px 32px rgba(0,0,0,.5)" : "0 -4px 24px rgba(0,0,0,.1)",
    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    zIndex: 50,
  };

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
        } as React.CSSProperties
      }
    >
      {/* --- SUBMENU ANIMATION WRAPPER --- */}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          paddingBottom: "12px",
        }}
      >
        {/* Jobs Submenu */}
        <div
          style={{
            ...subMenuContainerStyle,
            transform: activeSubMenu === "jobs" ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
            opacity: activeSubMenu === "jobs" ? 1 : 0,
            visibility: activeSubMenu === "jobs" ? "visible" : "hidden",
            pointerEvents: activeSubMenu === "jobs" ? "auto" : "none",
          }}
        >
          <NavLink to={`${base}/projects`} onClick={() => setActiveSubMenu(null)} style={submenuLinkStyle}>
            <div style={{ background: activePill, padding: "9px", borderRadius: "11px" }}>
              <Briefcase size={22} color={activeC} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: labelActive }}>Jobs</span>
          </NavLink>
          <NavLink to={`${base}/requests`} onClick={() => setActiveSubMenu(null)} style={submenuLinkStyle}>
            <div style={{ background: activePill, padding: "9px", borderRadius: "11px" }}>
              <FileText size={22} color={activeC} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: labelActive }}>Requests</span>
          </NavLink>
        </div>

        {/* Wallet Submenu */}
        <div
          style={{
            ...subMenuContainerStyle,
            transform: activeSubMenu === "wallet" ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
            opacity: activeSubMenu === "wallet" ? 1 : 0,
            visibility: activeSubMenu === "wallet" ? "visible" : "hidden",
            pointerEvents: activeSubMenu === "wallet" ? "auto" : "none",
          }}
        >
          <NavLink to={`${base}/wallet`} onClick={() => setActiveSubMenu(null)} style={submenuLinkStyle}>
            <div style={{ background: activePill, padding: "9px", borderRadius: "11px" }}>
              <CreditCard size={20} color={activeC} />
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: labelActive }}>Account</span>
          </NavLink>
          <NavLink to={`${base}/my-qr`} onClick={() => setActiveSubMenu(null)} style={submenuLinkStyle}>
            <div style={{ background: activePill, padding: "9px", borderRadius: "11px" }}>
              <QrCode size={20} color={activeC} />
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: labelActive }}>My QR</span>
          </NavLink>
          <NavLink to={`${base}/scan-qr`} onClick={() => setActiveSubMenu(null)} style={submenuLinkStyle}>
            <div style={{ background: activePill, padding: "9px", borderRadius: "11px" }}>
              <Scan size={20} color={activeC} />
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: labelActive }}>Scan QR</span>
          </NavLink>
          <NavLink to={`${base}/attendance`} onClick={() => setActiveSubMenu(null)} style={submenuLinkStyle}>
            <div style={{ background: activePill, padding: "9px", borderRadius: "11px" }}>
              <ClipboardCheck size={20} color={activeC} />
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: labelActive }}>Attend</span>
          </NavLink>
        </div>
      </div>
      {/* --- END SUBMENU WRAPPER --- */}

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          height: 76,
          maxWidth: 600,
          margin: "0 auto",
          padding: "0 4px",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.path ? location.pathname.startsWith(tab.path) : activeSubMenu === tab.id;

          const InnerContent = () => (
            <>
              {/* Active glow line at top */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 28,
                    height: 3,
                    borderRadius: "0 0 4px 4px",
                    background: `linear-gradient(90deg, ${A1}, ${activeC})`,
                    boxShadow: `0 2px 10px ${activeGlow}`,
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 34,
                  borderRadius: 12,
                  background: isActive ? activePill : "transparent",
                  transition: "all .2s",
                  boxShadow: isActive ? `0 0 14px ${activeGlow}` : "none",
                }}
              >
                <tab.icon
                  size={isActive ? 22 : 20}
                  style={{
                    color: isActive ? activeC : inactC,
                    strokeWidth: isActive ? 2.4 : 1.7,
                    transition: "all .2s",
                    filter: isActive ? `drop-shadow(0 0 5px ${activeGlow})` : "none",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? labelActive : labelInact,
                  lineHeight: 1,
                  transition: "all .2s",
                  letterSpacing: isActive ? 0.1 : 0,
                }}
              >
                {tab.label}
              </span>
            </>
          );

          if (tab.path) {
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                onClick={() => setActiveSubMenu(null)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  padding: "6px 2px",
                  textDecoration: "none",
                  position: "relative",
                  transition: "all .2s",
                }}
              >
                <InnerContent />
              </NavLink>
            );
          } else {
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.preventDefault();
                  handleMenuToggle(tab.action as "jobs" | "wallet");
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  padding: "6px 2px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all .2s",
                }}
              >
                <InnerContent />
              </button>
            );
          }
        })}

        <button
          onClick={() => {
            setActiveSubMenu(null);
            onMenuClick();
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            padding: "6px 2px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 34,
              borderRadius: 12,
            }}
          >
            <Menu size={22} style={{ color: inactC, strokeWidth: 1.7 }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: labelInact, lineHeight: 1 }}>Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomTabBar;
