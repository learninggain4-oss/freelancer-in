import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSecurityQuestionsGate(mpinDone: boolean, userId: string | undefined) {
  const [showQuestions, setShowQuestions] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!mpinDone || !userId) return;

    // Session-level cache so we don't refetch on every re-render
    const cacheKey = `sq_done_${userId}`;
    if (sessionStorage.getItem(cacheKey) === "1") return;

    let cancelled = false;
    setChecking(true);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { if (!cancelled) setShowQuestions(true); return; }

        const res = await fetch("/functions/v1/security-questions-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.done) {
          sessionStorage.setItem(cacheKey, "1");
        } else {
          setShowQuestions(true);
        }
      } catch {
        if (!cancelled) setShowQuestions(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => { cancelled = true; };
  }, [mpinDone, userId]);

  const markQuestionsDone = useCallback(() => {
    if (userId) sessionStorage.setItem(`sq_done_${userId}`, "1");
    setShowQuestions(false);
  }, [userId]);

  return { showQuestions, checking, markQuestionsDone };
}
