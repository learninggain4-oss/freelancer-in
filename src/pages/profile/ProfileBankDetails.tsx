import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Landmark,
  User,
  Save,
  X,
  ArrowLeft,
  Plus,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

interface Bank {
  id: string;
  name: string;
  logo_path: string | null;
}

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

interface PaymentMethod {
  id: string;
  name: string;
}

interface SavedApp {
  id: string;
  payment_method_id: string;
  kyc_status: string | null;
  kyc_enabled_at: string | null;
}

const MAX_BANK_ACCOUNTS = 5;
const KYC_DURATION_MS = 30 * 60 * 1000;

const maskAccount = (v: string) => {
  if (!v) return "";
  if (v.length <= 4) return v;
  return "•".repeat(v.length - 4) + v.slice(-4);
};

const maskIfsc = (v: string) => {
  if (!v) return "";
  if (v.length <= 4) return v;
  return "•".repeat(v.length - 4) + v.slice(-4);
};

const ProfileBankDetails = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  // UPI ആപ്പ് സെലക്ഷൻ നിലനിർത്താനുള്ള ലോക്കൽ സ്റ്റേറ്റ്
  const [localLinkedApps, setLocalLinkedApps] = useState<Record<string, string>>({});

  const { pathname } = useLocation();
  const base = pathname.startsWith("/freelancer")
    ? "/freelancer"
    : pathname.startsWith("/employer")
      ? "/employer"
      : "/employee";

  // 1. Fetch Banks List
  const { data: banks = [] } = useQuery({
    queryKey: ["banks-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("id, name, logo_path")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Bank[];
    },
  });

  // 2. Fetch User Bank Accounts (loadingAccounts ഇതിലേക്ക് ചേർത്തു)
  const { data: bankAccounts = [], isLoading: loadingAccounts } = useQuery({
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

  // 3. Fetch Payment Methods (UPI Apps Names)
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("id, name").eq("is_active", true);
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  // 4. Fetch User Saved UPI Apps (loadingSavedApps ഇതിലേക്ക് ചേർത്തു)
  const { data: savedUpiApps = [], isLoading: loadingSavedApps } = useQuery({
    queryKey: ["freelancer-payment-apps", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_payment_apps" as any)
        .select("*")
        .eq("profile_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as unknown as SavedApp[];
    },
  });

  // Check if a UPI app has active KYC
  const isUpiKycEnabled = (methodId: string) => {
    const app = savedUpiApps.find((s) => s.payment_method_id === methodId);
    if (!app) return false;
    if (app.kyc_status === "kyc_enabled" && app.kyc_enabled_at) {
      const remaining = new Date(app.kyc_enabled_at).getTime() + KYC_DURATION_MS - Date.now();
      return remaining > 0;
    }
    return false;
  };

  // 🔄 ബാക്ക് അടിച്ചു വരുമ്പോൾ ഒറിജിനൽ വാല്യൂ റിസെറ്റ് ആകാതിരിക്കാൻ ലോഡിങ് കഴിഞ്ഞ ശേഷം മാത്രം റൺ ചെയ്യുന്നു
  useEffect(() => {
    if (!loadingAccounts && bankAccounts.length > 0) {
      const initialMapping: Record<string, string> = {};
      bankAccounts.forEach((acc) => {
        initialMapping[acc.id] = acc.linked_upi_app_id || "none";
      });
      setLocalLinkedApps(initialMapping);
    }
  }, [bankAccounts, loadingAccounts]);

  // 🔄 Auto-unlink the UPI app in DB when its KYC becomes disconnected
  useEffect(() => {
    if (loadingAccounts || loadingSavedApps) return;
    bankAccounts.forEach((acc) => {
      if (acc.linked_upi_app_id && !isUpiKycEnabled(acc.linked_upi_app_id)) {
        linkUpiMutation.mutate({ accountId: acc.id, upiAppId: null });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankAccounts, savedUpiApps, loadingAccounts, loadingSavedApps]);

  // 5. Fetch Bank Verifications
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

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("bank-logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const startAdding = () => {
    if (bankAccounts.length >= MAX_BANK_ACCOUNTS) {
      toast.error(`Maximum ${MAX_BANK_ACCOUNTS} bank accounts allowed.`);
      return;
    }
    setForm({
      bank_holder_name: "",
      bank_name: "",
      bank_account_number: "",
      bank_account_number_confirm: "",
      bank_ifsc_code: "",
    });
    setAdding(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (
        !form.bank_holder_name?.trim() ||
        !form.bank_name?.trim() ||
        !form.bank_account_number?.trim() ||
        !form.bank_ifsc_code?.trim()
      ) {
        throw new Error("All fields are required.");
      }
      if (!form.bank_account_number_confirm?.trim()) {
        throw new Error("Please confirm your account number.");
      }
      if (form.bank_account_number.trim() !== form.bank_account_number_confirm.trim()) {
        throw new Error("Account numbers do not match.");
      }

      const duplicate = bankAccounts.find((a) => a.bank_account_number === form.bank_account_number.trim());
      if (duplicate) {
        throw new Error("This account number is already registered.");
      }

      const { error } = await supabase.from("user_bank_accounts" as any).insert({
        profile_id: profile!.id,
        bank_holder_name: form.bank_holder_name.trim(),
        bank_name: form.bank_name.trim(),
        bank_account_number: form.bank_account_number.trim(),
        bank_ifsc_code: form.bank_ifsc_code.trim().toUpperCase(),
        is_locked: true,
        linked_upi_app_id: null,
      } as any);

      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          throw new Error("This account number is already registered.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Bank account added successfully.");
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ["user-bank-accounts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const linkUpiMutation = useMutation({
    mutationFn: async ({ accountId, upiAppId }: { accountId: string; upiAppId: string | null }) => {
      const { data, error } = await supabase
        .from("user_bank_accounts" as any)
        .update({ linked_upi_app_id: upiAppId } as any)
        .eq("id", accountId)
        .select("id, linked_upi_app_id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Could not update bank account. Please try again.");
      }
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.upiAppId ? "UPI App successfully linked!" : "UPI App unlinked.");
      queryClient.invalidateQueries({ queryKey: ["user-bank-accounts"] });
    },
    onError: (e: any, vars) => {
      setLocalLinkedApps((prev) => {
        const acc = bankAccounts.find((a) => a.id === vars.accountId);
        return { ...prev, [vars.accountId]: acc?.linked_upi_app_id || "none" };
      });
      toast.error(e?.message || "Failed to update UPI link.");
    },
  });

  const isAccountVerified = (accountId: string) =>
    bankVerifications.some((v: any) => v.bank_account_id === accountId && v.status === "verified");

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Bank Details</h1>
        {!adding && bankAccounts.length < MAX_BANK_ACCOUNTS && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={startAdding}>
            <Plus className="mr-1 h-3 w-3" /> Add Bank
          </Button>
        )}
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <Label className="text-xs">Account Holder Name</Label>
              <Input
                value={form.bank_holder_name ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, bank_holder_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bank Name</Label>
              <Select value={form.bank_name ?? ""} onValueChange={(val) => setForm((p) => ({ ...p, bank_name: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.name}>
                      <div className="flex items-center gap-2">
                        {bank.logo_path ? (
                          <img loading="lazy" decoding="async"
                            src={getLogoUrl(bank.logo_path) || ""}
                            alt={bank.name}
                            className="h-5 w-5 rounded object-contain"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{bank.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Account Number</Label>
              <Input
                value={form.bank_account_number ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, bank_account_number: e.target.value }))}
                onPaste={(e) => e.preventDefault()}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confirm Account Number</Label>
              <Input
                value={form.bank_account_number_confirm ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, bank_account_number_confirm: e.target.value }))}
                onPaste={(e) => e.preventDefault()}
                autoComplete="off"
              />
              {form.bank_account_number_confirm && form.bank_account_number !== form.bank_account_number_confirm && (
                <p className="text-xs text-destructive">Account numbers do not match.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IFSC Code</Label>
              <Input
                value={form.bank_ifsc_code ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, bank_ifsc_code: e.target.value.toUpperCase() }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Once saved, bank details cannot be changed. Contact admin to modify.
            </p>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="mr-1 h-3 w-3" /> Save
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {bankAccounts.length === 0 && !adding ? (
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Landmark className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No bank accounts added</p>
            <p className="text-xs text-muted-foreground mt-1">Add up to {MAX_BANK_ACCOUNTS} bank accounts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bankAccounts.map((account, i) => {
            const bankInfo = banks.find((b) => b.name === account.bank_name);
            const logoUrl = bankInfo ? getLogoUrl(bankInfo.logo_path) : null;
            const verified = isAccountVerified(account.id);

            const currentSelectedValue = localLinkedApps[account.id] || "none";

            // 🔄 ക്വറി ബാക്ക്ഗ്രൗണ്ടിൽ റീ-ഫെച്ച് ചെയ്യുമ്പോൾ (loading ടൈമിൽ) ഡ്രോപ്പ്ഡൗൺ ആക്ടീവ് ആയിത്തന്നെ കാണിക്കാൻ ട്രൂ ആക്കി നിർത്തുന്നു
            const isCurrentAppKycActive =
              !loadingSavedApps && currentSelectedValue !== "none" ? isUpiKycEnabled(currentSelectedValue) : true;

            // 🔒 ആപ്പ് ലിങ്ക്ഡ് ആണെങ്കിൽ ബോക്സ് ലോക്ക് ആയി നിൽക്കും
            const isDropdownLocked = currentSelectedValue !== "none" && isCurrentAppKycActive;

            // ⚠️ ക്വറി ലോഡിങ് പൂർണ്ണമായി കഴിഞ്ഞിട്ട്, KYC ഡിസ്കണക്ട് ആയാൽ മാത്രം 'No UPI App (Unlink)' ഓപ്ഷൻ കാണിക്കും!
            const showUnlinkOption = currentSelectedValue === "none" || (!loadingSavedApps && !isCurrentAppKycActive);

            return (
              <Card key={account.id}>
                <CardContent className="space-y-1 pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Account {i + 1}</span>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>Locked</span>
                      </div>
                      {verified ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <ShieldAlert className="h-3 w-3" />
                          <span>Unverified</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-1">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Holder Name</p>
                      <p className="truncate text-sm font-medium text-foreground">{account.bank_holder_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-1">
                    {logoUrl ? (
                      <img loading="lazy" decoding="async" src={logoUrl} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded object-contain" />
                    ) : (
                      <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Bank Name</p>
                      <p className="truncate text-sm font-medium text-foreground">{account.bank_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-1">
                    <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="truncate text-sm font-mono font-medium text-foreground tracking-wider">
                        {maskAccount(account.bank_account_number)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-1">
                    <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">IFSC Code</p>
                      <p className="truncate text-sm font-mono font-medium text-foreground tracking-wider">
                        {maskIfsc(account.bank_ifsc_code)}
                      </p>
                    </div>
                  </div>

                  {/* UPI App Selection Dropdown Section */}
                  <div className="mt-3 pt-3 border-t border-dashed border-border space-y-1.5">
                    {/* NEW: Title with Navigation Button to UPI Apps */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1 text-muted-foreground">
                        <Smartphone className="h-3 w-3" /> Linked UPI App
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-[10px] text-primary hover:underline flex items-center"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`${base}/profile/upi-apps`);
                        }}
                      >
                        Setup UPI App <ExternalLink className="ml-1 h-2.5 w-2.5" />
                      </Button>
                    </div>

                    <Select
                      value={currentSelectedValue}
                      disabled={isDropdownLocked || loadingSavedApps}
                      onValueChange={(val) => {
                        setLocalLinkedApps((prev) => ({
                          ...prev,
                          [account.id]: val,
                        }));

                        linkUpiMutation.mutate({
                          accountId: account.id,
                          upiAppId: val === "none" ? null : val,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full h-9 text-xs bg-background">
                        <SelectValue placeholder="No UPI app linked" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* ⚠️ KYC ഡിസ്കണക്ട് ആയാൽ മാത്രം ഡ്രോപ്പ്ഡൗണിൽ ഈ ഓപ്ഷൻ കാണിക്കും */}
                        {showUnlinkOption && <SelectItem value="none">No UPI App (Unlink)</SelectItem>}

                        {paymentMethods.map((method) => {
                          const kycActive = isUpiKycEnabled(method.id);

                          return (
                            <SelectItem key={method.id} value={method.id} disabled={!kycActive}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <span>{method.name}</span>
                                {!kycActive && (
                                  <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded">
                                    KYC Disconnected
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* ഇൻഫർമേഷൻ സ്റ്റാറ്റസ് മെസ്സേജുകൾ */}
                    {isDropdownLocked && (
                      <p className="text-[10px] text-green-600 flex items-center gap-0.5">
                        🔒 UPI app linked & locked. Cannot be unlinked unless KYC disconnects.
                      </p>
                    )}
                    {currentSelectedValue !== "none" && !loadingSavedApps && !isCurrentAppKycActive && (
                      <p className="text-[10px] text-destructive flex items-center gap-0.5">
                        ⚠️ KYC Disconnected. Unlink option is now available above.
                      </p>
                    )}
                  </div>

                  {!verified && (
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      onClick={() => navigate(`${base}/profile/bank-verification`)}
                    >
                      <ShieldCheck className="mr-1 h-3 w-3" /> Verify Bank
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {bankAccounts.length > 0 && bankAccounts.length < MAX_BANK_ACCOUNTS && !adding && (
        <p className="text-xs text-center text-muted-foreground">
          {bankAccounts.length} of {MAX_BANK_ACCOUNTS} bank accounts used
        </p>
      )}
    </div>
  );
};

export default ProfileBankDetails;
