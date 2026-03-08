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
import { Loader2, PlusCircle, ArrowUpRight, SendHorizontal, Search, History } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminWallet = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [addAmount, setAddAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; full_name: string[]; user_code: string[]; user_type: string } | null>(null);
  const [transferDescription, setTransferDescription] = useState("");
  const queryClient = useQueryClient();

  const addMoneyMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(addAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("wallet-operations", {
        body: { action: "add_money", amount },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`₹${Number(addAmount).toLocaleString("en-IN")} added to wallet`);
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
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");
      if (!selectedRecipient) throw new Error("Select a recipient");
      if (!profile?.id) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "admin_wallet_transfer",
          target_profile_id: profile.id,
          transfer_to_profile_id: selectedRecipient.id,
          amount: amt,
          description: transferDescription || undefined,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`₹${Number(transferAmount).toLocaleString("en-IN")} transferred to ${selectedRecipient?.full_name?.[0]}`);
      setTransferAmount("");
      setTransferSearch("");
      setSelectedRecipient(null);
      setTransferDescription("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">My Wallet</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <WalletCard
          name={profile.full_name?.join(" ") || "Admin"}
          userCode={profile.user_code?.join(", ") || ""}
          walletNumber={profile.wallet_number}
          availableBalance={Number(profile.available_balance) || 0}
          holdBalance={Number(profile.hold_balance) || 0}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PlusCircle className="h-4 w-4" /> Add Money
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => addMoneyMutation.mutate()}
              disabled={addMoneyMutation.isPending}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {addMoneyMutation.isPending ? "Processing..." : "Add to Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Money */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <SendHorizontal className="h-4 w-4" /> Transfer Money
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Search Recipient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by wallet address..."
                value={transferSearch}
                onChange={(e) => {
                  setTransferSearch(e.target.value);
                  if (selectedRecipient) setSelectedRecipient(null);
                }}
                className="pl-9"
              />
            </div>
            {!selectedRecipient && recipientResults.length > 0 && (
              <div className="rounded-md border bg-popover shadow-md">
                {recipientResults.map((u: any) => (
                  <button
                    key={u.id}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setSelectedRecipient(u);
                      setTransferSearch(u.wallet_number || "");
                    }}
                  >
                    <span className="font-medium">{u.full_name?.[0]}</span>
                    <span className="text-xs text-muted-foreground">
                      {u.wallet_number} · {u.user_type}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedRecipient && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                <span className="font-medium">{selectedRecipient.full_name?.[0]}</span>
                <Badge variant="secondary" className="text-xs">{(selectedRecipient as any).wallet_number}</Badge>
                <button
                  className="ml-auto text-xs text-destructive hover:underline"
                  onClick={() => { setSelectedRecipient(null); setTransferSearch(""); }}
                >
                  Change
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="Reason for transfer"
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => transferMutation.mutate()}
            disabled={transferMutation.isPending || !selectedRecipient}
          >
            <SendHorizontal className="mr-2 h-4 w-4" />
            {transferMutation.isPending ? "Processing..." : "Transfer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/wallet/transactions")}>
            <History className="mr-2 h-4 w-4" />
            View All
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
};

export default AdminWallet;
