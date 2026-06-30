import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  PlusCircle, CheckCircle2, XCircle, Clock, Search, RefreshCw,
  IndianRupee, CreditCard, User, Calendar, Loader2, ChevronDown, AlertCircle, Timer, Edit3, Copy, Check, ImageIcon,
} from "lucide-react";


const T = {
  bg: "#f5f7ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#0f172a",
  sub: "#64748b", muted: "#f1f5f9", accent: "#4f46e5",
  green: "#16a34a", red: "#dc2626", amber: "#d97706",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  pending:        { bg: "rgba(217,119,6,.1)",  fg: "#d97706", label: "Pending" },
  payment_shared: { bg: "rgba(37,99,235,.1)",  fg: "#2563eb", label: "Details Shared" },
  utr_submitted:  { bg: "rgba(124,58,237,.1)",  fg: "#7c3aed", label: "Proof Received" },
  approved:       { bg: "rgba(22,163,74,.1)",  fg: "#16a34a", label: "Approved" },
  rejected:       { bg: "rgba(220,38,38,.1)",  fg: "#dc2626", label: "Rejected" },
  cancelled:      { bg: "rgba(107,114,128,.1)", fg: "#6b7280", label: "Cancelled" },
};


const parsePaymentDetails = (raw: unknown): Record<string, string> => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; }
  }
  return typeof raw === "object" ? (raw as Record<string, string>) : {};
};

const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

const calculateBonusAmount = (request: DepositRequest, allRequests: DepositRequest[], cashbackPercent: number) => {
  if (!cashbackPercent || cashbackPercent <= 0) return 0;

  const hasEarlierApproved = allRequests.some((item) =>
    item.profile_id === request.profile_id &&
    item.id !== request.id &&
    item.status === "approved" &&
    new Date(item.created_at) < new Date(request.created_at)
  );

  if (hasEarlierApproved) return 0;

  return Math.round((Number(request.amount) || 0) * (cashbackPercent / 100) * 100) / 100;
};

