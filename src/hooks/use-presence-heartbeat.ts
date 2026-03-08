import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Sends a heartbeat every 60s updating last_seen_at on the user's profile.
 * This allows the admin to determine online/offline status.
 */
export const usePresenceHeartbeat = () => {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = () => {
      supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() } as any)
        .eq("user_id", user.id)
        .then(() => {});
    };

    // Send immediately on mount
    sendHeartbeat();

    // Then every 60 seconds
    intervalRef.current = setInterval(sendHeartbeat, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);
};
