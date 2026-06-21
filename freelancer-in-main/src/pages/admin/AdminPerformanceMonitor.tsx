import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Clock, Gauge, Zap, XCircle } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const ACTIONS = [
  { id:"a1", action:"User search", avgMs:45, p95Ms:120, threshold:200, status:"ok" },
  { id:"a2", action:"Dashboard load", avgMs:320, p95Ms:820, threshold:500, status:"slow" },
  { id:"a3", action:"Payment processing", avgMs:1200, p95Ms:3200, threshold:2000, status:"critical" },
  { id:"a4", action:"File upload (5MB)", avgMs:840, p95Ms:1800, threshold:2000, status:"ok" },
  { id:"a5", action:"Report generation", avgMs:2400, p95Ms:6000, threshold:3000, status:"slow" },
  { id:"a6", action:"KYC verification", avgMs:180, p95Ms:420, threshold:500, status:"ok" },
];

export default function AdminPerformanceMonitor() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [activeTab, setActiveTab] = useState<"actions"|"alerts"|"logs">("actions");
  const [retrying, setRetrying] = useState<string|null>(null);

  const retry = (id: string) => { setRetrying(id); setTimeout(() => setRetrying(null), 2000); };

  const statusColor = (s: string) => s === "ok" ? "#4ade80" : s === "slow" ? "#fbbf24" : "#f87171";

  const stats = [
    { label:"Avg Response Time", value:"498ms", color:"#60a5fa", icon:Clock },
    { label:"Healthy Actions", value:ACTIONS.filter(a=>a.status==="ok").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Slow Actions", value:ACTIONS.filter(a=>a.status==="slow").length, color:"#fbbf24", icon:AlertTriangle },
    { label:"Critical", value:ACTIONS.filter(a=>a.status==="critical").length, color:"#f87171", icon:XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Admin Performance Monitoring</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor admin action response times, detect slow operations, and set performance thresholds.</p>
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
        {(["actions","alerts","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "actions" ? "Action Metrics" : tab === "alerts" ? "Performance Alerts" : "Execution Logs"}
          </button>
        ))}
      </div>

      {activeTab === "actions" && (
        <div className="space-y-3">
          {ACTIONS.map(a => {
            const pct = Math.min(100, Math.round((a.avgMs / a.threshold) * 100));
            const color = statusColor(a.status);
            return (
              <div key={a.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: a.status !== "ok" ? `${color}40` : T.border }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-sm" style={{ color: T.text }}>{a.action}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${color}18`, color }}>{a.status}</span>
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs" style={{ color: T.sub }}>Avg: <strong style={{ color: T.text }}>{a.avgMs}ms</strong></span>
                      <span className="text-xs" style={{ color: T.sub }}>P95: <strong style={{ color: T.text }}>{a.p95Ms}ms</strong></span>
                      <span className="text-xs" style={{ color: T.sub }}>Threshold: <strong style={{ color: T.text }}>{a.threshold}ms</strong></span>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                        <div className="h-full rounded-full" style={{ width:`${Math.min(pct,100)}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                  {a.status !== "ok" && (
                    <button onClick={() => retry(a.id)} disabled={retrying === a.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0"
                      style={{ background: A1, color:"#fff", opacity: retrying===a.id?.6:1 }}>
                      <Zap className="h-3 w-3" /> {retrying===a.id?"Optimizing…":"Optimize"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Performance Alert Rules</h3>
            {[
              { label:"Action response >500ms", alert:"Warning notification", active:true },
              { label:"Action response >2000ms", alert:"Critical alert", active:true },
              { label:"Action timeout (>10s)", alert:"Email + In-app", active:true },
              { label:"P95 above threshold", alert:"Dashboard alert", active:true },
              { label:"Performance degradation trend", alert:"Weekly summary", active:false },
            ].map(r => (
              <div key={r.label} className="p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm" style={{ color: T.text }}>{r.label}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.active?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"}`}>{r.active?"Active":"Off"}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: T.sub }}>→ {r.alert}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Health Monitoring</h3>
            {[
              { metric:"Response time (avg)", value:"498ms", ok:true },
              { metric:"Response time (p95)", value:"1,840ms", ok:false },
              { metric:"Action timeout rate", value:"0.2%", ok:true },
              { metric:"Slowest action", value:"Payment processing", ok:false },
              { metric:"Optimization opportunities", value:"2 identified", ok:false },
            ].map(m => (
              <div key={m.metric} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-sm" style={{ color: T.text }}>{m.value}</span>
                  {m.ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Slow Action Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { action:"Payment processing", duration:"3,200ms", threshold:"2,000ms", time:"5 min ago", type:"critical" },
              { action:"Report generation", duration:"6,000ms", threshold:"3,000ms", time:"1 hr ago", type:"slow" },
              { action:"Dashboard load", duration:"820ms", threshold:"500ms", time:"30 min ago", type:"slow" },
              { action:"File upload", duration:"1,800ms", threshold:"2,000ms", time:"2 hrs ago", type:"ok" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.action}</p>
                  <p className="text-xs" style={{ color: T.sub }}>Duration: {l.duration} · Threshold: {l.threshold}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type==="critical"?"bg-red-500/15 text-red-400":l.type==="slow"?"bg-amber-500/15 text-amber-400":"bg-green-500/15 text-green-400"}`}>{l.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
