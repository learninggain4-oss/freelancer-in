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
import { Loader2, PlusCircle, ArrowUpRight, SendHorizontal, Search, History, Wallet, Edit2 } from "lucide-react";
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
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [addAmount, setAddAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
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

  // ... (AddMoney & Transfer Mutatons here as before)
  const addMoneyMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(addAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      const res = await supabase.functions.invoke("wallet-operations", { body: { action: "add_money", amount } });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Amount added");
      setAddAmount("");
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(transferAmount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");
      if (!selectedRecipient) throw new Error("Select a recipient");
      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "admin_wallet_transfer",
          target_profile_id: profile?.id,
          transfer_to_profile_id: selectedRecipient.id,
          amount: amt,
        },
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transferred successfully");
      setSelectedRecipient(null);
      setTransferAmount("");
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!profile)
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin inline" />
      </div>
    );

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      {/* Wallet Card Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <WalletCard
            name={profile.full_name?.join(" ") || "Admin"}
            userCode={profile.user_code?.join(", ") || ""}
            walletNumber={profile.wallet_number}
            profileId={profile.id}
            availableBalance={Number(profile.available_balance) || 0}
            holdBalance={Number(profile.hold_balance) || 0}
          />
          {/* EDIT BUTTON HERE */}
          <Button
            variant="outline"
            className="mt-3 w-full border-dashed"
            onClick={() => navigate("/admin/wallet/edit-number")}
          >
            <Edit2 className="mr-2 h-4 w-4" /> Edit Wallet Number
          </Button>
        </div>

        {/* Add Money Section ... */}
      </div>

      {/* Other sections remain the same ... */}
    </div>
  );
};

export default AdminWallet;
