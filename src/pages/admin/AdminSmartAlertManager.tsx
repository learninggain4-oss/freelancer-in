import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Bell, BarChart3, Filter, Clock, CheckCircle2, AlertTriangle, Layers, Settings } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const GROUPS = [
  { id:"g1", name:"Payment Alerts", count:4, priority:"critical", muted:false },
  { id:"g2", name:"Security Alerts", count:2, priority:"high", muted:false },
  { id:"g3", name:"Performance Alerts", count:8, priority:"medium", muted:false },
  { id:"g4", name:"Informational", count:24, priority:"low", muted:true },
  { id:"g5", name:"Maintenance", count:3, priority:"low", muted:true },
];

export default function AdminSmartAlertManager() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [groups, setGroups] = useState(GROUPS);
  const [maxPerHour, setMaxPerHour] = useState(20);
  const [scheduleStart, setScheduleStart] = useState("08:00");
  const [scheduleEnd, setScheduleEnd] = useState("22:00");
  const [activeTab, setActiveTab] = useState<"groups"|"config"|"analytics">("groups");

  const toggleMute = (id: string) => setGroups(prev => prev.map(g => g.id === id ? {...g, muted:!g.muted} : g));

  const priorityColor = (p: string) => p==="critical"?"#f87171":p==="high"?"#fbbf24":p==="medium"?"#60a5fa":"#94a3b8";

  const total = groups.reduce((a,b)=>a+b.count,0);
  const muted = groups.filter(g=>g.muted).reduce((a,b)=>a+b.count,0);

  const stats = [
    { label:"Total Alerts", value:total, color:"#60a5fa", icon:Bell },
    { label:"Alert Groups", value:groups.length, color:A1, icon:Layers },
    { label:"Muted", value:muted, color:"#94a3b8", icon:Filter },
    { label:"Active", value:total-muted, color:"#4ade80", icon:CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Smart Alert Management</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Group, prioritize, filter, schedule, and customize alerts to prevent admin fatigue.</p>
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
        {(["groups","config","analytics"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "groups" ? "Alert Groups" : tab === "config" ? "Configuration" : "Analytics"}
          </button>
        ))}
      </div>

      {activeTab === "groups" && (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border, opacity: g.muted ? .6 : 1 }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full" style={{ background: priorityColor(g.priority) }} />
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-sm" style={{ color: T.text }}>{g.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${priorityColor(g.priority)}18`, color: priorityColor(g.priority) }}>{g.priority}</span>
                      {g.muted && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">MUTED</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: T.sub }}>{g.count} alerts in this group</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleMute(g.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: g.muted ? `${A1}20` : "rgba(148,163,184,.15)", color: g.muted ? A1 : T.sub }}>
                    {g.muted ? "Unmute" : "Mute"}
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: T.sub }}>
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Alert Control Settings</h3>
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="text-sm font-bold" style={{ color: T.text }}>Max alerts per hour</p>
              <div className="flex items-center gap-3">
                <input type="range" min={5} max={100} value={maxPerHour} onChange={e => setMaxPerHour(+e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="font-bold font-mono w-12 text-right" style={{ color: T.text }}>{maxPerHour}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="text-sm font-bold" style={{ color: T.text }}>Alert scheduling window</p>
              <div className="flex items-center gap-3">
                <input type="time" value={scheduleStart} onChange={e => setScheduleStart(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: T.input, borderColor: T.border, color: T.text }} />
                <span className="text-sm" style={{ color: T.sub }}>to</span>
                <input type="time" value={scheduleEnd} onChange={e => setScheduleEnd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: T.input, borderColor: T.border, color: T.text }} />
              </div>
              <p className="text-xs" style={{ color: T.sub }}>Low-priority alerts only during this window</p>
            </div>
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Alert Customization</h3>
            {[
              { label:"Alert grouping by category", active:true },
              { label:"Priority-based filtering", active:true },
              { label:"Alert frequency control", active:true },
              { label:"Mute low-priority (off-hours)", active:true },
              { label:"Alert summary digest (daily)", active:false },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.active?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"}`}>{c.active?"Active":"Off"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Alert Analytics</h3>
            {[
              { label:"Alerts today", value:total.toString() },
              { label:"Muted alerts", value:muted.toString() },
              { label:"Avg response time", value:"4 min" },
              { label:"Alerts resolved in SLA", value:"94%" },
              { label:"False positive rate", value:"2.1%" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Alerts by Priority</h3>
            {[
              { priority:"Critical", count:4, color:"#f87171" },
              { priority:"High", count:2, color:"#fbbf24" },
              { priority:"Medium", count:8, color:"#60a5fa" },
              { priority:"Low", count:27, color:"#94a3b8" },
            ].map(p => {
              const pct = Math.round((p.count / total) * 100);
              return (
                <div key={p.priority} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: T.text }}>{p.priority}</span>
                    <span className="font-bold font-mono text-sm" style={{ color: p.color }}>{p.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
                    <div className="h-full rounded-full" style={{ width:`${pct}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
