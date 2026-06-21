interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let _prompt: BeforeInstallPromptEvent | null = null;
let _installed = false;
const _listeners: Array<() => void> = [];

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    _prompt = e as BeforeInstallPromptEvent;
    _listeners.forEach(fn => fn());
  });

  window.addEventListener("appinstalled", () => {
    _prompt = null;
    _installed = true;
    _listeners.forEach(fn => fn());
  });
}

export const pwa = {
  getPrompt: () => _prompt,
  isInstalled: () => _installed || window.matchMedia("(display-mode: standalone)").matches,
  clearPrompt: () => { _prompt = null; },
  subscribe: (fn: () => void) => {
    _listeners.push(fn);
    return () => { const i = _listeners.indexOf(fn); if (i > -1) _listeners.splice(i, 1); };
  },
};
