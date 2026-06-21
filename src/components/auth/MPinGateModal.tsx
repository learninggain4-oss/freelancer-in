import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  Delete,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Smartphone,
  ShieldQuestion,
  KeyRound,
  ChevronLeft,
  CheckCircle2,
  LockKeyhole,
  Clock,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";
import { isFunctionUnavailableError, readFunctionJson } from "@/lib/function-response";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";

interface Props {
  mode: "create" | "verify";
  theme: DashboardTheme;
  onVerified: () => void;
  onSkip?: () => void; // Skip ബട്ടണിനായുള്ള പുതിയ പ്രോപ്പ്
}

type ForgotStep = "loading" | "choice" | "totp" | "sq" | "new-pin-enter" | "new-pin-confirm" | "success";

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
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

function getMpinErrorMessage(error: unknown, fallback = "M-Pin is not available right now. Please try again later.") {
  if (isFunctionUnavailableError(error)) return fallback;
  if (!(error instanceof Error)) return "Something went wrong. Please try again.";

  const msg = error.message?.trim() ?? "";
  if (!msg) return "Something went wrong. Please try again.";

  const lowered = msg.toLowerCase();
  if (
    lowered.includes("unexpected token") ||
    lowered.includes("doctype") ||
    lowered.includes("valid json") ||
    lowered.includes("failed to fetch") ||
    lowered.includes("networkerror")
  ) {
    return fallback;
  }

  return msg;
}

