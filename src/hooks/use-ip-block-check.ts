import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks on mount whether the visitor's IP is blocked.
 * Returns { blocked, loading }.
 * loading starts as false so the app renders immediately;
 * blocked is set to true only if the check confirms a block.
 */
export const useIpBlockCheck = () => {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await supabase.functions.invoke("check-ip-block");
        if (data?.blocked) {
          setBlocked(true);
        }
      } catch {
        // fail-open: don't block if check fails
      }
    };
    check();
  }, []);

  return { blocked, loading };
};
