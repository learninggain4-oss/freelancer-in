import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Loader2, PlusCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TotpVerifyDialog from "@/components/admin/TotpVerifyDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/utils/notification-sounds";
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
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [addAmount, setAddAmount] = useState("");
  const [showTotp, setShowTotp] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"processing" | "success" | "failed">("processing");
  const [statusMessage, setStatusMessage] = useState("Processing payment...");

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
    onMutate: () => {
      setPaymentStage("processing");
      setStatusMessage("Processing payment...");
      setShowStatusPopup(true);
    },
    mutationFn: async () => {
      const amount = Number(addAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      if (!profile?.id) throw new Error("Profile not found");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "admin_wallet_add",
          target_profile_id: profile.id,
          amount,
          description: "Admin: added to personal wallet",
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return amount;
    },
    onSuccess: (amount) => {
      playNotificationSound("project");
      setPaymentStage("success");
      setStatusMessage(`INR ${amount.toLocaleString("en-IN")} added successfully`);
      toast.success(`INR ${amount.toLocaleString("en-IN")} added to wallet`);
      setAddAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
      setTimeout(() => {
        setShowStatusPopup(false);
        navigate("/admin/wallet");
      }, 1300);
    },
    onError: (e: any) => {
      playNotificationSound("alert");
      setPaymentStage("failed");
      setStatusMessage(e.message || "Payment failed. Please try again.");
      toast.error(e.message);
    },
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
            <Label style={{ color: T.sub }}>Amount (INR)</Label>
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

      <Dialog open={showStatusPopup} onOpenChange={(open) => !addMoneyMutation.isPending && setShowStatusPopup(open)}>
        <DialogContent className="sm:max-w-sm border-0 p-0 overflow-hidden rounded-3xl">
          <div className="relative bg-gradient-to-b from-[#030b2a] via-[#0a1742] to-[#1a0f39] px-6 py-8 text-center text-white">
            <div className="pointer-events-none absolute -top-16 -left-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-12 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_40%)]" />

            <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-indigo-300/40" />
              {paymentStage === "processing" && <Loader2 className="h-10 w-10 animate-spin text-cyan-200 drop-shadow-[0_0_12px_rgba(103,232,249,.8)]" />}
              {paymentStage === "success" && <CheckCircle2 className="h-10 w-10 text-emerald-300 drop-shadow-[0_0_16px_rgba(110,231,183,.9)]" />}
              {paymentStage === "failed" && <XCircle className="h-10 w-10 text-rose-300 drop-shadow-[0_0_16px_rgba(251,113,133,.9)]" />}
            </div>

            <h3 className="relative text-xl font-bold tracking-wide">
              {paymentStage === "processing" ? "Payment Processing" : paymentStage === "success" ? "Payment Successful" : "Payment Failed"}
            </h3>
            <p className="relative mt-2 text-sm text-slate-200/90">{statusMessage}</p>

            {paymentStage === "processing" && (
              <div className="relative mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-cyan-300 via-indigo-300 to-violet-300" />
              </div>
            )}

            {paymentStage === "processing" && (
              <div className="relative mt-5 flex items-center justify-center gap-1.5">
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.2s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.1s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-300" />
              </div>
            )}
            {paymentStage === "failed" && (
              <Button className="relative mt-5 w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600" onClick={() => setShowStatusPopup(false)}>
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWalletAddMoney;
