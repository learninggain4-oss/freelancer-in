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

// T (Theme Object) ഇവിടെ തന്നെ നിലനിർത്തുക
const T = {
  black: {
    /* ... (നിങ്ങളുടെ ഒറിജിനൽ തീം കോഡ് ഇവിടെയുണ്ടാവണം) ... */
  },
  white: {
    /* ... */
  },
  wb: {
    /* ... */
  },
  warm: {
    /* ... */
  },
  forest: {
    /* ... */
  },
  ocean: {
    /* ... */
  },
};

function buildCss(t: any): string {
  return `
    @keyframes orbGlowApp { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.6;transform:scale(1.08)} }
    @keyframes slideDownFade { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    .app-main-dark .text-foreground { color:${t.mainText} !important; }
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
  const tok = T[theme as keyof typeof T];
  const css = buildCss(tok);

  // Responsive state
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", flexDirection: "column", background: tok.shell }}>
      <style>{css}</style>

      {/* ... (Header logic) ... */}

      <div style={{ display: "flex", flex: 1 }}>
        {isDesktop && <aside>{/* ... (Sidebar logic) ... */}</aside>}
        <main className="app-main-dark" style={{ flex: 1, paddingBottom: isDesktop ? 0 : "85px" }}>
          <Outlet />
        </main>
      </div>

      {!isDesktop && <BottomTabBar userType={userType} onMenuClick={() => setDrawerOpen(true)} theme={theme} />}

      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} theme={theme} />
    </div>
  );
};

export default AppLayout;
