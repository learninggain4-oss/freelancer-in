import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, RefreshCw, CheckCircle2, XCircle, Clock, IndianRupee,
  Eye, Share2, ChevronDown, Smartphone, Building2, X, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const T = {
  bg: "#f5f7ff", card: "#ffffff", bdr: "rgba(0,0,0,.08)",
  text: "#0f172a", sub: "#64748b", muted: "#f1f5f9",
  accent: "#4f46e5", green: "#16a34a", red: "#dc2626", orange: "#d97706",
};
const A1 = "#6366f1";

const PAYMENT_MIN = 8;
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:        { label: "Pending",         color: "#d97706", bg: "#fef3c7" },
  payment_shared: { label: "Details Shared",  color: "#2563eb", bg: "#dbeafe" },
  utr_submitted:  { label: "Proof Received",  color: "#7c3aed", bg: "#ede9fe" },
  approved:       { label: "Approved",        color: "#16a34a", bg: "#dcfce7" },
  rejected:       { label: "Rejected",        color: "#dc2626", bg: "#fee2e2" },
  expired:        { label: "Expired",         color: "#64748b", bg: "#f1f5f9" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: T.sub, bg: T.muted };
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99,
      color: s.color, background: s.bg, letterSpacing: ".06em", textTransform: "uppercase" }}>
      {s.label}
    </span>
  );
}

function useCountdown(deadline: string | null | undefined) {
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) { setSecs(null); return; }
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
      setSecs(diff);
      return diff;
    };
    calc();
    const id = setInterval(() => { if (calc() <= 0) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return secs;
}

function CountdownCell({ deadline }: { deadline: string | null | undefined }) {
  const secs = useCountdown(deadline);
  if (!deadline || secs === null) return <span style={{ color: T.sub, fontSize: 12 }}>—</span>;
  const m = Math.floor(secs / 60), s = secs % 60;
  const urgent = secs < 120;
  return (
    <span style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums",
      color: secs === 0 ? T.red : urgent ? T.orange : T.green }}>
      {secs === 0 ? "Expired" : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
    </span>
  );
}

