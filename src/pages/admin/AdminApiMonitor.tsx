import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw, BarChart3, Globe } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const INTEGRATIONS = [
  { name:"Razorpay Payment API", status:"healthy", latency:280, uptime:99.9, errors:0 },
  { name:"Twilio SMS API", status:"healthy", latency:180, uptime:99.7, errors:2 },
  { name:"SendGrid Email API", status:"healthy", latency:120, uptime:99.8, errors:0 },
  { name:"Google Maps API", status:"degraded", latency:2400, uptime:97.2, errors:14 },
  { name:"Aadhaar KYC API", status:"healthy", latency:840, uptime:98.4, errors:1 },
  { name:"PAN Verification API", status:"down", latency:0, uptime:0, errors:100 },
];

export default function AdminApiMonitor() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"integrations"|"health"|"logs">("integrations");

  const refresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 2000); };

  const statusColor = (s: string) => s==="healthy"?"#4ade80":s==="degraded"?"#fbbf24":"#f87171";

  const stats = [
    { label:"Integrations", value:INTEGRATIONS.length, color:"#60a5fa", icon:Globe },
    { label:"Healthy", value:INTEGRATIONS.filter(i=>i.status==="healthy").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Degraded", value:INTEGRATIONS.filter(i=>i.status==="degraded").length, color:"#fbbf24", icon:AlertTriangle },
    { label:"Down", value:INTEGRATIONS.filter(i=>i.status==="down").length, color:"#f87171", icon:XCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>API Integration Monitor</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor third-party API health, latency, uptime, and error rates in real time.</p>
        </div>
        <button onClick={refresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: A1, color:"#fff", opacity:refreshing?.6:1 }}>
          <RefreshCw className={`h-4 w-4 ${refreshing?"animate-spin":""}`} /> {refreshing?"Refreshing…":"Refresh All"}
        </button>
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
        {(["integrations","health","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "integrations" ? "API Status" : tab === "health" ? "Health Metrics" : "Error Logs"}
          </button>
        ))}
      </div>

      {activeTab === "integrations" && (
        <div className="space-y-3">
          {INTEGRATIONS.map(api => (
            <div key={api.name} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: api.status!=="healthy"?`${statusColor(api.status)}40`:T.border }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${api.status==="healthy"?"animate-pulse":""}`} style={{ background: statusColor(api.status) }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{api.name}</p>
                    <div className="flex gap-4 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: T.sub }}>Latency: <strong style={{ color: T.text }}>{api.status==="down"?"—":`${api.latency}ms`}</strong></span>
                      <span className="text-xs" style={{ color: T.sub }}>Uptime: <strong style={{ color: T.text }}>{api.uptime}%</strong></span>
                      {api.errors > 0 && <span className="text-xs text-red-400">Errors: {api.errors}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:`${statusColor(api.status)}18`, color: statusColor(api.status) }}>
                  {api.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "health" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Latency Overview</h3>
            {INTEGRATIONS.filter(a=>a.status!=="down").map(api => (
              <div key={api.name} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: T.text }}>{api.name}</span>
                  <span className="font-mono text-xs font-bold" style={{ color: api.latency>1000?"#f87171":api.latency>500?"#fbbf24":"#4ade80" }}>{api.latency}ms</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                  <div className="h-full rounded-full" style={{ width:`${Math.min(api.latency/30,100)}%`, background: api.latency>1000?"#f87171":api.latency>500?"#fbbf24":"#4ade80" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Alert Configuration</h3>
            {[
              { label:"API latency >1000ms alert", active:true },
              { label:"API downtime notification", active:true },
              { label:"Error rate >5% alert", active:true },
              { label:"Uptime <99% weekly report", active:true },
              { label:"Auto-failover on API down", active:false },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{a.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.active?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"}`}>{a.active?"Active":"Off"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>API Error Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { api:"PAN Verification API", error:"Connection timeout (504)", time:"10 min ago", type:"down" },
              { api:"Google Maps API", error:"Latency spike: 2400ms", time:"1 hr ago", type:"degraded" },
              { api:"Twilio SMS API", error:"Rate limit exceeded (429)", time:"2 hrs ago", type:"error" },
              { api:"Aadhaar KYC API", error:"Invalid cert (SSL)", time:"3 hrs ago", type:"error" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.api}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.error}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type==="down"?"bg-red-500/15 text-red-400":l.type==="degraded"?"bg-amber-500/15 text-amber-400":"bg-red-500/15 text-red-400"}`}>{l.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
