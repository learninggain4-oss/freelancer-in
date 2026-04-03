import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Zap, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Activity, Shield, ArrowRight } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const GATEWAYS = [
  { id:"g1", name:"Razorpay", status:"primary", health:"healthy", uptime:99.9, successRate:98.4, latencyMs:280 },
  { id:"g2", name:"PayU", status:"secondary", health:"healthy", uptime:99.5, successRate:97.8, latencyMs:320 },
  { id:"g3", name:"Cashfree", status:"fallback", health:"degraded", uptime:96.2, successRate:94.1, latencyMs:820 },
];

export default function AdminGatewayFailover() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [gateways, setGateways] = useState(GATEWAYS);
  const [failoverEnabled, setFailoverEnabled] = useState(true);
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [switchTime, setSwitchTime] = useState(30);
  const [testing, setTesting] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"gateways"|"config"|"failover">("gateways");

  const testGateway = (id: string) => { setTesting(id); setTimeout(() => setTesting(null), 2000); };

  const statusColor = (s: string) => s === "primary" ? A1 : s === "secondary" ? "#60a5fa" : "#94a3b8";
  const healthColor = (h: string) => h === "healthy" ? "#4ade80" : h === "degraded" ? "#fbbf24" : "#f87171";

  const stats = [
    { label:"Gateways", value:gateways.length, color:"#60a5fa", icon:Zap },
    { label:"Healthy", value:gateways.filter(g=>g.health==="healthy").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Degraded", value:gateways.filter(g=>g.health==="degraded").length, color:"#fbbf24", icon:AlertTriangle },
    { label:"Failover", value:failoverEnabled?"Auto":"Off", color:failoverEnabled?"#4ade80":"#94a3b8", icon:Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Payment Gateway Failover</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor gateway health, configure auto-failover, test backup gateways, and track failover events.</p>
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
        {(["gateways","config","failover"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "gateways" ? "Gateway Status" : tab === "config" ? "Failover Config" : "Failover History"}
          </button>
        ))}
      </div>

      {activeTab === "gateways" && (
        <div className="space-y-3">
          {gateways.map((g,i) => (
            <div key={g.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-3 w-3 rounded-full" style={{ background: healthColor(g.health) }} />
                    {i < gateways.length-1 && <div className="w-0.5 h-6 border-l border-dashed" style={{ borderColor: T.border }} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-sm" style={{ color: T.text }}>{g.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor(g.status)}18`, color: statusColor(g.status) }}>{g.status}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${healthColor(g.health)}18`, color: healthColor(g.health) }}>{g.health}</span>
                    </div>
                    <div className="flex gap-4 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: T.sub }}>Uptime: <strong style={{ color: T.text }}>{g.uptime}%</strong></span>
                      <span className="text-xs" style={{ color: T.sub }}>Success: <strong style={{ color: T.text }}>{g.successRate}%</strong></span>
                      <span className="text-xs" style={{ color: T.sub }}>Latency: <strong style={{ color: T.text }}>{g.latencyMs}ms</strong></span>
                    </div>
                  </div>
                </div>
                <button onClick={() => testGateway(g.id)} disabled={testing===g.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0"
                  style={{ borderColor: A1, color: A1, opacity:testing===g.id?.6:1 }}>
                  <Activity className={`h-3 w-3 ${testing===g.id?"animate-pulse":""}`} />
                  {testing===g.id?"Testing…":"Test"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Failover Configuration</h3>
            {[
              { label:"Automatic failover", sub:"Switch to backup on primary failure", checked:failoverEnabled, set:setFailoverEnabled },
              { label:"Retry on failure (3×)", sub:"Retry same gateway before failover", checked:retryEnabled, set:setRetryEnabled },
            ].map(s => (
              <div key={s.label} className="flex items-start justify-between gap-4 p-4 rounded-xl border" style={{ borderColor: T.border }}>
                <div><p className="font-bold text-sm" style={{ color: T.text }}>{s.label}</p><p className="text-xs mt-1" style={{ color: T.sub }}>{s.sub}</p></div>
                <button onClick={() => s.set(v=>!v)} className="w-12 h-6 rounded-full relative transition-all shrink-0" style={{ background: s.checked ? A1 : T.border }}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.checked?"left-6":"left-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="text-sm font-bold" style={{ color: T.text }}>Failover trigger time (seconds of failure)</p>
              <div className="flex items-center gap-3">
                <input type="range" min={5} max={120} value={switchTime} onChange={e => setSwitchTime(+e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="font-bold font-mono w-12 text-right" style={{ color: T.text }}>{switchTime}s</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Health Thresholds</h3>
            {[
              { metric:"Failure rate trigger", value:"3 consecutive failures" },
              { metric:"Latency threshold", value:">2000ms avg" },
              { metric:"Success rate minimum", value:"95%" },
              { metric:"Uptime SLA", value:"99%+" },
              { metric:"Alert on failover", value:"Email + SMS" },
            ].map(m => (
              <div key={m.metric} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.metric}</span>
                <span className="font-bold text-sm" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "failover" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Failover History</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { from:"Razorpay", to:"PayU", reason:"3 consecutive failures", duration:"8 min", time:"3 days ago", type:"auto" },
              { from:"PayU", to:"Razorpay", reason:"Primary restored", duration:"—", time:"3 days ago", type:"recovery" },
              { from:"Cashfree", to:"PayU", reason:"Success rate <90%", duration:"24 min", time:"1 week ago", type:"auto" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}15`, color: A1 }}>{l.from}</span>
                    <ArrowRight className="h-3 w-3" style={{ color: T.sub }} />
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${A2}15`, color: A2 }}>{l.to}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: T.text }}>{l.reason}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.time}{l.duration!=="—"?` · ${l.duration}`:""}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.type==="auto"?"bg-amber-500/15 text-amber-400":"bg-green-500/15 text-green-400"}`}>{l.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
