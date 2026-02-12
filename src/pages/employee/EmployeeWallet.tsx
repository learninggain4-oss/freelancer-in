import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Clock, IndianRupee, ArrowDownToLine, Building2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

const EmployeeWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState(profile?.upi_id ?? "");
  const queryClient = useQueryClient();

  const { data: withdrawals = [], isLoading: wLoading } = useQuery({
    queryKey: ["employee-withdrawals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, employee_id, amount, method, status, review_notes, reviewed_at, reviewed_by, requested_at")
        .eq("employee_id", profile.id)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: transactions = [], isLoading: tLoading } = useQuery({
    queryKey: ["employee-transactions", profile?.id],
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

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      const amount = Number(withdrawAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      if (amount > (profile?.available_balance ?? 0)) throw new Error("Insufficient balance");
      const { error } = await supabase.from("withdrawals").insert({
        employee_id: profile.id,
        amount,
        method: "UPI",
        upi_id: upiId || null,
        bank_account_number: profile.bank_account_number,
        bank_ifsc_code: profile.bank_ifsc_code,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["employee-withdrawals"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-foreground">Wallet</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /><span className="text-xs">Available</span></div>
            <p className="mt-1 text-xl font-bold text-foreground"><IndianRupee className="inline h-4 w-4" />{(profile?.available_balance ?? 0).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span className="text-xs">On Hold</span></div>
            <p className="mt-1 text-xl font-bold text-foreground"><IndianRupee className="inline h-4 w-4" />{(profile?.hold_balance ?? 0).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><ArrowDownToLine className="h-4 w-4" /> Request Withdrawal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>UPI ID</Label>
            <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /><span>Bank: {profile?.bank_name ?? "Not set"}</span></div>
            <div className="flex items-center gap-1.5"><CreditCard className="h-3 w-3" /><span>A/C: {profile?.bank_account_number ? `****${profile.bank_account_number.slice(-4)}` : "Not set"}</span></div>
          </div>
          <Button className="w-full" onClick={() => withdrawMutation.mutate()} disabled={withdrawMutation.isPending}>
            {withdrawMutation.isPending ? "Submitting..." : "Submit Withdrawal"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Withdrawal History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {wLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : withdrawals.length > 0 ? (
            withdrawals.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">₹{Number(w.amount).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">{w.method} • {new Date(w.requested_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={statusVariant[w.status] ?? "secondary"}>{w.status}</Badge>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No withdrawals yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Transaction History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {tLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
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

export default EmployeeWallet;
