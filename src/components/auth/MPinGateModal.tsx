import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, Delete, ArrowRight, Check, Eye, EyeOff, RefreshCw,
  AlertCircle, Smartphone, ShieldQuestion, KeyRound, ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

interface Props {
  mode: "create" | "verify";
  theme: DashboardTheme;
  onVerified: () => void;
}

type ForgotStep =
  | "loading"
  | "choice"
  | "totp"
  | "sq"
  | "new-pin-enter"
  | "new-pin-confirm"
  | "success";

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
@keyframes mpinSlideIn {
  from{opacity:0;transform:translateY(12px)}
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

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

export default function MPinGateModal({ mode, theme, onVerified }: Props) {
  /* ── Normal flow state ─────────────────────────────────────────── */
  const [step, setStep]         = useState<"enter"|"confirm">("enter");
  const [pin, setPin]           = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [masked, setMasked]     = useState(true);
  const [shake, setShake]       = useState(false);

  /* ── Forgot flow state ────────────────────────────────────────── */
  const [forgot, setForgot]             = useState(false);
  const [forgotStep, setForgotStep]     = useState<ForgotStep>("loading");
  const [forgotError, setForgotError]   = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [hasTotp, setHasTotp]           = useState(false);
  const [hasSq, setHasSq]               = useState(false);
  const [sqOptions, setSqOptions]       = useState<{idx:number;question:string}[]>([]);
  const [sqAnswers, setSqAnswers]       = useState(["","",""]);
  const [totpBoxes, setTotpBoxes]       = useState(["","","","","",""]);
  /* new-pin sub-steps share the numpad */
  const [newPinFirst, setNewPinFirst]   = useState("");
  const [newPin, setNewPin]             = useState("");
  const [newPinShake, setNewPinShake]   = useState(false);

  const hiddenRef  = useRef<HTMLInputElement>(null);
  const totpRefs   = useRef<(HTMLInputElement|null)[]>([]);

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => {
    if (!forgot) setTimeout(() => hiddenRef.current?.focus(), 300);
  }, [step, forgot]);
  useEffect(() => {
    if (forgot && forgotStep === "totp")
      setTimeout(() => totpRefs.current[0]?.focus(), 200);
  }, [forgot, forgotStep]);

  const isDark  = theme === "black";
  const accent  = isDark ? "#818cf8" : theme === "warm" ? "#d97706" : theme === "forest" ? "#16a34a" : theme === "ocean" ? "#0284c7" : "#4f46e5";
  const accentD = isDark ? "#6366f1" : theme === "warm" ? "#b45309" : theme === "forest" ? "#15803d" : theme === "ocean" ? "#0369a1" : "#3730a3";
  const cardBg  = isDark ? "#0f172a" : "#ffffff";
  const ovBg    = isDark ? "rgba(0,0,0,.88)" : "rgba(15,23,42,.75)";
  const textC   = isDark ? "#f1f5f9" : "#0f172a";
  const subC    = isDark ? "#94a3b8" : "#64748b";
  const btnBg   = isDark ? "#1e293b" : "#f1f5f9";
  const btnHov  = isDark ? "#334155" : "#e2e8f0";
  const borderC = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const inputBg = isDark ? "#1e293b" : "#f8fafc";
  const hdr     = `linear-gradient(135deg,${accent},${accentD})`;

  const triggerShake = (setter: (v:boolean)=>void) => {
    setter(true);
    setTimeout(() => setter(false), 500);
  };

  /* ── Open forgot flow ──────────────────────────────────────────── */
  const openForgot = useCallback(async () => {
    setForgot(true);
    setForgotStep("loading");
    setForgotError("");
    try {
      const token = await getToken();
      const res = await fetch("/functions/v1/forgot-mpin-options", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setHasTotp(!!json.hasTotp);
      setHasSq(!!json.hasSq);
      setSqOptions(json.sqQuestions || []);
      setSqAnswers(["","",""]);
      setTotpBoxes(["","","","","",""]);
      setNewPin(""); setNewPinFirst("");
      setForgotStep("choice");
    } catch {
      setForgotStep("choice");
      setHasTotp(false); setHasSq(false);
    }
  }, []);

  /* ── TOTP box handling ─────────────────────────────────────────── */
  const handleTotpChange = (idx: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6);
      const next = ["","","","","",""];
      digits.split("").forEach((d, i) => { next[i] = d; });
      setTotpBoxes(next);
      setTimeout(() => totpRefs.current[Math.min(digits.length, 5)]?.focus(), 0);
      return;
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...totpBoxes]; next[idx] = val;
    setTotpBoxes(next);
    setForgotError("");
    if (val && idx < 5) setTimeout(() => totpRefs.current[idx+1]?.focus(), 0);
  };
  const handleTotpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !totpBoxes[idx] && idx > 0) {
      const next = [...totpBoxes]; next[idx-1] = "";
      setTotpBoxes(next);
      setTimeout(() => totpRefs.current[idx-1]?.focus(), 0);
    }
    if (e.key === "Enter" && totpBoxes.join("").length === 6) verifyTotp();
  };
  const totpStr = totpBoxes.join("");

  /* ── Verify TOTP ───────────────────────────────────────────────── */
  const verifyTotp = useCallback(async () => {
    if (totpStr.length !== 6 || forgotLoading) return;
    setForgotLoading(true); setForgotError("");
    try {
      const token = await getToken();
      const res = await fetch("/functions/v1/forgot-mpin-verify-totp", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ token: totpStr }),
      });
      const json = await res.json();
      if (!res.ok || !json.valid) throw new Error("Incorrect code. Please try again.");
      setForgotStep("new-pin-enter");
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : "Verification failed");
      setTotpBoxes(["","","","","",""]);
      setTimeout(() => totpRefs.current[0]?.focus(), 100);
    } finally { setForgotLoading(false); }
  }, [totpStr, forgotLoading]);

  useEffect(() => {
    if (forgotStep === "totp" && totpStr.length === 6 && !forgotLoading) verifyTotp();
  }, [totpStr]);

  /* ── Verify SQ ─────────────────────────────────────────────────── */
  const verifySq = useCallback(async () => {
    if (sqAnswers.some(a => !a.trim()) || forgotLoading) return;
    setForgotLoading(true); setForgotError("");
    try {
      const token = await getToken();
      const answers = sqOptions.map((q, i) => ({ idx: q.idx, answer: sqAnswers[i] }));
      const res = await fetch("/functions/v1/forgot-mpin-verify-sq", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (!res.ok || !json.valid) throw new Error("One or more answers are incorrect. Please try again.");
      setForgotStep("new-pin-enter");
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : "Verification failed");
      setSqAnswers(["","",""]);
    } finally { setForgotLoading(false); }
  }, [sqAnswers, sqOptions, forgotLoading]);

  /* ── New-pin numpad ────────────────────────────────────────────── */
  const addNewPinDigit = useCallback((d: string) => {
    if (d === "⌫") { setNewPin(p => p.slice(0,-1)); return; }
    if (newPin.length >= PIN_LEN) return;
    setNewPin(newPin + d);
    setForgotError("");
  }, [newPin]);

  useEffect(() => {
    if (forgotStep !== "new-pin-enter" && forgotStep !== "new-pin-confirm") return;
    if (newPin.length === PIN_LEN) {
      if (forgotStep === "new-pin-enter") {
        setTimeout(() => { setNewPinFirst(newPin); setNewPin(""); setForgotStep("new-pin-confirm"); }, 120);
      } else {
        if (newPin !== newPinFirst) {
          triggerShake(setNewPinShake);
          setForgotError("PINs do not match. Try again.");
          setNewPin(""); return;
        }
        // Save new PIN
        (async () => {
          setForgotLoading(true);
          try {
            const token = await getToken();
            const res = await fetch("/functions/v1/mpin-set", {
              method: "POST",
              headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
              body: JSON.stringify({ pin: newPin }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to set PIN");
            setForgotStep("success");
            setTimeout(onVerified, 1600);
          } catch (err: unknown) {
            setForgotError(err instanceof Error ? err.message : "Error saving PIN");
            setNewPin(""); setNewPinFirst(""); setForgotStep("new-pin-enter");
          } finally { setForgotLoading(false); }
        })();
      }
    }
  }, [newPin, forgotStep]);

  /* ── Normal PIN flow ───────────────────────────────────────────── */
  const addDigit = useCallback((d: string) => {
    if (d === "⌫") { setPin(p => p.slice(0,-1)); setError(""); return; }
    if (pin.length >= PIN_LEN) return;
    setPin(pin + d); setError("");
  }, [pin]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (forgot) return;
    if (e.key >= "0" && e.key <= "9") addDigit(e.key);
    else if (e.key === "Backspace") addDigit("⌫");
    else if (e.key === "Enter" && pin.length === PIN_LEN) handleProceed();
  };

  const handleProceed = useCallback(async () => {
    if (pin.length < PIN_LEN || loading) return;
    if (mode === "create") {
      if (step === "enter") { setFirstPin(pin); setPin(""); setStep("confirm"); return; }
      if (pin !== firstPin) {
        setError("PINs do not match. Try again."); triggerShake(setShake); setPin(""); return;
      }
    }
    setLoading(true);
    try {
      const token = await getToken();
      const endpoint = mode === "create" ? "/functions/v1/mpin-set" : "/functions/v1/mpin-verify";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      if (mode === "verify" && !json.valid) {
        setError("Incorrect M-Pin. Please try again.");
        triggerShake(setShake); setPin(""); return;
      }
      onVerified();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Server error");
      triggerShake(setShake); setPin("");
    } finally { setLoading(false); }
  }, [pin, mode, step, firstPin, loading, onVerified]);

  useEffect(() => {
    if (mode === "verify" && pin.length === PIN_LEN && !loading && !forgot) handleProceed();
  }, [pin]);

  /* ── Derived ────────────────────────────────────────────────────── */
  const forgotTitle = {
    loading: "Verifying Identity",
    choice:  "Forgot M-Pin?",
    totp:    "Google Authenticator",
    sq:      "Security Questions",
    "new-pin-enter":   "Create New M-Pin",
    "new-pin-confirm": "Confirm New M-Pin",
    success: "M-Pin Updated!",
  }[forgotStep];

  const activePin = (forgotStep === "new-pin-enter" || forgotStep === "new-pin-confirm") ? newPin : pin;

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10000,
      background:ovBg, backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"0 16px",
    }}>
      <input ref={hiddenRef} type="tel" inputMode="numeric"
        style={{position:"absolute",opacity:0,width:1,height:1,pointerEvents:"none"}}
        onKeyDown={handleKeyDown} readOnly />

      <div style={{
        width:"100%", maxWidth:370, background:cardBg, borderRadius:24, overflow:"hidden",
        boxShadow:"0 32px 80px rgba(0,0,0,.35),0 8px 24px rgba(0,0,0,.2)",
        animation:"mpinFadeIn .3s cubic-bezier(.22,1,.36,1)",
        border:`1px solid ${borderC}`,
        maxHeight:"92dvh", display:"flex", flexDirection:"column",
      }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{
          background: forgot && forgotStep === "success"
            ? "linear-gradient(135deg,#16a34a,#15803d)"
            : forgot ? "linear-gradient(135deg,#f59e0b,#d97706)"
            : hdr,
          padding:"22px 22px 18px", flexShrink:0, transition:"background .4s",
        }}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={{
              width:46, height:46, borderRadius:13, background:"rgba(255,255,255,.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 14px rgba(0,0,0,.2)", flexShrink:0,
            }}>
              {forgot && forgotStep === "success"  ? <CheckCircle2 size={22} color="white" />
                : forgot && forgotStep === "totp"  ? <Smartphone size={22} color="white" />
                : forgot && forgotStep === "sq"    ? <ShieldQuestion size={22} color="white" />
                : forgot ? <KeyRound size={22} color="white" />
                : <Shield size={22} color="white" />}
            </div>
            <div>
              <p style={{margin:0, fontWeight:800, fontSize:17, color:"white", letterSpacing:"-.3px"}}>
                {forgot ? forgotTitle : mode === "create" ? (step === "enter" ? "Create M-Pin" : "Confirm M-Pin") : "Enter M-Pin"}
              </p>
              <p style={{margin:"3px 0 0", fontSize:12, color:"rgba(255,255,255,.8)"}}>
                {forgot && forgotStep === "choice"        ? "Choose an identity verification method"
                  : forgot && forgotStep === "totp"       ? "Enter the 6-digit code from your authenticator app"
                  : forgot && forgotStep === "sq"         ? "Answer your security questions"
                  : forgot && forgotStep === "new-pin-enter"   ? "Choose a new 4-digit PIN"
                  : forgot && forgotStep === "new-pin-confirm" ? "Enter the PIN again to confirm"
                  : forgot && forgotStep === "success"    ? "Your M-Pin has been changed successfully"
                  : forgot && forgotStep === "loading"    ? "Please wait..."
                  : mode === "create" ? (step === "enter" ? "Set a 4-digit PIN to secure your account" : "Re-enter the PIN to confirm")
                  : "Enter your M-Pin to access your account"}
              </p>
            </div>
          </div>
          {/* Create-mode step dots */}
          {!forgot && mode === "create" && (
            <div style={{display:"flex", gap:6, marginTop:10}}>
              {["enter","confirm"].map(s => (
                <div key={s} style={{
                  width: step === s ? 22 : 8, height:8, borderRadius:4,
                  background: step === s ? "white" : "rgba(255,255,255,.4)",
                  transition:"all .3s",
                }} />
              ))}
            </div>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div style={{flex:1, overflowY:"auto"}}>

          {/* ══ FORGOT FLOW ══════════════════════════════════════ */}
          {forgot ? (
            <div style={{padding:"20px 20px 24px"}}>

              {/* Loading */}
              {forgotStep === "loading" && (
                <div style={{textAlign:"center", padding:"20px 0"}}>
                  <RefreshCw size={28} color={accent} style={{animation:"spin 1s linear infinite", margin:"0 auto 10px"}} />
                  <p style={{margin:0, fontSize:13, color:subC}}>Loading options...</p>
                </div>
              )}

              {/* Choice */}
              {forgotStep === "choice" && (
                <div style={{animation:"mpinSlideIn .25s ease"}}>
                  <p style={{margin:"0 0 16px", fontSize:13, color:subC, lineHeight:1.6}}>
                    Verify your identity using one of the methods below, then you can set a new M-Pin.
                  </p>

                  {!hasTotp && !hasSq && (
                    <div style={{padding:"14px 16px", borderRadius:12, background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", marginBottom:14}}>
                      <p style={{margin:0, fontSize:13, color:"#ef4444", lineHeight:1.5}}>
                        No recovery method found. Please log out and contact support to reset your M-Pin.
                      </p>
                    </div>
                  )}

                  {hasTotp && (
                    <button onClick={() => { setForgotStep("totp"); setForgotError(""); setTotpBoxes(["","","","","",""]); }}
                      style={{
                        width:"100%", height:54, borderRadius:14, border:`1.5px solid ${borderC}`,
                        background:isDark ? "#1e293b" : "#f8fafc",
                        cursor:"pointer", display:"flex", alignItems:"center", gap:14,
                        padding:"0 18px", marginBottom:10, textAlign:"left",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = accent)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = borderC)}
                    >
                      <div style={{width:36, height:36, borderRadius:10, background:`${accent}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                        <Smartphone size={18} color={accent} />
                      </div>
                      <div>
                        <p style={{margin:0, fontSize:14, fontWeight:700, color:textC}}>Google Authenticator</p>
                        <p style={{margin:0, fontSize:11.5, color:subC}}>Enter the 6-digit code from your app</p>
                      </div>
                      <ArrowRight size={16} color={subC} style={{marginLeft:"auto", flexShrink:0}} />
                    </button>
                  )}

                  {hasSq && (
                    <button onClick={() => { setForgotStep("sq"); setForgotError(""); setSqAnswers(["","",""]); }}
                      style={{
                        width:"100%", height:54, borderRadius:14, border:`1.5px solid ${borderC}`,
                        background:isDark ? "#1e293b" : "#f8fafc",
                        cursor:"pointer", display:"flex", alignItems:"center", gap:14,
                        padding:"0 18px", marginBottom:10, textAlign:"left",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = accent)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = borderC)}
                    >
                      <div style={{width:36, height:36, borderRadius:10, background:`${accent}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                        <ShieldQuestion size={18} color={accent} />
                      </div>
                      <div>
                        <p style={{margin:0, fontSize:14, fontWeight:700, color:textC}}>Security Questions</p>
                        <p style={{margin:0, fontSize:11.5, color:subC}}>Answer your 3 security questions</p>
                      </div>
                      <ArrowRight size={16} color={subC} style={{marginLeft:"auto", flexShrink:0}} />
                    </button>
                  )}

                  <button onClick={() => setForgot(false)}
                    style={{width:"100%", height:40, marginTop:4, borderRadius:12, border:"none", background:"transparent", cursor:"pointer", fontSize:13, color:subC, fontFamily:"inherit"}}>
                    Cancel — I remember it
                  </button>
                </div>
              )}

              {/* TOTP */}
              {forgotStep === "totp" && (
                <div style={{animation:"mpinSlideIn .25s ease"}}>
                  <p style={{margin:"0 0 16px", fontSize:13, color:subC, lineHeight:1.6}}>
                    Open <strong>Google Authenticator</strong> and enter the current 6-digit code for <strong>Freelancer India</strong>.
                  </p>

                  <div style={{display:"flex", gap:7, justifyContent:"center", marginBottom:14}}>
                    {totpBoxes.map((digit, idx) => (
                      <input key={idx} ref={el => {totpRefs.current[idx]=el;}}
                        type="tel" inputMode="numeric" maxLength={6}
                        value={digit}
                        onChange={e => handleTotpChange(idx, e.target.value)}
                        onKeyDown={e => handleTotpKeyDown(idx, e)}
                        onFocus={e => e.currentTarget.select()}
                        style={{
                          width:40, height:48, textAlign:"center", fontSize:20, fontWeight:700,
                          border:`2px solid ${digit ? accent : borderC}`,
                          borderRadius:11, background:digit ? `${accent}14` : inputBg,
                          color:textC, outline:"none", transition:"all .15s",
                          fontFamily:"monospace", caretColor:"transparent",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor=accent; e.currentTarget.select(); }}
                        onBlur={e => { if(!totpBoxes[idx]) e.currentTarget.style.borderColor=borderC; }}
                      />
                    ))}
                  </div>

                  {forgotError && <ErrorBanner msg={forgotError} />}

                  <button onClick={verifyTotp} disabled={totpStr.length!==6||forgotLoading}
                    style={primaryBtn(totpStr.length===6&&!forgotLoading, accent, accentD, subC, isDark)}>
                    {forgotLoading ? <><RefreshCw size={15} style={{animation:"spin 1s linear infinite"}} /> Verifying...</> : <><Check size={15}/>Verify</>}
                  </button>

                  <BackBtn onClick={() => {setForgotStep("choice"); setForgotError(""); }} subC={subC} />
                </div>
              )}

              {/* Security Questions */}
              {forgotStep === "sq" && (
                <div style={{animation:"mpinSlideIn .25s ease"}}>
                  {sqOptions.map((q, i) => (
                    <div key={q.idx} style={{marginBottom:12}}>
                      <p style={{margin:"0 0 5px", fontSize:12.5, fontWeight:600, color:subC}}>
                        {q.question}
                      </p>
                      <input
                        type="text"
                        value={sqAnswers[i]}
                        onChange={e => { const n=[...sqAnswers]; n[i]=e.target.value; setSqAnswers(n); setForgotError(""); }}
                        placeholder="Your answer..."
                        style={{
                          width:"100%", height:42, borderRadius:11, border:`1.5px solid ${borderC}`,
                          background:inputBg, color:textC, fontSize:13.5,
                          padding:"0 12px", outline:"none", fontFamily:"inherit",
                          boxSizing:"border-box",
                        }}
                        onFocus={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.boxShadow=`0 0 0 3px ${accent}22`;}}
                        onBlur={e=>{e.currentTarget.style.borderColor=borderC;e.currentTarget.style.boxShadow="none";}}
                      />
                    </div>
                  ))}

                  {forgotError && <ErrorBanner msg={forgotError} />}

                  <button
                    onClick={verifySq}
                    disabled={sqAnswers.some(a=>!a.trim())||forgotLoading}
                    style={primaryBtn(!sqAnswers.some(a=>!a.trim())&&!forgotLoading, accent, accentD, subC, isDark)}
                  >
                    {forgotLoading ? <><RefreshCw size={15} style={{animation:"spin 1s linear infinite"}}/>Verifying...</> : <><Check size={15}/>Verify Answers</>}
                  </button>

                  <BackBtn onClick={() => {setForgotStep("choice"); setForgotError(""); }} subC={subC} />
                </div>
              )}

              {/* New PIN — numpad ---------------------------------------- */}
              {(forgotStep === "new-pin-enter" || forgotStep === "new-pin-confirm") && (
                <div style={{animation:"mpinSlideIn .25s ease"}}>
                  {/* Dots */}
                  <div className={newPinShake ? "mpin-dots-shake" : ""} style={{display:"flex",justifyContent:"center",gap:14,marginBottom:18}}>
                    {Array.from({length:PIN_LEN}).map((_,i) => {
                      const filled = i < newPin.length;
                      return (
                        <div key={i} className={filled ? "mpin-dot-filled" : ""} style={{
                          width:50, height:50, borderRadius:13,
                          border:`2px solid ${filled ? accent : (isDark?"rgba(255,255,255,.2)":"rgba(0,0,0,.15)")}`,
                          background: filled ? `${accent}18` : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          transition:"border-color .2s,background .2s",
                          boxShadow: filled ? `0 0 0 3px ${accent}22` : "none",
                        }}>
                          {filled && (masked
                            ? <div style={{width:13,height:13,borderRadius:"50%",background:accent}}/>
                            : <p style={{margin:0,fontSize:21,fontWeight:700,color:accent}}>{newPin[i]}</p>)}
                        </div>
                      );
                    })}
                  </div>

                  {forgotError && <div style={{textAlign:"center",marginBottom:10}}><p style={{margin:0,fontSize:12.5,color:"#ef4444",fontWeight:600}}>{forgotError}</p></div>}

                  {/* Numpad */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
                    {NUMPAD.flat().map((key,idx) => {
                      if (key === "") return <div key={idx}/>;
                      const isBack = key === "⌫";
                      const isDisabled = !isBack && newPin.length >= PIN_LEN;
                      return (
                        <button key={idx} onClick={() => addNewPinDigit(key)} disabled={isDisabled}
                          style={{
                            height:54, borderRadius:13,
                            background:isBack ? "transparent" : btnBg,
                            border:`1px solid ${isBack ? "transparent" : borderC}`,
                            cursor:isDisabled?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                            transition:"all .12s", opacity:isDisabled?.4:1,
                            fontSize:isBack?0:21, fontWeight:600, color:textC, fontFamily:"inherit",
                          }}
                          onMouseDown={e=>{if(!isDisabled)(e.currentTarget as HTMLButtonElement).style.background=btnHov;}}
                          onMouseUp={e=>{(e.currentTarget as HTMLButtonElement).style.background=isBack?"transparent":btnBg;}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=isBack?"transparent":btnBg;}}
                        >
                          {isBack ? <Delete size={21} color={subC}/> : key}
                        </button>
                      );
                    })}
                  </div>

                  {/* Show/hide + loading */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}>
                    <button onClick={() => setMasked(m=>!m)}
                      style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:subC,fontSize:12,fontFamily:"inherit"}}>
                      {masked ? <Eye size={14}/> : <EyeOff size={14}/>} {masked ? "Show PIN" : "Hide PIN"}
                    </button>
                    {forgotLoading && <RefreshCw size={15} color={subC} style={{animation:"spin 1s linear infinite"}}/>}
                    {forgotStep === "new-pin-confirm" && (
                      <button onClick={() => {setForgotStep("new-pin-enter"); setNewPin(""); setNewPinFirst(""); setForgotError("");}}
                        style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:subC,fontSize:12,fontFamily:"inherit"}}>
                        <RefreshCw size={13}/> Start over
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Success */}
              {forgotStep === "success" && (
                <div style={{textAlign:"center", padding:"12px 0 8px", animation:"mpinSlideIn .25s ease"}}>
                  <div style={{width:64,height:64,borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                    <CheckCircle2 size={30} color="#16a34a"/>
                  </div>
                  <p style={{margin:"0 0 6px", fontWeight:700, fontSize:15, color:textC}}>M-Pin Changed!</p>
                  <p style={{margin:0, fontSize:13, color:subC, lineHeight:1.5}}>
                    Your new M-Pin is active. Redirecting to your dashboard...
                  </p>
                  <div style={{marginTop:16,height:4,borderRadius:2,background:borderC,overflow:"hidden"}}>
                    <div style={{height:"100%",background:"#16a34a",animation:"progressFill 1.5s linear forwards"}} />
                  </div>
                  <style>{`@keyframes progressFill{from{width:0%}to{width:100%}}`}</style>
                </div>
              )}
            </div>

          ) : (
            /* ══ NORMAL PIN FLOW ════════════════════════════════ */
            <div style={{padding:"22px 22px 26px", animation:"mpinSlideUp .25s ease"}}>
              {/* PIN dots */}
              <div className={shake ? "mpin-dots-shake" : ""} style={{display:"flex",justifyContent:"center",gap:14,marginBottom:22}}>
                {Array.from({length:PIN_LEN}).map((_,i) => {
                  const filled = i < pin.length;
                  return (
                    <div key={i} className={filled ? "mpin-dot-filled" : ""} style={{
                      width:50, height:50, borderRadius:13,
                      border:`2px solid ${filled ? accent : (isDark?"rgba(255,255,255,.2)":"rgba(0,0,0,.15)")}`,
                      background: filled ? `${accent}18` : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"border-color .2s,background .2s",
                      boxShadow: filled ? `0 0 0 3px ${accent}22` : "none",
                    }}>
                      {filled && (masked
                        ? <div style={{width:13,height:13,borderRadius:"50%",background:accent}}/>
                        : <p style={{margin:0,fontSize:21,fontWeight:700,color:accent}}>{pin[i]}</p>)}
                    </div>
                  );
                })}
              </div>

              {/* Error */}
              <div style={{minHeight:18,textAlign:"center",marginBottom:14}}>
                {error && <p style={{margin:0,fontSize:12.5,color:"#ef4444",fontWeight:600}}>{error}</p>}
              </div>

              {/* Numpad */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
                {NUMPAD.flat().map((key,idx) => {
                  if (key === "") return <div key={idx}/>;
                  const isBack = key === "⌫";
                  const isDisabled = !isBack && pin.length >= PIN_LEN;
                  return (
                    <button key={idx} onClick={() => addDigit(key)} disabled={isDisabled}
                      style={{
                        height:54, borderRadius:13,
                        background:isBack?"transparent":btnBg,
                        border:`1px solid ${isBack?"transparent":borderC}`,
                        cursor:isDisabled?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"all .12s", opacity:isDisabled?.4:1,
                        fontSize:isBack?0:21, fontWeight:600, color:textC, fontFamily:"inherit",
                      }}
                      onMouseDown={e=>{if(!isDisabled)(e.currentTarget as HTMLButtonElement).style.background=btnHov;}}
                      onMouseUp={e=>{(e.currentTarget as HTMLButtonElement).style.background=isBack?"transparent":btnBg;}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=isBack?"transparent":btnBg;}}
                    >
                      {isBack ? <Delete size={21} color={subC}/> : key}
                    </button>
                  );
                })}
              </div>

              {/* Bottom row */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16}}>
                <button onClick={() => setMasked(m=>!m)}
                  style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:subC,fontSize:12,fontFamily:"inherit"}}>
                  {masked ? <Eye size={14}/> : <EyeOff size={14}/>} {masked ? "Show PIN" : "Hide PIN"}
                </button>

                {mode === "create" && step === "confirm" && (
                  <button onClick={() => {setStep("enter");setPin("");setError("");}}
                    style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:subC,fontSize:12,fontFamily:"inherit"}}>
                    <RefreshCw size={13}/> Start over
                  </button>
                )}

                <button onClick={handleProceed} disabled={pin.length<PIN_LEN||loading}
                  style={{
                    height:40, paddingLeft:18, paddingRight:18, borderRadius:11, border:"none",
                    background:(pin.length<PIN_LEN||loading)?(isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.06)"):accent,
                    color:(pin.length<PIN_LEN||loading)?subC:"white",
                    cursor:(pin.length<PIN_LEN||loading)?"default":"pointer",
                    display:"flex", alignItems:"center", gap:7,
                    fontWeight:700, fontSize:13, fontFamily:"inherit", transition:"all .15s",
                    boxShadow:(pin.length<PIN_LEN||loading)?"none":`0 4px 14px ${accent}50`,
                  }}>
                  {loading
                    ? <RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/>
                    : <>{mode==="create"&&step==="enter"?"Continue":mode==="create"?"Confirm":"Verify"} {mode==="create"?<ArrowRight size={14}/>:<Check size={14}/>}</>}
                </button>
              </div>

              {/* Forgot link */}
              {mode === "verify" && (
                <div style={{textAlign:"center", marginTop:16}}>
                  <button onClick={openForgot}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:12.5,color:subC,fontFamily:"inherit",textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>
                    Forgot M-Pin?
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small helper components ─────────────────────────────────────── */
function ErrorBanner({msg}: {msg:string}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px",borderRadius:10,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",marginBottom:12}}>
      <AlertCircle size={13} color="#ef4444" style={{flexShrink:0}}/>
      <p style={{margin:0,fontSize:12.5,color:"#ef4444"}}>{msg}</p>
    </div>
  );
}

function BackBtn({onClick, subC}: {onClick:()=>void; subC:string}) {
  return (
    <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",color:subC,fontSize:12.5,marginTop:12,fontFamily:"inherit"}}>
      <ChevronLeft size={14}/> Back
    </button>
  );
}

function primaryBtn(enabled: boolean, accent: string, accentD: string, subC: string, isDark: boolean): React.CSSProperties {
  return {
    width:"100%", height:48, borderRadius:13, border:"none",
    background: enabled ? `linear-gradient(135deg,${accent},${accentD})` : (isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.06)"),
    color: enabled ? "white" : subC,
    cursor: enabled ? "pointer" : "default",
    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    fontWeight:700, fontSize:14, fontFamily:"inherit",
    boxShadow: enabled ? `0 6px 18px ${accent}40` : "none",
    transition:"all .2s", marginBottom:4,
  };
}
