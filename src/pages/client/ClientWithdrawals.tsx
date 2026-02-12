import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianRupee, User, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WithdrawalCountdown } from "@/components/withdrawal/WithdrawalCountdown";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

const ClientWithdrawals = () => {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["client-withdrawals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, employee_id, amount, method, status, review_notes, reviewed_at, reviewed_by, requested_at, employee:employee_id(full_name, user_code)")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await supabase.functions.invoke("wallet-operations", {
        body: { action: "process_withdrawal", withdrawal_id: id, status },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: (_, vars) => {
      toast.success(`Withdrawal ${vars.status}`);
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["client-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["client-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pending = withdrawals.filter((w: any) => w.status === "pending");
  const history = withdrawals.filter((w: any) => w.status !== "pending");

  const getEmployeeName = (emp: any) => {
    if (!emp) return "Employee";
    return Array.isArray(emp.full_name) ? emp.full_name.join(" ") : emp.full_name;
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-foreground">Employee Withdrawals</h1>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Pending Requests</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : pending.length > 0 ? (
            pending.map((w: any) => (
              <div key={w.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <User className="h-3 w-3" />{getEmployeeName(w.employee)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Array.isArray(w.employee?.user_code) ? w.employee.user_code.join("") : w.employee?.user_code} • {w.method}
                    </p>
                  </div>
                  <span className="flex items-center text-base font-bold text-foreground">
                    <IndianRupee className="h-4 w-4" />{Number(w.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <WithdrawalCountdown requestedAt={w.requested_at} />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => updateMutation.mutate({ id: w.id, status: "approved" })} disabled={updateMutation.isPending}>
                    <Check className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => updateMutation.mutate({ id: w.id, status: "rejected" })} disabled={updateMutation.isPending}>
                    <X className="mr-1 h-3 w-3" /> Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No pending requests</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {history.length > 0 ? (
            history.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{getEmployeeName(w.employee)}</p>
                  <p className="text-xs text-muted-foreground">₹{Number(w.amount).toLocaleString("en-IN")} • {new Date(w.requested_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={statusVariant[w.status] ?? "secondary"}>{w.status}</Badge>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No history yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientWithdrawals;
