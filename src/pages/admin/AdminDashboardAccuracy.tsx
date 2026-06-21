import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { BarChart3, RefreshCw, CheckCircle2, AlertTriangle, Eye, Activity, XCircle, Clock } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const METRICS = [
  { id:"m1", name:"Total Revenue (MTD)", value:"₹18,42,000", source:"transactions", status:"verified", lastRefresh:"5 min ago" },
  { id:"m2", name:"Active Freelancers", value:"8,420", source:"users", status:"verified", lastRefresh:"5 min ago" },
  { id:"m3", name:"Open Jobs", value:"1,240", source:"jobs", status:"mismatch", lastRefresh:"12 min ago" },
  { id:"m4", name:"Pending Payments", value:"₹4,20,000", source:"transactions", status:"verified", lastRefresh:"5 min ago" },
  { id:"m5", name:"Dispute Rate", value:"0.8%", source:"disputes", status:"stale", lastRefresh:"2 hrs ago" },
  { id:"m6", name:"Avg Job Value", value:"₹12,400", source:"orders", status:"verified", lastRefresh:"5 min ago" },
];

export default function AdminDashboardAccuracy() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [refreshing, setRefreshing] = useState<string|null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<"metrics"|"sources"|"logs">("metrics");

  const refresh = (id: string) => {
    setRefreshing(id);
    setTimeout(() => setRefreshing(null), 1800);
  };

  const recalcAll = () => {
    setRecalculating(true);
    setTimeout(() => setRecalculating(false), 3000);
  };

  const statusColor = (s: string) => s === "verified" ? "#4ade80" : s === "mismatch" ? "#f87171" : "#fbbf24";

  const stats = [
    { label:"Total Metrics", value:METRICS.length, color:"#60a5fa", icon:BarChart3 },
    { label:"Verified", value:METRICS.filter(m=>m.status==="verified").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Mismatches", value:METRICS.filter(m=>m.status==="mismatch").length, color:"#f87171", icon:XCircle },
    { label:"Stale", value:METRICS.filter(m=>m.status==="stale").length, color:"#fbbf24", icon:Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Dashboard Data Accuracy</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Validate metric calculations, verify data sources, detect mismatches, and force recalculation.</p>
        </div>
        <button onClick={recalcAll} disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: A1, color:"#fff", opacity: recalculating ? .6 : 1 }}>
          <RefreshCw className={`h-4 w-4 ${recalculating?"animate-spin":""}`} />
          {recalculating ? "Recalculating…" : "Recalculate All"}
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
        {(["metrics","sources","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "metrics" ? "Metric Validation" : tab === "sources" ? "Data Sources" : "Audit Logs"}
          </button>
        ))}
      </div>

      {activeTab === "metrics" && (
        <div className="space-y-3">
          {METRICS.map(m => (
            <div key={m.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: m.status !== "verified" ? `${statusColor(m.status)}40` : T.border }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor(m.status) }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{m.name}</p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className="font-mono font-bold text-lg" style={{ color: A1 }}>{m.value}</span>
                      <span className="text-xs self-end" style={{ color: T.sub }}>Source: {m.source} · {m.lastRefresh}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:`${statusColor(m.status)}18`, color: statusColor(m.status) }}>
                    {m.status}
                  </span>
                  <button onClick={() => refresh(m.id)} disabled={refreshing === m.id}
                    className="p-1.5 rounded-xl hover:bg-white/5 transition-all" style={{ color: T.sub }}>
                    <RefreshCw className={`h-4 w-4 ${refreshing===m.id?"animate-spin":""}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "sources" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Data Source Verification</h3>
            {["transactions","users","jobs","orders","disputes"].map(src => (
              <div key={src} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm font-mono" style={{ color: T.text }}>{src}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: T.sub }}>~5 min cache</span>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Consistency Checks</h3>
            {[
              { label:"Calculation verification", ok:true },
              { label:"Source vs display match", ok:false },
              { label:"Stale data detection (>15 min)", ok:true },
              { label:"Metric history tracking", ok:true },
              { label:"Auto-recalculation on mismatch", ok:true },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                {c.ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Metric Audit Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Metric mismatch detected", metric:"Open Jobs", detail:"DB count: 1,240 vs cache: 1,198", time:"12 min ago", type:"error" },
              { event:"Stale metric flagged", metric:"Dispute Rate", detail:"Not refreshed for 2 hours", time:"2 hrs ago", type:"warning" },
              { event:"Recalculation completed", metric:"Total Revenue", detail:"Matches source — ₹18,42,000", time:"5 min ago", type:"success" },
              { event:"Auto-refresh triggered", metric:"All metrics", detail:"Scheduled 5-min refresh", time:"5 min ago", type:"info" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.metric} · {l.detail}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type==="error"?"bg-red-500/15 text-red-400":l.type==="warning"?"bg-amber-500/15 text-amber-400":l.type==="success"?"bg-green-500/15 text-green-400":"bg-blue-500/15 text-blue-400"}`}>{l.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
