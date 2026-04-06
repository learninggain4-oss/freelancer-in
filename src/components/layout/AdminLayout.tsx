import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, Wallet, LogOut, X, ChevronLeft,
  ShieldCheck, Fingerprint, UserCheck, Building2, Edit, UserPlus,
  FileText, Layers, IndianRupee, Settings, Landmark, Megaphone,
  Briefcase, LifeBuoy, Bell, HelpCircle, BarChart3, CreditCard,
  Clock, BadgeCheck, Monitor, MessageSquareQuote, Wifi,
  SlidersHorizontal, Eye, ClipboardCheck, Star, ArrowUpCircle,
  Shield, ClipboardList, Crown, AlertTriangle,
  Database, Server, Archive, KeyRound,
  GitPullRequest, GitBranch, Lock,
  Settings2, Wrench, Gauge, CalendarClock, UserCog, Download, Globe,
  Zap, FileUp, Cpu, Activity, BookOpen,
  ShieldAlert, UserX, Ban, Folder, BarChart2, TrendingUp,
  Search, MessageSquare, Plus, ChevronDown,
  User, Languages, PanelRightOpen, PanelRightClose,
  CheckCircle2, Info, XCircle, Mail,
} from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const SESSION_TIMEOUT_KEY = "admin_session_timeout_min";
const COLLAPSED_SECTIONS_KEY = "admin_collapsed_sections_v2";
const SIDEBAR_MINI_KEY = "admin_sidebar_mini";

const A1 = "#6366f1";
const A2 = "#8b5cf6";
const VER = "v2.4.1";

/* ─── Fixed light admin design tokens ─────────────────────────── */
const T = {
  shell:        "#f5f7ff",
  sidebar:      "#0e1030",
  sidebarBdr:   "rgba(255,255,255,.07)",
  header:       "rgba(255,255,255,.97)",
  headerBdr:    "rgba(0,0,0,.07)",
  sectionTit:   "rgba(165,180,252,.42)",
  navLink:      "rgba(226,232,240,.5)",
  navHoverBg:   "rgba(255,255,255,.08)",
  navHoverFg:   "rgba(255,255,255,.95)",
  navActiveBg:  "rgba(99,102,241,.28)",
  navActiveFg:  "#c4b5fd",
  navActiveBdr: "rgba(139,92,246,.45)",
  contentHoverBg: "rgba(99,102,241,.07)",
  logoBg:       `linear-gradient(135deg,${A1},${A2})`,
  logoShadow:   "rgba(99,102,241,.65)",
  logoutFg:     "#f87171",
  logoutHover:  "rgba(239,68,68,.14)",
  badgeBg:      "#ef4444",
  mainBg:       "#f5f7ff",
  mainText:     "#0f172a",
  mainSub:      "#64748b",
  cardBg:       "#ffffff",
  cardBdr:      "rgba(0,0,0,.08)",
  mutedBg:      "#f1f5f9",
  inputBg:      "#ffffff",
  inputBdr:     "rgba(0,0,0,.1)",
  inputFg:      "#0f172a",
  inputPh:      "#94a3b8",
  accent:       "#4f46e5",
  green:        "#16a34a",
  orange:       "#d97706",
  red:          "#dc2626",
  orbA:         "rgba(99,102,241,.07)",
  orbB:         "rgba(139,92,246,.05)",
  gridLine:     "rgba(99,102,241,.025)",
  headerRight:  "#64748b",
  statusDot:    "#22c55e",
  liveBg:       "rgba(22,163,74,.08)",
  liveBdr:      "rgba(22,163,74,.18)",
  liveFg:       "#16a34a",
  searchBg:     "#f1f5f9",
  searchBdr:    "rgba(0,0,0,.1)",
  dropBg:       "#ffffff",
  dropBdr:      "rgba(0,0,0,.09)",
  footerBg:     "rgba(255,255,255,.97)",
  footerBdr:    "rgba(0,0,0,.07)",
  rightBg:      "#ffffff",
  rightBdr:     "rgba(0,0,0,.08)",
  iconBtn:      "rgba(0,0,0,.04)",
  iconBtnHov:   "rgba(99,102,241,.09)",
};

