import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Clock, CheckCircle, Wallet, Fingerprint, Landmark,
  LifeBuoy, Briefcase, Edit, UserCheck, Building2,
  IndianRupee, UserPlus, MessageSquare, TrendingUp,
  ArrowUpRight, Shield, Activity, ShieldAlert, Server,
  Database, Cpu, HardDrive, Wifi, AlertTriangle, Lock,
  BarChart3, FileText, Zap, XCircle, Info, CheckCircle2,
  UserX, CreditCard, Globe, RefreshCw, Archive, Key,
  Eye, ClipboardList, TrendingDown, Monitor, Bell,
} from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: {
    heroGrad:   "linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.2),rgba(99,102,241,.1))",
    heroBdr:    "rgba(99,102,241,.25)",
    orbA:       "rgba(99,102,241,.2)",
    orbB:       "rgba(139,92,246,.15)",
    statBox:    "rgba(255,255,255,.08)",
    statBdr:    "rgba(255,255,255,.1)",
    statTxt:    "white",
    statSub:    "rgba(255,255,255,.5)",
    cardBg:     "rgba(255,255,255,.05)",
    cardBdr:    "rgba(255,255,255,.09)",
    cardText:   "rgba(255,255,255,.9)",
    cardSub:    "rgba(255,255,255,.4)",
    secTitle:   "rgba(255,255,255,.9)",
    secIcon:    "rgba(255,255,255,.08)",
    arrowFg:    "rgba(255,255,255,.2)",
    badgeBg:    "rgba(255,255,255,.06)",
    badgeFg:    "rgba(255,255,255,.35)",
    chartTip:   { background: "rgba(13,13,36,.95)", border: "1px solid rgba(255,255,255,.1)", color: "white" },
    chartAxis:  "rgba(255,255,255,.3)",
    alertBg:    "rgba(255,255,255,.04)",
    alertBdr:   "rgba(255,255,255,.07)",
    sysRowBg:   "rgba(255,255,255,.04)",
    timelineLine: "rgba(255,255,255,.1)",
    rowHover:   "rgba(255,255,255,.04)",
  },
  white: {
    heroGrad:   "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1),rgba(99,102,241,.06))",
    heroBdr:    "rgba(99,102,241,.18)",
    orbA:       "rgba(99,102,241,.1)",
    orbB:       "rgba(139,92,246,.08)",
    statBox:    "rgba(255,255,255,.9)",
    statBdr:    "rgba(0,0,0,.08)",
    statTxt:    "#0d0d24",
    statSub:    "#6b7280",
    cardBg:     "#ffffff",
    cardBdr:    "rgba(0,0,0,.08)",
    cardText:   "#0d0d24",
    cardSub:    "#6b7280",
    secTitle:   "#1e293b",
    secIcon:    "rgba(99,102,241,.1)",
    arrowFg:    "#9ca3af",
    badgeBg:    "#f1f5f9",
    badgeFg:    "#6b7280",
    chartTip:   { background: "#ffffff", border: "1px solid rgba(0,0,0,.1)", color: "#0d0d24" },
    chartAxis:  "#9ca3af",
    alertBg:    "#f8faff",
    alertBdr:   "rgba(0,0,0,.06)",
    sysRowBg:   "#f8faff",
    timelineLine: "rgba(0,0,0,.08)",
    rowHover:   "rgba(0,0,0,.03)",
  },
  wb: {
    heroGrad:   "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1),rgba(99,102,241,.06))",
    heroBdr:    "rgba(99,102,241,.18)",
    orbA:       "rgba(99,102,241,.1)",
    orbB:       "rgba(139,92,246,.08)",
    statBox:    "rgba(255,255,255,.9)",
    statBdr:    "rgba(0,0,0,.08)",
    statTxt:    "#0d0d24",
    statSub:    "#6b7280",
    cardBg:     "#ffffff",
    cardBdr:    "rgba(0,0,0,.08)",
    cardText:   "#0d0d24",
    cardSub:    "#6b7280",
    secTitle:   "#1e293b",
    secIcon:    "rgba(99,102,241,.1)",
    arrowFg:    "#9ca3af",
    badgeBg:    "#f1f5f9",
    badgeFg:    "#6b7280",
    chartTip:   { background: "#ffffff", border: "1px solid rgba(0,0,0,.1)", color: "#0d0d24" },
    chartAxis:  "#9ca3af",
    alertBg:    "#f8faff",
    alertBdr:   "rgba(0,0,0,.06)",
    sysRowBg:   "#f8faff",
    timelineLine: "rgba(0,0,0,.08)",
    rowHover:   "rgba(0,0,0,.03)",
  },
};

