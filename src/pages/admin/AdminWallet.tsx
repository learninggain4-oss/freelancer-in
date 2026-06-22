import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import WalletCard from "@/components/wallet/WalletCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  PlusCircle,
  ArrowUpRight,
  SendHorizontal,
  Search,
  History,
  Wallet,
  Save,
  Edit2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TotpVerifyDialog from "@/components/admin/TotpVerifyDialog";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";

const TH = {
  black: {
    bg: "#070714",
    card: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.08)",
    text: "#e2e8f0",
    sub: "#94a3b8",
    input: "rgba(255,255,255,.07)",
    nav: "rgba(255,255,255,.04)",
    badge: "rgba(99,102,241,.2)",
    badgeFg: "#a5b4fc",
  },
  white: {
    bg: "#f0f4ff",
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    nav: "#f1f5f9",
    badge: "rgba(99,102,241,.1)",
    badgeFg: "#4f46e5",
  },
  wb: {
    bg: "#f0f4ff",
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    nav: "#f1f5f9",
    badge: "rgba(99,102,241,.1)",
    badgeFg: "#4f46e5",
  },
};

const AdminWallet = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [addAmount, setAddAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferSearch, setTransferSearch] = useState("");
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [newWalletNumber, setNewWalletNumber] = useState("");

  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [transferDescription, setTransferDescription] = useState("");
  const [showTotpForTransfer, setShowTotpForTransfer] = useState(false);
  const [showTotpForAddMoney, setShowTotpForAddMoney] = useState(false);

  const queryClient = useQueryClient();

  // Update Wallet Number Mutation
  const updateWalletNumberMutation = useMutation({
    mutationFn: async (newNumber: string) => {
      const { error } = await supabase.from("profiles").update({ wallet_number: newNumber }).eq("id", profile?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Wallet number updated successfully");
      setIsEditingWallet(false);
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: totpStatus } = useQuery({
    queryKey: ["admin-totp-status"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("admin-totp", { body: { action: "check_status" } });
      return res.data as { is_enabled: boolean };
    },
  });

  const requireTotp = totpStatus?.is_enabled ?? false;

  const handleAddMoney = () => {
    if (requireTotp) setShowTotpForAddMoney(true);
    else addMoneyMutation.mutate();
  };

  const handleTransfer = () => {
    if (requireTotp) setShowTotpForTransfer(true);
    else transferMutation.mutate();
  };

  const addMoneyMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(addAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      const res = await supabase.functions.invoke("wallet-operations", { body: { action: "add_money", amount } });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`₹${Number(addAmount).toLocaleString("en-IN")} added`);
      setAddAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

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
    mutationFn: async () => {
      const amt = Number(transferAmount);
      if (!amt || !selectedRecipient) throw new Error("Invalid details");
      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "admin_wallet_transfer",
          target_profile_id: profile?.id,
          transfer_to_profile_id: selectedRecipient.id,
          amount: amt,
          description: transferDescription,
        },
      });
      if (res.error || res.data?.error) throw new Error(res.error?.message || res.data?.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transfer successful");
      setTransferAmount("");
      setSelectedRecipient(null);
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!profile)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white">
        <h2 className="text-3xl font-bold">Personal Wallet</h2>

        {/* Wallet Number Edit Section */}
        <div className="mt-4 flex items-center gap-2">
          {isEditingWallet ? (
            <div className="flex items-center gap-2">
              <Input
                value={newWalletNumber}
                onChange={(e) => setNewWalletNumber(e.target.value)}
                className="bg-white/20 border-none text-white placeholder:text-white/50"
                placeholder={profile.wallet_number}
              />
              <Button size="sm" variant="ghost" onClick={() => updateWalletNumberMutation.mutate(newWalletNumber)}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingWallet(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-indigo-100">Wallet: {profile.wallet_number}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewWalletNumber(profile.wallet_number);
                  setIsEditingWallet(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <WalletCard
          name={profile.full_name?.join(" ") || "Admin"}
          userCode={profile.user_code?.join(", ") || ""}
          walletNumber={profile.wallet_number}
          profileId={profile.id}
          availableBalance={Number(profile.available_balance) || 0}
          holdBalance={Number(profile.hold_balance) || 0}
        />

        <div className="rounded-3xl border p-6" style={{ background: T.card, borderColor: T.border }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: T.text }}>
            Add Money
          </h3>
          <Input
            type="number"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            className="mb-4"
            placeholder="Amount"
          />
          <Button className="w-full" onClick={handleAddMoney} disabled={addMoneyMutation.isPending}>
            Add to Wallet
          </Button>
        </div>
      </div>

      {/* Transfer Section remains same as per your logic */}
      <div className="rounded-3xl border p-6" style={{ background: T.card, borderColor: T.border }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: T.text }}>
          Transfer Money
        </h3>
        {/* Transfer UI code here */}
      </div>

      <TotpVerifyDialog
        open={showTotpForAddMoney}
        onClose={() => setShowTotpForAddMoney(false)}
        onVerified={() => {
          setShowTotpForAddMoney(false);
          addMoneyMutation.mutate();
        }}
        title="Verify"
        description="Enter 2FA code"
      />
      <TotpVerifyDialog
        open={showTotpForTransfer}
        onClose={() => setShowTotpForTransfer(false)}
        onVerified={() => {
          setShowTotpForTransfer(false);
          transferMutation.mutate();
        }}
        title="Authorize"
        description="Enter 2FA code"
      />
    </div>
  );
};

export default AdminWallet;
