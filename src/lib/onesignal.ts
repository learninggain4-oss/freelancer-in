/**
 * OneSignal Web SDK integration.
 * Uses the CDN-loaded OneSignalDeferred global.
 */

const ONESIGNAL_APP_ID = "c2875b6b-8c7c-4190-b65b-b424dcd3c67d";

const ONESIGNAL_INIT_OPTIONS = {
  appId: ONESIGNAL_APP_ID,
  allowLocalhostAsSecureOrigin: true,
  notifyButton: { enable: false },
  serviceWorkerParam: { scope: "/" },
  serviceWorkerPath: "/OneSignalSDKWorker.js",
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

let initStarted = false;
let oneSignalReadyPromise: Promise<any> | null = null;
let loggedInExternalId: string | null = null;
let loginInFlight = false;

const getOneSignalReady = () => {
  if (oneSignalReadyPromise) return oneSignalReadyPromise;

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  oneSignalReadyPromise = new Promise((resolve, reject) => {
    window.OneSignalDeferred!.push(async (OneSignal: any) => {
      try {
        if (!initStarted) {
          initStarted = true;
          await OneSignal.init(ONESIGNAL_INIT_OPTIONS);
        }
        resolve(OneSignal);
      } catch (error) {
        initStarted = false;
        oneSignalReadyPromise = null;
        reject(error);
      }
    });
  });

  return oneSignalReadyPromise;
};

export const initOneSignal = () => {
  void getOneSignalReady().catch((error) => {
    console.warn("OneSignal init failed:", error);
  });
};

export const loginOneSignal = (userId: string) => {
  if (!userId) return;

  void getOneSignalReady()
    .then(async (OneSignal) => {
      if (!OneSignal?.login || loginInFlight || loggedInExternalId === userId) return;
      loginInFlight = true;
      try {
        await OneSignal.login(userId);
        loggedInExternalId = userId;
      } finally {
        loginInFlight = false;
      }
    })
    .catch((e) => {
      console.warn("OneSignal login failed:", e);
    });
};

export const logoutOneSignal = () => {
  void getOneSignalReady()
    .then(async (OneSignal) => {
      if (!OneSignal?.logout) return;
      await OneSignal.logout();
      loggedInExternalId = null;
    })
    .catch((e) => {
      console.warn("OneSignal logout failed:", e);
    });
};

export const promptForPushPermission = () => {
  void getOneSignalReady()
    .then(async (OneSignal) => {
      const notifications = OneSignal?.Notifications;
      if (!notifications?.requestPermission) return;

      const permission = notifications.permission;
      if (permission !== true && permission !== "granted") {
        await notifications.requestPermission();
      }
    })
    .catch((e) => {
      console.warn("OneSignal permission request failed:", e);
    });
};
