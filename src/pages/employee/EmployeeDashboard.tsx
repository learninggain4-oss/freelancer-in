import { useEffect, useCallback, useMemo } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wallet, Briefcase, ArrowDownToLine, TrendingUp,
  IndianRupee, ChevronRight, FileText, Loader2, Sparkles,
  Activity, ArrowUpRight, ArrowDownRight, CalendarDays,
  CircleDollarSign, Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: {
    cardBg:   "rgba(255,255,255,.05)", cardBdr: "rgba(255,255,255,.08)",
    text:     "rgba(255,255,255,.85)", sub: "rgba(255,255,255,.4)",
    rowHover: "rgba(255,255,255,.04)", pullFg: "rgba(255,255,255,.4)",
    chartTip: { background: "rgba(13,13,36,.95)", border: "1px solid rgba(255,255,255,.1)", color: "white" },
    chartAxis:"rgba(255,255,255,.3)",
    emptyBg:  "rgba(255,255,255,.05)", emptyFg: "rgba(255,255,255,.2)",
    emptySub: "rgba(255,255,255,.25)",
    badgeBg:  "rgba(255,255,255,.06)", badgeFg: "rgba(255,255,255,.35)",
    sectionIconBg: (color: string) => `${color}22`,
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
  },
};

const EmployeeDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useDashboardTheme();
  const tok = TH[theme];

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      queryClient.invalidateQueries({ queryKey: ["employee-transactions", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["employee-earnings-chart", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["employee-active-projects", profile?.id] }),
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
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient, refreshProfile]);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["employee-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.from("transactions").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(5);
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

  const totalEarnings = useMemo(() => chartData.reduce((s, d) => s + d.amount, 0), [chartData]);
  const greeting = useMemo(() => { const h = new Date().getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; }, []);
  const firstName = Array.isArray(profile?.full_name) ? profile.full_name[0] : (profile?.full_name ?? "there");

  const quickActions = [
    { icon: Briefcase,     label: "Jobs",    to: "/employee/projects",     grad: "rgba(99,102,241,.18)", color: "#a5b4fc" },
    { icon: ArrowDownToLine,label:"Withdraw",to: "/employee/wallet",       grad: "rgba(34,197,94,.15)",  color: "#4ade80" },
    { icon: FileText,      label: "Tasks",   to: "/employee/projects",     grad: "rgba(245,158,11,.15)", color: "#fbbf24" },
    { icon: Star,          label: "Upgrades",to: "/employee/wallet-types", grad: "rgba(139,92,246,.18)", color: "#c4b5fd" },
  ];

  const card: React.CSSProperties = { background: tok.cardBg, border: `1px solid ${tok.cardBdr}`, borderRadius: 16, backdropFilter: "blur(12px)", boxShadow: theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none" };

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

        {/* Greeting */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={16} style={{ color: "#fbbf24" }} />
            <p style={{ fontSize: 13, color: tok.sub, fontWeight: 500 }}>{greeting}</p>
          </div>
          <h2 style={{ marginTop: 4, fontSize: 24, fontWeight: 900, color: tok.text, letterSpacing: "-0.5px" }}>{firstName} 👋</h2>
        </div>

        {/* Wallet Card */}
        <WalletCard
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Employee"}
          userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
          walletNumber={profile?.wallet_number}
          availableBalance={profile?.available_balance ?? 0}
          holdBalance={profile?.hold_balance ?? 0}
          walletActive={(profile as any)?.wallet_active ?? true}
        />

        {/* Wallet Type Badge */}
        <WalletTypeBadge balance={profile?.available_balance ?? 0} />

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {quickActions.map(action => (
            <button key={action.label} onClick={() => navigate(action.to)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 8px", borderRadius: 16, ...card, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = theme !== "black" ? "0 2px 8px rgba(0,0,0,.06)" : "none"; }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: action.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <action.icon size={18} style={{ color: action.color }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: tok.sub, lineHeight: 1.1, textAlign: "center" }}>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { icon: Briefcase,       label: "Active Jobs",   value: activeCount,                                color: "#a5b4fc", bg: "rgba(99,102,241,.14)" },
            { icon: Activity,        label: "Transactions",  value: transactions.length,                        color: "#4ade80", bg: "rgba(34,197,94,.12)" },
            { icon: CircleDollarSign,label: "7-Day Earned",  value: `₹${totalEarnings.toLocaleString("en-IN")}`,color: "#fbbf24", bg: "rgba(245,158,11,.12)", small: true },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at top right,${s.bg} 0%,transparent 70%)` }} />
              <div style={{ width: 38, height: 38, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <p style={{ fontWeight: 900, color: tok.text, fontSize: s.small ? 15 : 22, position: "relative" }}>{s.value}</p>
              <p style={{ fontSize: 10, color: tok.sub, fontWeight: 600, position: "relative" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ ...card, padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(99,102,241,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={13} color="#a5b4fc" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Earnings Overview</span>
            </div>
            <span style={{ fontSize: 10, color: tok.badgeFg, padding: "3px 8px", borderRadius: 6, background: tok.badgeBg }}>Last 7 Days</span>
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
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
          </div>
        </div>

        {/* Transactions */}
        <div style={{ ...card, padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(34,197,94,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays size={13} color="#4ade80" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Recent Transactions</span>
            </div>
            <button onClick={() => navigate("/employee/wallet")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: "#a5b4fc", fontSize: 12, fontWeight: 600 }}>
              View All <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : transactions.length > 0 ? (
              transactions.map((tx: any) => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", borderRadius: 12, transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: tx.type === "credit" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {tx.type === "credit" ? <ArrowDownRight size={16} style={{ color: "#4ade80" }} /> : <ArrowUpRight size={16} style={{ color: "#f87171" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: tok.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</p>
                    <p style={{ fontSize: 11, color: tok.sub }}>{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: tx.type === "credit" ? "#4ade80" : "#f87171" }}>
                    {tx.type === "credit" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: tok.emptyBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <IndianRupee size={22} style={{ color: tok.emptyFg }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: tok.sub }}>No transactions yet</p>
                <p style={{ fontSize: 11, color: tok.emptySub, marginTop: 4 }}>Your earnings will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
