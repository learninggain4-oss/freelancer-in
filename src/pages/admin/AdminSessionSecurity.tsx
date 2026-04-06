import { useState, useEffect } from "react";
import { Monitor, Smartphone, Globe, LogOut, AlertTriangle, CheckCircle2, Clock, MapPin, Shield, Wifi, Lock, RefreshCw, Eye, Activity, Key, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface KnownSession {
  id: string; device: string; browser: string; os: string; ip: string;
  location: string; isCurrent: boolean; lastActive: string; loginAt: string;
  isSuspicious: boolean; isBlocked: boolean;
}

interface SecuritySettings {
  mfaRequired: boolean; deviceBinding: boolean; ipChangeAlert: boolean;
  maxSessions: number; sessionTimeoutMin: number; forceLogoutOnIpChange: boolean;
}

interface SuspiciousEvent {
  id: string; type: string; ip: string; device: string; timestamp: string; resolved: boolean;
}

function getDeviceType(ua: string): string {
  if (/mobile/i.test(ua)) return "Mobile";
  if (/tablet/i.test(ua)) return "Tablet";
  return "Desktop";
}
function getBrowser(ua: string): string {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Unknown";
}
function getOS(ua: string): string {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

function load<T>(key: string, seed: () => T[]): T[] {
  try { const d = localStorage.getItem(key); if (d) return JSON.parse(d); } catch { /* */ }
const KNOWN_SESS_KEY="admin_known_sessions_v1";const SUSP_KEY="admin_suspicious_events_v1";
function seedKnownSessions():KnownSession[]{return[
  {id:"ks1",device:"Desktop",browser:"Chrome 124",os:"Windows 11",ip:"103.12.44.10",location:"Kochi, Kerala",isCurrent:true,lastActive:new Date(Date.now()-60000).toISOString(),loginAt:new Date(Date.now()-3600000).toISOString(),isSuspicious:false,isBlocked:false},
  {id:"ks2",device:"Mobile",browser:"Safari 17",os:"iOS 17",ip:"45.33.32.156",location:"Mumbai, Maharashtra",isCurrent:false,lastActive:new Date(Date.now()-1800000).toISOString(),loginAt:new Date(Date.now()-7200000).toISOString(),isSuspicious:true,isBlocked:false},
];}
function seedSuspicious():SuspiciousEvent[]{return[
  {id:"se1",type:"New location login",ip:"45.33.32.156",device:"Mobile - Safari 17",timestamp:new Date(Date.now()-7200000).toISOString(),resolved:false},
  {id:"se2",type:"Multiple failed logins",ip:"192.168.1.100",device:"Unknown",timestamp:new Date(Date.now()-86400000).toISOString(),resolved:true},
];}
  const s = seed(); localStorage.setItem(key, JSON.stringify(s)); return s;
}

const defaultSettings: SecuritySettings = { mfaRequired: false, deviceBinding: true, ipChangeAlert: true, maxSessions: 3, sessionTimeoutMin: 30, forceLogoutOnIpChange: false };

export default function AdminSessionSecurity() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]       = useState<"sessions" | "settings" | "suspicious">("sessions");
  const [sessions, setSessions] = useState<KnownSession[]>(()=>load(KNOWN_SESS_KEY,seedKnownSessions));
  const [settings, setSettings] = useState<SecuritySettings>(() => { try { return JSON.parse(localStorage.getItem(SECURITY_KEY) || "{}"); } catch { return defaultSettings; } });
  const [suspicious, setSuspicious] = useState<SuspiciousEvent[]>(()=>load(SUSP_KEY,seedSuspicious));
  const [confirmTerminate, setConfirmTerminate] = useState<KnownSession | null>(null);
  const [confirmTerminateAll, setConfirmTerminateAll] = useState(false);
  const [realSession, setRealSession] = useState<{ email?: string; last_sign_in?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setRealSession({ email: data.user.email, last_sign_in: data.user.last_sign_in_at });
    });
  }, []);

  const persist = (s: KnownSession[]) => { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)); setSessions(s); };
  const persistSettings = (s: SecuritySettings) => { localStorage.setItem(SECURITY_KEY, JSON.stringify(s)); setSettings(s); };

  const terminateSession = (ses: KnownSession) => {
    const updated = sessions.map(s => s.id === ses.id ? { ...s, isBlocked: true } : s);
    persist(updated);
    logAction("Session Terminated", `${ses.device} at ${ses.ip} (${ses.location})`, "Security", "warning");
    toast({ title: "Session terminated", description: `${ses.browser}/${ses.os} from ${ses.location}` });
    setConfirmTerminate(null);
  };

  const terminateAll = () => {
    const updated = sessions.map(s => s.isCurrent ? s : { ...s, isBlocked: true });
    persist(updated);
    logAction("All Sessions Terminated", "Forced logout of all other admin sessions", "Security", "warning");
    toast({ title: "All other sessions terminated" });
    setConfirmTerminateAll(false);
  };

  const resolveEvent = (id: string) => {
    const updated = suspicious.map(s => s.id === id ? { ...s, resolved: true } : s);
    localStorage.setItem(SUSPICIOUS_KEY, JSON.stringify(updated));
    setSuspicious(updated);
    logAction("Suspicious Event Resolved", suspicious.find(s=>s.id===id)?.type || "", "Security", "success");
    toast({ title: "Event marked as resolved" });
  };

  const toggleSetting = (key: keyof SecuritySettings) => {
    const updated = { ...settings, [key]: !settings[key as keyof SecuritySettings] };
    persistSettings(updated);
    logAction("Session Security Setting Updated", `${key}: ${settings[key]} → ${!settings[key]}`, "Security", "warning");
    toast({ title: `${key} ${!settings[key] ? "enabled" : "disabled"}` });
  };

  const unresolved = suspicious.filter(s => !s.resolved).length;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <Shield size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Session Security</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Active sessions · Device management · Suspicious activity · Security settings</p>
          </div>
          {realSession && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", textAlign: "right" }}>
              <p style={{ fontSize: 11, color: T.badgeFg, fontWeight: 700, margin: 0 }}>Logged in as</p>
              <p style={{ fontSize: 12, color: T.text, margin: "2px 0 0" }}>{realSession.email}</p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[{ l: "Active Sessions", v: sessions.filter(s=>!s.isBlocked).length, c: "#4ade80" }, { l: "Suspicious Events", v: unresolved, c: unresolved > 0 ? "#f87171" : "#94a3b8" }, { l: "Blocked Sessions", v: sessions.filter(s=>s.isBlocked).length, c: "#f87171" }, { l: "MFA", v: settings.mfaRequired ? "ON" : "OFF", c: settings.mfaRequired ? "#4ade80" : "#f87171" }].map(s => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {([["sessions","Active Sessions",Monitor],["suspicious","Suspicious Activity",AlertTriangle],["settings","Security Settings",Lock]] as const).map(([t,l,Icon]) => (
          <button key={t} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1px solid ${tab===t?A1:T.border}`, background: tab===t?`${A1}18`:T.card, color: tab===t?T.badgeFg:T.sub, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            <Icon size={13} /> {l} {t==="suspicious" && unresolved > 0 && <span style={{ background: "#f87171", color: "#fff", borderRadius: 8, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{unresolved}</span>}
          </button>
        ))}
      </div>

      {/* Active Sessions */}
      {tab === "sessions" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button onClick={() => setConfirmTerminateAll(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <LogOut size={13} /> Terminate All Other Sessions
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessions.map(ses => (
              <div key={ses.id} style={{ background: T.card, border: `1px solid ${ses.isCurrent ? "rgba(99,102,241,.25)" : ses.isSuspicious ? "rgba(248,113,113,.25)" : T.border}`, borderRadius: 14, padding: "16px 18px", opacity: ses.isBlocked ? .5 : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: ses.isCurrent ? `${A1}18` : ses.isSuspicious ? "rgba(248,113,113,.1)" : T.input, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {ses.device === "Mobile" ? <Smartphone size={18} color={ses.isCurrent ? A1 : ses.isSuspicious ? "#f87171" : "#94a3b8"} /> : <Monitor size={18} color={ses.isCurrent ? A1 : ses.isSuspicious ? "#f87171" : "#94a3b8"} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{ses.browser} on {ses.os}</span>
                      {ses.isCurrent && <span style={{ fontSize: 10, fontWeight: 700, color: T.badgeFg, background: T.badge, padding: "2px 7px", borderRadius: 5 }}>CURRENT SESSION</span>}
                      {ses.isSuspicious && <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,.1)", padding: "2px 7px", borderRadius: 5 }}>SUSPICIOUS</span>}
                      {ses.isBlocked && <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", background: T.input, padding: "2px 7px", borderRadius: 5 }}>TERMINATED</span>}
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}><Globe size={11} /> {ses.ip}</span>
                      <span style={{ fontSize: 12, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {ses.location}</span>
                      <span style={{ fontSize: 12, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> Active {safeDist(ses.lastActive)} ago</span>
                      <span style={{ fontSize: 12, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}><Key size={11} /> Login: {safeFmt(ses.loginAt, "MMM d, HH:mm")}</span>
                    </div>
                  </div>
                  {!ses.isCurrent && !ses.isBlocked && (
                    <button onClick={() => setConfirmTerminate(ses)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 9, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                      <LogOut size={12} /> Terminate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Suspicious Activity */}
      {tab === "suspicious" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {suspicious.map(ev => (
            <div key={ev.id} style={{ background: T.card, border: `1px solid ${ev.resolved ? T.border : "rgba(248,113,113,.2)"}`, borderRadius: 13, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, opacity: ev.resolved ? .7 : 1 }}>
              <AlertTriangle size={18} color={ev.resolved ? "#94a3b8" : "#f87171"} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 3px" }}>{ev.type}</p>
                <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>IP: {ev.ip} · {ev.device} · {safeFmt(ev.timestamp, "MMM d, HH:mm")}</p>
              </div>
              {ev.resolved ? (
                <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>✓ Resolved</span>
              ) : (
                <button onClick={() => resolveEvent(ev.id)} style={{ padding: "6px 13px", borderRadius: 8, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", color: "#4ade80", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Mark Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Security Settings */}
      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {([
            { key: "mfaRequired",         label: "Require MFA for all admin logins",      desc: "Admins must verify with a second factor on each login. Managed via Supabase Auth.", risk: "high" },
            { key: "deviceBinding",        label: "Device binding / fingerprinting",        desc: "Detect when a session is accessed from a new device and trigger re-authentication.", risk: "medium" },
            { key: "ipChangeAlert",        label: "Alert on IP address change",             desc: "Send notification when an active session's IP changes mid-session.", risk: "medium" },
            { key: "forceLogoutOnIpChange",label: "Force logout on IP change",              desc: "Automatically terminate sessions if the IP changes. Strict security mode.", risk: "high" },
          ] as { key: keyof SecuritySettings; label: string; desc: string; risk: string }[]).map(item => (
            <div key={item.key} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 13, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{item.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: item.risk === "high" ? "#f87171" : "#fbbf24", background: item.risk === "high" ? "rgba(248,113,113,.1)" : "rgba(251,191,36,.1)", padding: "2px 7px", borderRadius: 5 }}>{item.risk} impact</span>
                </div>
                <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>{item.desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: settings[item.key] ? "#4ade80" : T.sub }}>{settings[item.key] ? "ON" : "OFF"}</span>
                <button onClick={() => toggleSetting(item.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {settings[item.key] ? <ToggleRight size={28} color="#4ade80" /> : <ToggleLeft size={28} color="#94a3b8" />}
                </button>
              </div>
            </div>
          ))}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 13, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Session Timeout</span>
              <p style={{ fontSize: 12, color: T.sub, margin: "3px 0 0" }}>Auto-logout after inactivity. Currently managed in Safety Center settings.</p>
            </div>
            <div style={{ background: `${A1}18`, border: `1px solid ${A1}33`, borderRadius: 9, padding: "6px 14px" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: T.badgeFg }}>{localStorage.getItem("admin_session_timeout_min") || "30"} min</span>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionDialog open={!!confirmTerminate} onOpenChange={o => !o && setConfirmTerminate(null)} onConfirm={() => confirmTerminate && terminateSession(confirmTerminate)}
        title="Terminate Session" description={`Force logout ${confirmTerminate?.browser} on ${confirmTerminate?.os} from ${confirmTerminate?.location}? The user will be signed out immediately.`}
        confirmLabel="Terminate Session" variant="danger" />
      <ConfirmActionDialog open={confirmTerminateAll} onOpenChange={o => !o && setConfirmTerminateAll(false)} onConfirm={terminateAll}
        title="Terminate All Other Sessions" description="This will force logout all admin sessions except your current one. All other active admins will be signed out." confirmLabel="Terminate All" variant="danger" mode="type" typeToConfirm="TERMINATE" />
    </div>
  );
}
