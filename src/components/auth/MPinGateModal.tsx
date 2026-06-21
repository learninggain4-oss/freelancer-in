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
  SkipForward, // SkipForward ഇക്കൺ ചേർത്തു
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";
import { isFunctionUnavailableError, readFunctionJson } from "@/lib/function-response";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";

interface Props {
  mode: "create" | "verify";
  theme: DashboardTheme;
  onVerified: () => void;
  canSkip?: boolean; // Skip ചെയ്യാൻ അനുവദിക്കണോ എന്ന് തീരുമാനിക്കാൻ
}

// ... (ബാക്കി എല്ലാ functions ഉം പഴയതുപോലെ നിലനിർത്തുക: injectCSS, getMpinErrorMessage, NUMPAD, തുടങ്ങിയവ)

export default function MPinGateModal({ mode, theme, onVerified, canSkip = false }: Props) {
  /* ── Normal flow state ─────────────────────────────────────────── */
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState("");
  // ... (മറ്റ് എല്ലാ state കളും പഴയതുപോലെ)

  // ... (useEffect, handleProceed, triggerShake തുടങ്ങിയ എല്ലാ ഫംഗ്‌ഷനുകളും പഴയതുപോലെ തുടരുക)

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
      {/* ... */}

      {/* ── Body ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* ... (ബാക്കി കണ്ടന്റുകൾ) ... */}

        {/* ── Bottom controls ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            padding: "0 22px",
          }}
        >
          <button
            onClick={() => setMasked((m) => !m)}
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
            {masked ? <Eye size={14} /> : <EyeOff size={14} />} {masked ? "Show PIN" : "Hide PIN"}
          </button>

          {/* ഇവിടെ Skip ബട്ടൺ ചേർത്തു */}
          {canSkip && (
            <button
              onClick={onVerified}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: accent,
                fontSize: 12,
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              <SkipForward size={14} /> Skip
            </button>
          )}

          {/* ... (ബാക്കി ബട്ടണുകൾ) ... */}
        </div>
      </div>
    </div>
  );
}

// ... (ErrorBanner, BackBtn, primaryBtn പഴയതുപോലെ നിലനിർത്തുക)
