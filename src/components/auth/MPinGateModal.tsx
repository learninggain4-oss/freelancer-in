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
  canSkip?: boolean;
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
    @keyframes mpinShake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)} }
    @keyframes mpinBounce { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 70%{transform:scale(.88)} 100%{transform:scale(1)} }
    @keyframes mpinFadeIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
    @keyframes mpinSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
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

export default function MPinGateModal({ mode, theme, onVerified, canSkip = false }: Props) {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [masked, setMasked] = useState(true);
  const [shake, setShake] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("loading");

  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    injectCSS();
  }, []);

  const isDark = theme === "black";
  const accent = isDark ? "#818cf8" : "#4f46e5";
  const cardBg = isDark ? "#0f172a" : "#ffffff";
  const ovBg = isDark ? "rgba(0,0,0,.88)" : "rgba(15,23,42,.75)";
  const textC = isDark ? "#f1f5f9" : "#0f172a";
  const subC = isDark ? "#94a3b8" : "#64748b";
  const borderC = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";

  const addDigit = useCallback(
    (d: string) => {
      if (d === "⌫") {
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (pin.length >= PIN_LEN) return;
      setPin(pin + d);
    },
    [pin],
  );

  const handleProceed = async () => {
    // Logic for verification...
    onVerified();
  };

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
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 370,
          background: cardBg,
          borderRadius: 24,
          overflow: "hidden",
          border: `1px solid ${borderC}`,
        }}
      >
        <div style={{ padding: "22px" }}>
          {/* PIN UI */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 22 }}>
            {Array.from({ length: PIN_LEN }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 13,
                  border: `2px solid ${i < pin.length ? accent : borderC}`,
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <button
              onClick={() => setMasked(!masked)}
              style={{ background: "none", border: "none", color: subC, fontSize: 12, cursor: "pointer" }}
            >
              {masked ? "Show PIN" : "Hide PIN"}
            </button>

            {/* Skip Button Here */}
            {canSkip && (
              <button
                onClick={onVerified}
                style={{
                  background: "none",
                  border: "none",
                  color: accent,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontWeight: 700,
                }}
              >
                <SkipForward size={14} /> Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
