import { useEffect, useState } from "react";
import { Clock, Mail, ArrowLeft, LogOut, MessageCircle, CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const progress = totalMs > 0 ? Math.min(100, ((totalMs - remaining) / totalMs) * 100) : 100;
  const totalSeconds = Math.floor(remaining / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isRejected = profile?.approval_status === "rejected";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0e1a 0%, #0f1629 40%, #0d1220 100%)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "40px 16px 60px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      overflowY: "auto",
    }}>
      {/* Background glow effects */}
      <div style={{ position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "20%", right: "5%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Floating clock decoration */}
      <div style={{ position: "fixed", top: "18%", right: "6%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(245,158,11,0.15)",
          border: "1px solid rgba(245,158,11,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "float 6s ease-in-out infinite",
          boxShadow: "0 0 20px rgba(245,158,11,0.1)",
        }}>
          <Clock size={22} color="#f59e0b" />
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.3)} 50%{box-shadow:0 0 0 12px rgba(245,158,11,0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .vp-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; backdrop-filter: blur(12px); }
        .vp-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "fadeUp .5s ease both" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 84, height: 84, borderRadius: 26, margin: "0 auto 20px",
            background: isRejected ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
            border: `2px solid ${isRejected ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.4)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isRejected ? "0 0 40px rgba(239,68,68,0.2)" : "0 0 40px rgba(245,158,11,0.2)",
            animation: "pulse 3s ease-in-out infinite",
          }}>
            {isRejected ? <XCircle size={38} color="#ef4444" /> : <Clock size={38} color="#f59e0b" />}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#ffffff", margin: "0 0 8px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            {isRejected ? "Registration Rejected" : "Verification Pending"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            {isRejected ? "Your registration has been reviewed by our team." : "Your account is under review by our admin team."}
          </p>
        </div>

        {/* Main card */}
        <div className="vp-card" style={{ padding: "28px 24px", marginBottom: 12 }}>
          {isRejected ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ padding: "18px", borderRadius: 14, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 20 }}>
                <XCircle size={28} color="#ef4444" style={{ margin: "0 auto 10px", display: "block" }} />
                <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>Registration Rejected</p>
                {profile?.approval_notes && (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                    Reason: {profile.approval_notes}
                  </p>
                )}
              </div>
              <Link to="/register/freelancer" style={{
                display: "inline-block", padding: "13px 32px", borderRadius: 14,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none",
                boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
              }}>
                Register Again
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

              {/* Countdown Timer */}
              <div>
                <p style={{
                  color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700,
                  letterSpacing: 3, textTransform: "uppercase", textAlign: "center",
                  margin: "0 0 16px",
                }}>Time Remaining</p>

                {remaining > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 }}>
                    {[
                      { val: hours,   label: "HRS" },
                      { val: minutes, label: "MIN" },
                      { val: seconds, label: "SEC" },
                    ].map(({ val, label }, i) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          background: "linear-gradient(135deg, #f59e0b, #f97316)",
                          borderRadius: 14,
                          padding: "14px 0",
                          width: 78,
                          textAlign: "center",
                          boxShadow: "0 4px 20px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                          position: "relative",
                          overflow: "hidden",
                        }}>
                          {/* shimmer overlay */}
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.1) 50%,transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 2s infinite" }} />
                          <p style={{
                            fontSize: 32, fontWeight: 900, color: "#ffffff",
                            fontVariantNumeric: "tabular-nums",
                            fontFamily: "'Inter', monospace",
                            lineHeight: 1, margin: 0, letterSpacing: "-1px",
                            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            position: "relative",
                          }}>
                            {String(val).padStart(2, "0")}
                          </p>
                          <p style={{
                            color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700,
                            letterSpacing: 1.5, margin: "4px 0 0", position: "relative",
                          }}>{label}</p>
                        </div>
                        {i < 2 && (
                          <p style={{ color: "#f59e0b", fontWeight: 900, fontSize: 26, lineHeight: 1, margin: 0, textShadow: "0 0 12px rgba(245,158,11,0.5)" }}>:</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", textAlign: "center", marginBottom: 18 }}>
                    <AlertTriangle size={18} color="#f59e0b" style={{ display: "block", margin: "0 auto 6px" }} />
                    <p style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600, margin: 0 }}>
                      Countdown ended — approval may take a little longer. Please be patient.
                    </p>
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 6,
                    background: "linear-gradient(90deg, #f59e0b, #f97316)",
                    width: `${progress}%`,
                    transition: "width 1s linear",
                    boxShadow: "0 0 10px rgba(245,158,11,0.5)",
                  }} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", margin: "7px 0 0" }}>
                  Time remaining for approval
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Status Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    icon: CheckCircle, color: "#22c55e",
                    bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)",
                    title: "Registration Submitted",
                    desc: "Your details have been received",
                    active: true,
                  },
                  {
                    icon: Clock, color: "#f59e0b",
                    bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)",
                    title: "Admin Review In Progress",
                    desc: "Our team is reviewing your account",
                    active: true,
                  },
                  {
                    icon: Shield, color: "rgba(255,255,255,0.2)",
                    bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)",
                    title: "Account Activated",
                    desc: "You'll get notified on WhatsApp & Email",
                    active: false,
                  },
                ].map(({ icon: Icon, color, bg, border, title, desc, active }) => (
                  <div key={title} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "13px 14px", borderRadius: 14,
                    background: bg, border: `1px solid ${border}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: active ? `${color}20` : "rgba(255,255,255,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} color={color} />
                    </div>
                    <div>
                      <p style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: 13, margin: "0 0 2px" }}>{title}</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Notification info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <MessageCircle size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                    You will receive a <strong style={{ color: "#22c55e" }}>WhatsApp message</strong> when your account is approved.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <Mail size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                    An <strong style={{ color: "#818cf8" }}>email notification</strong> will also be sent once your account is approved.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={signOut}
            className="vp-btn"
            style={{
              width: "100%", padding: "13px", borderRadius: 14, cursor: "pointer",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5", fontWeight: 600, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "all 0.2s",
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
          <Link
            to="/"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              color: "rgba(255,255,255,0.35)", textDecoration: "none",
              fontSize: 13, fontWeight: 500, padding: "10px",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VerificationPending;
