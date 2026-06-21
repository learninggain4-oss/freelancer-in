import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Layers, AlertTriangle, CheckCircle2, RefreshCw, Activity, Pause, Play, Trash2, XCircle } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const QUEUES = [
  { id:"q1", name:"Email Queue", size:142, processing:8, failed:2, status:"running" },
  { id:"q2", name:"Notification Queue", size:820, processing:40, failed:0, status:"running" },
  { id:"q3", name:"Payment Processing Queue", size:12, processing:1, failed:0, status:"running" },
  { id:"q4", name:"Export Queue", size:0, processing:0, failed:3, status:"paused" },
  { id:"q5", name:"Search Indexing Queue", size:4200, processing:0, failed:0, status:"crashed" },
];

export default function AdminQueueManagement() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [queues, setQueues] = useState(QUEUES);
  const [restarting, setRestarting] = useState<string|null>(null);
  const [retrying, setRetrying] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"queues"|"metrics"|"logs">("queues");

  const toggleQueue = (id: string) => {
    setQueues(prev => prev.map(q => q.id === id ? {...q, status: q.status === "running" ? "paused" : "running"} : q));
  };

  const restartQueue = (id: string) => {
    setRestarting(id);
    setTimeout(() => {
      setQueues(prev => prev.map(q => q.id === id ? {...q, status:"running"} : q));
      setRestarting(null);
    }, 2500);
  };

  const retryFailed = (id: string) => {
    setRetrying(id);
    setTimeout(() => {
      setQueues(prev => prev.map(q => q.id === id ? {...q, failed:0} : q));
      setRetrying(null);
    }, 2000);
  };

  const statusColor = (s: string) => s === "running" ? "#4ade80" : s === "paused" ? "#fbbf24" : "#f87171";

  const stats = [
    { label:"Total Queued", value:queues.reduce((a,b)=>a+b.size,0).toLocaleString(), color:"#60a5fa", icon:Layers },
    { label:"Processing", value:queues.reduce((a,b)=>a+b.processing,0), color:A1, icon:Activity },
    { label:"Failed Jobs", value:queues.reduce((a,b)=>a+b.failed,0), color:"#f87171", icon:XCircle },
    { label:"Crashed", value:queues.filter(q=>q.status==="crashed").length, color:"#f87171", icon:AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Queue Monitoring</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor job queues, restart crashed workers, retry failed jobs, and prevent queue backlogs.</p>
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
        {(["queues","metrics","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "queues" ? "Queue Status" : tab === "metrics" ? "Performance" : "Queue Logs"}
          </button>
        ))}
      </div>

      {activeTab === "queues" && (
        <div className="space-y-3">
          {queues.map(q => (
            <div key={q.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-3 w-3 rounded-full mt-1 ${q.status === "running" ? "animate-pulse" : ""}`} style={{ background: statusColor(q.status) }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{q.name}</p>
                    <div className="flex gap-4 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: T.sub }}>Queued: <strong style={{ color: T.text }}>{q.size.toLocaleString()}</strong></span>
                      <span className="text-xs" style={{ color: T.sub }}>Processing: <strong style={{ color: T.text }}>{q.processing}</strong></span>
                      {q.failed > 0 && <span className="text-xs text-red-400">Failed: <strong>{q.failed}</strong></span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:`${statusColor(q.status)}18`, color: statusColor(q.status) }}>
                    {q.status}
                  </span>
                  {q.failed > 0 && (
                    <button onClick={() => retryFailed(q.id)} disabled={retrying === q.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background:"rgba(99,102,241,.15)", color: A1, opacity: retrying === q.id ? .6 : 1 }}>
                      <RefreshCw className={`h-3 w-3 ${retrying === q.id ? "animate-spin" : ""}`} />
                      Retry Failed
                    </button>
                  )}
                  {q.status === "crashed" ? (
                    <button onClick={() => restartQueue(q.id)} disabled={restarting === q.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background: A1, color:"#fff", opacity: restarting === q.id ? .6 : 1 }}>
                      <RefreshCw className={`h-3 w-3 ${restarting === q.id ? "animate-spin" : ""}`} />
                      {restarting === q.id ? "Restarting…" : "Restart"}
                    </button>
                  ) : (
                    <button onClick={() => toggleQueue(q.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background: q.status === "running" ? "rgba(248,113,113,.15)" : "rgba(74,222,128,.15)", color: q.status === "running" ? "#f87171" : "#4ade80" }}>
                      {q.status === "running" ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
                    </button>
                  )}
                  <button className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color:"#f87171" }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Queue Performance</h3>
            {[
              { label:"Avg job processing time", value:"1.2s" },
              { label:"Jobs processed (24h)", value:"124,820" },
              { label:"Peak queue size (today)", value:"5,200" },
              { label:"Max concurrent workers", value:"40" },
              { label:"Auto-retry on failure", value:"3x" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Protection Rules</h3>
            {[
              { label:"Duplicate job prevention", active:true },
              { label:"Job overlap prevention", active:true },
              { label:"Job timeout detection (>120s)", active:true },
              { label:"Crash recovery", active:true },
              { label:"Dead letter queue", active:true },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{r.label}</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Queue Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Queue crashed", queue:"Search Indexing Queue", detail:"Worker OOM killed", time:"30 min ago", type:"error" },
              { event:"Failed jobs retried", queue:"Export Queue", detail:"3 jobs requeued", time:"1 hr ago", type:"info" },
              { event:"Queue paused", queue:"Export Queue", detail:"Manual pause by admin", time:"2 hrs ago", type:"warning" },
              { event:"Backlog spike", queue:"Notification Queue", detail:"820 jobs queued", time:"3 hrs ago", type:"warning" },
              { event:"Queue healthy", queue:"Payment Queue", detail:"0 failures", time:"Today 06:00", type:"success" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.queue} · {l.detail}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type === "error" ? "bg-red-500/15 text-red-400" : l.type === "warning" ? "bg-amber-500/15 text-amber-400" : l.type === "success" ? "bg-green-500/15 text-green-400" : "bg-blue-500/15 text-blue-400"}`}>
                  {l.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
