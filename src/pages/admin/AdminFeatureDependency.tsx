import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Layers, AlertTriangle, CheckCircle2, XCircle, Eye, RefreshCw, GitBranch, Zap } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const FEATURES = [
  { id:"f1", name:"Escrow Payments", deps:["f2","f3"], status:"healthy", enabled:true },
  { id:"f2", name:"Wallet System", deps:["f4"], status:"healthy", enabled:true },
  { id:"f3", name:"KYC Verification", deps:[], status:"degraded", enabled:true },
  { id:"f4", name:"Payment Gateway", deps:[], status:"healthy", enabled:true },
  { id:"f5", name:"Dispute Resolution", deps:["f1","f3"], status:"conflict", enabled:true },
  { id:"f6", name:"Auto Invoice", deps:["f2","f4"], status:"healthy", enabled:false },
];

const LOGS = [
  { id:1, event:"Dependency conflict detected", feature:"Dispute Resolution", dep:"KYC Verification", time:"5 min ago", severity:"high" },
  { id:2, event:"Feature enabled", feature:"Escrow Payments", dep:"Wallet System", time:"2 hrs ago", severity:"info" },
  { id:3, event:"Dependency validated", feature:"Auto Invoice", dep:"Payment Gateway", time:"Yesterday", severity:"info" },
];

export default function AdminFeatureDependency() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [features, setFeatures] = useState(FEATURES);
  const [selectedFeature, setSelectedFeature] = useState<string|null>(null);
  const [testing, setTesting] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"map"|"logs"|"health">("map");

  const toggle = (id: string) => {
    const f = features.find(x => x.id === id);
    if (!f) return;
    const dependents = features.filter(x => x.deps.includes(id));
    if (f.enabled && dependents.some(d => d.enabled)) return;
    setFeatures(prev => prev.map(x => x.id === id ? {...x, enabled: !x.enabled} : x));
  };

  const runTest = (id: string) => {
    setTesting(id);
    setTimeout(() => setTesting(null), 2000);
  };

  const selected = features.find(f => f.id === selectedFeature);

  const stats = [
    { label:"Total Features", value:features.length, color:"#60a5fa", icon:Layers },
    { label:"Healthy", value:features.filter(f => f.status === "healthy").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Conflicts", value:features.filter(f => f.status === "conflict").length, color:"#f87171", icon:XCircle },
    { label:"Degraded", value:features.filter(f => f.status === "degraded").length, color:"#fbbf24", icon:AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Feature Dependency Control</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Map, validate, and monitor feature dependencies to prevent cascade failures.</p>
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
        {(["map","logs","health"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "map" ? "Dependency Map" : tab === "logs" ? "Dependency Logs" : "Health Dashboard"}
          </button>
        ))}
      </div>

      {activeTab === "map" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {features.map(f => {
              const statusColor = f.status === "healthy" ? "#4ade80" : f.status === "degraded" ? "#fbbf24" : "#f87171";
              const depNames = f.deps.map(d => features.find(x => x.id === d)?.name ?? d);
              return (
                <div key={f.id}
                  className="rounded-2xl border p-4 cursor-pointer transition-all"
                  onClick={() => setSelectedFeature(selectedFeature === f.id ? null : f.id)}
                  style={{ background: selectedFeature === f.id ? `${A1}10` : T.card, borderColor: selectedFeature === f.id ? A1 : T.border }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor }} />
                      <div>
                        <p className="font-bold text-sm" style={{ color: T.text }}>{f.name}</p>
                        <p className="text-xs" style={{ color: T.sub }}>
                          {depNames.length ? `Depends on: ${depNames.join(", ")}` : "No dependencies"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); runTest(f.id); }} disabled={testing === f.id}
                        className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ color: T.sub }}>
                        <Zap className={`h-4 w-4 ${testing === f.id ? "text-amber-400 animate-pulse" : ""}`} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); toggle(f.id); }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ background: f.enabled ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)", color: f.enabled ? "#4ade80" : "#f87171" }}>
                        {f.enabled ? "On" : "Off"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border p-6" style={{ background: T.card, borderColor: T.border }}>
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5" style={{ color: A1 }} />
                  <h3 className="font-bold" style={{ color: T.text }}>{selected.name}</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border" style={{ borderColor: T.border }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.sub }}>Direct Dependencies</p>
                    {selected.deps.length === 0
                      ? <p className="text-sm" style={{ color: T.sub }}>None — root feature</p>
                      : selected.deps.map(d => {
                          const dep = features.find(x => x.id === d);
                          return (
                            <div key={d} className="flex items-center gap-2 text-sm" style={{ color: T.text }}>
                              <div className={`h-2 w-2 rounded-full ${dep?.status === "healthy" ? "bg-green-400" : dep?.status === "degraded" ? "bg-amber-400" : "bg-red-400"}`} />
                              {dep?.name}
                            </div>
                          );
                        })}
                  </div>
                  <div className="p-3 rounded-xl border" style={{ borderColor: T.border }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.sub }}>Features Depending On This</p>
                    {features.filter(f => f.deps.includes(selected.id)).length === 0
                      ? <p className="text-sm" style={{ color: T.sub }}>None</p>
                      : features.filter(f => f.deps.includes(selected.id)).map(f => (
                          <p key={f.id} className="text-sm" style={{ color: T.text }}>→ {f.name}</p>
                        ))}
                  </div>
                  <div className="p-3 rounded-xl border" style={{ borderColor: T.border }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.sub }}>Impact Preview</p>
                    <p className="text-sm" style={{ color: T.text }}>
                      Disabling <strong>{selected.name}</strong> would affect{" "}
                      <strong>{features.filter(f => f.deps.includes(selected.id)).length}</strong> dependent feature(s).
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <Eye className="h-10 w-10 opacity-20" style={{ color: T.sub }} />
                <p className="text-sm" style={{ color: T.sub }}>Select a feature to view its dependency details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Dependency Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {LOGS.map(log => (
              <div key={log.id} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${log.severity === "high" ? "bg-red-400" : "bg-blue-400"}`} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{log.event}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{log.feature} → {log.dep}</p>
                    <p className="text-xs mt-0.5" style={{ color: T.sub }}>{log.time}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${log.severity === "high" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
                  {log.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "health" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Dependency Health Dashboard</h3>
            {features.map(f => {
              const statusColor = f.status === "healthy" ? "#4ade80" : f.status === "degraded" ? "#fbbf24" : "#f87171";
              return (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor }} />
                    <span className="text-sm font-bold" style={{ color: T.text }}>{f.name}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor}18`, color: statusColor }}>
                    {f.status}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Validation Rules</h3>
            {[
              { rule:"All dependencies must be active before enabling a feature", pass:true },
              { rule:"Conflicting features cannot be enabled simultaneously", pass:features.filter(f=>f.status==="conflict"&&f.enabled).length===0 },
              { rule:"Degraded dependencies trigger alerts", pass:true },
              { rule:"Dependency change requires impact preview", pass:true },
            ].map(c => (
              <div key={c.rule} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: T.border }}>
                {c.pass ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
                <p className="text-sm" style={{ color: T.text }}>{c.rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
