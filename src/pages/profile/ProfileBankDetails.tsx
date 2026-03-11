import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, User, Save, X, ArrowLeft, Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  created_at: string;
}

const MAX_BANK_ACCOUNTS = 5;

const ProfileBankDetails = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const base = profile?.user_type === "employee" ? "/employee" : "/client";

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

  const { data: bankAccounts = [], isLoading } = useQuery({
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
      bank_ifsc_code: "",
    });
    setAdding(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.bank_holder_name?.trim() || !form.bank_name?.trim() || !form.bank_account_number?.trim() || !form.bank_ifsc_code?.trim()) {
        throw new Error("All fields are required.");
      }

      // Check for duplicate account number locally
      const duplicate = bankAccounts.find(
        (a) => a.bank_account_number === form.bank_account_number.trim()
      );
      if (duplicate) {
        throw new Error("This account number is already registered.");
      }

      const { error } = await supabase
        .from("user_bank_accounts" as any)
        .insert({
          profile_id: profile!.id,
          bank_holder_name: form.bank_holder_name.trim(),
          bank_name: form.bank_name.trim(),
          bank_account_number: form.bank_account_number.trim(),
          bank_ifsc_code: form.bank_ifsc_code.trim(),
          is_locked: true,
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

  const selectedBank = banks.find((b) => b.name === form.bank_name);

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
              <Input value={form.bank_holder_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_holder_name: e.target.value }))} />
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
                          <img
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
              <Input value={form.bank_account_number ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_account_number: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IFSC Code</Label>
              <Input value={form.bank_ifsc_code ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_ifsc_code: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">⚠️ Once saved, bank details cannot be changed. Contact admin to modify.</p>
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
            return (
              <Card key={account.id}>
                <CardContent className="space-y-1 pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Account {i + 1}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      <span>Locked</span>
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
                      <img src={logoUrl} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded object-contain" />
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
                      <p className="truncate text-sm font-medium text-foreground">{account.bank_account_number}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-1">
                    <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">IFSC Code</p>
                      <p className="truncate text-sm font-medium text-foreground">{account.bank_ifsc_code}</p>
                    </div>
                  </div>
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
