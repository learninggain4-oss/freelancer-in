import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";
import SideDrawer from "./SideDrawer";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChatBotPopup from "@/components/chatbot/ChatBotPopup";
import { Briefcase } from "lucide-react";

interface AppLayoutProps {
  userType: "employee" | "client";
}

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const APP_CSS = `
@keyframes orbGlowApp { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.6;transform:scale(1.08)} }
.app-shell { background:#070714; color:white; min-height:100dvh; font-family:Inter,system-ui,sans-serif; }
.app-header-dark { background:rgba(7,7,20,.92); border-bottom:1px solid rgba(255,255,255,.07); backdrop-filter:blur(20px); }
.app-main-dark { background:#070714; }
.app-main-dark .text-foreground { color:rgba(255,255,255,.9) !important; }
.app-main-dark .text-muted-foreground { color:rgba(255,255,255,.45) !important; }
.app-main-dark .bg-background { background:transparent !important; }
.app-main-dark .bg-card { background:rgba(255,255,255,.05) !important; border:1px solid rgba(255,255,255,.08) !important; }
.app-main-dark .border { border-color:rgba(255,255,255,.08) !important; }
.app-main-dark .bg-muted { background:rgba(255,255,255,.06) !important; }
.app-main-dark .bg-primary\\/10 { background:rgba(99,102,241,.12) !important; }
.app-main-dark .bg-accent\\/10 { background:rgba(34,197,94,.1) !important; }
.app-main-dark .bg-destructive\\/10 { background:rgba(239,68,68,.1) !important; }
.app-main-dark .bg-warning\\/10 { background:rgba(245,158,11,.1) !important; }
.app-main-dark .text-primary { color:#a5b4fc !important; }
.app-main-dark .text-accent { color:#4ade80 !important; }
.app-main-dark .text-destructive { color:#f87171 !important; }
.app-main-dark .text-warning { color:#fbbf24 !important; }
.app-main-dark .bg-gradient-to-br { background:rgba(255,255,255,.05) !important; }
.app-main-dark .shadow-sm { box-shadow:0 4px 20px rgba(0,0,0,.3) !important; }
.app-main-dark .ring-border\\/50 { --tw-ring-color:rgba(255,255,255,.08) !important; }
.app-main-dark input, .app-main-dark select, .app-main-dark textarea { background:rgba(255,255,255,.06) !important; border:1px solid rgba(255,255,255,.1) !important; color:white !important; }
.app-main-dark input::placeholder, .app-main-dark textarea::placeholder { color:rgba(255,255,255,.25) !important; }
.app-main-dark [data-radix-select-trigger] { background:rgba(255,255,255,.06) !important; border-color:rgba(255,255,255,.1) !important; color:white !important; }
.app-main-dark .hover\\:bg-muted\\/50:hover { background:rgba(255,255,255,.04) !important; }
.app-main-dark table { color:rgba(255,255,255,.8) !important; }
.app-main-dark th { color:rgba(255,255,255,.4) !important; }
.app-main-dark td { border-color:rgba(255,255,255,.06) !important; }
`;

const AppLayout = ({ userType }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100dvh", flexDirection: "column" }}>
      <style>{APP_CSS}</style>

      {/* Ambient background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-5%", right: "-10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.14) 0%,transparent 70%)", animation: "orbGlowApp 7s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "-8%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.1) 0%,transparent 70%)", animation: "orbGlowApp 9s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.013) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Header */}
      <header className="app-header-dark" style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ margin: "0 auto", display: "flex", height: 56, alignItems: "center", justifyContent: "space-between", padding: "0 16px", maxWidth: 800 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 18px rgba(99,102,241,.5)` }}>
              <Briefcase size={17} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16, color: "white", lineHeight: 1.1, letterSpacing: "-0.3px" }}>
                Freelancer<span style={{ color: A1 }}>.</span>in
              </p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                {userType}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="app-main-dark" style={{ flex: 1, overflowY: "auto", paddingBottom: 88, position: "relative", zIndex: 1, margin: "0 auto", width: "100%", maxWidth: 800 }}>
        <Outlet />
      </main>

      <BottomTabBar userType={userType} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <ChatBotPopup />
    </div>
  );
};

export default AppLayout;
