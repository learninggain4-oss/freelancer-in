import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, Delete, ArrowRight, Check, Eye, EyeOff, RefreshCw,
  KeyRound, Mail, Send, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

interface Props {
  mode: "create" | "verify";
  theme: DashboardTheme;
  onVerified: () => void;
}

const PIN_LEN = 4;
const OTP_LEN = 6;

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
@keyframes mpinSlideIn {
  from{opacity:0;transform:translateY(16px)}
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

type ForgotStep = "email" | "otp" | "newpin";

export default function MPinGateModal({ mode, theme, onVerified }: Props) {
  const [step, setStep]               = useState<"enter"|"confirm">("enter");
  const [pin, setPin]                 = useState("");
  const [firstPin, setFirstPin]       = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [masked, setMasked]           = useState(true);
  const [shake, setShake]             = useState(false);

  const [forgot, setForgot]           = useState(false);
  const [forgotStep, setForgotStep]   = useState<ForgotStep>("email");
  const [userEmail, setUserEmail]     = useState("");
  const [otpVal, setOtpVal]           = useState("");
  const [otpError, setOtpError]       = useState("");
  const [sendingOtp, setSendingOtp]   = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent]         = useState(false);

  const hiddenRef = useRef<HTMLInputElement>(null);
  const otpRef    = useRef<HTMLInputElement>(null);

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    if (!forgot) setTimeout(() => hiddenRef.current?.focus(), 300);
    if (forgot && forgotStep === "otp") setTimeout(() => otpRef.current?.focus(), 300);
  }, [step, forgot, forgotStep]);

  // If the user clicked the magic link in their email, Supabase signs them in and
  // the parent hook re-checks — since mpin_hash was cleared, mode becomes "create".
  // Detect that change and exit the forgot flow so the normal Create M-Pin screen shows.
  useEffect(() => {
    if (mode === "create" && forgot && forgotStep !== "newpin") {
      setForgot(false);
      setForgotStep("email");
      setOtpVal("");
      setOtpError("");
      setOtpSent(false);
    }
  }, [mode]);

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
  const inputBg  = isDark ? "#1e293b" : "#f8fafc";
  const inputBorder = isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)";

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const effectiveMode: "create" | "verify" =
    (forgot && forgotStep === "newpin") ? "create" : mode;

  const addDigit = useCallback((d: string) => {
    if (d === "⌫") { setPin(p => p.slice(0, -1)); setError(""); return; }
    if (pin.length >= PIN_LEN) return;
    setPin(pin + d);
    setError("");
  }, [pin]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (forgot) return;
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

    if (effectiveMode === "create") {
      if (step === "enter") {
        setFirstPin(pin);
        setPin("");
        setStep("confirm");
        return;
      }
      if (pin !== firstPin) {
        setError("PINs do not match. Try again.");
        triggerShake();
        setPin("");
        return;
      }
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
  }, [pin, effectiveMode, step, firstPin, loading, onVerified]);

  useEffect(() => {
    if (effectiveMode === "verify" && pin.length === PIN_LEN && !loading && !forgot) {
      handleProceed();
    }
  }, [pin]);

  const handleForgotClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserEmail(session?.user?.email || "");
    setOtpVal("");
    setOtpError("");
    setOtpSent(false);
    setForgotStep("email");
    setForgot(true);
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setOtpError("");
    try {
      const token = await getToken();
      const res = await fetch("/functions/v1/mpin-forgot-send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not send OTP");
      setOtpSent(true);
      setForgotStep("otp");
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Could not send email. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpVal.length !== OTP_LEN || verifyingOtp) return;
    await doVerifyOtp(otpVal);
  };

  const cancelForgot = () => {
    setForgot(false);
    setForgotStep("email");
    setOtpVal("");
    setOtpError("");
    setOtpSent(false);
    setPin("");
    setStep("enter");
    setError("");
  };

  const forgotHdrGradient =
    forgotStep === "newpin"
      ? `linear-gradient(135deg, #16a34a 0%, #15803d 100%)`
      : `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`;

  const forgotHdrIcon =
    forgotStep === "newpin" ? <ShieldCheck size={26} color="white" /> : <KeyRound size={26} color="white" />;

  const forgotHdrTitle =
    forgotStep === "email" ? "Forgot M-Pin" :
    forgotStep === "otp"   ? "Email Verification" :
    "Set New M-Pin";

  const forgotHdrSub =
    forgotStep === "email" ? "Verify your email to reset" :
    forgotStep === "otp"   ? "Enter the OTP sent to your email" :
    "Create a new 4-digit M-Pin";

  const normalTitle    = mode === "create"
    ? step === "enter" ? "Create M-Pin" : "Confirm M-Pin"
    : "Enter M-Pin";
  const normalSubtitle = mode === "create"
    ? step === "enter" ? "Set a 4-digit PIN to secure your account" : "Re-enter the PIN to confirm"
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
        type="tel" inputMode="numeric"
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

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          background: forgot ? forgotHdrGradient : hdr,
          padding: "28px 24px 22px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          transition: "background .4s",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(255,255,255,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,.2)",
          }}>
            {forgot ? forgotHdrIcon : <Shield size={26} color="white" />}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-.3px" }}>
              {forgot ? forgotHdrTitle : normalTitle}
            </p>
            <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "rgba(255,255,255,.8)", fontWeight: 500 }}>
              {forgot ? forgotHdrSub : normalSubtitle}
            </p>
          </div>
          {effectiveMode === "create" && !forgot && (
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              {["enter","confirm"].map(s => (
                <div key={s} style={{
                  width: step === s ? 22 : 8, height: 8, borderRadius: 4,
                  background: step === s ? "white" : "rgba(255,255,255,.4)",
                  transition: "all .3s",
                }} />
              ))}
            </div>
          )}
          {forgot && forgotStep !== "newpin" && (
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              {(["email","otp"] as ForgotStep[]).map(s => (
                <div key={s} style={{
                  width: forgotStep === s ? 22 : 8, height: 8, borderRadius: 4,
                  background: forgotStep === s ? "white" : "rgba(255,255,255,.4)",
                  transition: "all .3s",
                }} />
              ))}
            </div>
          )}
        </div>

        {/* ── Forgot: email screen ───────────────────────────── */}
        {forgot && forgotStep === "email" && (
          <div style={{ padding: "28px 24px 32px", animation: "mpinSlideIn .25s ease" }}>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: subC, lineHeight: 1.6, textAlign: "center" }}>
              An OTP will be sent to your registered email address. Enter it to verify your identity and set a new M-Pin.
            </p>

            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              borderRadius: 12, padding: "12px 16px",
              marginBottom: 20,
            }}>
              <Mail size={16} color={subC} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: textC, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userEmail || "Loading…"}
              </span>
            </div>

            {otpError && (
              <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#ef4444", textAlign: "center", fontWeight: 600 }}>
                {otpError}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleSendOtp}
                disabled={sendingOtp || !userEmail}
                style={{
                  height: 50, borderRadius: 14, border: "none",
                  background: (sendingOtp || !userEmail) ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)") : accent,
                  color: (sendingOtp || !userEmail) ? subC : "white",
                  cursor: (sendingOtp || !userEmail) ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                  boxShadow: (sendingOtp || !userEmail) ? "none" : `0 4px 16px ${accent}50`,
                  transition: "all .15s",
                }}
              >
                {sendingOtp
                  ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
                  : <><Send size={16} /> Send OTP</>}
              </button>
              <button
                onClick={cancelForgot}
                disabled={sendingOtp}
                style={{
                  height: 44, borderRadius: 14, border: `1px solid ${borderC}`,
                  background: "transparent", color: subC,
                  cursor: "pointer", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit",
                }}
              >
                Cancel — I remember it
              </button>
            </div>
          </div>
        )}

        {/* ── Forgot: OTP entry screen ───────────────────────── */}
        {forgot && forgotStep === "otp" && (
          <div style={{ padding: "28px 24px 32px", animation: "mpinSlideIn .25s ease" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: subC, lineHeight: 1.6, textAlign: "center" }}>
              Email sent to
            </p>
            <p style={{ margin: "0 0 14px", fontSize: 13.5, fontWeight: 700, color: textC, textAlign: "center", wordBreak: "break-all" }}>
              {userEmail}
            </p>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: subC, letterSpacing: ".5px", textTransform: "uppercase" }}>
                Enter 6-digit OTP
              </label>
              <input
                ref={otpRef}
                type="tel"
                inputMode="numeric"
                maxLength={OTP_LEN}
                value={otpVal}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, OTP_LEN);
                  setOtpVal(v);
                  setOtpError("");
                  if (v.length === OTP_LEN) {
                    setTimeout(() => doVerifyOtp(v), 0);
                  }
                }}
                placeholder="••••••"
                style={{
                  width: "100%", marginTop: 8,
                  height: 54, borderRadius: 12,
                  border: `2px solid ${otpError ? "#ef4444" : (isDark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.12)")}`,
                  background: inputBg,
                  color: textC,
                  fontSize: 28, fontWeight: 800, fontFamily: "inherit",
                  letterSpacing: "0.3em",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color .2s",
                }}
              />
            </div>

            {otpError && (
              <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#ef4444", fontWeight: 600, textAlign: "center" }}>
                {otpError}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => doVerifyOtp(otpVal)}
                disabled={otpVal.length !== OTP_LEN || verifyingOtp}
                style={{
                  height: 50, borderRadius: 14, border: "none",
                  background: (otpVal.length !== OTP_LEN || verifyingOtp) ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)") : accent,
                  color: (otpVal.length !== OTP_LEN || verifyingOtp) ? subC : "white",
                  cursor: (otpVal.length !== OTP_LEN || verifyingOtp) ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                  boxShadow: (otpVal.length !== OTP_LEN || verifyingOtp) ? "none" : `0 4px 16px ${accent}50`,
                  transition: "all .15s",
                }}
              >
                {verifyingOtp
                  ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Verifying…</>
                  : <><ShieldCheck size={16} /> Verify OTP</>}
              </button>

              <button
                onClick={() => { setForgotStep("email"); setOtpVal(""); setOtpError(""); }}
                disabled={verifyingOtp}
                style={{
                  height: 40, borderRadius: 12, border: "none",
                  background: "none", color: subC,
                  cursor: "pointer", fontSize: 12.5, fontFamily: "inherit",
                  fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted",
                  textUnderlineOffset: 3,
                }}
              >
                Resend OTP
              </button>

              <button
                onClick={cancelForgot}
                disabled={verifyingOtp}
                style={{
                  height: 44, borderRadius: 14, border: `1px solid ${borderC}`,
                  background: "transparent", color: subC,
                  cursor: "pointer", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit",
                }}
              >
                Cancel — I remember it
              </button>
            </div>
          </div>
        )}

        {/* ── Forgot: new PIN screen (reuse normal numpad) ──── */}
        {forgot && forgotStep === "newpin" && (
          <div style={{ padding: "24px 24px 28px", animation: "mpinSlideUp .25s ease" }}>
            <div style={{
              background: isDark ? "rgba(22,163,74,.12)" : "#dcfce7",
              border: `1px solid ${isDark ? "rgba(22,163,74,.3)" : "#86efac"}`,
              borderRadius: 12, padding: "10px 14px", marginBottom: 18,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Check size={15} color="#16a34a" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12.5, color: isDark ? "#86efac" : "#15803d", fontWeight: 600 }}>
                Identity verified — set your new M-Pin
              </p>
            </div>

            {/* step dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
              {["enter","confirm"].map(s => (
                <div key={s} style={{
                  width: step === s ? 22 : 8, height: 8, borderRadius: 4,
                  background: step === s ? "#16a34a" : (isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.15)"),
                  transition: "all .3s",
                }} />
              ))}
            </div>

            <p style={{ margin: "0 0 16px", fontSize: 13, color: subC, textAlign: "center" }}>
              {step === "enter" ? "Enter a new 4-digit M-Pin" : "Re-enter to confirm"}
            </p>

            <div
              className={shake ? "mpin-dots-shake" : ""}
              style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}
            >
              {Array.from({ length: PIN_LEN }).map((_, i) => {
                const filled = i < pin.length;
                return (
                  <div key={i} className={filled ? "mpin-dot-filled" : ""} style={{
                    width: 52, height: 52, borderRadius: 14,
                    border: `2px solid ${filled ? "#16a34a" : (isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.15)")}`,
                    background: filled ? "rgba(22,163,74,.12)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color .2s, background .2s",
                    boxShadow: filled ? "0 0 0 3px rgba(22,163,74,.18)" : "none",
                  }}>
                    {filled && (
                      masked
                        ? <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#16a34a" }} />
                        : <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{pin[i]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div style={{ minHeight: 20, textAlign: "center", marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 12.5, color: "#ef4444", fontWeight: 600 }}>{error}</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {NUMPAD.flat().map((key, idx) => {
                if (key === "") return <div key={idx} />;
                const isBackspace = key === "⌫";
                const isDisabled  = !isBackspace && pin.length >= PIN_LEN;
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
                      transition: "all .12s", opacity: isDisabled ? .4 : 1,
                      fontSize: isBackspace ? 0 : 22, fontWeight: 600,
                      color: textC, fontFamily: "inherit",
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
              <button
                onClick={() => setMasked(m => !m)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: subC, fontSize: 12, fontFamily: "inherit" }}
              >
                {masked ? <Eye size={15} /> : <EyeOff size={15} />}
                {masked ? "Show PIN" : "Hide PIN"}
              </button>

              {step === "confirm" && (
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
                  background: (pin.length < PIN_LEN || loading) ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)") : "#16a34a",
                  color: (pin.length < PIN_LEN || loading) ? subC : "white",
                  cursor: (pin.length < PIN_LEN || loading) ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 7,
                  fontWeight: 700, fontSize: 13.5, fontFamily: "inherit",
                  transition: "all .15s",
                  boxShadow: (pin.length < PIN_LEN || loading) ? "none" : "0 4px 16px rgba(22,163,74,.4)",
                }}
              >
                {loading
                  ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
                  : <>{step === "enter" ? "Continue" : "Confirm"}{step === "enter" ? <ArrowRight size={15} /> : <Check size={15} />}</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Normal PIN entry / create ────────────────────── */}
        {!forgot && (
          <div style={{ padding: "24px 24px 28px", animation: "mpinSlideUp .25s ease" }}>
            <div
              className={shake ? "mpin-dots-shake" : ""}
              style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24 }}
            >
              {Array.from({ length: PIN_LEN }).map((_, i) => {
                const filled = i < pin.length;
                const char   = pin[i];
                return (
                  <div key={i} className={filled ? "mpin-dot-filled" : ""} style={{
                    width: 52, height: 52, borderRadius: 14,
                    border: `2px solid ${filled ? accent : (isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.15)")}`,
                    background: filled ? `${accent}18` : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color .2s, background .2s",
                    boxShadow: filled ? `0 0 0 3px ${accent}22` : "none",
                  }}>
                    {filled && (
                      masked
                        ? <div style={{ width: 14, height: 14, borderRadius: "50%", background: accent }} />
                        : <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: accent }}>{char}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ minHeight: 20, textAlign: "center", marginBottom: 16 }}>
              {error && <p style={{ margin: 0, fontSize: 12.5, color: "#ef4444", fontWeight: 600 }}>{error}</p>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {NUMPAD.flat().map((key, idx) => {
                if (key === "") return <div key={idx} />;
                const isBackspace = key === "⌫";
                const isDisabled  = !isBackspace && pin.length >= PIN_LEN;
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
                      transition: "all .12s", opacity: isDisabled ? .4 : 1,
                      fontSize: isBackspace ? 0 : 22, fontWeight: 600,
                      color: textC, fontFamily: "inherit",
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
                  fontWeight: 700, fontSize: 13.5, fontFamily: "inherit",
                  transition: "all .15s",
                  boxShadow: (pin.length < PIN_LEN || loading) ? "none" : `0 4px 16px ${accent}50`,
                }}
              >
                {loading
                  ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
                  : <>
                      {mode === "create" && step === "enter" ? "Continue" : mode === "create" ? "Confirm" : "Verify"}
                      {mode === "create" ? <ArrowRight size={15} /> : <Check size={15} />}
                    </>}
              </button>
            </div>

            {mode === "verify" && (
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button
                  onClick={handleForgotClick}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12.5, color: subC, fontFamily: "inherit",
                    textDecoration: "underline", textDecorationStyle: "dotted",
                    textUnderlineOffset: 3,
                  }}
                >
                  Forgot M-Pin?
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  async function doVerifyOtp(val: string) {
    if (val.length !== OTP_LEN || verifyingOtp) return;
    setVerifyingOtp(true);
    setOtpError("");
    try {
      const token = await getToken();
      const res = await fetch("/functions/v1/mpin-forgot-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp: val }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      setPin("");
      setFirstPin("");
      setStep("enter");
      setError("");
      setForgotStep("newpin");
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Invalid OTP");
      setOtpVal("");
      otpRef.current?.focus();
    } finally {
      setVerifyingOtp(false);
    }
  }
}
