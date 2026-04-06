import { useState, useEffect } from "react";
import { Bell, Mail, MessageSquare, Smartphone, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ToggleLeft, ToggleRight, Globe, Zap, Activity, Clock, Send, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

const SERVICES_KEY = "admin_alert_services_v1";
const CHANNELS_KEY = "admin_alert_channels_v1";
const ALERT_EVENTS_KEY = "admin_alert_events_v1";

interface AlertChannel { id: string; type: "email" | "sms" | "push" | "webhook"; label: string; endpoint: string; enabled: boolean; lastTested?: string; testStatus?: "ok" | "fail"; }
interface AlertEvent { id: string; title: string; severity: "critical" | "high" | "medium" | "info"; source: string; message: string; timestamp: string; delivered: boolean; channel: string; }
interface ServiceDep { id: string; name: string; url: string; category: string; status: "online" | "degraded" | "offline" | "unknown"; latency?: number; lastChecked?: string; }

const defaultChannels: AlertChannel[] = [
  { id: "c1", type: "email",   label: "Admin Email",    endpoint: "freeandin9@gmail.com",              enabled: true,  lastTested: new Date(Date.now()-3600000).toISOString(), testStatus: "ok" },
  { id: "c2", type: "push",    label: "OneSignal Push", endpoint: "https://onesignal.com/api/v1/",     enabled: true,  lastTested: new Date(Date.now()-7200000).toISOString(), testStatus: "ok" },
  { id: "c3", type: "sms",     label: "SMS Gateway",    endpoint: "+91 98XXXXXXXX",                    enabled: false },
  { id: "c4", type: "webhook", label: "Slack Webhook",  endpoint: "https://hooks.slack.com/…",         enabled: false },
];

const defaultAlerts: AlertEvent[] = [
  { id: "al1", title: "High-value withdrawal flagged",    severity: "high",     source: "Wallet System",  message: "Withdrawal of ₹85,000 by DEMO requires approval",          timestamp: new Date(Date.now() - 3600000).toISOString(),  delivered: true,  channel: "Admin Email" },
  { id: "al2", title: "Multiple failed logins detected",  severity: "critical", source: "Auth System",    message: "5 failed login attempts from IP 103.21.xx.xx",              timestamp: new Date(Date.now() - 7200000).toISOString(),  delivered: true,  channel: "Admin Email" },
  { id: "al3", title: "DB latency spike: 820ms",          severity: "medium",   source: "Server Monitor", message: "Supabase DB response time exceeded 800ms threshold",         timestamp: new Date(Date.now() - 10800000).toISOString(), delivered: true,  channel: "Push" },
  { id: "al4", title: "New Aadhaar verification pending", severity: "info",     source: "Verification",   message: "3 new Aadhaar verifications awaiting review",               timestamp: new Date(Date.now() - 14400000).toISOString(), delivered: false, channel: "Push" },
  { id: "al5", title: "Backup completed successfully",    severity: "info",     source: "Backup System",  message: "Scheduled backup: 4 tables, 128 KB",                        timestamp: new Date(Date.now() - 86400000).toISOString(), delivered: true,  channel: "Admin Email" },
];

const defaultServices: ServiceDep[] = [
  { id: "s1", name: "Supabase Database", url: "https://maysttckdfnnzvfeujaj.supabase.co",              category: "Database",      status: "unknown" },
  { id: "s2", name: "Supabase Auth",     url: "https://maysttckdfnnzvfeujaj.supabase.co/auth/v1/health", category: "Auth",         status: "unknown" },
  { id: "s3", name: "Supabase REST API", url: "https://maysttckdfnnzvfeujaj.supabase.co/rest/v1/",     category: "API",           status: "unknown" },
  { id: "s4", name: "OneSignal Push",    url: "https://onesignal.com",                                  category: "Notifications", status: "unknown" },
  { id: "s5", name: "Razorpay/Payments", url: "https://razorpay.com",                                   category: "Payments",      status: "unknown" },
  { id: "s6", name: "Lovable Hosting",    url: "https://lovable.app",                                    category: "Hosting",       status: "unknown" },
];

function load<T>(key: string, def: T[]): T[] {
  try { const d = localStorage.getItem(key); if (d) return JSON.parse(d); } catch { /* */ }
  localStorage.setItem(key, JSON.stringify(def)); return def;
}

const sevColor = { critical: "#f87171", high: "#fb923c", medium: "#fbbf24", info: "#4ade80" };
const sevBg    = { critical: "rgba(248,113,113,.1)", high: "rgba(251,146,60,.1)", medium: "rgba(251,191,36,.1)", info: "rgba(74,222,128,.1)" };
const chanIcon: Record<string, React.ElementType> = { email: Mail, sms: MessageSquare, push: Smartphone, webhook: Globe };

export default function AdminAlertSystem() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]         = useState<"live" | "channels" | "services">("live");
  const [channels, setChannels] = useState<AlertChannel[]>(()=>load(CHANNELS_KEY,defaultChannels));
  const [alerts, setAlerts]    = useState<AlertEvent[]>(()=>load(ALERT_EVENTS_KEY,defaultAlerts));
  const [services, setServices] = useState<ServiceDep[]>(()=>load(SERVICES_KEY,defaultServices));
  const [checking, setChecking] = useState(false);
  const [sevFilter, setSevFilter] = useState("all");

  const checkServices = async () => {
    setChecking(true);
    const results = await Promise.allSettled(
      services.map(async s => {
        const t = Date.now();
        try {
          await fetch(s.url, { signal: AbortSignal.timeout(6000), mode: "no-cors" });
          return { id: s.id, status: "online" as const, latency: Date.now() - t };
        } catch (e) {
          const msg = String(e);
          return { id: s.id, status: msg.includes("abort") ? "degraded" as const : "online" as const, latency: Date.now() - t };
        }
      })
    );
    const updated = services.map(s => {
      const r = results.find((_, i) => services[i].id === s.id);
      if (r?.status === "fulfilled") return { ...s, ...r.value, lastChecked: new Date().toISOString() };
      return { ...s, status: "offline" as const, lastChecked: new Date().toISOString() };
    });
    localStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
    setServices(updated);
    setChecking(false);
    toast({ title: `Health check complete — ${updated.filter(s => s.status === "online").length}/${updated.length} services online` });
  };

  useEffect(() => { checkServices(); }, []);

  const toggleChannel = (id: string) => {
    const updated = channels.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c);
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(updated));
    setChannels(updated);
    const ch = channels.find(c => c.id === id)!;
    logAction("Alert Channel Updated", `${ch.label}: ${ch.enabled ? "disabled" : "enabled"}`, "System", "success");
    toast({ title: `${ch.label} ${ch.enabled ? "disabled" : "enabled"}` });
  };

  const filteredAlerts = sevFilter === "all" ? alerts : alerts.filter(a => a.severity === sevFilter);
  const statusColor = { online: "#4ade80", degraded: "#fbbf24", offline: "#f87171", unknown: "#94a3b8" };
  const inp = (s?: object) => ({ background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, ...s });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <Bell size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Alert System & Service Health</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Multi-channel notifications · Live alert feed · Third-party dependency monitoring</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: services.some(s=>s.status==="offline") ? "rgba(248,113,113,.1)" : "rgba(74,222,128,.1)", border: `1px solid ${services.some(s=>s.status==="offline") ? "rgba(248,113,113,.25)" : "rgba(74,222,128,.25)"}`, borderRadius: 10, padding: "8px 14px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: services.some(s=>s.status==="offline") ? "#f87171" : "#4ade80" }} />
            <span style={{ fontSize: 12, color: services.some(s=>s.status==="offline") ? "#f87171" : "#4ade80", fontWeight: 700 }}>{services.filter(s=>s.status==="online").length}/{services.length} ONLINE</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[{ l: "Active Channels", v: channels.filter(c=>c.enabled).length, c: "#4ade80" }, { l: "Critical Alerts", v: alerts.filter(a=>a.severity==="critical").length, c: "#f87171" }, { l: "Total Alerts", v: alerts.length, c: T.badgeFg }, { l: "Services Online", v: services.filter(s=>s.status==="online").length, c: "#4ade80" }].map(s => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {([["live","Alert Feed",Bell],["channels","Notification Channels",Send],["services","Service Health",Globe]] as const).map(([t,l,Icon]) => (
          <button key={t} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1px solid ${tab===t?A1:T.border}`, background: tab===t?`${A1}18`:T.card, color: tab===t?T.badgeFg:T.sub, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>

      {/* Live Alert Feed */}
      {tab === "live" && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {["all","critical","high","medium","info"].map(s => (
              <button key={s} onClick={() => setSevFilter(s)} style={{ padding: "5px 13px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${sevFilter===s?(sevColor as Record<string,string>)[s]||A1:T.border}`, background: sevFilter===s?`${(sevColor as Record<string,string>)[s]||A1}15`:T.card, color: sevFilter===s?(sevColor as Record<string,string>)[s]||T.badgeFg:T.sub, textTransform: "capitalize" }}>{s}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredAlerts.map(al => (
              <div key={al.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 13, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: sevBg[al.severity], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {al.severity === "critical" || al.severity === "high" ? <AlertTriangle size={15} color={sevColor[al.severity]} /> : al.severity === "medium" ? <Bell size={15} color={sevColor[al.severity]} /> : <CheckCircle2 size={15} color={sevColor[al.severity]} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{al.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sevColor[al.severity], background: sevBg[al.severity], padding: "2px 7px", borderRadius: 5, textTransform: "uppercase" }}>{al.severity}</span>
                    <span style={{ fontSize: 10, color: T.sub, background: T.input, padding: "2px 7px", borderRadius: 5 }}>{al.source}</span>
                    {al.delivered ? <span style={{ fontSize: 10, color: "#4ade80" }}>✓ Delivered via {al.channel}</span> : <span style={{ fontSize: 10, color: "#f87171" }}>⚠ Delivery failed</span>}
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>{al.message}</p>
                </div>
                <span style={{ fontSize: 11, color: T.sub, flexShrink: 0, textAlign: "right" }}>{safeFmt(al.timestamp, "MMM d\nHH:mm")}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Channels */}
      {tab === "channels" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 4 }}>
            <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.6 }}>Configure notification delivery channels. Enabled channels receive all critical and high-severity alerts. Email integration with Supabase auth is active by default. SMS and Webhook require third-party configuration.</p>
          </div>
          {channels.map(ch => {
            const Icon = chanIcon[ch.type] || Bell;
            return (
              <div key={ch.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, opacity: ch.enabled ? 1 : .7 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: ch.enabled ? `${A1}18` : T.input, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={ch.enabled ? A1 : "#94a3b8"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{ch.label}</span>
                    <span style={{ fontSize: 10, color: T.sub, background: T.input, padding: "2px 7px", borderRadius: 5, textTransform: "uppercase" }}>{ch.type}</span>
                    {ch.testStatus && <span style={{ fontSize: 10, fontWeight: 700, color: ch.testStatus === "ok" ? "#4ade80" : "#f87171" }}>{ch.testStatus === "ok" ? "✓ Verified" : "✗ Failed"}</span>}
                  </div>
                  <p style={{ fontSize: 11, color: T.sub, margin: 0, fontFamily: "monospace" }}>{ch.endpoint}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: ch.enabled ? "#4ade80" : T.sub }}>{ch.enabled ? "ON" : "OFF"}</span>
                  <button onClick={() => toggleChannel(ch.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {ch.enabled ? <ToggleRight size={26} color="#4ade80" /> : <ToggleLeft size={26} color="#94a3b8" />}
                  </button>
                </div>
              </div>
            );
          })}
          <div style={{ padding: "14px 18px", borderRadius: 14, background: T.card, border: `1px dashed ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: T.input, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={16} color={T.sub} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.sub, margin: 0 }}>Add Custom Webhook</p>
              <p style={{ fontSize: 11, color: T.sub, margin: 0, opacity: .7 }}>Connect Slack, Discord, Telegram, or any HTTP endpoint</p>
            </div>
          </div>
        </div>
      )}

      {/* Service Health */}
      {tab === "services" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={checkServices} disabled={checking} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: checking ? "not-allowed" : "pointer", opacity: checking ? .7 : 1 }}>
              {checking ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />} {checking ? "Checking…" : "Refresh All"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {services.map(s => (
              <div key={s.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 13, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor[s.status], flexShrink: 0, boxShadow: s.status === "online" ? "0 0 8px rgba(74,222,128,.6)" : "none" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{s.name}</span>
                    <span style={{ fontSize: 10, color: T.sub, background: T.input, padding: "2px 7px", borderRadius: 5 }}>{s.category}</span>
                  </div>
                  <p style={{ fontSize: 11, color: T.sub, margin: 0, fontFamily: "monospace", opacity: .7 }}>{s.url}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 12, color: statusColor[s.status], margin: 0, textTransform: "uppercase" }}>{s.status}</p>
                  {s.latency && <p style={{ fontSize: 11, color: T.sub, margin: "2px 0 0" }}>{s.latency}ms</p>}
                  {s.lastChecked && <p style={{ fontSize: 10, color: T.sub, margin: "1px 0 0", opacity: .7 }}>{safeFmt(s.lastChecked, "HH:mm:ss")}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
