import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { CalendarClock, CheckCircle2, AlertTriangle, Play, Pause, RefreshCw, Clock, XCircle } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const JOBS = [
  { id:"j1", name:"Daily settlement processing", cron:"0 2 * * *", next:"Tomorrow 02:00", status:"active", lastRun:"Yesterday 02:01", lastResult:"success" },
  { id:"j2", name:"Weekly report generation", cron:"0 8 * * 1", next:"Monday 08:00", status:"active", lastRun:"Last Monday", lastResult:"success" },
  { id:"j3", name:"Hourly session cleanup", cron:"0 * * * *", next:"In 34 min", status:"active", lastRun:"1 hr ago", lastResult:"success" },
  { id:"j4", name:"Monthly invoice generation", cron:"0 9 1 * *", next:"May 1st 09:00", status:"paused", lastRun:"Apr 1st", lastResult:"success" },
  { id:"j5", name:"DB backup snapshot", cron:"0 0 * * *", next:"Tomorrow 00:00", status:"active", lastRun:"Today 00:01", lastResult:"failed" },
];

export default function AdminJobScheduler() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [jobs, setJobs] = useState(JOBS);
  const [running, setRunning] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"jobs"|"config"|"logs">("jobs");

  const toggleJob = (id: string) => setJobs(prev => prev.map(j => j.id===id?{...j, status:j.status==="active"?"paused":"active"}:j));
  const runNow = (id: string) => { setRunning(id); setTimeout(() => setRunning(null), 2500); };

  const statusColor = (s: string) => s==="active"?"#4ade80":"#94a3b8";

  const stats = [
    { label:"Scheduled Jobs", value:jobs.length, color:"#60a5fa", icon:CalendarClock },
    { label:"Active", value:jobs.filter(j=>j.status==="active").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Paused", value:jobs.filter(j=>j.status==="paused").length, color:"#94a3b8", icon:Pause },
    { label:"Last Failed", value:jobs.filter(j=>j.lastResult==="failed").length, color:"#f87171", icon:XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Job Scheduler</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Manage scheduled cron jobs, monitor execution status, and run jobs on demand.</p>
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
        {(["jobs","config","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "jobs" ? "Scheduled Jobs" : tab === "config" ? "Scheduler Config" : "Execution Logs"}
          </button>
        ))}
      </div>

      {activeTab === "jobs" && (
        <div className="space-y-3">
          {jobs.map(j => (
            <div key={j.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-sm" style={{ color: T.text }}>{j.name}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor(j.status)}18`, color: statusColor(j.status) }}>{j.status}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${j.lastResult==="success"?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"}`}>{j.lastResult}</span>
                  </div>
                  <div className="flex gap-4 mt-1 flex-wrap">
                    <span className="text-xs font-mono" style={{ color: T.sub }}>Cron: {j.cron}</span>
                    <span className="text-xs" style={{ color: T.sub }}>Next: <strong style={{ color: T.text }}>{j.next}</strong></span>
                    <span className="text-xs" style={{ color: T.sub }}>Last: {j.lastRun}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleJob(j.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: T.sub }}>
                    {j.status==="active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button onClick={() => runNow(j.id)} disabled={running===j.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: A1, color:"#fff", opacity:running===j.id?.6:1 }}>
                    <Play className={`h-3 w-3 ${running===j.id?"animate-pulse":""}`} />
                    {running===j.id?"Running…":"Run Now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Scheduler Settings</h3>
            {[
              { label:"Duplicate job prevention", active:true },
              { label:"Job overlap prevention", active:true },
              { label:"Job timeout detection (>10 min)", active:true },
              { label:"Failure recovery (auto-retry)", active:true },
              { label:"Send alert on failure", active:true },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{s.label}</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Execution Health</h3>
            {[
              { label:"Jobs executed (24h)", value:"24" },
              { label:"Success rate", value:"95.8%" },
              { label:"Avg duration", value:"1m 24s" },
              { label:"Max concurrent jobs", value:"5" },
              { label:"Retry limit", value:"3×" },
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
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Job Execution Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { job:"Hourly session cleanup", duration:"3s", result:"success", time:"1 hr ago" },
              { job:"DB backup snapshot", duration:"—", result:"failed", time:"Today 00:01", err:"Storage quota exceeded" },
              { job:"Daily settlement processing", duration:"1m 42s", result:"success", time:"Yesterday 02:01" },
              { job:"Weekly report generation", duration:"4m 12s", result:"success", time:"Last Monday" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.job}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.time}{l.duration!=="—"?` · ${l.duration}`:""}</p>
                  {l.err && <p className="text-xs text-red-400">{l.err}</p>}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.result==="success"?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"}`}>{l.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
