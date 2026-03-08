import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const TransactionHistory = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["all-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
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
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
