import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Play, RotateCcw, Eye, Clock, Shield, XCircle } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const MIGRATIONS = [
  { id:"m1", name:"Add day_of_week to time_slots", version:"v2.4.1", status:"completed", records:4200, time:"2 days ago" },
  { id:"m2", name:"Add max_bookings column", version:"v2.4.1", status:"completed", records:4200, time:"2 days ago" },
  { id:"m3", name:"Create day_settings table", version:"v2.4.2", status:"completed", records:7, time:"1 day ago" },
  { id:"m4", name:"Migrate legacy wallet balances", version:"v2.5.0", status:"pending", records:18200, time:"—" },
  { id:"m5", name:"Add commission tier system", version:"v2.5.0", status:"pending", records:0, time:"—" },
  { id:"m6", name:"Backfill escrow states", version:"v2.5.1", status:"failed", records:0, time:"3 hrs ago" },
];

export default function AdminDataMigration() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [previewId, setPreviewId] = useState<string|null>(null);
  const [dryRunId, setDryRunId] = useState<string|null>(null);
  const [runningId, setRunningId] = useState<string|null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"migrations"|"config"|"logs">("migrations");

  const runMigration = (id: string) => {
    setRunningId(id);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setRunningId(null); return 100; }
        return p + 10;
      });
    }, 200);
  };

  const dryRun = (id: string) => {
    setDryRunId(id);
    setTimeout(() => setDryRunId(null), 2000);
  };

  const statusColor = (s: string) => s === "completed" ? "#4ade80" : s === "failed" ? "#f87171" : s === "pending" ? "#94a3b8" : "#fbbf24";

  const stats = [
    { label:"Total Migrations", value:MIGRATIONS.length, color:"#60a5fa", icon:Database },
    { label:"Completed", value:MIGRATIONS.filter(m=>m.status==="completed").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Pending", value:MIGRATIONS.filter(m=>m.status==="pending").length, color:"#94a3b8", icon:Clock },
    { label:"Failed", value:MIGRATIONS.filter(m=>m.status==="failed").length, color:"#f87171", icon:XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Data Migration Control</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Run, preview, and rollback database migrations safely with auto-backup and integrity checks.</p>
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
        {(["migrations","config","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "migrations" ? "Migration List" : tab === "config" ? "Safety Settings" : "Audit Trail"}
          </button>
        ))}
      </div>

      {activeTab === "migrations" && (
        <div className="space-y-3">
          {MIGRATIONS.map(m => (
            <div key={m.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-2.5 w-2.5 rounded-full mt-1.5" style={{ background: statusColor(m.status) }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: T.text }}>{m.name}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}20`, color: A1 }}>{m.version}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor(m.status)}18`, color: statusColor(m.status) }}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: T.sub }}>
                      {m.records > 0 ? `${m.records.toLocaleString()} records` : "0 records"} · {m.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewId(previewId === m.id ? null : m.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: T.sub }}>
                    <Eye className="h-4 w-4" />
                  </button>
                  {m.status === "pending" && (
                    <>
                      <button onClick={() => dryRun(m.id)} disabled={dryRunId === m.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                        style={{ borderColor: A2, color: A2, opacity: dryRunId === m.id ? .6 : 1 }}>
                        {dryRunId === m.id ? "Running…" : "Dry Run"}
                      </button>
                      <button onClick={() => runMigration(m.id)} disabled={runningId === m.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={{ background: A1, color:"#fff", opacity: runningId === m.id ? .6 : 1 }}>
                        <Play className="h-3 w-3" />
                        {runningId === m.id ? `${progress}%` : "Run"}
                      </button>
                    </>
                  )}
                  {m.status === "failed" && (
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background:"rgba(248,113,113,.15)", color:"#f87171" }}>
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  )}
                  {m.status === "completed" && (
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border"
                      style={{ borderColor: T.border, color: T.sub }}>
                      <RotateCcw className="h-3 w-3" /> Rollback
                    </button>
                  )}
                </div>
              </div>
              {runningId === m.id && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: T.sub }}>
                    <span>Migrating…</span><span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                    <div className="h-full rounded-full transition-all" style={{ width:`${progress}%`, background: A1 }} />
                  </div>
                </div>
              )}
              {previewId === m.id && (
                <div className="mt-3 p-3 rounded-xl border font-mono text-xs" style={{ background:"rgba(0,0,0,.2)", borderColor: T.border, color: T.sub }}>
                  <p>-- {m.name} (v{m.version})</p>
                  <p>ALTER TABLE public.{m.name.toLowerCase().replace(/ /g,"_")} ADD COLUMN IF NOT EXISTS …</p>
                  <p className="text-amber-400">-- ⚠ Auto-backup will run before execution</p>
                  <p className="text-green-400">-- ✓ Rollback available for 24 hours after completion</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Safety Settings</h3>
            {[
              { label:"Auto backup before migration", active:true },
              { label:"Require dry-run before production", active:true },
              { label:"Migration rollback option", active:true },
              { label:"Pause queue during migration", active:true },
              { label:"Send alert on failure", active:true },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{s.label}</span>
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Integrity Verification</h3>
            {[
              { check:"Row count before/after match", ok:true },
              { check:"FK integrity preserved", ok:true },
              { check:"No null required fields", ok:true },
              { check:"Backup checksum verified", ok:true },
              { check:"Migration idempotent", ok:true },
            ].map(c => (
              <div key={c.check} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.check}</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Migration Audit Trail</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Migration failed", name:"Backfill escrow states", err:"FK constraint violation", time:"3 hrs ago", type:"error" },
              { event:"Migration completed", name:"Create day_settings table", err:"7 rows inserted", time:"1 day ago", type:"success" },
              { event:"Dry run passed", name:"Migrate legacy wallets", err:"18,200 rows would be affected", time:"2 days ago", type:"info" },
              { event:"Backup created", name:"Pre-migration backup", err:"Snapshot: 2.4 GB", time:"2 days ago", type:"info" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.name} · {l.err}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type === "error" ? "bg-red-500/15 text-red-400" : l.type === "success" ? "bg-green-500/15 text-green-400" : "bg-blue-500/15 text-blue-400"}`}>
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
