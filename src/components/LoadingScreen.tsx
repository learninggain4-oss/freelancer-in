import { useEffect, useState } from "react";

const KEYFRAMES = `
@keyframes fi-spin-slow  { to { transform: rotate(360deg); } }
@keyframes fi-spin-rev   { to { transform: rotate(-360deg); } }
@keyframes fi-spin-med   { to { transform: rotate(360deg); } }
@keyframes fi-pulse-glow {
  0%,100% { box-shadow: 0 0 32px 8px rgba(99,102,241,.55), 0 0 80px 20px rgba(139,92,246,.25); opacity:.9; transform:scale(1); }
  50%      { box-shadow: 0 0 56px 18px rgba(99,102,241,.85), 0 0 120px 40px rgba(139,92,246,.45); opacity:1; transform:scale(1.06); }
}
@keyframes fi-float-a {
  0%,100% { transform:translate(0,0) scale(1); opacity:.7; }
  33%      { transform:translate(22px,-18px) scale(1.12); opacity:1; }
  66%      { transform:translate(-14px,12px) scale(.9); opacity:.5; }
}
@keyframes fi-float-b {
  0%,100% { transform:translate(0,0) scale(1); opacity:.5; }
  40%      { transform:translate(-20px,16px) scale(1.08); opacity:.9; }
  70%      { transform:translate(12px,-22px) scale(.85); opacity:.6; }
}
@keyframes fi-float-c {
  0%,100% { transform:translate(0,0); opacity:.4; }
  50%      { transform:translate(18px,20px); opacity:.8; }
}
@keyframes fi-bar {
  0%   { width:0%;   opacity:.5; }
  20%  { width:28%;  opacity:1; }
  50%  { width:62%;  opacity:1; }
  80%  { width:88%;  opacity:1; }
  100% { width:100%; opacity:.7; }
}
@keyframes fi-bar-glow {
  0%,100% { opacity:.4; }
  50%      { opacity:1; }
}
@keyframes fi-title {
  0%   { opacity:0; letter-spacing:.35em; transform:translateY(14px); }
  100% { opacity:1; letter-spacing:.12em; transform:translateY(0); }
}
@keyframes fi-sub {
  0%   { opacity:0; transform:translateY(8px); }
  100% { opacity:1; transform:translateY(0); }
}
@keyframes fi-dot {
  0%,80%,100% { transform:scale(0); opacity:0; }
  40%          { transform:scale(1); opacity:1; }
}
@keyframes fi-particle {
  0%   { transform:translate(0,0) scale(1); opacity:.8; }
  100% { transform:translate(var(--px),var(--py)) scale(0); opacity:0; }
}
@keyframes fi-ring-pulse {
  0%,100% { opacity:.18; }
  50%      { opacity:.45; }
}
@keyframes fi-bg-orb {
  0%,100% { transform:translate(0,0) scale(1); }
  33%      { transform:translate(40px,-30px) scale(1.15); }
  66%      { transform:translate(-25px,20px) scale(.9); }
}
@keyframes fi-logo-reveal {
  0%   { opacity:0; transform:scale(.7) rotate(-10deg); }
  60%  { transform:scale(1.08) rotate(2deg); }
  100% { opacity:1; transform:scale(1) rotate(0deg); }
}
`;

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.cos((i / 18) * Math.PI * 2) * (80 + Math.random() * 60),
  y: Math.sin((i / 18) * Math.PI * 2) * (80 + Math.random() * 60),
  size: 2 + Math.random() * 4,
  delay: (i / 18) * 2.4,
  dur: 2.2 + Math.random() * 1.8,
  color: i % 3 === 0 ? "#6366f1" : i % 3 === 1 ? "#8b5cf6" : "#a78bfa",
}));

