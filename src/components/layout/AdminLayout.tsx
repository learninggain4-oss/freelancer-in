import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, Wallet, LogOut, Menu, X, ChevronLeft,
  ShieldCheck, Fingerprint, UserCheck, Building2, Edit, UserPlus,
  FileText, Layers, IndianRupee, Settings, Landmark, Megaphone,
  Briefcase, LifeBuoy, Bell, HelpCircle, BarChart3, CreditCard,
  Clock, BadgeCheck, Monitor, MessageSquareQuote, Wifi,
  SlidersHorizontal, Eye, ClipboardCheck, Star, ArrowUpCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ThemeToggle from "./ThemeToggle";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

/* ─── Per-theme tokens ─────────────────────────────────────────── */
const T = {
  black: {
    shell:        "#070714",
    sidebar:      "rgba(10,10,28,.97)",
    sidebarBdr:   "rgba(255,255,255,.07)",
    header:       "rgba(7,7,20,.92)",
    headerBdr:    "rgba(255,255,255,.07)",
    sectionTit:   "rgba(255,255,255,.28)",
    navLink:      "rgba(255,255,255,.45)",
    navHoverBg:   "rgba(255,255,255,.06)",
    navHoverFg:   "rgba(255,255,255,.9)",
    navActiveBg:  "rgba(99,102,241,.18)",
    navActiveFg:  "#a5b4fc",
    navActiveBdr: "rgba(99,102,241,.25)",
    logoBg:       `linear-gradient(135deg,${A1},${A2})`,
    logoShadow:   "rgba(99,102,241,.5)",
    logoutFg:     "#f87171",
    logoutHover:  "rgba(239,68,68,.1)",
    badgeBg:      "#ef4444",
    // main overrides
    mainBg:       "#070714",
    mainText:     "rgba(255,255,255,.9)",
    mainSub:      "rgba(255,255,255,.45)",
    cardBg:       "rgba(255,255,255,.05)",
    cardBdr:      "rgba(255,255,255,.09)",
    mutedBg:      "rgba(255,255,255,.06)",
    inputBg:      "rgba(255,255,255,.06)",
    inputBdr:     "rgba(255,255,255,.1)",
    inputFg:      "white",
    inputPh:      "rgba(255,255,255,.25)",
    accent:       "#a5b4fc",
    green:        "#4ade80",
    orange:       "#fbbf24",
    red:          "#f87171",
    orbA:         "rgba(99,102,241,.12)",
    orbB:         "rgba(139,92,246,.10)",
    gridLine:     "rgba(255,255,255,.015)",
    headerRight:  "rgba(255,255,255,.35)",
    statusDot:    "#22c55e",
    liveBg:       "rgba(34,197,94,.15)",
    liveBdr:      "rgba(34,197,94,.25)",
    liveFg:       "#4ade80",
  },
  white: {
    shell:        "#f0f4ff",
    sidebar:      "#ffffff",
    sidebarBdr:   "rgba(0,0,0,.09)",
    header:       "rgba(255,255,255,.95)",
    headerBdr:    "rgba(0,0,0,.08)",
    sectionTit:   "#9ca3af",
    navLink:      "#4b5563",
    navHoverBg:   "#f1f5f9",
    navHoverFg:   "#0d0d24",
    navActiveBg:  "rgba(99,102,241,.1)",
    navActiveFg:  "#4f46e5",
    navActiveBdr: "rgba(99,102,241,.2)",
    logoBg:       `linear-gradient(135deg,${A1},${A2})`,
    logoShadow:   "rgba(99,102,241,.35)",
    logoutFg:     "#ef4444",
    logoutHover:  "rgba(239,68,68,.08)",
    badgeBg:      "#ef4444",
    mainBg:       "#f0f4ff",
    mainText:     "#0d0d24",
    mainSub:      "#6b7280",
    cardBg:       "#ffffff",
    cardBdr:      "rgba(0,0,0,.08)",
    mutedBg:      "#f1f5f9",
    inputBg:      "#ffffff",
    inputBdr:     "rgba(0,0,0,.1)",
    inputFg:      "#0d0d24",
    inputPh:      "#9ca3af",
    accent:       "#4f46e5",
    green:        "#16a34a",
    orange:       "#d97706",
    red:          "#dc2626",
    orbA:         "rgba(99,102,241,.07)",
    orbB:         "rgba(139,92,246,.05)",
    gridLine:     "rgba(0,0,0,.025)",
    headerRight:  "#6b7280",
    statusDot:    "#22c55e",
    liveBg:       "rgba(22,163,74,.1)",
    liveBdr:      "rgba(22,163,74,.2)",
    liveFg:       "#16a34a",
  },
  wb: {
    // sidebar = dark, content = white/light
    shell:        "#f0f4ff",
    sidebar:      "rgba(10,10,28,.97)",
    sidebarBdr:   "rgba(255,255,255,.07)",
    header:       "rgba(255,255,255,.95)",
    headerBdr:    "rgba(0,0,0,.08)",
    sectionTit:   "rgba(255,255,255,.28)",
    navLink:      "rgba(255,255,255,.45)",
    navHoverBg:   "rgba(255,255,255,.06)",
    navHoverFg:   "rgba(255,255,255,.9)",
    navActiveBg:  "rgba(99,102,241,.2)",
    navActiveFg:  "#a5b4fc",
    navActiveBdr: "rgba(99,102,241,.3)",
    logoBg:       `linear-gradient(135deg,${A1},${A2})`,
    logoShadow:   "rgba(99,102,241,.5)",
    logoutFg:     "#f87171",
    logoutHover:  "rgba(239,68,68,.1)",
    badgeBg:      "#ef4444",
    mainBg:       "#f0f4ff",
    mainText:     "#0d0d24",
    mainSub:      "#6b7280",
    cardBg:       "#ffffff",
    cardBdr:      "rgba(0,0,0,.08)",
    mutedBg:      "#f1f5f9",
    inputBg:      "#ffffff",
    inputBdr:     "rgba(0,0,0,.1)",
    inputFg:      "#0d0d24",
    inputPh:      "#9ca3af",
    accent:       "#4f46e5",
    green:        "#16a34a",
    orange:       "#d97706",
    red:          "#dc2626",
    orbA:         "rgba(99,102,241,.07)",
    orbB:         "rgba(139,92,246,.05)",
    gridLine:     "rgba(0,0,0,.025)",
    headerRight:  "#6b7280",
    statusDot:    "#22c55e",
    liveBg:       "rgba(22,163,74,.1)",
    liveBdr:      "rgba(22,163,74,.2)",
    liveFg:       "#16a34a",
  },
};

