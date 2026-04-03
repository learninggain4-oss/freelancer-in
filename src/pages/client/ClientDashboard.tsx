import { useEffect, useCallback, useMemo, useState } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wallet, Briefcase, Plus, Users, IndianRupee, ChevronRight,
  ArrowDownToLine, Loader2, Sparkles, Activity, FolderOpen, Star,
  CheckCircle, Clock, Target, BarChart3, MessageSquare, HeadphonesIcon,
  FileText, Zap, AlertTriangle, Info, XCircle, UserCheck,
  TrendingUp, ShieldCheck, ArrowUpRight, Bookmark, ClipboardList,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, BarChart, Bar, YAxis } from "recharts";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: {
    cardBg:   "rgba(255,255,255,.05)", cardBdr: "rgba(255,255,255,.08)",
    text:     "rgba(255,255,255,.88)", sub: "rgba(255,255,255,.4)",
    rowHover: "rgba(255,255,255,.04)", pullFg: "rgba(255,255,255,.4)",
    chartTip: { background: "rgba(13,13,36,.95)", border: "1px solid rgba(255,255,255,.1)", color: "white" },
    chartAxis:"rgba(255,255,255,.3)",
    emptyBg:  "rgba(255,255,255,.05)", emptyFg: "rgba(255,255,255,.2)", emptySub: "rgba(255,255,255,.25)",
    alertBg:  "rgba(255,255,255,.04)", alertBdr: "rgba(255,255,255,.06)",
    timelineLine: "rgba(255,255,255,.1)",
    badgeBg:  "rgba(255,255,255,.06)", badgeFg: "rgba(255,255,255,.35)",
  },
  white: {
    cardBg:   "#ffffff", cardBdr: "rgba(0,0,0,.08)",
    text:     "#0d0d24", sub: "#6b7280",
    rowHover: "rgba(0,0,0,.03)", pullFg: "#9ca3af",
    chartTip: { background: "#ffffff", border: "1px solid rgba(0,0,0,.1)", color: "#0d0d24" },
    chartAxis:"#9ca3af",
    emptyBg:  "#f1f5f9", emptyFg: "#9ca3af", emptySub: "#9ca3af",
    alertBg:  "#f8faff", alertBdr: "rgba(0,0,0,.06)",
    timelineLine: "rgba(0,0,0,.08)",
    badgeBg:  "#f1f5f9", badgeFg: "#6b7280",
  },
  wb: {
    cardBg:   "#ffffff", cardBdr: "rgba(0,0,0,.08)",
    text:     "#0d0d24", sub: "#6b7280",
    rowHover: "rgba(0,0,0,.03)", pullFg: "#9ca3af",
    chartTip: { background: "#ffffff", border: "1px solid rgba(0,0,0,.1)", color: "#0d0d24" },
    chartAxis:"#9ca3af",
    emptyBg:  "#f1f5f9", emptyFg: "#9ca3af", emptySub: "#9ca3af",
    alertBg:  "#f8faff", alertBdr: "rgba(0,0,0,.06)",
    timelineLine: "rgba(0,0,0,.08)",
    badgeBg:  "#f1f5f9", badgeFg: "#6b7280",
  },
};

const MOCK_ALERTS = [
  { type: "success", msg: "Proposal accepted by Ravi Kumar — ₹38,000", time: "5 min ago", urgent: false },
  { type: "info",    msg: "3 new proposals received for Website Redesign", time: "30 min ago", urgent: false },
  { type: "warning", msg: "Contract deadline in 3 days — Mobile App Dev", time: "2 hr ago", urgent: true },
  { type: "info",    msg: "Payment of ₹12,000 processed successfully", time: "4 hr ago", urgent: false },
];

const MOCK_TIMELINE = [
  { icon: Plus,        color: "#a5b4fc", bg: "rgba(99,102,241,.15)",  label: "Job posted",           detail: "Website Redesign — ₹24,000 budget", time: "Today, 9:00 AM" },
  { icon: UserCheck,   color: "#4ade80", bg: "rgba(34,197,94,.15)",   label: "Freelancer hired",     detail: "Ravi Kumar — Mobile App Development", time: "Yesterday, 3:30 PM" },
  { icon: IndianRupee, color: "#4ade80", bg: "rgba(34,197,94,.15)",   label: "Payment completed",    detail: "₹12,000 released to Priya Sharma", time: "2 days ago" },
  { icon: CheckCircle, color: "#c4b5fd", bg: "rgba(139,92,246,.15)",  label: "Contract closed",      detail: "Logo Design project completed", time: "3 days ago" },
  { icon: Users,       color: "#fbbf24", bg: "rgba(245,158,11,.15)",  label: "Proposal received",    detail: "5 proposals for UI/UX Design job", time: "4 days ago" },
];

