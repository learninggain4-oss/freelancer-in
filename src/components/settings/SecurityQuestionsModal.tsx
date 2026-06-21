import { useState, useRef, useEffect } from "react";
import { ShieldCheck, ChevronDown, ChevronUp, Eye, EyeOff, Check, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";

interface Props {
  theme: DashboardTheme;
  onDone: () => void;
}

const QUESTIONS = [
  "What is the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your primary school?",
  "What city were you born in?",
  "What is the name of your best childhood friend?",
  "What was your childhood nickname?",
  "What is the name of the street you grew up on?",
  "What is your oldest sibling's first name?",
  "What was the make and model of your first vehicle?",
  "What is your all-time favourite food?",
];

const CSS_ID = "sq-gate-css";
function injectCSS() {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement("style");
  s.id = CSS_ID;
  s.textContent = `
@keyframes sqFadeIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes sqSpin   { to{transform:rotate(360deg)} }
@keyframes sqPulse  { 0%,100%{opacity:1} 50%{opacity:.55} }
  `;
  document.head.appendChild(s);
}

export default function SecurityQuestionsModal({ theme, onDone }: Props) {
  const [answers, setAnswers]     = useState<string[]>(Array(10).fill(""));
  const [revealed, setRevealed]   = useState<boolean[]>(Array(10).fill(false));
  const [expanded, setExpanded]   = useState<number | null>(0);
  const [errors, setErrors]       = useState<string[]>(Array(10).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => {
    if (expanded !== null) {
      setTimeout(() => inputRefs.current[expanded]?.focus(), 200);
    }
  }, [expanded]);

  const isDark   = theme === "black";
  const accent   = theme === "black" ? "#818cf8" : theme === "warm" ? "#d97706" : theme === "forest" ? "#16a34a" : theme === "ocean" ? "#0284c7" : "#4f46e5";
  const accentD  = theme === "black" ? "#6366f1" : theme === "warm" ? "#b45309" : theme === "forest" ? "#15803d" : theme === "ocean" ? "#0369a1" : "#3730a3";
  const cardBg   = isDark ? "#0f172a" : "#ffffff";
  const overlayBg= isDark ? "rgba(0,0,0,.9)" : "rgba(15,23,42,.78)";
  const textC    = isDark ? "#f1f5f9" : "#0f172a";
  const subC     = isDark ? "#94a3b8" : "#64748b";
  const borderC  = isDark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.09)";
  const rowBg    = isDark ? "#1e293b" : "#f8fafc";
  const rowBgH   = isDark ? "#263044" : "#f1f5f9";
  const inputBg  = isDark ? "rgba(255,255,255,.06)" : "#ffffff";
  const hdr      = `linear-gradient(135deg, ${accent} 0%, ${accentD} 100%)`;

  const MIN_REQUIRED = 3;
  const answered = answers.filter(a => a.trim().length > 0).length;
  const allDone  = answered >= MIN_REQUIRED;

  const setAnswer = (idx: number, val: string) => {
    setAnswers(prev => { const n=[...prev]; n[idx]=val; return n; });
    if (errors[idx]) setErrors(prev => { const n=[...prev]; n[idx]=""; return n; });
  };

  const toggleReveal = (idx: number) => {
    setRevealed(prev => { const n=[...prev]; n[idx]=!n[idx]; return n; });
  };

  const validateAll = () => {
    if (answered < MIN_REQUIRED) {
      setGlobalError(`Please answer at least ${MIN_REQUIRED} questions to continue.`);
      return false;
    }
    setErrors(Array(10).fill(""));
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    setSubmitting(true);
    setGlobalError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expired. Please log in again.");

      const res = await callEdgeFunction("security-questions-save", { body: { answers }, token });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      onDone();
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10001,
      background: overlayBg, backdropFilter: "blur(14px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0",
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        background: cardBg,
        borderRadius: "24px 24px 0 0",
        maxHeight: "92dvh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -16px 60px rgba(0,0,0,.35), 0 -4px 20px rgba(0,0,0,.2)",
        border: `1px solid ${borderC}`,
        borderBottom: "none",
        animation: "sqFadeIn .35s cubic-bezier(.22,1,.36,1)",
        overflow: "hidden",
      }}>

        <div style={{ background: hdr, padding: "22px 24px 18px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: "rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,.2)", flexShrink: 0,
            }}>
              <ShieldCheck size={22} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "white", letterSpacing: "-.3px" }}>
                Security Questions
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "rgba(255,255,255,.8)" }}>
                Set up 10 questions to secure your account
              </p>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.75)", fontWeight: 600 }}>
                ANSWERED (min. {MIN_REQUIRED} required)
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.9)", fontWeight: 700 }}>
                {answered} / 10
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.25)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${(answered / 10) * 100}%`,
                background: answered >= MIN_REQUIRED ? "white" : "rgba(255,255,255,.7)",
                transition: "width .3s ease",
              }} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {QUESTIONS.map((q, idx) => {
            const isExpanded = expanded === idx;
            const hasAnswer  = answers[idx].trim().length > 0;
            const hasError   = !!errors[idx];

            return (
              <div key={idx} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : idx)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 14px",
                    background: isExpanded ? `${accent}18` : rowBg,
                    border: `1.5px solid ${isExpanded ? accent : hasError ? "#ef4444" : borderC}`,
                    borderRadius: isExpanded ? "14px 14px 0 0" : 14,
                    cursor: "pointer", textAlign: "left",
                    transition: "all .15s",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: hasAnswer ? accent : hasError ? "#ef4444" : borderC,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {hasAnswer
                      ? <Check size={13} color="white" />
                      : <span style={{ fontSize: 11, fontWeight: 700, color: hasError ? "white" : subC }}>{idx + 1}</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: hasError ? "#ef4444" : textC }}>{q}</span>
                  {isExpanded ? <ChevronUp size={16} color={accent} /> : <ChevronDown size={16} color={subC} />}
                </button>

                {isExpanded && (
                  <div style={{
                    background: rowBg,
                    border: `1.5px solid ${accent}`,
                    borderTop: "none",
                    borderRadius: "0 0 14px 14px",
                    padding: "10px 14px 12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                      <input
                        ref={el => { inputRefs.current[idx] = el; }}
                        type={revealed[idx] ? "text" : "password"}
                        value={answers[idx]}
                        onChange={e => setAnswer(idx, e.target.value)}
                        placeholder="Type your answer..."
                        style={{
                          flex: 1, height: 40, borderRadius: 10,
                          border: `1px solid ${errors[idx] ? "#ef4444" : borderC}`,
                          background: inputBg, color: textC, fontSize: 13.5,
                          paddingLeft: 12, paddingRight: 40, outline: "none",
                        }}
                      />
                      <button
                        onClick={() => toggleReveal(idx)}
                        style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: subC }}
                      >
                        {revealed[idx] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "14px 16px 20px", borderTop: `1px solid ${borderC}`, background: cardBg, flexShrink: 0 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%", height: 50, borderRadius: 14, border: "none",
              background: allDone ? hdr : (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)"),
              color: allDone ? "white" : subC,
              cursor: allDone ? "pointer" : "default",
              fontWeight: 700, fontSize: 14.5,
            }}
          >
            {submitting ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
