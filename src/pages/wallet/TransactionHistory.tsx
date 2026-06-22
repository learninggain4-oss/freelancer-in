import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Calendar, Clock, Hash, Info, Copy, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const TransactionHistory = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["all-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Realtime: refresh on any change to this user's transactions
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`tx-history:${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `profile_id=eq.${profile.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-transactions", profile.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast({
      description: "Order ID copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
            Success
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : transactions.length > 0 ? (
            transactions.map((tx: any) => {
              const txDate = new Date(tx.created_at);
              const formattedDate = txDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const formattedTime = txDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              // Order ID Extracting Logic
              let displayOrderId = tx.order_id || tx.id || "N/A";
              const desc = tx.description || "";

              // Description-ൽ നിന്ന് Order ID ഉണ്ടെങ്കിൽ അത് എടുക്കുന്നു
              if (!tx.order_id && desc.includes("TRF-")) {
                const match = desc.match(/(TRF-[^\s]+)/i);
                if (match) displayOrderId = match[1];
              }

              return (
                <div
                  key={tx.id}
                  className="rounded-xl border p-5 shadow-sm bg-card hover:bg-accent/5 transition-colors space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {/* Order ID */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Order ID
                      </span>
                      <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-lg border max-w-fit">
                        <span className="font-mono text-xs text-foreground truncate max-w-[140px]">
                          {displayOrderId}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopy(displayOrderId)}
                        >
                          {copiedId === displayOrderId ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date
                      </span>
                      <p className="font-medium text-foreground p-1">{formattedDate}</p>
                    </div>

                    {/* Time */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Time
                      </span>
                      <p className="font-medium text-foreground p-1">{formattedTime}</p>
                    </div>

                    {/* Amount & Type */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        Amount
                      </span>
                      <div className="flex items-center gap-2 p-1">
                        <span
                          className={`text-base font-bold ${tx.type === "credit" ? "text-emerald-500" : "text-destructive"}`}
                        >
                          {tx.type === "credit" ? "+" : "-"} ₹{Number(tx.amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-muted/60" />

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" /> Description
                      </span>
                      <p className="text-sm font-medium text-foreground truncate p-0.5">{desc || "No description"}</p>
                    </div>
                    <div className="space-y-1 shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground block sm:text-right">Status</span>
                      <div className="pt-0.5">{getStatusBadge(tx.status)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No transactions found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
