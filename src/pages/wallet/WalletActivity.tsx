import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
  failed: "destructive",
  cancelled: "destructive",
};

const formatDateTime = (value: string) => {
  const when = new Date(value);
  return {
    date: when.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: when.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
};

function parseJsonLike(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return typeof raw === "object" ? raw : {};
}

function extractWalletNumber(description: string | null | undefined) {
  if (!description) return null;
  const match = String(description).match(/Transfer to wallet\s*([0-9]{10,14})/i);
  return match?.[1] ?? null;
}

const WalletActivity = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFreelancer = profile?.user_type === "Freelancer";

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["all-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: depositRequests = [], isLoading: drLoading } = useQuery({
    queryKey: ["all-deposit-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("deposit_requests")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: withdrawals = [], isLoading: wLoading } = useQuery({
    queryKey: ["all-withdrawals", profile?.id, profile?.user_type],
    queryFn: async () => {
      if (!profile?.id) return [];
      const query = supabase
        .from("withdrawals")
        .select(
          isFreelancer
            ? "id, employee_id, amount, method, status, review_notes, requested_at, order_id"
            : "id, employee_id, amount, method, status, review_notes, requested_at, order_id, freelancer:employee_id(full_name, user_code)"
        )
        .order("requested_at", { ascending: false });

      const { data, error } = isFreelancer
        ? await query.eq("employee_id", profile.id)
        : await query.limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const loading = txLoading || wLoading || drLoading;

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel(`wallet-activity-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `profile_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-transactions", profile.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "deposit_requests", filter: `profile_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-deposit-requests", profile.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-withdrawals", profile.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient]);

  const merged = [] as Array<{
    id: string;
    orderId: string | null;
    depositRequestId?: string;
    amount: number;
    type: string;
    date: string;
    time: string;
    timestamp: string;
    method: string;
    methodDetail: string;
    description: string;
    status: string;
  }>;

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      toast.success("Order ID Successfully Copied");
    }).catch(() => {
      toast.error("Copy failed. Please try manually copying:");
    });
  };

  (depositRequests || []).forEach((dep: any) => {
    const details = parseJsonLike(dep.payment_details);
    const methodContact = details.phone_number || details.upi_id || "-";
    const statusLabel = dep.status || "pending";
    const requestTimestamp = dep.created_at || new Date().toISOString();
    const desc = statusLabel === "approved"
      ? "Deposit Successfully approved"
      : statusLabel === "rejected"
        ? "Deposit Request rejected"
      : statusLabel === "cancelled"
        ? "Deposit Successfully cancelled"
      : statusLabel === "payment_shared"
          ? "Payment details Successfully shared"
          : statusLabel === "utr_submitted"
            ? "Payment proof Successfully submitted"
            : "Deposit request submitted";

    merged.push({
      id: `dep-${dep.id}`,
      orderId: dep.order_id || null,
      depositRequestId: dep.id,
      amount: dep.amount,
      type: "Add",
      date: formatDateTime(requestTimestamp).date,
      time: formatDateTime(requestTimestamp).time,
      timestamp: requestTimestamp,
      method: dep.payment_method || "UPI",
      methodDetail: methodContact,
      description: desc,
      status: statusLabel,
    });
  });

  (transactions || []).forEach((t: any) => {
    const description = t.description || "";
    const isDepositApproval = t.type === "credit" && /wallet top-up approved via/i.test(String(description));
    if (isDepositApproval) return;
    // Skip withdrawal-linked debit; withdrawal row already shown from `withdrawals` table
    const isWithdrawalDebit = t.type === "debit" && /withdrawal/i.test(String(description));
    if (isWithdrawalDebit) return;

    const typeLabel = t.type === "credit" ? "Add" : t.type === "debit" ? "Transfer" : t.type === "hold" ? "On Hold" : "Release";
    const method = t.type === "credit"
      ? "Wallet Credited"
      : t.type === "debit"
        ? "Wallet Debited"
        : "Wallet";

    const methodDetail = t.type === "debit"
      ? extractWalletNumber(description) || profile?.wallet_number || "-"
      : profile?.wallet_number || "-";

    merged.push({
      id: `tx-${t.id}`,
      orderId: t.transaction_id || t.reference_id || null,
      amount: t.amount,
      type: typeLabel,
      date: formatDateTime(t.created_at).date,
      time: formatDateTime(t.created_at).time,
      timestamp: t.created_at,
      method,
      methodDetail,
      description: description || `${typeLabel} transaction`,
      status: t.status || "completed",
    });
  });

  (withdrawals || []).forEach((w: any) => {
    const details = profile?.wallet_number || "-";
    const freelancerName = w.freelancer?.full_name || w.freelancer?.user_code;
    merged.push({
      id: `wd-${w.id}`,
      orderId: w.order_id || null,
      amount: w.amount,
      type: "Withdraw",
      date: formatDateTime(w.requested_at).date,
      time: formatDateTime(w.requested_at).time,
      timestamp: w.requested_at,
      method: w.method || "Withdrawal",
      methodDetail: details,
      description: w.review_notes || (freelancerName ? `Withdrawal request by ${freelancerName}` : "Withdrawal request"),
      status: w.status,
    });
  });

  merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Activity</h1>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse">
                <thead>
                  <tr>
                    {Array.from({ length: 9 }).map((_, index) => (
                      <th key={index} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Skeleton className="h-4 w-full" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border">
                      {Array.from({ length: 9 }).map((__, cellIndex) => (
                        <td key={cellIndex} className="p-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : merged.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-3 py-3">Order ID</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">Phone / Wallet</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {merged.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                      <td className="px-3 py-3 align-top font-mono text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{row.orderId || "-"}</span>
                          {row.orderId && (
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => copyToClipboard(row.orderId!)}
                              title="Copy Order ID"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top font-semibold text-foreground">{fmt(row.amount)}</td>
                      <td className="px-3 py-3 align-top text-sm text-foreground">{row.type}</td>
                      <td className="px-3 py-3 align-top text-sm text-muted-foreground">{row.date}</td>
                      <td className="px-3 py-3 align-top text-sm text-muted-foreground">{row.time}</td>
                      <td className="px-3 py-3 align-top text-sm text-foreground">{row.method}</td>
                      <td className="px-3 py-3 align-top text-sm text-muted-foreground">{row.methodDetail}</td>
                      <td className="px-3 py-3 align-top text-sm text-foreground">
                        <div className="space-y-1">
                          <span>{row.description}</span>
                          {row.type === "Add" && (row.status === "pending" || row.status === "payment_shared" || row.status === "utr_submitted") && row.depositRequestId && (
                            <button
                              type="button"
                              className="text-indigo-500 underline"
                              onClick={() => navigate(`/wallet/deposit/${row.depositRequestId}`)}
                            >
                              Continue payment
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Badge variant={statusVariant[row.status] ?? "secondary"}>{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletActivity;
