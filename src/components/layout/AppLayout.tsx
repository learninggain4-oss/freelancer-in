import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import BottomTabBar from "./BottomTabBar"; // ഈ ഫയൽ താഴെ നൽകിയ ഡിസൈൻ ഉപയോഗിച്ച് അപ്ഡേറ്റ് ചെയ്യുക
import SideDrawer from "./SideDrawer";
import MPinGateModal from "@/components/auth/MPinGateModal";
import SecurityQuestionsModal from "@/components/auth/SecurityQuestionsModal";
import TotpGateModal from "@/components/auth/TotpGateModal";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, Wallet, LayoutDashboard, ClipboardCheck, CircleHelp } from "lucide-react";

interface AppLayoutProps {
  userType: "freelancer" | "employer";
}

const T = {
  black: { shell: "#0f172a", mainText: "#f8fafc", accent: "#6366f1" },
  white: { shell: "#f8fafc", mainText: "#0f172a", accent: "#4f46e5" },
  wb: { shell: "#ffffff", mainText: "#000000", accent: "#000000" },
  warm: { shell: "#fffbeb", mainText: "#78350f", accent: "#d97706" },
  forest: { shell: "#f0fdf4", mainText: "#166534", accent: "#15803d" },
  ocean: { shell: "#eff6ff", mainText: "#1e3a8a", accent: "#2563eb" },
};

function buildCss(t: any): string {
  return `
    @keyframes orbGlowApp { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.6;transform:scale(1.08)} }
    @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .app-main-dark .text-foreground { color: ${t.mainText} !important; }
    .tab-active { color: ${t.accent} !important; border-top: 2px solid ${t.accent}; }
  `;
}

const AppLayout = ({ userType }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme } = useDashboardTheme();
  const { pathname } = useLocation();
  const tok = T[theme as keyof typeof T] || T.black;
  const css = buildCss(tok);

  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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

      <div style={{ display: "flex", flex: 1 }}>
        {isDesktop && (
          <aside style={{ width: "260px", borderRight: "1px solid #e2e8f0", padding: "20px" }}>
            {/* Sidebar content */}
          </aside>
        )}
        <main className="app-main-dark" style={{ flex: 1, paddingBottom: isDesktop ? 0 : "80px" }}>
          <Outlet />
        </main>
      </div>

      {!isDesktop && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "70px",
            background: tok.shell,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            borderTop: "1px solid rgba(148, 163, 184, 0.2)",
            backdropFilter: "blur(10px)",
            zIndex: 50,
            boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          {[
            { icon: LayoutDashboard, path: `/${userType}/dashboard`, label: "Home" },
            { icon: Briefcase, path: `/${userType}/projects`, label: "Jobs" },
            { icon: ClipboardCheck, path: `/${userType}/attendance`, label: "Tasks" },
            { icon: Wallet, path: `/${userType}/wallet`, label: "Wallet" },
          ].map((item, idx) => {
            const isActive = pathname.includes(item.path);
            return (
              <a
                key={idx}
                href={item.path}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textDecoration: "none",
                  color: isActive ? tok.accent : "#94a3b8",
                  fontSize: "12px",
                  fontWeight: isActive ? "600" : "400",
                  transition: "all 0.3s ease",
                  padding: "5px",
                }}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ marginTop: "4px" }}>{item.label}</span>
              </a>
            );
          })}
        </div>
      )}

      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} theme={theme} />
    </div>
  );
};

export default AppLayout;
