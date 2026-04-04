import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOneSignal } from "./lib/onesignal";

// Global handler: catch unhandled promise rejections that are non-Error objects
// (e.g. OneSignal SDK rejects with plain objects like `{}` which cause
// "An uncaught exception occurred but the error was not an error object" in the canvas)
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  // If it's already a proper Error, let it bubble (React error boundary handles it)
  if (reason instanceof Error) return;
  // Suppress non-Error rejections from third-party libs (OneSignal, etc.)
  event.preventDefault();
  if (reason !== undefined && reason !== null) {
    const msg = typeof reason === "string" ? reason : (reason?.message || JSON.stringify(reason));
    console.warn("[unhandledrejection suppressed]", msg, reason);
  }
});

// Initialize OneSignal
initOneSignal();

createRoot(document.getElementById("root")!).render(<App />);
