import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";
import SideDrawer from "./SideDrawer";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChatBotPopup from "@/components/chatbot/ChatBotPopup";
import ThemeToggle from "./ThemeToggle";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Briefcase, Search, MessageSquare, ChevronDown, X, User, Settings,
  LogOut, IndianRupee, ArrowUpRight, Wallet, Bell, Plus,
  LayoutDashboard, FileText, ClipboardCheck, CircleHelp, Gift, Star,
} from "lucide-react";

interface AppLayoutProps {
  userType: "employee" | "client";
}

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const T = {
  black: {
    shell:      "#070714",
    header:     "rgba(7,7,20,.94)",
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
    iconBtn:    "rgba(255,255,255,.07)",
    iconBtnHov: "rgba(255,255,255,.13)",
    dropBg:     "rgba(10,10,28,.98)",
    dropBdr:    "rgba(255,255,255,.1)",
    searchBg:   "rgba(255,255,255,.06)",
    searchBdr:  "rgba(255,255,255,.1)",
    footerBg:   "rgba(7,7,20,.92)",
    footerBdr:  "rgba(255,255,255,.07)",
  },
  white: {
    shell:      "#f0f4ff",
    header:     "rgba(255,255,255,.96)",
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
    iconBtn:    "rgba(0,0,0,.05)",
    iconBtnHov: "rgba(0,0,0,.09)",
    dropBg:     "#ffffff",
    dropBdr:    "rgba(0,0,0,.1)",
    searchBg:   "#f1f5f9",
    searchBdr:  "rgba(0,0,0,.09)",
    footerBg:   "rgba(255,255,255,.95)",
    footerBdr:  "rgba(0,0,0,.07)",
  },
  wb: {
    shell:      "#f0f4ff",
    header:     "rgba(10,10,28,.94)",
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
    iconBtn:    "rgba(255,255,255,.09)",
    iconBtnHov: "rgba(255,255,255,.16)",
    dropBg:     "#ffffff",
    dropBdr:    "rgba(0,0,0,.1)",
    searchBg:   "rgba(255,255,255,.08)",
    searchBdr:  "rgba(255,255,255,.12)",
    footerBg:   "rgba(255,255,255,.95)",
    footerBdr:  "rgba(0,0,0,.07)",
  },
};