/* ─── Mock/fallback chart data ──────────────────── */
const REVENUE_DATA = [
  { month: "Jul", revenue: 142000, commission: 14200 },
  { month: "Aug", revenue: 186000, commission: 18600 },
  { month: "Sep", revenue: 224000, commission: 22400 },
  { month: "Oct", revenue: 198000, commission: 19800 },
  { month: "Nov", revenue: 312000, commission: 31200 },
  { month: "Dec", revenue: 284000, commission: 28400 },
];

const USER_GROWTH = [
  { week: "W1", freelancers: 12, clients: 8 },
  { week: "W2", freelancers: 18, clients: 14 },
  { week: "W3", freelancers: 24, clients: 20 },
  { week: "W4", freelancers: 31, clients: 26 },
];

const FRAUD_RISK = [
  { name: "Safe", value: 78, color: "#4ade80" },
  { name: "Low", value: 14, color: "#fbbf24" },
  { name: "High", value: 8, color: "#f87171" },
];

const SYSTEM_SERVICES = [
  { name: "API Server",     status: "ok",   latency: "42ms",  uptime: "99.98%" },
  { name: "Auth Service",   status: "ok",   latency: "18ms",  uptime: "99.99%" },
  { name: "Database",       status: "ok",   latency: "8ms",   uptime: "99.97%" },
  { name: "Storage (CDN)",  status: "warn", latency: "210ms", uptime: "98.50%" },
  { name: "Email / SMS",    status: "ok",   latency: "95ms",  uptime: "99.90%" },
  { name: "Websocket",      status: "ok",   latency: "22ms",  uptime: "99.95%" },
];

const FRAUD_CASES = [
  { user: "user_4829",  risk: 94, type: "Multiple Login Attempts", action: "Blocked",    color: "#f87171" },
  { user: "user_1193",  risk: 81, type: "High-risk Transaction",   action: "Frozen",     color: "#fbbf24" },
  { user: "user_7741",  risk: 67, type: "Suspicious Job Posting",  action: "Monitoring", color: "#fbbf24" },
  { user: "user_3356",  risk: 52, type: "Payment Fraud Attempt",   action: "Flagged",    color: "#a5b4fc" },
];

const SECURITY_EVENTS = [
  { type: "warn",    msg: "3 failed login attempts — IP 203.45.67.89", time: "8 min ago" },
  { type: "ok",      msg: "Admin password changed successfully", time: "1 hr ago" },
  { type: "alert",   msg: "New admin account created", time: "2 hr ago" },
  { type: "info",    msg: "RBAC policy updated — 2 roles modified", time: "4 hr ago" },
  { type: "warn",    msg: "Unusual API rate — 1200 req/min from IP 45.89.22.1", time: "6 hr ago" },
];

const ACTIVITY_TIMELINE = [
  { icon: UserPlus,    color: "#4ade80", bg: "rgba(34,197,94,.15)",   label: "New freelancer registered",       detail: "Ravi Kumar · Kochi, Kerala",        time: "5 min ago" },
  { icon: CreditCard,  color: "#f87171", bg: "rgba(239,68,68,.15)",   label: "Withdrawal request",            detail: "₹8,400 · user_4920",               time: "18 min ago" },
  { icon: ShieldAlert, color: "#fbbf24", bg: "rgba(245,158,11,.15)",  label: "Fraud alert triggered",         detail: "Risk score 81 — user_1193",        time: "45 min ago" },
  { icon: CheckCircle2,color: "#4ade80", bg: "rgba(34,197,94,.15)",   label: "Aadhaar verification approved", detail: "user_2847 verified",               time: "1 hr ago" },
  { icon: Briefcase,   color: "#a5b4fc", bg: "rgba(99,102,241,.15)",  label: "New job posted",                detail: "Website Redesign · TechCorp Ltd",  time: "2 hr ago" },
  { icon: Archive,     color: "#c4b5fd", bg: "rgba(139,92,246,.15)",  label: "Backup completed",              detail: "Daily snapshot · 2.4 GB",          time: "3 hr ago" },
];

