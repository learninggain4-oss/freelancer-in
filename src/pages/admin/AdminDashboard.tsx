import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Clock, Wallet, Fingerprint, Landmark,
  LifeBuoy, Briefcase, Edit, UserCheck, Building2,
  IndianRupee, UserPlus, MessageSquare, TrendingUp,
  ArrowUpRight, Shield, Activity, ShieldAlert, Server,
  Cpu, HardDrive, Wifi, AlertTriangle, Lock,
  BarChart3, Zap, XCircle, Info, CheckCircle2,
  CreditCard, Globe, RefreshCw, Archive, Key,
  ClipboardList, Monitor, Bell, Database,
} from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar,
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

interface TimelineEvent {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
  detail: string;
  time: string;
}

interface RevenuePoint { month: string; revenue: number; commission: number; }
interface GrowthPoint  { week: string; freelancers: number; employers: number; }

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { month: "short" });

const weekLabel = (iso: string) => {
  const d = new Date(iso);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `W${week}`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, themeKey } = useAdminTheme();
  const tok = TH[themeKey];

  const [stats, setStats] = useState({
    totalUsers: 0, pendingApprovals: 0, approvedUsers: 0,
    pendingWithdrawals: 0, pendingAadhaar: 0, pendingBank: 0,
    pendingRecovery: 0, totalJobs: 0, pendingProfileEdits: 0,
    totalEmployees: 0, totalClients: 0, employeeEarnings: 0,
    clientEarnings: 0, unreadSupportChats: 0, activeUsers: 0,
  });
  const [loaded, setLoaded]           = useState(false);
  const [sysRefreshing, setSysRefreshing] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [growthData, setGrowthData]   = useState<GrowthPoint[]>([]);
  const [timeline, setTimeline]       = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
      const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();

      const [
        profiles, withdrawals, aadhaar, bank, recovery,
        jobs, transactions, referredProfiles, supportMessages,
        recentProfiles, recentWithdrawals, txHistory, profileGrowth,
      ] = await Promise.all([
        supabase.from("profiles").select("id, approval_status, user_type, edit_request_status"),
        supabase.from("withdrawals").select("id").eq("status", "pending"),
        supabase.from("aadhaar_verifications").select("id").eq("status", "pending"),
        supabase.from("bank_verifications").select("id").eq("status", "pending"),
        supabase.from("recovery_requests").select("id").eq("status", "pending"),
        supabase.from("projects").select("id", { count: "exact" }),
        supabase.from("transactions").select("profile_id, amount, type"),
        supabase.from("profiles").select("id, user_type, referred_by").not("referred_by", "is", null),
        supabase.from("messages").select("id, is_read, chat_room_id, chat_rooms!inner(type)").eq("is_read", false).eq("chat_rooms.type", "support"),
        supabase.from("profiles").select("id, full_name, user_type, district, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("withdrawals").select("id, amount, profile_id, created_at, status").order("created_at", { ascending: false }).limit(3),
        supabase.from("transactions").select("amount, created_at, type").gte("created_at", sixMonthsAgo).eq("type", "credit"),
        supabase.from("profiles").select("user_type, created_at").gte("created_at", fourWeeksAgo),
      ]);

      const allProfiles     = profiles.data || [];
      const allTransactions = transactions.data || [];
      const employeeIds     = new Set(allProfiles.filter(p => p.user_type === "employee").map(p => p.id));
      const clientIds       = new Set(allProfiles.filter(p => p.user_type === "client").map(p => p.id));
      const employeeEarnings = allTransactions.filter(t => t.type === "credit" && employeeIds.has(t.profile_id)).reduce((s, t) => s + Number(t.amount), 0);
      const clientEarnings   = allTransactions.filter(t => t.type === "credit" && clientIds.has(t.profile_id)).reduce((s, t) => s + Number(t.amount), 0);

      setStats({
        totalUsers:          allProfiles.length,
        pendingApprovals:    allProfiles.filter(p => p.approval_status === "pending").length,
        approvedUsers:       allProfiles.filter(p => p.approval_status === "approved").length,
        pendingWithdrawals:  withdrawals.data?.length || 0,
        pendingAadhaar:      aadhaar.data?.length || 0,
        pendingBank:         bank.data?.length || 0,
        pendingRecovery:     recovery.data?.length || 0,
        totalJobs:           jobs.count || jobs.data?.length || 0,
        pendingProfileEdits: allProfiles.filter(p => p.edit_request_status === "requested").length,
        totalEmployees:      allProfiles.filter(p => p.user_type === "employee").length,
        totalClients:        allProfiles.filter(p => p.user_type === "client").length,
        employeeEarnings, clientEarnings,
        unreadSupportChats:  supportMessages.data?.length || 0,
        activeUsers:         allProfiles.filter(p => p.approval_status === "approved").length,
      });

      /* ── Revenue chart: group by month ── */
      const revMap: Record<string, number> = {};
      for (const tx of txHistory.data || []) {
        const m = monthLabel(tx.created_at);
        revMap[m] = (revMap[m] || 0) + Number(tx.amount);
      }
      setRevenueData(Object.entries(revMap).map(([month, revenue]) => ({
        month, revenue, commission: Math.round(revenue * 0.1),
      })));

      /* ── User growth chart: group by week ── */
      const growthMap: Record<string, { freelancers: number; employers: number }> = {};
      for (const p of profileGrowth.data || []) {
        const w = weekLabel(p.created_at);
        if (!growthMap[w]) growthMap[w] = { freelancers: 0, employers: 0 };
        if (p.user_type === "employee") growthMap[w].freelancers++;
        if (p.user_type === "client")   growthMap[w].employers++;
      }
      setGrowthData(Object.entries(growthMap).map(([week, d]) => ({ week, ...d })));

      /* ── Activity timeline from real DB events ── */
      const events: TimelineEvent[] = [];
      for (const p of (recentProfiles.data || []).slice(0, 4)) {
        events.push({
          icon: UserPlus, color: "#4ade80", bg: "rgba(34,197,94,.15)",
          label: `New ${p.user_type === "employee" ? "freelancer" : "employer"} registered`,
          detail: `${p.full_name || "—"} · ${p.district || "—"}`,
          time: relTime(p.created_at),
        });
      }
      for (const w of (recentWithdrawals.data || []).slice(0, 3)) {
        events.push({
          icon: CreditCard, color: "#f87171", bg: "rgba(239,68,68,.15)",
          label: "Withdrawal request",
          detail: `₹${Number(w.amount).toLocaleString("en-IN")} · ${w.status}`,
          time: relTime(w.created_at),
        });
      }
      events.sort((a, b) => {
        const toMs = (t: string) => {
          const m = t.match(/(\d+)\s*(min|hr|d)/);
          if (!m) return 0;
          const n = Number(m[1]);
          if (m[2] === "min") return n * 60000;
          if (m[2] === "hr")  return n * 3600000;
          return n * 86400000;
        };
        return toMs(a.time) - toMs(b.time);
      });
      setTimeline(events.slice(0, 6));

      setLoaded(true);
    };
    fetchAll();
  }, []);

  const fmt      = (val: number) => `₹${val.toLocaleString("en-IN")}`;
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
      <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.secTitle, flex: 1, margin: 0 }}>{title}</h2>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor || "#a5b4fc", background: `${badgeColor || "#a5b4fc"}18`, borderRadius: 20, padding: "2px 10px" }}>{badge}</span>}
    </div>
  );

  const alertIcon = (type: string) => {
    if (type === "ok")    return <CheckCircle2 size={13} color="#4ade80" />;
    if (type === "warn")  return <AlertTriangle size={13} color="#fbbf24" />;
    if (type === "alert") return <XCircle size={13} color="#f87171" />;
    return <Info size={13} color="#a5b4fc" />;
  };

  const topCards = [
    { label: "Total Users",      value: stats.totalUsers,        icon: Users,        color: "#a5b4fc", bg: "rgba(99,102,241,.14)",  trend: "+12%", up: true,  path: "/admin/users" },
    { label: "Active Users",     value: stats.activeUsers,       icon: Activity,     color: "#4ade80", bg: "rgba(34,197,94,.12)",   trend: "+8%",  up: true,  path: "/admin/sessions" },
    { label: "Total Employers",  value: stats.totalClients,      icon: Building2,    color: "#c4b5fd", bg: "rgba(139,92,246,.12)",  trend: "+5%",  up: true,  path: "/admin/employers" },
    { label: "Freelancers",      value: stats.totalEmployees,    icon: UserCheck,    color: "#a5b4fc", bg: "rgba(99,102,241,.14)",  trend: "+15%", up: true,  path: "/admin/freelancers" },
    { label: "Total Jobs",       value: stats.totalJobs,         icon: Briefcase,    color: "#4ade80", bg: "rgba(34,197,94,.12)",   trend: "+22%", up: true,  path: "/admin/jobs" },
    { label: "Total Revenue",    value: totalRev > 0 ? fmt(totalRev) : "₹0", icon: IndianRupee, color: "#4ade80", bg: "rgba(34,197,94,.12)", trend: "+18%", up: true, path: "/admin/wallet-management" },
    { label: "Pending Payments", value: stats.pendingWithdrawals, icon: Clock,       color: "#fbbf24", bg: "rgba(245,158,11,.14)",  trend: "Hold", up: false, path: "/admin/withdrawals", urgent: stats.pendingWithdrawals > 0 },
    { label: "Support Tickets",  value: stats.unreadSupportChats, icon: MessageSquare, color: "#fbbf24", bg: "rgba(245,158,11,.14)", trend: "Open", up: false, path: "/admin/help-support", urgent: stats.unreadSupportChats > 0 },
    { label: "Pending Approvals",value: stats.pendingApprovals,  icon: UserCheck,    color: "#fbbf24", bg: "rgba(245,158,11,.14)",  trend: "Hold", up: false, path: "/admin/users",         urgent: stats.pendingApprovals > 0 },
    { label: "Pending Aadhaar",  value: stats.pendingAadhaar,    icon: Fingerprint,  color: "#f87171", bg: "rgba(239,68,68,.12)",   trend: "KYC",  up: false, path: "/admin/verifications", urgent: stats.pendingAadhaar > 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Hero Section ── */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: "26px 28px 22px", background: tok.heroGrad, border: `1px solid ${tok.heroBdr}` }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, background: tok.orbA, filter: "blur(30px)" }} />
        <div style={{ position: "absolute", bottom: -30, left: 60, width: 100, height: 100, borderRadius: "50%", background: tok.orbB, filter: "blur(20px)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.15)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.2)" }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.5px", margin: 0, color: "white" }}>Super Admin Dashboard</h1>
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
              { label: "Users",        value: stats.totalUsers,                            icon: Users,        color: "#a5b4fc" },
              { label: "Pending",      value: stats.pendingApprovals,                      icon: Clock,        color: "#fbbf24" },
              { label: "Revenue",      value: totalRev > 0 ? fmt(totalRev) : "₹0",         icon: IndianRupee,  color: "#4ade80" },
              { label: "Support",      value: stats.unreadSupportChats,                    icon: MessageSquare,color: "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px 14px", borderRadius: 14, background: tok.statBox, border: `1px solid ${tok.statBdr}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <s.icon size={13} style={{ color: s.color }} />
                  <span style={{ fontSize: 10.5, color: tok.statSub }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 900, color: tok.statTxt, margin: 0 }}>
                  {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Platform Overview Cards ── */}
      <div style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(12px)", transition: "all .4s ease" }}>
        {sectionHeader(<BarChart3 size={14} color={A1} />, "Platform Overview", "Live Data", "#4ade80")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 12 }}>
          {topCards.map(c => (
            <div key={c.label}
              style={{ ...card, padding: "16px", cursor: "pointer", border: (c as any).urgent ? "1px solid rgba(239,68,68,.3)" : `1px solid ${tok.cardBdr}` }}
              onClick={() => navigate(c.path)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <c.icon size={15} style={{ color: c.color }} />
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: c.up ? "#4ade80" : "#fbbf24", background: c.up ? "rgba(34,197,94,.12)" : "rgba(245,158,11,.12)", borderRadius: 20, padding: "1px 7px" }}>
                  {c.trend}
                </span>
              </div>
              <p style={{ fontWeight: 900, color: tok.cardText, fontSize: typeof c.value === "string" ? 15 : 22, letterSpacing: "-0.5px", margin: 0 }}>
                {typeof c.value === "number" ? c.value.toLocaleString() : c.value}
              </p>
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

      {/* ── Revenue Chart + User Growth ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Revenue Analytics */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<TrendingUp size={14} color="#4ade80" />, "Revenue Analytics", "6 months")}
          {revenueData.length === 0 ? (
            <div style={{ height: 170, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <BarChart3 size={28} color={tok.cardSub} />
              <p style={{ fontSize: 12, color: tok.cardSub, margin: 0 }}>No transaction data yet</p>
            </div>
          ) : (
            <div style={{ height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
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
                  <YAxis tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 11 }}
                    formatter={(v: number, n: string) => [`₹${v.toLocaleString("en-IN")}`, n === "revenue" ? "Revenue" : "Commission"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                  <Area type="monotone" dataKey="commission" stroke={A1} strokeWidth={2} fill="url(#commGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            {[
              { label: "Total Revenue",   value: fmt(totalRev),                   color: "#4ade80" },
              { label: "Commission (10%)", value: fmt(Math.round(totalRev * 0.1)), color: "#a5b4fc" },
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
          {growthData.length === 0 ? (
            <div style={{ height: 170, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <Users size={28} color={tok.cardSub} />
              <p style={{ fontSize: 12, color: tok.cardSub, margin: 0 }}>No registrations in last 4 weeks</p>
            </div>
          ) : (
            <div style={{ height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="freelancers" fill={A1} radius={[4, 4, 0, 0]} name="Freelancers" />
                  <Bar dataKey="employers" fill="#4ade80" radius={[4, 4, 0, 0]} name="Employers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: A1 }} />
              <span style={{ fontSize: 10, color: tok.cardSub }}>Freelancers</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#4ade80" }} />
              <span style={{ fontSize: 10, color: tok.cardSub }}>Employers</span>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "CPU",    icon: Cpu,       note: "Server-side metric" },
            { label: "Memory", icon: Monitor,   note: "Server-side metric" },
            { label: "Disk",   icon: HardDrive, note: "Server-side metric" },
          ].map(r => (
            <div key={r.label} style={{ padding: "14px", borderRadius: 12, background: tok.sysRowBg, border: `1px solid ${tok.alertBdr}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <r.icon size={22} color={tok.cardSub} />
              <span style={{ fontSize: 12, fontWeight: 700, color: tok.cardText }}>{r.label}</span>
              <span style={{ fontSize: 10, color: tok.cardSub, textAlign: "center" }}>{r.note}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 14px", borderRadius: 11, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, display: "flex", alignItems: "center", gap: 10 }}>
          <Info size={14} color="#a5b4fc" />
          <span style={{ fontSize: 12, color: tok.cardSub }}>
            Server-side metrics (CPU, Memory, Disk) require a backend monitoring agent.
            Use <span style={{ color: "#a5b4fc", fontWeight: 600, cursor: "pointer" }} onClick={() => navigate("/admin/server-monitor")}>Full View</span> for detailed server health.
          </span>
        </div>
      </div>

      {/* ── Pending Actions ── */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Clock size={14} color="#fbbf24" />, "Pending Actions", "Requires Attention")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { label: "User Approvals",  value: stats.pendingApprovals,    icon: Users,        color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/users" },
            { label: "Withdrawals",     value: stats.pendingWithdrawals,   icon: Wallet,       color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/withdrawals" },
            { label: "Aadhaar Verify",  value: stats.pendingAadhaar,       icon: Fingerprint,  color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/verifications" },
            { label: "Bank Verify",     value: stats.pendingBank,          icon: Landmark,     color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/bank-verifications" },
            { label: "Recovery",        value: stats.pendingRecovery,      icon: LifeBuoy,     color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/recovery-requests" },
            { label: "Profile Edits",   value: stats.pendingProfileEdits,  icon: Edit,         color: "#fbbf24", bg: "rgba(245,158,11,.12)", path: "/admin/profile-edits" },
            { label: "Support Unread",  value: stats.unreadSupportChats,   icon: MessageSquare,color: "#f87171", bg: "rgba(239,68,68,.1)",   path: "/admin/help-support" },
          ].map(c => (
            <div key={c.label} style={{ ...card, padding: "14px", cursor: "pointer", border: c.value > 0 ? "1px solid rgba(239,68,68,.2)" : `1px solid ${tok.cardBdr}`, transition: "all .2s" }}
              onClick={() => navigate(c.path)}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <c.icon size={14} style={{ color: c.color }} />
              </div>
              <p style={{ fontWeight: 900, color: c.value > 0 ? c.color : tok.cardText, fontSize: 22, letterSpacing: "-0.5px", margin: 0 }}>{c.value}</p>
              <p style={{ fontSize: 10.5, color: tok.cardSub, margin: "2px 0 0" }}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity Timeline + Financial Overview ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Activity Timeline — real DB data */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<Activity size={14} color="#fbbf24" />, "Activity Timeline", "Live")}
          {timeline.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, padding: "32px 0" }}>
              <Activity size={28} color={tok.cardSub} />
              <p style={{ fontSize: 12, color: tok.cardSub, margin: 0 }}>No recent activity</p>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 28 }}>
              <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 1, background: tok.timelineLine }} />
              {timeline.map((ev, i) => (
                <div key={i} style={{ position: "relative", paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
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
          )}
        </div>

        {/* Financial Overview — real values only */}
        <div style={{ ...card, padding: "18px" }}>
          {sectionHeader(<IndianRupee size={14} color="#4ade80" />, "Financial Overview")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Total Revenue",        value: fmt(totalRev),                                                color: "#4ade80", icon: TrendingUp,  path: "/admin/wallet-management" },
              { label: "Freelancer Earnings",  value: fmt(stats.employeeEarnings),                                 color: "#a5b4fc", icon: UserCheck,   path: "/admin/wallet-management" },
              { label: "Employer Earnings",    value: fmt(stats.clientEarnings),                                   color: "#c4b5fd", icon: Building2,   path: "/admin/wallet-management" },
              { label: "Platform Commission",  value: fmt(Math.round(totalRev * 0.1)),                             color: "#fbbf24", icon: IndianRupee, path: "/admin/wallet-management" },
              { label: "Pending Withdrawals",  value: `${stats.pendingWithdrawals} req`,                           color: stats.pendingWithdrawals > 0 ? "#f87171" : "#4ade80", icon: Clock, path: "/admin/withdrawals" },
              { label: "Approved Users",       value: `${stats.approvedUsers} of ${stats.totalUsers}`,            color: "#4ade80", icon: UserCheck,   path: "/admin/users" },
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

      {/* ── Quick Access ── */}
      <div style={{ ...card, padding: "18px" }}>
        {sectionHeader(<Wifi size={14} color={A1} />, "Quick Access", "All Sections")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {[
            { label: "Users",           path: "/admin/users",             icon: Users,        color: "#a5b4fc" },
            { label: "Freelancers",     path: "/admin/freelancers",       icon: UserCheck,    color: "#a5b4fc" },
            { label: "Employers",       path: "/admin/employers",         icon: Building2,    color: "#c4b5fd" },
            { label: "Jobs",            path: "/admin/jobs",              icon: Briefcase,    color: "#4ade80" },
            { label: "Wallet",          path: "/admin/wallet-management", icon: Wallet,       color: "#4ade80" },
            { label: "Withdrawals",     path: "/admin/withdrawals",       icon: IndianRupee,  color: "#fbbf24" },
            { label: "Verifications",   path: "/admin/verifications",     icon: Fingerprint,  color: "#fbbf24" },
            { label: "Bank Verify",     path: "/admin/bank-verifications",icon: Landmark,     color: "#fbbf24" },
            { label: "Audit Logs",      path: "/admin/audit-logs",        icon: ClipboardList,color: "#c4b5fd" },
            { label: "Server Monitor",  path: "/admin/server-monitor",    icon: Server,       color: "#4ade80" },
            { label: "Support",         path: "/admin/help-support",      icon: MessageSquare,color: "#f87171" },
            { label: "IP Blocking",     path: "/admin/ip-blocking",       icon: Globe,        color: "#f87171" },
          ].map(q => (
            <button key={q.label} onClick={() => navigate(q.path)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 10px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}`, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${q.color}12`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${q.color}30`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = tok.alertBg; (e.currentTarget as HTMLButtonElement).style.borderColor = tok.alertBdr; }}>
              <q.icon size={18} color={q.color} />
              <span style={{ fontSize: 10.5, color: tok.cardText, fontWeight: 600, textAlign: "center" }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