const calculateCountdown = (createdAt: string): string => {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const expiresAt = created + (24 * 60 * 60 * 1000); // 24 hours from creation
  const remaining = expiresAt - now;

  if (remaining <= 0) return "Expired";
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}m`;
};

interface DepositRequest {
  id: string;
  profile_id: string;
  amount: number;
  payment_method: string;
  payment_details: Record<string, string>;
  status: string;
  order_id: string;
  utr_number: string | null;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
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
  const [cashbackPercent, setCashbackPercent] = useState(0);
  const [, setCountdownTrigger] = useState(0);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const [dbSetupNeeded, setDbSetupNeeded] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTrigger(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCashback = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "first_time_deposit_cashback_percentage")
        .maybeSingle();
      setCashbackPercent(Number(data?.value || 0));
    };

    fetchCashback();
  }, []);

  // Real-time subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel("deposit-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposit_requests" },
        () => {
          // Refetch data when any change is detected
          qc.invalidateQueries({ queryKey: ["deposit-requests", statusFilter] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, qc]);

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
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
  });

  const processDepositMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: "approve" | "reject"; notes?: string }) => {
      const { data, error } = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "admin_process_deposit",
          deposit_request_id: id,
          deposit_action: action,
          review_notes: notes || null,
        },
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
    onError: (e: any) => {
      toast.error(e.message);
      setProcessingId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => {
      const { data, error } = await supabase.functions.invoke("wallet-operations", {
        body: {
          action: "admin_update_deposit_request_status",
          deposit_request_id: id,
          deposit_status: nextStatus,
          review_notes: null,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deposit-requests"] });
      toast.success("Status updated");
      setProcessingId(null);
      setRejectTarget(null);
      setRejectNotes("");
    },
    onError: (e: any) => {
      toast.error(e.message);
      setProcessingId(null);
    },
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
    // Apply status filter
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    
    if (!search) return true;
    const name = Array.isArray(r.profiles?.full_name) ? r.profiles.full_name[0] : r.profiles?.full_name || "";
    const details = parsePaymentDetails(r.payment_details as unknown);
    return name.toLowerCase().includes(search.toLowerCase())
      || r.profiles?.email?.toLowerCase().includes(search.toLowerCase())
      || r.order_id?.toLowerCase().includes(search.toLowerCase())
      || (details.phone_number || details.phone || "").toLowerCase().includes(search.toLowerCase());
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
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: T.border }}>
          {[
            { key: "pending", label: "Pending" },
            { key: "utr_submitted", label: "Proof Received" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
            { key: "all", label: "All" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors"
              style={{ background: statusFilter === key ? T.accent : T.card, color: statusFilter === key ? "#fff" : T.sub }}>
              {label}
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
            const details = parsePaymentDetails(req.payment_details as unknown);
            const bonusAmount = calculateBonusAmount(req, (data || []) as DepositRequest[], cashbackPercent);
            const isExpanded = expandedId === req.id;
            const isProcessing = processingId === req.id && processDepositMutation.isPending;

            return (
              <div key={req.id} className="rounded-3xl overflow-hidden shadow-sm" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header Row: Reference ID and Name */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-sm" style={{ color: T.text }}>{name}</p>
                            <p className="text-[10px] font-bold" style={{ color: T.accent }}>
                              Reference ID: {req.order_id}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: st.bg, color: st.fg }}>
                          {st.label}
                        </span>

                        {/* Admin can edit deposit status */}
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-3.5 w-3.5" style={{ color: T.sub }} />
                          <select
                            value={req.status}
                            onChange={(e) => updateStatusMutation.mutate({ id: req.id, nextStatus: e.target.value })}
                            disabled={isProcessing}
                            className="text-[11px] font-black rounded-xl px-2 py-1 border-0"
                            style={{ background: T.muted, color: T.text }}
                          >
                            {Object.entries(STATUS_COLORS).map(([key, v]) => (
                              <option key={key} value={key}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>

                      {/* Information Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* Row 1 */}
                        <div className="space-y-1">
                          <p style={{ color: T.sub }} className="font-bold uppercase tracking-widest text-[10px]">User Type</p>
                          <p className="font-semibold" style={{ color: T.text }}>
                            {req.profiles?.user_type === "employee" ? "Freelancer" : "Employer"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p style={{ color: T.sub }} className="font-bold uppercase tracking-widest text-[10px]">Amount</p>
                          <p className="font-black text-sm" style={{ color: T.accent }}>{fmt(req.amount)}</p>
                        </div>
                        <div className="space-y-1">
                          <p style={{ color: T.sub }} className="font-bold uppercase tracking-widest text-[10px]">Bonus Amount</p>
                          <p className="font-black text-sm" style={{ color: bonusAmount > 0 ? "#10b981" : T.sub }}>
                            {bonusAmount > 0 ? fmt(bonusAmount) : "—"}
                          </p>
                        </div>

                        {/* Row 2 */}
                        <div className="space-y-1">
                          <p style={{ color: T.sub }} className="font-bold uppercase tracking-widest text-[10px]">Date & Time</p>
                          <p className="font-medium" style={{ color: T.text }}>{fmtDate(req.created_at)}</p>
                        </div>
                        <div className="space-y-1">
                          <p style={{ color: T.sub }} className="font-bold uppercase tracking-widest text-[10px]">Payment Method</p>
                          <p className="font-semibold" style={{ color: T.text }}>{req.payment_method}</p>
                        </div>

                        {/* Row 3 */}
                        <div className="space-y-1">
                          <p style={{ color: T.sub }} className="font-bold uppercase tracking-widest text-[10px]">Phone Number</p>
                          <p className="font-semibold" style={{ color: T.text }}>
                            {details.phone_number || details.phone || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p style={{ color: T.sub }} className="font-bold uppercase tracking-widest text-[10px]">Countdown</p>
                          <div className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5" style={{ color: T.accent }} />
                            <p className="font-black" style={{ color: req.status === "pending" ? T.amber : T.sub }}>
                              {req.status === "pending" ? calculateCountdown(req.created_at) : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── UTR + Proof (shown once user submits proof) ── */}
                  {(req.utr_number || details.user_payment_screenshot_url) && (
                    <div className="rounded-2xl p-4 space-y-3 mt-3" style={{ background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.18)" }}>
                      {req.utr_number && (
                        <div>
                          <p className="font-black text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "#7c3aed" }}>UTR Number Received</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm tracking-widest" style={{ fontFamily: "monospace", color: T.text }}>
                              {req.utr_number}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(req.utr_number!);
                                setCopiedUtr(req.id);
                                toast.success("UTR copied!");
                                setTimeout(() => setCopiedUtr(null), 2000);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black transition-colors"
                              style={{ background: copiedUtr === req.id ? "rgba(22,163,74,.12)" : "rgba(99,102,241,.12)", color: copiedUtr === req.id ? "#16a34a" : "#4f46e5" }}>
                              {copiedUtr === req.id ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                            </button>
                          </div>
                        </div>
                      )}
                      {details.user_payment_screenshot_url && (
                        <div>
                          <p className="font-black text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "#7c3aed" }}>Payment Screenshot</p>
                          <a href={details.user_payment_screenshot_url} target="_blank" rel="noopener noreferrer"
                            className="block rounded-xl overflow-hidden" style={{ border: "1px solid rgba(99,102,241,.25)", maxWidth: 260 }}>
                            <img loading="lazy" decoding="async" src={details.user_payment_screenshot_url} alt="Payment proof"
                              style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover" }} />
                            <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold" style={{ color: "#4f46e5", background: "rgba(99,102,241,.06)" }}>
                              <ImageIcon className="h-3.5 w-3.5" /> View full screenshot
                            </div>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {/* Status change controls */}
                    {req.status === "pending" ? (
                      <>
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
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {/* quick view of non-pending states; admin can still change to approved/rejected via same handlers */}
                        {req.status !== "approved" && (
                          <Button size="sm" className="rounded-xl font-black text-white shadow-lg"
                            style={{ background: T.green }}
                            onClick={() => handleApprove(req.id)}
                            disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1.5" />Approve</>}
                          </Button>
                        )}
                        {req.status !== "rejected" && (
                          <Button size="sm" variant="outline" className="rounded-xl font-black"
                            style={{ borderColor: "rgba(220,38,38,.3)", color: T.red }}
                            onClick={() => setRejectTarget(req.id)} disabled={isProcessing}>
                            <XCircle className="h-4 w-4 mr-1.5" />Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </div>


                  {req.status !== "pending" && req.admin_notes && (
                    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: T.muted, color: T.sub }}>
                      <span className="font-black uppercase tracking-widest">Note: </span>{req.admin_notes}
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
