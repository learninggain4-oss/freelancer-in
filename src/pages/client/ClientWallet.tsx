import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const ClientWallet = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { profile, refreshProfile } = useAuth();
  const [addAmount, setAddAmount] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const addMoneyRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scanned wallet from QR scanner
  useEffect(() => {
    const state = location.state as { scannedWallet?: string } | null;
    if (state?.scannedWallet) {
      setShowTransfer(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    <div className="space-y-6 p-4 pb-24 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Wallet className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: T.text }}>My Wallet</h1>
            <p className="text-xs font-medium" style={{ color: T.sub }}>Manage your funds & payments</p>
          </div>
        </div>
        <WalletTypeBadge balance={profile?.available_balance ?? 0} compact />
      </div>

      {/* Wallet Card Section */}
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

      {/* Wallet Type Info */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
        <Card className="border-0 shadow-lg" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardContent className="p-4">
            <WalletTypeBadge balance={profile?.available_balance ?? 0} />
          </CardContent>
        </Card>
      </div>

      {/* Wallet Inactive Warning */}
      {!(profile as any)?.wallet_active && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400 animate-fade-in-up shadow-lg">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="font-medium">Your wallet is currently inactive. Adding money is disabled. Please contact support.</span>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <button
          onClick={() => navigate("/client/wallet/transactions")}
          className="group flex flex-col items-start gap-4 rounded-3xl p-5 shadow-xl transition-all active:scale-[0.98]"
          style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 transition-transform group-hover:scale-110">
            <Receipt className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-black tracking-tight" style={{ color: T.text }}>Transactions</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: T.sub }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>View History</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/client/wallet/withdrawals")}
          className="group flex flex-col items-start gap-4 rounded-3xl p-5 shadow-xl transition-all active:scale-[0.98]"
          style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 transition-transform group-hover:scale-110">
            <History className="h-6 w-6 text-purple-400" />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-black tracking-tight" style={{ color: T.text }}>Withdrawals</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: T.sub }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.sub }}>Track Requests</p>
          </div>
        </button>
      </div>

      {/* Add Money Form */}
      <div ref={addMoneyRef} className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <Card className="border-0 shadow-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          <CardHeader className="flex-row items-center gap-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <PlusCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <CardTitle className="text-lg font-black tracking-tight" style={{ color: T.text }}>Add Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: T.sub }}>Deposit Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-400">₹</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="h-16 pl-10 text-2xl font-black border-0 bg-white/5 rounded-2xl focus-visible:ring-indigo-500/30"
                  style={{ color: T.text }}
                />
              </div>
            </div>
            <Button
              className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
              onClick={() => addMoneyMutation.mutate()}
              disabled={addMoneyMutation.isPending || !(profile as any)?.wallet_active}
            >
              <ArrowUpRight className="mr-2 h-5 w-5" />
              {addMoneyMutation.isPending ? "Processing..." : !(profile as any)?.wallet_active ? "Wallet Inactive" : "Add to Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        open={showTransfer}
        onOpenChange={setShowTransfer}
        initialWalletNumber={(location.state as any)?.scannedWallet || ""}
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
