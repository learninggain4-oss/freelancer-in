import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { WithdrawalCountdown } from "@/components/withdrawal/WithdrawalCountdown";
import { toast } from "sonner";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

const WithdrawalHistory = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isEmployee = profile?.user_type === "employee";

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["all-withdrawals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      if (isEmployee) {
        const { data, error } = await supabase
          .from("withdrawals")
          .select("id, employee_id, amount, method, status, review_notes, reviewed_at, requested_at, order_id")
          .eq("employee_id", profile.id)
          .order("requested_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("withdrawals")
          .select("id, employee_id, amount, method, status, review_notes, reviewed_at, requested_at, order_id, employee:employee_id(full_name, user_code)")
          .order("requested_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return data;
      }
    },
    enabled: !!profile?.id,
  });

  const getEmployeeName = (emp: any) => {
    if (!emp) return "Employee";
    return Array.isArray(emp.full_name) ? emp.full_name.join(" ") : emp.full_name;
  };

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied!");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Withdrawal History</h1>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : withdrawals.length > 0 ? (
            withdrawals.map((w: any) => (
              <div key={w.id} className="space-y-2 rounded-lg border p-3">
                {w.order_id && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-primary">{w.order_id}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyOrderId(w.order_id)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    {!isEmployee && (
                      <p className="text-sm font-medium text-foreground">{getEmployeeName(w.employee)}</p>
                    )}
                    <p className="text-sm font-medium text-foreground">₹{Number(w.amount).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">{w.method} • {new Date(w.requested_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={statusVariant[w.status] ?? "secondary"}>{w.status}</Badge>
                </div>
                {w.status === "pending" && (
                  <WithdrawalCountdown requestedAt={w.requested_at} />
                )}
                {w.status === "rejected" && w.review_notes && (
                  <p className="text-xs text-destructive">Reason: {w.review_notes}</p>
                )}
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No withdrawals yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalHistory;
