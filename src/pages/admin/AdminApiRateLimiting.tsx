import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Ban, Activity, Zap, Globe } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const VIOLATIONS = [
  { id:"v1", ip:"192.168.99.1", requests:842, limit:100, blocked:true, time:"2 min ago" },
  { id:"v2", ip:"103.45.12.99", requests:248, limit:100, blocked:true, time:"15 min ago" },
  { id:"v3", ip:"45.21.8.4", requests:112, limit:100, blocked:false, time:"1 hr ago" },
];

const ENDPOINTS = [
  { path:"/api/jobs/search", limit:30, current:24, unit:"req/min" },
  { path:"/api/users/login", limit:5, current:2, unit:"req/min/IP" },
  { path:"/api/payments/initiate", limit:10, current:8, unit:"req/min/user" },
  { path:"/api/bids/submit", limit:20, current:12, unit:"req/min/user" },
];

export default function AdminApiRateLimiting() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  const [userLimit, setUserLimit] = useState(100);
  const [ipLimit, setIpLimit] = useState(200);
  const [burstLimit, setBurstLimit] = useState(50);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [botDetect, setBotDetect] = useState(true);
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [violations, setViolations] = useState(VIOLATIONS);
  const [activeTab, setActiveTab] = useState<"config"|"violations"|"analytics">("config");

  const unblock = (id: string) => setViolations(prev => prev.map(v => v.id===id?{...v,blocked:false}:v));

  const stats = [
    { label:"Active Blocks", value:violations.filter(v=>v.blocked).length, color:"#f87171", icon:Ban },
    { label:"Violations (24h)", value:violations.length, color:"#fbbf24", icon:AlertTriangle },
    { label:"Rate Limited", value:"3 IPs", color:A1, icon:Shield },
    { label:"API Health", value:globalEnabled?"Active":"Off", color:globalEnabled?"#4ade80":"#94a3b8", icon:Activity },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>API Rate Limiting</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Configure rate limits per user/IP, detect bots, block abusers, and monitor API usage.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              <div>
                <p className="text-xl font-bold" style={{ color: T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["config","violations","analytics"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "config" ? "Rate Limit Config" : tab === "violations" ? "Violations" : "Usage Analytics"}
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: T.text }}>Global Rate Limits</h3>
              <button onClick={() => setGlobalEnabled(v=>!v)} className="w-12 h-6 rounded-full relative transition-all" style={{ background: globalEnabled ? A1 : T.border }}>
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${globalEnabled?"left-6":"left-0.5"}`} />
              </button>
            </div>
            {[
              { label:"Requests per minute (per user)", value:userLimit, set:setUserLimit, min:10, max:1000 },
              { label:"Requests per minute (per IP)", value:ipLimit, set:setIpLimit, min:20, max:2000 },
              { label:"Burst limit", value:burstLimit, set:setBurstLimit, min:10, max:200 },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
                <p className="text-sm font-bold" style={{ color: T.text }}>{s.label}</p>
                <div className="flex items-center gap-3">
                  <input type="range" min={s.min} max={s.max} value={s.value} onChange={e => s.set(+e.target.value)} className="flex-1 accent-indigo-500" />
                  <span className="font-bold font-mono w-16 text-right" style={{ color: T.text }}>{s.value}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Protection Settings</h3>
            {[
              { label:"Auto IP blocking (temporary)", checked:true, sub:"Block IPs exceeding rate limit" },
              { label:"Bot detection trigger", checked:botDetect, sub:"Detect automated request patterns", set:setBotDetect },
              { label:"CAPTCHA after limit exceeded", checked:captchaEnabled, sub:"Require CAPTCHA for suspicious users", set:setCaptchaEnabled },
              { label:"API request throttling", checked:true, sub:"Slow down instead of block" },
            ].map(s => (
              <div key={s.label} className="flex items-start justify-between gap-3 p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div><p className="text-sm font-bold" style={{ color: T.text }}>{s.label}</p><p className="text-xs mt-0.5" style={{ color: T.sub }}>{s.sub}</p></div>
                <button onClick={() => s.set && s.set((v:boolean) => !v)}
                  className="w-12 h-6 rounded-full relative transition-all shrink-0"
                  style={{ background: s.checked ? A1 : T.border }}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.checked?"left-6":"left-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.sub }}>Endpoint-specific limits</p>
              {ENDPOINTS.map(e => (
                <div key={e.path} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                  <div>
                    <p className="text-xs font-mono font-bold" style={{ color: T.text }}>{e.path}</p>
                    <p className="text-[10px]" style={{ color: T.sub }}>{e.unit}</p>
                  </div>
                  <span className="font-mono font-bold text-sm" style={{ color: e.current >= e.limit*.8 ? "#fbbf24" : "#4ade80" }}>{e.current}/{e.limit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "violations" && (
        <div className="space-y-3">
          {violations.map(v => (
            <div key={v.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: v.blocked ? "rgba(248,113,113,.3)" : T.border }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: v.blocked ? "#f87171" : "#fbbf24" }} />
                  <div>
                    <p className="font-bold font-mono text-sm" style={{ color: T.text }}>{v.ip}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{v.requests} requests · Limit: {v.limit} · {v.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {v.blocked && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">BLOCKED</span>}
                  {v.blocked && (
                    <button onClick={() => unblock(v.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor: T.border, color: T.sub }}>
                      Unblock
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>API Usage Analytics</h3>
            {[
              { label:"Total API requests (24h)", value:"482,000" },
              { label:"Rate limited requests", value:"1,240" },
              { label:"Blocked IPs (active)", value:violations.filter(v=>v.blocked).length.toString() },
              { label:"Bot-detected requests", value:"4,200" },
              { label:"CAPTCHA challenges", value:"320" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Suspicious Request Dashboard</h3>
            {[
              { label:"High-frequency IPs", value:"3", color:"#f87171" },
              { label:"Unusual user agents", value:"12", color:"#fbbf24" },
              { label:"Repeated 429 errors", value:"842", color:"#fbbf24" },
              { label:"API key misuse detected", value:"0", color:"#4ade80" },
              { label:"Endpoint scanning detected", value:"1", color:"#f87171" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono text-sm" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
