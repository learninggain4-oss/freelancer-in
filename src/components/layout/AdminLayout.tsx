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

const A1 = "#6366f1";
const A2 = "#8b5cf6";
const BG = "#070714";

const DARK_CSS = `
@keyframes orbGlow { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.1)} }
.admin-shell { background:${BG}; color:white; min-height:100vh; font-family:Inter,system-ui,sans-serif; }
.admin-sidebar { background:rgba(10,10,28,.97); border-right:1px solid rgba(255,255,255,.07); width:240px; }
.admin-nav-section-title { color:rgba(255,255,255,.28); font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:4px 12px 6px; }
.admin-nav-link { display:flex; align-items:center; gap:9px; padding:8px 12px; border-radius:10px; font-size:13px; font-weight:500; color:rgba(255,255,255,.45); text-decoration:none; transition:all .15s; cursor:pointer; }
.admin-nav-link:hover { background:rgba(255,255,255,.06); color:rgba(255,255,255,.9); }
.admin-nav-link.active { background:rgba(99,102,241,.18); color:#a5b4fc; border:1px solid rgba(99,102,241,.25); }
.admin-header { background:rgba(7,7,20,.92); border-bottom:1px solid rgba(255,255,255,.07); backdrop-filter:blur(20px); position:sticky; top:0; z-index:30; }
.admin-main { background:${BG}; min-height:calc(100vh - 57px); padding:24px; }
.admin-main .text-foreground { color:rgba(255,255,255,.9) !important; }
.admin-main .text-muted-foreground { color:rgba(255,255,255,.45) !important; }
.admin-main .bg-background { background:transparent !important; }
.admin-main .bg-card { background:rgba(255,255,255,.05) !important; border:1px solid rgba(255,255,255,.08) !important; }
.admin-main .border { border-color:rgba(255,255,255,.08) !important; }
.admin-main .bg-muted { background:rgba(255,255,255,.06) !important; }
.admin-main .bg-primary\\/10 { background:rgba(99,102,241,.12) !important; }
.admin-main .bg-accent\\/10 { background:rgba(34,197,94,.1) !important; }
.admin-main .bg-destructive\\/10 { background:rgba(239,68,68,.1) !important; }
.admin-main .bg-warning\\/10 { background:rgba(245,158,11,.1) !important; }
.admin-main .text-primary { color:#a5b4fc !important; }
.admin-main .text-accent { color:#4ade80 !important; }
.admin-main .text-destructive { color:#f87171 !important; }
.admin-main .text-warning { color:#fbbf24 !important; }
.admin-main .hover\\:shadow-md:hover { box-shadow:0 8px 24px rgba(0,0,0,.4) !important; }
.admin-main .hover\\:-translate-y-0\\.5:hover { transform:translateY(-2px) !important; }
.admin-main button { transition:all .2s; }
.admin-main table { color:rgba(255,255,255,.8) !important; }
.admin-main th { color:rgba(255,255,255,.45) !important; }
.admin-main td { border-color:rgba(255,255,255,.06) !important; }
.admin-main input, .admin-main select, .admin-main textarea { background:rgba(255,255,255,.06) !important; border:1px solid rgba(255,255,255,.1) !important; color:white !important; }
.admin-main input::placeholder, .admin-main textarea::placeholder { color:rgba(255,255,255,.25) !important; }
.admin-main [data-radix-select-trigger] { background:rgba(255,255,255,.06) !important; border-color:rgba(255,255,255,.1) !important; color:white !important; }
.admin-main .bg-gradient-to-br { --tw-gradient-from: rgba(99,102,241,.25) !important; --tw-gradient-to: rgba(139,92,246,.2) !important; }
`;

type NavItem = { label: string; icon: React.ElementType; path: string; badge?: number };

