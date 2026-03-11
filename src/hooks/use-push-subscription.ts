import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw-push.js");
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const subJson = subscription.toJSON();
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return;

        // Upsert to Supabase
        const { error } = await supabase
          .from("push_subscriptions" as any)
          .upsert(
            {
              user_id: user.id,
              profile_id: profile?.id || null,
              endpoint: subJson.endpoint,
              p256dh: subJson.keys.p256dh,
              auth_key: subJson.keys.auth,
            },
            { onConflict: "user_id,endpoint" }
          );

        if (error) console.error("Push subscription save error:", error);
      } catch (err) {
        console.error("Push subscription error:", err);
      }
    };

    subscribe();

    // Listen for subscription changes from SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        subscribe();
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [user, profile]);
}
