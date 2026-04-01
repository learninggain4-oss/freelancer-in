import { useEffect, useState } from "react";
import { Clock, Mail, ArrowLeft, LogOut, MessageCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthPageShell, { A1, A2 } from "@/components/layout/AuthPageShell";

const VerificationPending = () => {
  const { profile, signOut } = useAuth();
  const [countdownHours, setCountdownHours] = useState<number>(6);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "approval_countdown_hours").maybeSingle()
      .then(({ data }) => {
        if (data) { const h = Number(data.value); if (!isNaN(h) && h > 0) setCountdownHours(h); }
      });
  }, []);

  useEffect(() => {
    if (!profile?.created_at) return;
    const deadline = new Date(profile.created_at).getTime() + countdownHours * 3600000;
    const update = () => setRemaining(Math.max(0, deadline - Date.now()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [profile?.created_at, countdownHours]);

  const totalMs = countdownHours * 3600000;
  const progress = totalMs > 0 ? (remaining / totalMs) * 100 : 0;
  const totalSeconds = Math.floor(remaining / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isRejected = profile?.approval_status === "rejected";

  const segStyle = (active: boolean, color: string) => ({
    background: active ? color : "rgba(255,255,255,.06)",
    border: `1px solid ${active ? color : "rgba(255,255,255,.1)"}`,
    borderRadius: 12,
    padding: "12px 16px",
    minWidth: 72,
    textAlign: "center" as const,
    boxShadow: active ? `0 0 24px ${color}44` : "none",
    transition: "all .3s",
  });

  return (
    <AuthPageShell>
      {/* Floating clock element */}
      <div style={{ position: "fixed", top: "20%", right: "8%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)", display: "flex", alignItems: "center", justifyContent: "center", animation: "floatA 5s ease-in-out infinite" }}>
          <Clock size={26} color="#f59e0b" />
        </div>
      </div>

      <div style={{ animation: "fadeInUp .6s ease both", position: "relative", zIndex: 1 }}>
        {/* Header icon */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: isRejected ? "rgba(239,68,68,.15)" : "rgba(245,158,11,.15)", border: `2px solid ${isRejected ? "rgba(239,68,68,.4)" : "rgba(245,158,11,.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: isRejected ? "0 0 40px rgba(239,68,68,.2)" : "0 0 40px rgba(245,158,11,.2)", animation: "pulse3d 3s ease-in-out infinite" }}>
            {isRejected ? <XCircle size={36} color="#ef4444" /> : <Clock size={36} color="#f59e0b" />}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 8, letterSpacing: "-0.5px" }}>
            {isRejected ? "Registration Rejected" : "Verification Pending"}
          </h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>
            {isRejected ? "Your registration has been reviewed by our team." : "Your account is under review by our admin team."}
          </p>
        </div>

        {/* Main glass card */}
        <div className="auth-glass-card" style={{ borderRadius: 24, padding: 32 }}>
          {isRejected ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ padding: "16px", borderRadius: 14, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", marginBottom: 20 }}>
                <p style={{ color: "#ef4444", fontWeight: 600, fontSize: 14 }}>Your registration has been rejected.</p>
                {profile?.approval_notes && (
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, marginTop: 8 }}>
                    Reason: {profile.approval_notes}
                  </p>
                )}
              </div>
              <Link to="/register/employee" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 12, background: `linear-gradient(135deg,${A1},${A2})`, color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none", boxShadow: "0 8px 24px rgba(99,102,241,.4)" }}>
                Register Again
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Countdown */}
              {remaining > 0 ? (
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Time Remaining</p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
                    {[
                      { val: hours,   label: "HRS" },
                      { val: minutes, label: "MIN" },
                      { val: seconds, label: "SEC" },
                    ].map(({ val, label }, i) => (
                      <div key={label}>
                        <div style={segStyle(true, "#f59e0b")}>
                          <p style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b", fontFamily: "monospace", lineHeight: 1 }}>
                            {String(val).padStart(2, "0")}
                          </p>
                          <p style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, marginTop: 4 }}>{label}</p>
                        </div>
                        {i < 2 && <p style={{ color: "#f59e0b", fontWeight: 900, fontSize: 22, textAlign: "center", margin: "8px 0" }}>:</p>}
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg,#f59e0b,#f97316)", width: `${progress}%`, transition: "width 1s linear", boxShadow: "0 0 12px rgba(245,158,11,.5)" }} />
                  </div>
                  <p style={{ color: "rgba(255,255,255,.35)", fontSize: 11, marginTop: 8 }}>Time remaining for approval</p>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "16px", borderRadius: 14, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)" }}>
                  <AlertTriangle size={20} color="#f59e0b" style={{ margin: "0 auto 8px" }} />
                  <p style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                    Countdown expired — approval may take a bit longer. Please be patient.
                  </p>
                </div>
              )}

              {/* Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: CheckCircle, color: "#22c55e", bg: "rgba(34,197,94,.12)", title: "Registration Submitted", desc: "Your details have been received" },
                  { icon: Clock,       color: "#f59e0b", bg: "rgba(245,158,11,.12)", title: "Admin Review In Progress", desc: "Our team is reviewing your account" },
                  { icon: CheckCircle, color: "rgba(255,255,255,.2)", bg: "rgba(255,255,255,.04)", title: "Account Activated", desc: "You'll get notified on WhatsApp & Email" },
                ].map(({ icon: Icon, color, bg, title, desc }) => (
                  <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: bg, border: `1px solid ${color}30` }}>
                    <Icon size={18} color={color} style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{title}</p>
                      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 11 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notification info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.15)" }}>
                  <MessageCircle size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ color: "rgba(255,255,255,.55)", fontSize: 12, lineHeight: 1.5 }}>
                    You will receive a <strong style={{ color: "#22c55e" }}>WhatsApp message</strong> when your account is approved.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.15)" }}>
                  <Mail size={16} color={A1} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ color: "rgba(255,255,255,.55)", fontSize: 12, lineHeight: 1.5 }}>
                    An <strong style={{ color: A1 }}>email notification</strong> will also be sent once your account is approved.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          <button onClick={signOut} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <LogOut size={14} /> Sign Out
          </button>
          <Link to="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "rgba(255,255,255,.4)", textDecoration: "none", fontSize: 13, fontWeight: 500, padding: "10px" }}
            onMouseEnter={e => (e.currentTarget.style.color = "white")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
};

export default VerificationPending;
