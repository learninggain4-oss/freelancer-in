import { useEffect, useCallback } from "react";
import WalletCard from "@/components/wallet/WalletCard";
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
  Clock,
  TrendingUp,
  ArrowDownToLine,
  Loader2,
  Copy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
};

const ClientDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const copyWalletNumber = useCallback(() => {
    if (!profile?.wallet_number) return;
    navigator.clipboard.writeText(profile.wallet_number);
    toast({ title: "Copied!", description: `Wallet number ${profile.wallet_number} copied to clipboard.` });
  }, [profile?.wallet_number]);

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

  // Realtime
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

  const totalBalance = (profile?.available_balance ?? 0) + (profile?.hold_balance ?? 0);

  const quickActions = [
    { icon: Plus, label: "New Job", to: "/client/projects/create", color: "text-primary" },
    { icon: Wallet, label: "Add Money", to: "/client/wallet", color: "text-accent" },
    { icon: ArrowDownToLine, label: "Withdrawals", to: "/client/withdrawals", color: "text-warning" },
    { icon: Users, label: "Projects", to: "/client/projects", color: "text-secondary" },
  ];

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      {/* Pull-to-refresh indicator */}
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
        {/* Wallet Card */}
        <WalletCard
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Client"}
          userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
          walletNumber={profile?.wallet_number}
          availableBalance={profile?.available_balance ?? 0}
          holdBalance={profile?.hold_balance ?? 0}
        />

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted active:scale-95"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-sm">
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex gap-3">
          <Card className="flex-1 border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1 border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{recentRequests.length}</p>
                <p className="text-xs text-muted-foreground">Requests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help & Support */}
        <Card className="border-0 shadow-sm cursor-pointer transition-colors hover:bg-muted/50 active:scale-[0.98]" onClick={() => navigate("/client/help-support")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Help & Support</p>
              <p className="text-xs text-muted-foreground">Chat with our support team</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Recent requests */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Employee Requests</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={() => navigate("/client/projects")}
            >
              View All <ChevronRight className="ml-0.5 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 pb-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : recentRequests.length > 0 ? (
              recentRequests.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {Array.isArray(r.employee?.full_name) ? r.employee.full_name.join(" ") : r.employee?.full_name ?? "Employee"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{r.project?.name ?? "Job"}</p>
                  </div>
                  <Badge className={statusColor[r.status]}>{r.status}</Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">No requests yet</p>
                <p className="text-xs text-muted-foreground/70">Employee applications will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
