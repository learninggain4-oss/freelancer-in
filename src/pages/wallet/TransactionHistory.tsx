import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Hash, Info, Copy, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

type Row = {
  key: string;
  orderId: string;
  amount: number;
  type: "Add" | "Transfer" | "Withdraw" | "Upgrade" | "Other";
  direction: "credit" | "debit";
  description: string;
  status: string;
  timestamp: string;
};

const TransactionHistory = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["all-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: deposits = [], isLoading: depLoading } = useQuery({
    queryKey: ["all-deposit-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("deposit_requests")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: withdrawals = [], isLoading: wLoading } = useQuery({
    queryKey: ["all-withdrawals-history", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, amount, method, status, review_notes, requested_at, order_id")
        .eq("employee_id", profile.id)
        .order("requested_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Realtime: refresh on any change to user's transactions, deposits, withdrawals
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`tx-history:${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `profile_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-transactions", profile.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "deposit_requests", filter: `profile_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-deposit-requests", profile.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals", filter: `employee_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-withdrawals-history", profile.id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  const isLoading = txLoading || depLoading || wLoading;

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];

    (transactions as any[]).forEach((t) => {
      const desc = t.description || "";
      // Skip approved-deposit-credit duplicates (we show the deposit_requests row instead)
      if (t.type === "credit" && /wallet top-up approved/i.test(desc)) return;
      // Skip withdrawal-linked debit (shown via withdrawals row)
      if (t.type === "debit" && /withdrawal requested/i.test(desc)) return;

      let type: Row["type"] = "Other";
      if (/transfer/i.test(desc)) type = "Transfer";
      else if (/wallet upgrade/i.test(desc)) type = "Upgrade";
      else if (t.type === "credit") type = "Add";
      else if (t.type === "debit") type = "Transfer";

      // Extract order id from description if missing
      let orderId = t.order_id || "";
      if (!orderId) {
        const m = desc.match(/(TRF-[^\s)]+|Order ID:\s*([A-Z0-9-]+))/i);
        if (m) orderId = m[2] || m[1];
      }

      out.push({
        key: `tx-${t.id}`,
        orderId: orderId || t.id,
        amount: Number(t.amount),
        type,
        direction: t.type === "credit" ? "credit" : "debit",
        description: desc || `${type} transaction`,
        status: t.status || "success",
        timestamp: t.created_at,
      });
    });

    (deposits as any[]).forEach((d) => {
      const status = d.status || "pending";
      const desc =
        status === "approved" ? "Add Money approved" :
        status === "rejected" ? "Add Money rejected" :
        status === "cancelled" ? "Add Money cancelled" :
        status === "payment_shared" ? "Payment details shared" :
        status === "utr_submitted" ? "Payment proof submitted" :
        "Add Money request submitted";
      out.push({
        key: `dep-${d.id}`,
        orderId: d.order_id || d.id,
        amount: Number(d.amount),
        type: "Add",
        direction: "credit",
        description: `${desc} via ${d.payment_method || "UPI"}`,
        status,
        timestamp: d.created_at || new Date().toISOString(),
      });
    });

    (withdrawals as any[]).forEach((w) => {
      out.push({
        key: `wd-${w.id}`,
        orderId: w.order_id || w.id,
        amount: Number(w.amount),
        type: "Withdraw",
        direction: "debit",
        description: w.review_notes || `Withdrawal via ${w.method || "Bank"}`,
        status: w.status || "pending",
        timestamp: w.requested_at,
      });
    });

    out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return out;
  }, [transactions, deposits, withdrawals]);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast({ description: "Order ID copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (["completed", "success", "approved"].includes(s)) {
      return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Success</Badge>;
    }
    if (["failed", "rejected", "cancelled"].includes(s)) {
      return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">{status}</Badge>;
    }
    return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{status || "Pending"}</Badge>;
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
          ) : rows.length > 0 ? (
            rows.map((row) => {
              const txDate = new Date(row.timestamp);
              const formattedDate = txDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              const formattedTime = txDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
              return (
                <div key={row.key} className="rounded-xl border p-5 shadow-sm bg-card hover:bg-accent/5 transition-colors space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Order ID
                      </span>
                      <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-lg border max-w-fit">
                        <span className="font-mono text-xs text-foreground truncate max-w-[140px]">{row.orderId}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(row.orderId)}>
                          {copiedId === row.orderId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date
                      </span>
                      <p className="font-medium text-foreground p-1">{formattedDate}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Time
                      </span>
                      <p className="font-medium text-foreground p-1">{formattedTime}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">Amount ({row.type})</span>
                      <div className="flex items-center gap-2 p-1">
                        <span className={`text-base font-bold ${row.direction === "credit" ? "text-emerald-500" : "text-destructive"}`}>
                          {row.direction === "credit" ? "+" : "-"} ₹{row.amount.toLocaleString("en-IN")}
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
                      <p className="text-sm font-medium text-foreground truncate p-0.5">{row.description}</p>
                    </div>
                    <div className="space-y-1 shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground block sm:text-right">Status</span>
                      <div className="pt-0.5">{getStatusBadge(row.status)}</div>
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
