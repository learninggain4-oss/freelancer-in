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
 * Tracks page visits by inserting into site_visitors.
 * Runs once per page load. Links to profile if user is authenticated.
 */
export const useVisitorTracking = () => {
  const { profile } = useAuth();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Get IP info
        let ip_address: string | null = null;
        let city: string | null = null;
        let country: string | null = null;
        try {
          const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = await res.json();
            ip_address = data.ip || null;
            city = data.city || null;
            country = data.country_name || null;
          }
        } catch {
          // Silent fail - IP lookup is optional
        }

        await supabase.from("site_visitors" as any).insert({
          ip_address,
          user_agent: navigator.userAgent,
          page_path: window.location.pathname,
          referrer: document.referrer || null,
          profile_id: profile?.id || null,
          city,
          country,
          device_type: getDeviceType(),
        });
      } catch {
        // Silent fail
      }
    };

    trackVisit();
  }, []); // Only once per page load
};
