import { useState, useEffect, useRef } from "react";
import { Download, CheckCircle, Share, Smartphone, Monitor, Apple, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "windows" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  return "other";
}

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [installDone, setInstallDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressVal = useRef(0);

  useEffect(() => {
    setPlatform(detectPlatform());

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      setInstallDone(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setInstallDone(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startProgressAnimation = () => {
    progressVal.current = 0;
    setProgress(0);
    intervalRef.current = setInterval(() => {
      const cur = progressVal.current;
      const step = cur < 20 ? 6 : cur < 50 ? 4 : cur < 70 ? 2 : cur < 80 ? 0.8 : 0;
      const next = Math.min(cur + step, 80);
      progressVal.current = next;
      setProgress(Math.round(next));
    }, 80);
  };

  const finishProgress = (accepted: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!accepted) {
      setInstalling(false);
      setProgress(0);
      progressVal.current = 0;
      return;
    }
    let p = progressVal.current;
    const finish = setInterval(() => {
      p = Math.min(p + 5, 100);
      progressVal.current = p;
      setProgress(Math.round(p));
      if (p >= 100) {
        clearInterval(finish);
        setTimeout(() => { setInstallDone(true); setIsInstalled(true); }, 300);
      }
    }, 40);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    startProgressAnimation();

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    finishProgress(outcome === "accepted");
  };

  const platformLabel = platform === "ios" ? "iPhone / iPad"
    : platform === "android" ? "Android"
    : platform === "windows" ? "Windows"
    : "Browser";

  const PlatformIcon = platform === "ios" ? Apple
    : platform === "android" ? Smartphone
    : Monitor;

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#070714", fontFamily: "Inter,system-ui,sans-serif",
      padding: "20px 16px",
    }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.09) 0%,transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>

          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${A1}22, ${A2}18)`, borderBottom: "1px solid rgba(255,255,255,.07)", padding: "28px 28px 24px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 8px 28px ${A1}55` }}>
              <img src="/pwa-icon-512.png" alt="Freelancer" style={{ width: 48, height: 48, borderRadius: 12 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.4px" }}>Install Freelancer.in</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 6 }}>
              Quick access • Works offline • Full experience
            </p>

            {/* Platform badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)" }}>
              <PlatformIcon size={12} color="rgba(255,255,255,.5)" />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>{platformLabel}</span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "24px 28px 28px" }}>

            {/* ── Already installed ── */}
            {installDone ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(74,222,128,.12)", border: "2px solid rgba(74,222,128,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <CheckCircle size={30} color="#4ade80" />
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, color: "white", margin: 0 }}>Installation Complete!</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 8 }}>
                  {platform === "ios"
                    ? "Open the app from your Home Screen."
                    : "The app has been added to your home screen / taskbar."}
                </p>
                <Link to="/" style={{ display: "inline-block", marginTop: 20, padding: "10px 24px", borderRadius: 12, background: `linear-gradient(135deg,${A1},${A2})`, color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none", boxShadow: `0 4px 16px ${A1}55` }}>
                  Open App
                </Link>
              </div>

            /* ── iOS manual steps ── */
            ) : platform === "ios" ? (
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14 }}>Follow these steps to install:</p>
                {[
                  { icon: Share, step: "1", text: 'Tap the Share button (□↑) in Safari' },
                  { icon: Download, step: "2", text: 'Scroll down and tap "Add to Home Screen"' },
                  { icon: CheckCircle, step: "3", text: 'Tap "Add" in the top-right corner' },
                ].map(({ icon: Icon, step, text }) => (
                  <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: `${A1}22`, border: `1px solid ${A1}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#a5b4fc" }}>{step}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, paddingTop: 5 }}>
                      <Icon size={14} color="rgba(255,255,255,.35)" />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>{text}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)" }}>
                  <p style={{ fontSize: 12, color: "rgba(165,180,252,.8)", margin: 0, lineHeight: 1.5 }}>
                    💡 Make sure you're using <strong>Safari</strong>. The install option isn't available in Chrome or Firefox on iOS.
                  </p>
                </div>
              </div>

            /* ── Android / Windows install with progress ── */
            ) : deferredPrompt ? (
              <div>
                {!installing ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                      {[
                        { icon: "⚡", text: "Loads instantly — even offline" },
                        { icon: "📱", text: "Home screen / taskbar shortcut" },
                        { icon: "🔔", text: "Push notifications supported" },
                      ].map(({ icon, text }) => (
                        <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
                          <span style={{ fontSize: 16 }}>{icon}</span>
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>{text}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleInstall} style={{
                      width: "100%", padding: "14px", borderRadius: 14,
                      background: `linear-gradient(135deg,${A1},${A2})`,
                      border: "none", cursor: "pointer", color: "white",
                      fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: `0 6px 24px ${A1}55`, letterSpacing: "-0.2px",
                    }}>
                      <Download size={18} />
                      Install App
                    </button>
                  </>
                ) : (
                  <div style={{ padding: "8px 0" }}>
                    {/* Progress indicator */}
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 16px" }}>
                        {/* Circle track */}
                        <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                          <circle cx="40" cy="40" r="34" fill="none"
                            stroke={`url(#grad)`} strokeWidth="6"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 0.1s ease" }}
                          />
                          <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={A1} />
                              <stop offset="100%" stopColor={A2} />
                            </linearGradient>
                          </defs>
                        </svg>
                        {/* Percentage text */}
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: "white" }}>{progress}%</span>
                        </div>
                      </div>

                      <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>
                        {progress < 30 ? "Preparing installation…"
                          : progress < 60 ? "Downloading resources…"
                          : progress < 80 ? "Almost ready…"
                          : progress < 100 ? "Completing setup…"
                          : "Done!"}
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 6 }}>
                        {progress < 80
                          ? "Please confirm the installation prompt"
                          : "Finalising…"}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)", overflow: "hidden", marginBottom: 12 }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        background: `linear-gradient(90deg,${A1},${A2})`,
                        width: `${progress}%`,
                        transition: "width 0.1s ease",
                        boxShadow: `0 0 10px ${A1}88`,
                      }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>Installing…</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>{progress}% complete</span>
                    </div>
                  </div>
                )}
              </div>

            /* ── No install prompt available ── */
            ) : (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Monitor size={24} color="rgba(255,255,255,.3)" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0 }}>Open in Chrome or Edge</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginTop: 8, lineHeight: 1.5 }}>
                  For the best install experience on {platformLabel === "Browser" ? "desktop" : platformLabel}, open this page in <strong style={{ color: "rgba(255,255,255,.5)" }}>Google Chrome</strong> or <strong style={{ color: "rgba(255,255,255,.5)" }}>Microsoft Edge</strong>.
                </p>
                <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)" }}>
                  <p style={{ fontSize: 12, color: "rgba(165,180,252,.8)", margin: 0 }}>
                    💡 Or use your browser menu → "Install App" / "Add to Home Screen"
                  </p>
                </div>
              </div>
            )}

            {/* Back link */}
            {!installDone && (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <Link to="/" style={{ fontSize: 13, color: "rgba(255,255,255,.3)", textDecoration: "none" }}>
                  ← Back to app
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Benefits strip */}
        {!installing && !installDone && (
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20 }}>
            {["Free", "Secure", "Offline Ready"].map(label => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle size={11} color="rgba(74,222,128,.6)" />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallApp;
