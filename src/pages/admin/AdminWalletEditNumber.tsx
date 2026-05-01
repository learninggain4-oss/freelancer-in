import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};

const AdminWalletEditNumber = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [walletNumber, setWalletNumber] = useState("");

  useEffect(() => {
    setWalletNumber(profile?.wallet_number || "");
  }, [profile?.wallet_number]);

  const updateWalletNumberMutation = useMutation({
    mutationFn: async () => {
      const normalized = walletNumber.trim();
      if (!normalized) throw new Error("Wallet number is required");
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ wallet_number: normalized })
        .eq("id", profile.id);

      if (error) throw new Error(error.message);
      return normalized;
    },
    onSuccess: (updatedWalletNumber) => {
      toast.success(`Wallet number updated to ${updatedWalletNumber}`);
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-transfer-search"] });
      navigate("/admin/wallet");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/wallet")}
          style={{ borderColor: T.border, color: T.text, background: "transparent" }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Wallet
        </Button>
      </div>

      <div className="rounded-3xl border p-6 transition-all" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Wallet className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold" style={{ color: T.text }}>Edit Wallet Number</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end max-w-2xl">
          <div className="space-y-2">
            <Label style={{ color: T.sub }}>Wallet Number</Label>
            <Input
              placeholder="Enter wallet number"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              className="h-11"
              style={{ background: T.input, borderColor: T.border, color: T.text }}
            />
          </div>
          <Button
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
            onClick={() => updateWalletNumberMutation.mutate()}
            disabled={updateWalletNumberMutation.isPending || walletNumber.trim() === (profile.wallet_number || "")}
          >
            {updateWalletNumberMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {updateWalletNumberMutation.isPending ? "Saving..." : "Update Wallet Number"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminWalletEditNumber;