function buildCss(t: typeof T.black): string {
  return `
@keyframes orbGlow { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.1)} }
.admin-nav-section-title { color:${t.sectionTit}; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:4px 12px 6px; }
.admin-nav-link { display:flex; align-items:center; gap:9px; padding:8px 12px; border-radius:10px; font-size:13px; font-weight:500; color:${t.navLink}; text-decoration:none; transition:all .15s; cursor:pointer; border:1px solid transparent; }
.admin-nav-link:hover { background:${t.navHoverBg}; color:${t.navHoverFg}; }
.admin-nav-link.active { background:${t.navActiveBg}; color:${t.navActiveFg}; border:1px solid ${t.navActiveBdr}; }
.admin-main .text-foreground { color:${t.mainText} !important; }
.admin-main .text-muted-foreground { color:${t.mainSub} !important; }
.admin-main .bg-background { background:transparent !important; }
.admin-main .bg-card { background:${t.cardBg} !important; border:1px solid ${t.cardBdr} !important; }
.admin-main .border { border-color:${t.cardBdr} !important; }
.admin-main .bg-muted { background:${t.mutedBg} !important; }
.admin-main .bg-primary\\/10 { background:rgba(99,102,241,.1) !important; }
.admin-main .bg-accent\\/10 { background:rgba(34,197,94,.08) !important; }
.admin-main .bg-destructive\\/10 { background:rgba(239,68,68,.08) !important; }
.admin-main .bg-warning\\/10 { background:rgba(245,158,11,.08) !important; }
.admin-main .text-primary { color:${t.accent} !important; }
.admin-main .text-accent { color:${t.green} !important; }
.admin-main .text-destructive { color:${t.red} !important; }
.admin-main .text-warning { color:${t.orange} !important; }
.admin-main .hover\\:shadow-md:hover { box-shadow:0 8px 24px rgba(0,0,0,.15) !important; }
.admin-main input,.admin-main select,.admin-main textarea { background:${t.inputBg} !important; border:1px solid ${t.inputBdr} !important; color:${t.inputFg} !important; }
.admin-main input::placeholder,.admin-main textarea::placeholder { color:${t.inputPh} !important; }
.admin-main table { color:${t.mainText} !important; }
.admin-main th { color:${t.mainSub} !important; }
.admin-main td { border-color:${t.cardBdr} !important; }
`;
}

