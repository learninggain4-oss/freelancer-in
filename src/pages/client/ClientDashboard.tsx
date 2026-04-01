import { useEffect, useCallback, useMemo } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wallet, Briefcase, Plus, Users, IndianRupee, ChevronRight,
  ArrowDownToLine, Loader2, Sparkles, Activity, FolderOpen, Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: {
    cardBg: "rgba(255,255,255,.05)", cardBdr: "rgba(255,255,255,.08)",
    text: "rgba(255,255,255,.85)", sub: "rgba(255,255,255,.4)",
    rowHover: "rgba(255,255,255,.04)", pullFg: "rgba(255,255,255,.4)",
    emptyBg: "rgba(255,255,255,.05)", emptyFg: "rgba(255,255,255,.2)", emptySub: "rgba(255,255,255,.25)",
  },
  white: {
    cardBg: "#ffffff", cardBdr: "rgba(0,0,0,.08)",
    text: "#0d0d24", sub: "#6b7280",
    rowHover: "rgba(0,0,0,.03)", pullFg: "#9ca3af",
    emptyBg: "#f1f5f9", emptyFg: "#9ca3af", emptySub: "#9ca3af",
  },
  wb: {
    cardBg: "#ffffff", cardBdr: "rgba(0,0,0,.08)",
    text: "#0d0d24", sub: "#6b7280",
    rowHover: "rgba(0,0,0,.03)", pullFg: "#9ca3af",
    emptyBg: "#f1f5f9", emptyFg: "#9ca3af", emptySub: "#9ca3af",
  },
};

const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
  pending:  { bg: "rgba(245,158,11,.12)", color: "#f59e0b", border: "rgba(245,158,11,.25)" },
  approved: { bg: "rgba(34,197,94,.12)",  color: "#4ade80", border: "rgba(34,197,94,.25)" },
  rejected: { bg: "rgba(239,68,68,.1)",   color: "#ef4444", border: "rgba(239,68,68,.2)" },
};

const ClientDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useDashboardTheme();
  const tok = TH[theme];

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      queryClient.invalidateQueries({ queryKey: ["client-active-projects", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["client-recent-requests", profile?.id] }),
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

  const greeting = useMemo(() => { const h = new Date().getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; }, []);
  const firstName = Array.isArray(profile?.full_name) ? profile.full_name[0] : (profile?.full_name ?? "there");

  const quickActions = [
    { icon: Plus,          label: "New Job",  to: "/client/projects/create", grad: "rgba(99,102,241,.18)", color: "#a5b4fc" },
    { icon: Wallet,        label: "Add Money",to: "/client/wallet",          grad: "rgba(34,197,94,.15)",  color: "#4ade80" },
    { icon: ArrowDownToLine,label:"Withdraw", to: "/client/withdrawals",     grad: "rgba(245,158,11,.15)", color: "#fbbf24" },
    { icon: Star,          label: "Upgrades", to: "/client/wallet-types",    grad: "rgba(139,92,246,.18)", color: "#c4b5fd" },
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
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Client"}
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: FolderOpen, label: "Active Jobs", value: activeCount,           color: "#a5b4fc", bg: "rgba(99,102,241,.14)" },
            { icon: Activity,   label: "Requests",    value: recentRequests.length, color: "#4ade80", bg: "rgba(34,197,94,.12)" },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: "18px 16px", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at top right,${s.bg} 0%,transparent 65%)` }} />
              <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                <s.icon size={22} style={{ color: s.color }} />
              </div>
              <div style={{ position: "relative" }}>
                <p style={{ fontSize: 26, fontWeight: 900, color: tok.text, letterSpacing: "-1px" }}>{s.value}</p>
                <p style={{ fontSize: 12, color: tok.sub, fontWeight: 500 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Employee Requests */}
        <div style={{ ...card, padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(99,102,241,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={13} color="#a5b4fc" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: tok.text }}>Employee Requests</span>
            </div>
            <button onClick={() => navigate("/client/projects")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: "#a5b4fc", fontSize: 12, fontWeight: 600 }}>
              View All <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : recentRequests.length > 0 ? (
              recentRequests.map((r: any) => {
                const st = statusStyle[r.status] || statusStyle.pending;
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 10px", borderRadius: 12, transition: "background .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = tok.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: theme === "black" ? "rgba(255,255,255,.06)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Users size={16} style={{ color: tok.sub }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: tok.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {Array.isArray(r.employee?.full_name) ? r.employee.full_name.join(" ") : r.employee?.full_name ?? "Employee"}
                        </p>
                        <p style={{ fontSize: 11, color: tok.sub }}>{r.project?.name ?? "Job"}</p>
                      </div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 8, background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: 10, fontWeight: 700, textTransform: "capitalize", flexShrink: 0 }}>
                      {r.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: tok.emptyBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Users size={22} style={{ color: tok.emptyFg }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: tok.sub }}>No requests yet</p>
                <p style={{ fontSize: 11, color: tok.emptySub, marginTop: 4 }}>Employee applications will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