const MOCK_SPENDING = [
  { month: "Aug", amount: 18000 },
  { month: "Sep", amount: 32000 },
  { month: "Oct", amount: 24000 },
  { month: "Nov", amount: 41000 },
  { month: "Dec", amount: 28000 },
];

const MOCK_CONTRACTS = [
  { freelancer: "Ravi Kumar",    job: "Mobile App Dev",    amount: "₹38,000", start: "Dec 1", status: "Active",    statusColor: "#4ade80" },
  { freelancer: "Priya Sharma",  job: "UI/UX Design",      amount: "₹22,000", start: "Nov 28", status: "Active",  statusColor: "#4ade80" },
  { freelancer: "Arjun Mehta",   job: "Backend API",       amount: "₹45,000", start: "Nov 15", status: "Done",    statusColor: "#a5b4fc" },
];

const ClientDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, themeKey } = useDashboardTheme();
  const tok = TH[themeKey];
  const [chartTab, setChartTab] = useState<"spending" | "jobs">("spending");

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      queryClient.invalidateQueries({ queryKey: ["client-active-projects", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["client-recent-requests", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["client-completed-projects", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["client-spending-total", profile?.id] }),
    ]);
  }, [profile?.id, queryClient, refreshProfile]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel("client-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `client_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["client-active-projects", profile.id] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_applications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["client-recent-requests", profile.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient, refreshProfile]);

  const { data: activeCount = 0 } = useQuery({
    queryKey: ["client-active-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("client_id", profile.id).in("status", ["open", "in_progress"]);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: completedCount = 0 } = useQuery({
    queryKey: ["client-completed-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("client_id", profile.id).eq("status", "completed");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: totalJobsPosted = 0 } = useQuery({
    queryKey: ["client-total-jobs", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("client_id", profile.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: recentRequests = [], isLoading } = useQuery({
    queryKey: ["client-recent-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.from("project_applications").select("*, employee:employee_id(full_name), project:project_id(name, client_id)").order("applied_at", { ascending: false }).limit(5);
      if (error) throw error;
      return (data ?? []).filter((r: any) => r.project?.client_id === profile.id);
    },
    enabled: !!profile?.id,
  });

  const { data: spendingTotal = 0 } = useQuery({
    queryKey: ["client-spending-total", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { data, error } = await supabase.from("transactions").select("amount").eq("profile_id", profile.id).eq("type", "debit");
      if (error) throw error;
      return (data ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0);
    },
    enabled: !!profile?.id,
  });

  const greeting  = useMemo(() => { const h = new Date().getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; }, []);
  const firstName = Array.isArray(profile?.full_name) ? profile.full_name[0] : (profile?.full_name ?? "there");
  const availBal  = profile?.available_balance ?? 0;
  const holdBal   = profile?.hold_balance ?? 0;
  const proposalsCount = recentRequests.length;

  const summaryStats = [
    { icon: Briefcase,     label: "Jobs Posted",     value: totalJobsPosted,                                 color: "#a5b4fc", bg: "rgba(99,102,241,.14)", trend: "+1",     trendUp: true  },
    { icon: FolderOpen,    label: "Active Jobs",      value: activeCount,                                     color: "#4ade80", bg: "rgba(34,197,94,.12)",  trend: "Live",   trendUp: true  },
    { icon: CheckCircle,   label: "Completed Jobs",   value: completedCount,                                  color: "#c4b5fd", bg: "rgba(139,92,246,.12)", trend: "Done",   trendUp: true  },
    { icon: IndianRupee,   label: "Total Spending",   value: `₹${spendingTotal.toLocaleString("en-IN")}`,    color: "#fbbf24", bg: "rgba(245,158,11,.14)", trend: "+18%",   trendUp: false },
    { icon: Clock,         label: "Pending Payments", value: `₹${holdBal.toLocaleString("en-IN")}`,          color: "#f87171", bg: "rgba(239,68,68,.12)",  trend: "Hold",   trendUp: false },
    { icon: ClipboardList, label: "Active Contracts", value: MOCK_CONTRACTS.filter(c => c.status === "Active").length, color: "#2dd4bf", bg: "rgba(20,184,166,.12)", trend: "Live", trendUp: true },
    { icon: Users,         label: "Proposals",        value: proposalsCount,                                  color: "#fbbf24", bg: "rgba(245,158,11,.12)", trend: "New",    trendUp: true  },
    { icon: Bookmark,      label: "Saved Freelancers",value: 12,                                              color: "#a5b4fc", bg: "rgba(99,102,241,.12)", trend: "Saved",  trendUp: true  },
  ];

  const quickActions = [
    { icon: Plus,            label: "Post Job",   to: "/client/projects/create",  grad: "rgba(99,102,241,.18)", color: "#a5b4fc" },
    { icon: Users,           label: "Hire Now",   to: "/client/projects",          grad: "rgba(34,197,94,.15)",  color: "#4ade80" },
    { icon: MessageSquare,   label: "Messages",   to: "/client/help-support",      grad: "rgba(139,92,246,.18)", color: "#c4b5fd" },
    { icon: Wallet,          label: "Pay Now",    to: "/client/wallet",            grad: "rgba(245,158,11,.15)", color: "#fbbf24" },
    { icon: HeadphonesIcon,  label: "Support",    to: "/client/help-support",      grad: "rgba(239,68,68,.13)",  color: "#f87171" },
    { icon: Star,            label: "Upgrade",    to: "/client/wallet-types",      grad: "rgba(20,184,166,.15)", color: "#2dd4bf" },
  ];

  const card: React.CSSProperties = {
    background: tok.cardBg, border: `1px solid ${tok.cardBdr}`,
    borderRadius: 16, backdropFilter: "blur(12px)",
    boxShadow: theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none",
  };

  const alertIcon = (type: string) => {
    if (type === "success") return <CheckCircle size={13} color="#4ade80" />;
    if (type === "warning") return <AlertTriangle size={13} color="#fbbf24" />;
    if (type === "error")   return <XCircle size={13} color="#f87171" />;
    return <Info size={13} color="#a5b4fc" />;
  };

  const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
    pending:   { bg: "rgba(245,158,11,.12)",  color: "#f59e0b",  border: "rgba(245,158,11,.25)" },
    approved:  { bg: "rgba(34,197,94,.12)",   color: "#4ade80",  border: "rgba(34,197,94,.25)" },
    rejected:  { bg: "rgba(239,68,68,.1)",    color: "#ef4444",  border: "rgba(239,68,68,.2)" },
    completed: { bg: "rgba(139,92,246,.12)",  color: "#c4b5fd",  border: "rgba(139,92,246,.25)" },
  };

  return (
    <div ref={containerRef} style={{ position: "relative", height: "100%", overflowY: "auto" }}>
      {/* Pull-to-refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: "all .2s ease-out", height: pullDistance > 0 ? pullDistance : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: tok.pullFg }}>
          <Loader2 size={18} style={{ color: A1, animation: refreshing ? "spin 1s linear infinite" : "none", transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)` }} />
          <span>{refreshing ? "Refreshing…" : pullDistance >= 80 ? "Release to refresh" : "Pull to refresh"}</span>
        </div>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18, paddingBottom: 32 }}>

        {/* ── Greeting ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={15} style={{ color: "#fbbf24" }} />
            <p style={{ fontSize: 12.5, color: tok.sub, fontWeight: 500, margin: 0 }}>{greeting}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <h2 style={{ margin: 0, fontSize: 23, fontWeight: 900, color: tok.text, letterSpacing: "-0.5px" }}>
              {typeof firstName === "string" ? firstName : "there"} 👋
            </h2>
            <button onClick={() => navigate("/client/projects/create")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 11, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,.35)" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <Plus size={13} /> Post Job
            </button>
          </div>
        </div>

        {/* ── Wallet Card ── */}
        <WalletCard
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Client"}
          userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
          walletNumber={profile?.wallet_number}
          availableBalance={profile?.available_balance ?? 0}
          holdBalance={profile?.hold_balance ?? 0}
          walletActive={(profile as any)?.wallet_active ?? true}
        />

        {/* ── Wallet Type Badge ── */}
        <WalletTypeBadge balance={profile?.available_balance ?? 0} />

        {/* ── 8 Summary Stats ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={12} color="#a5b4fc" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Business Overview</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {summaryStats.map(s => (
              <div key={s.label} style={{ ...card, padding: "14px 14px", display: "flex", alignItems: "center", gap: 11, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at top right,${s.bg} 0%,transparent 70%)` }} />
                <div style={{ width: 38, height: 38, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                  <p style={{ fontWeight: 900, color: tok.text, fontSize: 15, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: tok.sub, fontWeight: 600, margin: "1px 0 0", lineHeight: 1.2 }}>{s.label}</p>
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: s.trendUp ? "#4ade80" : "#fbbf24", background: s.trendUp ? "rgba(34,197,94,.12)" : "rgba(245,158,11,.12)", borderRadius: 20, padding: "1px 6px", flexShrink: 0 }}>
                  {s.trend}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Actions (6 buttons) ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={12} color="#c4b5fd" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Quick Actions</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.to)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "14px 8px", borderRadius: 14, ...card, cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: a.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <a.icon size={17} style={{ color: a.color }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: tok.sub, lineHeight: 1.1, textAlign: "center" }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Spending Chart ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["spending", "jobs"].map(tab => (
                <button key={tab} onClick={() => setChartTab(tab as "spending" | "jobs")}
                  style={{ padding: "5px 12px", borderRadius: 8, background: chartTab === tab ? `${A1}20` : "none", border: chartTab === tab ? `1px solid ${A1}40` : "1px solid transparent", color: chartTab === tab ? "#a5b4fc" : tok.sub, fontSize: 11.5, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
                  {tab === "spending" ? "Spending" : "Jobs"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <TrendingUp size={12} color="#fbbf24" />
              <span style={{ fontSize: 11, fontWeight: 700, color: tok.sub }}>Last 5 months</span>
            </div>
          </div>
          <div style={{ height: 140 }}>
            {chartTab === "spending" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SPENDING} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clientSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]} />
                  <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2.5} fill="url(#clientSpendGrad)"
                    dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#f59e0b", stroke: tok.cardBg, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { label: "Posted",    value: totalJobsPosted || 3 },
                  { label: "Active",    value: activeCount },
                  { label: "Completed", value: completedCount },
                ]} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill={A1} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Wallet & Spending Widget ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(99,102,241,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={12} color="#a5b4fc" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Payments Summary</span>
            </div>
            <button onClick={() => navigate("/client/wallet")}
              style={{ display: "flex", alignItems: "center", gap: 3, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Wallet <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Available",     value: `₹${availBal.toLocaleString("en-IN")}`,         color: "#4ade80", bg: "rgba(34,197,94,.1)" },
              { label: "Pending",       value: `₹${holdBal.toLocaleString("en-IN")}`,           color: "#fbbf24", bg: "rgba(245,158,11,.1)" },
              { label: "Total Spent",   value: `₹${spendingTotal.toLocaleString("en-IN")}`,     color: "#f87171", bg: "rgba(239,68,68,.1)" },
              { label: "Contracts",     value: `${MOCK_CONTRACTS.length} active`,                color: "#a5b4fc", bg: "rgba(99,102,241,.1)" },
            ].map(w => (
              <div key={w.label} style={{ padding: "12px", borderRadius: 12, background: w.bg, border: `1px solid ${w.color}20` }}>
                <p style={{ fontSize: 14, fontWeight: 900, color: w.color, margin: 0 }}>{w.value}</p>
                <p style={{ fontSize: 10.5, color: tok.sub, margin: "2px 0 0", fontWeight: 600 }}>{w.label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/client/wallet")}
            style={{ width: "100%", padding: "10px", borderRadius: 11, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 14px rgba(99,102,241,.35)" }}>
            <ArrowDownToLine size={15} />
            Add Funds to Wallet
          </button>
        </div>

        {/* ── Active Contracts ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(20,184,166,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ClipboardList size={12} color="#2dd4bf" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Active Contracts</span>
            </div>
            <span style={{ fontSize: 10, background: "rgba(20,184,166,.1)", color: "#2dd4bf", borderRadius: 20, padding: "1px 8px", fontWeight: 700 }}>
              {MOCK_CONTRACTS.filter(c => c.status === "Active").length} active
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_CONTRACTS.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: `${A1}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Users size={14} color="#a5b4fc" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: tok.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.freelancer}</p>
                  <p style={{ fontSize: 10.5, color: tok.sub, margin: "1px 0 0" }}>{c.job} · {c.amount} · From {c.start}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.statusColor, background: `${c.statusColor}15`, borderRadius: 20, padding: "2px 8px", flexShrink: 0 }}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Proposals Received ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(99,102,241,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={12} color="#a5b4fc" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Proposals Received</span>
            </div>
            <button onClick={() => navigate("/client/projects")}
              style={{ display: "flex", alignItems: "center", gap: 3, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : recentRequests.length > 0 ? (
              recentRequests.map((r: any) => {
                const st = statusStyle[r.status] || statusStyle.pending;
                const name = Array.isArray(r.freelancer?.full_name) ? r.freelancer.full_name.join(" ") : r.freelancer?.full_name ?? "Freelancer";
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: 12, transition: "background .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: theme === "black" ? "rgba(255,255,255,.06)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 800, color: A1 }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: tok.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                      <p style={{ fontSize: 10.5, color: tok.sub, margin: "1px 0 0" }}>{r.project?.name ?? "Job"}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: st.bg, border: `1px solid ${st.border}`, color: st.color, flexShrink: 0, textTransform: "capitalize" }}>
                      {r.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: tok.emptyBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Users size={20} style={{ color: tok.emptyFg }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: tok.sub, margin: 0 }}>No proposals yet</p>
                <p style={{ fontSize: 11, color: tok.emptySub, marginTop: 4 }}>Post a job to start receiving proposals</p>
                <button onClick={() => navigate("/client/projects/create")}
                  style={{ marginTop: 12, padding: "7px 16px", borderRadius: 10, background: `${A1}15`, border: `1px solid ${A1}30`, color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Post a Job
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Jobs ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(139,92,246,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={12} color="#c4b5fd" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Recent Jobs</span>
            </div>
            <button onClick={() => navigate("/client/projects")}
              style={{ display: "flex", alignItems: "center", gap: 3, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          {[
            { title: "Website Redesign",   cat: "Web Dev",    budget: "₹24,000", status: "Open",      statusColor: "#4ade80",  deadline: "Dec 28", posted: "Dec 10" },
            { title: "Mobile App Dev",     cat: "Mobile",     budget: "₹38,000", status: "Active",    statusColor: "#a5b4fc",  deadline: "Jan 15", posted: "Nov 30" },
            { title: "Logo & Branding",    cat: "Design",     budget: "₹8,000",  status: "Completed", statusColor: "#c4b5fd",  deadline: "Dec 20", posted: "Nov 20" },
          ].map((job, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: 12, transition: "background .15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: `${A2}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Briefcase size={14} color="#c4b5fd" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: tok.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</p>
                <p style={{ fontSize: 10.5, color: tok.sub, margin: "1px 0 0" }}>{job.cat} · {job.budget} · Due {job.deadline}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: job.statusColor, background: `${job.statusColor}15`, borderRadius: 20, padding: "2px 8px", flexShrink: 0 }}>
                {job.status}
              </span>
            </div>
          ))}
        </div>

        {/* ── Notifications & Alerts ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(239,68,68,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={12} color="#f87171" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Alerts & Notifications</span>
            </div>
            <span style={{ fontSize: 10, background: "rgba(239,68,68,.12)", color: "#f87171", borderRadius: 20, padding: "1px 8px", fontWeight: 700 }}>
              {MOCK_ALERTS.filter(a => a.urgent).length} urgent
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_ALERTS.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: a.urgent ? "rgba(245,158,11,.06)" : tok.alertBg, border: `1px solid ${a.urgent ? "rgba(245,158,11,.18)" : tok.alertBdr}` }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>{alertIcon(a.type)}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12.5, color: tok.text, margin: 0, fontWeight: 500 }}>{a.msg}</p>
                  <p style={{ fontSize: 10.5, color: tok.sub, margin: "2px 0 0" }}>{a.time}</p>
                </div>
                {a.urgent && <span style={{ fontSize: 9, fontWeight: 800, color: "#fbbf24", background: "rgba(245,158,11,.15)", borderRadius: 10, padding: "1px 6px", flexShrink: 0 }}>URGENT</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Activity Timeline ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(245,158,11,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={12} color="#fbbf24" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Activity Timeline</span>
          </div>
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 1, background: tok.timelineLine }} />
            {MOCK_TIMELINE.map((event, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i < MOCK_TIMELINE.length - 1 ? 18 : 0 }}>
                <div style={{ position: "absolute", left: -24, top: 2, width: 28, height: 28, borderRadius: 9, background: event.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <event.icon size={13} style={{ color: event.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: tok.text, margin: 0 }}>{event.label}</p>
                  <p style={{ fontSize: 11, color: tok.sub, margin: "2px 0 1px" }}>{event.detail}</p>
                  <p style={{ fontSize: 10, color: tok.sub, opacity: 0.6, margin: 0 }}>{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientDashboard;