const navSections = [
  { title: "Overview", items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "My Wallet",  icon: Wallet,          path: "/admin/wallet" },
  ]},
  { title: "User Management", items: [
    { label: "All Users",     icon: Users,    path: "/admin/users" },
    { label: "Employees",     icon: UserCheck,path: "/admin/employees" },
    { label: "Clients",       icon: Building2,path: "/admin/clients" },
    { label: "Profile Edits", icon: Edit,     path: "/admin/profile-edits" },
    { label: "Sessions",      icon: Monitor,  path: "/admin/sessions" },
    { label: "Online Status", icon: Wifi,     path: "/admin/online-status" },
  ]},
  { title: "Financial", items: [
    { label: "Withdrawals",     icon: Wallet,          path: "/admin/withdrawals" },
    { label: "Wallet Mgmt",     icon: IndianRupee,     path: "/admin/wallet-management" },
    { label: "Wallet Types",    icon: Wallet,          path: "/admin/wallet-types" },
    { label: "Payment Methods", icon: CreditCard,      path: "/admin/payment-methods" },
    { label: "Banks",           icon: Landmark,        path: "/admin/banks" },
    { label: "Wallet Upgrades", icon: ArrowUpCircle,   path: "/admin/wallet-upgrades" },
    { label: "Auto Responses",  icon: MessageSquareQuote, path: "/admin/auto-responses" },
  ]},
  { title: "Verification", items: [
    { label: "Aadhaar Verify", icon: Fingerprint, path: "/admin/verifications" },
    { label: "Bank Verify",    icon: Landmark,    path: "/admin/bank-verifications" },
    { label: "Validation",     icon: BadgeCheck,  path: "/admin/validation" },
  ]},
  { title: "Projects & Work", items: [
    { label: "Jobs",       icon: Briefcase,     path: "/admin/jobs" },
    { label: "Attendance", icon: ClipboardCheck,path: "/admin/attendance" },
    { label: "Services",   icon: Layers,        path: "/admin/services" },
  ]},
  { title: "Communication", items: [
    { label: "Help & Support",  icon: HelpCircle, path: "/admin/help-support" },
    { label: "Support Reports", icon: BarChart3,  path: "/admin/support-reporting" },
    { label: "Recovery",        icon: LifeBuoy,   path: "/admin/recovery-requests" },
    { label: "Notifications",   icon: Bell,       path: "/admin/notifications" },
    { label: "Announcements",   icon: Megaphone,  path: "/admin/announcements" },
  ]},
  { title: "Security & Monitoring", items: [
    { label: "IP Blocking", icon: ShieldCheck, path: "/admin/ip-blocking" },
    { label: "App Installs", icon: Monitor,    path: "/admin/pwa-installs" },
  ]},
  { title: "Content & Config", items: [
    { label: "Hero Slideshow", icon: SlidersHorizontal,  path: "/admin/hero-slides" },
    { label: "Testimonials",   icon: MessageSquareQuote, path: "/admin/testimonials" },
    { label: "User Reviews",   icon: Star,               path: "/admin/reviews" },
    { label: "Legal Docs",     icon: FileText,           path: "/admin/legal-documents" },
    { label: "Countdowns",     icon: Clock,              path: "/admin/countdowns" },
    { label: "Referrals",      icon: UserPlus,           path: "/admin/referrals" },
    { label: "Site Visitors",  icon: Eye,                path: "/admin/visitors" },
    { label: "Settings",       icon: Settings,           path: "/admin/settings" },
  ]},
];

