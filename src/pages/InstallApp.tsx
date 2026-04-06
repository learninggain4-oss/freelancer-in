import { useState, useEffect, useRef } from "react";
import { Download, CheckCircle, Share, Smartphone, Monitor, Apple, Wifi, HardDrive, Cpu, Package, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "windows" | "other";
type StepStatus = "pending" | "active" | "done";

interface InstallStep {
  id: string;
  label: string;
  detail: string;
  icon: React.ElementType;
  from: number;
  to: number;
}

const STEPS: InstallStep[] = [
  { id: "check",     label: "Checking system requirements",  detail: "Verifying browser & OS compatibility", icon: Cpu,       from: 0,  to: 15 },
  { id: "download",  label: "Downloading app resources",     detail: "Fetching scripts, styles & assets",    icon: Wifi,      from: 15, to: 45 },
  { id: "cache",     label: "Setting up offline cache",      detail: "Registering service worker & cache",   icon: HardDrive, from: 45, to: 68 },
  { id: "install",   label: "Installing app components",     detail: "Configuring manifest & shortcuts",     icon: Package,   from: 68, to: 88 },
  { id: "finalise",  label: "Finalising setup",              detail: "Creating home screen shortcut",        icon: Zap,       from: 88, to: 100 },
];

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  return "other";
}

const A1 = "#6366f1";
const A2 = "#8b5cf6";
const R = 38; // SVG circle radius

