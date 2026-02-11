import { useEffect } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const EmployeeDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Realtime: refresh when transactions or profile balances change
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel("emp-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `profile_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["employee-transactions", profile.id] });
        refreshProfile();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "project_applications", filter: `employee_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["employee-requests"] });
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

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {profile?.full_name ?? "Employee"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Code: <span className="font-mono font-medium text-foreground">{profile?.user_code ?? "—"}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Available</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              <IndianRupee className="inline h-4 w-4" />
              {(profile?.available_balance ?? 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">On Hold</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              <IndianRupee className="inline h-4 w-4" />
              {(profile?.hold_balance ?? 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/employee/projects")}>
          <Briefcase className="h-5 w-5 text-primary" />
          <span className="text-xs">View Projects</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/employee/wallet")}>
          <ArrowDownToLine className="h-5 w-5 text-accent" />
          <span className="text-xs">Withdraw Funds</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" /> Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`ml-3 text-sm font-semibold ${tx.type === "credit" ? "text-accent" : "text-destructive"}`}>
                  {tx.type === "credit" ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN")}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