const allNavItems = navSections.flatMap(s => s.items);

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useDashboardTheme();

  const tok = T[theme];
  const css = buildCss(tok);

  const currentNav = allNavItems.find(item => location.pathname === item.path);
  const isSubPage = location.pathname !== "/admin/dashboard";

  const { data: pendingRecoveryCount = 0 } = useQuery({
    queryKey: ["admin-recovery-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("recovery_requests").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: tok.shell, color: tok.mainText, fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbA} 0%,transparent 70%)`, animation: "orbGlow 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "5%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbB} 0%,transparent 70%)`, animation: "orbGlow 10s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tok.gridLine} 1px,transparent 1px),linear-gradient(90deg,${tok.gridLine} 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }}
          className="lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 240, background: tok.sidebar, borderRight: `1px solid ${tok.sidebarBdr}`, display: "flex", flexDirection: "column" }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px", borderBottom: `1px solid ${tok.sidebarBdr}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: tok.logoBg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${tok.logoShadow}`, flexShrink: 0 }}>
            <ShieldCheck size={17} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: theme === "white" ? "#0d0d24" : "white", lineHeight: 1.2 }}>Bank Manager</p>
            <p style={{ fontSize: 10, color: theme === "white" ? "#9ca3af" : "rgba(255,255,255,.35)", fontWeight: 500 }}>Admin Panel</p>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}
            style={{ color: theme === "white" ? "#9ca3af" : "rgba(255,255,255,.4)", background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav style={{ padding: "10px 8px", display: "flex", flexDirection: "column", gap: 1 }}>
            {navSections.map((section, idx) => (
              <div key={section.title} style={{ marginTop: idx > 0 ? 16 : 0 }}>
                <p className="admin-nav-section-title">{section.title}</p>
                {section.items.map(item => (
                  <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
                    <item.icon size={14} style={{ flexShrink: 0, opacity: .8 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                    {item.path === "/admin/recovery-requests" && pendingRecoveryCount > 0 && (
                      <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9, background: tok.badgeBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", padding: "0 4px" }}>
                        {pendingRecoveryCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Logout */}
        <div style={{ padding: 8, borderTop: `1px solid ${tok.sidebarBdr}` }}>
          <button onClick={handleLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 10, color: tok.logoutFg, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all .15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = tok.logoutHover)}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 56, background: tok.header, borderBottom: `1px solid ${tok.headerBdr}`, backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 30 }}>
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}
            style={{ color: tok.mainSub, background: "none", border: "none", cursor: "pointer" }}>
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold lg:hidden" style={{ color: tok.mainText }}>Bank Manager</span>

          {isSubPage && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} className="lg:ml-0">
              <button onClick={() => navigate("/admin/dashboard")}
                style={{ display: "flex", alignItems: "center", gap: 4, color: tok.mainSub, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                onMouseEnter={e => (e.currentTarget.style.color = tok.mainText)}
                onMouseLeave={e => (e.currentTarget.style.color = tok.mainSub)}>
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              {currentNav && (
                <>
                  <span style={{ color: tok.mainSub, opacity: .4 }}>/</span>
                  <span style={{ fontWeight: 600, color: tok.mainText }}>{currentNav.label}</span>
                </>
              )}
            </div>
          )}

          {/* Right side: Theme toggle + status */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: tok.liveBg, border: `1px solid ${tok.liveBdr}` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: tok.statusDot, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: tok.liveFg, fontWeight: 600 }}>Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-main flex-1" style={{ background: tok.mainBg, padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