function buildCss(t: typeof T): string {
  return `
@keyframes orbGlow { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.1)} }
@keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.7} }
.admin-drop { animation:slideIn .15s ease; }
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
    { label: "Admins",        icon: Crown,    path: "/admin/admins" },
    { label: "Invite Users",  icon: Mail,     path: "/admin/invite" },
    { label: "Freelancers",   icon: UserCheck,path: "/admin/freelancers" },
    { label: "Employers",     icon: Building2,path: "/admin/employers" },
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
    { label: "Safety Center",  icon: Shield,        path: "/admin/safety-center" },
    { label: "Audit Logs",     icon: ClipboardList, path: "/admin/audit-logs" },
    { label: "RBAC & Roles",   icon: Crown,         path: "/admin/rbac" },
    { label: "IP Blocking",    icon: ShieldCheck,   path: "/admin/ip-blocking" },
    { label: "App Installs",   icon: Monitor,       path: "/admin/pwa-installs" },
  ]},
  { title: "Infrastructure", items: [
    { label: "Database Manager", icon: Database, path: "/admin/database-manager" },
    { label: "Env Variables",    icon: KeyRound,  path: "/admin/env-vars" },
    { label: "Server Monitor",   icon: Server,    path: "/admin/server-monitor" },
    { label: "Backup & Restore", icon: Archive,   path: "/admin/backups" },
  ]},
  { title: "Risk Prevention", items: [
    { label: "Approval Center",  icon: GitPullRequest, path: "/admin/approval-center" },
    { label: "Data Privacy",     icon: Shield,         path: "/admin/data-privacy" },
    { label: "Alert System",     icon: Bell,           path: "/admin/alert-system" },
    { label: "Version Control",  icon: GitBranch,      path: "/admin/version-control" },
    { label: "Session Security", icon: Lock,           path: "/admin/session-security" },
  ]},
  { title: "System Stability", items: [
    { label: "Config Management",  icon: Settings2,    path: "/admin/config-management" },
    { label: "Maintenance Center", icon: Wrench,       path: "/admin/maintenance-center" },
    { label: "Rate Limiting",      icon: Gauge,        path: "/admin/rate-limiting" },
    { label: "Scheduler",          icon: CalendarClock,path: "/admin/scheduler" },
    { label: "Vendor Manager",     icon: Globe,        path: "/admin/vendor-manager" },
  ]},
  { title: "Advanced Security", items: [
    { label: "Permission Validator", icon: UserCog,  path: "/admin/permission-validator" },
    { label: "Export Control",       icon: Download, path: "/admin/export-control" },
  ]},
  { title: "Monitoring", items: [
    { label: "Cache Manager",       icon: Layers,        path: "/admin/cache-manager" },
    { label: "API Manager",         icon: Zap,           path: "/admin/api-manager" },
    { label: "Session Manager",     icon: Users,         path: "/admin/session-manager" },
  ]},
  { title: "Platform Safety", items: [
    { label: "Notification Center", icon: Bell,   path: "/admin/notification-center" },
    { label: "File Manager",        icon: FileUp, path: "/admin/file-manager" },
    { label: "High Availability",   icon: Server, path: "/admin/high-availability" },
  ]},
  { title: "Reliability", items: [
    { label: "Data Migration",       icon: Database,     path: "/admin/data-migration" },
    { label: "Job Queue",            icon: Cpu,          path: "/admin/job-queue" },
    { label: "Transaction Control",  icon: IndianRupee,  path: "/admin/transaction-control" },
    { label: "Resource Monitor",     icon: Activity,     path: "/admin/resource-monitor" },
    { label: "Service Resilience",   icon: Globe,        path: "/admin/service-resilience" },
  ]},
  { title: "Operations", items: [
    { label: "Data Retention",       icon: Archive,      path: "/admin/data-retention" },
    { label: "Bulk Operations",      icon: Layers,       path: "/admin/bulk-operations" },
    { label: "Report Generator",     icon: BarChart3,    path: "/admin/report-generator" },
    { label: "Secrets Manager",      icon: KeyRound,     path: "/admin/secrets-manager" },
    { label: "Knowledge Base",       icon: BookOpen,     path: "/admin/knowledge-base" },
  ]},
  { title: "Data Safety", items: [
    { label: "Data Integrity",          icon: Database,    path: "/admin/data-integrity" },
    { label: "Network Monitor",         icon: Wifi,        path: "/admin/network-monitor" },
    { label: "Deadlock Protection",     icon: Lock,        path: "/admin/deadlock-protection" },
    { label: "Notification Delivery",   icon: Bell,        path: "/admin/notification-delivery" },
    { label: "Change Approval",         icon: ShieldCheck, path: "/admin/change-approval" },
  ]},
  { title: "Time & Backup", items: [
    { label: "Time Sync",               icon: Clock,       path: "/admin/time-sync" },
    { label: "Backup Verification",     icon: Archive,     path: "/admin/backup-verification" },
    { label: "Lockout Recovery",        icon: UserCog,     path: "/admin/lockout-recovery" },
    { label: "System Resources",        icon: Server,      path: "/admin/system-resources" },
    { label: "API Validation",          icon: Zap,         path: "/admin/api-validation" },
  ]},
  { title: "System Health", items: [
    { label: "Session Management",      icon: Users,       path: "/admin/session-management" },
    { label: "Permission Sync",         icon: ShieldCheck, path: "/admin/permission-sync" },
    { label: "Log Management",          icon: FileText,    path: "/admin/log-management" },
    { label: "Data Import",             icon: FileUp,      path: "/admin/data-import" },
    { label: "Config Rollback",         icon: Settings2,   path: "/admin/config-rollback" },
  ]},
  { title: "Advanced Ops", items: [
    { label: "Monitoring Redundancy",   icon: Activity,    path: "/admin/monitoring-redundancy" },
    { label: "Data Sync",               icon: Database,    path: "/admin/data-sync" },
    { label: "Security Patch",          icon: Shield,      path: "/admin/security-patch" },
    { label: "Token Management",        icon: KeyRound,    path: "/admin/token-management" },
    { label: "Disaster Recovery",       icon: AlertTriangle, path: "/admin/disaster-recovery" },
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
  { title: "Fraud Detection", items: [
    { label: "Fraud Dashboard",       icon: ShieldAlert,    path: "/admin/fraud-dashboard" },
    { label: "User Risk Scores",      icon: TrendingUp,     path: "/admin/user-risk-score" },
    { label: "Suspicious Users",      icon: UserX,          path: "/admin/suspicious-users" },
    { label: "Payment Fraud",         icon: CreditCard,     path: "/admin/payment-fraud" },
    { label: "IP & Device Monitor",   icon: Monitor,        path: "/admin/ip-device-monitor" },
    { label: "Fraud Alerts",          icon: Bell,           path: "/admin/fraud-alerts" },
    { label: "Account Restrictions",  icon: Ban,            path: "/admin/account-restrictions" },
    { label: "Fraud Rules",           icon: Shield,         path: "/admin/fraud-rules" },
    { label: "Fraud Cases",           icon: Folder,         path: "/admin/fraud-cases" },
    { label: "Fraud Audit Log",       icon: ClipboardList,  path: "/admin/fraud-audit-log" },
    { label: "Notifications",         icon: Bell,           path: "/admin/fraud-notifications" },
    { label: "Automation",            icon: Zap,            path: "/admin/fraud-automation" },
    { label: "Fraud Reports",         icon: BarChart2,      path: "/admin/fraud-reports" },
    { label: "Security Settings",     icon: Settings,       path: "/admin/fraud-security" },
  ]},
];

const allNavItems = navSections.flatMap(s => s.items);

type NavItem = { label: string; icon: React.ElementType; path: string };
type NavGroup = { label: string; icon: React.ElementType; directPath: string | null; items: NavItem[] };

const navGroupItems: NavGroup[] = [
  { label: "Dashboard",      icon: LayoutDashboard, directPath: "/admin/dashboard", items: [] },
  { label: "Users",          icon: Users,            directPath: null, items: navSections.filter(s => s.title === "User Management").flatMap(s => s.items) },
  { label: "Financial",      icon: Wallet,           directPath: null, items: navSections.filter(s => s.title === "Financial").flatMap(s => s.items) },
  { label: "Verification",   icon: BadgeCheck,       directPath: null, items: navSections.filter(s => ["Verification","Projects & Work","Communication"].includes(s.title)).flatMap(s => s.items) },
  { label: "Security",       icon: Shield,           directPath: null, items: navSections.filter(s => ["Security & Monitoring","Risk Prevention","Advanced Security"].includes(s.title)).flatMap(s => s.items) },
  { label: "Infrastructure", icon: Server,           directPath: null, items: navSections.filter(s => ["Infrastructure","System Stability","Monitoring","Platform Safety"].includes(s.title)).flatMap(s => s.items) },
  { label: "Operations",     icon: Activity,         directPath: null, items: navSections.filter(s => ["Reliability","Operations","Data Safety","Time & Backup","System Health","Advanced Ops"].includes(s.title)).flatMap(s => s.items) },
  { label: "Fraud",          icon: ShieldAlert,      directPath: null, items: navSections.filter(s => s.title === "Fraud Detection").flatMap(s => s.items) },
  { label: "Content",        icon: Layers,           directPath: null, items: navSections.filter(s => s.title === "Content & Config").flatMap(s => s.items) },
];

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ml", label: "മലയാളം", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
];

const QUICK_ACTIONS = [
  { label: "Add User",       icon: UserPlus,   path: "/admin/users" },
  { label: "New Job",        icon: Briefcase,  path: "/admin/jobs" },
  { label: "View Reports",   icon: BarChart3,  path: "/admin/report-generator" },
  { label: "Audit Logs",     icon: ClipboardList, path: "/admin/audit-logs" },
  { label: "Settings",       icon: Settings,   path: "/admin/settings" },
];

const SYSTEM_ALERTS = [
  { type: "success", msg: "All systems operational", time: "Just now" },
  { type: "warning", msg: "High load on DB server", time: "5 min ago" },
  { type: "info",    msg: "Backup completed successfully", time: "1 hr ago" },
  { type: "error",   msg: "2 failed login attempts blocked", time: "2 hr ago" },
];

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, fn]);
}

const AdminLayout = () => {
  const [sessionWarning, setSessionWarning] = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQ, setSearchQ]               = useState("");
  const [profileOpen, setProfileOpen]       = useState(false);
  const [notifOpen, setNotifOpen]           = useState(false);
  const [langOpen, setLangOpen]             = useState(false);
  const [quickOpen, setQuickOpen]           = useState(false);
  const [rightOpen, setRightOpen]           = useState(false);
  const [lang, setLang]                     = useState("en");
  const [openNavGroup, setOpenNavGroup]     = useState<string | null>(null);
  const [navDropPos, setNavDropPos]         = useState<{ top: number; left: number }>({ top: 102, left: 0 });

  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useAdminTheme();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);
  const quickRef   = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const navBarRef  = useRef<HTMLDivElement | null>(null);

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(notifRef,   () => setNotifOpen(false));
  useClickOutside(langRef,    () => setLangOpen(false));
  useClickOutside(quickRef,   () => setQuickOpen(false));
  useClickOutside(searchRef,  () => { if (!searchQ) setSearchOpen(false); });
  useClickOutside(navBarRef as React.RefObject<HTMLDivElement | null>, () => setOpenNavGroup(null));

  const tok = T;
  const css = buildCss(tok);

  const currentNav = allNavItems.find(item => location.pathname === item.path);
  const isSubPage  = location.pathname !== "/admin/dashboard";

  const searchResults = searchQ.length > 1
    ? allNavItems.filter(i => i.label.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : [];

  const resetSessionTimer = useCallback(() => {
    const minutes = parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY) || "30");
    const ms = minutes * 60 * 1000;
    const warnMs = Math.max(ms - 2 * 60 * 1000, ms - ms * 0.1);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warnRef.current)    clearTimeout(warnRef.current);
    setSessionWarning(false);
    warnRef.current    = setTimeout(() => setSessionWarning(true), warnMs);
    timeoutRef.current = setTimeout(async () => { await signOut(); navigate("/login"); }, ms);
  }, [signOut, navigate]);

  useEffect(() => {
    resetSessionTimer();
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    const handler = () => { setSessionWarning(false); resetSessionTimer(); };
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warnRef.current)    clearTimeout(warnRef.current);
    };
  }, [resetSessionTimer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setSearchQ(""); setProfileOpen(false); setNotifOpen(false); setLangOpen(false); setQuickOpen(false); setOpenNavGroup(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: pendingRecoveryCount = 0 } = useQuery({
    queryKey: ["admin-recovery-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("recovery_requests").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: profile } = useQuery({
    queryKey: ["admin-layout-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("full_name,email").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const userEmail   = profile?.email || user?.email || "admin@example.com";
  const userName    = (Array.isArray(profile?.full_name) ? profile.full_name[0] : profile?.full_name) || userEmail.split("@")[0] || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

  const alertIcon = (type: string) => {
    if (type === "success") return <CheckCircle2 size={12} color="#4ade80" />;
    if (type === "warning") return <AlertTriangle size={12} color="#fbbf24" />;
    if (type === "error")   return <XCircle size={12} color="#f87171" />;
    return <Info size={12} color="#a5b4fc" />;
  };

  const iconBtn = (onClick: () => void, children: React.ReactNode, badge?: number, title?: string) => (
    <button onClick={onClick} title={title}
      style={{ position: "relative", width: 34, height: 34, borderRadius: 9, background: tok.iconBtn, border: "1px solid rgba(0,0,0,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: tok.mainSub, transition: "all .15s", flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = tok.iconBtnHov; e.currentTarget.style.color = tok.mainText; }}
      onMouseLeave={e => { e.currentTarget.style.background = tok.iconBtn;    e.currentTarget.style.color = tok.mainSub;  }}>
      {children}
      {badge != null && badge > 0 && (
        <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: "#ef4444", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", lineHeight: 1 }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );

  const dropStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200,
    background: tok.dropBg, border: `1px solid ${tok.dropBdr}`,
    borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.25)", minWidth: 220,
    overflow: "hidden",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: tok.shell, color: tok.mainText, fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbA} 0%,transparent 70%)`, animation: "orbGlow 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "5%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbB} 0%,transparent 70%)`, animation: "orbGlow 10s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tok.gridLine} 1px,transparent 1px),linear-gradient(90deg,${tok.gridLine} 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* ─── TOP HEADER BAR ─────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", height: 58, background: tok.header, borderBottom: `1px solid ${tok.headerBdr}`, borderTop: `3px solid ${A1}`, backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 30, flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: tok.logoBg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 12px ${tok.logoShadow}` }}>
            <ShieldCheck size={16} color="white" />
          </div>
          <div className="hidden sm:block">
            <p style={{ fontWeight: 800, fontSize: 13, color: tok.mainText, lineHeight: 1.2, margin: 0 }}>Freelancer India</p>
            <p style={{ fontSize: 9, color: tok.mainSub, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Super Admin</p>
          </div>
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: 380, margin: "0 16px", position: "relative" }}>
          {searchOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: tok.searchBg, border: `1px solid ${A1}55`, borderRadius: 10, padding: "0 12px", height: 34 }}>
              <Search size={13} color={tok.mainSub} />
              <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search pages..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: tok.mainText, fontSize: 13 }} />
              <kbd style={{ fontSize: 9, color: tok.mainSub, background: "rgba(0,0,0,.06)", borderRadius: 4, padding: "1px 5px" }}>ESC</kbd>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: tok.searchBg, border: `1px solid ${tok.searchBdr}`, borderRadius: 10, padding: "0 12px", height: 34, width: "100%", cursor: "text", color: tok.mainSub, fontSize: 12.5 }}>
              <Search size={13} />
              <span style={{ flex: 1, textAlign: "left" }}>Search pages...</span>
              <kbd style={{ fontSize: 9, color: tok.mainSub, background: "rgba(0,0,0,.06)", borderRadius: 4, padding: "1px 5px" }}>⌘K</kbd>
            </button>
          )}
          {searchResults.length > 0 && (
            <div className="admin-drop" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: tok.dropBg, border: `1px solid ${tok.dropBdr}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,.25)", zIndex: 300 }}>
              {searchResults.map(r => (
                <button key={r.path} onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQ(""); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "none", border: "none", cursor: "pointer", color: tok.mainText, fontSize: 13, textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = tok.contentHoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <r.icon size={13} color={A1} />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right header actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexShrink: 0 }}>

          {/* Quick Create */}
          <div ref={quickRef} style={{ position: "relative" }}>
            {iconBtn(() => setQuickOpen(o => !o), <Plus size={15} />, undefined, "Quick Actions")}
            {quickOpen && (
              <div className="admin-drop" style={{ ...dropStyle, minWidth: 200 }}>
                <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1 }}>Quick Create</p>
                </div>
                {QUICK_ACTIONS.map(a => (
                  <button key={a.path} onClick={() => { navigate(a.path); setQuickOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "none", border: "none", cursor: "pointer", color: tok.mainText, fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.background = tok.contentHoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <a.icon size={13} color={A1} />
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          {iconBtn(() => navigate("/admin/notifications"), <MessageSquare size={15} />, undefined, "Messages")}

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            {iconBtn(() => setNotifOpen(o => !o), <Bell size={15} />, pendingRecoveryCount, "Notifications")}
            {notifOpen && (
              <div className="admin-drop" style={{ ...dropStyle, minWidth: 300, maxHeight: 420, overflowY: "auto" }}>
                <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${tok.dropBdr}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: tok.mainText, margin: 0 }}>Notifications</p>
                  {pendingRecoveryCount > 0 && <span style={{ fontSize: 10, background: `${A1}22`, color: A1, borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>{pendingRecoveryCount} pending</span>}
                </div>
                {SYSTEM_ALERTS.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", borderBottom: i < SYSTEM_ALERTS.length - 1 ? `1px solid ${tok.dropBdr}` : "none" }}>
                    <div style={{ marginTop: 2, flexShrink: 0 }}>{alertIcon(a.type)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12.5, color: tok.mainText, margin: 0 }}>{a.msg}</p>
                      <p style={{ fontSize: 10.5, color: tok.mainSub, margin: "2px 0 0" }}>{a.time}</p>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "10px 16px" }}>
                  <button onClick={() => { navigate("/admin/notifications"); setNotifOpen(false); }}
                    style={{ width: "100%", padding: "7px 0", borderRadius: 8, background: `${A1}15`, border: `1px solid ${A1}30`, color: A1, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button onClick={() => setLangOpen(o => !o)} title="Language"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 9, background: tok.iconBtn, border: "1px solid rgba(0,0,0,.08)", cursor: "pointer", color: tok.mainSub, fontSize: 12, fontWeight: 600, height: 34 }}
              onMouseEnter={e => { e.currentTarget.style.background = tok.iconBtnHov; e.currentTarget.style.color = tok.mainText; }}
              onMouseLeave={e => { e.currentTarget.style.background = tok.iconBtn;    e.currentTarget.style.color = tok.mainSub;  }}>
              <Languages size={13} />
              <span className="hidden sm:inline">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="admin-drop" style={{ ...dropStyle, minWidth: 160 }}>
                <div style={{ padding: "8px 12px 6px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>Language</p>
                </div>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: lang === l.code ? `${A1}12` : "none", border: "none", cursor: "pointer", color: lang === l.code ? tok.accent : tok.mainText, fontSize: 13, fontWeight: lang === l.code ? 600 : 400 }}
                    onMouseEnter={e => { if (lang !== l.code) e.currentTarget.style.background = tok.contentHoverBg; }}
                    onMouseLeave={e => { if (lang !== l.code) e.currentTarget.style.background = "none"; }}>
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <CheckCircle2 size={12} color={A1} style={{ marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel Toggle */}
          {iconBtn(() => setRightOpen(o => !o), rightOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />, undefined, "Quick Panel")}

          {/* Profile Dropdown */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button onClick={() => setProfileOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 10, background: tok.iconBtn, border: "1px solid rgba(0,0,0,.08)", cursor: "pointer", height: 36 }}
              onMouseEnter={e => (e.currentTarget.style.background = tok.iconBtnHov)}
              onMouseLeave={e => (e.currentTarget.style.background = tok.iconBtn)}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white", flexShrink: 0 }}>
                {userInitial}
              </div>
              <div className="hidden sm:block" style={{ textAlign: "left" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: tok.mainText, margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</p>
                <p style={{ fontSize: 10, color: tok.mainSub, margin: 0, lineHeight: 1.2 }}>Super Admin</p>
              </div>
              <ChevronDown size={12} color={tok.mainSub} className="hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="admin-drop" style={{ ...dropStyle, minWidth: 240 }}>
                <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white", flexShrink: 0 }}>
                      {userInitial}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: tok.mainText, margin: 0 }}>{userName}</p>
                      <p style={{ fontSize: 11, color: tok.mainSub, margin: 0 }}>{userEmail}</p>
                      <span style={{ fontSize: 9.5, background: `${A1}20`, color: A1, borderRadius: 20, padding: "1px 7px", fontWeight: 700, display: "inline-block", marginTop: 2 }}>Super Admin</span>
                    </div>
                  </div>
                </div>
                {[
                  { label: "My Profile",   icon: User,          path: "/admin/settings" },
                  { label: "Settings",     icon: Settings,      path: "/admin/settings" },
                  { label: "Audit Logs",   icon: ClipboardList, path: "/admin/audit-logs" },
                ].map(item => (
                  <button key={item.label} onClick={() => { navigate(item.path); setProfileOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: tok.mainText, fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.background = tok.contentHoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <item.icon size={14} color={tok.mainSub} />
                    <span>{item.label}</span>
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${tok.dropBdr}`, margin: "4px 0" }} />
                <button onClick={handleLogout}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: tok.logoutFg, fontSize: 13, fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = tok.logoutHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── HORIZONTAL NAV BAR ─────────────────────────────────────── */}
      <div ref={navBarRef} style={{ background: tok.header, borderBottom: `1px solid ${tok.headerBdr}`, padding: "0 20px", display: "flex", alignItems: "stretch", overflowX: "auto", zIndex: 29, position: "sticky", top: 58, flexShrink: 0, backdropFilter: "blur(20px)" }}>
        {navGroupItems.map(group => {
          const isGroupActive = group.directPath
            ? location.pathname === group.directPath
            : group.items.some(item => location.pathname === item.path);
          const isOpen = openNavGroup === group.label;
          return (
            <div key={group.label} style={{ position: "relative", flexShrink: 0 }}>
              {group.directPath ? (
                <NavLink to={group.directPath}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 44, color: isGroupActive ? A1 : tok.mainSub, fontSize: 13, fontWeight: isGroupActive ? 700 : 500, borderBottom: isGroupActive ? `2px solid ${A1}` : "2px solid transparent", textDecoration: "none", whiteSpace: "nowrap", background: "none" }}>
                  <group.icon size={13} />
                  <span>{group.label}</span>
                </NavLink>
              ) : (
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setNavDropPos({ top: rect.bottom + 2, left: rect.left });
                    setOpenNavGroup(isOpen ? null : group.label);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 44, color: isGroupActive ? A1 : tok.mainSub, fontSize: 13, fontWeight: isGroupActive ? 700 : 500, borderBottom: isGroupActive ? `2px solid ${A1}` : "2px solid transparent", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <group.icon size={13} />
                  <span>{group.label}</span>
                  <ChevronDown size={10} style={{ opacity: 0.5, marginLeft: 2 }} />
                </button>
              )}
              {isOpen && group.items.length > 0 && (
                <div className="admin-drop" style={{ position: "fixed", top: navDropPos.top, left: navDropPos.left, zIndex: 9999, background: tok.dropBg, border: `1px solid ${tok.dropBdr}`, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.2)", minWidth: 220, maxHeight: 480, overflowY: "auto" }}>
                  <div style={{ padding: "8px 14px 6px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>{group.label}</p>
                  </div>
                  <div style={{ padding: 6 }}>
                    {group.items.map(item => {
                      const isItemActive = location.pathname === item.path;
                      return (
                        <NavLink key={item.path} to={item.path}
                          onClick={() => setOpenNavGroup(null)}
                          style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: isItemActive ? 600 : 400, color: isItemActive ? A1 : tok.mainText, background: isItemActive ? `${A1}12` : "none", textDecoration: "none", border: isItemActive ? `1px solid ${A1}25` : "1px solid transparent" }}>
                          <item.icon size={13} color={isItemActive ? A1 : tok.mainSub} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.label}
                            {item.path === "/admin/recovery-requests" && pendingRecoveryCount > 0 && (
                              <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, color: "white", background: tok.badgeBg, borderRadius: 8, padding: "1px 5px" }}>{pendingRecoveryCount}</span>
                            )}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Breadcrumb on right */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: tok.mainSub, flexShrink: 0, padding: "0 4px" }}>
          {isSubPage ? (
            <>
              <button onClick={() => navigate("/admin/dashboard")}
                style={{ color: tok.mainSub, background: "none", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 3, padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = tok.mainText)}
                onMouseLeave={e => (e.currentTarget.style.color = tok.mainSub)}>
                <ChevronLeft size={13} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              {currentNav && (
                <>
                  <span style={{ opacity: .4 }}>/</span>
                  <span style={{ fontWeight: 600, color: tok.mainText }}>{currentNav.label}</span>
                </>
              )}
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: tok.statusDot, animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ fontWeight: 700, color: tok.mainText, fontSize: 12 }}>Live</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── MAIN AREA ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", zIndex: 1 }}>

        {/* Session warning banner */}
        {sessionWarning && (
          <div style={{ background: "rgba(251,191,36,.15)", borderBottom: "1px solid rgba(251,191,36,.3)", padding: "7px 20px", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <AlertTriangle size={13} color="#fbbf24" />
            <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>Session expiring soon — move mouse or press a key to stay logged in</span>
            <button onClick={resetSessionTimer} style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 7, background: "rgba(251,191,36,.2)", border: "1px solid rgba(251,191,36,.3)", color: "#fbbf24", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Stay Logged In
            </button>
          </div>
        )}

        {/* ─── CONTENT + RIGHT PANEL ──────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* Main content */}
          <main className="admin-main flex-1" style={{ background: tok.mainBg, padding: 24, overflowY: "auto", minWidth: 0 }}>
            <Outlet />
          </main>

          {/* ─── RIGHT QUICK PANEL ────────────────────────────────── */}
          {rightOpen && (
            <aside style={{ width: 280, background: tok.rightBg, borderLeft: `1px solid ${tok.rightBdr}`, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${tok.rightBdr}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: tok.mainText, margin: 0 }}>Quick Panel</p>
                <button onClick={() => setRightOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: tok.mainSub, display: "flex", alignItems: "center" }}>
                  <X size={15} />
                </button>
              </div>

              {/* System Status */}
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tok.rightBdr}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>System Status</p>
                {[
                  { label: "API Server",   ok: true },
                  { label: "Database",     ok: true },
                  { label: "Auth Service", ok: true },
                  { label: "Storage",      ok: false },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
                    <span style={{ fontSize: 12.5, color: tok.mainText }}>{s.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: s.ok ? tok.green : tok.red, background: s.ok ? `${tok.green}15` : `${tok.red}15`, borderRadius: 20, padding: "1px 8px" }}>
                      {s.ok ? "Operational" : "Degraded"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pending Approvals */}
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tok.rightBdr}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Pending Approvals</p>
                {[
                  { label: "Recovery Requests", count: pendingRecoveryCount, path: "/admin/recovery-requests", color: "#f87171" },
                  { label: "Wallet Upgrades",   count: 3, path: "/admin/wallet-upgrades", color: "#fbbf24" },
                  { label: "Aadhaar Verify",    count: 7, path: "/admin/verifications", color: "#a5b4fc" },
                ].map(a => (
                  <button key={a.label} onClick={() => navigate(a.path)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", background: "none", border: "none", cursor: "pointer" }}>
                    <span style={{ fontSize: 12.5, color: tok.mainText }}>{a.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: a.color, background: `${a.color}18`, borderRadius: 20, padding: "1px 8px" }}>{a.count}</span>
                  </button>
                ))}
              </div>

              {/* Recent Alerts */}
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tok.rightBdr}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Recent Alerts</p>
                {SYSTEM_ALERTS.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0" }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}>{alertIcon(a.type)}</div>
                    <div>
                      <p style={{ fontSize: 11.5, color: tok.mainText, margin: 0 }}>{a.msg}</p>
                      <p style={{ fontSize: 10, color: tok.mainSub, margin: "1px 0 0" }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Quick Actions</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {QUICK_ACTIONS.map(a => (
                    <button key={a.path} onClick={() => navigate(a.path)}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 9, background: `${A1}10`, border: `1px solid ${A1}20`, color: tok.accent, fontSize: 12.5, fontWeight: 500, cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${A1}20`)}
                      onMouseLeave={e => (e.currentTarget.style.background = `${A1}10`)}>
                      <a.icon size={13} />
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* ─── FOOTER ─────────────────────────────────────────────── */}
        <footer style={{ background: tok.footerBg, borderTop: `1px solid ${tok.footerBdr}`, padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, color: tok.mainSub, fontWeight: 600 }}>{VER}</span>
            <span style={{ fontSize: 11, color: tok.mainSub }}>© {new Date().getFullYear()} Freelancer India</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span className="admin-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: tok.statusDot, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: tok.green, fontWeight: 600 }}>All Systems Operational</span>
            </div>
            <span style={{ fontSize: 11, color: tok.mainSub }}>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
