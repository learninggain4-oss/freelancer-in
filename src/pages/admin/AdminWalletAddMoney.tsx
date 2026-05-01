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
      return res.data;
    },
    onSuccess: (data) => {
      playNotificationSound("project");
      setPaymentStage("success");
      const txnId = data?.transaction_id ? `\nTransaction ID: ${data.transaction_id}` : "";
      setStatusMessage(`₹${Number(addAmount).toLocaleString("en-IN")} added successfully${txnId}`);
      toast.success(`₹${Number(addAmount).toLocaleString("en-IN")} added to wallet${txnId ? `\nTXN: ${data.transaction_id}` : ""}`);
      setAddAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
      setTimeout(() => {
        setShowStatusPopup(false);
        navigate("/admin/wallet");
      }, 2000);
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
        <DialogContent className="sm:max-w-sm border border-slate-200/10 bg-slate-950 p-0 overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="relative px-6 py-7 text-center text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.18),transparent_40%)]" />
            <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700">
              <div className="absolute -inset-2 rounded-full border border-indigo-400/30 animate-[spin_4s_linear_infinite]" />
              {paymentStage === "processing" && <Loader2 className="h-9 w-9 animate-spin text-indigo-300" />}
              {paymentStage === "success" && <CheckCircle2 className="h-9 w-9 text-emerald-400" />}
              {paymentStage === "failed" && <XCircle className="h-9 w-9 text-rose-400" />}
            </div>

            <h3 className="relative text-lg font-semibold tracking-tight transition-all duration-300">
              {paymentStage === "processing" ? "Payment Processing" : paymentStage === "success" ? "Payment Successful" : "Payment Failed"}
            </h3>
            <p className="relative mt-2 text-sm text-slate-300 transition-all duration-300">{statusMessage}</p>

            {paymentStage === "processing" && (
              <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-1/2 animate-[pulse_1.1s_ease-in-out_infinite] rounded-full bg-indigo-400" />
              </div>
            )}

            {paymentStage === "processing" && (
              <div className="mt-5 flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300" />
              </div>
            )}
            {paymentStage === "failed" && (
              <Button className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowStatusPopup(false)}>
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
