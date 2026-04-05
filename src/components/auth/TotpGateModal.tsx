import { useState, useEffect, useRef, useCallback } from "react";
import {
  Smartphone, Shield, Copy, Check, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, KeyRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";
import { callEdgeFunction } from "@/lib/supabase-functions";

interface Props {
  mode: "setup" | "verify";
  theme: DashboardTheme;
  onVerified: () => void;
}

const CSS_ID = "totp-gate-css";
function injectCSS() {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement("style");
  s.id = CSS_ID;
  s.textContent = `
@keyframes totpFadeIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes totpSpin   { to{transform:rotate(360deg)} }
@keyframes totpShake {
  0%,100%{transform:translateX(0)}
  15%{transform:translateX(-7px)}
  30%{transform:translateX(7px)}
  45%{transform:translateX(-5px)}
  60%{transform:translateX(5px)}
  75%{transform:translateX(-3px)}
  90%{transform:translateX(3px)}
}
@keyframes totpSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
.totp-shake { animation: totpShake .4s ease; }
  `;
  document.head.appendChild(s);
}

const STEPS = [
  "Download Google Authenticator from the App Store or Play Store.",
  "Tap the '+' button inside the app and choose 'Scan QR code'.",
  "Point your camera at the QR code below.",
  "Enter the 6-digit code shown in the app to confirm.",
];

async function getToken(): Promise<string> {
  // Try to get an active session; refresh if necessary
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const { data } = await supabase.auth.refreshSession();
    session = data.session;
  }
  return session?.access_token ?? "";
}

