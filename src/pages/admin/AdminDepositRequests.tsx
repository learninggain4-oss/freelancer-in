import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  PlusCircle, CheckCircle2, XCircle, Clock, Search, RefreshCw,
  IndianRupee, CreditCard, User, Calendar, Loader2, ChevronDown, AlertCircle,
} from "lucide-react";

const T = {
  bg: "#f5f7ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#0f172a",
  sub: "#64748b", muted: "#f1f5f9", accent: "#4f46e5",
  green: "#16a34a", red: "#dc2626", amber: "#d97706",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  pending:  { bg: "rgba(217,119,6,.1)",  fg: "#d97706", label: "Pending" },
  approved: { bg: "rgba(22,163,74,.1)",  fg: "#16a34a", label: "Approved" },
  rejected: { bg: "rgba(220,38,38,.1)",  fg: "#dc2626", label: "Rejected" },
};

const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

interface DepositRequest {
  id: string;
  profile_id: string;
  amount: number;
  payment_method: string;
  payment_details: Record<string, string>;
  status: string;
  order_id: string;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  profiles: { full_name: string[] | string; email: string; user_type: string; wallet_number: string } | null;
}

export default function AdminDepositRequests() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [dbSetupNeeded, setDbSetupNeeded] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["deposit-requests", statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("wallet-operations", {
        body: { action: "admin_get_deposit_requests", status_filter: statusFilter },
      });
      if (error || data?.error) {
        const msg = data?.error || error?.message || "";
        if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("42P01")) {
          setDbSetupNeeded(true);
          return [] as DepositRequest[];
        }
        throw new Error(msg);
      }
      setDbSetupNeeded(false);
      return (data?.requests || []) as DepositRequest[];
    },
    refetchInterval: 30000,
  });

  const processDepositMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: "approve" | "reject"; notes?: string }) => {
      const { data, error } = await supabase.functions.invoke("wallet-operations", {
        body: { action: "admin_process_deposit", deposit_request_id: id, deposit_action: action, review_notes: notes || null },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      return data;
    },
    onSuccess: (_, { action }) => {
      toast.success(action === "approve" ? "Deposit approved & wallet credited!" : "Deposit request rejected");
      qc.invalidateQueries({ queryKey: ["deposit-requests"] });
      setProcessingId(null);
      setRejectTarget(null);
      setRejectNotes("");
    },
    onError: (e: any) => { toast.error(e.message); setProcessingId(null); },
  });

  const handleApprove = (id: string) => {
    setProcessingId(id);
    processDepositMutation.mutate({ id, action: "approve" });
  };

  const handleReject = (id: string) => {
    setProcessingId(id);
    processDepositMutation.mutate({ id, action: "reject", notes: rejectNotes });
  };

  const filtered = (data || []).filter(r => {
    if (!search) return true;
    const name = Array.isArray(r.profiles?.full_name) ? r.profiles.full_name[0] : r.profiles?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase())
      || r.profiles?.email?.toLowerCase().includes(search.toLowerCase())
      || r.order_id?.toLowerCase().includes(search.toLowerCase());
  });

  const pendingCount = (data || []).filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6 p-4 pb-24 min-h-screen" style={{ background: T.bg, color: T.text }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,.1)" }}>
            <IndianRupee className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Deposit Requests</h1>
            <p className="text-xs font-medium" style={{ color: T.sub }}>Review & approve user wallet top-up requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="h-7 min-w-7 px-2 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: T.red }}>
              {pendingCount}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => refetch()} className="rounded-xl gap-1.5" style={{ borderColor: T.border }}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: T.border }}>
          {["pending","approved","rejected","all"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors capitalize"
              style={{ background: statusFilter === s ? T.accent : T.card, color: statusFilter === s ? "#fff" : T.sub }}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.sub }} />
          <Input placeholder="Search by name, email or order ID…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-2xl border-0 text-sm" style={{ background: T.muted, color: T.text }} />
        </div>
      </div>

      {dbSetupNeeded && (
        <div className="rounded-3xl p-6 space-y-4 border-2 border-dashed" style={{ borderColor: "rgba(217,119,6,.4)", background: "rgba(217,119,6,.05)" }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
            <div>
              <p className="font-black text-amber-600">Database Setup Required</p>
              <p className="text-xs text-amber-500/80">The deposit_requests table hasn't been created yet. Run the following SQL in your Supabase Dashboard → SQL Editor:</p>
            </div>
          </div>
          <div className="rounded-xl p-3 text-xs font-mono overflow-auto" style={{ background: "rgba(0,0,0,.06)", color: "#374151" }}>
            {`CREATE TABLE IF NOT EXISTS deposit_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'UPI',
  payment_details jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  order_id text UNIQUE DEFAULT ('DEP-' || upper(substring(gen_random_uuid()::text,1,8))),
  review_notes text, reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS add_money_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active'
);`}
          </div>
          <p className="text-xs text-amber-500/70">After running the SQL, click Refresh above.</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : !dbSetupNeeded && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: T.sub }}>
          <PlusCircle className="h-12 w-12 opacity-20" />
          <p className="font-bold">No {statusFilter === "all" ? "" : statusFilter} deposit requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const st = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
            const name = Array.isArray(req.profiles?.full_name) ? req.profiles.full_name[0] : req.profiles?.full_name || "Unknown";
            const isExpanded = expandedId === req.id;
            const isProcessing = processingId === req.id && processDepositMutation.isPending;

            return (
              <div key={req.id} className="rounded-3xl overflow-hidden shadow-sm" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-sm" style={{ color: T.text }}>{name}</p>
                        <p className="text-[10px] font-medium" style={{ color: T.sub }}>
                          {req.profiles?.email} · {req.profiles?.user_type === "employee" ? "Freelancer" : "Employer"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black" style={{ color: T.accent }}>{fmt(req.amount)}</span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: st.bg, color: st.fg }}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5" style={{ color: T.sub }}>
                      <CreditCard className="h-3.5 w-3.5" />
                      <span className="font-medium">{req.payment_method}</span>
                      {req.payment_details?.upi_id && <span className="text-indigo-500 font-bold">· {req.payment_details.upi_id}</span>}
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: T.sub }}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{fmtDate(req.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: T.sub }}>
                      <User className="h-3.5 w-3.5" />
                      <span>Wallet: {req.profiles?.wallet_number || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: T.sub }}>
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span className="font-bold text-indigo-400">{req.order_id}</span>
                    </div>
                  </div>

                  {req.status === "pending" && (
                    <div className="space-y-2">
                      {rejectTarget === req.id ? (
                        <div className="space-y-2">
                          <Input placeholder="Rejection reason (optional)…" value={rejectNotes}
                            onChange={e => setRejectNotes(e.target.value)}
                            className="rounded-xl border text-sm" style={{ borderColor: T.border, background: T.muted }} />
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black"
                              onClick={() => handleReject(req.id)} disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" />Confirm Reject</>}
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl font-black"
                              style={{ borderColor: T.border }} onClick={() => { setRejectTarget(null); setRejectNotes(""); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 rounded-xl font-black text-white shadow-lg"
                            style={{ background: T.green }} onClick={() => handleApprove(req.id)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1.5" />Approve & Credit</>}
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl font-black"
                            style={{ borderColor: "rgba(220,38,38,.3)", color: T.red }}
                            onClick={() => setRejectTarget(req.id)} disabled={isProcessing}>
                            <XCircle className="h-4 w-4 mr-1.5" />Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {req.status !== "pending" && req.review_notes && (
                    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: T.muted, color: T.sub }}>
                      <span className="font-black uppercase tracking-widest">Note: </span>{req.review_notes}
                    </div>
                  )}

                  {req.reviewed_at && (
                    <p className="text-[10px]" style={{ color: T.sub }}>
                      Reviewed: {fmtDate(req.reviewed_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
