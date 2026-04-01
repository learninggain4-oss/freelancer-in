import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";

const BG  = "#070714";
const A1  = "#6366f1";
const A2  = "#8b5cf6";

export const AUTH_CSS = `
@keyframes orbGlow   { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.85;transform:scale(1.15)} }
@keyframes floatA    { 0%,100%{transform:translateY(0px) rotateZ(0deg)} 33%{transform:translateY(-18px) rotateZ(3deg)} 66%{transform:translateY(-8px) rotateZ(-2deg)} }
@keyframes floatB    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-22px)} }
@keyframes floatC    { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-14px) scale(1.08)} }
@keyframes fadeInUp  { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideInUp { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
@keyframes spinSlow  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes pulse3d   { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.5)} 50%{box-shadow:0 0 0 16px rgba(99,102,241,0)} }
@keyframes blink     { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes orbit     { 0%{transform:rotate(0deg) translateX(70px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(70px) rotate(-360deg)} }
.auth-glass-card { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); backdrop-filter:blur(24px); box-shadow:0 32px 80px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.1); }
.auth-input { background:rgba(255,255,255,.06) !important; border:1px solid rgba(255,255,255,.1) !important; color:white !important; height:46px; border-radius:12px !important; }
.auth-input::placeholder { color:rgba(255,255,255,.25) !important; }
.auth-input:focus { border-color:#6366f1 !important; box-shadow:0 0 0 3px rgba(99,102,241,.15) !important; }
.auth-btn-primary { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; font-weight:700; border:none; border-radius:14px; padding:14px; width:100%; font-size:15px; cursor:pointer; box-shadow:0 8px 24px rgba(99,102,241,.4); transition:all .2s; }
.auth-btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(99,102,241,.5); }
.auth-btn-primary:disabled { background:rgba(99,102,241,.3); box-shadow:none; cursor:not-allowed; transform:none; }
.auth-label { color:rgba(255,255,255,.7); font-size:13px; font-weight:600; display:block; margin-bottom:6px; }
.auth-select { background:rgba(255,255,255,.06) !important; border:1px solid rgba(255,255,255,.1) !important; color:white !important; border-radius:12px !important; }
.auth-select [data-placeholder] { color:rgba(255,255,255,.25) !important; }
`;

interface AuthPageShellProps {
  children: ReactNode;
  maxWidth?: number;
  centerContent?: boolean;
}

const AuthPageShell = ({ children, maxWidth = 480, centerContent = true }: AuthPageShellProps) => (
  <div style={{ background: BG, color: "white", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif", overflowX: "hidden" }}>
    <style>{AUTH_CSS}</style>

    {/* Ambient orbs */}
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)", animation: "orbGlow 6s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.14) 0%,transparent 70%)", animation: "orbGlow 8s ease-in-out infinite 2s" }} />
      <div style={{ position: "absolute", top: "60%", left: "30%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)", animation: "orbGlow 10s ease-in-out infinite 4s" }} />
      {/* Grid overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)", backgroundSize: "60px 60px", opacity: .6 }} />
    </div>

    {/* Navbar */}
    <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)", background: "rgba(7,7,20,.8)" }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px rgba(99,102,241,.5)` }}>
          <Briefcase size={18} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-0.5px" }}>
          Freelancer<span style={{ color: A1 }}>.</span>in
        </span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/login" style={{ color: "rgba(255,255,255,.5)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.color = "white")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.5)")}>
          Login
        </Link>
        <Link to="/register/employee" style={{ padding: "8px 20px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: `0 4px 20px rgba(99,102,241,.4)` }}>
          Register
        </Link>
      </div>
    </nav>

    {/* Content */}
    <div style={{ position: "relative", zIndex: 1, ...(centerContent ? { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 69px)", padding: "40px 20px" } : { padding: "0 0 60px" }) }}>
      <div style={{ width: "100%", maxWidth: centerContent ? maxWidth : "100%" }}>
        {children}
      </div>
    </div>
  </div>
);

export default AuthPageShell;
export { A1, A2, BG };
