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
  SkipForward,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";
import { isFunctionUnavailableError, readFunctionJson } from "@/lib/function-response";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";

interface Props {
  mode: "create" | "verify";
  theme: DashboardTheme;
  onVerified: () => void;
  onSkip?: () => void; // Added onSkip prop
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

function getMpinErrorMessage(error: unknown, fallback = "M-Pin is not available right now.") {
  if (isFunctionUnavailableError(error)) return fallback;
  if (!(error instanceof Error)) return "Something went wrong.";
  return error.message || fallback;
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

  // (Include previous logic functions: openForgot, handleTotp, verifyTotp, verifySq, addNewPinDigit, handleProceed etc.)
  // Note: For brevity in this response, ensure all your original helper functions are kept intact.

  const triggerShake = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 500);
  };

  // ... (Rest of your original logic code) ...

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
      {/* ... header and body content ... */}

      {/* Added Skip Button Example in Bottom Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
        {/* ... existing buttons ... */}
        {mode === "create" && onSkip && (
          <button
            onClick={onSkip}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: subC,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            <SkipForward size={14} /> Skip
          </button>
        )}
      </div>
    </div>
  );
}
