import { useEffect, useCallback, useMemo } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  Briefcase,
  ArrowDownToLine,
  TrendingUp,
  Clock,
  IndianRupee,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  CircleDollarSign,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

const EmployeeDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      queryClient.invalidateQueries({ queryKey: ["employee-transactions", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["employee-earnings-chart", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["employee-active-projects", profile?.id] }),
    ]);
  }, [profile?.id, queryClient, refreshProfile]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel("emp-dashboard-realtime")
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
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ["employee-earnings-chart", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, created_at")
        .eq("profile_id", profile.id)
        .eq("type", "credit")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      const dayMap: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        dayMap[d.toLocaleDateString("en-IN", { weekday: "short" })] = 0;
      }
      (data ?? []).forEach((tx: any) => {
        const label = new Date(tx.created_at).toLocaleDateString("en-IN", { weekday: "short" });
        if (label in dayMap) dayMap[label] += Number(tx.amount);
      });
      return Object.entries(dayMap).map(([day, amount]) => ({ day, amount }));
    },
    enabled: !!profile?.id,
  });

  const { data: activeCount = 0 } = useQuery({
    queryKey: ["employee-active-projects", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase
        .from("project_applications")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", profile.id)
        .eq("status", "approved");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const totalEarnings = useMemo(() => chartData.reduce((sum, d) => sum + d.amount, 0), [chartData]);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
  const firstName = Array.isArray(profile?.full_name) ? profile.full_name[0] : (profile?.full_name ?? "there");

  const quickActions = [
    { icon: Briefcase, label: "Jobs", to: "/employee/projects", gradient: "from-primary/10 to-primary/5", iconColor: "text-primary" },
    { icon: ArrowDownToLine, label: "Withdraw", to: "/employee/wallet", gradient: "from-accent/10 to-accent/5", iconColor: "text-accent" },
    { icon: FileText, label: "Submissions", to: "/employee/projects", gradient: "from-warning/10 to-warning/5", iconColor: "text-warning" },
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
            name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Employee"}
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
        <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardContent className="relative flex flex-col items-center p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground animate-count-up">{activeCount}</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Active Jobs</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
            <CardContent className="relative flex flex-col items-center p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 mb-2">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground animate-count-up">{transactions.length}</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Transactions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent" />
            <CardContent className="relative flex flex-col items-center p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 mb-2">
                <CircleDollarSign className="h-5 w-5 text-warning" />
              </div>
              <p className="text-lg font-bold text-foreground animate-count-up">₹{totalEarnings.toLocaleString("en-IN")}</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">7-Day Earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Chart */}
        <Card className="border-0 shadow-sm animate-fade-in-up overflow-hidden" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex-row items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">Earnings Overview</CardTitle>
            </div>
            <Badge variant="secondary" className="text-[10px] font-medium bg-muted">Last 7 Days</Badge>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradientAdv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      padding: "8px 12px",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Earned"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#earningsGradientAdv)"
                    dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                <CalendarDays className="h-3.5 w-3.5 text-accent" />
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">Recent Transactions</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={() => navigate("/employee/wallet")}
            >
              View All <ChevronRight className="ml-0.5 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-0.5 pb-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : transactions.length > 0 ? (
              transactions.map((tx: any, i: number) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                  style={{ animationDelay: `${0.3 + i * 0.05}s` }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    tx.type === "credit"
                      ? "bg-accent/10"
                      : "bg-destructive/10"
                  }`}>
                    {tx.type === "credit" ? (
                      <ArrowDownRight className="h-4.5 w-4.5 text-accent" />
                    ) : (
                      <ArrowUpRight className="h-4.5 w-4.5 text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold tabular-nums ${
                      tx.type === "credit" ? "text-accent" : "text-destructive"
                    }`}>
                      {tx.type === "credit" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <IndianRupee className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">No transactions yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Your earnings will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
