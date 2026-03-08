import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
};

/**
 * Tracks page visits via edge function to capture real server-side IP.
 * Runs once per page load. Links to profile if user is authenticated.
 */
export const useVisitorTracking = () => {
  const { profile } = useAuth();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        await supabase.functions.invoke("track-visitor", {
          body: {
            user_agent: navigator.userAgent,
            page_path: window.location.pathname,
            referrer: document.referrer || null,
            profile_id: profile?.id || null,
            device_type: getDeviceType(),
          },
        });
      } catch {
        // Silent fail
      }
    };

    trackVisit();
  }, []); // Only once per page load
};
