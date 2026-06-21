import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Clock, AlertTriangle, CheckCircle2, RefreshCw, Shield, XCircle, Activity } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

export default function AdminSessionExpiry() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [cookieExpiry, setCookieExpiry] = useState(60);
  const [serverExpiry, setServerExpiry] = useState(60);
  const [refreshEnabled, setRefreshEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"config"|"validation"|"logs">("config");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null|"pass"|"mismatch">(null);

  const mismatch = Math.abs(cookieExpiry - serverExpiry) > 5;

  const runTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(mismatch ? "mismatch" : "pass");
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Session Expiry Management</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Synchronize cookie and server session expiry times, detect mismatches, and configure refresh behavior.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Cookie Expiry", value:`${cookieExpiry} min`, color:mismatch?"#f87171":"#4ade80", icon:Clock },
          { label:"Server Expiry", value:`${serverExpiry} min`, color:mismatch?"#f87171":"#4ade80", icon:Shield },
          { label:"Sync Status", value:mismatch?"MISMATCH":"IN SYNC", color:mismatch?"#f87171":"#4ade80", icon:mismatch?XCircle:CheckCircle2 },
          { label:"Auto-Refresh", value:refreshEnabled?"Active":"Off", color:refreshEnabled?"#4ade80":"#94a3b8", icon:RefreshCw },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              <div>
                <p className="text-lg font-bold" style={{ color: T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mismatch && (
        <div className="p-4 rounded-2xl border flex items-center gap-3 bg-red-500/10 border-red-500/30">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="font-bold text-sm text-red-400">Session expiry mismatch detected!</p>
            <p className="text-xs text-red-300 mt-0.5">Cookie expiry ({cookieExpiry} min) and server expiry ({serverExpiry} min) differ by more than 5 minutes. Users may experience unexpected logouts.</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["config","validation","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "config" ? "Expiry Configuration" : tab === "validation" ? "Sync Validation" : "Expiry Logs"}
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Cookie & Server Configuration</h3>
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="text-sm font-bold" style={{ color: T.text }}>Cookie expiry duration (minutes)</p>
              <div className="flex items-center gap-3">
                <input type="range" min={5} max={480} value={cookieExpiry} onChange={e => setCookieExpiry(+e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="font-bold font-mono w-16 text-right" style={{ color: T.text }}>{cookieExpiry} min</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="text-sm font-bold" style={{ color: T.text }}>Server session expiry (minutes)</p>
              <div className="flex items-center gap-3">
                <input type="range" min={5} max={480} value={serverExpiry} onChange={e => setServerExpiry(+e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="font-bold font-mono w-16 text-right" style={{ color: T.text }}>{serverExpiry} min</span>
              </div>
            </div>
            {[
              { label:"Session refresh option", sub:"Silently refresh token before expiry", checked:refreshEnabled, set:setRefreshEnabled },
              { label:"Expiry sync validation", sub:"Alert when cookie and server expiry differ", checked:syncEnabled, set:setSyncEnabled },
            ].map(s => (
              <div key={s.label} className="flex items-start justify-between gap-4 p-4 rounded-xl border" style={{ borderColor: T.border }}>
                <div><p className="font-bold text-sm" style={{ color: T.text }}>{s.label}</p><p className="text-xs mt-1" style={{ color: T.sub }}>{s.sub}</p></div>
                <button onClick={() => s.set(v => !v)} className="w-12 h-6 rounded-full relative transition-all shrink-0" style={{ background: s.checked ? A1 : T.border }}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.checked ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Session Timeout Control</h3>
            {[
              { label:"Inactivity timeout", value:`${Math.min(cookieExpiry, serverExpiry)} min` },
              { label:"Remember-me duration", value:"30 days" },
              { label:"Admin session timeout", value:"30 min" },
              { label:"API token expiry", value:"24 hours" },
              { label:"Refresh token validity", value:"7 days" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono text-sm" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "validation" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Expiry Sync Validation</h3>
            <button onClick={runTest} disabled={testing}
              className="w-full py-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all"
              style={{ borderColor: A1, color: A1, opacity: testing ? .6 : 1 }}>
              <Activity className={`h-4 w-4 ${testing?"animate-pulse":""}`} />
              {testing ? "Testing Expiry Sync…" : "Run Expiry Verification Test"}
            </button>
            {testResult && (
              <div className={`p-3 rounded-xl flex items-center gap-3 ${testResult==="pass"?"bg-green-500/10 border border-green-500/20":"bg-red-500/10 border border-red-500/20"}`}>
                {testResult==="pass" ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                <span className={`text-sm font-bold ${testResult==="pass"?"text-green-400":"text-red-400"}`}>
                  {testResult==="pass" ? "Cookie and server expiry are in sync" : "Expiry mismatch detected — please align values"}
                </span>
              </div>
            )}
            {[
              { label:"Expiry mismatch alert enabled", ok:syncEnabled },
              { label:"Auto-refresh before expiry", ok:refreshEnabled },
              { label:"Expiry dashboard monitoring", ok:true },
              { label:"Expired session cleanup", ok:true },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                {c.ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Expiry Monitoring</h3>
            {[
              { label:"Sessions expiring in <5 min", value:"12" },
              { label:"Sessions expired today", value:"824" },
              { label:"Forced expirations today", value:"3" },
              { label:"Refresh token renewals", value:"2,142" },
              { label:"Mismatch alerts sent (30d)", value:"0" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Expiry Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Session expired (inactivity)", user:"User_482", detail:`After ${Math.min(cookieExpiry,serverExpiry)} min idle`, time:"5 min ago", type:"info" },
              { event:"Token refreshed", user:"Ravi Kumar", detail:"Auto-refresh before expiry", time:"2 min ago", type:"success" },
              { event:"Forced expiry", user:"Unknown", detail:"Admin-triggered logout", time:"1 hr ago", type:"warning" },
              { event:"Expiry sync checked", user:"System", detail:"Cookie=60min, Server=60min — OK", time:"15 min ago", type:"success" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.user} · {l.detail}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type==="warning"?"bg-amber-500/15 text-amber-400":l.type==="success"?"bg-green-500/15 text-green-400":"bg-blue-500/15 text-blue-400"}`}>{l.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