export default function MPinGateModal({ mode, theme, onVerified, onSkip }: Props) {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [masked, setMasked] = useState(true);
  const [shake, setShake] = useState(false);

  const [blocked, setBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);

  const [forgot, setForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("loading");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [hasTotp, setHasTotp] = useState(false);
  const [hasSq, setHasSq] = useState(false);
  const [sqOptions, setSqOptions] = useState<{ idx: number; question: string }[]>([]);
  const [sqAnswers, setSqAnswers] = useState(["", "", ""]);
  const [totpBoxes, setTotpBoxes] = useState(["", "", "", "", "", ""]);
  const [newPinFirst, setNewPinFirst] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinShake, setNewPinShake] = useState(false);

  const hiddenRef = useRef<HTMLInputElement>(null);
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    injectCSS();
  }, []);

  useEffect(() => {
    if (mode !== "verify") return;
    (async () => {
      try {
        const token = await getToken();
        const res = await callEdgeFunction("mpin-status", { token });
        const json = await readFunctionJson<{ blocked?: boolean; blockedUntil?: string; attemptsLeft?: number }>(
          res,
          "M-Pin is not available right now.",
        );
        if (json.blocked && json.blockedUntil) {
          const until = new Date(json.blockedUntil);
          if (until > new Date()) {
            setBlocked(true);
            setBlockedUntil(until);
            setAttemptsLeft(0);
            setTimeLeft(Math.ceil((until.getTime() - Date.now()) / 1000));
            return;
          }
        }
        setAttemptsLeft(json.attemptsLeft ?? 3);
      } catch {
        /* ignore */
      }
    })();
  }, [mode]);

  useEffect(() => {
    if (!blocked || !blockedUntil) return;
    const tick = () => {
      const secs = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
      if (secs <= 0) {
        setBlocked(false);
        setBlockedUntil(null);
        setAttemptsLeft(3);
        setTimeLeft(0);
      } else setTimeLeft(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [blocked, blockedUntil]);

  useEffect(() => {
    if (!forgot) setTimeout(() => hiddenRef.current?.focus(), 300);
  }, [step, forgot]);

  const isDark = theme === "black";
  const accent = isDark
    ? "#818cf8"
    : theme === "warm"
      ? "#d97706"
      : theme === "forest"
        ? "#16a34a"
        : theme === "ocean"
          ? "#0284c7"
          : "#4f46e5";
  const accentD = isDark
    ? "#6366f1"
    : theme === "warm"
      ? "#b45309"
      : theme === "forest"
        ? "#15803d"
        : theme === "ocean"
          ? "#0369a1"
          : "#3730a3";
  const cardBg = isDark ? "#0f172a" : "#ffffff";
  const ovBg = isDark ? "rgba(0,0,0,.88)" : "rgba(15,23,42,.75)";
  const textC = isDark ? "#f1f5f9" : "#0f172a";
  const subC = isDark ? "#94a3b8" : "#64748b";
  const btnBg = isDark ? "#1e293b" : "#f1f5f9";
  const btnHov = isDark ? "#334155" : "#e2e8f0";
  const borderC = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const inputBg = isDark ? "#1e293b" : "#f8fafc";
  const hdr = `linear-gradient(135deg,${accent},${accentD})`;

  const triggerShake = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 500);
  };

  const openForgot = useCallback(async () => {
    setForgot(true);
    setForgotStep("loading");
    try {
      const token = await getToken();
      const res = await callEdgeFunction("forgot-mpin-options", { token });
      const json = await readFunctionJson<{
        hasTotp?: boolean;
        hasSq?: boolean;
        sqQuestions?: { idx: number; question: string }[];
      }>(res, "M-Pin recovery is not available right now.");
      setHasTotp(!!json.hasTotp);
      setHasSq(!!json.hasSq);
      setSqOptions(json.sqQuestions || []);
      setForgotStep("choice");
    } catch {
      setForgotStep("choice");
    }
  }, []);

  const handleProceed = useCallback(async () => {
    if (pin.length < PIN_LEN || loading || blocked) return;
    if (mode === "create") {
      if (step === "enter") {
        setFirstPin(pin);
        setPin("");
        setStep("confirm");
        return;
      }
      if (pin !== firstPin) {
        setError("PINs do not match. Try again.");
        triggerShake(setShake);
        setPin("");
        return;
      }
    }
    setLoading(true);
    try {
      const token = await getToken();
      const fnName = mode === "create" ? "mpin-set" : "mpin-verify";
      const res = await callEdgeFunction(fnName, { body: { pin }, token });

      let json: { blocked?: boolean; blockedUntil?: string; valid?: boolean; attemptsLeft?: number; error?: string } =
        {};
      try {
        json = await res.json();
      } catch {}

      if (json.blocked && json.blockedUntil) {
        setBlocked(true);
        setBlockedUntil(new Date(json.blockedUntil));
        return;
      }

      if (!res.ok || json.error) throw new Error(json.error || "M-Pin is not available.");

      if (mode === "verify" && !json.valid) {
        setError("Incorrect M-Pin");
        triggerShake(setShake);
        setPin("");
        return;
      }
      onVerified();
    } catch (err: unknown) {
      setError(getMpinErrorMessage(err));
      triggerShake(setShake);
      setPin("");
    } finally {
      setLoading(false);
    }
  }, [pin, mode, step, firstPin, loading, blocked, onVerified]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: ovBg,
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 370,
          background: cardBg,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,.35)",
          border: `1px solid ${borderC}`,
          position: "relative", // Skip ബട്ടണിനായി
        }}
      >
        {/* ── SKIP BUTTON ────────────────────────── */}
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              position: "absolute",
              top: 15,
              right: 15,
              zIndex: 10,
              background: "rgba(255,255,255,.2)",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Skip <X size={14} />
          </button>
        )}

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ background: hdr, padding: "22px 22px 18px" }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "white" }}>
            {mode === "create" ? "Set M-Pin" : "Enter M-Pin"}
          </p>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div style={{ padding: "22px 22px 26px" }}>
          {/* PIN Logic UI remains the same as in your provided code */}
          <div
            className={shake ? "mpin-dots-shake" : ""}
            style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 22 }}
          >
            {Array.from({ length: PIN_LEN }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 13,
                  border: `2px solid ${i < pin.length ? accent : borderC}`,
                  background: i < pin.length ? `${accent}18` : "transparent",
                }}
              />
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
            {NUMPAD.flat().map((key, idx) => (
              <button
                key={idx}
                onClick={() =>
                  key === "⌫" ? setPin((p) => p.slice(0, -1)) : pin.length < PIN_LEN && setPin(pin + key)
                }
                style={{
                  height: 54,
                  borderRadius: 13,
                  background: btnBg,
                  border: `1px solid ${borderC}`,
                  fontSize: 21,
                }}
              >
                {key === "⌫" ? <Delete size={21} color={subC} /> : key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