interface ShareModalProps {
  req: any;
  onClose: () => void;
  onShared: () => void;
}
function ShareModal({ req, onClose, onShared }: ShareModalProps) {
  const [method, setMethod] = useState<"UPI"|"Bank">("UPI");
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [note, setNote] = useState("");
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    if (method === "UPI" && !upiId.trim()) { toast.error("Enter UPI ID"); return; }
    if (method === "Bank" && (!accountNo.trim() || !ifsc.trim())) { toast.error("Enter Account No and IFSC"); return; }
    setSharing(true);
    const details: any = { method };
    if (method === "UPI") { details.upi_id = upiId.trim(); details.upi_name = upiName.trim(); }
    else { details.bank_name = bankName.trim(); details.account_no = accountNo.trim(); details.ifsc = ifsc.trim(); details.holder_name = holderName.trim(); }
    if (note.trim()) details.note = note.trim();

    const deadline = new Date(Date.now() + PAYMENT_MIN * 60 * 1000).toISOString();
    const { error } = await supabase.from("deposit_requests").update({
      admin_payment_details: details,
      payment_deadline: deadline,
      status: "payment_shared",
      updated_at: new Date().toISOString(),
    }).eq("id", req.id);
    if (error) { toast.error("Failed to share details"); setSharing(false); return; }
    toast.success("Payment details shared — user has 8 minutes to pay");
    setSharing(false);
    onShared();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.card, borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: 0 }}>Share Payment Details</h2>
            <p style={{ fontSize: 12, color: T.sub, margin: "3px 0 0" }}>Order {req.order_id} · ₹{Number(req.amount).toLocaleString("en-IN")}</p>
          </div>
          <button onClick={onClose} style={{ background: T.muted, border: "none", borderRadius: 8, padding: 8, cursor: "pointer" }}>
            <X size={16} color={T.sub} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Method tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["UPI","Bank"] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${method === m ? A1 : T.bdr}`,
                  background: method === m ? "rgba(99,102,241,.08)" : T.muted,
                  color: method === m ? A1 : T.sub, fontWeight: 700, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {m === "UPI" ? <Smartphone size={15} /> : <Building2 size={15} />} {m}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {method === "UPI" ? (
              <>
                <Field label="UPI ID *" value={upiId} onChange={setUpiId} placeholder="username@upi" mono />
                <Field label="Account Name" value={upiName} onChange={setUpiName} placeholder="Account holder name" />
              </>
            ) : (
              <>
                <Field label="Bank Name" value={bankName} onChange={setBankName} placeholder="e.g. State Bank of India" />
                <Field label="Account Number *" value={accountNo} onChange={setAccountNo} placeholder="Account number" mono />
                <Field label="IFSC Code *" value={ifsc} onChange={v => setIfsc(v.toUpperCase())} placeholder="e.g. SBIN0001234" mono />
                <Field label="Account Holder Name" value={holderName} onChange={setHolderName} placeholder="Name on account" />
              </>
            )}
            <Field label="Note (optional)" value={note} onChange={setNote} placeholder="Any instruction for the user…" multiline />
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "#fef3c7", border: "1px solid #fde68a", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              Once shared, the user will have <strong>{PAYMENT_MIN} minutes</strong> to complete payment and submit their UTR number.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 11, background: T.muted,
              border: `1px solid ${T.bdr}`, color: T.sub, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              Cancel
            </button>
            <button onClick={share} disabled={sharing} style={{ flex: 2, padding: "12px", borderRadius: 11, border: "none",
              background: `linear-gradient(135deg,${A1},#8b5cf6)`, color: "white",
              fontWeight: 700, fontSize: 13, cursor: sharing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: "0 6px 20px rgba(99,102,241,.3)" }}>
              {sharing ? "Sharing…" : <><Share2 size={15} /> Share Details</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, multiline }: any) {
  const style: any = {
    width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
    border: `1px solid ${T.bdr}`, background: "#f8fafc", color: T.text, outline: "none",
    fontFamily: mono ? "monospace" : "inherit", boxSizing: "border-box",
  };
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</label>
      {multiline
        ? <textarea rows={3} style={{ ...style, resize: "vertical" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input style={style} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  );
}

interface ReviewModalProps { req: any; onClose: () => void; onDone: () => void; }
function ReviewModal({ req, onClose, onDone }: ReviewModalProps) {
  const { profile } = useAuth();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const action = async (approve: boolean) => {
    setLoading(true);
    try {
      const status = approve ? "approved" : "rejected";
      const { error: upErr } = await supabase.from("deposit_requests").update({
        status, review_note: note.trim() || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id ?? null,
        updated_at: new Date().toISOString(),
      }).eq("id", req.id);
      if (upErr) throw upErr;

      if (approve) {
        const { error: balErr } = await supabase.rpc("increment_balance", {
          p_profile_id: req.profile_id,
          p_amount: req.amount,
        });
        if (balErr) {
          const { error: manualErr } = await supabase.from("profiles").update({
            available_balance: supabase.rpc("increment_balance" as any),
          });
          if (!manualErr) {
            await supabase.from("profiles")
              .update({ available_balance: (req.profile?.available_balance ?? 0) + Number(req.amount) })
              .eq("id", req.profile_id);
          }
        }
        await supabase.from("transactions").insert({
          profile_id: req.profile_id,
          type: "credit",
          amount: req.amount,
          description: `Deposit approved — Order ${req.order_id}`,
          reference_id: req.id,
        });
      }
      toast.success(approve ? "Deposit approved and wallet credited!" : "Deposit rejected.");
      onDone(); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const pd = req.admin_payment_details;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.card, borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: 0 }}>Review Deposit</h2>
            <p style={{ fontSize: 12, color: T.sub, margin: "3px 0 0" }}>Order {req.order_id} · ₹{Number(req.amount).toLocaleString("en-IN")}</p>
          </div>
          <button onClick={onClose} style={{ background: T.muted, border: "none", borderRadius: 8, padding: 8, cursor: "pointer" }}>
            <X size={16} color={T.sub} />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {/* UTR proof */}
          {req.utr_number && (
            <div style={{ background: "#ede9fe", borderRadius: 12, padding: "14px 16px", marginBottom: 16, border: "1px solid #ddd6fe" }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", marginBottom: 4, textTransform: "uppercase" }}>UTR / Transaction ID</p>
              <p style={{ fontSize: 18, fontWeight: 900, fontFamily: "monospace", color: "#4c1d95", margin: 0 }}>{req.utr_number}</p>
              {req.utr_submitted_at && (
                <p style={{ fontSize: 11, color: "#6d28d9", margin: "4px 0 0" }}>Submitted: {new Date(req.utr_submitted_at).toLocaleString("en-IN")}</p>
              )}
            </div>
          )}

          {/* Payment details shared */}
          {pd && (
            <div style={{ background: T.muted, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: T.sub, marginBottom: 8, textTransform: "uppercase" }}>Payment Details Shared</p>
              {pd.upi_id && <p style={{ fontSize: 13, color: T.text, margin: "2px 0" }}><strong>UPI:</strong> {pd.upi_id}</p>}
              {pd.account_no && <p style={{ fontSize: 13, color: T.text, margin: "2px 0" }}><strong>Account:</strong> {pd.account_no}</p>}
              {pd.ifsc && <p style={{ fontSize: 13, color: T.text, margin: "2px 0" }}><strong>IFSC:</strong> {pd.ifsc}</p>}
              {pd.bank_name && <p style={{ fontSize: 13, color: T.text, margin: "2px 0" }}><strong>Bank:</strong> {pd.bank_name}</p>}
            </div>
          )}

          <Field label="Review Note (optional)" value={note} onChange={setNote} placeholder="Add a note for the user…" multiline />

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => action(false)} disabled={loading} style={{ flex: 1, padding: "12px", borderRadius: 11,
              background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626",
              fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <XCircle size={15} /> Reject
            </button>
            <button onClick={() => action(true)} disabled={loading} style={{ flex: 2, padding: "12px", borderRadius: 11, border: "none",
              background: "#16a34a", color: "white", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: "0 6px 20px rgba(22,163,74,.25)" }}>
              <CheckCircle2 size={15} /> {loading ? "Processing…" : "Approve & Credit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "pending",        label: "Pending" },
  { key: "payment_shared", label: "Details Shared" },
  { key: "utr_submitted",  label: "Proof Received" },
  { key: "all",            label: "All" },
];

export default function AdminDeposits() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [shareModal, setShareModal] = useState<any>(null);
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const q = supabase
      .from("deposit_requests")
      .select(`*, profiles:profile_id (full_name, user_code, user_type)`)
      .order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) { toast.error("Failed to load deposit requests"); setLoading(false); return; }
    setRequests(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const ch = supabase.channel("admin-deposits-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposit_requests" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const filtered = requests.filter(r => {
    if (tab !== "all" && r.status !== tab) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    const name = Array.isArray(r.profiles?.full_name) ? r.profiles.full_name.join(" ") : (r.profiles?.full_name ?? "");
    return name.toLowerCase().includes(s) || r.order_id?.toLowerCase().includes(s) || r.utr_number?.toLowerCase().includes(s);
  });

  const tabCount = (key: string) => key === "all" ? requests.length : requests.filter(r => r.status === key).length;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "Inter,system-ui,sans-serif" }}>
      {shareModal && <ShareModal req={shareModal} onClose={() => setShareModal(null)} onShared={fetch} />}
      {reviewModal && <ReviewModal req={reviewModal} onClose={() => setReviewModal(null)} onDone={fetch} />}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Deposit Requests</h1>
            <p style={{ fontSize: 13, color: T.sub, margin: "4px 0 0" }}>Manage user deposit requests and share payment details</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.sub }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order, name, UTR…"
                style={{ paddingLeft: 34, paddingRight: 14, height: 38, borderRadius: 10, border: `1px solid ${T.bdr}`,
                  background: T.card, color: T.text, fontSize: 13, outline: "none", width: 220 }} />
            </div>
            <button onClick={fetch} style={{ padding: "0 14px", height: 38, borderRadius: 10, border: `1px solid ${T.bdr}`,
              background: T.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: T.sub, fontSize: 13 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.bdr}`, paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: "10px 16px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                color: tab === t.key ? A1 : T.sub,
                background: "transparent",
                borderBottom: `2px solid ${tab === t.key ? A1 : "transparent"}`,
                display: "flex", alignItems: "center", gap: 6,
              }}>
              {t.label}
              <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 99,
                background: tab === t.key ? "rgba(99,102,241,.12)" : T.muted,
                color: tab === t.key ? A1 : T.sub }}>
                {tabCount(t.key)}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.bdr}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.04)" }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: T.sub }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${A1}`, borderTopColor: "transparent",
                animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Clock size={36} color={T.sub} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>No deposit requests</p>
              <p style={{ fontSize: 13, color: T.sub }}>New requests will appear here in real-time</p>
            </div>
          ) : (
            <div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 100px 100px 140px 120px 160px",
                padding: "12px 20px", background: T.muted, borderBottom: `1px solid ${T.bdr}`,
                fontSize: 10, fontWeight: 800, color: T.sub, textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span>Order / User</span>
                <span>Details</span>
                <span>Amount</span>
                <span>Method</span>
                <span>Status</span>
                <span>Countdown</span>
                <span>Actions</span>
              </div>

              {filtered.map(r => {
                const name = Array.isArray(r.profiles?.full_name) ? r.profiles.full_name.join(" ") : (r.profiles?.full_name ?? "Unknown");
                const deadline = r.status === "payment_shared" ? r.payment_deadline
                  : r.status === "utr_submitted" ? r.utr_deadline : null;
                const expanded = expandedId === r.id;

                return (
                  <div key={r.id} style={{ borderBottom: `1px solid ${T.bdr}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 100px 100px 140px 120px 160px",
                      padding: "14px 20px", alignItems: "center", cursor: "pointer",
                      background: expanded ? "rgba(99,102,241,.03)" : "transparent",
                      transition: "background .15s" }}
                      onClick={() => setExpandedId(expanded ? null : r.id)}>

                      <div>
                        <p style={{ fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: T.text, margin: 0 }}>{r.order_id}</p>
                        <p style={{ fontSize: 11, color: T.sub, margin: "2px 0 0" }}>{name}</p>
                      </div>

                      <div>
                        <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>
                          {new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                        {r.utr_number && (
                          <p style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", margin: "2px 0 0" }}>
                            UTR: {r.utr_number}
                          </p>
                        )}
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <IndianRupee size={12} color={A1} />
                          <span style={{ fontSize: 14, fontWeight: 900, color: T.text }}>{Number(r.amount).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.sub }}>{r.payment_method}</span>
                      </div>

                      <div><StatusBadge status={r.status} /></div>

                      <div><CountdownCell deadline={deadline} /></div>

                      <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                        {r.status === "pending" && (
                          <button onClick={() => setShareModal(r)}
                            style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${A1}`,
                              background: "rgba(99,102,241,.08)", color: A1, fontWeight: 700, fontSize: 11,
                              cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                            <Share2 size={12} /> Share
                          </button>
                        )}
                        {r.status === "utr_submitted" && (
                          <button onClick={() => setReviewModal(r)}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "none",
                              background: "#16a34a", color: "white", fontWeight: 700, fontSize: 11,
                              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                              boxShadow: "0 4px 12px rgba(22,163,74,.2)" }}>
                            <CheckCircle2 size={12} /> Review
                          </button>
                        )}
                        {(r.status === "approved" || r.status === "rejected") && (
                          <StatusBadge status={r.status} />
                        )}
                        <ChevronDown size={14} color={T.sub} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s", marginLeft: 2 }} />
                      </div>
                    </div>

                    {/* Expanded row */}
                    {expanded && (
                      <div style={{ padding: "16px 24px 20px", background: "rgba(99,102,241,.025)", borderTop: `1px solid ${T.bdr}`,
                        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>User Info</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{name}</p>
                          <p style={{ fontSize: 11, color: T.sub, margin: "2px 0 0" }}>
                            {r.profiles?.user_type ?? "—"} · Code: {Array.isArray(r.profiles?.user_code) ? r.profiles.user_code.join("") : (r.profiles?.user_code ?? "—")}
                          </p>
                        </div>
                        {r.admin_payment_details && (
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>Payment Details Sent</p>
                            {r.admin_payment_details.upi_id && <p style={{ fontSize: 12, color: T.text, margin: "2px 0" }}>UPI: {r.admin_payment_details.upi_id}</p>}
                            {r.admin_payment_details.account_no && <p style={{ fontSize: 12, color: T.text, margin: "2px 0" }}>Acc: {r.admin_payment_details.account_no}</p>}
                            {r.admin_payment_details.ifsc && <p style={{ fontSize: 12, color: T.text, margin: "2px 0" }}>IFSC: {r.admin_payment_details.ifsc}</p>}
                            {r.admin_payment_details.note && <p style={{ fontSize: 12, color: T.sub, margin: "6px 0 0", fontStyle: "italic" }}>Note: {r.admin_payment_details.note}</p>}
                          </div>
                        )}
                        {r.review_note && (
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>Review Note</p>
                            <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{r.review_note}</p>
                            {r.reviewed_at && <p style={{ fontSize: 11, color: T.sub, margin: "4px 0 0" }}>{new Date(r.reviewed_at).toLocaleString("en-IN")}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
