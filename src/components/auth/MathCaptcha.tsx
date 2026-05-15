import { useRef, useEffect } from "react";
import { RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";

interface MathCaptchaProps {
  a: number;
  b: number;
  answer: string;
  verified: boolean;
  onAnswerChange: (v: string) => void;
  onVerify: () => void;
  onRefresh: () => void;
}

const NOISE_CSS = `
@keyframes captcha-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
@keyframes captcha-pop   { 0%{transform:scale(.85);opacity:0} 60%{transform:scale(1.07)} 100%{transform:scale(1);opacity:1} }
@keyframes captcha-tick  { from{stroke-dashoffset:40} to{stroke-dashoffset:0} }
.captcha-shake { animation: captcha-shake .4s ease; }
.captcha-pop   { animation: captcha-pop .35s cubic-bezier(.23,1.08,.32,1) both; }
`;

function NumTile({ n, hue }: { n: number; hue: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, `hsla(${hue},70%,55%,.18)`);
    grad.addColorStop(1, `hsla(${hue + 30},65%,45%,.22)`);
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, W, H, 10);
    ctx.fill();

    ctx.strokeStyle = `hsla(${hue},80%,70%,.3)`;
    ctx.lineWidth = 1;
    for (let i = -H; i < W + H; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
    }
    for (let j = 0; j < 18; j++) {
      const x = Math.random() * W, y = Math.random() * H;
      const len = 10 + Math.random() * 20;
      const angle = Math.random() * Math.PI;
      ctx.strokeStyle = `hsla(${hue},90%,75%,.25)`;
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }
    for (let d = 0; d < 40; d++) {
      ctx.fillStyle = `hsla(${hue},80%,85%,.15)`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const fontSize = 36;
    ctx.font = `800 ${fontSize}px "Inter",system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((Math.random() - 0.5) * 0.18);
    ctx.fillStyle = `hsla(${hue},90%,90%,.95)`;
    ctx.shadowColor = `hsla(${hue},100%,70%,.6)`;
    ctx.shadowBlur = 8;
    ctx.fillText(String(n), 0, 0);
    ctx.restore();
  }, [n, hue]);

  return (
    <canvas ref={canvasRef} width={64} height={52}
      style={{ borderRadius: 10, display: "block",
        border: `1px solid hsla(${hue},80%,70%,.25)`,
        boxShadow: `0 0 12px hsla(${hue},80%,55%,.2), inset 0 1px 0 rgba(255,255,255,.07)` }} />
  );
}

export default function MathCaptcha({ a, b, answer, verified, onAnswerChange, onVerify, onRefresh }: MathCaptchaProps) {
  return (
    <>
      <style>{NOISE_CSS}</style>
      <div style={{
        borderRadius: 14,
        border: verified ? "1px solid rgba(34,197,94,.35)" : "1px solid rgba(99,102,241,.25)",
        background: verified ? "rgba(34,197,94,.06)" : "rgba(99,102,241,.06)",
        padding: "16px 18px",
        transition: "border-color .3s, background .3s",
      }}>
        {/* Header label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            color: verified ? "rgba(34,197,94,.8)" : "rgba(99,102,241,.8)" }}>
            {verified ? "✓ Human Verified" : "Prove you're human"}
          </span>
          <button type="button" onClick={onRefresh} aria-label="New captcha"
            style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 7, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 5, color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 600, transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.5)"; e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}>
            <RefreshCw size={10} /> New
          </button>
        </div>

        {verified ? (
          /* ── Verified state ── */
          <div className="captcha-pop" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "8px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="#22c55e" />
            </div>
            <div>
              <p style={{ color: "#22c55e", fontSize: 13, fontWeight: 700, margin: 0 }}>Verification complete</p>
              <p style={{ color: "rgba(34,197,94,.6)", fontSize: 11, margin: 0 }}>You may now sign in</p>
            </div>
          </div>
        ) : (
          /* ── Challenge state ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Equation row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <NumTile n={a} hue={250} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,.6)", lineHeight: 1 }}>+</span>
              </div>
              <NumTile n={b} hue={280} />
              <span style={{ fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,.4)" }}>=</span>
              <input
                type="number"
                value={answer}
                onChange={e => onAnswerChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (answer) onVerify(); } }}
                placeholder="?"
                style={{
                  width: 64, height: 52, textAlign: "center",
                  background: "rgba(255,255,255,.07)",
                  border: answer ? "1px solid rgba(99,102,241,.6)" : "1px solid rgba(255,255,255,.12)",
                  borderRadius: 10, color: "white", fontSize: 22, fontWeight: 800,
                  outline: "none", boxShadow: answer ? "0 0 0 3px rgba(99,102,241,.15)" : "none",
                  transition: "border-color .2s, box-shadow .2s",
                  MozAppearance: "textfield",
                }}
              />
            </div>

            {/* Verify button */}
            <button type="button" onClick={onVerify} disabled={!answer}
              style={{
                width: "100%", padding: "9px", borderRadius: 10, border: "none",
                background: answer ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,.15)",
                color: answer ? "white" : "rgba(255,255,255,.3)",
                fontSize: 12, fontWeight: 700, cursor: answer ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: answer ? "0 4px 16px rgba(99,102,241,.35)" : "none",
                transition: "all .2s",
              }}>
              <ShieldAlert size={13} />
              Verify CAPTCHA
            </button>
          </div>
        )}
      </div>
    </>
  );
}
