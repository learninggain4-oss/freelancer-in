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
  ArrowDownToLine,
  TrendingUp,
  Clock,
  IndianRupee,
  ChevronRight,
  FileText,
  MessageSquare,
  Loader2,
  Copy,
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
  const copyWalletNumber = useCallback(() => {
    if (!profile?.wallet_number) return;
    navigator.clipboard.writeText(profile.wallet_number);
    toast({ title: "Copied!", description: `Wallet number ${profile.wallet_number} copied to clipboard.` });
  }, [profile?.wallet_number]);

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

  // Realtime: refresh when transactions or profile balances change
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

  // Earnings chart data (last 7 days of credits)
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

      // Group by day
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

  // Active projects count
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

  const totalBalance = (profile?.available_balance ?? 0) + (profile?.hold_balance ?? 0);

  const quickActions = [
    { icon: Briefcase, label: "Jobs", to: "/employee/projects", color: "text-primary" },
    { icon: ArrowDownToLine, label: "Withdraw", to: "/employee/wallet", color: "text-accent" },
    { icon: FileText, label: "Submissions", to: "/employee/projects", color: "text-warning" },
    { icon: MessageSquare, label: "Messages", to: "/employee/projects", color: "text-secondary" },
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
        name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Employee"}
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
              <p className="text-xs text-muted-foreground">Active Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Earnings — Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Earned"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#earningsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="border-0 shadow-sm cursor-pointer transition-colors hover:bg-muted/50 active:scale-[0.98]" onClick={() => navigate("/employee/help-support")}>
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

      {/* Recent transactions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Recent Transactions</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            onClick={() => navigate("/employee/wallet")}
          >
            View All <ChevronRight className="ml-0.5 h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 pb-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
          ) : transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  tx.type === "credit" ? "bg-accent/10" : "bg-destructive/10"
                }`}>
                  <IndianRupee className={`h-4 w-4 ${tx.type === "credit" ? "text-accent" : "text-destructive"}`} />
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
                <span className={`text-sm font-semibold tabular-nums ${
                  tx.type === "credit" ? "text-accent" : "text-destructive"
                }`}>
                  {tx.type === "credit" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground/70">Your earnings will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
