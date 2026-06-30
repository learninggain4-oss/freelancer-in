import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction, readResponseJson } from "@/lib/supabase-functions";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock, CheckCircle2, XCircle, Copy, AlertCircle,
  ArrowLeft, Smartphone, Building2, RefreshCw, ShieldCheck,
  Send, Timer, IndianRupee, Loader2,
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

function parseJsonLike(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return typeof raw === "object" ? raw : {};
}

function CountdownDisplay({ secs, label }: { secs: number | null; label: string }) {
  // Show the countdown even if secs is 0, only hide if it's explicitly null
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
    cancelled:       { label: "Cancelled", color: "#6b7280", bg: "rgba(148,163,184,.12)" },
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
  pending: 0, payment_shared: 1, utr_submitted: 2, approved: 3, rejected: 3, expired: 3, cancelled: 3,
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
  const [proofUploading, setProofUploading] = useState(false);
  const [proofMeta, setProofMeta] = useState<{ path: string; url: string; name: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // 8-minute countdown stored in localStorage — starts the first time payment_shared is seen
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);
  const utrSectionRef = useRef<HTMLDivElement>(null);
  const utrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!requestId) return;
    if (req?.status !== "payment_shared") {
      if (req?.status && !["pending", "payment_shared"].includes(req.status)) {
        localStorage.removeItem(`pay_dl_${requestId}`);
        setPaymentDeadline(null);
      }
      return;
    }
    const key = `pay_dl_${requestId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setPaymentDeadline(stored);
    } else {
      const dl = new Date(Date.now() + PAYMENT_TIMEOUT_MIN * 60 * 1000).toISOString();
      localStorage.setItem(key, dl);
      setPaymentDeadline(dl);
    }
  }, [req?.status, requestId]);

  const paymentSecs = useCountdown(paymentDeadline);

  const utrSecs = useCountdown(req?.utr_deadline);
  const firstWindowDeadline = req?.created_at
    ? new Date(new Date(req.created_at).getTime() + 60 * 1000).toISOString()
    : null;
  const firstWindowSecs = useCountdown(req?.status === "pending" ? firstWindowDeadline : null);

  // OTP verification flow (stored in payment_details JSON)
  const _pd = parseJsonLike(req?.payment_details);
  const phoneNumber = (_pd.phone_number || _pd.phone || "") as string;
  const otpSentAt = (_pd.otp_sent_at || null) as string | null;
  const otpSubmittedAt = (_pd.otp_submitted_at || null) as string | null;
  const otpSendDeadline = otpSentAt ? new Date(new Date(otpSentAt).getTime() + 2 * 60 * 1000).toISOString() : null;
  const otpSubmitDeadline = otpSubmittedAt ? new Date(new Date(otpSubmittedAt).getTime() + 60 * 1000).toISOString() : null;
  const otpSendSecs = useCountdown(otpSendDeadline);
  const otpSubmitSecs = useCountdown(otpSubmitDeadline);

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

  // Auto-refresh: Poll every 3 seconds while on pending status
  useEffect(() => {
    if (!requestId || !req || req.status !== "pending") return;
    const pollInterval = setInterval(() => {
      fetchReq();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [requestId, req?.status]);

  const submitUtr = async () => {
    if (!/^\d{10}$/.test(utrInput.trim())) {
      toast.error("Enter a valid 10-digit UTR number"); return;
    }
    if (!proofMeta) {
      toast.error("Please upload your payment screenshot"); return;
    }
    
    setSubmittingUtr(true);
    try {
      const utrDeadline = new Date(Date.now() + UTR_TIMEOUT_MIN * 60 * 1000).toISOString();
      const mergedPaymentDetails = {
        ...parseJsonLike(req?.payment_details),
        ...(proofMeta ? {
          user_payment_screenshot_path: proofMeta.path,
          user_payment_screenshot_url: proofMeta.url,
          user_payment_screenshot_name: proofMeta.name,
        } : {}),
      };
      
      // Build update payload - only include fields that exist
      const updatePayload: Record<string, any> = {
        utr_number: utrInput.trim().toUpperCase(),
        utr_submitted_at: new Date().toISOString(),
        utr_deadline: utrDeadline,
        payment_details: mergedPaymentDetails,
        status: "utr_submitted",
      };
      
      // Try to include updated_at but don't fail if it doesn't exist
      updatePayload.updated_at = new Date().toISOString();
      
      const { error } = await supabase.from("deposit_requests").update(updatePayload).eq("id", requestId);
      
      if (error) { 
        console.error("Submit error:", error);
        const errorMsg = error.message || "Failed to submit payment proof";
        // Handle schema cache errors gracefully
        if (errorMsg.includes("column") && errorMsg.includes("cache")) {
          toast.error("Database sync in progress. Please try again in a few seconds.");
        } else {
          toast.error(errorMsg);
        }
        setSubmittingUtr(false);
        return;
      }
      
      toast.success("Payment proof submitted! Admin will verify within 5 minutes.");
      setUtrInput("");
      setProofMeta(null);
      fetchReq();
    } catch (e: any) {
      console.error("Submit exception:", e);
      toast.error(e?.message || "An error occurred while submitting payment proof");
    } finally {
      setSubmittingUtr(false);
    }
  };

  const uploadProof = async (file: File | null) => {
    if (!file || !requestId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setProofUploading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Not authenticated");

      // Convert to base64 so it travels as plain JSON (avoids Vite proxy multipart issues)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await callEdgeFunction("upload-deposit-proof", {
        method: "POST",
        token: session.access_token,
        body: {
          request_id: requestId,
          file_base64: base64,
          file_name: file.name,
          file_type: file.type || "image/jpeg",
        },
      });
      const data = await readResponseJson<any>(res);
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setProofMeta({ path: data.path, url: data.url, name: data.name });
      toast.success("Payment screenshot uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload screenshot");
    } finally {
      setProofUploading(false);
    }
  };

  const handleSendOtp = async () => {
    setOtpSending(true);
    try {
      const mergedPd = { ...parseJsonLike(req.payment_details), otp_sent_at: new Date().toISOString() };
      const { error } = await supabase.from("deposit_requests").update({ payment_details: mergedPd }).eq("id", requestId);
      if (error) throw error;
      toast.success("OTP request sent! Admin will send OTP to your number.");
      fetchReq();
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP request");
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmitOtp = async () => {
    if (!otpInput.trim()) { toast.error("Enter OTP"); return; }
    setOtpSubmitting(true);
    try {
      const mergedPd = {
        ...parseJsonLike(req.payment_details),
        otp_value: otpInput.trim(),
        otp_submitted_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("deposit_requests").update({ payment_details: mergedPd }).eq("id", requestId);
      if (error) throw error;
      toast.success("OTP submitted successfully!");
      setOtpInput("");
      fetchReq();
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit OTP");
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleCancelConfirm = async () => {
    setShowCancelConfirm(false);
    try {
      if (requestId && req?.status && !["approved", "rejected", "expired", "cancelled"].includes(req.status)) {
        const { error } = await supabase
          .from("deposit_requests")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", requestId);
        if (error) throw error;
        setReq((prev: any) => prev ? { ...prev, status: "cancelled" } : prev);
        queryClient.invalidateQueries({ queryKey: ["all-deposit-requests", profile?.id] });
        queryClient.invalidateQueries({ queryKey: ["deposit-requests"] });
      }
    } catch (e) {
      console.error("Failed to update cancel status:", e);
    }
    navigate(-1);
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

  const adminPd = parseJsonLike(req.admin_payment_details);
  const pd = adminPd && Object.keys(adminPd).length > 0
    ? adminPd
    : parseJsonLike(req.payment_details);

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "white", fontFamily: "Inter,system-ui,sans-serif", padding: "0 0 40px" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
        @keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-6px);opacity:1}}
      `}</style>

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
          <button disabled={req?.status === "pending" || req?.status === "expired"} onClick={() => navigate(-1)} 
            style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 10, padding: "8px 10px", cursor: (req?.status === "pending" || req?.status === "expired") ? "not-allowed" : "pointer", 
            color: (req?.status === "pending" || req?.status === "expired") ? "rgba(255,255,255,.4)" : "white", 
            opacity: (req?.status === "pending" || req?.status === "expired") ? 0.5 : 1 }}>
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
            {/* Show countdown while ticking, waiting animation after it ends */}
            {firstWindowSecs !== null && firstWindowSecs > 0 && (
              <CountdownDisplay secs={firstWindowSecs} label="Initial processing countdown" />
            )}

            {/* Waiting animation — shown after countdown reaches 0 */}
            {(firstWindowSecs === null || firstWindowSecs === 0) && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                padding: "28px 20px", marginBottom: 16,
                background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.18)", borderRadius: 16,
              }}>
                {/* Pulsing ring animation */}
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: `3px solid ${A1}`, opacity: 0.3,
                    animation: "ping 1.4s cubic-bezier(0,0,.2,1) infinite",
                  }} />
                  <div style={{
                    position: "absolute", inset: 6, borderRadius: "50%",
                    border: `2px solid ${A2}`, opacity: 0.5,
                    animation: "ping 1.4s cubic-bezier(0,0,.2,1) infinite .3s",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Loader2 size={26} color={A1} style={{ animation: "spin 1.2s linear infinite" }} />
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.85)", margin: "0 0 4px" }}>
                    Waiting for Admin
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", margin: 0, lineHeight: 1.5 }}>
                    Keep this page open. You will be notified automatically.
                  </p>
                </div>
                {/* Animated dots */}
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%", background: A1,
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowCancelConfirm(true)} style={{ flex: 1, background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "10px 20px",
                color: "#fecaca", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── PAYMENT SHARED ── */}
        {req.status === "payment_shared" && pd && Object.keys(pd).length > 0 && (
          <div style={{ animation: "fadeUp .4s ease" }}>
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

              {/* Amount to pay — prominent */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, padding: "14px 16px", marginBottom: 16, borderRadius: 12,
                background: "linear-gradient(135deg,rgba(99,102,241,.18),rgba(139,92,246,.18))",
                border: "1px solid rgba(99,102,241,.35)",
              }}>
                <IndianRupee size={22} color="#a5b4fc" />
                <span style={{ fontSize: 32, fontWeight: 900, color: "white", letterSpacing: "-1px" }}>
                  {Number(req.amount).toLocaleString("en-IN")}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 600, alignSelf: "flex-end", marginBottom: 4 }}>
                  to pay
                </span>
              </div>

              {(pd.method === "UPI" || pd.upi_id) ? (
                <div>
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
            {req.status === "payment_shared" && (
              <div ref={utrSectionRef} style={{ borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", padding: 20 }}>

                {/* 8-minute animated countdown — above Submit Payment Proof */}
                <AnimatedCountdown secs={paymentSecs} />


                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Submit Payment Proof</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>
                  After paying, enter your UTR / transaction reference number below as proof.
                </p>
                <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#fecaca", lineHeight: 1.5 }}>
                    <strong>Important Warning:</strong> Complete payment within 8 minutes. After this, payment refund will be unavailable.
                  </p>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Upload Payment Screenshot <span style={{ fontWeight: 700, textTransform: "none", color: "#f87171" }}>*required</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => uploadProof(e.target.files?.[0] || null)}
                    style={{ width: "100%", fontSize: 12, color: "rgba(255,255,255,.8)" }}
                  />
                  {proofUploading && <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,.55)" }}>Uploading screenshot…</p>}
                  {proofMeta && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#86efac" }}>Uploaded: {proofMeta.name}</p>}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    UTR Number <span style={{ fontWeight: 700, textTransform: "none", color: "#f87171" }}>*10 digits required</span>
                  </label>
                  <input
                    ref={utrInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    placeholder="Enter 10-digit UTR number"
                    value={utrInput}
                    onChange={e => setUtrInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{
                      width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 16, fontWeight: 700,
                      background: utrInput.length === 10 ? "rgba(99,102,241,.12)" : utrInput.length > 0 ? "rgba(239,68,68,.07)" : "rgba(255,255,255,.07)",
                      border: utrInput.length === 10 ? `1px solid ${A1}` : utrInput.length > 0 ? "1px solid rgba(239,68,68,.5)" : "1px solid rgba(255,255,255,.12)",
                      color: "white", outline: "none", fontFamily: "monospace", letterSpacing: ".1em",
                      boxSizing: "border-box",
                      boxShadow: utrInput.length === 10 ? `0 0 0 2px rgba(99,102,241,.25)` : "none",
                    }}
                  />
                  <p style={{ margin: "5px 0 12px", fontSize: 11, color: utrInput.length === 10 ? "#86efac" : utrInput.length > 0 ? "#fca5a5" : "rgba(255,255,255,.35)" }}>
                    {utrInput.length}/10 digits {utrInput.length === 10 ? "✓" : ""}
                  </p>
                </div>
                {(() => {
                  const canSubmit = utrInput.length === 10 && !!proofMeta && !submittingUtr;
                  return (
                    <button onClick={submitUtr} disabled={!canSubmit}
                      style={{
                        width: "100%", padding: "14px", borderRadius: 13, border: "none",
                        background: canSubmit ? `linear-gradient(135deg,${A1},${A2})` : "rgba(99,102,241,.2)",
                        color: canSubmit ? "white" : "rgba(255,255,255,.3)",
                        fontWeight: 800, fontSize: 14, cursor: canSubmit ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: canSubmit ? "0 8px 24px rgba(99,102,241,.35)" : "none",
                      }}>
                      {submittingUtr
                        ? <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 1s linear infinite", display: "inline-block" }} /> Submitting…</>
                        : <><Send size={16} /> Submit Payment Proof</>}
                    </button>
                  );
                })()}
              </div>
            )}

          </div>
        )}

        {/* ── UTR SUBMITTED ── */}
        {req.status === "utr_submitted" && (
          <div style={{ animation: "fadeUp .4s ease" }}>

            {/* 5-minute countdown */}
            <CountdownDisplay secs={utrSecs} label="Admin verification time remaining (5 min)" />

            {/* Payment method phone number */}
            {phoneNumber && (
              <div style={{ borderRadius: 14, background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.22)", padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <Smartphone size={22} color={A1} style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".1em", margin: 0 }}>Payment Method Number</p>
                  <p style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: "white", margin: "4px 0 0", letterSpacing: ".05em" }}>{phoneNumber}</p>
                </div>
              </div>
            )}

            {/* OTP flow card */}
            <div style={{ borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 14px", color: "rgba(255,255,255,.85)" }}>OTP Verification</h3>

              {/* Send OTP button — disabled while 2-min countdown is running */}
              {!otpSubmittedAt && (
                <>
                  <button
                    onClick={handleSendOtp}
                    disabled={otpSending || (otpSendSecs !== null && otpSendSecs > 0)}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 12, border: "none",
                      background: (otpSendSecs !== null && otpSendSecs > 0)
                        ? "rgba(99,102,241,.2)"
                        : `linear-gradient(135deg,${A1},${A2})`,
                      color: (otpSendSecs !== null && otpSendSecs > 0) ? "rgba(255,255,255,.45)" : "white",
                      fontWeight: 800, fontSize: 14, cursor: (otpSending || (otpSendSecs !== null && otpSendSecs > 0)) ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: (otpSendSecs !== null && otpSendSecs > 0) ? "none" : "0 6px 20px rgba(99,102,241,.3)",
                      marginBottom: 12,
                    }}
                  >
                    <Send size={15} />
                    {otpSending
                      ? "Sending…"
                      : (otpSendSecs !== null && otpSendSecs > 0)
                        ? `Resend OTP in ${String(Math.floor(otpSendSecs / 60)).padStart(2, "0")}:${String(otpSendSecs % 60).padStart(2, "0")}`
                        : (otpSentAt ? "Resend OTP" : "Send OTP")}
                  </button>

                  {/* OTP input — shown after OTP is sent */}
                  {otpSentAt && (
                    <div style={{ marginTop: 4, animation: "fadeUp .3s ease" }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".07em" }}>
                        Enter OTP received
                      </label>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={8}
                          placeholder="Enter OTP"
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 8))}
                          style={{
                            flex: 1, padding: "13px 16px", borderRadius: 12, fontSize: 22, fontWeight: 900,
                            background: "rgba(99,102,241,.1)", border: `1.5px solid ${A1}`,
                            color: "white", outline: "none", fontFamily: "monospace", letterSpacing: ".2em",
                            textAlign: "center",
                          }}
                        />
                        <button
                          onClick={handleSubmitOtp}
                          disabled={otpSubmitting || !otpInput.trim()}
                          style={{
                            padding: "13px 20px", borderRadius: 12, border: "none",
                            background: otpInput.trim() ? "#16a34a" : "rgba(22,163,74,.2)",
                            color: otpInput.trim() ? "white" : "rgba(255,255,255,.3)",
                            fontWeight: 800, fontSize: 13, cursor: (otpSubmitting || !otpInput.trim()) ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                            boxShadow: otpInput.trim() ? "0 6px 16px rgba(22,163,74,.3)" : "none",
                          }}
                        >
                          {otpSubmitting
                            ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 1s linear infinite", display: "inline-block" }} /></>
                            : <><CheckCircle2 size={15} /> Submit</>}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* After OTP submitted — show value + 1-minute countdown */}
              {otpSubmittedAt && (
                <div style={{ animation: "fadeUp .3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12,
                    background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", marginBottom: 12 }}>
                    <CheckCircle2 size={20} color="#4ade80" />
                    <div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.45)", margin: 0 }}>OTP Submitted</p>
                      <p style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace", color: "#4ade80", margin: "2px 0 0", letterSpacing: ".15em" }}>
                        {_pd.otp_value}
                      </p>
                    </div>
                  </div>
                  {otpSubmitSecs !== null && otpSubmitSecs > 0 && (
                    <CountdownDisplay secs={otpSubmitSecs} label="OTP verification countdown (1 min)" />
                  )}
                </div>
              )}
            </div>

            {/* Proof submitted info */}
            <div style={{ textAlign: "center", padding: "24px 20px", borderRadius: 16,
              background: "rgba(167,139,250,.08)", border: "1px solid rgba(167,139,250,.25)" }}>
              <ShieldCheck size={44} color="#a78bfa" style={{ margin: "0 auto 14px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Proof Submitted</h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                Your UTR number has been submitted. An FlexPay Bank will verify and credit your wallet within 5 minutes.
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
            <button onClick={() => setShowCancelConfirm(true)} style={{
              padding: "12px 32px", borderRadius: 13, background: "rgba(239,68,68,.2)",
              color: "#fecaca", fontWeight: 700, border: "1px solid rgba(239,68,68,.4)", cursor: "pointer", fontSize: 14,
            }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: BG, border: "1px solid rgba(255,255,255,.1)", borderRadius: 18,
            padding: 24, maxWidth: 320, width: "100%", animation: "fadeUp .3s ease"
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, marginTop: 0 }}>Cancel Payment?</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to cancel this payment request? You will need to create a new one.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCancelConfirm(false)} style={{
                flex: 1, padding: "12px 16px", borderRadius: 10,
                background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
                color: "white", fontWeight: 600, cursor: "pointer", fontSize: 13
              }}>
                Keep Payment
              </button>
              <button onClick={handleCancelConfirm} style={{
                flex: 1, padding: "12px 16px", borderRadius: 10,
                background: "rgba(239,68,68,.2)", border: "1px solid rgba(239,68,68,.4)",
                color: "#fecaca", fontWeight: 600, cursor: "pointer", fontSize: 13
              }}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnimatedCountdown({ secs }: { secs: number | null }) {
  if (secs === null) return null;
  const totalSecs = 8 * 60;
  const progress = Math.max(0, Math.min(1, secs / totalSecs));
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - progress);
  const m = Math.floor(Math.max(0, secs) / 60);
  const s = Math.max(0, secs) % 60;
  const urgent = secs < 120;
  const ringColor = secs <= 0 ? "#6b7280" : urgent ? "#ef4444" : "#6366f1";
  const glowColor = urgent ? "rgba(239,68,68,.4)" : "rgba(99,102,241,.4)";

  return (
    <div style={{
      textAlign: "center", padding: "20px 16px", borderRadius: 18, marginBottom: 16,
      background: urgent ? "rgba(239,68,68,.07)" : "rgba(99,102,241,.07)",
      border: `1px solid ${urgent ? "rgba(239,68,68,.25)" : "rgba(99,102,241,.2)"}`,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em",
        color: urgent ? "#f87171" : "rgba(255,255,255,.4)", marginBottom: 14, marginTop: 0 }}>
        Time Remaining to Pay
      </p>
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width={130} height={130} viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx={65} cy={65} r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={7} />
          {/* Progress */}
          <circle
            cx={65} cy={65} r={radius} fill="none"
            stroke={ringColor} strokeWidth={7}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 1s", filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: 30, fontWeight: 900, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums",
            color: secs <= 0 ? "#6b7280" : urgent ? "#f87171" : "white",
            lineHeight: 1,
          }}>
            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".06em", marginTop: 3 }}>
            MIN : SEC
          </span>
        </div>
      </div>
      {urgent && secs > 0 && (
        <p style={{ margin: "12px 0 0", fontSize: 12, fontWeight: 700, color: "#f87171", animation: "ping 1s ease infinite" }}>
          ⚡ Complete payment quickly!
        </p>
      )}
      {secs <= 0 && (
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>Payment window expired</p>
      )}
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