const stepStatus = (stepFrom: number, stepTo: number, progress: number): StepStatus => {
  if (progress >= stepTo) return "done";
  if (progress >= stepFrom) return "active";
  return "pending";
};

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform]             = useState<Platform>("other");
  const [phase, setPhase]                   = useState<"idle" | "installing" | "confirming" | "done" | "dismissed">("idle");
  const [progress, setProgress]             = useState(0);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef   = useRef(0);

  useEffect(() => {
    setPlatform(detectPlatform());
    if (window.matchMedia("(display-mode: standalone)").matches) setPhase("done");

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setPhase("done");

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const animateTo = (target: number, speed: number, onDone?: () => void) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const cur = progressRef.current;
      if (cur >= target) {
        clearInterval(intervalRef.current!);
        onDone?.();
        return;
      }
      const step = cur < 20 ? speed * 1.5 : cur < 50 ? speed : cur < 80 ? speed * 0.6 : speed * 0.3;
      const next = Math.min(cur + step, target);
      progressRef.current = next;
      setProgress(Math.round(next));
    }, 60);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setPhase("installing");
    progressRef.current = 0;
    setProgress(0);

    // Animate to 68% (through check, download, cache steps)
    animateTo(68, 1.2, async () => {
      // Now show browser prompt while continuing animation
      setPhase("confirming");
      animateTo(88, 0.5);

      const prompt = deferredPrompt;
      setDeferredPrompt(null);
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      if (outcome === "accepted") {
        // Complete to 100%
        if (intervalRef.current) clearInterval(intervalRef.current);
        animateTo(100, 2, () => {
          setTimeout(() => setPhase("done"), 400);
        });
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase("dismissed");
        setProgress(0);
        progressRef.current = 0;
      }
    });
  };

  const handleRetry = () => {
    setPhase("idle");
    setProgress(0);
    progressRef.current = 0;
  };

  const platformLabel = platform === "ios" ? "iPhone / iPad"
    : platform === "android" ? "Android"
    : platform === "windows" ? "Windows PC"
    : "Browser";

  const PlatformIcon = platform === "ios" ? Apple
    : platform === "android" ? Smartphone
    : Monitor;

  const circumference = 2 * Math.PI * R;
  const activeStep = STEPS.find(s => progress >= s.from && progress < s.to) ?? (progress >= 100 ? STEPS[STEPS.length - 1] : STEPS[0]);

  const isInstalling = phase === "installing" || phase === "confirming";

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#070714", fontFamily: "Inter,system-ui,sans-serif",
      padding: "20px 16px",
    }}>
      {/* bg orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.13) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.09) 0%,transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.55)" }}>

          {/* Header */}
          <div style={{ background: `linear-gradient(135deg,${A1}25,${A2}18)`, borderBottom: "1px solid rgba(255,255,255,.07)", padding: "24px 24px 20px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 6px 24px ${A1}55` }}>
              <img src="/pwa-icon-512.png" alt="" style={{ width: 42, height: 42, borderRadius: 10 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.4px" }}>Install App</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 4 }}>Quick access • Works offline • Full experience</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, padding: "4px 11px", borderRadius: 20, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)" }}>
              <PlatformIcon size={11} color="rgba(255,255,255,.45)" />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 600 }}>{platformLabel}</span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "22px 24px 26px" }}>

            {/* ── Done ── */}
            {phase === "done" ? (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(74,222,128,.1)", border: "2px solid rgba(74,222,128,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <CheckCircle size={32} color="#4ade80" />
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>Installation Complete!</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 8 }}>
                  {platform === "ios" ? "Open the app from your Home Screen." : "App added to your home screen / taskbar."}
                </p>
                {/* All steps shown as done */}
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
                  {STEPS.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(74,222,128,.06)", border: "1px solid rgba(74,222,128,.15)" }}>
                      <CheckCircle size={13} color="#4ade80" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 600 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <Link to="/" style={{ display: "inline-block", marginTop: 20, padding: "11px 28px", borderRadius: 12, background: `linear-gradient(135deg,${A1},${A2})`, color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: `0 4px 16px ${A1}55` }}>
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
                  <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${A1}22`, border: `1px solid ${A1}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#a5b4fc" }}>{step}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Icon size={13} color="rgba(255,255,255,.3)" />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>{text}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 18, padding: "11px 14px", borderRadius: 12, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)" }}>
                  <p style={{ fontSize: 12, color: "rgba(165,180,252,.8)", margin: 0, lineHeight: 1.5 }}>
                    💡 Use <strong>Safari</strong> — Chrome or Firefox on iOS cannot install apps.
                  </p>
                </div>
              </div>

            /* ── Progress screen (installing) ── */
            ) : isInstalling ? (
              <div>
                {/* Circular ring + % */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, padding: "16px", borderRadius: 16, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
                  <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
                    <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7" />
                      <circle cx="44" cy="44" r={R} fill="none"
                        stroke="url(#ig)"
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - progress / 100)}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.12s ease" }}
                      />
                      <defs>
                        <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={A1} />
                          <stop offset="100%" stopColor={A2} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: "white", lineHeight: 1 }}>{progress}%</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>done</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "white", margin: "0 0 4px", lineHeight: 1.3 }}>{activeStep.label}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.35)", margin: "0 0 10px" }}>{activeStep.detail}</p>
                    {/* Linear bar */}
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${A1},${A2})`, width: `${progress}%`, transition: "width 0.12s ease", boxShadow: `0 0 8px ${A1}99` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>
                        {phase === "confirming" ? "Confirm the prompt above ↑" : "Installing…"}
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontWeight: 700 }}>{progress}%</span>
                    </div>
                  </div>
                </div>

                {/* Step list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {STEPS.map(s => {
                    const st = stepStatus(s.from, s.to, progress);
                    const Icon = s.icon;
                    return (
                      <div key={s.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px", borderRadius: 10,
                        background: st === "done" ? "rgba(74,222,128,.06)" : st === "active" ? `${A1}15` : "rgba(255,255,255,.02)",
                        border: `1px solid ${st === "done" ? "rgba(74,222,128,.2)" : st === "active" ? `${A1}44` : "rgba(255,255,255,.04)"}`,
                        transition: "all 0.3s ease",
                      }}>
                        {/* Icon / spinner / check */}
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: st === "done" ? "rgba(74,222,128,.15)" : st === "active" ? `${A1}25` : "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {st === "done" ? (
                            <CheckCircle size={13} color="#4ade80" />
                          ) : st === "active" ? (
                            <Icon size={13} color={A1} />
                          ) : (
                            <Icon size={13} color="rgba(255,255,255,.2)" />
                          )}
                        </div>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: st === "pending" ? 400 : 700, color: st === "done" ? "rgba(74,222,128,.9)" : st === "active" ? "white" : "rgba(255,255,255,.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.label}
                          </p>
                        </div>
                        {/* Right status */}
                        <span style={{ fontSize: 10, fontWeight: 700, color: st === "done" ? "rgba(74,222,128,.7)" : st === "active" ? A1 : "rgba(255,255,255,.15)", flexShrink: 0 }}>
                          {st === "done" ? "✓ Done" : st === "active" ? `${Math.min(progress, s.to)}%` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {phase === "confirming" && (
                  <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: `${A1}18`, border: `1px solid ${A1}44`, textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#a5b4fc", margin: 0, fontWeight: 600 }}>
                      👆 Tap "Install" in the browser prompt to complete
                    </p>
                  </div>
                )}
              </div>

            /* ── Dismissed ── */
            ) : phase === "dismissed" ? (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(251,146,60,.1)", border: "2px solid rgba(251,146,60,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <span style={{ fontSize: 24 }}>⚠️</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Installation Cancelled</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 8 }}>You dismissed the install prompt. Click below to try again.</p>
                <button onClick={handleRetry} style={{ marginTop: 18, padding: "11px 28px", borderRadius: 12, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 16px ${A1}55` }}>
                  Try Again
                </button>
              </div>

            /* ── Android / Windows: idle with install button ── */
            ) : deferredPrompt ? (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {[
                    { icon: "⚡", text: "Loads instantly — even offline" },
                    { icon: "📱", text: "Home screen / taskbar shortcut" },
                    { icon: "🔔", text: "Push notifications supported" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
                      <span style={{ fontSize: 15 }}>{icon}</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,.55)" }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Steps preview (pending state) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
                  {STEPS.map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
                        <Icon size={12} color="rgba(255,255,255,.18)" />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)", fontWeight: 500 }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>

                <button onClick={handleInstall} style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  background: `linear-gradient(135deg,${A1},${A2})`,
                  border: "none", cursor: "pointer", color: "white",
                  fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: `0 6px 24px ${A1}55`, letterSpacing: "-0.2px",
                }}>
                  <Download size={18} />
                  Install App — Track Progress
                </button>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)", textAlign: "center", marginTop: 8 }}>You'll see every step as it happens</p>
              </div>

            /* ── No prompt available ── */
            ) : (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Monitor size={24} color="rgba(255,255,255,.3)" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0 }}>Open in Chrome or Edge</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginTop: 8, lineHeight: 1.5 }}>
                  Open this page in <strong style={{ color: "rgba(255,255,255,.5)" }}>Google Chrome</strong> or <strong style={{ color: "rgba(255,255,255,.5)" }}>Microsoft Edge</strong> to install.
                </p>
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)" }}>
                  <p style={{ fontSize: 12, color: "rgba(165,180,252,.8)", margin: 0 }}>
                    💡 Or use browser menu → "Install App" / "Add to Home Screen"
                  </p>
                </div>
              </div>
            )}

            {/* Back link */}
            {phase === "idle" && (
              <div style={{ marginTop: 18, textAlign: "center" }}>
                <Link to="/" style={{ fontSize: 12, color: "rgba(255,255,255,.25)", textDecoration: "none" }}>← Back to app</Link>
              </div>
            )}
          </div>
        </div>

        {/* Benefits strip (idle only) */}
        {phase === "idle" && !isInstalling && (
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
            {["Free", "Secure", "Offline Ready"].map(label => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle size={10} color="rgba(74,222,128,.55)" />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>{label}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default InstallApp;
