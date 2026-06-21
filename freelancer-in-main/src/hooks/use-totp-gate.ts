import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";

export type TotpGateMode = "idle" | "checking" | "setup" | "verify" | "done";

export function useTotpGate(sqGatePassed: boolean, userId: string | undefined) {
  const [mode, setMode] = useState<TotpGateMode>("idle");

  useEffect(() => {
    if (!sqGatePassed || !userId) { setMode("idle"); return; }

    const sessionKey = `totp_ok_${userId}`;
    if (sessionStorage.getItem(sessionKey) === "1") {
      setMode("done");
      return;
    }

    let cancelled = false;
    setMode("checking");

    (async () => {
      try {
        const token = await getToken();
        if (!token) { if (!cancelled) setMode("setup"); return; }

        const res = await callEdgeFunction("totp-status", { token });
        const json = await res.json();
        if (cancelled) return;
        setMode(json.setup ? "verify" : "setup");
      } catch {
        if (!cancelled) setMode("setup");
      }
    })();

    return () => { cancelled = true; };
  }, [sqGatePassed, userId]);

  const markTotpDone = useCallback(() => {
    if (userId) sessionStorage.setItem(`totp_ok_${userId}`, "1");
    setMode("done");
  }, [userId]);

  return { totpMode: mode, markTotpDone };
}
