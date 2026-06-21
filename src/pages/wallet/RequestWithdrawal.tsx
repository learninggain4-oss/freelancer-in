import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownToLine,
  BadgeCheck,
  AlertCircle,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Wallet,
  Landmark,
  Smartphone,
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

interface UserBankAccount {
  id: string;
  profile_id: string;
  bank_name: string;
  bank_holder_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  is_locked: boolean;
  linked_upi_app_id: string | null;
  created_at: string;
}

const maskAccount = (v: string) => {
  if (!v) return "";
  if (v.length <= 4) return v;
  return "•".repeat(v.length - 4) + v.slice(-4);
};

const RequestWithdrawal = () => {
  const { profile, refreshProfile } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [withdrawalPassword, setWithdrawalPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const basePath = window.location.pathname.includes("/employer/") ? "/employer" : "/freelancer";

  // 1. Fetch User Bank Accounts
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["user-bank-accounts", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_bank_accounts" as any)
        .select("*")
        .eq("profile_id", profile!.id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as UserBankAccount[];
    },
  });

  // 2. Fetch Bank Verifications
  const { data: bankVerifications = [] } = useQuery({
    queryKey: ["bank-verifications-by-account", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_verifications")
        .select("status, bank_account_id")
        .eq("profile_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // 3. Fetch Banks list for logos
  const { data: banks = [] } = useQuery({
    queryKey: ["banks-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banks").select("id, name, logo_path").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // 4. Fetch Payment Methods (UPI Apps Names)
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("id, name").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // 5. Fetch saved UPI apps for KYC status
  const KYC_DURATION_MS = 30 * 60 * 1000;
  const { data: savedUpiApps = [] } = useQuery({
    queryKey: ["freelancer-payment-apps", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_payment_apps" as any)
        .select("*")
        .eq("profile_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const isUpiKycEnabled = (methodId: string | null) => {
    if (!methodId) return false;
    const app = savedUpiApps.find((s: any) => s.payment_method_id === methodId);
    if (!app) return false;
    if (app.kyc_status === "kyc_enabled" && app.kyc_enabled_at) {
      const remaining = new Date(app.kyc_enabled_at).getTime() + KYC_DURATION_MS - Date.now();
      return remaining > 0;
    }
    return false;
  };

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

  const getBankLogoUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return supabase.storage.from("bank-logos").getPublicUrl(path).data.publicUrl;
  };

  const isAccountVerified = (accountId: string) =>
    bankVerifications.some((v: any) => v.bank_account_id === accountId && v.status === "verified");

  const verifiedAccounts = bankAccounts.filter(
    (acc) => isAccountVerified(acc.id) && !!acc.linked_upi_app_id && isUpiKycEnabled(acc.linked_upi_app_id),
  );
  const selectedAccount = verifiedAccounts.find((acc) => acc.id === selectedAccountId);

  const getLinkedUpiName = (linkedUpiAppId: string | null) => {
    if (!linkedUpiAppId) return null;
    const method = paymentMethods.find((m: any) => m.id === linkedUpiAppId);
    return method ? method.name : null;
  };

  const parseEdgeFunctionError = async (invokeError: any) => {
    if (!invokeError) return "Withdrawal request failed";
    const fallback = invokeError?.message || "Withdrawal request failed";
    const response = invokeError?.context;
    const parseBodyText = (raw: string) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return typeof parsed?.error === "string" ? parsed.error : null;
      } catch {
        return null;
      }
    };
    try {
      if (response?.clone && typeof response.clone === "function") {
        const text = await response.clone().text();
        const parsedError = parseBodyText(text);
        if (parsedError) return parsedError;
      } else if (response?.text && typeof response.text === "function") {
        const text = await response.text();
        const parsedError = parseBodyText(text);
        if (parsedError) return parsedError;
      }
    } catch {}
    if (typeof fallback === "string" && fallback.includes("non-2xx")) {
      return "Withdrawal request failed. Please try again.";
    }
    return fallback;
  };

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      const amount = Number(withdrawAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      if (amount > (profile?.available_balance ?? 0)) throw new Error("Insufficient balance");
      if (!selectedAccount) throw new Error("Please select a verified bank account");

      const linkedUpiName = getLinkedUpiName(selectedAccount.linked_upi_app_id);

      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "request_withdrawal",
          amount,
          bank_holder_name: selectedAccount.bank_holder_name,
          upi_id: linkedUpiName,
          bank_account_number: selectedAccount.bank_account_number,
          bank_ifsc_code: selectedAccount.bank_ifsc_code,
          bank_name: selectedAccount.bank_name,
        },
      });

      if (res.error) {
        const message = await parseEdgeFunctionError(res.error);
        throw new Error(message);
      }
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: async (data: any) => {
      const generatedOrderId = typeof data?.order_id === "string" ? data.order_id : null;
      toast.success(
        generatedOrderId
          ? `Withdrawal request submitted • Order ID: ${generatedOrderId}`
          : "Withdrawal request submitted",
      );
      setWithdrawAmount("");
      setSelectedAccountId(null);
      setShowPasswordDialog(false);
      setWithdrawalPassword("");
      refreshProfile();

      // Invalidate transactions cache specifying the exact query key to reflect the same order ID instantly
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["all-withdrawals"] }),
        queryClient.invalidateQueries({ queryKey: ["all-transactions", profile?.id] }),
        queryClient.invalidateQueries({ queryKey: ["freelancer-withdrawals"] }),
        queryClient.invalidateQueries({ queryKey: ["freelancer-transactions"] }),
      ]);
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
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > (profile?.available_balance ?? 0)) {
      toast.error("Insufficient balance");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Please select a verified bank account");
      return;
    }
    setShowPasswordDialog(true);
  };

  const handleVerifyAndWithdraw = async () => {
    if (!withdrawalPassword) {
      toast.error("Enter your withdrawal password");
      return;
    }
    setVerifyingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdrawal-password", {
        body: { action: "verify", password: withdrawalPassword },
      });
      if (error) throw new Error("Verification failed");
      if (data?.error) throw new Error(data.error);
      if (!data?.valid) {
        toast.error("Incorrect withdrawal password");
        return;
      }
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
      <div className="animate-fade-in-up">
        <button
          onClick={() => navigate(`${basePath}/wallet`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wallet
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <ArrowDownToLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Request Withdrawal</h1>
            <p className="text-sm text-muted-foreground">
              Available: ₹{(profile?.available_balance ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Password Warning */}
      {passwordStatus && !hasWithdrawalPassword && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning animate-fade-in-up">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span>You must create a Withdrawal Password before you can withdraw funds.</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 ml-1 text-warning underline"
              onClick={() => {
                const base = profile?.user_type === "Employer" ? "/employer" : "/freelancer";
                navigate(`${base}/settings/security/withdrawal-password`);
              }}
            >
              Create Now →
            </Button>
          </div>
        </div>
      )}

      {/* Wallet Inactive Warning */}
      {!(profile as any)?.wallet_active && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in-up">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your wallet is currently inactive. Withdrawals are disabled. Please contact support.</span>
        </div>
      )}

      {/* Withdrawal Form */}
      <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">Withdrawal Details</CardTitle>
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

          {/* Verified Accounts Section */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Select Verified Bank Account</Label>

            {verifiedAccounts.length > 0 ? (
              <div className="space-y-2.5">
                {verifiedAccounts.map((account) => {
                  const bankInfo = banks.find((b: any) => b.name === account.bank_name);
                  const logoUrl = bankInfo ? getBankLogoUrl((bankInfo as any).logo_path) : null;
                  const isSelected = selectedAccountId === account.id;
                  const linkedUpiName = getLinkedUpiName(account.linked_upi_app_id);

                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`w-full relative flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />}

                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="mt-0.5 h-9 w-9 shrink-0 rounded object-contain" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground shrink-0">
                          <Landmark className="h-4 w-4" />
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground truncate">{account.bank_name}</p>
                          <span className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.2 rounded font-medium border border-green-200">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">Holder: {account.bank_holder_name}</p>
                        <p className="text-xs font-mono text-foreground">
                          A/C: {maskAccount(account.bank_account_number)}
                        </p>

                        {linkedUpiName && (
                          <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-dashed border-border text-[11px] text-primary font-medium">
                            <Smartphone className="h-3 w-3" />
                            <span>Linked UPI: {linkedUpiName}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center bg-muted/20">
                <p className="text-sm text-muted-foreground">No eligible bank accounts available</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Withdrawals are only allowed to verified bank accounts with a linked UPI app.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                  onClick={() =>
                    navigate(
                      profile?.user_type === "Employer"
                        ? "/employer/profile/bank-details"
                        : "/freelancer/profile/bank-details",
                    )
                  }
                >
                  Go to Bank Details →
                </Button>
              </div>
            )}
          </div>

          <Button
            className="w-full h-12 text-sm font-semibold"
            onClick={handleWithdrawClick}
            disabled={
              withdrawMutation.isPending ||
              verifiedAccounts.length === 0 ||
              !selectedAccountId ||
              !(profile as any)?.wallet_active
            }
          >
            {withdrawMutation.isPending
              ? "Submitting..."
              : !(profile as any)?.wallet_active
                ? "Wallet Inactive"
                : verifiedAccounts.length === 0
                  ? "No Verified Bank with Linked UPI"
                  : !selectedAccountId
                    ? "Select a Bank Account"
                    : !hasWithdrawalPassword
                      ? "Set Withdrawal Password First"
                      : "Confirm & Request Withdrawal"}
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          setShowPasswordDialog(open);
          if (!open) setWithdrawalPassword("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Withdrawal Password
            </DialogTitle>
            <DialogDescription>
              Enter your withdrawal password to confirm this withdrawal of ₹
              {Number(withdrawAmount).toLocaleString("en-IN")}.
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
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
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

export default RequestWithdrawal;