const MESSAGES = ["Initializing platform…", "Connecting to servers…", "Loading your workspace…", "Almost ready…"];

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [barPct, setBarPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // inject keyframes once
    if (!document.getElementById("fi-kf")) {
      const s = document.createElement("style");
      s.id = "fi-kf";
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
    setTimeout(() => setVisible(true), 30);

    const targets = [18, 42, 68, 88, 100];
    let ti = 0;
    const advance = () => {
      if (ti < targets.length) { setBarPct(targets[ti]); ti++; }
    };
    const intervals = [300, 700, 600, 700, 600].map((d, i) =>
      setTimeout(advance, d + [0,300,1000,1600,2300][i])
    );
    const msgT = [900, 1800, 2700].map((d, i) =>
      setTimeout(() => setMsgIdx(i + 1), d)
    );
    return () => { [...intervals, ...msgT].forEach(clearTimeout); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#070714",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      opacity: visible ? 1 : 0,
      transition: "opacity .35s ease",
    }}>

      {/* ── Background orbs ── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[
          { w:520, h:520, t:"5%",  l:"-10%", c:"rgba(99,102,241,.12)",  d:"0s",  dur:"12s" },
          { w:400, h:400, t:"55%", l:"60%",  c:"rgba(139,92,246,.1)",   d:"4s",  dur:"15s" },
          { w:300, h:300, t:"20%", l:"70%",  c:"rgba(99,102,241,.07)",  d:"2s",  dur:"10s" },
          { w:350, h:350, t:"70%", l:"5%",   c:"rgba(168,139,250,.08)", d:"6s",  dur:"13s" },
        ].map((o, i) => (
          <div key={i} style={{
            position: "absolute", top: o.t, left: o.l,
            width: o.w, height: o.h, borderRadius: "50%",
            background: `radial-gradient(circle, ${o.c}, transparent 70%)`,
            animation: `fi-bg-orb ${o.dur} ${o.d} ease-in-out infinite`,
            filter: "blur(40px)",
          }} />
        ))}
      </div>

      {/* ── Grid dots ── */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(99,102,241,.07) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* ── Main stage ── */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

        {/* Orbital rings */}
        <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>

          {/* Ring 1 — outer slow */}
          <div style={{
            position: "absolute", width: 190, height: 190, borderRadius: "50%",
            border: "1.5px solid transparent",
            backgroundImage: "linear-gradient(135deg,rgba(99,102,241,.6),rgba(139,92,246,.15),rgba(99,102,241,.05),rgba(139,92,246,.5))",
            backgroundOrigin: "border-box",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            animation: "fi-spin-slow 7s linear infinite, fi-ring-pulse 3s ease-in-out infinite",
          }} />

          {/* Ring 2 — mid reverse */}
          <div style={{
            position: "absolute", width: 152, height: 152, borderRadius: "50%",
            border: "1.5px dashed rgba(139,92,246,.4)",
            animation: "fi-spin-rev 5s linear infinite",
            opacity: .7,
          }} />

          {/* Ring 3 — inner fast */}
          <div style={{
            position: "absolute", width: 116, height: 116, borderRadius: "50%",
            border: "2px solid transparent",
            backgroundImage: "linear-gradient(90deg,rgba(168,139,250,.8),rgba(99,102,241,.1),rgba(168,139,250,.7))",
            backgroundOrigin: "border-box",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            animation: "fi-spin-med 3s linear infinite",
          }} />

          {/* Orbital dot on ring 1 */}
          <div style={{
            position: "absolute", width: 190, height: 190, borderRadius: "50%",
            animation: "fi-spin-slow 7s linear infinite",
          }}>
            <div style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", width: 10, height: 10, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 12px 4px rgba(99,102,241,.8)" }} />
          </div>

          {/* Orbital dot on ring 3 */}
          <div style={{
            position: "absolute", width: 116, height: 116, borderRadius: "50%",
            animation: "fi-spin-med 3s linear infinite",
          }}>
            <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 10px 3px rgba(167,139,250,.8)" }} />
          </div>

          {/* Particles */}
          {particles.map(p => (
            <div key={p.id} style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: p.size, height: p.size, borderRadius: "50%",
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              "--px": `${p.x}px`, "--py": `${p.y}px`,
              animation: `fi-particle ${p.dur}s ${p.d}s ease-out infinite`,
              opacity: 0,
            } as React.CSSProperties} />
          ))}

          {/* Center logo */}
          <div style={{
            position: "relative", width: 80, height: 80, borderRadius: 22,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fi-pulse-glow 2.5s ease-in-out infinite, fi-logo-reveal .8s cubic-bezier(.34,1.56,.64,1) forwards",
            zIndex: 2,
          }}>
            {/* FI Monogram */}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <text x="4" y="34" fontFamily="system-ui,sans-serif" fontWeight="800" fontSize="28" fill="white" letterSpacing="-1">fi</text>
              <circle cx="36" cy="10" r="5" fill="rgba(255,255,255,.6)" />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <div style={{
          animation: "fi-title .7s .4s cubic-bezier(.23,1,.32,1) both",
          textAlign: "center", marginBottom: 6,
        }}>
          <h1 style={{
            margin: 0,
            fontSize: "clamp(22px,4vw,30px)",
            fontWeight: 800,
            background: "linear-gradient(135deg,#e0e7ff,#a5b4fc,#c4b5fd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}>Freelancer<span style={{ fontWeight: 300 }}>.in</span></h1>
        </div>

        {/* Tagline */}
        <div style={{ animation: "fi-sub .6s .7s ease both", marginBottom: 36, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(148,163,184,.7)", letterSpacing: ".18em", textTransform: "uppercase" }}>Premium Freelance Platform</p>
        </div>

        {/* Progress bar */}
        <div style={{ width: "min(320px,80vw)", marginBottom: 16 }}>
          <div style={{ height: 3, borderRadius: 8, background: "rgba(255,255,255,.07)", overflow: "hidden", position: "relative" }}>
            <div style={{
              height: "100%", borderRadius: 8,
              background: "linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)",
              width: `${barPct}%`,
              transition: "width .6s cubic-bezier(.23,1,.32,1)",
              boxShadow: "0 0 10px rgba(99,102,241,.8)",
              animation: "fi-bar-glow 1.2s ease-in-out infinite",
            }} />
          </div>
        </div>

        {/* Status message + dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 20 }}>
          <span style={{
            fontSize: 12, color: "rgba(148,163,184,.75)",
            transition: "opacity .4s ease",
            letterSpacing: ".04em",
          }}>{MESSAGES[msgIdx]}</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 4, height: 4, borderRadius: "50%",
                background: "#6366f1",
                animation: `fi-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div style={{
        position: "absolute", bottom: 28,
        animation: "fi-sub .6s 1.2s ease both", opacity: 0,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,.8)", animation: "fi-pulse-glow 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 11, color: "rgba(148,163,184,.45)", letterSpacing: ".1em" }}>SECURE CONNECTION</span>
      </div>
    </div>
  );
}
