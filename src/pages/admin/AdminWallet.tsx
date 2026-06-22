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
import { Loader2, PlusCircle, ArrowUpRight, SendHorizontal, Search, History, Wallet, Pencil } from "lucide-react";
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
  const [editAmount, setEditAmount] = useState(""); // New state for edit
  const [transferAmount, setTransferAmount] = useState("");
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [transferDescription, setTransferDescription] = useState("");
  const [showTotpForTransfer, setShowTotpForTransfer] = useState(false);
  const [showTotpForAddMoney, setShowTotpForAddMoney] = useState(false);

  const queryClient = useQueryClient();

  const { data: totpStatus } = useQuery({
    queryKey: ["admin-totp-status"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("admin-totp", { body: { action: "check_status" } });
      return res.data as { is_enabled: boolean };
    },
  });

  const requireTotp = totpStatus?.is_enabled ?? false;

  // Edit Balance Mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(editAmount);
      if (isNaN(amount)) throw new Error("Enter a valid amount");
      const { data, error } = await supabase.functions.invoke("wallet-operations", {
        body: { action: "admin_set_balance", amount, profile_id: profile?.id },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Balance updated successfully");
      setEditAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

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

  const transferMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(transferAmount);
      if (!amt || amt <= 0 || !selectedRecipient) throw new Error("Check details");
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
      setTransferSearch("");
      setSelectedRecipient(null);
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      {/* ... (Keep your existing Header here) ... */}

      <div className="grid gap-6 md:grid-cols-2">
        <WalletCard
          name={profile?.full_name?.join(" ") || "Admin"}
          userCode={profile?.user_code?.join(", ") || ""}
          walletNumber={profile?.wallet_number || ""}
          profileId={profile?.id || ""}
          availableBalance={Number(profile?.available_balance) || 0}
          holdBalance={Number(profile?.hold_balance) || 0}
        />

        {/* Add Money Card */}
        <div className="rounded-3xl border p-6" style={{ background: T.card, borderColor: T.border }}>
          <div className="mb-4 flex items-center gap-3">
            <PlusCircle className="text-indigo-500" />
            <h3 className="font-bold" style={{ color: T.text }}>
              Add Money
            </h3>
          </div>
          <Input
            type="number"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="0.00"
            className="mb-4"
          />
          <Button
            className="w-full"
            onClick={() => (requireTotp ? setShowTotpForAddMoney(true) : addMoneyMutation.mutate())}
          >
            Add Money
          </Button>
        </div>

        {/* New Edit Balance Card */}
        <div className="rounded-3xl border p-6" style={{ background: T.card, borderColor: T.border }}>
          <div className="mb-4 flex items-center gap-3">
            <Pencil className="text-amber-500" />
            <h3 className="font-bold" style={{ color: T.text }}>
              Edit Balance
            </h3>
          </div>
          <Input
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            placeholder="New total balance"
            className="mb-4"
          />
          <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => updateBalanceMutation.mutate()}>
            Update Total Balance
          </Button>
        </div>
      </div>

      {/* ... (Keep your existing Transfer and History sections here) ... */}

      <TotpVerifyDialog
        open={showTotpForAddMoney}
        onClose={() => setShowTotpForAddMoney(false)}
        onVerified={() => {
          setShowTotpForAddMoney(false);
          addMoneyMutation.mutate();
        }}
        title="Verify"
        description="2FA Required"
      />
    </div>
  );
};

export default AdminWallet;
