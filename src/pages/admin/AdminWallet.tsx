import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import WalletCard from "@/components/wallet/WalletCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, History, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)", nav: "rgba(255,255,255,.04)", badge: "rgba(99,102,241,.2)", badgeFg: "#a5b4fc" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", nav: "#f1f5f9", badge: "rgba(99,102,241,.1)", badgeFg: "#4f46e5" },
  wb: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", nav: "#f1f5f9", badge: "rgba(99,102,241,.1)", badgeFg: "#4f46e5" },
};

const AdminWallet = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [walletNumber, setWalletNumber] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    setWalletNumber(profile?.wallet_number || "");
  }, [profile?.wallet_number]);

  const updateWalletNumberMutation = useMutation({
    mutationFn: async () => {
      const normalized = walletNumber.trim();
      if (!normalized) throw new Error("Wallet number is required");
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ wallet_number: normalized })
        .eq("id", profile.id);

      if (error) throw new Error(error.message);
      return normalized;
    },
    onSuccess: (updatedWalletNumber) => {
      toast.success(`Wallet number updated to ${updatedWalletNumber}`);
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-transfer-search"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
            <Wallet className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Personal Wallet</h2>
          <p className="mt-2 text-indigo-100">Manage your administrative funds and internal transfers.</p>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <WalletCard
          name={profile.full_name?.join(" ") || "Admin"}
          userCode={profile.user_code?.join(", ") || ""}
          walletNumber={profile.wallet_number}
          availableBalance={Number(profile.available_balance) || 0}
          holdBalance={Number(profile.hold_balance) || 0}
          onAddMoney={() => navigate("/admin/wallet/add-money")}
          onTransfer={() => navigate("/admin/wallet/transfer")}
        />
      </div>

      <div className="rounded-3xl border p-6 transition-all hover:shadow-xl" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Wallet className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: T.text }}>Edit Wallet Number</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label style={{ color: T.sub }}>Wallet Number</Label>
            <Input
              placeholder="Enter wallet number"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              className="h-11"
              style={{ background: T.input, borderColor: T.border, color: T.text }}
            />
          </div>
          <Button
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
            onClick={() => updateWalletNumberMutation.mutate()}
            disabled={updateWalletNumberMutation.isPending || walletNumber.trim() === (profile.wallet_number || "")}
          >
            {updateWalletNumberMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {updateWalletNumberMutation.isPending ? "Saving..." : "Update Wallet Number"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border p-6" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
        <div>
          <h3 className="text-lg font-bold" style={{ color: T.text }}>Transaction History</h3>
          <p className="text-sm" style={{ color: T.sub }}>View all your past wallet activity</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/wallet/transactions")}
          className="rounded-xl px-6 h-11"
          style={{ borderColor: T.border, background: "transparent", color: T.text }}
        >
          <History className="mr-2 h-4 w-4" />
          View All History
        </Button>
      </div>
    </div>
  );
};

export default AdminWallet;
