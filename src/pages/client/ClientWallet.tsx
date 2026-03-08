import { useState } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Clock,
  IndianRupee,
  PlusCircle,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WithdrawalCountdown } from "@/components/withdrawal/WithdrawalCountdown";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

const ClientWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [addAmount, setAddAmount] = useState("");
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: tLoading } = useQuery({
    queryKey: ["client-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: withdrawals = [], isLoading: wLoading } = useQuery({
    queryKey: ["client-withdrawals-wallet", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, employee_id, amount, method, status, review_notes, reviewed_at, requested_at, employee:employee_id(full_name, user_code)")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const addMoneyMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(addAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("wallet-operations", {
        body: { action: "add_money", amount },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`₹${Number(addAmount).toLocaleString("en-IN")} added to wallet`);
      setAddAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["client-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getEmployeeName = (emp: any) => {
    if (!emp) return "Employee";
    return Array.isArray(emp.full_name) ? emp.full_name.join(" ") : emp.full_name;
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-foreground">Wallet</h1>

      <WalletCard
        name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Client"}
        userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
        walletNumber={profile?.wallet_number}
        availableBalance={profile?.available_balance ?? 0}
        holdBalance={profile?.hold_balance ?? 0}
        walletActive={(profile as any)?.wallet_active ?? true}
      />

      {!(profile as any)?.wallet_active && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your wallet is currently inactive. Adding money is disabled. Please contact support for assistance.</span>
        </div>
      )}

      {/* Add Money */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="h-4 w-4" /> Add Money
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" placeholder="Enter amount" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => addMoneyMutation.mutate()} disabled={addMoneyMutation.isPending || !(profile as any)?.wallet_active}>
            <ArrowUpRight className="mr-2 h-4 w-4" /> {addMoneyMutation.isPending ? "Processing..." : !(profile as any)?.wallet_active ? "Wallet Inactive" : "Add to Wallet"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex-1">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
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
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {wLoading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : withdrawals.length > 0 ? (
                withdrawals.map((w: any) => (
                  <div key={w.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{getEmployeeName((w as any).employee)}</p>
                        <p className="text-xs text-muted-foreground">₹{Number(w.amount).toLocaleString("en-IN")} • {w.method} • {new Date(w.requested_at).toLocaleDateString()}</p>
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
                <p className="py-4 text-center text-sm text-muted-foreground">No withdrawals yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientWallet;
