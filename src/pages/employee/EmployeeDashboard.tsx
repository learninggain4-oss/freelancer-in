import { useEffect, useCallback, useMemo, useState } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wallet, Briefcase, ArrowDownToLine, TrendingUp,
  IndianRupee, ChevronRight, FileText, Loader2, Sparkles,
  Activity, ArrowUpRight, ArrowDownRight, CalendarDays,
  CircleDollarSign, Star, CheckCircle, Clock, Bell,
  ShieldCheck, Target, BarChart3, Upload, HeadphonesIcon,
  Gift, Zap, XCircle, Info, AlertTriangle, UserCheck,
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
    emptyBg:  "rgba(255,255,255,.05)", emptyFg: "rgba(255,255,255,.2)",
    emptySub: "rgba(255,255,255,.25)",
    badgeBg:  "rgba(255,255,255,.06)", badgeFg: "rgba(255,255,255,.35)",
    sectionIconBg: (color: string) => `${color}22`,
    alertBg: "rgba(255,255,255,.04)",
    alertBdr: "rgba(255,255,255,.06)",
    timelineLine: "rgba(255,255,255,.1)",
  },
  white: {
    cardBg:   "#ffffff", cardBdr: "rgba(0,0,0,.08)",
    text:     "#0d0d24", sub: "#6b7280",
    rowHover: "rgba(0,0,0,.03)", pullFg: "#9ca3af",
    chartTip: { background: "#ffffff", border: "1px solid rgba(0,0,0,.1)", color: "#0d0d24" },
    chartAxis:"#9ca3af",
    emptyBg:  "#f1f5f9", emptyFg: "#9ca3af",
    emptySub: "#9ca3af",
    badgeBg:  "#f1f5f9", badgeFg: "#6b7280",
    sectionIconBg: (color: string) => `${color}18`,
    alertBg: "#f8faff",
    alertBdr: "rgba(0,0,0,.06)",
    timelineLine: "rgba(0,0,0,.08)",
  },
  wb: {
    cardBg:   "#ffffff", cardBdr: "rgba(0,0,0,.08)",
    text:     "#0d0d24", sub: "#6b7280",
    rowHover: "rgba(0,0,0,.03)", pullFg: "#9ca3af",
    chartTip: { background: "#ffffff", border: "1px solid rgba(0,0,0,.1)", color: "#0d0d24" },
    chartAxis:"#9ca3af",
    emptyBg:  "#f1f5f9", emptyFg: "#9ca3af",
    emptySub: "#9ca3af",
    badgeBg:  "#f1f5f9", badgeFg: "#6b7280",
    sectionIconBg: (color: string) => `${color}18`,
    alertBg: "#f8faff",
    alertBdr: "rgba(0,0,0,.06)",
    timelineLine: "rgba(0,0,0,.08)",
  },
};

const MOCK_ALERTS = [
  { type: "success", msg: "Payment of ₹2,400 received", time: "2 min ago" },
  { type: "info",    msg: "New job invitation from TechCorp", time: "15 min ago" },
  { type: "warning", msg: "Job deadline in 2 days — Website Redesign", time: "1 hr ago" },
  { type: "info",    msg: "Account verification reminder", time: "3 hr ago" },
];

const MOCK_TIMELINE = [
  { icon: IndianRupee, color: "#4ade80", bg: "rgba(34,197,94,.15)", label: "Payment received", detail: "₹2,400 credited to wallet", time: "Today, 10:30 AM" },
  { icon: CheckCircle, color: "#a5b4fc", bg: "rgba(99,102,241,.15)", label: "Job completed", detail: "Website Redesign — TechCorp", time: "Yesterday, 5:00 PM" },
  { icon: UserCheck,   color: "#fbbf24", bg: "rgba(245,158,11,.15)", label: "Proposal accepted", detail: "Mobile App Development", time: "2 days ago" },
  { icon: ShieldCheck, color: "#4ade80", bg: "rgba(34,197,94,.15)", label: "Verification completed", detail: "Aadhaar verification approved", time: "3 days ago" },
  { icon: Star,        color: "#fbbf24", bg: "rgba(245,158,11,.15)", label: "Rating received", detail: "⭐⭐⭐⭐⭐ from TechCorp", time: "4 days ago" },
];

const WEEKLY_DATA = [
  { day: "Mon", amount: 1200 },
  { day: "Tue", amount: 0 },
  { day: "Wed", amount: 2400 },
  { day: "Thu", amount: 800 },
  { day: "Fri", amount: 3200 },
  { day: "Sat", amount: 600 },
  { day: "Sun", amount: 1800 },
];

const EmployeeDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useDashboardTheme();
  const tok = TH[theme];
  const [activeTab, setActiveTab] = useState<"earnings" | "jobs">("earnings");

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      queryClient.invalidateQueries({ queryKey: ["employee-transactions", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["employee-earnings-chart", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["employee-active-projects", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["employee-completed-projects", profile?.id] }),
    ]);
  }, [profile?.id, queryClient, refreshProfile]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel("emp-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `profile_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["employee-transactions", profile.id] });
        queryClient.invalidateQueries({ queryKey: ["employee-earnings-chart", profile.id] });
        refreshProfile();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "project_applications", filter: `employee_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["employee-active-projects", profile.id] });
        queryClient.invalidateQueries({ queryKey: ["employee-completed-projects", profile.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient, refreshProfile]);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["employee-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.from("transactions").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ["employee-earnings-chart", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data, error } = await supabase.from("transactions").select("amount, created_at").eq("profile_id", profile.id).eq("type", "credit").gte("created_at", sevenDaysAgo.toISOString()).order("created_at", { ascending: true });
      if (error) throw error;
      const dayMap: Record<string, number> = {};
      for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - 6 + i); dayMap[d.toLocaleDateString("en-IN", { weekday: "short" })] = 0; }
      (data ?? []).forEach((tx: any) => { const label = new Date(tx.created_at).toLocaleDateString("en-IN", { weekday: "short" }); if (label in dayMap) dayMap[label] += Number(tx.amount); });
      return Object.entries(dayMap).map(([day, amount]) => ({ day, amount }));
    },
    enabled: !!profile?.id,
  });

  const { data: activeCount = 0 } = useQuery({
    queryKey: ["employee-active-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("project_applications").select("id", { count: "exact", head: true }).eq("employee_id", profile.id).eq("status", "approved");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: completedCount = 0 } = useQuery({
    queryKey: ["employee-completed-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("project_applications").select("id", { count: "exact", head: true }).eq("employee_id", profile.id).eq("status", "approved");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: withdrawCount = 0 } = useQuery({
    queryKey: ["employee-withdraw-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("transactions").select("id", { count: "exact", head: true }).eq("profile_id", profile.id).eq("type", "debit");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const totalEarnings   = useMemo(() => chartData.reduce((s, d) => s + d.amount, 0), [chartData]);
  const displayChartData = chartData.some(d => d.amount > 0) ? chartData : WEEKLY_DATA;
  const greeting = useMemo(() => { const h = new Date().getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; }, []);
  const firstName = Array.isArray(profile?.full_name) ? profile.full_name[0] : (profile?.full_name ?? "there");
  const availBal  = profile?.available_balance ?? 0;
  const holdBal   = profile?.hold_balance ?? 0;
  const totalAll  = transactions.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const successRate = completedCount > 0 ? Math.round((completedCount / Math.max(completedCount + activeCount, 1)) * 100) : 0;

  const card: React.CSSProperties = {
    background: tok.cardBg, border: `1px solid ${tok.cardBdr}`,
    borderRadius: 16, backdropFilter: "blur(12px)",
    boxShadow: theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none",
  };

  const quickActions = [
    { icon: Briefcase,       label: "Find Jobs",   to: "/employee/projects",          grad: "rgba(99,102,241,.18)",  color: "#a5b4fc" },
    { icon: FileText,        label: "My Bids",     to: "/employee/bids",              grad: "rgba(139,92,246,.18)",  color: "#c4b5fd" },
    { icon: ArrowDownToLine, label: "Earnings",    to: "/employee/earnings",          grad: "rgba(34,197,94,.15)",   color: "#4ade80" },
    { icon: Star,            label: "Reviews",     to: "/employee/reviews",           grad: "rgba(245,158,11,.15)",  color: "#fbbf24" },
    { icon: ShieldCheck,     label: "Badges",      to: "/employee/badges",            grad: "rgba(20,184,166,.15)",  color: "#2dd4bf" },
    { icon: Upload,          label: "Portfolio",   to: "/employee/portfolio",         grad: "rgba(251,113,133,.15)", color: "#fb7185" },
    { icon: HeadphonesIcon,  label: "Support",     to: "/employee/help-support",      grad: "rgba(239,68,68,.13)",   color: "#f87171" },
    { icon: Gift,            label: "Get Free",    to: "/employee/get-free",          grad: "rgba(96,165,250,.15)",  color: "#60a5fa" },
  ];

  const summaryStats = [
    { icon: CircleDollarSign, label: "Total Earnings",   value: `₹${totalAll.toLocaleString("en-IN")}`,    color: "#4ade80",  bg: "rgba(34,197,94,.14)",   trend: "+12%",  trendUp: true },
    { icon: Wallet,           label: "Available Balance",value: `₹${availBal.toLocaleString("en-IN")}`,    color: "#a5b4fc",  bg: "rgba(99,102,241,.14)",  trend: "Ready", trendUp: true },
    { icon: Clock,            label: "Pending Payments", value: `₹${holdBal.toLocaleString("en-IN")}`,     color: "#fbbf24",  bg: "rgba(245,158,11,.14)",  trend: "Hold",  trendUp: false },
    { icon: CheckCircle,      label: "Completed Jobs",   value: completedCount,                              color: "#4ade80",  bg: "rgba(34,197,94,.12)",   trend: "+2",    trendUp: true },
    { icon: Briefcase,        label: "Active Jobs",      value: activeCount,                                 color: "#a5b4fc",  bg: "rgba(99,102,241,.12)",  trend: "Live",  trendUp: true },
    { icon: Target,           label: "Success Rate",     value: `${successRate}%`,                           color: "#2dd4bf",  bg: "rgba(20,184,166,.12)",  trend: "Good",  trendUp: true },
    { icon: Star,             label: "Client Rating",    value: "4.9 ★",                                     color: "#fbbf24",  bg: "rgba(245,158,11,.12)",  trend: "Top",   trendUp: true },
    { icon: ArrowUpRight,     label: "Withdrawals",      value: withdrawCount,                               color: "#f87171",  bg: "rgba(239,68,68,.12)",   trend: "Total", trendUp: false },
  ];

  const alertIcon = (type: string) => {
    if (type === "success") return <CheckCircle size={13} color="#4ade80" />;
    if (type === "warning") return <AlertTriangle size={13} color="#fbbf24" />;
    if (type === "error")   return <XCircle size={13} color="#f87171" />;
    return <Info size={13} color="#a5b4fc" />;
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
            <h2 style={{ margin: 0, fontSize: 23, fontWeight: 900, color: tok.text, letterSpacing: "-0.5px" }}>{typeof firstName === "string" ? firstName : "there"} 👋</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.2)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>Online</span>
            </div>
          </div>
        </div>

        {/* ── Wallet Card ── */}
        <WalletCard
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Employee"}
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
            <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Dashboard Summary</span>
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
            {quickActions.map(action => (
              <button key={action.label} onClick={() => navigate(action.to)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "14px 8px", borderRadius: 14, ...card, cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: action.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <action.icon size={17} style={{ color: action.color }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: tok.sub, lineHeight: 1.1, textAlign: "center" }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Earnings / Jobs Chart tabs ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["earnings", "jobs"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as "earnings" | "jobs")}
                  style={{ padding: "5px 12px", borderRadius: 8, background: activeTab === tab ? `${A1}20` : "none", border: activeTab === tab ? `1px solid ${A1}40` : "1px solid transparent", color: activeTab === tab ? "#a5b4fc" : tok.sub, fontSize: 11.5, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
                  {tab === "earnings" ? "Earnings" : "Jobs"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingUp size={12} color="#a5b4fc" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
                +₹{totalEarnings.toLocaleString("en-IN")} this week
              </span>
            </div>
          </div>
          <div style={{ height: 140 }}>
            {activeTab === "earnings" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayChartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="empEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={A1} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={A1} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: tok.chartAxis }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ ...tok.chartTip, borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Earned"]} />
                  <Area type="monotone" dataKey="amount" stroke={A1} strokeWidth={2.5} fill="url(#empEarningsGrad)"
                    dot={{ r: 3, fill: A1, strokeWidth: 0 }} activeDot={{ r: 5, fill: A1, stroke: tok.cardBg, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { label: "Applied", value: (completedCount + activeCount) || 3 },
                  { label: "Active",  value: activeCount },
                  { label: "Done",    value: completedCount },
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

        {/* ── Wallet & Payment Summary Widget ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(99,102,241,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={12} color="#a5b4fc" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Payment Summary</span>
            </div>
            <button onClick={() => navigate("/employee/wallet")}
              style={{ display: "flex", alignItems: "center", gap: 3, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Wallet <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Available",  value: `₹${availBal.toLocaleString("en-IN")}`,  color: "#4ade80", bg: "rgba(34,197,94,.1)" },
              { label: "On Hold",    value: `₹${holdBal.toLocaleString("en-IN")}`,   color: "#fbbf24", bg: "rgba(245,158,11,.1)" },
              { label: "7-Day Earned",value:`₹${totalEarnings.toLocaleString("en-IN")}`,color:"#a5b4fc",bg:"rgba(99,102,241,.1)"},
              { label: "Withdrawals",value: withdrawCount + " requests",              color: "#f87171", bg: "rgba(239,68,68,.1)" },
            ].map(w => (
              <div key={w.label} style={{ padding: "12px", borderRadius: 12, background: w.bg, border: `1px solid ${w.color}20` }}>
                <p style={{ fontSize: 14, fontWeight: 900, color: w.color, margin: 0 }}>{w.value}</p>
                <p style={{ fontSize: 10.5, color: tok.sub, margin: "2px 0 0", fontWeight: 600 }}>{w.label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/employee/wallet")}
            style={{ width: "100%", padding: "10px", borderRadius: 11, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 14px rgba(99,102,241,.35)" }}>
            <ArrowDownToLine size={15} />
            Withdraw Money
          </button>
        </div>

        {/* ── Notifications & Alerts ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(239,68,68,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={12} color="#f87171" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Alerts & Notifications</span>
            </div>
            <span style={{ fontSize: 10, background: "rgba(239,68,68,.12)", color: "#f87171", borderRadius: 20, padding: "1px 8px", fontWeight: 700 }}>
              {MOCK_ALERTS.length} new
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_ALERTS.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: tok.alertBg, border: `1px solid ${tok.alertBdr}` }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>{alertIcon(a.type)}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12.5, color: tok.text, margin: 0, fontWeight: 500 }}>{a.msg}</p>
                  <p style={{ fontSize: 10.5, color: tok.sub, margin: "2px 0 0" }}>{a.time}</p>
                </div>
              </div>
            ))}
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
            <button onClick={() => navigate("/employee/projects")}
              style={{ display: "flex", alignItems: "center", gap: 3, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          {[
            { title: "Website Redesign", client: "TechCorp Ltd", budget: "₹24,000", status: "Active",    statusColor: "#4ade80", deadline: "Dec 28" },
            { title: "Mobile App UI",   client: "StartupXYZ",   budget: "₹38,000", status: "Pending",   statusColor: "#fbbf24", deadline: "Jan 05" },
            { title: "Logo Design",     client: "BrandCo",      budget: "₹8,000",  status: "Completed", statusColor: "#a5b4fc", deadline: "Dec 20" },
          ].map((job, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: 12, transition: "background .15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: `${A1}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Briefcase size={15} color="#a5b4fc" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: tok.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</p>
                <p style={{ fontSize: 10.5, color: tok.sub, margin: "1px 0 0" }}>{job.client} · {job.budget} · Due {job.deadline}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: job.statusColor, background: `${job.statusColor}15`, borderRadius: 20, padding: "2px 8px", flexShrink: 0 }}>
                {job.status}
              </span>
            </div>
          ))}
        </div>

        {/* ── Recent Transactions ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(34,197,94,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays size={12} color="#4ade80" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Transactions</span>
            </div>
            <button onClick={() => navigate("/employee/wallet")}
              style={{ display: "flex", alignItems: "center", gap: 3, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : transactions.length > 0 ? (
              transactions.map((tx: any) => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", borderRadius: 12, transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: tx.type === "credit" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {tx.type === "credit" ? <ArrowDownRight size={15} style={{ color: "#4ade80" }} /> : <ArrowUpRight size={15} style={{ color: "#f87171" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: tok.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{tx.description}</p>
                    <p style={{ fontSize: 10.5, color: tok.sub, margin: "1px 0 0" }}>{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: tx.type === "credit" ? "#4ade80" : "#f87171" }}>
                    {tx.type === "credit" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: tok.emptyBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <IndianRupee size={20} style={{ color: tok.emptyFg }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: tok.sub, margin: 0 }}>No transactions yet</p>
                <p style={{ fontSize: 11, color: tok.emptySub, marginTop: 4 }}>Your earnings will appear here</p>
              </div>
            )}
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

export default EmployeeDashboard;
