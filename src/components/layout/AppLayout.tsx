import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";
import SideDrawer from "./SideDrawer";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChatBotPopup from "@/components/chatbot/ChatBotPopup";
import ThemeToggle from "./ThemeToggle";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Briefcase } from "lucide-react";

interface AppLayoutProps {
  userType: "employee" | "client";
}

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const T = {
  black: {
    shell:      "#070714",
    header:     "rgba(7,7,20,.92)",
    headerBdr:  "rgba(255,255,255,.07)",
    logo:       "white",
    logoSub:    "rgba(255,255,255,.3)",
    mainBg:     "#070714",
    mainText:   "rgba(255,255,255,.9)",
    mainSub:    "rgba(255,255,255,.45)",
    cardBg:     "rgba(255,255,255,.05)",
    cardBdr:    "rgba(255,255,255,.08)",
    mutedBg:    "rgba(255,255,255,.06)",
    inputBg:    "rgba(255,255,255,.06)",
    inputBdr:   "rgba(255,255,255,.1)",
    inputFg:    "white",
    inputPh:    "rgba(255,255,255,.25)",
    accent:     "#a5b4fc",
    green:      "#4ade80",
    orange:     "#fbbf24",
    red:        "#f87171",
    orbA:       "rgba(99,102,241,.14)",
    orbB:       "rgba(139,92,246,.1)",
    gridLine:   "rgba(255,255,255,.013)",
    hoverRow:   "rgba(255,255,255,.04)",
  },
  white: {
    shell:      "#f0f4ff",
    header:     "rgba(255,255,255,.95)",
    headerBdr:  "rgba(0,0,0,.08)",
    logo:       "#0d0d24",
    logoSub:    "#9ca3af",
    mainBg:     "#f0f4ff",
    mainText:   "#0d0d24",
    mainSub:    "#6b7280",
    cardBg:     "#ffffff",
    cardBdr:    "rgba(0,0,0,.08)",
    mutedBg:    "#f1f5f9",
    inputBg:    "#ffffff",
    inputBdr:   "rgba(0,0,0,.1)",
    inputFg:    "#0d0d24",
    inputPh:    "#9ca3af",
    accent:     "#4f46e5",
    green:      "#16a34a",
    orange:     "#d97706",
    red:        "#dc2626",
    orbA:       "rgba(99,102,241,.07)",
    orbB:       "rgba(139,92,246,.04)",
    gridLine:   "rgba(0,0,0,.022)",
    hoverRow:   "rgba(0,0,0,.03)",
  },
  wb: {
    shell:      "#f0f4ff",
    header:     "rgba(10,10,28,.92)",
    headerBdr:  "rgba(255,255,255,.07)",
    logo:       "white",
    logoSub:    "rgba(255,255,255,.35)",
    mainBg:     "#f0f4ff",
    mainText:   "#0d0d24",
    mainSub:    "#6b7280",
    cardBg:     "#ffffff",
    cardBdr:    "rgba(0,0,0,.08)",
    mutedBg:    "#f1f5f9",
    inputBg:    "#ffffff",
    inputBdr:   "rgba(0,0,0,.1)",
    inputFg:    "#0d0d24",
    inputPh:    "#9ca3af",
    accent:     "#4f46e5",
    green:      "#16a34a",
    orange:     "#d97706",
    red:        "#dc2626",
    orbA:       "rgba(99,102,241,.07)",
    orbB:       "rgba(139,92,246,.04)",
    gridLine:   "rgba(0,0,0,.022)",
    hoverRow:   "rgba(0,0,0,.03)",
  },
};

function buildCss(t: typeof T.black): string {
  return `
@keyframes orbGlowApp { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.6;transform:scale(1.08)} }
.app-main-dark .text-foreground { color:${t.mainText} !important; }
.app-main-dark .text-muted-foreground { color:${t.mainSub} !important; }
.app-main-dark .bg-background { background:transparent !important; }
.app-main-dark .bg-card { background:${t.cardBg} !important; border:1px solid ${t.cardBdr} !important; }
.app-main-dark .border { border-color:${t.cardBdr} !important; }
.app-main-dark .bg-muted { background:${t.mutedBg} !important; }
.app-main-dark .bg-primary\\/10 { background:rgba(99,102,241,.1) !important; }
.app-main-dark .bg-accent\\/10 { background:rgba(34,197,94,.08) !important; }
.app-main-dark .bg-destructive\\/10 { background:rgba(239,68,68,.08) !important; }
.app-main-dark .bg-warning\\/10 { background:rgba(245,158,11,.08) !important; }
.app-main-dark .text-primary { color:${t.accent} !important; }
.app-main-dark .text-accent { color:${t.green} !important; }
.app-main-dark .text-destructive { color:${t.red} !important; }
.app-main-dark .text-warning { color:${t.orange} !important; }
.app-main-dark .shadow-sm { box-shadow:0 4px 20px rgba(0,0,0,.12) !important; }
.app-main-dark input,.app-main-dark select,.app-main-dark textarea { background:${t.inputBg} !important; border:1px solid ${t.inputBdr} !important; color:${t.inputFg} !important; }
.app-main-dark input::placeholder,.app-main-dark textarea::placeholder { color:${t.inputPh} !important; }
.app-main-dark table { color:${t.mainText} !important; }
.app-main-dark th { color:${t.mainSub} !important; }
.app-main-dark td { border-color:${t.cardBdr} !important; }
.app-main-dark .hover\\:bg-muted\\/50:hover { background:${t.hoverRow} !important; }
`;
}

const AppLayout = ({ userType }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, setTheme } = useDashboardTheme();
  const tok = T[theme];
  const css = buildCss(tok);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", flexDirection: "column", background: tok.shell, fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-5%", right: "-10%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbA} 0%,transparent 70%)`, animation: "orbGlowApp 7s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "-8%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbB} 0%,transparent 70%)`, animation: "orbGlowApp 9s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tok.gridLine} 1px,transparent 1px),linear-gradient(90deg,${tok.gridLine} 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: tok.header, borderBottom: `1px solid ${tok.headerBdr}`, backdropFilter: "blur(20px)" }}>
        <div style={{ margin: "0 auto", display: "flex", height: 56, alignItems: "center", justifyContent: "space-between", padding: "0 16px", maxWidth: 800 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(99,102,241,.45)" }}>
              <Briefcase size={17} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16, color: tok.logo, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
                Freelancer<span style={{ color: A1 }}>.</span>in
              </p>
              <p style={{ fontSize: 9, color: tok.logoSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                {userType}
              </p>
            </div>
          </div>

          {/* Right: Theme toggle + notification */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="app-main-dark" style={{ flex: 1, overflowY: "auto", paddingBottom: 88, position: "relative", zIndex: 1, margin: "0 auto", width: "100%", maxWidth: 800, background: tok.mainBg }}>
        <Outlet />
      </main>

      <BottomTabBar userType={userType} onMenuClick={() => setDrawerOpen(true)} theme={theme} />
      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} theme={theme} />
      <ChatBotPopup />
    </div>
  );
};

export default AppLayout;
