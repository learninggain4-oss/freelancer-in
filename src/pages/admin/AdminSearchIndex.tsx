import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Search, RefreshCw, CheckCircle2, AlertTriangle, Activity, Play, Pause, Shield } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const INDEXES = [
  { name:"jobs", docs:42800, status:"healthy", lastIndexed:"5 min ago", size:"128 MB" },
  { name:"freelancers", docs:18200, status:"healthy", lastIndexed:"5 min ago", size:"64 MB" },
  { name:"reviews", docs:31000, status:"stale", lastIndexed:"2 hrs ago", size:"42 MB" },
  { name:"skills", docs:420, status:"healthy", lastIndexed:"1 hr ago", size:"2 MB" },
  { name:"blog_posts", docs:840, status:"corrupted", lastIndexed:"Failed", size:"8 MB" },
];

export default function AdminSearchIndex() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [rebuilding, setRebuilding] = useState<string|null>(null);
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [validateResult, setValidateResult] = useState<null|"pass"|"fail">(null);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<"indexes"|"config"|"logs">("indexes");
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);

  const rebuild = (name: string) => {
    setRebuilding(name);
    setTimeout(() => setRebuilding(null), 3000);
  };

  const validate = () => {
    setValidating(true);
    setValidateResult(null);
    setTimeout(() => { setValidating(false); setValidateResult("pass"); }, 2000);
  };

  const statusColor = (s: string) => s === "healthy" ? "#4ade80" : s === "stale" ? "#fbbf24" : "#f87171";

  const stats = [
    { label:"Total Indexes", value:INDEXES.length, color:"#60a5fa", icon:Search },
    { label:"Healthy", value:INDEXES.filter(i=>i.status==="healthy").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Stale", value:INDEXES.filter(i=>i.status==="stale").length, color:"#fbbf24", icon:AlertTriangle },
    { label:"Corrupted", value:INDEXES.filter(i=>i.status==="corrupted").length, color:"#f87171", icon:AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Search Index Management</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Rebuild, validate, and monitor search indexes. Detect corruption and recover failed indexes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSearchEnabled(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all"
            style={{ borderColor: searchEnabled ? "#4ade80" : "#f87171", color: searchEnabled ? "#4ade80" : "#f87171" }}>
            {searchEnabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            Search {searchEnabled ? "Live" : "Paused"}
          </button>
        </div>
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
        {(["indexes","config","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "indexes" ? "Index Status" : tab === "config" ? "Configuration" : "Error Logs"}
          </button>
        ))}
      </div>

      {activeTab === "indexes" && (
        <div className="space-y-3">
          {INDEXES.map(idx => (
            <div key={idx.name} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full" style={{ background: statusColor(idx.status) }} />
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold font-mono text-sm" style={{ color: T.text }}>{idx.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor(idx.status)}18`, color: statusColor(idx.status) }}>
                        {idx.status}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: T.sub }}>
                      {idx.docs.toLocaleString()} docs · {idx.size} · Last indexed: {idx.lastIndexed}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => rebuild(idx.name)} disabled={rebuilding === idx.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: A1, color:"#fff", opacity: rebuilding === idx.name ? .6 : 1 }}>
                    <RefreshCw className={`h-3 w-3 ${rebuilding === idx.name ? "animate-spin" : ""}`} />
                    {rebuilding === idx.name ? "Rebuilding…" : "Rebuild"}
                  </button>
                  {idx.status !== "healthy" && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background:"rgba(248,113,113,.15)", color:"#f87171" }}>
                      Recover
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Indexing Configuration</h3>
            {[
              { label:"Auto-indexing scheduler", checked:schedulerEnabled, set:setSchedulerEnabled },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm font-bold" style={{ color: T.text }}>{s.label}</span>
                <button onClick={() => s.set(v => !v)} className="w-12 h-6 rounded-full relative transition-all" style={{ background: s.checked ? A1 : T.border }}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.checked ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="p-3 rounded-xl border space-y-2" style={{ borderColor: T.border }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.sub }}>Index Refresh Schedule</p>
              <select className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: T.input, borderColor: T.border, color: T.text }}>
                <option>Every 5 minutes</option>
                <option>Every 15 minutes</option>
                <option>Every hour</option>
                <option>Every 6 hours</option>
              </select>
            </div>
            <button onClick={validate} disabled={validating}
              className="w-full py-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all"
              style={{ borderColor: A1, color: A1, opacity: validating ? .6 : 1 }}>
              <Shield className={`h-4 w-4 ${validating ? "animate-pulse" : ""}`} />
              {validating ? "Validating…" : "Validate Index Integrity"}
            </button>
            {validateResult === "pass" && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400 font-bold">All indexes passed integrity check</span>
              </div>
            )}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Search Performance</h3>
            {[
              { label:"Avg query time", value:"12ms" },
              { label:"Queries/min", value:"342" },
              { label:"Cache hit rate", value:"84%" },
              { label:"Index storage total", value:"244 MB" },
              { label:"Total documents", value:"93,260" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono text-sm" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Index Error Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Index corruption detected", index:"blog_posts", err:"Checksum mismatch", time:"2 hrs ago", severity:"error" },
              { event:"Rebuild completed", index:"reviews", err:"—", time:"30 min ago", severity:"info" },
              { event:"Stale index warning", index:"reviews", err:"Last update >2h ago", time:"2 hrs ago", severity:"warning" },
              { event:"Integrity check passed", index:"jobs", err:"—", time:"5 min ago", severity:"info" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>Index: {l.index}{l.err !== "—" ? ` · ${l.err}` : ""}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.severity === "error" ? "bg-red-500/15 text-red-400" : l.severity === "warning" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
                  {l.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
