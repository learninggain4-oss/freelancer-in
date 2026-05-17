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
  Gift, Zap, XCircle, Info, AlertTriangle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
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
  warm: {
    cardBg:   "#fffdf7", cardBdr: "rgba(180,83,9,.1)",
    text:     "#1c1a17", sub: "#78716c",
    rowHover: "rgba(180,83,9,.05)", pullFg: "rgba(120,113,108,.5)",
    chartTip: { background: "#fffdf7", border: "1px solid rgba(180,83,9,.15)", color: "#1c1a17" },
    chartAxis:"#a8a29e",
    emptyBg:  "#fef3c7", emptyFg: "#a8a29e",
    emptySub: "#a8a29e",
    badgeBg:  "#fef3c7", badgeFg: "#78716c",
    sectionIconBg: (color: string) => `${color}18`,
    alertBg: "#fffdf7",
    alertBdr: "rgba(180,83,9,.08)",
    timelineLine: "rgba(180,83,9,.1)",
  },
  forest: {
    cardBg:   "#ffffff", cardBdr: "rgba(21,128,61,.1)",
    text:     "#0f2d18", sub: "#4b7c5d",
    rowHover: "rgba(21,128,61,.05)", pullFg: "rgba(75,124,93,.5)",
    chartTip: { background: "#ffffff", border: "1px solid rgba(21,128,61,.15)", color: "#0f2d18" },
    chartAxis:"#4b7c5d",
    emptyBg:  "#dcfce7", emptyFg: "#4b7c5d",
    emptySub: "#86efac",
    badgeBg:  "#dcfce7", badgeFg: "#4b7c5d",
    sectionIconBg: (color: string) => `${color}18`,
    alertBg: "#f1faf4",
    alertBdr: "rgba(21,128,61,.08)",
    timelineLine: "rgba(21,128,61,.1)",
  },
  ocean: {
    cardBg:   "#ffffff", cardBdr: "rgba(14,165,233,.1)",
    text:     "#0c4a6e", sub: "#4b83a3",
    rowHover: "rgba(14,165,233,.05)", pullFg: "rgba(75,131,163,.5)",
    chartTip: { background: "#ffffff", border: "1px solid rgba(14,165,233,.15)", color: "#0c4a6e" },
    chartAxis:"#4b83a3",
    emptyBg:  "#e0f2fe", emptyFg: "#4b83a3",
    emptySub: "#0369a1",
    badgeBg:  "#e0f2fe", badgeFg: "#4b83a3",
    sectionIconBg: (color: string) => `${color}18`,
    alertBg: "#f0f9ff",
    alertBdr: "rgba(14,165,233,.08)",
    timelineLine: "rgba(14,165,233,.1)",
  },
};


const EmployeeDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/freelancer") ? "/freelancer" : "/employee";
  const queryClient = useQueryClient();
  const { theme } = useDashboardTheme();
  const tok = TH[theme];
  const [activeTab, setActiveTab] = useState<"earnings" | "jobs">("earnings");

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      queryClient.invalidateQueries({ queryKey: ["freelancer-transactions", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["freelancer-earnings-chart", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["freelancer-active-projects", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["freelancer-completed-projects", profile?.id] }),
    ]);
  }, [profile?.id, queryClient, refreshProfile]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel("emp-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `profile_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["freelancer-transactions", profile.id] });
        queryClient.invalidateQueries({ queryKey: ["freelancer-earnings-chart", profile.id] });
        refreshProfile();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "project_applications", filter: `employee_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["freelancer-active-projects", profile.id] });
        queryClient.invalidateQueries({ queryKey: ["freelancer-completed-projects", profile.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient, refreshProfile]);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["freelancer-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.from("transactions").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ["freelancer-earnings-chart", profile?.id],
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
    queryKey: ["freelancer-active-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("project_applications").select("id", { count: "exact", head: true }).eq("employee_id", profile.id).eq("status", "approved");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: completedCount = 0 } = useQuery({
    queryKey: ["freelancer-completed-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("project_applications").select("id", { count: "exact", head: true }).eq("employee_id", profile.id).eq("status", "approved");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: withdrawCount = 0 } = useQuery({
    queryKey: ["freelancer-withdraw-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase.from("transactions").select("id", { count: "exact", head: true }).eq("profile_id", profile.id).eq("type", "debit");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: recentJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["freelancer-recent-jobs", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("*, project:projects!project_applications_project_id_fkey(name, amount, status, end_date, client:profiles!projects_client_id_fkey(full_name))")
        .eq("employee_id", profile.id)
        .order("applied_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  const totalEarnings   = useMemo(() => chartData.reduce((s, d) => s + d.amount, 0), [chartData]);
  const displayChartData = chartData;
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

  const isDarkTheme = theme === "black";
  const accentIcon  = isDarkTheme ? "#a5b4fc" : "#4f46e5";
  const violetIcon  = isDarkTheme ? "#c4b5fd" : "#7c3aed";
  const clrGreen = isDarkTheme ? "#4ade80" : "#16a34a";
  const clrAmber = isDarkTheme ? "#fbbf24" : "#b45309";
  const clrRed   = isDarkTheme ? "#f87171" : "#dc2626";

  const quickActions = [
    { icon: Briefcase,       label: "Find Jobs",   to: "/freelancer/projects",          grad: "rgba(99,102,241,.18)",  color: accentIcon },
    { icon: FileText,        label: "My Bids",     to: "/freelancer/bids",              grad: "rgba(139,92,246,.18)",  color: violetIcon },
    { icon: ArrowDownToLine, label: "Earnings",    to: "/freelancer/earnings",          grad: "rgba(34,197,94,.15)",   color: isDarkTheme ? "#4ade80" : "#16a34a" },
    { icon: Star,            label: "Reviews",     to: "/freelancer/reviews",           grad: "rgba(245,158,11,.15)",  color: isDarkTheme ? "#fbbf24" : "#d97706" },
    { icon: ShieldCheck,     label: "Badges",      to: "/freelancer/badges",            grad: "rgba(20,184,166,.15)",  color: isDarkTheme ? "#2dd4bf" : "#0d9488" },
    { icon: Upload,          label: "Portfolio",   to: "/freelancer/portfolio",         grad: "rgba(251,113,133,.15)", color: isDarkTheme ? "#fb7185" : "#e11d48" },
    { icon: HeadphonesIcon,  label: "Support",     to: "/freelancer/help-support",      grad: "rgba(239,68,68,.13)",   color: isDarkTheme ? "#f87171" : "#dc2626" },
    { icon: Gift,            label: "Get Free",    to: "/freelancer/get-free",          grad: "rgba(96,165,250,.15)",  color: isDarkTheme ? "#60a5fa" : "#2563eb" },
  ];

  const summaryStats = [
    { icon: CircleDollarSign, label: "Total Earnings",   value: `₹${totalAll.toLocaleString("en-IN")}`,    color: isDarkTheme ? "#4ade80" : "#16a34a",  bg: "rgba(34,197,94,.14)",   trend: "+12%",  trendUp: true },
    { icon: Wallet,           label: "Available Balance",value: `₹${availBal.toLocaleString("en-IN")}`,    color: accentIcon,                            bg: "rgba(99,102,241,.14)",  trend: "Ready", trendUp: true },
    { icon: Clock,            label: "Pending Payments", value: `₹${holdBal.toLocaleString("en-IN")}`,     color: isDarkTheme ? "#fbbf24" : "#d97706",   bg: "rgba(245,158,11,.14)",  trend: "Hold",  trendUp: false },
    { icon: CheckCircle,      label: "Completed Jobs",   value: completedCount,                              color: isDarkTheme ? "#4ade80" : "#16a34a",  bg: "rgba(34,197,94,.12)",   trend: "+2",    trendUp: true },
    { icon: Briefcase,        label: "Active Jobs",      value: activeCount,                                 color: accentIcon,                            bg: "rgba(99,102,241,.12)",  trend: "Live",  trendUp: true },
    { icon: Target,           label: "Success Rate",     value: `${successRate}%`,                           color: isDarkTheme ? "#2dd4bf" : "#0d9488",  bg: "rgba(20,184,166,.12)",  trend: "Good",  trendUp: true },
    { icon: Star,             label: "Employer Rating",  value: "4.9 ★",                                    color: isDarkTheme ? "#fbbf24" : "#d97706",  bg: "rgba(245,158,11,.12)",  trend: "Top",   trendUp: true },
    { icon: ArrowUpRight,     label: "Withdrawals",      value: withdrawCount,                               color: isDarkTheme ? "#f87171" : "#dc2626",  bg: "rgba(239,68,68,.12)",   trend: "Total", trendUp: false },
  ];

  const alertIcon = (type: string) => {
    if (type === "success") return <CheckCircle size={13} color={clrGreen} />;
    if (type === "warning") return <AlertTriangle size={13} color={clrAmber} />;
    if (type === "error")   return <XCircle size={13} color={clrRed} />;
    return <Info size={13} color={accentIcon} />;
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

      <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── HERO SECTION ── */}
        <div style={{
          background: `linear-gradient(135deg, ${A1} 0%, ${A2} 55%, #0ea5e9 100%)`,
          borderRadius: 24, padding: "20px 20px 22px",
          position: "relative", overflow: "hidden",
          boxShadow: "0 10px 40px rgba(99,102,241,.38)",
        }}>
          <div style={{ position: "absolute", top: -50, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.07)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, left: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" }} />

          {/* Top row */}
          <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <Sparkles size={11} style={{ color: "rgba(255,255,255,.7)" }} />
                <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12, fontWeight: 600, margin: 0 }}>{greeting}</p>
              </div>
              <h2 style={{ color: "white", fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
                Hi, {(typeof firstName === "string" ? firstName : "there").split(" ")[0]} 👋
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.18)", backdropFilter: "blur(10px)", borderRadius: 20, padding: "5px 12px", border: "1px solid rgba(255,255,255,.15)", flexShrink: 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
              <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>Online</span>
            </div>
          </div>

          {/* Earnings display */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 10.5, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 1.2 }}>Total Earnings</p>
            <p style={{ color: "white", fontSize: 32, fontWeight: 900, margin: "4px 0 0", letterSpacing: "-1.5px", lineHeight: 1 }}>
              ₹{totalAll.toLocaleString("en-IN")}
            </p>
          </div>

          {/* 3 mini stat chips */}
          <div style={{ position: "relative", display: "flex", gap: 8 }}>
            {[
              { label: "Available", value: `₹${availBal.toLocaleString("en-IN")}` },
              { label: "On Hold",   value: `₹${holdBal.toLocaleString("en-IN")}` },
              { label: "Jobs Done", value: String(completedCount) },
            ].map(chip => (
              <div key={chip.label} style={{ flex: 1, background: "rgba(255,255,255,.13)", backdropFilter: "blur(10px)", borderRadius: 14, padding: "10px 10px", border: "1px solid rgba(255,255,255,.1)" }}>
                <p style={{ color: "rgba(255,255,255,.65)", fontSize: 9.5, margin: 0, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{chip.label}</p>
                <p style={{ color: "white", fontSize: 13, fontWeight: 900, margin: "3px 0 0", letterSpacing: "-0.3px" }}>{chip.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Wallet Card ── */}
        <WalletCard
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Freelancer"}
          userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
          walletNumber={profile?.wallet_number}
          availableBalance={profile?.available_balance ?? 0}
          holdBalance={profile?.hold_balance ?? 0}
          walletActive={(profile as any)?.wallet_active ?? true}
          onTransfer={() => {}}
          onWithdraw={() => navigate(`${base}/wallet/withdraw`)}
        />

        {/* ── Wallet Type Badge ── */}
        <WalletTypeBadge balance={profile?.available_balance ?? 0} />

        {/* ── Withdraw CTA ── */}
        <button onClick={() => navigate(`${base}/wallet`)}
          style={{ width: "100%", padding: "13px", borderRadius: 16, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 20px rgba(99,102,241,.38)", transition: "opacity .2s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = ".9")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <ArrowDownToLine size={16} />
          Withdraw Money
        </button>

        {/* ── Quick Stats (horizontal scroll) ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(99,102,241,.13)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart3 size={11} color={accentIcon} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 13, color: tok.text }}>Your Stats</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, msOverflowStyle: "none", scrollbarWidth: "none" } as React.CSSProperties}>
            {summaryStats.map(s => (
              <div key={s.label} style={{ flexShrink: 0, width: 112, ...card, padding: "13px 12px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -8, right: -8, width: 44, height: 44, borderRadius: "50%", background: s.bg, opacity: 0.9 }} />
                <div style={{ width: 30, height: 30, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, position: "relative" }}>
                  <s.icon size={13} style={{ color: s.color }} />
                </div>
                <p style={{ fontWeight: 900, color: tok.text, fontSize: 14, margin: 0, position: "relative", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</p>
                <p style={{ fontSize: 9.5, color: tok.sub, fontWeight: 600, margin: "2px 0 0", lineHeight: 1.3, position: "relative" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Actions (4-col grid) ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(139,92,246,.13)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={11} color={violetIcon} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 13, color: tok.text }}>Quick Actions</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {quickActions.map(action => (
              <button key={action.label} onClick={() => navigate(action.to)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "13px 6px", borderRadius: 16, ...card, cursor: "pointer", transition: "transform .15s, box-shadow .15s", border: "1px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none"; }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: action.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <action.icon size={16} style={{ color: action.color }} />
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: tok.sub, lineHeight: 1.2, textAlign: "center" }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Earnings / Jobs Chart tabs ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(99,102,241,.13)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={11} color={accentIcon} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: tok.text }}>Performance</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(34,197,94,.1)", borderRadius: 20, padding: "3px 9px", border: "1px solid rgba(34,197,94,.2)" }}>
                <TrendingUp size={10} color={clrGreen} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: clrGreen }}>
                  ₹{totalEarnings.toLocaleString("en-IN")} this week
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["earnings", "jobs"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as "earnings" | "jobs")}
                  style={{ padding: "5px 14px", borderRadius: 8, background: activeTab === tab ? `linear-gradient(135deg,${A1}25,${A2}20)` : "none", border: activeTab === tab ? `1px solid ${A1}35` : `1px solid ${tok.cardBdr}`, color: activeTab === tab ? accentIcon : tok.sub, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  {tab === "earnings" ? "Earnings" : "Jobs"}
                </button>
              ))}
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

        {/* ── Notifications & Alerts ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={11} color={clrRed} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 13, color: tok.text }}>Alerts</span>
          </div>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: tok.emptyBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <Bell size={18} color={tok.sub} style={{ opacity: 0.4 }} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: tok.text, margin: 0 }}>No alerts</p>
            <p style={{ fontSize: 11, color: tok.sub, margin: "3px 0 0", opacity: 0.7 }}>You're all caught up!</p>
          </div>
        </div>

        {/* ── Recent Jobs ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(139,92,246,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={11} color={violetIcon} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 13, color: tok.text }}>Recent Jobs</span>
            </div>
            <button onClick={() => navigate(`${base}/projects`)}
              style={{ display: "flex", alignItems: "center", gap: 3, color: accentIcon, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          {jobsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl mb-1" />)
          ) : recentJobs.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: tok.emptyBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Briefcase size={20} style={{ color: tok.emptyFg }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: tok.sub, margin: 0 }}>No jobs yet</p>
              <p style={{ fontSize: 11, color: tok.emptySub, marginTop: 4 }}>Applied projects will appear here</p>
            </div>
          ) : (
            recentJobs.map((app: any, i: number) => {
              const proj = app.project ?? {};
              const title = proj.name ?? "Project";
              const clientName = Array.isArray(proj.client?.full_name) ? proj.client.full_name[0] : (proj.client?.full_name ?? "Employer");
              const budget = proj.amount ? `₹${Number(proj.amount).toLocaleString("en-IN")}` : "—";
              const deadline = proj.end_date ? new Date(proj.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";
              const appStatus = app.status;
              const projStatus = proj.status;
              let statusLabel = "Pending";
              let statusColor = clrAmber;
              if (appStatus === "rejected") { statusLabel = "Rejected"; statusColor = clrRed; }
              else if (appStatus === "approved") {
                if (projStatus === "completed") { statusLabel = "Completed"; statusColor = accentIcon; }
                else { statusLabel = "Active"; statusColor = clrGreen; }
              }
              return (
                <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: 12, transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: `${A1}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase size={15} color={accentIcon} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: tok.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
                    <p style={{ fontSize: 10.5, color: tok.sub, margin: "1px 0 0" }}>{clientName} · {budget}{deadline !== "—" ? ` · Due ${deadline}` : ""}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: `${statusColor}15`, borderRadius: 20, padding: "2px 8px", flexShrink: 0 }}>
                    {statusLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* ── Recent Transactions ── */}
        <div style={{ ...card, padding: "16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(34,197,94,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays size={11} color={clrGreen} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 13, color: tok.text }}>Transactions</span>
            </div>
            <button onClick={() => navigate(`${base}/wallet`)}
              style={{ display: "flex", alignItems: "center", gap: 3, color: accentIcon, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
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
                    {tx.type === "credit" ? <ArrowDownRight size={15} style={{ color: clrGreen }} /> : <ArrowUpRight size={15} style={{ color: clrRed }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: tok.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{tx.description}</p>
                    <p style={{ fontSize: 10.5, color: tok.sub, margin: "1px 0 0" }}>{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: tx.type === "credit" ? clrGreen : clrRed }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(245,158,11,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={11} color={clrAmber} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 13, color: tok.text }}>Activity Timeline</span>
          </div>
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: tok.emptyBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <Activity size={20} color={tok.sub} style={{ opacity: 0.4 }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: tok.text, margin: 0 }}>No activity yet</p>
              <p style={{ fontSize: 11, color: tok.sub, margin: "4px 0 0", opacity: 0.7 }}>Your transactions will appear here</p>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 28 }}>
              <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 1, background: tok.timelineLine }} />
              {transactions.slice(0, 6).map((t: any, i: number) => {
                const isCredit = t.type === "credit";
                const TIcon = isCredit ? IndianRupee : ArrowDownToLine;
                const color  = isCredit ? "#4ade80" : "#f87171";
                const bg     = isCredit ? "rgba(34,197,94,.15)" : "rgba(248,113,113,.15)";
                const label  = isCredit ? "Payment received" : "Amount withdrawn";
                const detail = `₹${Number(t.amount).toLocaleString("en-IN")}${t.description ? ` — ${t.description}` : ""}`;
                const time   = new Date(t.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
                return (
                  <div key={t.id ?? i} style={{ position: "relative", paddingBottom: i < Math.min(transactions.length, 6) - 1 ? 18 : 0 }}>
                    <div style={{ position: "absolute", left: -24, top: 2, width: 28, height: 28, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TIcon size={13} style={{ color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: tok.text, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 11, color: tok.sub, margin: "2px 0 1px" }}>{detail}</p>
                      <p style={{ fontSize: 10, color: tok.sub, opacity: 0.6, margin: 0 }}>{time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
