import { useEffect, useCallback, useMemo } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Briefcase,
  Plus,
  Users,
  IndianRupee,
  ChevronRight,
  TrendingUp,
  ArrowDownToLine,
  Loader2,
  Sparkles,
  Activity,
  FolderOpen,
  Star,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-accent/10 text-accent border-accent/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const ClientDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      queryClient.invalidateQueries({ queryKey: ["client-active-projects", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["client-recent-requests", profile?.id] }),
    ]);
  }, [profile?.id, queryClient, refreshProfile]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel("client-dashboard-realtime")
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
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("client_id", profile.id)
        .in("status", ["open", "in_progress"]);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: recentRequests = [], isLoading } = useQuery({
    queryKey: ["client-recent-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("*, employee:employee_id(full_name), project:project_id(name, client_id)")
        .order("applied_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []).filter((r: any) => r.project?.client_id === profile.id);
    },
    enabled: !!profile?.id,
  });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
  const firstName = Array.isArray(profile?.full_name) ? profile.full_name[0] : (profile?.full_name ?? "there");

  const quickActions = [
    { icon: Plus, label: "New Job", to: "/client/projects/create", gradient: "from-primary/10 to-primary/5", iconColor: "text-primary" },
    { icon: Wallet, label: "Add Money", to: "/client/wallet", gradient: "from-accent/10 to-accent/5", iconColor: "text-accent" },
    { icon: ArrowDownToLine, label: "Withdrawals", to: "/client/withdrawals", gradient: "from-warning/10 to-warning/5", iconColor: "text-warning" },
    { icon: Star, label: "Wallet Types", to: "/wallet-types", gradient: "from-secondary/10 to-secondary/5", iconColor: "text-secondary" },
  ];

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      {/* Pull-to-refresh */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
        style={{ height: pullDistance > 0 ? `${pullDistance}px` : 0 }}
      >
        <div className={`flex items-center gap-2 text-sm text-muted-foreground ${refreshing ? "animate-pulse" : ""}`}>
          <Loader2 className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`} style={{
            transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
          }} />
          <span>{refreshing ? "Refreshing…" : pullDistance >= 80 ? "Release to refresh" : "Pull to refresh"}</span>
        </div>
      </div>

      <div className="space-y-5 p-4 pb-8">
        {/* Greeting Header */}
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" />
            <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{firstName} 👋</h2>
        </div>

        {/* Wallet Card */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <WalletCard
            name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Client"}
            userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
            walletNumber={profile?.wallet_number}
            availableBalance={profile?.available_balance ?? 0}
            holdBalance={profile?.hold_balance ?? 0}
            walletActive={(profile as any)?.wallet_active ?? true}
          />
        </div>

        {/* Wallet Type */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.07s" }}>
          <WalletTypeBadge balance={profile?.available_balance ?? 0} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2.5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-card p-3.5 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border active:scale-95"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} transition-transform group-hover:scale-110`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardContent className="relative flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <FolderOpen className="h-5.5 w-5.5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground animate-count-up">{activeCount}</p>
                <p className="text-xs font-medium text-muted-foreground">Active Jobs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
            <CardContent className="relative flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Activity className="h-5.5 w-5.5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground animate-count-up">{recentRequests.length}</p>
                <p className="text-xs font-medium text-muted-foreground">Requests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Requests */}
        <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">Employee Requests</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={() => navigate("/client/projects")}
            >
              View All <ChevronRight className="ml-0.5 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-0.5 pb-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : recentRequests.length > 0 ? (
              recentRequests.map((r: any, i: number) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {Array.isArray(r.employee?.full_name) ? r.employee.full_name.join(" ") : r.employee?.full_name ?? "Employee"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{r.project?.name ?? "Job"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-semibold border ${statusColor[r.status]}`}>{r.status}</Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">No requests yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Employee applications will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
