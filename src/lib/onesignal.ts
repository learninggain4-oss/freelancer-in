/**
 * OneSignal Web SDK integration.
 * Uses the CDN-loaded OneSignalDeferred global.
 */

const ONESIGNAL_APP_ID = "c2875b6b-8c7c-4190-b65b-b424dcd3c67d";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

let loggedInExternalId: string | null = null;
let loginInFlight = false;

/**
 * Returns a promise that resolves with the ready OneSignal object.
 * Handles the case where the SDK may already be initialized.
 */
const getOneSignal = (): Promise<any> => {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      resolve(OneSignal);
    });
  });
};

let osPromise: Promise<any> | null = null;

const ensureOneSignal = (): Promise<any> => {
  if (osPromise) return osPromise;
  osPromise = getOneSignal();
  return osPromise;
};

export const initOneSignal = () => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false },
        serviceWorkerParam: { scope: "/" },
        serviceWorkerPath: "/OneSignalSDKWorker.js",
      });
      console.log("OneSignal initialized successfully");
    } catch (e: any) {
      // "SDK already initialized" is expected on hot-reload / revisit — safe to ignore
      if (e?.message?.includes("already initialized")) {
        console.log("OneSignal was already initialized");
      } else {
        console.warn("OneSignal init error:", e);
      }
    }
  });
};

export const loginOneSignal = (userId: string) => {
  if (!userId) return;
  ensureOneSignal()
    .then(async (OneSignal) => {
      if (!OneSignal?.login || loginInFlight || loggedInExternalId === userId) return;
      loginInFlight = true;
      try {
        await OneSignal.login(userId);
        loggedInExternalId = userId;
        console.log("OneSignal login success:", userId);
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
      await OneSignal.logout();
      loggedInExternalId = null;
    })
    .catch((e) => console.warn("OneSignal logout failed:", e));
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
