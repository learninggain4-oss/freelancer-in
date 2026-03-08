import { useState } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, ArrowUpRight, AlertCircle, Receipt, History } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ClientWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [addAmount, setAddAmount] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    onSuccess: () => {
      toast.success(`₹${Number(addAmount).toLocaleString("en-IN")} added to wallet`);
      setAddAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["client-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

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

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="flex h-auto flex-col items-center gap-2 py-4"
          onClick={() => navigate("/client/wallet/transactions")}
        >
          <Receipt className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Transactions</span>
        </Button>
        <Button
          variant="outline"
          className="flex h-auto flex-col items-center gap-2 py-4"
          onClick={() => navigate("/client/wallet/withdrawals")}
        >
          <History className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Withdrawals</span>
        </Button>
      </div>

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
    </div>
  );
};

export default ClientWallet;
