import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Tracks PWA install prompt status and standalone mode for the current user.
 * Upserts to pwa_install_status table.
 */
export const usePwaInstallTracking = () => {
  const { profile } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (!profile?.id || tracked.current) return;
    tracked.current = true;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    const upsert = async (extra: Record<string, any> = {}) => {
      await supabase.from("pwa_install_status" as any).upsert(
        {
          profile_id: profile.id,
          is_standalone: isStandalone,
          is_installed: isStandalone,
          user_agent: navigator.userAgent,
          last_checked_at: new Date().toISOString(),
          ...extra,
        },
        { onConflict: "profile_id" }
      );
    };

    // Initial track
    upsert();

    // Listen for install prompt
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      upsert({ prompt_shown: true });

      const deferredPrompt = e as any;
      // Listen for user choice
      deferredPrompt.userChoice?.then?.((choice: any) => {
        upsert({
          prompt_shown: true,
          prompt_accepted: choice.outcome === "accepted",
          is_installed: choice.outcome === "accepted",
        });
      });
    };

    const handleInstalled = () => {
      upsert({ is_installed: true, prompt_accepted: true });
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [profile?.id]);
};