const navSections: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "My Wallet", icon: Wallet, path: "/admin/wallet" },
  ]},
  { title: "User Management", items: [
    { label: "All Users", icon: Users, path: "/admin/users" },
    { label: "Employees", icon: UserCheck, path: "/admin/employees" },
    { label: "Clients", icon: Building2, path: "/admin/clients" },
    { label: "Profile Edits", icon: Edit, path: "/admin/profile-edits" },
    { label: "Sessions", icon: Monitor, path: "/admin/sessions" },
    { label: "Online Status", icon: Wifi, path: "/admin/online-status" },
  ]},
  { title: "Financial", items: [
    { label: "Withdrawals", icon: Wallet, path: "/admin/withdrawals" },
    { label: "Wallet Mgmt", icon: IndianRupee, path: "/admin/wallet-management" },
    { label: "Wallet Types", icon: Wallet, path: "/admin/wallet-types" },
    { label: "Payment Methods", icon: CreditCard, path: "/admin/payment-methods" },
    { label: "Banks", icon: Landmark, path: "/admin/banks" },
    { label: "Wallet Upgrades", icon: ArrowUpCircle, path: "/admin/wallet-upgrades" },
    { label: "Auto Responses", icon: MessageSquareQuote, path: "/admin/auto-responses" },
  ]},
  { title: "Verification", items: [
    { label: "Aadhaar Verify", icon: Fingerprint, path: "/admin/verifications" },
    { label: "Bank Verify", icon: Landmark, path: "/admin/bank-verifications" },
    { label: "Validation", icon: BadgeCheck, path: "/admin/validation" },
  ]},
  { title: "Projects & Work", items: [
    { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
    { label: "Attendance", icon: ClipboardCheck, path: "/admin/attendance" },
    { label: "Services", icon: Layers, path: "/admin/services" },
  ]},
  { title: "Communication", items: [
    { label: "Help & Support", icon: HelpCircle, path: "/admin/help-support" },
    { label: "Support Reports", icon: BarChart3, path: "/admin/support-reporting" },
    { label: "Recovery", icon: LifeBuoy, path: "/admin/recovery-requests" },
    { label: "Notifications", icon: Bell, path: "/admin/notifications" },
    { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
  ]},
  { title: "Security & Monitoring", items: [
    { label: "IP Blocking", icon: ShieldCheck, path: "/admin/ip-blocking" },
    { label: "App Installs", icon: Monitor, path: "/admin/pwa-installs" },
  ]},
  { title: "Content & Config", items: [
    { label: "Hero Slideshow", icon: SlidersHorizontal, path: "/admin/hero-slides" },
    { label: "Testimonials", icon: MessageSquareQuote, path: "/admin/testimonials" },
    { label: "User Reviews", icon: Star, path: "/admin/reviews" },
    { label: "Legal Docs", icon: FileText, path: "/admin/legal-documents" },
    { label: "Countdowns", icon: Clock, path: "/admin/countdowns" },
    { label: "Referrals", icon: UserPlus, path: "/admin/referrals" },
    { label: "Site Visitors", icon: Eye, path: "/admin/visitors" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
  ]},
];

const allNavItems = navSections.flatMap(s => s.items);

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh" }}>
      <style>{DARK_CSS}</style>

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)", animation: "orbGlow 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.1) 0%,transparent 70%)", animation: "orbGlow 10s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }} className="lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col admin-sidebar transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px rgba(99,102,241,.5)`, flexShrink: 0 }}>
            <ShieldCheck size={17} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: "white", lineHeight: 1.2 }}>Bank Manager</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,.35)", fontWeight: 500 }}>Admin Panel</p>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: "rgba(255,255,255,.4)", background: "none", border: "none", cursor: "pointer" }}>
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
                      <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", padding: "0 4px" }}>
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
        <div style={{ padding: 8, borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all .15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <header className="admin-header" style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 56 }}>
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} style={{ color: "rgba(255,255,255,.5)", background: "none", border: "none", cursor: "pointer" }}>
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold lg:hidden" style={{ color: "white" }}>Bank Manager</span>
          {isSubPage && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} className="lg:ml-0">
              <button onClick={() => navigate("/admin/dashboard")} style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,.4)", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}>
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              {currentNav && (
                <>
                  <span style={{ color: "rgba(255,255,255,.2)" }}>/</span>
                  <span style={{ fontWeight: 600, color: "rgba(255,255,255,.8)" }}>{currentNav.label}</span>
                </>
              )}
            </div>
          )}
          {/* Right side header accent */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontWeight: 500 }}>Admin</span>
          </div>
        </header>

        <main className="admin-main flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
