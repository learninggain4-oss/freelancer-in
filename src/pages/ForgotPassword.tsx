import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, Mail, Send, RefreshCw, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthPageShell, { A1, A2 } from "@/components/layout/AuthPageShell";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast({ title: "Please enter your email", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Reset link sent!", description: "Check your email inbox." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      {/* Floating decorative elements */}
      <div style={{ position: "fixed", top: "20%", right: "8%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", display: "flex", alignItems: "center", justifyContent: "center", animation: "floatA 4s ease-in-out infinite" }}>
          <Mail size={24} color={A1} />
        </div>
      </div>
      <div style={{ position: "fixed", bottom: "30%", left: "6%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", display: "flex", alignItems: "center", justifyContent: "center", animation: "floatB 5s ease-in-out infinite 1s" }}>
          <ShieldCheck size={20} color={A2} />
        </div>
      </div>

      <div style={{ animation: "fadeInUp .6s ease both", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: `0 16px 40px rgba(99,102,241,.4)`, animation: "pulse3d 3s ease-in-out infinite" }}>
            <Mail size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 8, letterSpacing: "-0.5px" }}>Reset Password</h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.6 }}>
            Enter your email and we'll send you a secure link to create a new password
          </p>
        </div>

        {/* Glass Card */}
        <div className="auth-glass-card" style={{ borderRadius: 24, padding: "32px" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              {/* Success animation */}
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,.15)", border: "2px solid rgba(34,197,94,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Send size={32} color="#22c55e" />
              </div>
              <h2 style={{ color: "white", fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Check your inbox</h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
                We've sent a password reset link to
              </p>
              <p style={{ color: A1, fontWeight: 700, fontSize: 15, marginBottom: 28 }}>{email}</p>
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", marginBottom: 24 }}>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>
                  💡 Didn't receive it? Check your spam folder or try again below.
                </p>
              </div>
              <button onClick={() => setSent(false)} style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 auto", color: A1, background: "none", border: `1px solid rgba(99,102,241,.4)`, borderRadius: 12, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                <RefreshCw size={14} /> Send again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label className="auth-label">Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: "100%", paddingLeft: 40, paddingRight: 16, boxSizing: "border-box", outline: "none", transition: "all .2s" }}
                  />
                </div>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        <Link to="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, color: "rgba(255,255,255,.4)", textDecoration: "none", fontSize: 13, fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.color = "white")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}>
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </AuthPageShell>
  );
};

export default ForgotPassword;
