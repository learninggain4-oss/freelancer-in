import { useCallback, useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const DISMISS_KEY = "location-prompt-dismissed-session";

type LocationPermissionState = PermissionState | "unsupported";

const readDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

const writeDismissed = () => {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {}
};

const clearDismissed = () => {
  try {
    sessionStorage.removeItem(DISMISS_KEY);
  } catch {}
};

const getPermissionState = async (): Promise<LocationPermissionState> => {
  if (typeof navigator === "undefined" || !navigator.geolocation) return "unsupported";

  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return status.state;
    }
  } catch {}

  return "prompt";
};

/**
 * Shows a banner that requests geolocation permission via a real user gesture.
 * Browsers (especially Android Chrome / installed PWAs) will only show the
 * native permission prompt when getCurrentPosition() is called from a user
 * gesture (click/tap). Calling it on page load silently fails — which is
 * why the OS App Permissions page shows "No permissions denied".
 */
const LocationPermissionBanner = () => {
  const { profile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>("prompt");
  const [errorMessage, setErrorMessage] = useState("");

  const syncLocation = useCallback(
    async (coords: GeolocationCoordinates) => {
      if (!profile?.id) return;

      const { error } = await supabase.functions.invoke("track-visitor", {
        body: {
          user_agent: navigator.userAgent,
          page_path: window.location.pathname,
          referrer: document.referrer || null,
          profile_id: profile.id,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
          browser_latitude: coords.latitude,
          browser_longitude: coords.longitude,
          browser_accuracy: coords.accuracy,
        },
      });

      if (error) throw new Error(error.message || "Failed to save location");
    },
    [profile?.id],
  );

  const refreshPermissionState = useCallback(async () => {
    if (!profile?.id) {
      setVisible(false);
      return;
    }

    const nextState = await getPermissionState();
    setPermissionState(nextState);

    if (nextState === "unsupported") {
      setVisible(false);
      return;
    }

    if (nextState === "granted") {
      clearDismissed();
      setErrorMessage("");
      setVisible(false);
      return;
    }

    if (nextState === "denied") {
      setErrorMessage("Location is blocked. Please enable it from your browser or app settings.");
      setVisible(true);
      return;
    }

    setErrorMessage("");
    setVisible(!readDismissed());
  }, [profile?.id]);

  useEffect(() => {
    refreshPermissionState();

    const handleFocus = () => {
      refreshPermissionState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshPermissionState();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshPermissionState]);

  const requestPermission = () => {
    if (busy || !profile?.id) return;

    setBusy(true);
    clearDismissed();
    setErrorMessage("");
    if (permissionState === "denied") {
      setPermissionState("prompt");
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await syncLocation(pos.coords);
          setPermissionState("granted");
          setVisible(false);
          toast({ title: "Location enabled", description: "Thanks! Your wallet account is now more secure (100%)." });
        } catch (error: any) {
          setPermissionState("prompt");
          setVisible(true);
          setErrorMessage(error?.message || "Failed to save location.");
          toast({
            title: "Couldn't save location",
            description: error?.message || "Please try again.",
            variant: "destructive",
          });
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState("denied");
          setVisible(true);
          setErrorMessage("Location was blocked. Please allow it from your browser or app settings.");
          toast({
            title: "Location blocked",
            description: "Please allow location access to continue and keep your wallet account secure.",
            variant: "destructive",
          });
        } else {
          setPermissionState("prompt");
          setVisible(true);
          setErrorMessage(err.message || "Couldn't get your location.");
          toast({ title: "Couldn't get location", description: err.message, variant: "destructive" });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const dismiss = () => {
    writeDismissed();
    setVisible(false);
  };

  if (!visible || !profile?.id || permissionState === "unsupported") return null;

  const isBlocked = permissionState === "denied";
  const description = isBlocked
    ? "Location access is blocked. Open app/browser settings, enable Location permission, then tap Try again."
    : 'Tap "Allow location" and accept the browser prompt to help secure your wallet account and ensure smooth access to location-based features.';

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        className="fixed left-1/2 top-1/2 z-[61] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-4 shadow-2xl"
        role="dialog"
        aria-label="Enable location permission"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="rounded-full bg-primary/15 p-2 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Enable live location</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            {errorMessage ? <p className="mt-2 text-xs font-medium text-destructive">{errorMessage}</p> : null}
            {isBlocked ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                If Location is missing in app permissions, enable browser/site location access first and then tap Try
                again.
              </p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={requestPermission}
                disabled={busy}
                className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Requesting…" : isBlocked ? "Try again" : "Allow location"}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationPermissionBanner;
