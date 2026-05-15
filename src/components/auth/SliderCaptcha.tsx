import { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, ShieldCheck, ChevronRight } from "lucide-react";

interface SliderCaptchaProps {
  onVerified: (v: boolean) => void;
  resetKey?: number;
}

const TRACK_H = 52;
const THUMB_W = 56;
const TARGET_W = 60;
const TOLERANCE = TARGET_W / 2;

function randomTarget() {
  return 28 + Math.floor(Math.random() * 42);
}

const CSS = `
@keyframes sc-shake { 0%,100%{transform:translateX(0)} 18%{transform:translateX(-8px)} 36%{transform:translateX(8px)} 54%{transform:translateX(-6px)} 72%{transform:translateX(6px)} 90%{transform:translateX(-3px)} }
@keyframes sc-pop   { 0%{transform:scale(.88);opacity:0} 60%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
@keyframes sc-glow  { 0%,100%{opacity:.55} 50%{opacity:1} }
@keyframes sc-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.5)} 50%{box-shadow:0 0 0 8px rgba(99,102,241,0)} }
@keyframes sc-fill  { from{width:0%} }
.sc-shake { animation: sc-shake .45s ease; }
.sc-pop   { animation: sc-pop .4s cubic-bezier(.23,1.08,.32,1) both; }
`;

export default function SliderCaptcha({ onVerified, resetKey = 0 }: SliderCaptchaProps) {
  const [targetPct, setTargetPct] = useState(randomTarget);
  const [thumbPct, setThumbPct] = useState(0);
  const [verified, setVerified] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [dragging, setDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startPct = useRef(0);

  const reset = useCallback(() => {
    setTargetPct(randomTarget());
    setThumbPct(0);
    setVerified(false);
    setShaking(false);
    setDragging(false);
    onVerified(false);
  }, [onVerified]);

  useEffect(() => { reset(); }, [resetKey]);

  const pctFromEvent = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const maxPx = rect.width - THUMB_W;
    const px = Math.min(Math.max(clientX - rect.left - THUMB_W / 2, 0), maxPx);
    return (px / maxPx) * 100;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (verified) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startPct.current = thumbPct;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || verified) return;
    setThumbPct(pctFromEvent(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging || verified) return;
    setDragging(false);
    const finalPct = pctFromEvent(e.clientX);
    setThumbPct(finalPct);

    const track = trackRef.current;
    if (!track) return;
    const maxPx = track.getBoundingClientRect().width - THUMB_W;
    const thumbCenterPx = (finalPct / 100) * maxPx + THUMB_W / 2;
    const targetCenterPx = (targetPct / 100) * maxPx + TARGET_W / 2;

    if (Math.abs(thumbCenterPx - targetCenterPx) <= TOLERANCE) {
      setVerified(true);
      onVerified(true);
    } else {
      setShaking(true);
      setTimeout(() => { setThumbPct(0); setShaking(false); }, 500);
    }
  };

  const fillPct = Math.min(thumbPct, 100);

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        borderRadius: 16,
        border: verified ? "1px solid rgba(34,197,94,.4)" : "1px solid rgba(99,102,241,.25)",
        background: verified ? "rgba(34,197,94,.05)" : "rgba(99,102,241,.05)",
        padding: "16px 18px",
        transition: "border-color .4s, background .4s",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%",
              background: verified ? "#22c55e" : "#6366f1",
              boxShadow: verified ? "0 0 6px #22c55e" : "0 0 6px #6366f1",
              animation: "sc-glow 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: verified ? "rgba(34,197,94,.8)" : "rgba(255,255,255,.45)" }}>
              {verified ? "Verified" : "Slide to verify"}
            </span>
          </div>
          {!verified && (
            <button type="button" onClick={reset} aria-label="Reset captcha"
              style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "4px 9px", cursor: "pointer", display: "flex", alignItems: "center",
                gap: 5, color: "rgba(255,255,255,.45)", fontSize: 11, fontWeight: 600, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,.13)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.45)"; e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}>
              <RefreshCw size={10} /> Reset
            </button>
          )}
        </div>

        {verified ? (
          /* ── Verified state ── */
          <div className="sc-pop" style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 4px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,rgba(34,197,94,.2),rgba(16,185,129,.15))",
              border: "1.5px solid rgba(34,197,94,.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(34,197,94,.25)" }}>
              <ShieldCheck size={22} color="#22c55e" />
            </div>
            <div>
              <p style={{ color: "#22c55e", fontSize: 14, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Human verified</p>
              <p style={{ color: "rgba(34,197,94,.55)", fontSize: 11, margin: "3px 0 0", lineHeight: 1 }}>You may now sign in</p>
            </div>
          </div>
        ) : (
          /* ── Slider track ── */
          <div className={shaking ? "sc-shake" : ""}>
            {/* Instruction */}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.3)", margin: "0 0 10px", textAlign: "center", letterSpacing: ".02em" }}>
              Drag the handle to the glowing zone
            </p>

            {/* Track */}
            <div
              ref={trackRef}
              style={{
                position: "relative",
                height: TRACK_H,
                borderRadius: TRACK_H / 2,
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.08)",
                overflow: "visible",
                userSelect: "none",
                cursor: dragging ? "grabbing" : "default",
              }}
            >
              {/* Fill bar */}
              <div style={{
                position: "absolute", top: 0, left: 0, height: "100%",
                width: `calc(${fillPct}% + ${THUMB_W / 2}px)`,
                maxWidth: "100%",
                borderRadius: TRACK_H / 2,
                background: "linear-gradient(90deg, rgba(99,102,241,.35), rgba(139,92,246,.25))",
                transition: dragging ? "none" : "width .3s ease",
                pointerEvents: "none",
              }} />

              {/* Target zone */}
              <div style={{
                position: "absolute",
                top: 6,
                left: `calc(${targetPct}% - 2px)`,
                width: TARGET_W,
                height: TRACK_H - 12,
                borderRadius: 8,
                background: "rgba(99,102,241,.18)",
                border: "1.5px dashed rgba(99,102,241,.6)",
                boxShadow: "0 0 14px rgba(99,102,241,.3), inset 0 0 8px rgba(99,102,241,.1)",
                animation: "sc-glow 1.8s ease-in-out infinite",
                pointerEvents: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 20, height: 2, borderRadius: 1, background: "rgba(99,102,241,.7)" }} />
              </div>

              {/* Track label */}
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", pointerEvents: "none", gap: 6,
              }}>
                {thumbPct < 10 && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)", fontWeight: 600, letterSpacing: ".05em" }}>
                    ← drag →
                  </span>
                )}
              </div>

              {/* Thumb */}
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${thumbPct}%`,
                  transform: "translate(-50%, -50%)",
                  width: THUMB_W,
                  height: THUMB_W,
                  borderRadius: "50%",
                  background: dragging
                    ? "linear-gradient(135deg,#818cf8,#a78bfa)"
                    : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  border: "2.5px solid rgba(255,255,255,.25)",
                  boxShadow: dragging
                    ? "0 0 0 6px rgba(99,102,241,.2), 0 8px 24px rgba(99,102,241,.5)"
                    : "0 0 0 0 rgba(99,102,241,.0), 0 4px 16px rgba(99,102,241,.4)",
                  cursor: dragging ? "grabbing" : "grab",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: dragging ? "none" : "left .3s ease, box-shadow .2s",
                  touchAction: "none",
                  zIndex: 2,
                  animation: !dragging && thumbPct < 2 ? "sc-pulse 2s ease-in-out infinite" : "none",
                }}
              >
                <ChevronRight size={20} color="white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