export default function TotpGateModal({ mode, theme, onVerified }: Props) {
  const [step, setStep]           = useState<"setup" | "verify">(mode);
  const [code, setCode]           = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [shake, setShake]         = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [qrData, setQrData]       = useState<{ qrCodeDataUrl: string; formattedSecret: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(mode === "setup");
  const [qrImgErr, setQrImgErr]   = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { injectCSS(); }, []);

  // Fetch QR data if in setup mode
  useEffect(() => {
    if (mode !== "setup") return;
    let cancelled = false;
    (async () => {
      try {
        setQrImgErr(false);
        const token = await getToken();
        if (!token) {
          if (!cancelled) setError("Session expired. Please refresh the page and log in again.");
          return;
        }
        const res = await callEdgeFunction("totp-setup-init", { method: "POST", body: {}, token });
        let json: any = {};
        try { json = await res.json(); } catch { /* non-JSON response */ }
        if (!cancelled && json.qrCodeDataUrl) {
          setQrData({ qrCodeDataUrl: json.qrCodeDataUrl, formattedSecret: json.formattedSecret });
        } else if (!cancelled) {
          setError(json.error === "Unauthorized"
            ? "Session expired. Please refresh the page and log in again."
            : json.error || "Failed to load QR code. Please refresh.");
        }
      } catch {
        if (!cancelled) setError("Failed to load QR code. Please refresh.");
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  // Auto-focus first input on mount / step change
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
  }, [step]);

  const isDark  = theme === "black";
  const accent  = theme === "black" ? "#818cf8" : theme === "warm" ? "#d97706" : theme === "forest" ? "#16a34a" : theme === "ocean" ? "#0284c7" : "#4f46e5";
  const accentD = theme === "black" ? "#6366f1" : theme === "warm" ? "#b45309" : theme === "forest" ? "#15803d" : theme === "ocean" ? "#0369a1" : "#3730a3";
  const cardBg  = isDark ? "#0f172a" : "#ffffff";
  const ovBg    = isDark ? "rgba(0,0,0,.9)" : "rgba(15,23,42,.78)";
  const textC   = isDark ? "#f1f5f9" : "#0f172a";
  const subC    = isDark ? "#94a3b8" : "#64748b";
  const borderC = isDark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.09)";
  const inputBg = isDark ? "#1e293b" : "#f8fafc";

  const codeStr = code.join("");
  const isReady = codeStr.length === 6;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleCodeChange = (idx: number, val: string) => {
    // Handle paste
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6);
      const next = ["", "", "", "", "", ""];
      digits.split("").forEach((d, i) => { next[i] = d; });
      setCode(next);
      const focusIdx = Math.min(digits.length, 5);
      setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0);
      return;
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    setError("");
    if (val && idx < 5) {
      setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      const next = [...code];
      next[idx - 1] = "";
      setCode(next);
      setTimeout(() => inputRefs.current[idx - 1]?.focus(), 0);
    }
    if (e.key === "Enter" && isReady) handleVerify();
  };

  const handleVerify = useCallback(async () => {
    if (!isReady || loading) return;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const fnName = step === "setup" ? "totp-setup-verify" : "totp-verify";
      const res = await callEdgeFunction(fnName, { body: { token: codeStr }, token });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");

      // For verify mode, check the 'valid' flag
      if (step === "verify" && !json.valid) {
        throw new Error("Incorrect code. Please try again.");
      }

      onVerified();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Incorrect code. Please try again.");
      setCode(["", "", "", "", "", ""]);
      triggerShake();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [isReady, loading, step, codeStr, onVerified]);

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (isReady && !loading) handleVerify();
  }, [isReady]);

  const copySecret = () => {
    if (!qrData?.formattedSecret) return;
    navigator.clipboard.writeText(qrData.formattedSecret.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hdr = `linear-gradient(135deg, ${accent} 0%, ${accentD} 100%)`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10002,
      background: ovBg, backdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: cardBg,
        borderRadius: 24,
        boxShadow: "0 32px 80px rgba(0,0,0,.35), 0 8px 24px rgba(0,0,0,.2)",
        border: `1px solid ${borderC}`,
        animation: "totpFadeIn .3s cubic-bezier(.22,1,.36,1)",
        overflow: "hidden",
        maxHeight: "92dvh",
        display: "flex", flexDirection: "column",
      }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{
          background: hdr, padding: "24px 22px 20px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,.2)", flexShrink: 0,
            }}>
              {step === "setup" ? <Smartphone size={22} color="white" /> : <Shield size={22} color="white" />}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "white", letterSpacing: "-.3px" }}>
                {step === "setup" ? "Set Up Google Authenticator" : "Two-Factor Authentication"}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,.8)" }}>
                {step === "setup"
                  ? "Scan the QR code to link your account"
                  : "Enter the 6-digit code from your authenticator app"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body (scrollable) ─────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 24px" }}>

          {/* ── SETUP MODE ─────────────────────────────────────── */}
          {step === "setup" && (
            <div style={{ animation: "totpSlideIn .25s ease" }}>
              {/* Step-by-step guide (collapsible) */}
              <button
                onClick={() => setShowSteps(s => !s)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 12, border: `1px solid ${borderC}`,
                  background: isDark ? "rgba(255,255,255,.04)" : "#f8fafc",
                  cursor: "pointer", marginBottom: 12, color: textC,
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>How to set up</span>
                {showSteps ? <ChevronUp size={14} color={subC} /> : <ChevronDown size={14} color={subC} />}
              </button>

              {showSteps && (
                <div style={{
                  marginBottom: 14, padding: "12px 14px",
                  background: isDark ? "rgba(255,255,255,.04)" : "#f0f9ff",
                  borderRadius: 12, border: `1px solid ${isDark ? borderC : "rgba(14,165,233,.15)"}`,
                }}>
                  {STEPS.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < STEPS.length - 1 ? 10 : 0 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: accent, display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 1,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "white" }}>{i + 1}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: textC, lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* QR Code */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 12, marginBottom: 16,
              }}>
                <div style={{
                  width: 188, height: 188, borderRadius: 16,
                  background: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,.15)",
                  border: `3px solid ${accent}`,
                  overflow: "hidden",
                }}>
                  {qrLoading
                    ? <RefreshCw size={28} color={accent} style={{ animation: "totpSpin 1s linear infinite" }} />
                    : qrData && !qrImgErr
                      ? <img
                          src={qrData.qrCodeDataUrl}
                          alt="TOTP QR Code"
                          style={{ width: "100%", height: "100%" }}
                          onError={() => setQrImgErr(true)}
                        />
                      : <AlertCircle size={28} color="#ef4444" />}
                </div>

                {/* Manual key */}
                {qrData && (
                  <div style={{
                    width: "100%", padding: "10px 14px",
                    background: isDark ? "rgba(255,255,255,.05)" : "#f1f5f9",
                    borderRadius: 12, border: `1px solid ${borderC}`,
                  }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10.5, color: subC, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                      Can't scan? Enter this key manually
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 2,
                        color: textC, fontFamily: "monospace", wordBreak: "break-all",
                      }}>
                        {qrData.formattedSecret}
                      </p>
                      <button
                        onClick={copySecret}
                        title="Copy key"
                        style={{
                          flexShrink: 0, width: 30, height: 30, borderRadius: 8,
                          background: copied ? `${accent}20` : "transparent",
                          border: `1px solid ${borderC}`,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          color: copied ? accent : subC, transition: "all .2s",
                        }}
                      >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: borderC }} />
                <span style={{ fontSize: 11, color: subC, fontWeight: 600 }}>ENTER 6-DIGIT CODE</span>
                <div style={{ flex: 1, height: 1, background: borderC }} />
              </div>
            </div>
          )}

          {/* ── VERIFY MODE ────────────────────────────────────── */}
          {step === "verify" && (
            <div style={{ animation: "totpSlideIn .25s ease", marginBottom: 16 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 12,
                background: isDark ? "rgba(255,255,255,.04)" : "#f0f9ff",
                border: `1px solid ${isDark ? borderC : "rgba(14,165,233,.18)"}`,
                marginBottom: 16,
              }}>
                <KeyRound size={16} color={accent} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12.5, color: textC, lineHeight: 1.5 }}>
                  Open <strong>Google Authenticator</strong> and enter the current 6-digit code for <strong>Freelancer India</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ── 6-digit code input (both modes) ─────────────────── */}
          <div
            className={shake ? "totp-shake" : ""}
            style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}
          >
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={e => handleCodeChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onFocus={e => e.currentTarget.select()}
                style={{
                  width: 44, height: 52, textAlign: "center",
                  fontSize: 22, fontWeight: 700,
                  border: `2px solid ${digit ? accent : borderC}`,
                  borderRadius: 12,
                  background: digit ? `${accent}14` : inputBg,
                  color: textC,
                  outline: "none",
                  transition: "all .15s",
                  fontFamily: "monospace",
                  boxShadow: digit ? `0 0 0 3px ${accent}20` : "none",
                  caretColor: "transparent",
                }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = accent; }}
                onBlurCapture={e => { if (!digit) e.currentTarget.style.borderColor = borderC; }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 13px",
              borderRadius: 10, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)",
              marginBottom: 12,
            }}>
              <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12.5, color: "#ef4444" }}>{error}</p>
            </div>
          )}

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={!isReady || loading}
            style={{
              width: "100%", height: 50, borderRadius: 14, border: "none",
              background: (!isReady || loading)
                ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)")
                : `linear-gradient(135deg,${accent},${accentD})`,
              color: (!isReady || loading) ? subC : "white",
              cursor: (!isReady || loading) ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 700, fontSize: 14.5, fontFamily: "inherit",
              boxShadow: isReady && !loading ? `0 6px 20px ${accent}45` : "none",
              transition: "all .2s",
            }}
          >
            {loading
              ? <><RefreshCw size={16} style={{ animation: "totpSpin 1s linear infinite" }} /> Verifying...</>
              : step === "setup"
                ? <><Shield size={16} /> Activate 2FA</>
                : <><Shield size={16} /> Verify & Continue</>}
          </button>
        </div>
      </div>
    </div>
  );
}
