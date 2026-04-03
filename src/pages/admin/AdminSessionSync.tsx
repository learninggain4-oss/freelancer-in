import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Wifi, Monitor, Smartphone, LogOut, RefreshCw, CheckCircle2, AlertTriangle, Activity } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const DEVICES = [
  { id:"d1", user:"Ravi Kumar", device:"Chrome / Windows", location:"Mumbai, IN", sessions:2, synced:true, lastSync:"1 min ago" },
  { id:"d2", user:"Priya Sharma", device:"Safari / iPhone + Chrome / Mac", location:"Delhi, IN", sessions:2, synced:false, lastSync:"12 min ago" },
  { id:"d3", user:"Arjun Singh", device:"Firefox / Android", location:"Pune, IN", sessions:1, synced:true, lastSync:"5 min ago" },
  { id:"d4", user:"Meena Patel", device:"Chrome / Mac + Safari / iPad", location:"Chennai, IN", sessions:3, synced:false, lastSync:"45 min ago" },
];

export default function AdminSessionSync() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [devices, setDevices] = useState(DEVICES);
  const [syncing, setSyncing] = useState<string|null>(null);
  const [forceLogoutId, setForceLogoutId] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"devices"|"config"|"logs">("devices");

  const syncDevice = (id: string) => {
    setSyncing(id);
    setTimeout(() => {
      setDevices(prev => prev.map(d => d.id === id ? {...d, synced:true, lastSync:"just now"} : d));
      setSyncing(null);
    }, 2000);
  };

  const forceLogout = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  const stats = [
    { label:"Active Users", value:devices.length, color:"#60a5fa", icon:Monitor },
    { label:"Multi-Device", value:devices.filter(d=>d.sessions>1).length, color:A1, icon:Smartphone },
    { label:"Sync Conflicts", value:devices.filter(d=>!d.synced).length, color:"#fbbf24", icon:AlertTriangle },
    { label:"Total Sessions", value:devices.reduce((a,b)=>a+b.sessions,0), color:"#4ade80", icon:Wifi },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Multi-Device Session Sync</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor active devices, force logout from all devices, detect session conflicts, and validate sync.</p>
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
        {(["devices","config","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "devices" ? "Active Devices" : tab === "config" ? "Sync Config" : "Sync Logs"}
          </button>
        ))}
      </div>

      {activeTab === "devices" && (
        <div className="space-y-3">
          {devices.map(d => (
            <div key={d.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: !d.synced ? "rgba(251,191,36,.3)" : T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${d.synced ? "bg-green-500/15" : "bg-amber-500/15"}`}>
                    <Wifi className="h-5 w-5" style={{ color: d.synced ? "#4ade80" : "#fbbf24" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm" style={{ color: T.text }}>{d.user}</p>
                      {d.sessions > 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}15`, color: A1 }}>{d.sessions} devices</span>}
                      {!d.synced && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">CONFLICT</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: T.sub }}>{d.device}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{d.location} · Last sync: {d.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!d.synced && (
                    <button onClick={() => syncDevice(d.id)} disabled={syncing === d.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background: A1, color:"#fff", opacity: syncing === d.id ? .6 : 1 }}>
                      <RefreshCw className={`h-3 w-3 ${syncing === d.id ? "animate-spin" : ""}`} />
                      {syncing === d.id ? "Syncing…" : "Sync"}
                    </button>
                  )}
                  <button onClick={() => forceLogout(d.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background:"rgba(248,113,113,.15)", color:"#f87171" }}>
                    <LogOut className="h-3 w-3" /> Force Logout
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
            <h3 className="font-bold" style={{ color: T.text }}>Sync Configuration</h3>
            {[
              { label:"Session sync validation", active:true },
              { label:"Session refresh mechanism", active:true },
              { label:"Conflict detection", active:true },
              { label:"Auto-sync on login", active:true },
              { label:"Cross-device logout propagation", active:true },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Session Health</h3>
            {[
              { metric:"Sync latency (avg)", value:"120ms" },
              { metric:"Conflict resolution time", value:"<1s" },
              { metric:"Max concurrent devices/user", value:"5" },
              { metric:"Session token validity", value:"24h" },
              { metric:"Refresh interval", value:"15 min" },
            ].map(m => (
              <div key={m.metric} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.metric}</span>
                <span className="font-mono font-bold text-sm" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Session Sync Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Sync conflict resolved", user:"Priya Sharma", detail:"2-device conflict → master session set", time:"5 min ago", type:"warning" },
              { event:"Force logout applied", user:"Unknown", detail:"All sessions terminated", time:"1 hr ago", type:"info" },
              { event:"Sync validated", user:"Ravi Kumar", detail:"Token refreshed across 2 devices", time:"1 min ago", type:"success" },
              { event:"Conflict detected", user:"Meena Patel", detail:"3 active sessions with stale token", time:"45 min ago", type:"warning" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.user} · {l.detail}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type==="warning"?"bg-amber-500/15 text-amber-400":l.type==="success"?"bg-green-500/15 text-green-400":"bg-blue-500/15 text-blue-400"}`}>{l.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
