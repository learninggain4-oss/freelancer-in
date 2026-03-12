import { useState } from "react";
import WalletCard from "@/components/wallet/WalletCard";
import WalletTypeBadge from "@/components/wallet/WalletTypeBadge";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownToLine,
  BadgeCheck,
  AlertCircle,
  Receipt,
  History,
  CheckCircle2,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const EmployeeWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [selectedUpiAppId, setSelectedUpiAppId] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [withdrawalPassword, setWithdrawalPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
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

  const { data: passwordStatus } = useQuery({
    queryKey: ["withdrawal-password-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("withdrawal-password", {
        body: { action: "status" },
      });
      if (error) return { has_password: false };
      return data as { has_password: boolean };
    },
  });

  const hasWithdrawalPassword = passwordStatus?.has_password ?? false;

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
      setShowPasswordDialog(false);
      setWithdrawalPassword("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["employee-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["employee-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleWithdrawClick = () => {
    if (!hasWithdrawalPassword) {
      toast.error("Please create a Withdrawal Password first in Account Settings");
      navigate("/account-settings");
      return;
    }
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (amount > (profile?.available_balance ?? 0)) { toast.error("Insufficient balance"); return; }
    if (method === "upi" && !selectedUpiAppId) { toast.error("Please select a UPI app"); return; }
    if (method === "bank" && !savedBank) { toast.error("No bank account saved"); return; }
    setShowPasswordDialog(true);
  };

  const handleVerifyAndWithdraw = async () => {
    if (!withdrawalPassword) { toast.error("Enter your withdrawal password"); return; }
    setVerifyingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdrawal-password", {
        body: { action: "verify", password: withdrawalPassword },
      });
      if (error) throw new Error("Verification failed");
      if (data?.error) throw new Error(data.error);
      if (!data?.valid) { toast.error("Incorrect withdrawal password"); return; }
      withdrawMutation.mutate();
    } catch (err: any) {
      toast.error(err.message || "Password verification failed");
    } finally {
      setVerifyingPassword(false);
    }
  };

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">My Wallet</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage your funds & withdrawals</p>
        </div>
        <WalletTypeBadge balance={profile?.available_balance ?? 0} compact />
      </div>

      {/* Wallet Card */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <WalletCard
          name={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "Employee"}
          userCode={Array.isArray(profile?.user_code) ? profile.user_code.join("") : profile?.user_code ?? "—"}
          walletNumber={profile?.wallet_number}
          availableBalance={profile?.available_balance ?? 0}
          holdBalance={profile?.hold_balance ?? 0}
          walletActive={(profile as any)?.wallet_active ?? true}
        />
      </div>

      {/* Wallet Type Card */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
        <WalletTypeBadge balance={profile?.available_balance ?? 0} />
      </div>

      {/* Wallet Inactive Warning */}
      {!(profile as any)?.wallet_active && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in-up">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your wallet is currently inactive. Withdrawals are disabled. Please contact support.</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <button
          onClick={() => navigate("/employee/wallet/transactions")}
          className="group flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Transactions</p>
            <p className="text-[11px] text-muted-foreground">View history</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => navigate("/employee/wallet/withdrawals")}
          className="group flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-transform group-hover:scale-110">
            <History className="h-5 w-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Withdrawals</p>
            <p className="text-[11px] text-muted-foreground">Track requests</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Withdrawal Password Warning */}
      {passwordStatus && !hasWithdrawalPassword && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning animate-fade-in-up">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span>You must create a Withdrawal Password before you can withdraw funds.</span>
            <Button variant="link" size="sm" className="h-auto p-0 ml-1 text-warning underline" onClick={() => navigate("/account-settings")}>
              Create Now →
            </Button>
          </div>
        </div>
      )}

      {/* Request Withdrawal Card */}
      <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ArrowDownToLine className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">Request Withdrawal</CardTitle>
            {isBankVerified && (
              <div className="flex items-center gap-1 text-[10px] text-accent font-medium mt-0.5">
                <BadgeCheck className="h-3 w-3" /> Bank Verified
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Amount (₹)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="h-12 text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Payment Method</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={method === "upi" ? "default" : "outline"}
                className="flex-1 h-11"
                onClick={() => setMethod("upi")}
              >
                UPI
              </Button>
              <Button
                type="button"
                variant={method === "bank" ? "default" : "outline"}
                className="flex-1 h-11"
                onClick={() => setMethod("bank")}
              >
                Bank Transfer
              </Button>
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
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="absolute right-1.5 top-1.5 h-4 w-4 text-primary" />}
                        {logoUrl ? (
                          <img src={logoUrl} alt={pm?.name} className="h-10 w-10 rounded-md object-contain" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                            {pm?.name?.charAt(0) ?? "?"}
                          </div>
                        )}
                        <span className="text-xs font-medium text-foreground truncate w-full text-center">{pm?.name}</span>
                        {app.phone_number && <span className="text-[10px] text-muted-foreground">{app.phone_number}</span>}
                        {app.is_primary && <span className="text-[10px] font-medium text-primary">Primary</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-center">
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
                <div className="flex items-start gap-3 rounded-xl border p-3">
                  {bankRecord?.logo_path ? (
                    <img src={getBankLogoUrl(bankRecord.logo_path) ?? ""} alt={savedBankName ?? "Bank"} className="h-10 w-10 rounded-md object-contain shrink-0" />
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
                <div className="rounded-xl border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">No bank details saved</p>
                  <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => navigate("/profile/bank-details")}>
                    Add Bank Details in Profile →
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isBankVerified && (
            <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Bank details must be verified before withdrawing. Submit for verification in your Profile.</span>
            </div>
          )}

          <Button
            className="w-full h-12 text-sm font-semibold"
            onClick={handleWithdrawClick}
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
              : !hasWithdrawalPassword
              ? "Set Withdrawal Password First"
              : method === "upi" && !selectedUpiAppId
              ? "Select a UPI App"
              : "Enter Withdrawal"}
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => { setShowPasswordDialog(open); if (!open) setWithdrawalPassword(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Withdrawal Password
            </DialogTitle>
            <DialogDescription>
              Enter your withdrawal password to confirm this withdrawal of ₹{Number(withdrawAmount).toLocaleString("en-IN")}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter withdrawal password"
                value={withdrawalPassword}
                onChange={(e) => setWithdrawalPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyAndWithdraw()}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleVerifyAndWithdraw} disabled={verifyingPassword || withdrawMutation.isPending}>
              {verifyingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {verifyingPassword ? "Verifying..." : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeWallet;
