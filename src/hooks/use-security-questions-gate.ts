import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";

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
        const token = await getToken();
        if (!token) { if (!cancelled) setStatus("show"); return; }

        const res = await callEdgeFunction("security-questions-status", { token });
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
