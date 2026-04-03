import { useState, useEffect, useRef, useCallback } from "react";
import { Shield, Delete, ArrowRight, Check, Eye, EyeOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

interface Props {
  mode: "create" | "verify";
  theme: DashboardTheme;
  onVerified: () => void;
}

const PIN_LEN = 4;

const CSS_ID = "mpin-gate-css";
function injectCSS() {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement("style");
  s.id = CSS_ID;
  s.textContent = `
@keyframes spin { to { transform:rotate(360deg); } }
@keyframes mpinShake {
  0%,100%{transform:translateX(0)}
  15%{transform:translateX(-8px)}
  30%{transform:translateX(8px)}
  45%{transform:translateX(-6px)}
  60%{transform:translateX(6px)}
  75%{transform:translateX(-3px)}
  90%{transform:translateX(3px)}
}
@keyframes mpinBounce {
  0%{transform:scale(1)}
  40%{transform:scale(1.35)}
  70%{transform:scale(.88)}
  100%{transform:scale(1)}
}
@keyframes mpinFadeIn {
  from{opacity:0;transform:scale(.94)}
  to{opacity:1;transform:scale(1)}
}
@keyframes mpinSlideUp {
  from{opacity:0;transform:translateY(20px)}
  to{opacity:1;transform:translateY(0)}
}
.mpin-dot-filled { animation: mpinBounce .35s cubic-bezier(.34,1.56,.64,1); }
.mpin-dots-shake { animation: mpinShake .45s ease; }
  `;
  document.head.appendChild(s);
}

const NUMPAD = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  ["","0","⌫"],
];

