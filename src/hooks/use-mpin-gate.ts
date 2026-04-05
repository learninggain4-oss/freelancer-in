import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isFunctionUnavailableError, readFunctionJson } from "@/lib/function-response";
import { callEdgeFunction } from "@/lib/supabase-functions";

export type MpinGateMode = "checking" | "create" | "verify" | "done";

export function useMpinGate(_userType?: string) {
  const { user } = useAuth();
  const [mode, setMode] = useState<MpinGateMode>("checking");
  const [loginTick, setLoginTick] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setMode("checking");
        setLoginTick(t => t + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setMode("done");
      return;
    }

    const key = `mpin_ok_${user.id}`;
    if (sessionStorage.getItem(key) === "1") {
      setMode("done");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { if (!cancelled) setMode("create"); return; }

        const res = await callEdgeFunction("mpin-status", { token });
        const json = await readFunctionJson<{ hasPin?: boolean }>(res, "M-Pin is not available right now.");
        if (!cancelled) setMode(json.hasPin ? "verify" : "create");
      } catch (error) {
        if (cancelled) return;
        setMode(isFunctionUnavailableError(error) ? "done" : "create");
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, loginTick]);

  const markVerified = useCallback(() => {
    if (user?.id) sessionStorage.setItem(`mpin_ok_${user.id}`, "1");
    setMode("done");
  }, [user?.id]);

  return { mode, markVerified };
}
