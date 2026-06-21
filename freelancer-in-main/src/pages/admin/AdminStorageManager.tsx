import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { HardDrive, AlertTriangle, CheckCircle2, Trash2, Upload, Activity, XCircle, RefreshCw, Shield } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const BUCKETS = [
  { name:"user-avatars", used:4.2, total:20, files:18200, type:"images" },
  { name:"job-attachments", used:12.8, total:50, files:42000, type:"documents" },
  { name:"id-verification", used:8.4, total:20, files:6800, type:"documents" },
  { name:"chat-files", used:2.1, total:10, files:8400, type:"mixed" },
  { name:"temp-uploads", used:0.8, total:5, files:320, type:"temp" },
];

export default function AdminStorageManager() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [cleaning, setCleaning] = useState(false);
  const [uploadBlocked, setUploadBlocked] = useState(false);
  const [fileSizeLimit, setFileSizeLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<"usage"|"controls"|"logs">("usage");

  const totalUsed = BUCKETS.reduce((a,b) => a + b.used, 0);
  const totalCapacity = BUCKETS.reduce((a,b) => a + b.total, 0);
  const usagePercent = Math.round((totalUsed / totalCapacity) * 100);

  const runCleanup = () => {
    setCleaning(true);
    setTimeout(() => setCleaning(false), 2500);
  };

  const usageColor = usagePercent > 85 ? "#f87171" : usagePercent > 65 ? "#fbbf24" : "#4ade80";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Storage Monitoring</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor disk usage, configure limits, run cleanup tools, and prevent storage exhaustion.</p>
        </div>
        <button onClick={runCleanup} disabled={cleaning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: A1, color:"#fff", opacity: cleaning ? .6 : 1 }}>
          <RefreshCw className={`h-4 w-4 ${cleaning ? "animate-spin" : ""}`} />
          {cleaning ? "Cleaning…" : "Run Cleanup"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Used", value:`${totalUsed.toFixed(1)} GB`, color:usageColor, icon:HardDrive },
          { label:"Total Capacity", value:`${totalCapacity} GB`, color:"#60a5fa", icon:HardDrive },
          { label:"Usage", value:`${usagePercent}%`, color:usageColor, icon:Activity },
          { label:"Total Files", value:BUCKETS.reduce((a,b)=>a+b.files,0).toLocaleString(), color:A1, icon:Upload },
        ].map(s => (
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

      {/* Overall progress */}
      <div className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm" style={{ color: T.text }}>Overall Storage Utilization</span>
          <span className="font-bold font-mono text-sm" style={{ color: usageColor }}>{usagePercent}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: T.border }}>
          <div className="h-full rounded-full transition-all" style={{ width:`${usagePercent}%`, background: usageColor }} />
        </div>
        <p className="text-xs mt-2" style={{ color: T.sub }}>{totalUsed.toFixed(1)} GB used of {totalCapacity} GB</p>
        {usagePercent > 70 && (
          <div className="mt-3 p-3 rounded-xl flex items-center gap-3 bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-bold">Storage usage above 70% — consider running cleanup or expanding capacity</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["usage","controls","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "usage" ? "Bucket Usage" : tab === "controls" ? "Controls" : "Storage Logs"}
          </button>
        ))}
      </div>

      {activeTab === "usage" && (
        <div className="space-y-3">
          {BUCKETS.map(b => {
            const pct = Math.round((b.used / b.total) * 100);
            const color = pct > 85 ? "#f87171" : pct > 65 ? "#fbbf24" : "#4ade80";
            return (
              <div key={b.name} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold font-mono text-sm" style={{ color: T.text }}>{b.name}</span>
                    <span className="ml-3 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}15`, color: A1 }}>{b.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: T.sub }}>{b.files.toLocaleString()} files</span>
                    <span className="font-bold font-mono text-sm" style={{ color }}>{b.used}/{b.total} GB</span>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color:"#f87171" }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
                  <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: color }} />
                </div>
                <p className="text-[10px] mt-1 text-right font-mono" style={{ color: T.sub }}>{pct}% used</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "controls" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Storage Controls</h3>
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border" style={{ borderColor: T.border }}>
              <div>
                <p className="font-bold text-sm" style={{ color: T.text }}>Block uploads when storage full</p>
                <p className="text-xs mt-1" style={{ color: T.sub }}>Prevent new uploads when usage exceeds 95%</p>
              </div>
              <button onClick={() => setUploadBlocked(v => !v)}
                className="w-12 h-6 rounded-full relative transition-all shrink-0"
                style={{ background: uploadBlocked ? A1 : T.border }}>
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${uploadBlocked ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="font-bold text-sm" style={{ color: T.text }}>File size limit per upload</p>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={50} value={fileSizeLimit} onChange={e => setFileSizeLimit(+e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="font-bold font-mono w-16 text-right" style={{ color: T.text }}>{fileSizeLimit} MB</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border" style={{ borderColor: T.border }}>
              <p className="font-bold text-sm mb-1" style={{ color: T.text }}>Storage threshold alert</p>
              <p className="text-xs" style={{ color: T.sub }}>Alert sent when usage exceeds 80% · Currently active</p>
            </div>
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Cleanup & Auto Rules</h3>
            {[
              { label:"Auto-delete temp uploads after 24h", active:true },
              { label:"Compress images on upload", active:true },
              { label:"Archive files older than 1 year", active:false },
              { label:"Storage capacity forecast (weekly)", active:true },
              { label:"Duplicate file detection", active:false },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{r.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {r.active ? "Active" : "Off"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Storage Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Cleanup ran", bucket:"temp-uploads", result:"820 MB freed", time:"1 hr ago", type:"success" },
              { event:"Storage alert", bucket:"job-attachments", result:"Crossed 75% threshold", time:"3 hrs ago", type:"warning" },
              { event:"Large file upload blocked", bucket:"id-verification", result:"File: 48 MB > 10 MB limit", time:"5 hrs ago", type:"warning" },
              { event:"Auto-delete ran", bucket:"temp-uploads", result:"128 files deleted", time:"Yesterday", type:"info" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.bucket} · {l.result}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type === "success" ? "bg-green-500/15 text-green-400" : l.type === "warning" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
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
