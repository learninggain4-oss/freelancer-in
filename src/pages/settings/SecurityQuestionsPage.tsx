import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, ChevronDown, ChevronUp, Eye, EyeOff, Check, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";
import { toast } from "@/hooks/use-toast";

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

const MIN_REQUIRED = 3;

const SecurityQuestionsPage = () => {
  const navigate = useNavigate();
  const [answers, setAnswers]       = useState<string[]>(Array(10).fill(""));
  const [revealed, setRevealed]     = useState<boolean[]>(Array(10).fill(false));
  const [expanded, setExpanded]     = useState<number | null>(0);
  const [errors, setErrors]         = useState<string[]>(Array(10).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [saved, setSaved]           = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (expanded !== null) {
      setTimeout(() => inputRefs.current[expanded!]?.focus(), 200);
    }
  }, [expanded]);

  const answered = answers.filter(a => a.trim().length > 0).length;
  const allDone  = answered >= MIN_REQUIRED;

  const setAnswer = (idx: number, val: string) => {
    setAnswers(prev => { const n = [...prev]; n[idx] = val; return n; });
    if (errors[idx]) setErrors(prev => { const n = [...prev]; n[idx] = ""; return n; });
  };

  const toggleReveal = (idx: number) => {
    setRevealed(prev => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  };

  const handleSubmit = async () => {
    if (answered < MIN_REQUIRED) {
      setGlobalError(`Please answer at least ${MIN_REQUIRED} questions to continue.`);
      return;
    }
    setGlobalError("");
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expired. Please log in again.");
      const res  = await callEdgeFunction("security-questions-save", { body: { answers }, token });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setSaved(true);
      toast({ title: "Security questions saved!", description: "Your answers have been saved securely." });
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Security Questions</h1>
          <p className="text-sm text-muted-foreground">Answer at least {MIN_REQUIRED} questions to secure your account</p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <Check className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">Security questions saved successfully!</p>
        </div>
      )}

      {/* Progress */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground uppercase tracking-wide">Progress (min. {MIN_REQUIRED} required)</span>
          <span className={answered >= MIN_REQUIRED ? "text-green-600" : "text-muted-foreground"}>{answered} / 10 answered</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(answered / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-2">
        {QUESTIONS.map((q, idx) => {
          const isExpanded = expanded === idx;
          const hasAnswer  = answers[idx].trim().length > 0;

          return (
            <div key={idx} className="overflow-hidden rounded-xl border bg-card">
              <button
                onClick={() => setExpanded(isExpanded ? null : idx)}
                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${hasAnswer ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {hasAnswer ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span className="flex-1 text-sm font-medium leading-snug">{q}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="border-t px-3 pb-3 pt-2">
                  <div className="relative flex items-center gap-2">
                    <input
                      ref={el => { inputRefs.current[idx] = el; }}
                      type={revealed[idx] ? "text" : "password"}
                      value={answers[idx]}
                      onChange={e => setAnswer(idx, e.target.value)}
                      placeholder="Type your answer..."
                      onKeyDown={e => { if (e.key === "Enter") setExpanded(idx < 9 ? idx + 1 : null); }}
                      className="h-10 w-full rounded-lg border bg-background px-3 pr-9 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                    <button
                      onClick={() => toggleReveal(idx)}
                      className="absolute right-2.5 text-muted-foreground"
                      type="button"
                    >
                      {revealed[idx] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {idx < 9 && (
                    <button
                      onClick={() => setExpanded(idx + 1)}
                      className="mt-2 text-xs font-semibold text-primary"
                      type="button"
                    >
                      Next question →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {globalError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-600 dark:border-red-800 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{globalError}</p>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Your answers are encrypted and stored securely. They may be used to verify your identity later.
      </p>

      <Button
        onClick={handleSubmit}
        disabled={submitting || !allDone}
        className="w-full gap-2"
        size="lg"
      >
        {submitting
          ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving securely...</>
          : !allDone
            ? <><ShieldCheck className="h-4 w-4" /> Answer {MIN_REQUIRED - answered} more question{MIN_REQUIRED - answered !== 1 ? "s" : ""} to continue</>
            : <><ShieldCheck className="h-4 w-4" /> Save Security Questions</>}
      </Button>
    </div>
  );
};

export default SecurityQuestionsPage;
