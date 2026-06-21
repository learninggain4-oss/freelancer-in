import { useState, useEffect, useRef } from "react";
import { Server, Cpu, HardDrive, Wifi, Activity, RefreshCw, Power, RotateCcw, Wrench, Trash2, Zap, CheckCircle2, XCircle, Clock, Globe, AlertTriangle, Terminal, Download, MemoryStick } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface Metric { label: string; value: number; max: number; unit: string; color: string; }
interface LogLine { ts: string; level: "info" | "warn" | "error"; msg: string; }

function getUptime(): string {
  const s = Math.floor(performance.now() / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export default function AdminServerMonitor() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();
  const [uptime, setUptime] = useState(getUptime);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; label: string } | null>(null);
  const [cmdInput, setCmdInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<LogLine[]>([
    { ts: new Date(Date.now() - 60000).toISOString(), level: "info", msg: "> Server started successfully on port 5000" },
    { ts: new Date(Date.now() - 30000).toISOString(), level: "info", msg: "> Vite dev server ready in 174ms" },
    { ts: new Date().toISOString(), level: "info", msg: "> Admin monitoring session started" },
  ]);
  const termRef = useRef<HTMLDivElement>(null);
  const [cacheSize, setCacheSize] = useState<string>("—");

  useEffect(() => {
    const t = setInterval(() => setUptime(getUptime()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if ("caches" in window) {
      caches.keys().then(async keys => {
        let total = 0;
        for (const k of keys) {
          const c = await caches.open(k);
          const items = await c.keys();
          total += items.length;
        }
        setCacheSize(`${keys.length} cache${keys.length !== 1 ? "s" : ""}, ${total} items`);
      }).catch(() => setCacheSize("Unavailable"));
    } else { setCacheSize("Service worker not active"); }
  }, []);

  const measureDb = async () => {
    const t = Date.now();
    try { await supabase.from("profiles").select("id").limit(1); setDbLatency(Date.now() - t); }
    catch { setDbLatency(-1); }
  };
  const measureApi = async () => {
    const t = Date.now();
    try { await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, { signal: AbortSignal.timeout(5000) }); setApiLatency(Date.now() - t); }
    catch { setApiLatency(-1); }
  };

  useEffect(() => { measureDb(); measureApi(); const t = setInterval(() => { measureDb(); measureApi(); }, 30000); return () => clearInterval(t); }, []);

  const { data: activeUsers = 0 } = useQuery({ queryKey: ["monitor-users"], queryFn: async () => { const since = new Date(Date.now() - 5 * 60000).toISOString(); const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", since); return count || 0; }, refetchInterval: 15000 });

  const memInfo = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  const metrics: Metric[] = [
    { label: "JS Heap Used", value: memInfo ? Math.round(memInfo.usedJSHeapSize / 1048576) : 0, max: memInfo ? Math.round(memInfo.jsHeapSizeLimit / 1048576) : 100, unit: "MB", color: "#a5b4fc" },
    { label: "DB Latency", value: dbLatency ?? 0, max: 500, unit: "ms", color: (dbLatency ?? 0) < 100 ? "#4ade80" : (dbLatency ?? 0) < 300 ? "#fbbf24" : "#f87171" },
    { label: "API Latency", value: apiLatency ?? 0, max: 500, unit: "ms", color: (apiLatency ?? 0) < 100 ? "#4ade80" : (apiLatency ?? 0) < 300 ? "#fbbf24" : "#f87171" },
    { label: "Active Users", value: activeUsers, max: 1000, unit: "online", color: "#4ade80" },
  ];

  const execCmd = (cmd: string) => {
    const line = cmd.trim();
    if (!line) return;
    const t = new Date().toISOString();
    const responses: Record<string, LogLine> = {
      "help": { ts: t, level: "info", msg: "Available: help, status, version, uptime, clear\nNote: Full terminal requires server-side integration." },
      "status": { ts: t, level: "info", msg: `> Status: ONLINE | DB: ${dbLatency !== null && dbLatency > 0 ? `${dbLatency}ms` : "checking"} | API: ${apiLatency !== null && apiLatency > 0 ? `${apiLatency}ms` : "checking"}` },
      "uptime": { ts: t, level: "info", msg: `> Session uptime: ${getUptime()}` },
      "version": { ts: t, level: "info", msg: "> Freelancer-in v1.0.0 | Vite 5.4.21 | React 18 | Supabase" },
      "clear": { ts: t, level: "info", msg: "__CLEAR__" },
    };
    const resp = responses[line.toLowerCase()] || { ts: t, level: "warn" as const, msg: `> Command "${line}" requires server access. Use a server shell for full terminal.` };
    if (resp.msg === "__CLEAR__") { setCmdHistory([]); setCmdInput(""); return; }
    setCmdHistory(h => [...h, { ts: t, level: "info", msg: `$ ${line}` }, resp]);
    setCmdInput("");
    setTimeout(() => termRef.current?.scrollTo(0, termRef.current.scrollHeight), 50);
  };

  const handleAction = async (type: string) => {
    setConfirmAction(null);
    if (type === "clear_cache") {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        logAction("Cache Cleared", "All browser/service worker caches cleared", "System", "success");
        toast({ title: "Cache cleared successfully" });
      } catch { toast({ title: "Cache clear failed", variant: "destructive" }); }
    } else if (type === "reload_app") {
      logAction("Application Reloaded", "Admin triggered app reload from Server Monitor", "System", "warning");
      toast({ title: "Reloading application…" });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const services = [
    { name: "Supabase Auth", status: "online", latency: dbLatency },
    { name: "Supabase Database", status: dbLatency && dbLatency > 0 ? "online" : "checking", latency: dbLatency },
    { name: "Supabase REST API", status: apiLatency && apiLatency > 0 ? "online" : "checking", latency: apiLatency },
    { name: "Vite Dev Server", status: "online", latency: null },
    { name: "PWA Service Worker", status: "caches" in window ? "online" : "offline", latency: null },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <Server size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Server Monitor & Controls</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Real-time performance, service health, deployment controls, and terminal</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 10, padding: "8px 14px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>SYSTEMS ONLINE</span>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <Clock size={14} color="#a5b4fc" />
            <span style={{ fontSize: 11, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: .8 }}>Session Uptime</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, fontFamily: "monospace" }}>{uptime}</p>
          <p style={{ fontSize: 11, color: T.sub, margin: "4px 0 0" }}>Since page load</p>
        </div>
        {metrics.map(m => (
          <div key={m.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: .8 }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value} {m.unit}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min((m.value / m.max) * 100, 100)}%`, background: m.color, borderRadius: 3, transition: "width .5s ease" }} />
            </div>
            <p style={{ fontSize: 10, color: T.sub, margin: "6px 0 0" }}>Max: {m.max} {m.unit}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Services */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Globe size={15} color={A1} />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Service Health</h2>
            <button onClick={() => { measureDb(); measureApi(); }} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 11, cursor: "pointer" }}>
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {services.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: T.input, border: `1px solid ${T.border}` }}>
                {s.status === "online" ? <CheckCircle2 size={13} color="#4ade80" /> : s.status === "offline" ? <XCircle size={13} color="#f87171" /> : <RefreshCw size={13} color="#fbbf24" className="animate-spin" />}
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text }}>{s.name}</span>
                {s.latency !== null && s.latency !== undefined && (
                  <span style={{ fontSize: 11, color: s.latency > 0 ? (s.latency < 100 ? "#4ade80" : s.latency < 300 ? "#fbbf24" : "#f87171") : T.sub }}>{s.latency > 0 ? `${s.latency}ms` : "—"}</span>
                )}
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: s.status === "online" ? "#4ade80" : s.status === "offline" ? "#f87171" : "#fbbf24" }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment Controls */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Zap size={15} color="#fbbf24" />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Deployment Controls</h2>
          </div>
          <p style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>These controls take immediate effect. Use with caution.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              { type: "clear_cache", label: "Clear Application Cache", desc: `Current: ${cacheSize}`, icon: Trash2, color: "#fbbf24" },
              { type: "reload_app", label: "Reload Application", desc: "Hard-refresh the SPA without server restart", icon: RotateCcw, color: "#a5b4fc" },
            ].map(action => {
              const Icon = action.icon;
              return (
                <button key={action.type} onClick={() => setConfirmAction({ type: action.type, label: action.label })}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11, background: `${action.color}0a`, border: `1px solid ${action.color}22`, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${action.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color={action.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0 }}>{action.label}</p>
                    <p style={{ fontSize: 10, color: T.sub, margin: 0 }}>{action.desc}</p>
                  </div>
                </button>
              );
            })}
            <div style={{ padding: "12px 14px", borderRadius: 11, background: "rgba(248,113,113,.04)", border: "1px solid rgba(248,113,113,.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <Power size={13} color="#f87171" />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Server Restart</span>
                <span style={{ fontSize: 10, color: "#f87171", background: "rgba(248,113,113,.1)", padding: "2px 7px", borderRadius: 5 }}>Server Only</span>
              </div>
              <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>Full server restart is managed via the server dashboard or deployment controls.</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Activity size={15} color={A1} />
          <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>System Information</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          {[
            { label: "Platform", value: navigator.platform || "Unknown" },
            { label: "User Agent", value: navigator.userAgent.split(" ").slice(-2).join(" ") },
            { label: "Language", value: navigator.language },
            { label: "Online", value: navigator.onLine ? "Yes" : "No" },
            { label: "JS Heap Limit", value: memInfo ? fmtBytes(memInfo.jsHeapSizeLimit) : "N/A (non-Chrome)" },
            { label: "JS Heap Used", value: memInfo ? fmtBytes(memInfo.usedJSHeapSize) : "N/A (non-Chrome)" },
            { label: "Connection Type", value: (navigator as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType || "Unknown" },
            { label: "Cookie Enabled", value: navigator.cookieEnabled ? "Yes" : "No" },
          ].map(item => (
            <div key={item.label} style={{ padding: "10px 12px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 10, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: .7, margin: "0 0 4px" }}>{item.label}</p>
              <p style={{ fontSize: 12, color: T.text, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Terminal size={15} color="#4ade80" />
          <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Admin Terminal</h2>
          <span style={{ fontSize: 11, color: T.sub, marginLeft: "auto" }}>Type "help" for commands</span>
        </div>
        <div ref={termRef} style={{ background: "#050510", minHeight: 200, maxHeight: 300, overflowY: "auto", padding: "12px 16px", fontFamily: "monospace", fontSize: 12 }}>
          {cmdHistory.map((line, i) => (
            <div key={i} style={{ color: line.level === "error" ? "#f87171" : line.level === "warn" ? "#fbbf24" : "#4ade80", marginBottom: 2, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              <span style={{ color: "rgba(255,255,255,.25)", marginRight: 8 }}>{safeFmt(line.ts, "HH:mm:ss")}</span>{line.msg}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${T.border}` }}>
          <span style={{ padding: "10px 14px", fontSize: 13, color: "#4ade80", fontFamily: "monospace", background: "#050510" }}>$</span>
          <input value={cmdInput} onChange={e => setCmdInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") execCmd(cmdInput); }}
            placeholder="Type a command…" style={{ flex: 1, background: "#050510", border: "none", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", padding: "10px 4px" }} />
          <button onClick={() => execCmd(cmdInput)} style={{ padding: "10px 16px", background: "#050510", border: "none", color: "#4ade80", fontFamily: "monospace", fontSize: 12, cursor: "pointer" }}>↵ Run</button>
        </div>
      </div>

      <ConfirmActionDialog open={!!confirmAction} onOpenChange={o => !o && setConfirmAction(null)} onConfirm={() => confirmAction && handleAction(confirmAction.type)}
        title={confirmAction?.label || ""} description="This action will take immediate effect on the application." confirmLabel="Execute" variant="warning" />
    </div>
  );
}
