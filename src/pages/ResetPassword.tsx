import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, Check, X, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthPageShell, { A1, A2 } from "@/components/layout/AuthPageShell";

const getPasswordStrength = (pw: string) => {
  const checks = [
    { label: "At least 8 characters", met: pw.length >= 8 },
    { label: "Uppercase letter",      met: /[A-Z]/.test(pw) },
    { label: "Lowercase letter",      met: /[a-z]/.test(pw) },
    { label: "Number",                met: /[0-9]/.test(pw) },
    { label: "Special character",     met: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter(c => c.met).length;
  const level = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const color = score <= 1 ? "#ef4444" : score <= 3 ? "#f59e0b" : score === 4 ? A1 : "#22c55e";
  return { checks, score, level, color, percent: (score / checks.length) * 100 };
};

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return; }
    if (password !== confirmPassword) { toast({ title: "Passwords do not match", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: "Password updated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      {/* Floating decorative */}
      <div style={{ position: "fixed", top: "25%", right: "7%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", display: "flex", alignItems: "center", justifyContent: "center", animation: "floatA 5s ease-in-out infinite" }}>
          <Lock size={22} color={A1} />
        </div>
      </div>
      <div style={{ position: "fixed", bottom: "25%", left: "5%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.25)", display: "flex", alignItems: "center", justifyContent: "center", animation: "floatB 6s ease-in-out infinite .5s" }}>
          <ShieldCheck size={20} color="#22c55e" />
        </div>
      </div>

      <div style={{ animation: "fadeInUp .6s ease both", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: `0 16px 40px rgba(99,102,241,.4)` }}>
            <Lock size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 8, letterSpacing: "-0.5px" }}>Create New Password</h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>Enter your new secure password below</p>
        </div>

        {/* Glass card */}
        <div className="auth-glass-card" style={{ borderRadius: 24, padding: 32 }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,.15)", border: "2px solid rgba(34,197,94,.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 32px rgba(34,197,94,.2)" }}>
                <CheckCircle size={36} color="#22c55e" />
              </div>
              <h2 style={{ color: "white", fontWeight: 700, fontSize: 22, marginBottom: 10 }}>Password Updated! 🎉</h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, marginBottom: 28 }}>
                You can now sign in with your new password.
              </p>
              <button onClick={() => navigate("/login")} className="auth-btn-primary">
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* New Password */}
              <div>
                <label className="auth-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                  <input type={showPw ? "text" : "password"} className="auth-input" placeholder="At least 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ width: "100%", paddingLeft: 40, paddingRight: 44, boxSizing: "border-box", outline: "none" }} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer" }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength meter */}
                {password && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Strength</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: strength.color }}>{strength.level}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: strength.color, width: `${strength.percent}%`, transition: "width .3s ease" }} />
                    </div>
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                      {strength.checks.map(c => (
                        <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {c.met
                            ? <Check size={12} color="#22c55e" />
                            : <X size={12} color="rgba(255,255,255,.3)" />}
                          <span style={{ fontSize: 12, color: c.met ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.35)" }}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="auth-label">Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                  <input type={showConfirm ? "text" : "password"} className="auth-input" placeholder="Confirm your password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    style={{ width: "100%", paddingLeft: 40, paddingRight: 44, boxSizing: "border-box", outline: "none" }} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer" }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p style={{ color: "#22c55e", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} /> Passwords match
                  </p>
                )}
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AuthPageShell>
  );
};

export default ResetPassword;