function buildCss(t: typeof T.black): string {
  return `
@keyframes orbGlowApp { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.6;transform:scale(1.08)} }
@keyframes slideDownFade { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulseDot { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
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

const SEARCH_ITEMS = {
  employee: [
    { label: "Dashboard",     icon: LayoutDashboard, path: "/employee/dashboard" },
    { label: "My Jobs",       icon: Briefcase,       path: "/employee/projects" },
    { label: "Attendance",    icon: ClipboardCheck,  path: "/employee/attendance" },
    { label: "My Wallet",     icon: Wallet,          path: "/employee/wallet" },
    { label: "Transactions",  icon: FileText,        path: "/employee/wallet/transactions" },
    { label: "Withdrawals",   icon: ArrowUpRight,    path: "/employee/wallet/withdrawals" },
    { label: "Notifications", icon: Bell,            path: "/employee/notification-settings" },
    { label: "Help & Support",icon: CircleHelp,      path: "/employee/help-support" },
    { label: "Reviews",       icon: Star,            path: "/employee/review" },
    { label: "Get Free",      icon: Gift,            path: "/employee/get-free" },
  ],
  client: [
    { label: "Dashboard",    icon: LayoutDashboard, path: "/client/dashboard" },
    { label: "My Jobs",      icon: Briefcase,       path: "/client/projects" },
    { label: "Attendance",   icon: ClipboardCheck,  path: "/client/attendance" },
    { label: "My Wallet",    icon: Wallet,          path: "/client/wallet" },
    { label: "Help & Support",icon: CircleHelp,     path: "/client/help-support" },
  ],
};

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, fn]);
}

const AppLayout = ({ userType }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQ, setSearchQ]         = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useDashboardTheme();
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(searchRef,  () => { if (!searchQ) setSearchOpen(false); });

  const tok = T[theme];
  const css = buildCss(tok);
  const isHeaderDark = theme === "black" || theme === "wb";
  const basePath = userType === "employee" ? "/employee" : "/client";

  const { data: walletProfile } = useQuery({
    queryKey: ["app-layout-wallet", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("full_name,available_balance,user_code").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  const userName    = walletProfile?.full_name || profile?.full_name?.[0] || "User";
  const userInitial = (typeof userName === "string" ? userName : Array.isArray(userName) ? userName[0] : "U").charAt(0).toUpperCase();
  const walletBalance = walletProfile?.available_balance ?? profile?.available_balance ?? 0;

  const allSearchItems = SEARCH_ITEMS[userType];
  const searchResults = searchQ.length > 1
    ? allSearchItems.filter(i => i.label.toLowerCase().includes(searchQ.toLowerCase()))
    : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setSearchQ(""); setProfileOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = useCallback(async () => { await signOut(); navigate("/login"); }, [signOut, navigate]);

  const iconBtnStyle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9, background: tok.iconBtn,
    border: `1px solid ${isHeaderDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.07)"}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: isHeaderDark ? "rgba(255,255,255,.5)" : "#6b7280",
    transition: "all .15s", flexShrink: 0,
  };

  const dropStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200,
    background: tok.dropBg, border: `1px solid ${tok.dropBdr}`,
    borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.22)",
    minWidth: 220, overflow: "hidden", animation: "slideDownFade .15s ease",
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", flexDirection: "column", background: tok.shell, fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-5%", right: "-10%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbA} 0%,transparent 70%)`, animation: "orbGlowApp 7s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "-8%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbB} 0%,transparent 70%)`, animation: "orbGlowApp 9s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tok.gridLine} 1px,transparent 1px),linear-gradient(90deg,${tok.gridLine} 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: tok.header, borderBottom: `1px solid ${tok.headerBdr}`, backdropFilter: "blur(20px)" }}>
        <div style={{ margin: "0 auto", display: "flex", height: 56, alignItems: "center", gap: 8, padding: "0 14px", maxWidth: 860 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(99,102,241,.45)" }}>
              <Briefcase size={16} color="white" />
            </div>
            <div className="hidden sm:block">
              <p style={{ fontWeight: 800, fontSize: 15, color: tok.logo, lineHeight: 1.1, letterSpacing: "-0.3px", margin: 0 }}>
                Freelancer<span style={{ color: A1 }}>.</span>in
              </p>
              <p style={{ fontSize: 8.5, color: tok.logoSub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                {userType} portal
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: 340, position: "relative", margin: "0 4px" }}>
            {searchOpen ? (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: tok.searchBg, border: `1px solid ${A1}55`, borderRadius: 10, padding: "0 11px", height: 34 }}>
                <Search size={12} color={isHeaderDark ? "rgba(255,255,255,.4)" : "#9ca3af"} />
                <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search features..."
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: isHeaderDark ? "rgba(255,255,255,.9)" : "#0d0d24", fontSize: 12.5 }} />
                <button onClick={() => { setSearchOpen(false); setSearchQ(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: isHeaderDark ? "rgba(255,255,255,.3)" : "#9ca3af", display: "flex" }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 7, background: tok.searchBg, border: `1px solid ${tok.searchBdr}`, borderRadius: 10, padding: "0 11px", height: 34, width: "100%", cursor: "text", color: isHeaderDark ? "rgba(255,255,255,.3)" : "#9ca3af", fontSize: 12 }}>
                <Search size={12} />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline" style={{ marginLeft: "auto", fontSize: 9, color: isHeaderDark ? "rgba(255,255,255,.2)" : "#9ca3af", background: isHeaderDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)", borderRadius: 4, padding: "1px 5px" }}>⌘K</kbd>
              </button>
            )}
            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: tok.dropBg, border: `1px solid ${tok.dropBdr}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,.22)", zIndex: 300, animation: "slideDownFade .15s ease" }}>
                {searchResults.map(r => (
                  <button key={r.path} onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQ(""); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 13px", background: "none", border: "none", cursor: "pointer", color: tok.mainText, fontSize: 13, textAlign: "left" }}
                    onMouseEnter={e => (e.currentTarget.style.background = tok.hoverRow)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <r.icon size={13} color={A1} />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexShrink: 0 }}>

            {/* Wallet balance */}
            <button onClick={() => navigate(`${basePath}/wallet`)}
              className="hidden sm:flex"
              style={{ alignItems: "center", gap: 7, padding: "5px 10px", borderRadius: 10, background: `${A1}15`, border: `1px solid ${A1}30`, cursor: "pointer", height: 34 }}
              onMouseEnter={e => (e.currentTarget.style.background = `${A1}25`)}
              onMouseLeave={e => (e.currentTarget.style.background = `${A1}15`)}>
              <IndianRupee size={12} color="#a5b4fc" />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "#a5b4fc" }}>
                {walletBalance.toLocaleString("en-IN")}
              </span>
            </button>

            {/* CTA: Withdraw (employee) or Post Job (client) */}
            {userType === "employee" ? (
              <button onClick={() => navigate(`${basePath}/wallet`)}
                className="hidden md:flex"
                style={{ alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", cursor: "pointer", height: 34, color: "white", fontSize: 12, fontWeight: 700, boxShadow: `0 4px 14px rgba(99,102,241,.35)` }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                <ArrowUpRight size={13} />
                <span>Withdraw</span>
              </button>
            ) : (
              <button onClick={() => navigate(`${basePath}/projects/create`)}
                className="hidden md:flex"
                style={{ alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", cursor: "pointer", height: 34, color: "white", fontSize: 12, fontWeight: 700, boxShadow: `0 4px 14px rgba(99,102,241,.35)` }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                <Plus size={13} />
                <span>Post Job</span>
              </button>
            )}

            {/* Messages */}
            <button onClick={() => navigate(`${basePath}/help-support`)} title="Messages"
              style={iconBtnStyle}
              onMouseEnter={e => { e.currentTarget.style.background = tok.iconBtnHov; e.currentTarget.style.color = isHeaderDark ? "white" : "#0d0d24"; }}
              onMouseLeave={e => { e.currentTarget.style.background = tok.iconBtn;    e.currentTarget.style.color = isHeaderDark ? "rgba(255,255,255,.5)" : "#6b7280"; }}>
              <MessageSquare size={15} />
            </button>

            {/* Notifications */}
            <div style={{ ...iconBtnStyle, padding: 0, background: "none", border: "none" }}>
              <NotificationBell />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle theme={theme} setTheme={setTheme} />

            {/* Profile dropdown */}
            <div ref={profileRef} style={{ position: "relative" }}>
              <button onClick={() => setProfileOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px 4px 4px", borderRadius: 10, background: tok.iconBtn, border: `1px solid ${isHeaderDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.07)"}`, cursor: "pointer", height: 34 }}
                onMouseEnter={e => (e.currentTarget.style.background = tok.iconBtnHov)}
                onMouseLeave={e => (e.currentTarget.style.background = tok.iconBtn)}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white", flexShrink: 0 }}>
                  {userInitial}
                </div>
                <ChevronDown size={11} color={isHeaderDark ? "rgba(255,255,255,.4)" : "#9ca3af"} />
              </button>
              {profileOpen && (
                <div style={dropStyle}>
                  <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>
                        {userInitial}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: tok.mainText, margin: 0 }}>{typeof userName === "string" ? userName : Array.isArray(userName) ? userName[0] : "User"}</p>
                        <p style={{ fontSize: 10.5, color: tok.mainSub, margin: 0, textTransform: "capitalize" }}>{userType} account</p>
                      </div>
                    </div>
                  </div>
                  {[
                    { label: "My Profile",  icon: User,          path: `${basePath}/profile` },
                    { label: "Settings",    icon: Settings,      path: `${basePath}/settings` },
                    { label: "My Wallet",   icon: Wallet,        path: `${basePath}/wallet` },
                  ].map(item => (
                    <button key={item.label} onClick={() => { navigate(item.path); setProfileOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", background: "none", border: "none", cursor: "pointer", color: tok.mainText, fontSize: 13 }}
                      onMouseEnter={e => (e.currentTarget.style.background = tok.hoverRow)}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <item.icon size={13} color={tok.mainSub} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <div style={{ borderTop: `1px solid ${tok.dropBdr}`, margin: "3px 0" }} />
                  <button onClick={handleLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="app-main-dark" style={{ flex: 1, overflowY: "auto", paddingBottom: 88, position: "relative", zIndex: 1, margin: "0 auto", width: "100%", maxWidth: 860, background: tok.mainBg }}>
        <Outlet />
      </main>

      <BottomTabBar userType={userType} onMenuClick={() => setDrawerOpen(true)} theme={theme} />
      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} theme={theme} />
      <ChatBotPopup />
    </div>
  );
};

export default AppLayout;