export default function MPinGateModal({ mode, theme, onVerified }: Props) {
  const [step, setStep]         = useState<"enter"|"confirm">("enter");
  const [pin, setPin]           = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [masked, setMasked]     = useState(true);
  const [shake, setShake]       = useState(false);
  const [dotKeys, setDotKeys]   = useState<string[]>([]); // for bounce animation
  const hiddenRef               = useRef<HTMLInputElement>(null);

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => { setTimeout(() => hiddenRef.current?.focus(), 300); }, [step]);

  const isDark   = theme === "black";
  const accent   = isDark ? "#818cf8" : theme === "warm" ? "#d97706" : theme === "forest" ? "#16a34a" : theme === "ocean" ? "#0284c7" : "#4f46e5";
  const accentD  = isDark ? "#6366f1" : theme === "warm" ? "#b45309" : theme === "forest" ? "#15803d" : theme === "ocean" ? "#0369a1" : "#3730a3";
  const cardBg   = isDark ? "#0f172a" : "#ffffff";
  const overlayBg= isDark ? "rgba(0,0,0,.88)" : "rgba(15,23,42,.75)";
  const textC    = isDark ? "#f1f5f9" : "#0f172a";
  const subC     = isDark ? "#94a3b8" : "#64748b";
  const btnBg    = isDark ? "#1e293b" : "#f1f5f9";
  const btnHover = isDark ? "#334155" : "#e2e8f0";
  const borderC  = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const hdr      = `linear-gradient(135deg, ${accent} 0%, ${accentD} 100%)`;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const addDigit = useCallback((d: string) => {
    if (d === "⌫") {
      setPin(p => p.slice(0, -1));
      setError("");
      return;
    }
    if (pin.length >= PIN_LEN) return;
    const next = pin + d;
    setPin(next);
    setDotKeys(p => [...p, `${next.length}-${Date.now()}`]);
    setError("");
  }, [pin]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= "0" && e.key <= "9") addDigit(e.key);
    else if (e.key === "Backspace")   addDigit("⌫");
    else if (e.key === "Enter" && pin.length === PIN_LEN) handleProceed();
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  };

  const handleProceed = useCallback(async () => {
    if (pin.length < PIN_LEN || loading) return;

    if (mode === "create") {
      if (step === "enter") {
        setFirstPin(pin);
        setPin("");
        setStep("confirm");
        return;
      }
      // confirm step
      if (pin !== firstPin) {
        setError("PINs do not match. Try again.");
        triggerShake();
        setPin("");
        return;
      }
      // save
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch("/functions/v1/mpin-set", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pin }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to set PIN");
        onVerified();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error saving PIN");
        triggerShake();
      } finally {
        setLoading(false);
      }
    } else {
      // verify
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch("/functions/v1/mpin-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pin }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error");
        if (json.valid) {
          onVerified();
        } else {
          setError("Incorrect M-Pin. Please try again.");
          triggerShake();
          setPin("");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Server error");
        triggerShake();
        setPin("");
      } finally {
        setLoading(false);
      }
    }
  }, [pin, mode, step, firstPin, loading, onVerified]);

  useEffect(() => {
    if (mode === "verify" && pin.length === PIN_LEN && !loading) {
      handleProceed();
    }
  }, [pin]);

  const title = mode === "create"
    ? step === "enter" ? "Create M-Pin" : "Confirm M-Pin"
    : "Enter M-Pin";

  const subtitle = mode === "create"
    ? step === "enter"
      ? "Set a 4-digit PIN to secure your account"
      : "Re-enter the PIN to confirm"
    : "Enter your M-Pin to access your account";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: overlayBg,
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <input
        ref={hiddenRef}
        type="tel"
        inputMode="numeric"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
        onKeyDown={handleKeyDown}
        readOnly
      />

      <div style={{
        width: "100%", maxWidth: 360,
        background: cardBg,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,.35), 0 8px 24px rgba(0,0,0,.2)",
        animation: "mpinFadeIn .3s cubic-bezier(.22,1,.36,1)",
        border: `1px solid ${borderC}`,
      }}>
        {/* Header */}
        <div style={{
          background: hdr, padding: "28px 24px 22px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(255,255,255,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,.2)",
          }}>
            <Shield size={26} color="white" />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-.3px" }}>{title}</p>
            <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "rgba(255,255,255,.8)", fontWeight: 500 }}>{subtitle}</p>
          </div>
          {mode === "create" && (
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              {["enter","confirm"].map((s, i) => (
                <div key={s} style={{
                  width: step === s ? 22 : 8, height: 8, borderRadius: 4,
                  background: step === s ? "white" : "rgba(255,255,255,.4)",
                  transition: "all .3s",
                }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "24px 24px 28px", animation: "mpinSlideUp .25s ease" }}>
          {/* PIN dots */}
          <div
            className={shake ? "mpin-dots-shake" : ""}
            style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24 }}
          >
            {Array.from({ length: PIN_LEN }).map((_, i) => {
              const filled = i < pin.length;
              const char = pin[i];
              return (
                <div
                  key={i}
                  className={filled ? "mpin-dot-filled" : ""}
                  style={{
                    width: 52, height: 52, borderRadius: 14,
                    border: `2px solid ${filled ? accent : (isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.15)")}`,
                    background: filled ? `${accent}18` : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color .2s, background .2s",
                    boxShadow: filled ? `0 0 0 3px ${accent}22` : "none",
                  }}
                >
                  {filled && (
                    masked
                      ? <div style={{ width: 14, height: 14, borderRadius: "50%", background: accent }} />
                      : <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: accent }}>{char}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error */}
          <div style={{ minHeight: 20, textAlign: "center", marginBottom: 16 }}>
            {error && (
              <p style={{ margin: 0, fontSize: 12.5, color: "#ef4444", fontWeight: 600 }}>{error}</p>
            )}
          </div>

          {/* Numpad */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {NUMPAD.flat().map((key, idx) => {
              if (key === "") return <div key={idx} />;
              const isBackspace = key === "⌫";
              const isDisabled = !isBackspace && pin.length >= PIN_LEN;
              return (
                <button
                  key={idx}
                  onClick={() => addDigit(key)}
                  disabled={isDisabled}
                  style={{
                    height: 56, borderRadius: 14,
                    background: isBackspace ? "transparent" : btnBg,
                    border: `1px solid ${isBackspace ? "transparent" : borderC}`,
                    cursor: isDisabled ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .12s",
                    opacity: isDisabled ? .4 : 1,
                    fontSize: isBackspace ? 0 : 22,
                    fontWeight: 600,
                    color: textC,
                    fontFamily: "inherit",
                  }}
                  onMouseDown={e => { if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.background = btnHover; }}
                  onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.background = isBackspace ? "transparent" : btnBg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isBackspace ? "transparent" : btnBg; }}
                >
                  {isBackspace ? <Delete size={22} color={subC} /> : key}
                </button>
              );
            })}
          </div>

          {/* Actions row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
            <button
              onClick={() => setMasked(m => !m)}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: subC, fontSize: 12, fontFamily: "inherit" }}
            >
              {masked ? <Eye size={15} /> : <EyeOff size={15} />}
              {masked ? "Show PIN" : "Hide PIN"}
            </button>

            {mode === "create" && step === "confirm" && (
              <button
                onClick={() => { setStep("enter"); setPin(""); setError(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: subC, fontSize: 12, fontFamily: "inherit" }}
              >
                <RefreshCw size={14} /> Start over
              </button>
            )}

            <button
              onClick={handleProceed}
              disabled={pin.length < PIN_LEN || loading}
              style={{
                height: 42, paddingLeft: 20, paddingRight: 20,
                borderRadius: 12, border: "none",
                background: (pin.length < PIN_LEN || loading) ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)") : accent,
                color: (pin.length < PIN_LEN || loading) ? subC : "white",
                cursor: (pin.length < PIN_LEN || loading) ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 7,
                fontWeight: 700, fontSize: 13.5,
                fontFamily: "inherit",
                transition: "all .15s",
                boxShadow: (pin.length < PIN_LEN || loading) ? "none" : `0 4px 16px ${accent}50`,
              }}
            >
              {loading ? (
                <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <>
                  {mode === "create" && step === "enter" ? "Continue" : mode === "create" ? "Confirm" : "Verify"}
                  {mode === "create" ? <ArrowRight size={15} /> : <Check size={15} />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
