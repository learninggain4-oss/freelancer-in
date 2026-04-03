import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MpinGateMode = "checking" | "create" | "verify" | "done";

export function useMpinGate(userType: string) {
  const { user } = useAuth();
  const [mode, setMode] = useState<MpinGateMode>("checking");

  useEffect(() => {
    if (userType !== "employee" || !user) {
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
  }, [user?.id, userType]);

  const markVerified = useCallback(() => {
    if (user?.id) sessionStorage.setItem(`mpin_ok_${user.id}`, "1");
    setMode("done");
  }, [user?.id]);

  return { mode, markVerified };
}
