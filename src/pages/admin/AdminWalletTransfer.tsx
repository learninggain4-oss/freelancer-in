import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Search, SendHorizontal, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const getTransferFailureReason = (rawMessage: string) => {
  if (rawMessage.includes("Receiver wallet is inactive")) {
    return "Receiver wallet is inactive. Activate the receiver wallet and try again.";
  }
  if (rawMessage.includes("Insufficient balance")) {
    return "Insufficient balance in sender wallet.";
  }
  if (rawMessage.includes("Select a recipient")) {
    return "Please select a valid recipient wallet.";
  }
  if (rawMessage.includes("Profile not found")) {
    return "Recipient profile not found.";
  }
  if (rawMessage.includes("Not authenticated")) {
    return "Session expired. Please login again.";
  }
  return "Transfer could not be completed. Please try again.";
};

const AdminWalletTransfer = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [transferAmount, setTransferAmount] = useState("");
  const [transferSearch, setTransferSearch] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; full_name: string[]; user_code: string[]; user_type: string; wallet_number: string } | null>(null);
  const [showTotp, setShowTotp] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"processing" | "success" | "failed">("processing");
  const [statusMessage, setStatusMessage] = useState("Processing transfer...");

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

  const { data: recipientResults = [] } = useQuery({
    queryKey: ["admin-transfer-search", transferSearch],
    queryFn: async () => {
      if (!transferSearch || transferSearch.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, user_type, wallet_number")
        .ilike("wallet_number", `%${transferSearch}%`)
        .neq("id", profile?.id ?? "")
        .limit(5);
      return data || [];
    },
    enabled: transferSearch.length >= 2,
  });

  const transferMutation = useMutation({
    onMutate: () => {
      setPaymentStage("processing");
      setStatusMessage("Processing transfer...");
      setShowStatusPopup(true);
    },
    mutationFn: async () => {
      const amt = Number(transferAmount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");
      if (!selectedRecipient) throw new Error("Select a recipient");
      if (!profile?.id) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "admin_wallet_transfer",
          target_profile_id: profile.id,
          transfer_to_profile_id: selectedRecipient.id,
          amount: amt,
          description: transferDescription || undefined,
        },
      });
      if (res.data?.error) throw new Error(res.data.error);
      if (res.error) {
        const ctxBody = (res.error as any)?.context?.body;
        if (typeof ctxBody === "string") {
          try {
            const parsed = JSON.parse(ctxBody);
            if (parsed?.error) throw new Error(parsed.error);
          } catch {
            // Ignore parse issues and use fallback message below
          }
        }
        throw new Error(res.error.message);
      }
      return amt;
    },
    onSuccess: (amt) => {
      playNotificationSound("project");
      setPaymentStage("success");
      setStatusMessage(`INR ${amt.toLocaleString("en-IN")} transferred successfully`);
      toast.success(`INR ${amt.toLocaleString("en-IN")} transferred to ${selectedRecipient?.full_name?.[0]}`);
      setTransferAmount("");
      setTransferSearch("");
      setSelectedRecipient(null);
      setTransferDescription("");
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
      const reason = getTransferFailureReason(e.message || "");
      setStatusMessage(reason);
      toast.error(reason);
    },
  });

  const handleTransfer = () => {
    if (requireTotp) {
      setShowTotp(true);
      return;
    }
    transferMutation.mutate();
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            <SendHorizontal className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold" style={{ color: T.text }}>Transfer Money</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: T.sub }}>Search Recipient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.sub }} />
                <Input
                  placeholder="Wallet address..."
                  value={transferSearch}
                  onChange={(e) => {
                    setTransferSearch(e.target.value);
                    if (selectedRecipient) setSelectedRecipient(null);
                  }}
                  className="pl-9 h-11"
                  style={{ background: T.input, borderColor: T.border, color: T.text }}
                />
              </div>
              {!selectedRecipient && recipientResults.length > 0 && (
                <div className="mt-2 rounded-xl border overflow-hidden shadow-2xl" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }}>
                  {recipientResults.map((u: any) => (
                    <button
                      key={u.id}
                      className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-indigo-500/10 transition-colors border-b last:border-0"
                      style={{ borderColor: T.border }}
                      onClick={() => {
                        setSelectedRecipient(u);
                        setTransferSearch(u.wallet_number || "");
                      }}
                    >
                      <div className="text-left">
                        <p className="font-bold" style={{ color: T.text }}>{u.full_name?.[0]}</p>
                        <p className="text-xs" style={{ color: T.sub }}>{u.user_type === "employee" ? "Freelancer" : u.user_type === "client" ? "Employer" : u.user_type || "-"}</p>
                      </div>
                      <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">{u.wallet_number}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {selectedRecipient && (
                <div className="flex items-center gap-3 rounded-xl border p-3 mt-2" style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.2)" }}>
                  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {selectedRecipient.full_name?.[0][0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: T.text }}>{selectedRecipient.full_name?.[0]}</p>
                    <p className="text-[10px]" style={{ color: T.sub }}>{selectedRecipient.wallet_number}</p>
                  </div>
                  <button
                    className="text-xs font-medium text-red-400 hover:text-red-300"
                    onClick={() => { setSelectedRecipient(null); setTransferSearch(""); }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label style={{ color: T.sub }}>Amount (INR)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="h-11"
                style={{ background: T.input, borderColor: T.border, color: T.text }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: T.sub }}>Description (optional)</Label>
              <Input
                placeholder="Reason for transfer"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                className="h-11"
                style={{ background: T.input, borderColor: T.border, color: T.text }}
              />
            </div>
            <div className="pt-4">
              <Button
                className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold"
                onClick={handleTransfer}
                disabled={transferMutation.isPending || !selectedRecipient}
              >
                {transferMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
                {transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TotpVerifyDialog
        open={showTotp}
        onClose={() => setShowTotp(false)}
        onVerified={() => {
          setShowTotp(false);
          transferMutation.mutate();
        }}
        title="Authorize Transfer"
        description="Please enter your 2FA code to complete the fund transfer."
      />

      <Dialog open={showStatusPopup} onOpenChange={(open) => !transferMutation.isPending && setShowStatusPopup(open)}>
        <DialogContent className="sm:max-w-sm border border-slate-200/10 bg-slate-950 p-0 overflow-hidden rounded-2xl">
          <div className="px-6 py-7 text-center text-white">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700">
              {paymentStage === "processing" && <Loader2 className="h-9 w-9 animate-spin text-violet-300" />}
              {paymentStage === "success" && <CheckCircle2 className="h-9 w-9 text-emerald-400" />}
              {paymentStage === "failed" && <XCircle className="h-9 w-9 text-rose-400" />}
            </div>

            <h3 className="text-lg font-semibold tracking-tight">
              {paymentStage === "processing" ? "Transfer Processing" : paymentStage === "success" ? "Transfer Successful" : "Transfer Failed"}
            </h3>
            <p className="mt-2 text-sm text-slate-300">{statusMessage}</p>

            {paymentStage === "processing" && (
              <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-1/2 animate-[pulse_1.1s_ease-in-out_infinite] rounded-full bg-violet-400" />
              </div>
            )}

            {paymentStage === "processing" && (
              <div className="mt-5 flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-300 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-300 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-300" />
              </div>
            )}
            {paymentStage === "failed" && (
              <Button className="mt-5 w-full bg-violet-600 hover:bg-violet-700" onClick={() => setShowStatusPopup(false)}>
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWalletTransfer;
