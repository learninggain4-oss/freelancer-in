/**
 * OneSignal Web SDK integration.
 * Uses the CDN-loaded OneSignalDeferred global.
 */

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string || "c2875b6b-8c7c-4190-b65b-b424dcd3c67d";
const ONESIGNAL_READY_TIMEOUT_MS = 15000;

const oneSignalInitOptions = {
  appId: ONESIGNAL_APP_ID,
  allowLocalhostAsSecureOrigin: true,
  notifyButton: { enable: false },
  serviceWorkerParam: { scope: "/" },
  serviceWorkerPath: "/OneSignalSDKWorker.js",
  serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

let loggedInExternalId: string | null = null;
let loginInFlight = false;
let oneSignalReadyPromise: Promise<any> | null = null;
let oneSignalInitialized = false;

const ensureOneSignal = (): Promise<any> => {
  if (oneSignalReadyPromise) return oneSignalReadyPromise;

  oneSignalReadyPromise = new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      oneSignalReadyPromise = null;
      reject(new Error("OneSignal initialization timeout"));
    }, ONESIGNAL_READY_TIMEOUT_MS);

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        if (!oneSignalInitialized) {
          try {
            await OneSignal.init(oneSignalInitOptions);
            console.log("OneSignal initialized successfully");
          } catch (e: any) {
            if (!e?.message?.includes("already initialized")) {
              // Always wrap in a proper Error so window.onerror sees an Error instance
              const err = e instanceof Error ? e : new Error(
                typeof e === "string" ? e : (e?.message || "OneSignal init failed")
              );
              throw err;
            }
            console.log("OneSignal was already initialized");
          }
          oneSignalInitialized = true;
        }

        window.clearTimeout(timeoutId);
        resolve(OneSignal);
      } catch (e) {
        window.clearTimeout(timeoutId);
        oneSignalReadyPromise = null;
        reject(e);
      }
    });
  });

  return oneSignalReadyPromise;
};

export const initOneSignal = () => {
  ensureOneSignal().catch((e) => console.warn("OneSignal init error:", e));
};

export const loginOneSignal = (userId: string) => {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) return;

  ensureOneSignal()
    .then(async (OneSignal) => {
      if (!OneSignal?.login || loginInFlight || loggedInExternalId === normalizedUserId) return;
      loginInFlight = true;
      try {
        await OneSignal.login(normalizedUserId);
        loggedInExternalId = normalizedUserId;
        console.log("OneSignal login success:", normalizedUserId);
      } catch (e) {
        console.warn("OneSignal login error:", e);
      } finally {
        loginInFlight = false;
      }
    })
    .catch((e) => console.warn("OneSignal login failed:", e));
};

export const logoutOneSignal = () => {
  ensureOneSignal()
    .then(async (OneSignal) => {
      if (!OneSignal?.logout) return;
      try {
        await OneSignal.logout();
        loggedInExternalId = null;
      } catch (e) {
        // OneSignal SDK sometimes rejects with non-Error objects — suppress
        console.warn("OneSignal logout failed:", e);
      }
    })
    .catch((e) => console.warn("OneSignal logout error:", e));
};

export const promptForPushPermission = () => {
  ensureOneSignal()
    .then(async (OneSignal) => {
      const notifications = OneSignal?.Notifications;
      if (!notifications?.requestPermission) return;
      const permission = notifications.permission;
      if (permission !== true && permission !== "granted") {
        await notifications.requestPermission();
      }
    })
    .catch((e) => console.warn("OneSignal permission request failed:", e));
};
