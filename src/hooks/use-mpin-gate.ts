import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MpinGateMode = "checking" | "create" | "verify" | "done";

export function useMpinGate(_userType?: string) {
  const { user } = useAuth();
  const [mode, setMode] = useState<MpinGateMode>("checking");
  // Increments every time a fresh SIGNED_IN event fires → forces gate re-check
  const [loginTick, setLoginTick] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // Reset gate state so the check runs fresh even for the same userId
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

    // sessionStorage flag is cleared in AuthContext on SIGNED_OUT,
    // so after every fresh login this will always be missing.
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

        const res = await fetch("/functions/v1/mpin-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!cancelled) setMode(json.hasPin ? "verify" : "create");
      } catch {
        if (!cancelled) setMode("create");
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
