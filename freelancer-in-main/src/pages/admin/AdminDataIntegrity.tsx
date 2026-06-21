import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Shield, XCircle, Activity, Link } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const RELATIONSHIPS = [
  { id:"r1", table:"orders", fk:"user_id → users.id", status:"valid", records:42000, orphans:0 },
  { id:"r2", table:"transactions", fk:"order_id → orders.id", status:"valid", records:38000, orphans:0 },
  { id:"r3", table:"reviews", fk:"job_id → jobs.id", status:"error", records:12000, orphans:34 },
  { id:"r4", table:"bids", fk:"freelancer_id → users.id", status:"valid", records:8400, orphans:0 },
  { id:"r5", table:"notifications", fk:"user_id → users.id", status:"warning", records:94000, orphans:12 },
  { id:"r6", table:"escrow", fk:"order_id → orders.id", status:"valid", records:4200, orphans:0 },
];

export default function AdminDataIntegrity() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [validating, setValidating] = useState(false);
  const [lastCheck, setLastCheck] = useState("2 hrs ago");
  const [repairing, setRepairing] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"relationships"|"checks"|"logs">("relationships");

  const runValidation = () => {
    setValidating(true);
    setTimeout(() => { setValidating(false); setLastCheck("just now"); }, 2500);
  };

  const repairRelationship = (id: string) => {
    setRepairing(id);
    setTimeout(() => setRepairing(null), 2000);
  };

  const statusColor = (s: string) => s === "valid" ? "#4ade80" : s === "error" ? "#f87171" : "#fbbf24";
  const statusIcon = (s: string) => s === "valid" ? CheckCircle2 : s === "error" ? XCircle : AlertTriangle;

  const stats = [
    { label:"Tables Monitored", value:RELATIONSHIPS.length, color:"#60a5fa", icon:Database },
    { label:"Valid Relations", value:RELATIONSHIPS.filter(r=>r.status==="valid").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Errors", value:RELATIONSHIPS.filter(r=>r.status==="error").length, color:"#f87171", icon:XCircle },
    { label:"Warnings", value:RELATIONSHIPS.filter(r=>r.status==="warning").length, color:"#fbbf24", icon:AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Data Integrity Relationship System</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Validate foreign key relationships, detect orphan records, and repair inconsistencies.</p>
        </div>
        <button onClick={runValidation} disabled={validating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: A1, color:"#fff", opacity: validating ? .6 : 1 }}>
          <RefreshCw className={`h-4 w-4 ${validating ? "animate-spin" : ""}`} />
          {validating ? "Validating…" : "Run Full Check"}
        </button>
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
        {(["relationships","checks","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "relationships" ? "FK Relationships" : tab === "checks" ? "Consistency Checks" : "Audit Logs"}
          </button>
        ))}
      </div>

      {activeTab === "relationships" && (
        <div className="space-y-3">
          {RELATIONSHIPS.map(rel => {
            const StatusIcon = statusIcon(rel.status);
            return (
              <div key={rel.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <StatusIcon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: statusColor(rel.status) }} />
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm font-mono" style={{ color: T.text }}>{rel.table}</span>
                        <Link className="h-3.5 w-3.5" style={{ color: T.sub }} />
                        <span className="text-xs font-mono" style={{ color: T.sub }}>{rel.fk}</span>
                      </div>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs" style={{ color: T.sub }}>{rel.records.toLocaleString()} records</span>
                        {rel.orphans > 0 && <span className="text-xs text-red-400">⚠ {rel.orphans} orphan records</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:`${statusColor(rel.status)}18`, color: statusColor(rel.status) }}>
                      {rel.status}
                    </span>
                    {rel.status !== "valid" && (
                      <button onClick={() => repairRelationship(rel.id)} disabled={repairing === rel.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={{ background: A1, color:"#fff", opacity: repairing === rel.id ? .6 : 1 }}>
                        {repairing === rel.id ? "Repairing…" : "Repair"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "checks" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold" style={{ color: T.text }}>Consistency Checks</h3>
              <span className="text-xs" style={{ color: T.sub }}>Last run: {lastCheck}</span>
            </div>
            {[
              { check:"Null FK references", result:"0 found", ok:true },
              { check:"Orphan records", result:"46 found", ok:false },
              { check:"Circular references", result:"0 found", ok:true },
              { check:"Duplicate primary keys", result:"0 found", ok:true },
              { check:"Missing required fields", result:"0 found", ok:true },
              { check:"Type mismatches", result:"0 found", ok:true },
            ].map(c => (
              <div key={c.check} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-3">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  <span className="text-sm" style={{ color: T.text }}>{c.check}</span>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: c.ok ? "#4ade80" : "#f87171" }}>{c.result}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Data Integrity Alerts</h3>
            {[
              { label:"Orphan detection alert", active:true, channel:"Email" },
              { label:"FK violation alert", active:true, channel:"Email + In-app" },
              { label:"Duplicate key alert", active:true, channel:"In-app" },
              { label:"Daily integrity report", active:false, channel:"Email" },
              { label:"Repair completion alert", active:true, channel:"In-app" },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: T.text }}>{a.label}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{a.channel}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {a.active ? "Active" : "Off"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Relationship Audit Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"FK validation run", table:"all tables", result:"46 orphans found", time:"2 hrs ago", severity:"warning" },
              { event:"Repair initiated", table:"reviews", result:"34 orphans cleaned", time:"1 day ago", severity:"info" },
              { event:"Integrity check passed", table:"all tables", result:"0 issues", time:"2 days ago", severity:"info" },
              { event:"Orphan spike detected", table:"notifications", result:"Alert sent to admin", time:"3 days ago", severity:"warning" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${l.severity === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{l.table} · {l.result}</p>
                    <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.severity === "warning" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
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
