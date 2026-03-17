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
import { ArrowLeftRight, Loader2, Search } from "lucide-react";
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

  const transferMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");
      if (amt > maxBalance) throw new Error("Insufficient balance");
      if (!recipientName) throw new Error("Please look up the wallet first");

      const res = await supabase.functions.invoke("wallet-operations", {
        body: { action: "transfer_to_wallet", target_wallet_number: walletNumber, amount: amt },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`₹${Number(amount).toLocaleString("en-IN")} transferred successfully`);
      setWalletNumber("");
      setAmount("");
      setRecipientName(null);
      onOpenChange(false);
      onSuccess();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
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
            {recipientName && (
              <p className="text-xs text-accent font-medium">✓ {recipientName}</p>
            )}
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
            <p className="text-[11px] text-muted-foreground">
              Available: ₹{maxBalance.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => transferMutation.mutate()}
            disabled={transferMutation.isPending || !recipientName || !amount}
          >
            {transferMutation.isPending ? "Transferring..." : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;
