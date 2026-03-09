import { useState } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownToLine, BadgeCheck, AlertCircle, Receipt, History, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const EmployeeWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [selectedUpiAppId, setSelectedUpiAppId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // Fetch employee's saved UPI payment apps with logos
  const { data: upiApps } = useQuery({
    queryKey: ["employee-upi-apps", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_payment_apps")
        .select("*, payment_methods(id, name, logo_path)")
        .eq("profile_id", profile!.id)
        .order("is_primary", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch bank logo
  const { data: bankRecord } = useQuery({
    queryKey: ["bank-logo", savedBankName],
    enabled: !!savedBankName,
    queryFn: async () => {
      const { data } = await supabase
        .from("banks")
        .select("name, logo_path")
        .eq("name", savedBankName!)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
  });

  const getLogoUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return supabase.storage.from("payment-method-logos").getPublicUrl(path).data.publicUrl;
  };

  const getBankLogoUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return supabase.storage.from("bank-logos").getPublicUrl(path).data.publicUrl;
  };

  const selectedApp = upiApps?.find((a) => a.id === selectedUpiAppId);

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      const amount = Number(withdrawAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      if (amount > (profile?.available_balance ?? 0)) throw new Error("Insufficient balance");
      if (method === "upi" && !selectedApp) throw new Error("Please select a UPI app");
      if (method === "bank" && !savedBank) throw new Error("No bank account saved in your profile");

      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "request_withdrawal",
          amount,
          bank_holder_name: savedHolderName || null,
          upi_id: method === "upi" ? (selectedApp as any)?.payment_methods?.name : null,
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
      setSelectedUpiAppId(null);
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
        <Button variant="outline" className="flex h-auto flex-col items-center gap-2 py-4" onClick={() => navigate("/employee/wallet/transactions")}>
          <Receipt className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Transactions</span>
        </Button>
        <Button variant="outline" className="flex h-auto flex-col items-center gap-2 py-4" onClick={() => navigate("/employee/wallet/withdrawals")}>
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
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Select UPI App</p>
              {upiApps && upiApps.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {upiApps.map((app) => {
                    const pm = (app as any).payment_methods;
                    const logoUrl = getLogoUrl(pm?.logo_path);
                    const isSelected = selectedUpiAppId === app.id;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUpiAppId(app.id)}
                        className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="absolute right-1.5 top-1.5 h-4 w-4 text-primary" />
                        )}
                        {logoUrl ? (
                          <img src={logoUrl} alt={pm?.name} className="h-10 w-10 rounded-md object-contain" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                            {pm?.name?.charAt(0) ?? "?"}
                          </div>
                        )}
                        <span className="text-xs font-medium text-foreground truncate w-full text-center">{pm?.name}</span>
                        {app.phone_number && (
                          <span className="text-[10px] text-muted-foreground">{app.phone_number}</span>
                        )}
                        {app.is_primary && (
                          <span className="text-[10px] font-medium text-primary">Primary</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">No UPI apps saved</p>
                  <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => navigate("/profile/upi-apps")}>
                    Add UPI Apps in Profile →
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Bank Account Details</p>
              {savedBank ? (
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  {bankRecord?.logo_path ? (
                    <img
                      src={getBankLogoUrl(bankRecord.logo_path) ?? ""}
                      alt={savedBankName ?? "Bank"}
                      className="h-10 w-10 rounded-md object-contain shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground shrink-0">
                      {savedBankName?.charAt(0) ?? "B"}
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{savedBankName || "Bank"}</p>
                    <p className="text-xs text-muted-foreground">Holder: {savedHolderName || "—"}</p>
                    <p className="text-xs text-muted-foreground">A/C: {savedBank}</p>
                    <p className="text-xs text-muted-foreground">IFSC: {savedIfsc || "—"}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">No bank details saved</p>
                  <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => navigate("/profile/bank-details")}>
                    Add Bank Details in Profile →
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isBankVerified && (
            <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3 text-sm text-warning">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Your bank details must be verified before you can withdraw. Go to your Profile to submit for verification.</span>
            </div>
          )}
          <Button
            className="w-full"
            onClick={() => withdrawMutation.mutate()}
            disabled={
              withdrawMutation.isPending ||
              !isBankVerified ||
              !(profile as any)?.wallet_active ||
              (method === "upi" && !selectedUpiAppId)
            }
          >
            {withdrawMutation.isPending
              ? "Submitting..."
              : !(profile as any)?.wallet_active
              ? "Wallet Inactive"
              : !isBankVerified
              ? "Bank Verification Required"
              : method === "upi" && !selectedUpiAppId
              ? "Select a UPI App"
              : "Enter Withdrawal"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeWallet;
