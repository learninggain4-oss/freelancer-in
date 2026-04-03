import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Activity, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Play, Pause, BarChart3 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const JOBS = [
  { id:"j1", name:"Send welcome emails", status:"running", lastRun:"30s ago", duration:"12s", success:1840, failed:2, timeout:0, retries:2 },
  { id:"j2", name:"Process payment settlements", status:"success", lastRun:"5 min ago", duration:"45s", success:322, failed:0, timeout:0, retries:0 },
  { id:"j3", name:"Rebuild search index", status:"failed", lastRun:"15 min ago", duration:"—", success:0, failed:1, timeout:0, retries:3 },
  { id:"j4", name:"Cleanup expired sessions", status:"success", lastRun:"1 hr ago", duration:"3s", success:4120, failed:0, timeout:0, retries:0 },
  { id:"j5", name:"Sync third-party API data", status:"timeout", lastRun:"2 hrs ago", duration:">120s", success:0, failed:0, timeout:1, retries:1 },
  { id:"j6", name:"Generate daily reports", status:"queued", lastRun:"Never", duration:"—", success:0, failed:0, timeout:0, retries:0 },
];

export default function AdminBackgroundJobMonitor() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [jobs, setJobs] = useState(JOBS);
  const [retrying, setRetrying] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"status"|"metrics"|"history">("status");

  const retryJob = (id: string) => {
    setRetrying(id);
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === id ? {...j, status:"running", retries: j.retries+1} : j));
      setRetrying(null);
    }, 2000);
  };

  const statusColor = (s: string) => {
    if (s === "running") return "#60a5fa";
    if (s === "success") return "#4ade80";
    if (s === "failed") return "#f87171";
    if (s === "timeout") return "#fbbf24";
    return "#94a3b8";
  };

  const stats = [
    { label:"Running", value:jobs.filter(j=>j.status==="running").length, color:"#60a5fa", icon:Activity },
    { label:"Success", value:jobs.filter(j=>j.status==="success").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Failed", value:jobs.filter(j=>j.status==="failed").length, color:"#f87171", icon:XCircle },
    { label:"Timeout", value:jobs.filter(j=>j.status==="timeout").length, color:"#fbbf24", icon:Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Background Job Monitor</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor job status, performance metrics, retry failures, and detect timeouts.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["status","metrics","history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "status" ? "Job Status" : tab === "metrics" ? "Performance Metrics" : "History"}
          </button>
        ))}
      </div>

      {activeTab === "status" && (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-3 w-3 rounded-full mt-1.5 ${job.status === "running" ? "animate-pulse" : ""}`} style={{ background: statusColor(job.status) }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{job.name}</p>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: T.sub }}>Last run: {job.lastRun}</span>
                      <span className="text-xs" style={{ color: T.sub }}>Duration: {job.duration}</span>
                      {job.retries > 0 && <span className="text-xs text-amber-400">Retries: {job.retries}</span>}
                    </div>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-xs text-green-400">✓ {job.success.toLocaleString()} success</span>
                      {job.failed > 0 && <span className="text-xs text-red-400">✗ {job.failed} failed</span>}
                      {job.timeout > 0 && <span className="text-xs text-amber-400">⏱ {job.timeout} timeout</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:`${statusColor(job.status)}18`, color: statusColor(job.status) }}>
                    {job.status}
                  </span>
                  {(job.status === "failed" || job.status === "timeout") && (
                    <button onClick={() => retryJob(job.id)} disabled={retrying === job.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background: A1, color:"#fff", opacity: retrying === job.id ? .6 : 1 }}>
                      <RefreshCw className={`h-3 w-3 ${retrying === job.id ? "animate-spin" : ""}`} />
                      Retry
                    </button>
                  )}
                  {job.status === "running" && (
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background:"rgba(248,113,113,.15)", color:"#f87171" }}>
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  )}
                  {job.status === "queued" && (
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background:"rgba(74,222,128,.15)", color:"#4ade80" }}>
                      <Play className="h-3 w-3" /> Run Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Performance Metrics</h3>
            {[
              { label:"Avg Job Duration", value:"24s" },
              { label:"Success Rate (24h)", value:"94.8%" },
              { label:"Total Jobs Run Today", value:"842" },
              { label:"Peak Concurrent Jobs", value:"12" },
              { label:"Avg Retry Count", value:"0.4" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Alert Configuration</h3>
            {[
              { label:"Failure notification", enabled:true },
              { label:"Timeout alert (>60s)", enabled:true },
              { label:"Retry limit reached", enabled:true },
              { label:"Queue backlog alert", enabled:false },
              { label:"Performance degradation", enabled:true },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{a.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.enabled ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {a.enabled ? "Active" : "Off"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Job History (Last 24 hrs)</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { job:"Send welcome emails", time:"10:32 AM", status:"success", dur:"12s" },
              { job:"Process settlements", time:"10:00 AM", status:"success", dur:"45s" },
              { job:"Rebuild search index", time:"09:45 AM", status:"failed", dur:"—" },
              { job:"Sync API data", time:"08:00 AM", status:"timeout", dur:">120s" },
              { job:"Cleanup sessions", time:"06:00 AM", status:"success", dur:"3s" },
            ].map((h,i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{h.job}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{h.time}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono" style={{ color: T.sub }}>{h.dur}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor(h.status)}18`, color: statusColor(h.status) }}>
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
