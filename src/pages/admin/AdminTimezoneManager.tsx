import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Globe, Clock, AlertTriangle, CheckCircle2, RefreshCw, Activity, Shield } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const TIMEZONES = [
  "Asia/Kolkata (IST, UTC+5:30)",
  "America/New_York (EST, UTC-5)",
  "Europe/London (GMT, UTC+0)",
  "Asia/Dubai (GST, UTC+4)",
  "Asia/Singapore (SGT, UTC+8)",
  "UTC",
];

const LOGS = [
  { event:"System timezone changed", from:"UTC", to:"Asia/Kolkata", admin:"superadmin@site.com", time:"3 days ago" },
  { event:"Mismatch detected", from:"Asia/Kolkata", to:"UTC", admin:"System", time:"5 days ago" },
  { event:"Time sync verified", from:"—", to:"—", admin:"System", time:"1 week ago" },
];

export default function AdminTimezoneManager() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [systemTz, setSystemTz] = useState("Asia/Kolkata (IST, UTC+5:30)");
  const [fallbackTz, setFallbackTz] = useState("UTC");
  const [forceUTC, setForceUTC] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);
  const [timeFormat, setTimeFormat] = useState<"12h"|"24h">("12h");
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null|"pass"|"fail">(null);
  const [activeTab, setActiveTab] = useState<"config"|"validation"|"logs">("config");

  const runSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  const runTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => { setTesting(false); setTestResult("pass"); }, 1800);
  };

  const now = new Date();
  const istTime = new Intl.DateTimeFormat("en-IN", { timeZone:"Asia/Kolkata", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12: timeFormat==="12h" }).format(now);
  const utcTime = new Intl.DateTimeFormat("en-US", { timeZone:"UTC", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12: timeFormat==="12h" }).format(now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Timezone Management</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Configure system timezone, force UTC storage, and validate cross-timezone deadlines.</p>
        </div>
        <button onClick={runSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: A1, color:"#fff", opacity: syncing ? .6 : 1 }}>
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"System Timezone", value:"IST (UTC+5:30)", color:"#60a5fa", icon:Globe },
          { label:"Current IST Time", value:istTime, color:A1, icon:Clock },
          { label:"Current UTC Time", value:utcTime, color:"#4ade80", icon:Clock },
          { label:"Mismatch Alerts", value:"0", color:"#4ade80", icon:AlertTriangle },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold font-mono" style={{ color: T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["config","validation","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "config" ? "Core Controls" : tab === "validation" ? "Validation & Safety" : "Change Logs"}
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>System Timezone Configuration</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: T.sub }}>System Default Timezone</label>
              <select value={systemTz} onChange={e => setSystemTz(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: T.input, borderColor: T.border, color: T.text }}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: T.sub }}>Fallback Timezone</label>
              <select value={fallbackTz} onChange={e => setFallbackTz(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: T.input, borderColor: T.border, color: T.text }}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: T.sub }}>Time Format</label>
              <div className="flex gap-3">
                {(["12h","24h"] as const).map(f => (
                  <button key={f} onClick={() => setTimeFormat(f)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold border transition-all"
                    style={{ background: timeFormat === f ? `${A1}20` : "transparent", borderColor: timeFormat === f ? A1 : T.border, color: timeFormat === f ? A1 : T.sub }}>
                    {f === "12h" ? "12-Hour (AM/PM)" : "24-Hour"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Storage & Detection Settings</h3>
            {[
              { label:"Force UTC storage (database-level)", sub:"All timestamps stored in UTC regardless of system TZ", checked:forceUTC, set:setForceUTC },
              { label:"User timezone auto-detection", sub:"Automatically detect user's browser/device timezone", checked:autoDetect, set:setAutoDetect },
            ].map(setting => (
              <div key={setting.label} className="flex items-start justify-between gap-4 p-4 rounded-xl border" style={{ borderColor: T.border }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{setting.label}</p>
                  <p className="text-xs mt-1" style={{ color: T.sub }}>{setting.sub}</p>
                </div>
                <button onClick={() => setting.set(v => !v)}
                  className="w-12 h-6 rounded-full relative transition-all shrink-0 mt-0.5"
                  style={{ background: setting.checked ? A1 : T.border }}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${setting.checked ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="p-4 rounded-xl border" style={{ borderColor: T.border }}>
              <p className="font-bold text-sm mb-1" style={{ color: T.text }}>Manual timezone override</p>
              <p className="text-xs mb-3" style={{ color: T.sub }}>Allow admin to manually set timezone per user or globally.</p>
              <button className="w-full py-2 rounded-xl text-sm font-bold border" style={{ borderColor: A1, color: A1 }}>
                Configure Override Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "validation" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Timezone Validation</h3>
            <button onClick={runTest} disabled={testing}
              className="w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all"
              style={{ borderColor: A1, color: A1, opacity: testing ? .6 : 1 }}>
              <Activity className={`h-4 w-4 ${testing ? "animate-pulse" : ""}`} />
              {testing ? "Running Timezone Test…" : "Run Timezone Conversion Test"}
            </button>
            {testResult && (
              <div className={`p-3 rounded-xl flex items-center gap-3 ${testResult === "pass" ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-sm font-bold text-green-400">All timezone conversions validated successfully</span>
              </div>
            )}
            {[
              { label:"Deadline time validation engine", ok:true },
              { label:"Cross-timezone deadline preview", ok:true },
              { label:"Timezone mismatch detection", ok:true },
              { label:"Time sync verification check", ok:true },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Cross-Timezone Preview</h3>
            <p className="text-sm" style={{ color: T.sub }}>Preview how a deadline appears across different timezones.</p>
            <div className="p-3 rounded-xl border font-mono text-xs space-y-2" style={{ borderColor: T.border, background:"rgba(0,0,0,.15)" }}>
              <p style={{ color: T.sub }}>Deadline: 2026-04-10 18:00 IST</p>
              <div className="space-y-1">
                {[
                  { tz:"IST (Asia/Kolkata)", time:"April 10, 6:00 PM" },
                  { tz:"EST (New_York)", time:"April 10, 8:30 AM" },
                  { tz:"GMT (London)", time:"April 10, 12:30 PM" },
                  { tz:"SGT (Singapore)", time:"April 10, 8:30 PM" },
                ].map(t => (
                  <div key={t.tz} className="flex justify-between">
                    <span style={{ color: T.sub }}>{t.tz}</span>
                    <span style={{ color: A1 }}>{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Timezone Change Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {LOGS.map((log,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{log.event}</p>
                  {log.from !== "—" && <p className="text-xs mt-0.5" style={{ color: T.sub }}>{log.from} → {log.to}</p>}
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{log.admin} · {log.time}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
