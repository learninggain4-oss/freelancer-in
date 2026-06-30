import { useState, useEffect, useRef } from "react";
import {
  Home, Briefcase, Wallet, CircleHelp, Menu,
  ClipboardCheck, FileText, IndianRupee, ArrowUpRight,
  History, QrCode, Plus, ChevronUp, Star, X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";

interface BottomTabBarProps {
  userType: "employee" | "employer";
  onMenuClick: () => void;
  theme?: DashboardTheme;
}

type SubMenu = "jobs" | "wallet" | null;

const BottomTabBar = ({ userType, onMenuClick, theme = "black" }: BottomTabBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubMenu, setOpenSubMenu] = useState<SubMenu>(null);
  const barRef = useRef<HTMLDivElement>(null);

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
    : isWarm   ? "rgba(254,246,228,.98)"
    : isForest ? "rgba(241,250,244,.98)"
    : isOcean  ? "rgba(240,249,255,.98)"
    : "rgba(255,255,255,.98)";

  const barBdr     = isDark ? "rgba(255,255,255,.07)"     : isWarm ? "rgba(180,83,9,.12)"   : isForest ? "rgba(21,128,61,.12)"  : isOcean ? "rgba(14,165,233,.12)"  : "rgba(0,0,0,.09)";
  const activeC    = isDark ? "#a5b4fc"                   : isWarm ? "#d97706"               : isForest ? "#16a34a"              : isOcean ? "#0284c7"               : "#4f46e5";
  const inactC     = isDark ? "rgba(255,255,255,.28)"     : isWarm ? "rgba(120,113,108,.45)" : isForest ? "rgba(75,124,93,.45)"  : isOcean ? "rgba(75,131,163,.45)"  : "#b0b8c8";
  const activePill = isDark ? "rgba(99,102,241,.22)"      : isWarm ? "rgba(217,119,6,.14)"   : isForest ? "rgba(22,163,74,.14)"  : isOcean ? "rgba(2,132,199,.14)"   : "rgba(99,102,241,.12)";
  const activeGlow = isDark ? "rgba(99,102,241,.5)"       : isWarm ? "rgba(217,119,6,.4)"    : isForest ? "rgba(22,163,74,.4)"   : isOcean ? "rgba(2,132,199,.4)"    : "rgba(99,102,241,.4)";
  const labelActive = isDark ? "#a5b4fc"                  : isWarm ? "#d97706"               : isForest ? "#16a34a"              : isOcean ? "#0284c7"               : "#4f46e5";
  const labelInact  = isDark ? "rgba(255,255,255,.25)"    : isWarm ? "rgba(120,113,108,.45)" : isForest ? "rgba(75,124,93,.45)"  : isOcean ? "rgba(75,131,163,.45)"  : "#b0b8c8";

  const floatBg  = isDark ? "rgba(12,12,30,.97)"  : isWarm ? "rgba(255,253,247,.98)" : isForest ? "rgba(255,255,255,.98)" : isOcean ? "rgba(255,255,255,.98)" : "rgba(255,255,255,.98)";
  const floatBdr = isDark ? "rgba(255,255,255,.1)" : isWarm ? "rgba(180,83,9,.15)"   : isForest ? "rgba(21,128,61,.15)"  : isOcean ? "rgba(14,165,233,.15)"  : "rgba(0,0,0,.1)";

  // Close sub-menu when route changes
  useEffect(() => { setOpenSubMenu(null); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!openSubMenu) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenSubMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openSubMenu]);

  // Sub-menu definitions
  const jobsSubItems = userType === "employee"
    ? [
        { label: "Browse Jobs",  icon: Briefcase,    path: `${base}/projects` },
        { label: "My Bids",      icon: FileText,     path: `${base}/bids` },
        { label: "Requests",     icon: ClipboardCheck,path: `${base}/requests` },
        { label: "Earnings",     icon: Star,         path: `${base}/earnings` },
      ]
    : [
        { label: "Post Job",     icon: Plus,         path: `${base}/projects/create` },
        { label: "My Jobs",      icon: Briefcase,    path: `${base}/projects` },
        { label: "Attendance",   icon: ClipboardCheck,path: `${base}/attendance` },
      ];

  const walletSubItems = userType === "employee"
    ? [
        { label: "My Wallet",    icon: Wallet,        path: `${base}/wallet` },
        { label: "Add Money",    icon: Plus,          path: `${base}/wallet/add` },
        { label: "Transactions", icon: History,       path: `${base}/wallet/transactions` },
        { label: "Withdrawals",  icon: ArrowUpRight,  path: `${base}/wallet/withdrawals` },
        { label: "QR Code",      icon: QrCode,        path: `${base}/wallet/qr` },
      ]
    : [
        { label: "My Wallet",    icon: Wallet,        path: `${base}/wallet` },
        { label: "Add Money",    icon: IndianRupee,   path: `${base}/wallet/add` },
        { label: "Transactions", icon: History,       path: `${base}/wallet/transactions` },
        { label: "Withdrawals",  icon: ArrowUpRight,  path: `${base}/wallet/withdrawals` },
      ];

  const isJobsActive   = location.pathname.startsWith(`${base}/projects`) || location.pathname.startsWith(`${base}/bids`) || location.pathname.startsWith(`${base}/requests`) || location.pathname.startsWith(`${base}/earnings`);
  const isWalletActive = location.pathname.startsWith(`${base}/wallet`);

  const mainTabs = userType === "employee"
    ? [
        { label: "Home",   icon: Home,       path: `${base}/dashboard`, type: "link" as const },
        { label: "Jobs",   icon: Briefcase,  path: `${base}/projects`,  type: "jobs" as const },
        { label: "Attend", icon: ClipboardCheck, path: `${base}/attendance`, type: "link" as const },
        { label: "Wallet", icon: Wallet,     path: `${base}/wallet`,    type: "wallet" as const },
        { label: "Help",   icon: CircleHelp, path: `${base}/help-support`, type: "link" as const },
      ]
    : [
        { label: "Home",   icon: Home,       path: `${base}/dashboard`, type: "link" as const },
        { label: "Attend", icon: ClipboardCheck, path: `${base}/attendance`, type: "link" as const },
        { label: "Jobs",   icon: Briefcase,  path: `${base}/projects`,  type: "jobs" as const },
        { label: "Wallet", icon: Wallet,     path: `${base}/wallet`,    type: "wallet" as const },
        { label: "Help",   icon: CircleHelp, path: `${base}/help-support`, type: "link" as const },
      ];

  const FloatingSubMenu = ({ items, which }: { items: typeof jobsSubItems; which: SubMenu }) => {
    const isOpen = openSubMenu === which;
    return (
      <div style={{
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: 10,
        zIndex: 50,
        background: floatBg,
        border: `1px solid ${floatBdr}`,
        borderRadius: 18,
        boxShadow: isDark
          ? "0 -8px 40px rgba(0,0,0,.6), 0 -2px 16px rgba(99,102,241,.15)"
          : "0 -8px 40px rgba(0,0,0,.14), 0 -2px 12px rgba(99,102,241,.08)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        padding: "8px 6px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 180,
        animation: isOpen ? "floatUp .22s cubic-bezier(.22,.61,.36,1) both" : "none",
        pointerEvents: isOpen ? "all" : "none",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "4px 10px 6px", borderBottom: `1px solid ${floatBdr}`, marginBottom: 2,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: activeC, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {which === "jobs" ? "Jobs" : "Wallet"}
          </span>
          <button onClick={() => setOpenSubMenu(null)} style={{ background: "none", border: "none", cursor: "pointer", color: inactC, display: "flex", padding: 0 }}>
            <X size={12} />
          </button>
        </div>
        {items.map(item => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setOpenSubMenu(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 11,
                background: isActive ? (isDark ? "rgba(99,102,241,.18)" : "rgba(99,102,241,.1)") : "none",
                border: "none", cursor: "pointer", textAlign: "left",
                color: isActive ? activeC : (isDark ? "rgba(255,255,255,.7)" : "#374151"),
                fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                transition: "background .15s",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
            >
              <item.icon size={14} style={{ color: isActive ? activeC : inactC, flexShrink: 0 }} />
              <span>{item.label}</span>
              {isActive && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: activeC }} />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes floatUp {
          from { opacity: 0; transform: translateX(-50%) translateY(14px) scale(.96); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1); }
        }
      `}</style>

      {/* Backdrop blur overlay when sub-menu open */}
      {openSubMenu && (
        <div
          onClick={() => setOpenSubMenu(null)}
          style={{ position: "fixed", inset: 0, zIndex: 38, background: "rgba(0,0,0,.18)", backdropFilter: "blur(1px)" }}
        />
      )}

      <nav
        ref={barRef}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          background: barBg,
          borderTop: `1px solid ${barBdr}`,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          boxShadow: isDark
            ? "0 -8px 32px rgba(0,0,0,.5)"
            : isOcean  ? "0 -4px 24px rgba(14,165,233,.1)"
            : isWarm   ? "0 -4px 24px rgba(180,83,9,.08)"
            : isForest ? "0 -4px 24px rgba(21,128,61,.08)"
            : "0 -4px 24px rgba(0,0,0,.08)",
        } as React.CSSProperties}
      >
        <div style={{ display: "flex", alignItems: "stretch", height: 54, maxWidth: 600, margin: "0 auto", padding: "0 2px", position: "relative" }}>

          {mainTabs.map(tab => {
            if (tab.type === "jobs") {
              const isActive = isJobsActive || openSubMenu === "jobs";
              return (
                <div key="jobs" style={{ flex: 1, position: "relative", display: "flex" }}>
                  {openSubMenu === "jobs" && <FloatingSubMenu items={jobsSubItems} which="jobs" />}
                  <button
                    onClick={() => setOpenSubMenu(prev => prev === "jobs" ? null : "jobs")}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", gap: 2, padding: "5px 2px",
                      background: "none", border: "none", cursor: "pointer", position: "relative",
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                        width: 22, height: 2.5, borderRadius: "0 0 3px 3px",
                        background: `linear-gradient(90deg,${A1},${activeC})`,
                        boxShadow: `0 2px 8px ${activeGlow}`,
                      }} />
                    )}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 33, height: 26, borderRadius: 9,
                      background: isActive ? activePill : "transparent",
                      transition: "all .2s",
                      boxShadow: isActive ? `0 0 10px ${activeGlow}` : "none",
                    }}>
                      <tab.icon size={isActive ? 16 : 15} style={{ color: isActive ? activeC : inactC, strokeWidth: isActive ? 2.4 : 1.7, transition: "all .2s", filter: isActive ? `drop-shadow(0 0 3px ${activeGlow})` : "none" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: isActive ? 800 : 500, color: isActive ? labelActive : labelInact, lineHeight: 1, transition: "all .2s" }}>
                        {tab.label}
                      </span>
                      <ChevronUp size={8} style={{ color: isActive ? activeC : inactC, transform: openSubMenu === "jobs" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
                    </div>
                  </button>
                </div>
              );
            }

            if (tab.type === "wallet") {
              const isActive = isWalletActive || openSubMenu === "wallet";
              return (
                <div key="wallet" style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {openSubMenu === "wallet" && <FloatingSubMenu items={walletSubItems} which="wallet" />}
                  {/* Round floating wallet button */}
                  <button
                    onClick={() => setOpenSubMenu(prev => prev === "wallet" ? null : "wallet")}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      background: isActive
                        ? `linear-gradient(135deg,${A1},#8b5cf6)`
                        : isDark ? "rgba(99,102,241,.18)" : isWarm ? "rgba(217,119,6,.12)" : isForest ? "rgba(22,163,74,.12)" : isOcean ? "rgba(2,132,199,.12)" : "rgba(99,102,241,.1)",
                      border: `1.5px solid ${isActive ? "transparent" : (isDark ? "rgba(99,102,241,.35)" : isWarm ? "rgba(217,119,6,.3)" : isForest ? "rgba(22,163,74,.3)" : isOcean ? "rgba(2,132,199,.3)" : "rgba(99,102,241,.25)")}`,
                      borderRadius: 16,
                      width: 50, height: 40,
                      cursor: "pointer",
                      boxShadow: isActive
                        ? `0 4px 18px rgba(99,102,241,.45), 0 0 0 3px ${isDark ? "rgba(99,102,241,.12)" : "rgba(99,102,241,.08)"}`
                        : `0 2px 10px ${isDark ? "rgba(99,102,241,.2)" : "rgba(99,102,241,.12)"}`,
                      transition: "all .22s cubic-bezier(.22,.61,.36,1)",
                      position: "relative",
                      top: isActive ? -3 : 0,
                    }}
                  >
                    <tab.icon size={16} style={{ color: isActive ? "white" : activeC, strokeWidth: isActive ? 2.4 : 2, transition: "all .2s" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 8.5, fontWeight: 700, color: isActive ? "white" : activeC, lineHeight: 1 }}>
                        {tab.label}
                      </span>
                      <ChevronUp size={7} style={{ color: isActive ? "white" : activeC, transform: openSubMenu === "wallet" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
                    </div>
                  </button>
                </div>
              );
            }

            // Regular link tab
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <NavLink key={tab.path} to={tab.path}
                onClick={() => setOpenSubMenu(null)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 2, padding: "5px 2px",
                  textDecoration: "none", position: "relative", transition: "all .2s",
                }}>

                {isActive && (
                  <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: 22, height: 2.5, borderRadius: "0 0 3px 3px",
                    background: `linear-gradient(90deg,${A1},${activeC})`,
                    boxShadow: `0 2px 8px ${activeGlow}`,
                  }} />
                )}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 33, height: 26, borderRadius: 9,
                  background: isActive ? activePill : "transparent",
                  transition: "all .2s",
                  boxShadow: isActive ? `0 0 10px ${activeGlow}` : "none",
                }}>
                  <tab.icon
                    size={isActive ? 16 : 15}
                    style={{
                      color: isActive ? activeC : inactC,
                      strokeWidth: isActive ? 2.4 : 1.7,
                      transition: "all .2s",
                      filter: isActive ? `drop-shadow(0 0 3px ${activeGlow})` : "none",
                    }}
                  />
                </div>
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 800 : 500,
                  color: isActive ? labelActive : labelInact,
                  lineHeight: 1, transition: "all .2s",
                  letterSpacing: isActive ? 0.1 : 0,
                }}>
                  {tab.label}
                </span>
              </NavLink>
            );
          })}

          {/* Menu button */}
          <button
            onClick={() => { setOpenSubMenu(null); onMenuClick(); }}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 2, padding: "5px 2px",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 33, height: 26, borderRadius: 9 }}>
              <Menu size={15} style={{ color: inactC, strokeWidth: 1.7 }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 500, color: labelInact, lineHeight: 1 }}>Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomTabBar;
