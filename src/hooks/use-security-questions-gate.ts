import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type SqStatus = "idle" | "checking" | "show" | "passed";

export function useSecurityQuestionsGate(mpinDone: boolean, userId: string | undefined) {
  const [status, setStatus] = useState<SqStatus>("idle");

  useEffect(() => {
    if (!mpinDone || !userId) { setStatus("idle"); return; }

    const cacheKey = `sq_done_${userId}`;
    if (sessionStorage.getItem(cacheKey) === "1") {
      setStatus("passed");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { if (!cancelled) setStatus("show"); return; }

        const res = await fetch("/functions/v1/security-questions-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.done) {
          sessionStorage.setItem(cacheKey, "1");
          setStatus("passed");
        } else {
          setStatus("show");
        }
      } catch {
        if (!cancelled) setStatus("show");
      }
    })();

    return () => { cancelled = true; };
  }, [mpinDone, userId]);

  const markQuestionsDone = useCallback(() => {
    if (userId) sessionStorage.setItem(`sq_done_${userId}`, "1");
    setStatus("passed");
  }, [userId]);

  return {
    showQuestions: status === "show",
    sqGatePassed: status === "passed",
    markQuestionsDone,
  };
}
