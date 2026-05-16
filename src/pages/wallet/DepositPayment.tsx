import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock, CheckCircle2, XCircle, Copy, AlertCircle,
  ArrowLeft, Smartphone, Building2, RefreshCw, ShieldCheck,
  Send, Timer, IndianRupee,
} from "lucide-react";
import { toast } from "sonner";

const PAYMENT_TIMEOUT_MIN = 8;
const UTR_TIMEOUT_MIN = 5;

const BG = "#070714";
const A1 = "#6366f1";
const A2 = "#8b5cf6";

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

function CountdownDisplay({ secs, label }: { secs: number | null; label: string }) {
  if (secs === null) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs < 60;
  return (
    <div style={{
      textAlign: "center", padding: "20px 16px",
      borderRadius: 16, marginBottom: 16,
      background: urgent ? "rgba(239,68,68,.1)" : "rgba(99,102,241,.08)",
      border: `1px solid ${urgent ? "rgba(239,68,68,.3)" : "rgba(99,102,241,.25)"}`,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em",
        color: urgent ? "#f87171" : "rgba(255,255,255,.45)", marginBottom: 8 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Timer size={20} color={urgent ? "#f87171" : A1} />
        <span style={{
          fontSize: 40, fontWeight: 900, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums",
          color: urgent ? "#f87171" : "white",
        }}>
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      </div>
      {secs === 0 && (
        <p style={{ color: "#f87171", fontSize: 12, fontWeight: 600, marginTop: 6 }}>
          Time expired — this request has been cancelled
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:         { label: "Awaiting Details", color: "#fbbf24", bg: "rgba(251,191,36,.12)" },
    payment_shared:  { label: "Payment Details Shared", color: "#60a5fa", bg: "rgba(96,165,250,.12)" },
    utr_submitted:   { label: "Proof Submitted", color: "#a78bfa", bg: "rgba(167,139,250,.12)" },
    approved:        { label: "Approved", color: "#4ade80", bg: "rgba(74,222,128,.12)" },
    rejected:        { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,.12)" },
    expired:         { label: "Expired", color: "#94a3b8", bg: "rgba(148,163,184,.1)" },
  };
  const s = map[status] ?? { label: status, color: "#e2e8f0", bg: "rgba(255,255,255,.08)" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
      color: s.color, background: s.bg, textTransform: "uppercase", letterSpacing: ".06em" }}>
      {s.label}
    </span>
  );
}

const STEPS = ["Request Created", "Details Shared", "Proof Submitted", "Verified"];
const STATUS_STEP: Record<string, number> = {
  pending: 0, payment_shared: 1, utr_submitted: 2, approved: 3, rejected: 3, expired: 3,
};

function Stepper({ status }: { status: string }) {
  const active = STATUS_STEP[status] ?? 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
      {STEPS.map((label, i) => (
        <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            {i > 0 && <div style={{ flex: 1, height: 2, background: i <= active ? A1 : "rgba(255,255,255,.1)" }} />}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: i < active ? A1 : i === active ? `linear-gradient(135deg,${A1},${A2})` : "rgba(255,255,255,.08)",
              border: i === active ? `2px solid ${A2}` : "2px solid transparent",
              boxShadow: i === active ? `0 0 12px rgba(99,102,241,.5)` : "none",
              fontSize: 11, fontWeight: 800, color: i <= active ? "white" : "rgba(255,255,255,.3)",
            }}>
              {i < active ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < active ? A1 : "rgba(255,255,255,.1)" }} />}
          </div>
          <p style={{ fontSize: 9, fontWeight: 600, color: i <= active ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.25)",
            marginTop: 6, textAlign: "center", letterSpacing: ".04em" }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={copy} type="button"
      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px",
        color: copied ? "#4ade80" : "rgba(255,255,255,.4)", display: "flex", alignItems: "center", gap: 4 }}>
      {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
      <span style={{ fontSize: 11 }}>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export default function DepositPayment() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [utrInput, setUtrInput] = useState("");
  const [submittingUtr, setSubmittingUtr] = useState(false);

  const paymentSecs = useCountdown(req?.payment_deadline);
  const utrSecs = useCountdown(req?.utr_deadline);

  const fetchReq = useCallback(async () => {
    if (!requestId) return;
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (error) { toast.error("Could not load payment request"); setLoading(false); return; }
    setReq(data);
    setLoading(false);
  }, [requestId]);

  useEffect(() => { fetchReq(); }, [fetchReq]);

  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel(`deposit:${requestId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "deposit_requests",
        filter: `id=eq.${requestId}`,
      }, (payload) => {
        setReq(payload.new);
        if (payload.new.status === "payment_shared") toast.info("Admin shared payment details — please pay now!");
        if (payload.new.status === "approved") toast.success("Payment confirmed! Wallet credited.");
        if (payload.new.status === "rejected") toast.error("Payment rejected. Check review note.");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [requestId]);

  useEffect(() => {
    if (paymentSecs === 0 && req?.status === "payment_shared") {
      supabase.from("deposit_requests")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", requestId).then(() => fetchReq());
    }
  }, [paymentSecs, req?.status]);

  const submitUtr = async () => {
    if (!utrInput.trim() || utrInput.trim().length < 6) {
      toast.error("Enter a valid UTR number (min 6 characters)"); return;
    }
    setSubmittingUtr(true);
    const utrDeadline = new Date(Date.now() + UTR_TIMEOUT_MIN * 60 * 1000).toISOString();
    const { error } = await supabase.from("deposit_requests").update({
      utr_number: utrInput.trim().toUpperCase(),
      utr_submitted_at: new Date().toISOString(),
      utr_deadline: utrDeadline,
      status: "utr_submitted",
      updated_at: new Date().toISOString(),
    }).eq("id", requestId);
    if (error) { toast.error("Failed to submit. Please try again."); setSubmittingUtr(false); return; }
    toast.success("Payment proof submitted! Admin will verify within 5 minutes.");
    fetchReq();
    setSubmittingUtr(false);
  };

  if (loading) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${A1}`, borderTopColor: "transparent",
          animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>Loading payment details…</p>
      </div>
    </div>
  );

  if (!req) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <XCircle size={48} color="#f87171" style={{ margin: "0 auto 16px" }} />
        <p style={{ color: "white", fontWeight: 700, fontSize: 18 }}>Request not found</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12,
          background: A1, color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}>
          Go Back
        </button>
      </div>
    </div>
  );

  const pd = req.admin_payment_details;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "white", fontFamily: "Inter,system-ui,sans-serif", padding: "0 0 40px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-5%", left: "-5%", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(139,92,246,.1) 0%,transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "white" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Payment</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", margin: 0 }}>Complete your deposit</p>
          </div>
        </div>

        {/* Order Card */}
        <div style={{ borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
          padding: "20px", marginBottom: 20, animation: "fadeUp .4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>Order ID</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace" }}>{req.order_id}</span>
                <CopyBtn text={req.order_id} />
              </div>
            </div>
            <StatusBadge status={req.status} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>Amount</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <IndianRupee size={18} color={A1} />
                <span style={{ fontSize: 28, fontWeight: 900, color: "white" }}>
                  {Number(req.amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>Method</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>{req.payment_method}</span>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <Stepper status={req.status} />

        {/* Status-based content */}

        {/* ── PENDING ── */}
        {req.status === "pending" && (
          <div style={{ textAlign: "center", padding: "32px 24px", animation: "fadeUp .5s ease" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
              background: "rgba(99,102,241,.12)", border: "2px solid rgba(99,102,241,.3)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={28} color={A1} style={{ animation: "spin 4s linear infinite" }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Waiting for Payment Details</h2>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              Your deposit request has been received. An admin will share the payment details shortly.
              <br /><br />
              Please keep this page open. You will be notified automatically.
            </p>
            <div style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)",
              borderRadius: 12, padding: "12px 16px", textAlign: "left" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <AlertCircle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.5, margin: 0 }}>
                  Do not close this page. Once the admin shares payment details, you will have <strong style={{ color: "white" }}>{PAYMENT_TIMEOUT_MIN} minutes</strong> to complete the payment.
                </p>
              </div>
            </div>
            <button onClick={fetchReq} style={{ marginTop: 20, background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "10px 20px",
              color: "rgba(255,255,255,.6)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        )}

        {/* ── PAYMENT SHARED ── */}
        {req.status === "payment_shared" && pd && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <CountdownDisplay secs={paymentSecs} label="Time remaining to pay" />

            {/* Payment Details */}
            <div style={{ borderRadius: 16, background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.25)", padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                {pd.method === "UPI" || pd.upi_id
                  ? <Smartphone size={18} color={A1} />
                  : <Building2 size={18} color={A1} />}
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
                  {pd.method === "UPI" || pd.upi_id ? "UPI Payment Details" : "Bank Transfer Details"}
                </h3>
              </div>

              {(pd.method === "UPI" || pd.upi_id) ? (
                <div className="space-y-3">
                  <DetailRow label="UPI ID" value={pd.upi_id} copyable />
                  {pd.upi_name && <DetailRow label="Account Name" value={pd.upi_name} />}
                </div>
              ) : (
                <div>
                  {pd.bank_name && <DetailRow label="Bank" value={pd.bank_name} />}
                  {pd.account_no && <DetailRow label="Account Number" value={pd.account_no} copyable />}
                  {pd.ifsc && <DetailRow label="IFSC Code" value={pd.ifsc} copyable />}
                  {pd.holder_name && <DetailRow label="Account Holder" value={pd.holder_name} />}
                </div>
              )}

              {pd.note && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", marginBottom: 4 }}>NOTE FROM ADMIN</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.75)", margin: 0 }}>{pd.note}</p>
                </div>
              )}
            </div>

            {/* UTR Form */}
            {(paymentSecs ?? 1) > 0 && (
              <div style={{ borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Submit Payment Proof</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>
                  After paying, enter your UTR / transaction reference number below as proof.
                </p>
                <input
                  type="text"
                  placeholder="Enter UTR / Transaction ID"
                  value={utrInput}
                  onChange={e => setUtrInput(e.target.value.toUpperCase())}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: "rgba(255,255,255,.07)", border: utrInput ? `1px solid ${A1}` : "1px solid rgba(255,255,255,.12)",
                    color: "white", outline: "none", fontFamily: "monospace", letterSpacing: ".05em",
                    boxSizing: "border-box", marginBottom: 12,
                  }}
                />
                <button onClick={submitUtr} disabled={submittingUtr || !utrInput.trim()}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 13, border: "none",
                    background: utrInput.trim() ? `linear-gradient(135deg,${A1},${A2})` : "rgba(99,102,241,.2)",
                    color: utrInput.trim() ? "white" : "rgba(255,255,255,.3)",
                    fontWeight: 800, fontSize: 14, cursor: utrInput.trim() ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: utrInput.trim() ? "0 8px 24px rgba(99,102,241,.35)" : "none",
                  }}>
                  {submittingUtr ? <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 1s linear infinite", display: "inline-block" }} /> Submitting…</> : <><Send size={16} /> Submit Payment Proof</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── UTR SUBMITTED ── */}
        {req.status === "utr_submitted" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <CountdownDisplay secs={utrSecs} label="Admin verification time remaining" />
            <div style={{ textAlign: "center", padding: "24px 20px", borderRadius: 16,
              background: "rgba(167,139,250,.08)", border: "1px solid rgba(167,139,250,.25)" }}>
              <ShieldCheck size={44} color="#a78bfa" style={{ margin: "0 auto 14px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Proof Submitted</h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                Your UTR number has been submitted. An admin will verify and credit your wallet within 5 minutes.
              </p>
              <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 10, padding: "10px 14px", display: "inline-block" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", marginBottom: 3 }}>UTR NUMBER</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace" }}>{req.utr_number}</span>
                  <CopyBtn text={req.utr_number} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── APPROVED ── */}
        {req.status === "approved" && (
          <div style={{ textAlign: "center", padding: "36px 24px", borderRadius: 18,
            background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.25)", animation: "fadeUp .4s ease" }}>
            <CheckCircle2 size={56} color="#4ade80" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: "#4ade80" }}>Payment Approved!</h2>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              ₹{Number(req.amount).toLocaleString("en-IN")} has been credited to your wallet.
            </p>
            {req.review_note && (
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontStyle: "italic", marginBottom: 24 }}>"{req.review_note}"</p>
            )}
            <button onClick={() => navigate(-1)} style={{
              padding: "12px 32px", borderRadius: 13, background: "#16a34a",
              color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14,
            }}>
              Go to Wallet
            </button>
          </div>
        )}

        {/* ── REJECTED ── */}
        {req.status === "rejected" && (
          <div style={{ textAlign: "center", padding: "36px 24px", borderRadius: 18,
            background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.25)", animation: "fadeUp .4s ease" }}>
            <XCircle size={56} color="#f87171" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: "#f87171" }}>Payment Rejected</h2>
            {req.review_note && (
              <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", marginBottom: 4 }}>REASON</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", margin: 0 }}>{req.review_note}</p>
              </div>
            )}
            <button onClick={() => navigate(-1)} style={{
              padding: "12px 32px", borderRadius: 13, background: "rgba(255,255,255,.08)",
              color: "white", fontWeight: 700, border: "1px solid rgba(255,255,255,.12)", cursor: "pointer", fontSize: 14,
            }}>
              Back to Wallet
            </button>
          </div>
        )}

        {/* ── EXPIRED ── */}
        {req.status === "expired" && (
          <div style={{ textAlign: "center", padding: "36px 24px", borderRadius: 18,
            background: "rgba(148,163,184,.07)", border: "1px solid rgba(148,163,184,.2)", animation: "fadeUp .4s ease" }}>
            <Clock size={48} color="#94a3b8" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "#94a3b8" }}>Request Expired</h2>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              The payment window has expired. Please create a new deposit request.
            </p>
            <button onClick={() => navigate(-1)} style={{
              padding: "12px 32px", borderRadius: 13, background: A1,
              color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14,
            }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "white", fontFamily: value?.length > 10 ? "monospace" : "inherit" }}>{value}</span>
        {copyable && <CopyBtn text={value} />}
      </div>
    </div>
  );
}
