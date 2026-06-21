import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Trash2, Shield, AlertTriangle, CheckCircle2, Clock, RefreshCw, Eye, XCircle, Settings, RotateCcw } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const RULES = [
  { id:"r1", label:"Delete expired sessions", schedule:"Daily at 02:00", target:"sessions", count:4120, enabled:true, safe:true },
  { id:"r2", label:"Clear old audit logs (>90 days)", schedule:"Weekly Sunday", target:"audit_logs", count:82000, enabled:true, safe:true },
  { id:"r3", label:"Remove soft-deleted users (>30 days)", schedule:"Monthly 1st", target:"users", count:231, enabled:false, safe:false },
  { id:"r4", label:"Purge temp upload files", schedule:"Daily at 03:00", target:"uploads", count:5600, enabled:true, safe:true },
  { id:"r5", label:"Archive old notifications (>60 days)", schedule:"Weekly Monday", target:"notifications", count:18400, enabled:true, safe:true },
];

const LOGS = [
  { id:1, rule:"Delete expired sessions", status:"success", deleted:4120, time:"Today 02:01" },
  { id:2, rule:"Purge temp upload files", status:"success", deleted:5600, time:"Today 03:02" },
  { id:3, rule:"Archive old notifications", status:"failed", deleted:0, time:"Mon 00:05" },
  { id:4, rule:"Clear old audit logs", status:"success", deleted:82000, time:"Last Sunday" },
];

export default function AdminCleanupSafety() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [rules, setRules] = useState(RULES);
  const [previewRule, setPreviewRule] = useState<string|null>(null);
  const [confirmRule, setConfirmRule] = useState<string|null>(null);
  const [running, setRunning] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"rules"|"logs"|"schedule">("rules");

  const toggleRule = (id: string) => setRules(r => r.map(x => x.id === id ? {...x, enabled: !x.enabled} : x));

  const runNow = (id: string) => {
    if (!confirmRule) { setConfirmRule(id); return; }
    setConfirmRule(null);
    setRunning(id);
    setTimeout(() => setRunning(null), 2500);
  };

  const stats = [
    { label:"Active Rules", value:rules.filter(r => r.enabled).length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Disabled Rules", value:rules.filter(r => !r.enabled).length, color:"#f87171", icon:XCircle },
    { label:"Unsafe Rules", value:rules.filter(r => !r.safe).length, color:"#fbbf24", icon:AlertTriangle },
    { label:"Last Run", value:"2 hrs ago", color:A1, icon:Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Cleanup Safety Control</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Manage automated cleanup rules with preview, confirmation, and rollback safety.</p>
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
        {(["rules","logs","schedule"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "rules" ? "Cleanup Rules" : tab === "logs" ? "Job Logs" : "Schedule Control"}
          </button>
        ))}
      </div>

      {activeTab === "rules" && (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${rule.enabled ? "bg-green-400" : "bg-red-400"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: T.text }}>{rule.label}</span>
                      {!rule.safe && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Unsafe
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: T.sub }}>
                      Target: <span className="font-mono">{rule.target}</span> · Schedule: {rule.schedule} · ~{rule.count.toLocaleString()} records
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewRule(previewRule === rule.id ? null : rule.id)}
                    className="p-2 rounded-xl transition-all hover:bg-white/5" style={{ color: T.sub }}>
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleRule(rule.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: rule.enabled ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)", color: rule.enabled ? "#4ade80" : "#f87171" }}>
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <button onClick={() => runNow(rule.id)} disabled={running === rule.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    style={{ background: A1, color:"#fff", opacity: running === rule.id ? .6 : 1 }}>
                    {running === rule.id ? <><RefreshCw className="h-3 w-3 animate-spin" /> Running</> : "Run Now"}
                  </button>
                </div>
              </div>
              {confirmRule === rule.id && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <span className="text-sm text-amber-400 font-bold">Confirm: delete {rule.count.toLocaleString()} records from {rule.target}?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmRule(null)} className="px-3 py-1 rounded-lg text-xs font-bold border" style={{ borderColor: T.border, color: T.sub }}>Cancel</button>
                    <button onClick={() => runNow(rule.id)} className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500 text-white">Confirm Delete</button>
                  </div>
                </div>
              )}
              {previewRule === rule.id && (
                <div className="mt-3 p-3 rounded-xl border font-mono text-xs" style={{ background:"rgba(0,0,0,.2)", borderColor: T.border, color: T.sub }}>
                  <p>Preview: SELECT COUNT(*) FROM {rule.target} WHERE …</p>
                  <p className="text-green-400">→ {rule.count.toLocaleString()} rows would be affected</p>
                  <p className="text-amber-400">→ Rollback window: 24 hours after execution</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Cleanup Job Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {LOGS.map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${log.status === "success" ? "bg-green-400" : "bg-red-400"}`} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{log.rule}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{log.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono" style={{ color: T.sub }}>{log.deleted > 0 ? `${log.deleted.toLocaleString()} deleted` : "0 deleted"}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${log.status === "success" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {log.status}
                  </span>
                  {log.status === "success" && (
                    <button className="p-1 hover:bg-white/5 rounded-lg transition-all" style={{ color: T.sub }} title="Rollback">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Schedule Control</h3>
            <p className="text-sm" style={{ color: T.sub }}>Adjust when each cleanup job runs to avoid peak traffic hours.</p>
            {rules.filter(r => r.enabled).map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: T.text }}>{rule.label}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{rule.schedule}</p>
                </div>
                <button className="p-2 rounded-xl hover:bg-white/5 transition-all" style={{ color: T.sub }}>
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Safety Validation</h3>
            {[
              { check:"Preview before execution", pass:true },
              { check:"Confirmation step enabled", pass:true },
              { check:"Rollback window configured", pass:true },
              { check:"Unsafe rules disabled", pass:rules.filter(r => !r.safe).every(r => !r.enabled) },
              { check:"Audit trail active", pass:true },
            ].map(c => (
              <div key={c.check} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.check}</span>
                {c.pass ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
