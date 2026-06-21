import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";
import AuthPageShell, { A1, A2 } from "@/components/layout/AuthPageShell";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AuthPageShell>
      {/* Floating elements */}
      <div style={{ position: "fixed", top: "20%", right: "8%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", display: "flex", alignItems: "center", justifyContent: "center", animation: "floatA 5s ease-in-out infinite" }}>
          <AlertTriangle size={22} color="#ef4444" />
        </div>
      </div>
      <div style={{ position: "fixed", bottom: "25%", left: "6%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", display: "flex", alignItems: "center", justifyContent: "center", animation: "floatB 6s ease-in-out infinite .5s" }}>
          <Search size={20} color={A1} />
        </div>
      </div>

      <div style={{ animation: "fadeInUp .6s ease both", position: "relative", zIndex: 1, textAlign: "center" }}>
        {/* Glowing 404 */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <div style={{ fontSize: "clamp(100px,18vw,160px)", fontWeight: 900, lineHeight: 1, background: `linear-gradient(135deg,${A1},${A2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-8px", filter: "drop-shadow(0 0 40px rgba(99,102,241,.4))" }}>
            404
          </div>
          {/* Orbiting ring */}
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 200, height: 200, borderRadius: "50%", border: "1px dashed rgba(99,102,241,.2)", transform: "translate(-50%,-50%)", animation: "spinSlow 20s linear infinite", pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: -6, left: "50%", width: 12, height: 12, borderRadius: "50%", background: A1, boxShadow: `0 0 12px ${A1}`, transform: "translateX(-50%)" }} />
          </div>
        </div>

        {/* Glass card */}
        <div className="auth-glass-card" style={{ borderRadius: 24, padding: "40px 32px", maxWidth: 440, margin: "0 auto" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <AlertTriangle size={28} color="#ef4444" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 10, letterSpacing: "-0.5px" }}>
            Page Not Found
          </h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <code style={{ display: "inline-block", color: "rgba(239,68,68,.8)", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 8, padding: "4px 12px", fontSize: 12, marginBottom: 28 }}>
            {location.pathname}
          </code>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 8px 24px rgba(99,102,241,.4)" }}>
              <Home size={16} /> Go to Home
            </Link>
            <Link to="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 14, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.7)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "white")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.7)")}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>

        <p style={{ marginTop: 24, color: "rgba(255,255,255,.2)", fontSize: 12 }}>
          If you believe this is a mistake, please{" "}
          <a href="mailto:support@freelancer.in" style={{ color: A1, textDecoration: "none" }}>contact support</a>
        </p>
      </div>
    </AuthPageShell>
  );
};

export default NotFound;
