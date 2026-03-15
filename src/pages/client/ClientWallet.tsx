import { useState, useRef } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import TransferDialog from "@/components/wallet/TransferDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  ArrowUpRight,
  AlertCircle,
  Receipt,
  History,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ClientWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [addAmount, setAddAmount] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const addMoneyRef = useRef<HTMLDivElement>(null);
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

  const scrollToAddMoney = () => {
    setShowAddMoney(true);
    setTimeout(() => addMoneyRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">My Wallet</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage your funds & payments</p>
        </div>
        <WalletTypeBadge balance={profile?.available_balance ?? 0} compact />
      </div>

      {/* Wallet Card */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <WalletCard
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Client"}
          userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
          walletNumber={profile?.wallet_number}
          availableBalance={profile?.available_balance ?? 0}
          holdBalance={profile?.hold_balance ?? 0}
          walletActive={(profile as any)?.wallet_active ?? true}
          onAddMoney={scrollToAddMoney}
          onTransfer={() => setShowTransfer(true)}
        />
      </div>

      {/* Wallet Type Card */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
        <WalletTypeBadge balance={profile?.available_balance ?? 0} />
      </div>

      {/* Wallet Inactive Warning */}
      {!(profile as any)?.wallet_active && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in-up">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your wallet is currently inactive. Adding money is disabled. Please contact support.</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <button
          onClick={() => navigate("/client/wallet/transactions")}
          className="group flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Transactions</p>
            <p className="text-[11px] text-muted-foreground">View history</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => navigate("/client/wallet/withdrawals")}
          className="group flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-transform group-hover:scale-110">
            <History className="h-5 w-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Withdrawals</p>
            <p className="text-[11px] text-muted-foreground">Track requests</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Add Money Card */}
      <div ref={addMoneyRef}>
        <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <CardHeader className="flex-row items-center gap-2 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <PlusCircle className="h-4 w-4 text-accent" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Add Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="h-12 text-lg font-semibold"
              />
            </div>
            <Button
              className="w-full h-12 text-sm font-semibold"
              onClick={() => addMoneyMutation.mutate()}
              disabled={addMoneyMutation.isPending || !(profile as any)?.wallet_active}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {addMoneyMutation.isPending ? "Processing..." : !(profile as any)?.wallet_active ? "Wallet Inactive" : "Add to Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        open={showTransfer}
        onOpenChange={setShowTransfer}
        maxBalance={profile?.available_balance ?? 0}
        onSuccess={() => {
          refreshProfile();
          queryClient.invalidateQueries({ queryKey: ["client-transactions"] });
        }}
      />
    </div>
  );
};

export default ClientWallet;
