import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";
import SideDrawer from "./SideDrawer";
import MPinGateModal from "@/components/auth/MPinGateModal";
import SecurityQuestionsModal from "@/components/auth/SecurityQuestionsModal";
import TotpGateModal from "@/components/auth/TotpGateModal";
import { useMpinGate } from "@/hooks/use-mpin-gate";
import { useSecurityQuestionsGate } from "@/hooks/use-security-questions-gate";
import { useTotpGate } from "@/hooks/use-totp-gate";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Briefcase,
  Search,
  MessageSquare,
  ChevronDown,
  X,
  User,
  Settings,
  LogOut,
  IndianRupee,
  ArrowUpRight,
  Wallet,
  Bell,
  Plus,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  CircleHelp,
  Gift,
  Star,
  Layers,
  UserCircle,
  HelpCircle,
  MoreHorizontal,
} from "lucide-react";

interface AppLayoutProps {
  userType: "freelancer" | "employer";
}

const A1 = "#6366f1";
const A2 = "#8b5cf6";

// T (Theme Object) അടിസ്ഥാന നിറങ്ങൾ ഉൾപ്പെടുത്തിയിട്ടുണ്ട്
const T = {
  black: { shell: "#0f111a", mainText: "#f1f5f9", card: "#1e293b", border: "#334155" },
  white: { shell: "#f8fafc", mainText: "#0f172a", card: "#ffffff", border: "#e2e8f0" },
  wb: { shell: "#e0e7ff", mainText: "#1e1b4b", card: "#ffffff", border: "#c7d2fe" },
  warm: { shell: "#fef3c7", mainText: "#78350f", card: "#fffbeb", border: "#fde68a" },
  forest: { shell: "#ecfdf5", mainText: "#064e3b", card: "#ffffff", border: "#a7f3d0" },
  ocean: { shell: "#f0f9ff", mainText: "#0c4a6e", card: "#ffffff", border: "#bae6fd" },
};

function buildCss(t: any): string {
  return `
    @keyframes orbGlowApp { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.6;transform:scale(1.08)} }
    @keyframes slideDownFade { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    .app-main-dark .text-foreground { color:${t.mainText} !important; }
    .glass-header { background: ${t.card}dd; backdrop-filter: blur(12px); border-bottom: 1px solid ${t.border}; }
    .glass-sidebar { background: ${t.card}; border-right: 1px solid ${t.border}; }
    .nav-item-active { background: linear-gradient(90deg, ${A1}22, transparent); border-left: 3px solid ${A1}; color: ${A1}; }
  `;
}

const SEARCH_ITEMS = {
  freelancer: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/freelancer/dashboard" },
    { label: "My Jobs", icon: Briefcase, path: "/freelancer/projects" },
    { label: "Attendance", icon: ClipboardCheck, path: "/freelancer/attendance" },
    { label: "My Wallet", icon: Wallet, path: "/freelancer/wallet" },
    { label: "Help & Support", icon: CircleHelp, path: "/freelancer/help-support" },
  ],
  employer: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/employer/dashboard" },
    { label: "My Jobs", icon: Briefcase, path: "/employer/projects" },
    { label: "Attendance", icon: ClipboardCheck, path: "/employer/attendance" },
    { label: "My Wallet", icon: Wallet, path: "/employer/wallet" },
    { label: "Help & Support", icon: CircleHelp, path: "/employer/help-support" },
  ],
};

const AppLayout = ({ userType }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, setTheme } = useDashboardTheme();
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tok = T[theme as keyof typeof T] || T.white;
  const css = buildCss(tok);

  // Responsive state
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const navItems = SEARCH_ITEMS[userType];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        flexDirection: "column",
        background: tok.shell,
        color: tok.mainText,
      }}
    >
      <style>{css}</style>

      {/* Header Logic */}
      <header
        className="glass-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "0.75rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {!isDesktop && (
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ background: "transparent", border: "none", color: tok.mainText, cursor: "pointer" }}
            >
              <LayoutDashboard size={24} />
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold", color: A1 }}>LogoHere</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ThemeToggle />
          <NotificationBell />
          {isDesktop && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
                borderRadius: "8px",
                background: `${tok.border}55`,
              }}
            >
              <UserCircle size={24} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Profile</span>
              <ChevronDown size={16} />
            </div>
          )}
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Desktop Sidebar Logic */}
        {isDesktop && (
          <aside
            className="glass-sidebar"
            style={{ width: "260px", padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path);
              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={isActive ? "nav-item-active" : ""}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem 1.5rem",
                    cursor: "pointer",
                    color: isActive ? A1 : tok.mainText,
                    opacity: isActive ? 1 : 0.7,
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={20} />
                  <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                </div>
              );
            })}
          </aside>
        )}

        {/* Main Content */}
        <main
          className="app-main-dark"
          style={{ flex: 1, padding: "1.5rem", paddingBottom: isDesktop ? "1.5rem" : "90px", overflowY: "auto" }}
        >
          <Outlet />
        </main>
      </div>

      {/* Auth Modals (Retained from your imports) */}
      <MPinGateModal />
      <SecurityQuestionsModal />
      <TotpGateModal />

      {/* Mobile Bottom Tab Bar */}
      {!isDesktop && <BottomTabBar userType={userType} onMenuClick={() => setDrawerOpen(true)} theme={theme} />}

      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} theme={theme} />
    </div>
  );
};

export default AppLayout;
