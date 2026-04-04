import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOneSignal } from "./lib/onesignal";

// ── Patch ResizeObserver to prevent "loop completed" errors ───────────────────
// ResizeObserver fires "ResizeObserver loop completed with undelivered notifications"
// when callbacks run synchronously during layout. Wrapping in rAF prevents this.
// This error propagates across iframe boundaries so it must be fixed at the source.
if (typeof window.ResizeObserver !== "undefined") {
  const _OrigRO = window.ResizeObserver;
  // @ts-ignore
  window.ResizeObserver = class ResizeObserver extends _OrigRO {
    constructor(callback: ResizeObserverCallback) {
      super((entries: ResizeObserverEntry[], observer: ResizeObserver) => {
        window.requestAnimationFrame(() => {
          if (entries.length) callback(entries, observer);
        });
      });
    }
  };
}

// ── Suppress non-Error uncaught exceptions ────────────────────────────────────
// window.onerror fires BEFORE addEventListener("error") listeners.
const _origOnerror = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  if (error === null || error === undefined || !(error instanceof Error)) {
    return true; // suppress: prevent default browser handling
  }
  return _origOnerror ? _origOnerror.call(this, message, source, lineno, colno, error) : false;
};

// Capture-phase error listener as secondary safety net
window.addEventListener("error", (event) => {
  if (event.error === null || event.error === undefined || !(event.error instanceof Error)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

// Suppress non-Error promise rejections (OneSignal, Supabase realtime, etc.)
window.addEventListener("unhandledrejection", (event) => {
  if (!(event.reason instanceof Error)) {
    event.preventDefault();
  }
});

// Initialize OneSignal
initOneSignal();

createRoot(document.getElementById("root")!).render(<App />);
