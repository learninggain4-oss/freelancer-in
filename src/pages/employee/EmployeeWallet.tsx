import { useState } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownToLine, BadgeCheck, AlertCircle, ArrowRight, Receipt, History } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const EmployeeWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const savedUpi = profile?.upi_id;
  const savedBank = profile?.bank_account_number;
  const savedIfsc = profile?.bank_ifsc_code;
  const savedBankName = profile?.bank_name;
  const savedHolderName = profile?.bank_holder_name;

  const { data: bankVerification } = useQuery({
    queryKey: ["bank-verification-status", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_verifications")
        .select("status")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      return data;
    },
  });

  const isBankVerified = bankVerification?.status === "verified";

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      const amount = Number(withdrawAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      if (amount > (profile?.available_balance ?? 0)) throw new Error("Insufficient balance");
      if (method === "upi" && !savedUpi) throw new Error("No UPI ID saved in your profile");
      if (method === "bank" && !savedBank) throw new Error("No bank account saved in your profile");
      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "request_withdrawal",
          amount,
          bank_holder_name: savedHolderName || null,
          upi_id: method === "upi" ? savedUpi : null,
          bank_account_number: method === "bank" ? savedBank : null,
          bank_ifsc_code: method === "bank" ? savedIfsc : null,
          bank_name: method === "bank" ? savedBankName : null,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["employee-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["employee-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-foreground">Wallet</h1>

      <WalletCard
        name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Employee"}
        userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
        walletNumber={profile?.wallet_number}
        availableBalance={profile?.available_balance ?? 0}
        holdBalance={profile?.hold_balance ?? 0}
        walletActive={(profile as any)?.wallet_active ?? true}
      />

      {!(profile as any)?.wallet_active && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your wallet is currently inactive. Withdrawals are disabled. Please contact support for assistance.</span>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="flex h-auto flex-col items-center gap-2 py-4"
          onClick={() => navigate("/employee/wallet/transactions")}
        >
          <Receipt className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Transactions</span>
        </Button>
        <Button
          variant="outline"
          className="flex h-auto flex-col items-center gap-2 py-4"
          onClick={() => navigate("/employee/wallet/withdrawals")}
        >
          <History className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Withdrawals</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownToLine className="h-4 w-4" /> Request Withdrawal
            {isBankVerified && <BadgeCheck className="h-4 w-4 text-accent" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex gap-2">
              <Button type="button" variant={method === "upi" ? "default" : "outline"} className="flex-1" onClick={() => setMethod("upi")}>UPI</Button>
              <Button type="button" variant={method === "bank" ? "default" : "outline"} className="flex-1" onClick={() => setMethod("bank")}>Bank Transfer</Button>
            </div>
          </div>
          {method === "upi" ? (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Saved UPI Details</p>
              {savedUpi ? (
                <>
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">Holder:</span> {savedHolderName || "—"}</p>
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">UPI ID:</span> {savedUpi}</p>
                </>
              ) : (
                <p className="text-sm text-destructive">Not set — update in Profile</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Saved Bank Details</p>
              {savedBank ? (
                <>
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">Holder:</span> {savedHolderName || "—"}</p>
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">Bank:</span> {savedBankName || "—"}</p>
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">A/C:</span> {savedBank}</p>
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">IFSC:</span> {savedIfsc || "—"}</p>
                </>
              ) : (
                <p className="text-sm text-destructive">Not set — update in Profile</p>
              )}
            </div>
          )}
          {!isBankVerified && (
            <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3 text-sm text-warning">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Your bank details must be verified before you can withdraw. Go to your Profile to submit for verification.</span>
            </div>
          )}
          <Button className="w-full" onClick={() => withdrawMutation.mutate()} disabled={withdrawMutation.isPending || !isBankVerified || !(profile as any)?.wallet_active}>
            {withdrawMutation.isPending ? "Submitting..." : !(profile as any)?.wallet_active ? "Wallet Inactive" : !isBankVerified ? "Bank Verification Required" : "Enter Withdrawal"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeWallet;
