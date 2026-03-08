import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks on mount whether the visitor's IP is blocked.
 * Returns { blocked, loading }.
 */
export const useIpBlockCheck = () => {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await supabase.functions.invoke("check-ip-block");
        if (data?.blocked) {
          setBlocked(true);
        }
      } catch {
        // fail-open: don't block if check fails
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  return { blocked, loading };
};
