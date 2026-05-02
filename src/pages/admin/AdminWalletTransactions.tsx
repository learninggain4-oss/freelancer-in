import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft, Search, History, Filter } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { cn } from "@/lib/utils";
import { safeFmt, safeDist } from "@/lib/admin-date";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const PAGE_SIZE = 15;

const typeBadgeVariant = (type: string) => {
  switch (type) {
    case "credit":
      return "bg-green-500/20 text-green-500 border-green-500/30";
    case "debit":
      return "bg-red-500/20 text-red-500 border-red-500/30";
    case "hold":
      return "bg-amber-500/20 text-amber-500 border-amber-500/30";
    case "release":
      return "bg-indigo-500/20 text-indigo-500 border-indigo-500/30";
    default:
      return "bg-slate-500/20 text-slate-500 border-slate-500/30";
  }
};

const AdminWalletTransactions = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { profile } = useAuth();
  const navigate = useNavigate();
const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["admin-wallet-transactions", profile?.id, page, searchQuery, typeFilter],
    queryFn: async () => {
      if (!profile?.id) return { items: [], total: 0 };
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter as "credit" | "debit" | "hold" | "release");
      }

      if (searchQuery.trim()) {
        query = query.ilike("description", `%${searchQuery.trim()}%`);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;
      return { items: data || [], total: count || 0 };
    },
    enabled: !!profile?.id,
  });

  const queryClient = useQueryClient();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const genTxnId = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(1000000 + Math.random() * 9000000).toString();
    return `TXN${yy}${mm}${dd}${rand}`;
  };

  const retryMutation = useMutation({
    mutationFn: async (tx: any) => {
      if (!profile?.id) throw new Error("Profile not found");
      const amount = Number(tx.amount);
      if (!amount || amount <= 0) throw new Error("Invalid amount");

      const baseDesc = String(tx.description || "")
        .replace(/^Failed:\s*/i, "")
        .replace(/\s*—\s*.*$/, "")
        .trim() || "Retried transaction";

      let action: string;
      const body: Record<string, any> = {
        amount,
        target_profile_id: profile.id,
        description: `Retry: ${baseDesc}`,
      };

      if (tx.type === "credit") {
        action = "admin_wallet_add";
      } else if (tx.type === "debit") {
        action = "admin_wallet_debit";
      } else {
        throw new Error(`Retry not supported for type: ${tx.type}`);
      }

      const res = await supabase.functions.invoke("wallet-operations", { body: { action, ...body } });
      if (res.error || res.data?.error) {
        const failedTxnId = genTxnId();
        await supabase.from("transactions").insert({
          profile_id: profile.id,
          type: tx.type,
          amount,
          transaction_id: failedTxnId,
          status: "failed",
          description: `Retry failed: ${baseDesc} — ${res.error?.message || res.data?.error}`,
        } as any);
        throw new Error(res.error?.message || res.data?.error || "Retry failed");
      }
      return res.data;
    },
    onMutate: (tx: any) => setRetryingId(tx.id),
    onSettled: () => setRetryingId(null),
    onSuccess: (data: any) => {
      const newId = data?.transaction_id ? ` (New TXN: ${data.transaction_id})` : "";
      toast.success(`Retry successful${newId}`);
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
    },
    onError: (e: any) => {
      toast.error(e.message || "Retry failed");
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
    },
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const totalPages = Math.ceil((transactions?.total || 0) / PAGE_SIZE);
  const showFrom = (page - 1) * PAGE_SIZE + 1;
  const showTo = Math.min(page * PAGE_SIZE, transactions?.total || 0);

  return (
    <div className="min-h-screen p-4 pb-20 space-y-6" style={{ background: T.bg }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
              <History className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
            <p className="mt-2 text-indigo-100">Monitor all financial movements within your administrative wallet.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/wallet")}
            className="w-fit rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wallet
          </Button>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="rounded-3xl border p-6 transition-all hover:shadow-xl" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.sub }} />
            <Input
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-11 rounded-xl"
              style={{ background: T.input, borderColor: T.border, color: T.text }}
            />
          </div>
<div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: T.border, background: T.nav }}>
              <Filter className="h-4 w-4" style={{ color: T.sub }} />
              <span className="text-xs font-medium" style={{ color: T.sub }}>Filter:</span>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] h-7 border-0 bg-transparent focus:ring-0 p-0" style={{ color: T.text }}>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(16px)" }}>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                  <SelectItem value="release">Release</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p style={{ color: T.sub }}>Loading transactions...</p>
          </div>
        ) : !transactions?.items.length ? (
          <div className="py-20 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: T.border }}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100/10 mb-4">
              <History className="h-6 w-6" style={{ color: T.sub }} />
            </div>
            <p className="font-medium" style={{ color: T.text }}>No transactions found</p>
            <p className="text-sm" style={{ color: T.sub }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border }}>
            <div className="overflow-x-auto">
              <Table>
<TableHeader>
                  <TableRow style={{ borderColor: T.border, background: theme === "black" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                    <TableHead style={{ color: T.sub }}>Date & Time</TableHead>
                    <TableHead style={{ color: T.sub }}>Transaction ID</TableHead>
                    <TableHead style={{ color: T.sub }}>Type</TableHead>
                    <TableHead style={{ color: T.sub }}>Description</TableHead>
                    <TableHead style={{ color: T.sub }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: T.sub }}>Amount</TableHead>
                  </TableRow>
                </TableHeader>
<TableBody>
                  {transactions.items.map((tx) => (
                    <TableRow key={tx.id} style={{ borderColor: T.border }} className="hover:bg-slate-500/5 transition-colors">
                      <TableCell className="whitespace-nowrap text-xs font-medium" style={{ color: T.sub }}>
                        {safeFmt(tx.created_at, "dd MMM yyyy, hh:mm a")}
                      </TableCell>
                      <TableCell className="font-mono text-xs" style={{ color: T.text }}>
                        {(tx as any).transaction_id || tx.reference_id || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("backdrop-blur-md uppercase text-[10px]", typeBadgeVariant(tx.type))}>
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate text-sm" style={{ color: T.text }}>
                        {tx.description}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = ((tx as any).status as string) || (tx.is_cleared ? "success" : "pending");
                          const cls = status === "failed"
                            ? "bg-red-500/20 text-red-500 border-red-500/30"
                            : status === "success" || status === "cleared"
                              ? "bg-green-500/20 text-green-500 border-green-500/30"
                              : "bg-amber-500/20 text-amber-500 border-amber-500/30";
                          return (
                            <Badge variant="outline" className={cn("backdrop-blur-md uppercase text-[10px]", cls)}>
                              {status}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg" style={{ color: T.text }}>
                        ₹{Number(tx.amount).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t" style={{ borderColor: T.border }}>
                <p className="text-sm font-medium" style={{ color: T.sub }}>
                  Showing <span style={{ color: T.text }}>{showFrom}–{showTo}</span> of <span style={{ color: T.text }}>{transactions.total}</span> records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9"
                    disabled={page <= 1}
                    onClick={() => { setPage((p) => p - 1); window.scrollTo(0, 0); }}
                    style={{ borderColor: T.border, background: T.nav, color: T.text }}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex h-9 items-center justify-center rounded-xl border px-4 text-xs font-bold" style={{ borderColor: T.border, background: T.nav, color: T.text }}>
                    {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9"
                    disabled={page >= totalPages}
                    onClick={() => { setPage((p) => p + 1); window.scrollTo(0, 0); }}
                    style={{ borderColor: T.border, background: T.nav, color: T.text }}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWalletTransactions;
