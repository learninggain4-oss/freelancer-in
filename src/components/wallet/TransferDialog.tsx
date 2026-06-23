import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight, CheckCircle2, XCircle, Loader2, Search, Ban } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxBalance: number;
  onSuccess: () => void;
  initialWalletNumber?: string;
}

const TransferDialog = ({ open, onOpenChange, maxBalance, onSuccess, initialWalletNumber }: TransferDialogProps) => {
  const [walletNumber, setWalletNumber] = useState(initialWalletNumber || "");
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [transferStage, setTransferStage] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Processing transfer...");

  // Sound Utility Function
  const playStatusSound = (type: "success" | "failed") => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const text = type === "success" ? "Transfer successful" : "Transfer failed";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = type === "success" ? 1.2 : 0.8; // Success high pitch, fail low pitch
      window.speechSynthesis.speak(utterance);
    }
  };

  // Unique Order ID Generator
  const generateOrderId = () => {
    return `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  useEffect(() => {
    if (open && initialWalletNumber && initialWalletNumber.length === 12) {
      setWalletNumber(initialWalletNumber);
      setRecipientName(null);
    }
  }, [initialWalletNumber, open]);

  const lookupWallet = async () => {
    if (walletNumber.length !== 12) {
      toast.error("Enter a valid 12-digit wallet number");
      return;
    }
    setLookingUp(true);
    try {
      const res = await supabase.functions.invoke("wallet-operations", {
        body: { action: "lookup_wallet", target_wallet_number: walletNumber },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) {
        toast.error(res.data.error);
        setRecipientName(null);
        return;
      }
      setRecipientName(res.data.recipient_name);
    } catch (e: any) {
      toast.error(e.message || "Failed to look up wallet");
      setRecipientName(null);
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    if (walletNumber.length === 12) {
      if (!recipientName && !lookingUp) lookupWallet();
    } else {
      if (recipientName) setRecipientName(null);
    }
  }, [walletNumber]);

  const transferMutation = useMutation({
    onMutate: () => {
      setTransferStage("processing");
      setStatusMessage("Processing transfer...");
      setStatusDialogOpen(true);
    },
    mutationFn: async () => {
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");
      if (amt > maxBalance) throw new Error("Insufficient balance");
      if (!recipientName) throw new Error("Please look up the wallet first");

      const orderId = generateOrderId();
      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "transfer_to_wallet",
          target_wallet_number: walletNumber,
          amount: amt,
          order_id: orderId,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return { ...res.data, amount: amt, order_id: orderId };
    },
    onSuccess: (data) => {
      setTransferStage("success");
      playStatusSound("success"); // Success Sound
      setStatusMessage(
        `₹${Number(data.amount).toLocaleString("en-IN")} transferred successfully\nOrder ID: ${data.order_id}`,
      );
      setTimeout(() => {
        setStatusDialogOpen(false);
        setTransferStage("idle");
        toast.success(`₹${Number(data.amount).toLocaleString("en-IN")} transferred successfully`);
        setWalletNumber("");
        setAmount("");
        setRecipientName(null);
        onOpenChange(false);
        onSuccess();
      }, 3000);
    },
    onError: (e: any) => {
      setTransferStage("failed");
      playStatusSound("failed"); // Failure Sound
      setStatusMessage(e.message || "Transfer failed. Please try again.");
      toast.error(e.message || "Transfer failed. Please try again.");
    },
  });

  return (
    <>
      {/* CSS for Tick and Error Animations */}
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake-error {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-success-tick {
          animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-error-ban {
          animation: pop-in 0.3s ease-out forwards, shake-error 0.5s ease-in-out 0.3s forwards;
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Transfer to Wallet
            </DialogTitle>
            <DialogDescription>Send money to another FlexPay wallet using their wallet number.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Recipient Wallet Number</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="12-digit wallet number"
                  value={walletNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                    setWalletNumber(val);
                    setRecipientName(null);
                  }}
                  maxLength={12}
                  className="flex-1 tracking-widest font-semibold"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={lookupWallet}
                  disabled={lookingUp || walletNumber.length !== 12}
                >
                  {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {recipientName && <p className="text-xs text-accent font-medium">✓ {recipientName}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">Available: ₹{maxBalance.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => transferMutation.mutate()}
              disabled={transferMutation.isPending || !recipientName || !amount}
            >
              {transferMutation.isPending ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          if (!transferMutation.isPending) setStatusDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-sm">
          <div className="space-y-4 text-center py-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-700">
              {transferStage === "processing" && <Loader2 className="h-10 w-10 animate-spin" />}

              {/* Green Tick Animation */}
              {transferStage === "success" && (
                <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-success-tick drop-shadow-md" />
              )}

              {/* 🚫 (Ban) Shake Animation */}
              {transferStage === "failed" && (
                <Ban className="h-16 w-16 text-rose-500 animate-error-ban drop-shadow-md" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {transferStage === "processing"
                  ? "Transfer Processing"
                  : transferStage === "success"
                    ? "Transfer Successful"
                    : "Transfer Failed"}
              </p>
              <p className="text-sm text-slate-500 whitespace-pre-line">{statusMessage}</p>
            </div>
            {transferStage === "processing" && (
              <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-slate-500" />
              </div>
            )}
            {transferStage === "failed" && (
              <Button className="w-full" onClick={() => setStatusDialogOpen(false)}>
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransferDialog;
