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
  Edit2,
  Check,
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

  // States
  const [addAmount, setAddAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [transferDescription, setTransferDescription] = useState("");
  const [showTotpForTransfer, setShowTotpForTransfer] = useState(false);
  const [showTotpForAddMoney, setShowTotpForAddMoney] = useState(false);

  // Edit Wallet Number State
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [newWalletNumber, setNewWalletNumber] = useState(profile?.wallet_number || "");

  const queryClient = useQueryClient();

  // Mutation to update wallet number
  const updateWalletMutation = useMutation({
    mutationFn: async (newVal: string) => {
      const { error } = await supabase.from("profiles").update({ wallet_number: newVal }).eq("id", profile?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Wallet number updated successfully");
      setIsEditingWallet(false);
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleUpdateWallet = () => {
    if (!newWalletNumber) return;
    updateWalletMutation.mutate(newWalletNumber);
  };

  // ... (Other mutations: addMoneyMutation, transferMutation remain same as your original)

  // Existing mutations (addMoney, transfer) go here...
  // (Included in full component logic)

  if (!profile)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      {/* Header section remains same */}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <WalletCard
            name={profile.full_name?.join(" ") || "Admin"}
            userCode={profile.user_code?.join(", ") || ""}
            walletNumber={profile.wallet_number}
            profileId={profile.id}
            availableBalance={Number(profile.available_balance) || 0}
            holdBalance={Number(profile.hold_balance) || 0}
          />

          {/* Edit Wallet Number UI */}
          <div className="rounded-3xl border p-4" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center justify-between">
              <Label style={{ color: T.sub }}>Wallet Number</Label>
              {!isEditingWallet ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingWallet(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleUpdateWallet}>
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingWallet(false)}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
            {isEditingWallet ? (
              <Input value={newWalletNumber} onChange={(e) => setNewWalletNumber(e.target.value)} />
            ) : (
              <p className="font-bold text-lg" style={{ color: T.text }}>
                {profile.wallet_number}
              </p>
            )}
          </div>
        </div>

        {/* Add Money and Transfer sections... */}
        {/* (Keep original Add Money and Transfer code here) */}
      </div>

      {/* Footer/History section... */}
    </div>
  );
};

export default AdminWallet;
