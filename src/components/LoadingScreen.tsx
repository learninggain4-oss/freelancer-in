import React, { useEffect, useState } from "react";

const KEYFRAMES = `
@keyframes fi-spin-slow  { to { transform: rotate(360deg); } }
@keyframes fi-spin-rev   { to { transform: rotate(-360deg); } }
@keyframes fi-spin-med   { to { transform: rotate(360deg); } }
@keyframes fi-pulse-glow {
  0%,100% { box-shadow: 0 0 32px 8px rgba(99,102,241,.55), 0 0 80px 20px rgba(139,92,246,.25); opacity:.9; transform:scale(1); }
  50%      { box-shadow: 0 0 56px 18px rgba(99,102,241,.85), 0 0 120px 40px rgba(139,92,246,.45); opacity:1; transform:scale(1.06); }
}
@keyframes fi-float-a {
  0%,10%,100% { transform:translate(0,0) scale(1); opacity:.7; }
  33%      { transform:translate(22px,-18px) scale(1.12); opacity:1; }
  66%      { transform:translate(-14px,12px) scale(.9); opacity:.5; }
}
@keyframes fi-float-b {
  0%, 10%,100%  { transform:translate(0,0) scale(1); opacity:.5; }
  40%      { transform:translate(-20px,16px) scale(1.08); opacity:.9; }
  70%      { transform:translate(12px,-22px) scale(.85); opacity:.6; }
}
@keyframes fi-float-c {
  0%,100% { transform:translate(0,0); opacity:.4; }
  50%      { transform:translate(18px,20px); opacity:.8; }
}
@keyframes fi-bar {
  0%   { width:0%;   opacity:.5; }
  10%   { width:18%;   opacity:.5; }
  20%  { width:28%;  opacity:1; }
  30%  { width:38%;  opacity:1; }
  40%  { width:48%;  opacity:1; }
  50%  { width:62%;  opacity:1; }
  60%  { width:72%;  opacity:1; }
  70%  { width:78%;  opacity:1; }
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
      if (ti < targets.length) {
        setBarPct(targets[ti]);
        ti++;
      }
    };
    const intervals = [300, 700, 600, 700, 600].map((d, i) => setTimeout(advance, d + [0, 300, 1000, 1600, 2300][i]));
    const msgT = [900, 1800, 2700].map((d, i) => setTimeout(() => setMsgIdx(i + 1), d));
    return () => {
      [...intervals, ...msgT].forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transition: "opacity .5s ease-in-out",
      }}
    >
      {/* ── Enhanced Background Glow ── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* ── Main Stage with subtle Glassmorphism ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "50px 40px",
          borderRadius: "32px",
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          animation: "fi-sub 0.8s ease-out forwards",
        }}
      >
        {/* Orbitals, Particles & Logo */}
        <div
          style={{
            position: "relative",
            width: 140,
            height: 140,
            marginBottom: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Animated Orbital Rings */}
          <div
            style={{
              position: "absolute",
              inset: "-30px",
              border: "2px dashed rgba(99,102,241,0.2)",
              borderRadius: "50%",
              animation: "fi-spin-slow 12s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "-50px",
              border: "1px solid rgba(139,92,246,0.15)",
              borderRadius: "50%",
              animation: "fi-spin-rev 16s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "-15px",
              border: "2px solid transparent",
              borderTopColor: "rgba(99,102,241,0.5)",
              borderRightColor: "rgba(99,102,241,0.5)",
              borderRadius: "50%",
              animation: "fi-spin-med 4s linear infinite",
            }}
          />

          {/* Floating Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: p.size,
                height: p.size,
                background: p.color,
                borderRadius: "50%",
                boxShadow: `0 0 8px ${p.color}`,
                ["--px" as never]: `${p.x}px`,
                ["--py" as never]: `${p.y}px`,
                animation: `fi-particle ${p.dur}s ease-out infinite`,
                animationDelay: `${p.delay}s`,
                opacity: 0,
              } as React.CSSProperties}
            />
          ))}

          {/* Center Logo */}
          <div
            style={{
              position: "absolute",
              inset: "0",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(99,102,241,0.4)",
              animation: "fi-pulse-glow 3s ease-in-out infinite",
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: "40px",
                fontWeight: "900",
                letterSpacing: "-0.05em",
                animation: "fi-logo-reveal 1s ease-out",
              }}
            >
              fi
            </span>
          </div>
        </div>

        {/* Modern Text Treatment */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 16,
            animation: "fi-title 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "2.5rem",
              fontWeight: 800,
              letterSpacing: "-0.05em",
              color: "#ffffff",
            }}
          >
            Freelancer<span style={{ color: "#818cf8" }}>.in</span>
          </h1>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#94a3b8",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginTop: "8px",
            }}
          >
            Engineered for Excellence
          </p>
        </div>

        {/* Progress Bar & Status Messages */}
        <div style={{ width: "280px", marginTop: "20px" }}>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${barPct}%`,
                background: "linear-gradient(90deg, #6366f1, #c084fc)",
                transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
              fontSize: "0.8rem",
            }}
          >
            <span key={msgIdx} style={{ color: "#94a3b8", animation: "fi-sub 0.3s ease-in-out forwards" }}>
              {MESSAGES[msgIdx]}
            </span>
            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{barPct}%</span>
          </div>
        </div>
      </div>

      {/* Footer - Professional subtle status */}
      <div style={{ position: "absolute", bottom: "40px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 10px rgba(34, 197, 94, 0.6)",
          }}
        />
        <span style={{ fontSize: "0.75rem", color: "#64748b", letterSpacing: "0.1em", fontWeight: 500 }}>
          SYSTEM OPTIMIZED
        </span>
      </div>
    </div>
  );
}
