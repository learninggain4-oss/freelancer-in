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

let initialized = false;

export const initOneSignal = () => {
  if (initialized) return;
  initialized = true;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    });
  });
};

export const loginOneSignal = (userId: string) => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.login(userId);
    } catch (e) {
      console.warn("OneSignal login failed:", e);
    }
  });
};

export const logoutOneSignal = () => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.logout();
    } catch (e) {
      console.warn("OneSignal logout failed:", e);
    }
  });
};
