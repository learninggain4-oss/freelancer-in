import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOneSignal } from "./lib/onesignal";

// ── Suppress non-Error uncaught exceptions ────────────────────────────────────
// window.onerror fires BEFORE addEventListener("error") listeners, so returning
// true here prevents the Replit canvas wrapper from seeing non-Error throws
// (e.g. OneSignal SDK throws plain {} objects on non-whitelisted domains).
const _origOnerror = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  if (error === null || error === undefined || !(error instanceof Error)) {
    console.warn("[window.onerror suppressed non-Error]", message, error ?? "(no error object)");
    return true; // prevent browser default + stops propagation to addEventListener handlers
  }
  return _origOnerror ? _origOnerror.call(this, message, source, lineno, colno, error) : false;
};

// Capture-phase error listener — fires before bubble-phase (Replit wrapper uses bubble)
window.addEventListener("error", (event) => {
  if (event.error === null || event.error === undefined || !(event.error instanceof Error)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    console.warn("[error event suppressed non-Error]", event.message, event.error ?? "(no error object)");
  }
}, true);

// Async rejection handler — suppress non-Error promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  if (reason instanceof Error) return;
  event.preventDefault();
  if (reason !== undefined && reason !== null) {
    const msg = typeof reason === "string" ? reason : (reason?.message || JSON.stringify(reason));
    console.warn("[unhandledrejection suppressed]", msg, reason);
  }
});

// Initialize OneSignal
initOneSignal();

createRoot(document.getElementById("root")!).render(<App />);
