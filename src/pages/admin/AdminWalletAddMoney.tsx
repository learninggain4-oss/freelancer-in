import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TotpVerifyDialog from "@/components/admin/TotpVerifyDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};

const AdminWalletAddMoney = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [addAmount, setAddAmount] = useState("");
  const [showTotp, setShowTotp] = useState(false);

  const { data: totpStatus } = useQuery({
    queryKey: ["admin-totp-status"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("admin-totp", {
        body: { action: "check_status" },
      });
      return res.data as { is_enabled: boolean };
    },
  });

  const requireTotp = totpStatus?.is_enabled ?? false;

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
      return amount;
    },
    onSuccess: (amount) => {
      toast.success(`₹${amount.toLocaleString("en-IN")} added to wallet`);
      setAddAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
      navigate("/admin/wallet");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAddMoney = () => {
    if (requireTotp) {
      setShowTotp(true);
      return;
    }
    addMoneyMutation.mutate();
  };

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/wallet")}
          style={{ borderColor: T.border, color: T.text, background: "transparent" }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Wallet
        </Button>
      </div>

      <div className="rounded-3xl border p-6 transition-all" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <PlusCircle className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold" style={{ color: T.text }}>Add Money to Personal Wallet</h2>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label style={{ color: T.sub }}>Amount (₹)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              style={{ background: T.input, borderColor: T.border, color: T.text }}
              className="h-12 text-lg font-medium"
            />
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold"
            onClick={handleAddMoney}
            disabled={addMoneyMutation.isPending}
          >
            {addMoneyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpRight className="mr-2 h-4 w-4" />}
            {addMoneyMutation.isPending ? "Processing..." : "Add to Wallet"}
          </Button>
        </div>
      </div>

      <TotpVerifyDialog
        open={showTotp}
        onClose={() => setShowTotp(false)}
        onVerified={() => {
          setShowTotp(false);
          addMoneyMutation.mutate();
        }}
        title="Verify Security Code"
        description="Please enter your 2FA code to authorize this deposit."
      />
    </div>
  );
};

export default AdminWalletAddMoney;