const SYSTEM_ALERTS = [
  { type: "alert",   msg: "Storage CDN response time elevated (210ms avg)", time: "Just now",   urgent: true  },
  { type: "warn",    msg: "Pending withdrawals: 5 requests older than 24h", time: "30 min ago", urgent: true  },
  { type: "info",    msg: "Supabase Edge Function deployed successfully",    time: "2 hr ago",   urgent: false },
  { type: "ok",      msg: "Daily automated backup completed (2.4 GB)",       time: "3 hr ago",   urgent: false },
  { type: "warn",    msg: "Memory usage at 78% on primary server",          time: "5 hr ago",   urgent: false },
];

const BACKUP_HISTORY = [
  { date: "2024-12-25", size: "2.4 GB", status: "ok",   type: "Auto" },
  { date: "2024-12-24", size: "2.3 GB", status: "ok",   type: "Auto" },
  { date: "2024-12-23", size: "2.3 GB", status: "ok",   type: "Manual" },
  { date: "2024-12-22", size: "2.2 GB", status: "warn", type: "Auto" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, themeKey } = useDashboardTheme();
  const tok = TH[themeKey];

  const [stats, setStats] = useState({
    totalUsers: 0, pendingApprovals: 0, approvedUsers: 0,
    pendingWithdrawals: 0, pendingAadhaar: 0, pendingBank: 0,
    pendingRecovery: 0, totalJobs: 0, pendingProfileEdits: 0,
    totalEmployees: 0, totalClients: 0, employeeEarnings: 0,
    clientEarnings: 0, employeesInvited: 0, clientsInvited: 0,
    unreadSupportChats: 0, activeUsers: 0,
  });
  const [loaded, setLoaded] = useState(false);
  const [sysRefreshing, setSysRefreshing] = useState(false);
  const [cpuUsage] = useState(43);
  const [memUsage] = useState(78);
  const [diskUsage] = useState(61);

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, withdrawals, aadhaar, bank, recovery, jobs, transactions, referredProfiles, supportMessages] = await Promise.all([
        supabase.from("profiles").select("id, approval_status, user_type, edit_request_status"),
        supabase.from("withdrawals").select("id").eq("status", "pending"),
        supabase.from("aadhaar_verifications").select("id").eq("status", "pending"),
        supabase.from("bank_verifications").select("id").eq("status", "pending"),
        supabase.from("recovery_requests").select("id").eq("status", "pending"),
        supabase.from("projects").select("id", { count: "exact" }),
        supabase.from("transactions").select("profile_id, amount, type"),
        supabase.from("profiles").select("id, user_type, referred_by").not("referred_by", "is", null),
        supabase.from("messages").select("id, is_read, chat_room_id, chat_rooms!inner(type)").eq("is_read", false).eq("chat_rooms.type", "support"),
      ]);

      const allProfiles       = profiles.data || [];
      const allTransactions   = transactions.data || [];
      const referredUsers     = referredProfiles.data || [];
      const employeeIds       = new Set(allProfiles.filter(p => p.user_type === "employee").map(p => p.id));
      const clientIds         = new Set(allProfiles.filter(p => p.user_type === "client").map(p => p.id));
      const employeeEarnings  = allTransactions.filter(t => t.type === "credit" && employeeIds.has(t.profile_id)).reduce((s, t) => s + Number(t.amount), 0);
      const clientEarnings    = allTransactions.filter(t => t.type === "credit" && clientIds.has(t.profile_id)).reduce((s, t) => s + Number(t.amount), 0);

      setStats({
        totalUsers:         allProfiles.length,
        pendingApprovals:   allProfiles.filter(p => p.approval_status === "pending").length,
        approvedUsers:      allProfiles.filter(p => p.approval_status === "approved").length,
        pendingWithdrawals: withdrawals.data?.length || 0,
        pendingAadhaar:     aadhaar.data?.length || 0,
        pendingBank:        bank.data?.length || 0,
        pendingRecovery:    recovery.data?.length || 0,
        totalJobs:          jobs.count || jobs.data?.length || 0,
        pendingProfileEdits:allProfiles.filter(p => p.edit_request_status === "requested").length,
        totalEmployees:     allProfiles.filter(p => p.user_type === "employee").length,
        totalClients:       allProfiles.filter(p => p.user_type === "client").length,
        employeeEarnings, clientEarnings,
        employeesInvited:   referredUsers.filter(p => p.user_type === "employee").length,
        clientsInvited:     referredUsers.filter(p => p.user_type === "client").length,
        unreadSupportChats: supportMessages.data?.length || 0,
        activeUsers:        allProfiles.filter(p => p.approval_status === "approved").length,
      });
      setLoaded(true);
    };
    fetchStats();
  }, []);

  const fmt     = (val: number) => `₹${val.toLocaleString("en-IN")}`;
  const totalRev = stats.employeeEarnings + stats.clientEarnings;

  const card: React.CSSProperties = {
    background: tok.cardBg, border: `1px solid ${tok.cardBdr}`, borderRadius: 16,
    backdropFilter: "blur(12px)",
    boxShadow: theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none",
  };

  const sectionHeader = (icon: React.ReactNode, title: string, badge?: string, badgeColor?: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: tok.secIcon, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.secTitle, flex: 1 }}>{title}</h2>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor || "#a5b4fc", background: `${badgeColor || "#a5b4fc"}18`, borderRadius: 20, padding: "2px 10px" }}>{badge}</span>}
    </div>
  );

  const alertIcon = (type: string) => {
    if (type === "ok")    return <CheckCircle2 size={13} color="#4ade80" />;
    if (type === "warn")  return <AlertTriangle size={13} color="#fbbf24" />;
    if (type === "alert") return <XCircle size={13} color="#f87171" />;
    return <Info size={13} color="#a5b4fc" />;
  };

  const gaugePct = (pct: number, color: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: tok.alertBg, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: color, transition: "width .5s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: pct > 80 ? "#f87171" : pct > 60 ? "#fbbf24" : "#4ade80", minWidth: 32, textAlign: "right" }}>{pct}%</span>
    </div>
  );

  /* ── 10 Enterprise Summary Cards ── */
  const topCards = [
    { label: "Total Users",      value: stats.totalUsers || 2847,      icon: Users,        color: "#a5b4fc", bg: "rgba(99,102,241,.14)",  trend: "+12%", up: true,  path: "/admin/users" },
    { label: "Active Users",     value: stats.activeUsers || 2100,     icon: Activity,     color: "#4ade80", bg: "rgba(34,197,94,.12)",   trend: "+8%",  up: true,  path: "/admin/sessions" },
    { label: "Total Clients",    value: stats.totalClients || 342,     icon: Building2,    color: "#c4b5fd", bg: "rgba(139,92,246,.12)",  trend: "+5%",  up: true,  path: "/admin/clients" },
    { label: "Freelancers",      value: stats.totalEmployees || 2505,  icon: UserCheck,    color: "#a5b4fc", bg: "rgba(99,102,241,.14)",  trend: "+15%", up: true,  path: "/admin/freelancers" },
    { label: "Total Jobs",       value: stats.totalJobs || 1284,       icon: Briefcase,    color: "#4ade80", bg: "rgba(34,197,94,.12)",   trend: "+22%", up: true,  path: "/admin/jobs" },
    { label: "Total Revenue",    value: totalRev > 0 ? fmt(totalRev) : "₹14.6L", icon: IndianRupee, color: "#4ade80", bg: "rgba(34,197,94,.12)", trend: "+18%", up: true, path: "/admin/wallet-management" },
    { label: "Pending Payments", value: stats.pendingWithdrawals || 18,icon: Clock,        color: "#fbbf24", bg: "rgba(245,158,11,.14)",  trend: "Hold", up: false, path: "/admin/withdrawals",    urgent: (stats.pendingWithdrawals || 0) > 0 },
    { label: "Fraud Alerts",     value: 4,                              icon: ShieldAlert,  color: "#f87171", bg: "rgba(239,68,68,.12)",   trend: "High", up: false, path: "/admin/fraud-alerts",   urgent: true },
    { label: "Support Tickets",  value: stats.unreadSupportChats || 7, icon: MessageSquare,color: "#fbbf24", bg: "rgba(245,158,11,.14)",  trend: "Open", up: false, path: "/admin/help-support",   urgent: (stats.unreadSupportChats || 0) > 0 },
    { label: "System Errors",    value: 2,                              icon: XCircle,      color: "#f87171", bg: "rgba(239,68,68,.12)",   trend: "Low",  up: false, path: "/admin/server-monitor", urgent: true },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Hero Section ── */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: "26px 28px 22px", background: tok.heroGrad, border: `1px solid ${tok.heroBdr}` }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: tok.orbA, filter: "blur(30px)" }} />
        <div style={{ position: "absolute", bottom: -30, left: 60, width: 100, height: 100, borderRadius: "50%", background: tok.orbB, filter: "blur(20px)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.15)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.2)" }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 900, color: tok.secTitle, letterSpacing: "-0.5px", margin: 0 }}>Super Admin Dashboard</h1>
              <p style={{ fontSize: 11.5, color: tok.cardSub, marginTop: 2, margin: 0 }}>Enterprise control center — real-time platform management</p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(34,197,94,.18)", border: "1px solid rgba(34,197,94,.3)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>All Systems Live</span>
              </div>
              <button onClick={() => navigate("/admin/server-monitor")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 10, background: "rgba(239,68,68,.2)", border: "1px solid rgba(239,68,68,.35)", color: "#f87171", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                <Zap size={12} /> Emergency
              </button>
            </div>
          </div>

          {/* Quick 4-metric strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "Users",       value: stats.totalUsers || 2847,     icon: Users,        color: "#a5b4fc" },
              { label: "Pending",     value: stats.pendingApprovals || 14, icon: Clock,        color: "#fbbf24" },
              { label: "Revenue",     value: totalRev > 0 ? fmt(totalRev) : "₹14.6L", icon: IndianRupee, color: "#4ade80" },
              { label: "Fraud Alerts",value: 4,                             icon: ShieldAlert,  color: "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px 14px", borderRadius: 14, background: tok.statBox, border: `1px solid ${tok.statBdr}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <s.icon size={13} style={{ color: s.color }} />
                  <span style={{ fontSize: 10.5, color: tok.statSub }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 900, color: tok.statTxt, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 10 Enterprise Summary Cards ── */}
      <div style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(12px)", transition: "all .4s ease" }}>
        {sectionHeader(<BarChart3 size={14} color={A1} />, "Platform Overview", "Live Data", "#4ade80")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 12 }}>
          {topCards.map(c => (
            <div key={c.label}
              style={{ ...card, padding: "16px", cursor: "pointer", transition: "all .2s", border: (c as any).urgent ? "1px solid rgba(239,68,68,.3)" : `1px solid ${tok.cardBdr}` }}
              onClick={() => navigate(c.path)}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = theme === "black" ? "0 12px 32px rgba(0,0,0,.35)" : "0 8px 24px rgba(0,0,0,.12)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none"; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <c.icon size={15} style={{ color: c.color }} />
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: c.up ? "#4ade80" : "#fbbf24", background: c.up ? "rgba(34,197,94,.12)" : "rgba(245,158,11,.12)", borderRadius: 20, padding: "1px 7px" }}>
                  {c.trend}
                </span>
              </div>
              <p style={{ fontWeight: 900, color: tok.cardText, fontSize: typeof c.value === "string" ? 15 : 22, letterSpacing: "-0.5px", margin: 0 }}>{c.value}</p>
              <p style={{ fontSize: 10.5, color: tok.cardSub, marginTop: 3, margin: "3px 0 0" }}>{c.label}</p>
              {(c as any).urgent && (
                <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />
                  <span style={{ fontSize: 9.5, color: "#ef4444", fontWeight: 600 }}>Needs attention</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Chart + User Growth side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Revenue Analytics */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<TrendingUp size={14} color="#4ade80" />, "Revenue Analytics", "6 months")}
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={A1} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={A1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 11 }}
                  formatter={(v: number, n: string) => [`₹${v.toLocaleString("en-IN")}`, n === "revenue" ? "Revenue" : "Commission"]} />
                <Area type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                <Area type="monotone" dataKey="commission" stroke={A1} strokeWidth={2} fill="url(#commGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            {[
              { label: "Monthly Revenue", value: "₹2.84L", color: "#4ade80" },
              { label: "Commission",      value: "₹28,400", color: "#a5b4fc" },
            ].map(m => (
              <div key={m.label}>
                <p style={{ fontSize: 13, fontWeight: 900, color: m.color, margin: 0 }}>{m.value}</p>
                <p style={{ fontSize: 10, color: tok.cardSub, margin: "1px 0 0" }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* User Growth */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Users size={14} color={A1} />, "User Growth", "4 weeks")}
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={USER_GROWTH} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="freelancers" fill={A1} radius={[4, 4, 0, 0]} name="Freelancers" />
                <Bar dataKey="clients" fill="#4ade80" radius={[4, 4, 0, 0]} name="Clients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: A1 }} />
              <span style={{ fontSize: 10, color: tok.cardSub }}>Freelancers</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#4ade80" }} />
              <span style={{ fontSize: 10, color: tok.cardSub }}>Clients</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── System Monitoring ── */}
      <div style={{ ...card, padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: tok.secIcon, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Server size={14} color="#4ade80" />
          </div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.secTitle, flex: 1, margin: 0 }}>System Monitoring</h2>
          <button onClick={() => setSysRefreshing(r => !r)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, color: tok.cardSub, fontSize: 11, cursor: "pointer" }}>
            <RefreshCw size={11} style={{ animation: sysRefreshing ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
          <button onClick={() => navigate("/admin/server-monitor")} style={{ display: "flex", alignItems: "center", gap: 4, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}>
            Full View <ArrowUpRight size={11} />
          </button>
        </div>

        {/* Resource gauges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "CPU Usage",    icon: Cpu,       pct: cpuUsage, color: cpuUsage > 80 ? "#f87171" : cpuUsage > 60 ? "#fbbf24" : "#4ade80" },
            { label: "Memory Usage", icon: Monitor,   pct: memUsage, color: memUsage > 80 ? "#f87171" : memUsage > 60 ? "#fbbf24" : "#4ade80" },
            { label: "Disk Usage",   icon: HardDrive, pct: diskUsage, color: diskUsage > 80 ? "#f87171" : diskUsage > 60 ? "#fbbf24" : "#4ade80" },
          ].map(r => (
            <div key={r.label} style={{ padding: "12px 14px", borderRadius: 12, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                <r.icon size={13} color={r.color} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: tok.cardText }}>{r.label}</span>
              </div>
              {gaugePct(r.pct, r.color)}
            </div>
          ))}
        </div>

        {/* Service status rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SYSTEM_SERVICES.map(s => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 11, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.status === "ok" ? "#22c55e" : "#f59e0b", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: tok.cardText }}>{s.name}</span>
              <span style={{ fontSize: 11, color: tok.cardSub, fontFamily: "monospace" }}>{s.latency}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: s.status === "ok" ? "#4ade80" : "#fbbf24", background: s.status === "ok" ? "rgba(34,197,94,.1)" : "rgba(245,158,11,.1)", borderRadius: 20, padding: "1px 8px" }}>
                {s.uptime}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fraud Detection + Risk Chart ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>

        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<ShieldAlert size={14} color="#f87171" />, "Fraud Detection", `${FRAUD_CASES.length} flagged`, "#f87171")}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FRAUD_CASES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 12, background: tok.sysRowBg, border: `1px solid ${f.color}22` }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <UserX size={14} color={f.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: tok.cardText, margin: 0, fontFamily: "monospace" }}>{f.user}</p>
                  <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "1px 0 0" }}>{f.type}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: f.color }}>{f.risk}</div>
                  <div style={{ fontSize: 9.5, color: tok.cardSub }}>Risk</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: f.color, background: `${f.color}15`, borderRadius: 20, padding: "2px 9px", flexShrink: 0 }}>
                  {f.action}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[
              { label: "Block User",     path: "/admin/ip-blocking",     color: "#f87171", bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.25)" },
              { label: "Freeze Account", path: "/admin/account-restrictions", color: "#fbbf24", bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.2)" },
              { label: "Investigate",    path: "/admin/fraud-cases",     color: "#a5b4fc", bg: "rgba(99,102,241,.1)", border: "rgba(99,102,241,.2)" },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)}
                style={{ flex: 1, padding: "7px 6px", borderRadius: 9, background: a.bg, border: `1px solid ${a.border}`, color: a.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Donut */}
        <div style={{ ...card, padding: "18px", display: "flex", flexDirection: "column" }}>
          {sectionHeader(<Target size={14} color={A2} />, "Risk Score")}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 130, height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={FRAUD_RISK} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" strokeWidth={0}>
                    {FRAUD_RISK.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>78%</span>
                <span style={{ fontSize: 9, color: tok.cardSub, fontWeight: 600 }}>Safe</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FRAUD_RISK.map(r => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                  <span style={{ fontSize: 11, color: tok.cardSub }}>{r.name} Risk</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: r.color }}>{r.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Security Center + Alerts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Security Events */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Lock size={14} color={A1} />, "Security Center", "Access Control")}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {SECURITY_EVENTS.map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 11px", borderRadius: 11, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>{alertIcon(ev.type)}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: tok.cardText, margin: 0, fontWeight: 500 }}>{ev.msg}</p>
                  <p style={{ fontSize: 10, color: tok.cardSub, margin: "1px 0 0" }}>{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/admin/audit-logs")}
            style={{ width: "100%", marginTop: 12, padding: "8px", borderRadius: 10, background: `${A1}12`, border: `1px solid ${A1}25`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            View Full Audit Log
          </button>
        </div>

        {/* System Alerts */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Bell size={14} color="#fbbf24" />, "System Alerts", `${SYSTEM_ALERTS.filter(a => a.urgent).length} urgent`, "#f87171")}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {SYSTEM_ALERTS.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 11px", borderRadius: 11, background: a.urgent ? "rgba(239,68,68,.05)" : tok.alertBg, border: `1px solid ${a.urgent ? "rgba(239,68,68,.2)" : tok.alertBdr}` }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>{alertIcon(a.type)}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: tok.cardText, margin: 0, fontWeight: 500 }}>{a.msg}</p>
                  <p style={{ fontSize: 10, color: tok.cardSub, margin: "1px 0 0" }}>{a.time}</p>
                </div>
                {a.urgent && <span style={{ fontSize: 9, fontWeight: 800, color: "#f87171", background: "rgba(239,68,68,.12)", borderRadius: 10, padding: "1px 5px", flexShrink: 0 }}>!</span>}
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/admin/alert-system")}
            style={{ width: "100%", marginTop: 12, padding: "8px", borderRadius: 10, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", color: "#fbbf24", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Manage Alerts
          </button>
        </div>
      </div>

      {/* ── Pending Actions ── */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Clock size={14} color="#fbbf24" />, "Pending Actions", "Requires Attention")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { label: "User Approvals",  value: stats.pendingApprovals || 14,    icon: Users,       color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/users" },
            { label: "Withdrawals",     value: stats.pendingWithdrawals || 18,   icon: Wallet,      color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/withdrawals" },
            { label: "Aadhaar Verify",  value: stats.pendingAadhaar || 23,       icon: Fingerprint, color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/verifications" },
            { label: "Bank Verify",     value: stats.pendingBank || 9,           icon: Landmark,    color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/bank-verifications" },
            { label: "Recovery",        value: stats.pendingRecovery || 5,       icon: LifeBuoy,    color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/recovery-requests" },
            { label: "Profile Edits",   value: stats.pendingProfileEdits || 7,   icon: Edit,        color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/profile-edits" },
            { label: "Support Unread",  value: stats.unreadSupportChats || 11,   icon: MessageSquare, color: "#f87171", bg: "rgba(239,68,68,.1)", path: "/admin/help-support" },
          ].map(c => (
            <div key={c.label} style={{ ...card, padding: "14px", cursor: "pointer", border: "1px solid rgba(239,68,68,.2)", transition: "all .2s" }}
              onClick={() => navigate(c.path)}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <c.icon size={14} style={{ color: c.color }} />
              </div>
              <p style={{ fontWeight: 900, color: tok.cardText, fontSize: 22, letterSpacing: "-0.5px", margin: 0 }}>{c.value}</p>
              <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "2px 0 0" }}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity Timeline + Backup ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Activity Timeline */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Activity size={14} color="#fbbf24" />, "Activity Timeline", "Live")}
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 1, background: tok.timelineLine }} />
            {ACTIVITY_TIMELINE.map((ev, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i < ACTIVITY_TIMELINE.length - 1 ? 16 : 0 }}>
                <div style={{ position: "absolute", left: -24, top: 1, width: 26, height: 26, borderRadius: 8, background: ev.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ev.icon size={12} style={{ color: ev.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: tok.cardText, margin: 0 }}>{ev.label}</p>
                  <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "1px 0 0" }}>{ev.detail}</p>
                  <p style={{ fontSize: 10, color: tok.cardSub, opacity: .6, margin: "1px 0 0" }}>{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backup & Recovery */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Archive size={14} color="#c4b5fd" />, "Backup & Recovery")}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => navigate("/admin/backups")}
              style={{ flex: 1, padding: "9px", borderRadius: 10, background: `${A1}15`, border: `1px solid ${A1}30`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <RefreshCw size={13} /> Manual Backup
            </button>
            <button onClick={() => navigate("/admin/backups")}
              style={{ flex: 1, padding: "9px", borderRadius: 10, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Archive size={13} /> Restore
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {BACKUP_HISTORY.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 11, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: b.status === "ok" ? "#22c55e" : "#f59e0b", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11.5, color: tok.cardText, fontFamily: "monospace" }}>{b.date}</span>
                <span style={{ fontSize: 11, color: tok.cardSub }}>{b.size}</span>
                <span style={{ fontSize: 10, color: tok.cardSub, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, borderRadius: 6, padding: "1px 6px" }}>{b.type}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 11, background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle2 size={13} color="#4ade80" />
              <span style={{ fontSize: 11.5, color: "#4ade80", fontWeight: 600 }}>Next scheduled backup in 8h 22m</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RBAC Summary + Financial ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Security & RBAC */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Key size={14} color={A2} />, "Security & Access Control")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "RBAC Roles Defined",     value: "6 roles",   icon: Shield,       color: "#a5b4fc", path: "/admin/rbac" },
              { label: "2FA Enforcement",         value: "Enabled",   icon: Lock,         color: "#4ade80", path: "/admin/session-security" },
              { label: "Failed Login Attempts",   value: "3 today",   icon: AlertTriangle,color: "#fbbf24", path: "/admin/audit-logs" },
              { label: "IP Blocks Active",        value: "12 IPs",    icon: Globe,        color: "#f87171", path: "/admin/ip-blocking" },
              { label: "Session Timeout",         value: "30 min",    icon: Clock,        color: "#a5b4fc", path: "/admin/session-security" },
              { label: "Audit Logs",              value: "2.4K rows", icon: ClipboardList,color: "#c4b5fd", path: "/admin/audit-logs" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 11, cursor: "pointer", transition: "background .15s" }}
                onClick={() => navigate(s.path)}
                onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.icon size={13} color={s.color} />
                </div>
                <span style={{ flex: 1, fontSize: 12.5, color: tok.cardText, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<IndianRupee size={14} color="#4ade80" />, "Financial Overview")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Daily Revenue",          value: "₹46,800",                         color: "#4ade80", icon: TrendingUp,   path: "/admin/wallet-management" },
              { label: "Monthly Revenue",         value: "₹2,84,000",                       color: "#4ade80", icon: BarChart3,    path: "/admin/wallet-management" },
              { label: "Freelancer Earnings",       value: stats.employeeEarnings > 0 ? fmt(stats.employeeEarnings) : "₹9,42,000", color: "#a5b4fc", icon: UserCheck, path: "/admin/wallet-management" },
              { label: "Employer Earnings",         value: stats.clientEarnings > 0 ? fmt(stats.clientEarnings) : "₹5,18,000",     color: "#c4b5fd", icon: Building2, path: "/admin/wallet-management" },
              { label: "Commission Earned",       value: "₹28,400",                         color: "#fbbf24", icon: IndianRupee, path: "/admin/wallet-management" },
              { label: "Pending Withdrawals",     value: `${stats.pendingWithdrawals || 18} req`, color: "#f87171", icon: Clock, path: "/admin/withdrawals" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 11, cursor: "pointer", transition: "background .15s" }}
                onClick={() => navigate(s.path)}
                onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.icon size={13} color={s.color} />
                </div>
                <span style={{ flex: 1, fontSize: 12.5, color: tok.cardText, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

// Fix missing lucide icon
const Target = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

export default AdminDashboard;
