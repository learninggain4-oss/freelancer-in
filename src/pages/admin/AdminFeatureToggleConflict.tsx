import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { ToggleRight, AlertTriangle, CheckCircle2, XCircle, RefreshCw, RotateCcw, Zap } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const TOGGLES = [
  { id:"t1", name:"New Onboarding Flow", enabled:true, conflicts:[], compatible:true, group:"UX" },
  { id:"t2", name:"Legacy Payment Form", enabled:true, conflicts:["t3"], compatible:false, group:"Payments" },
  { id:"t3", name:"Stripe Checkout v3", enabled:true, conflicts:["t2"], compatible:false, group:"Payments" },
  { id:"t4", name:"Beta Dashboard", enabled:false, conflicts:[], compatible:true, group:"UX" },
  { id:"t5", name:"Email Queue v2", enabled:true, conflicts:[], compatible:true, group:"Comms" },
  { id:"t6", name:"Dark Mode Override", enabled:false, conflicts:[], compatible:true, group:"UX" },
];

export default function AdminFeatureToggleConflict() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [toggles, setToggles] = useState(TOGGLES);
  const [testing, setTesting] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"toggles"|"validation"|"logs">("toggles");

  const toggle = (id: string) => {
    setToggles(prev => prev.map(t => t.id === id ? {...t, enabled: !t.enabled} : t));
  };

  const runTest = (id: string) => { setTesting(id); setTimeout(() => setTesting(null), 1800); };

  const conflicts = toggles.filter(t => t.enabled && t.conflicts.some(c => toggles.find(x => x.id === c)?.enabled));

  const stats = [
    { label:"Total Toggles", value:toggles.length, color:"#60a5fa", icon:ToggleRight },
    { label:"Enabled", value:toggles.filter(t=>t.enabled).length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Conflicts", value:conflicts.length, color:"#f87171", icon:XCircle },
    { label:"Groups", value:[...new Set(toggles.map(t=>t.group))].length, color:A1, icon:AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Feature Toggle Conflict Detection</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Detect and resolve conflicting feature toggles, validate compatibility, and manage rollbacks.</p>
      </div>

      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl border bg-red-500/10 border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-400">{conflicts.length} conflict{conflicts.length>1?"s":""} detected!</p>
            <p className="text-xs text-red-300 mt-0.5">Conflicting toggles are enabled simultaneously. Please resolve before deploying.</p>
          </div>
        </div>
      )}

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
        {(["toggles","validation","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "toggles" ? "Feature Toggles" : tab === "validation" ? "Validation Rules" : "Change Logs"}
          </button>
        ))}
      </div>

      {activeTab === "toggles" && (
        <div className="space-y-3">
          {toggles.map(t => {
            const hasConflict = t.enabled && t.conflicts.some(c => toggles.find(x=>x.id===c)?.enabled);
            const conflictNames = t.conflicts.map(c => toggles.find(x=>x.id===c)?.name).filter(Boolean);
            return (
              <div key={t.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: hasConflict ? "rgba(248,113,113,.3)" : T.border }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: T.text }}>{t.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}15`, color: A1 }}>{t.group}</span>
                      {hasConflict && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">CONFLICT</span>}
                    </div>
                    {conflictNames.length > 0 && (
                      <p className="text-xs mt-1 text-amber-400">Conflicts with: {conflictNames.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => runTest(t.id)} disabled={testing===t.id}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: T.sub }}>
                      <Zap className={`h-4 w-4 ${testing===t.id?"text-amber-400 animate-pulse":""}`} />
                    </button>
                    <button onClick={() => toggle(t.id)}
                      className="w-12 h-6 rounded-full relative transition-all"
                      style={{ background: t.enabled ? (hasConflict ? "#f87171" : A1) : T.border }}>
                      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${t.enabled?"left-6":"left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "validation" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Validation Rules</h3>
            {[
              { rule:"Conflicting toggles cannot be enabled simultaneously", ok:conflicts.length===0 },
              { rule:"Toggle dependency validation before enabling", ok:true },
              { rule:"Compatibility check on toggle change", ok:true },
              { rule:"Rollback available for 24h after toggle change", ok:true },
              { rule:"Change alert sent on conflict detected", ok:true },
            ].map(r => (
              <div key={r.rule} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: T.border }}>
                {r.ok ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
                <p className="text-sm" style={{ color: T.text }}>{r.rule}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Toggle Health Dashboard</h3>
            {[
              { label:"Total enabled", value:toggles.filter(t=>t.enabled).length },
              { label:"Conflict pairs", value:conflicts.length },
              { label:"Compatible toggles", value:toggles.filter(t=>t.compatible).length },
              { label:"Groups monitored", value:[...new Set(toggles.map(t=>t.group))].length },
              { label:"Rollback available", value:toggles.filter(t=>t.enabled).length },
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
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Toggle Change Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Conflict detected", toggle:"Legacy Payment Form + Stripe Checkout v3", admin:"admin@site.com", time:"10 min ago", type:"error" },
              { event:"Toggle enabled", toggle:"Stripe Checkout v3", admin:"manager@site.com", time:"15 min ago", type:"info" },
              { event:"Toggle disabled", toggle:"Beta Dashboard", admin:"admin@site.com", time:"2 hrs ago", type:"info" },
              { event:"Rollback performed", toggle:"Email Queue v2", admin:"admin@site.com", time:"Yesterday", type:"warning" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.toggle}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.admin} · {l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type==="error"?"bg-red-500/15 text-red-400":l.type==="warning"?"bg-amber-500/15 text-amber-400":"bg-blue-500/15 text-blue-400"}`}>{l.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
