import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Users, Clock, AlertTriangle, CheckCircle2, RefreshCw, Activity, LogOut, Monitor, Smartphone, Shield } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const SESSIONS = [
  { id:"s1", user:"Ravi Kumar", device:"Chrome / Windows", location:"Mumbai, IN", ip:"103.45.12.8", active:"2 min ago", duration:"45 min", suspicious:false },
  { id:"s2", user:"Priya Sharma", device:"Safari / iPhone", location:"Delhi, IN", ip:"49.32.11.4", active:"Just now", duration:"12 min", suspicious:false },
  { id:"s3", user:"Unknown", device:"Firefox / Linux", location:"Singapore, SG", ip:"192.168.99.1", active:"5 min ago", duration:"2 hrs", suspicious:true },
  { id:"s4", user:"Admin User", device:"Chrome / Mac", location:"Bangalore, IN", ip:"103.45.8.1", active:"1 min ago", duration:"3 hrs", suspicious:false },
];

export default function AdminSessionManagement() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [sessions, setSessions] = useState(SESSIONS);
  const [timeout, setTimeoutDuration] = useState(30);
  const [autoLogout, setAutoLogout] = useState(true);
  const [forceLogoutAll, setForceLogoutAll] = useState(false);
  const [activeTab, setActiveTab] = useState<"sessions"|"config"|"logs">("sessions");

  const terminateSession = (id: string) => setSessions(prev => prev.filter(s => s.id !== id));

  const stats = [
    { label:"Active Sessions", value:sessions.length, color:"#60a5fa", icon:Users },
    { label:"Suspicious", value:sessions.filter(s=>s.suspicious).length, color:"#f87171", icon:AlertTriangle },
    { label:"Admin Sessions", value:sessions.filter(s=>s.user.toLowerCase().includes("admin")).length, color:A1, icon:Shield },
    { label:"Avg Duration", value:"45 min", color:"#4ade80", icon:Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Session Management</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor active sessions, configure timeouts, detect suspicious logins, and force logout.</p>
        </div>
        <button onClick={() => setSessions([])}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background:"rgba(248,113,113,.15)", color:"#f87171" }}>
          <LogOut className="h-4 w-4" /> Force Logout All
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
        {(["sessions","config","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "sessions" ? "Active Sessions" : tab === "config" ? "Session Config" : "Session Logs"}
          </button>
        ))}
      </div>

      {activeTab === "sessions" && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border" style={{ background: T.card, borderColor: T.border }}>
              <Users className="h-10 w-10 opacity-20" style={{ color: T.sub }} />
              <p className="text-sm" style={{ color: T.sub }}>No active sessions</p>
            </div>
          )}
          {sessions.map(session => (
            <div key={session.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: session.suspicious ? "rgba(248,113,113,.3)" : T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${session.suspicious ? "bg-red-500/15" : "bg-indigo-500/15"}`}>
                    {session.device.includes("iPhone") ? <Smartphone className="h-5 w-5" style={{ color: session.suspicious ? "#f87171" : A1 }} /> : <Monitor className="h-5 w-5" style={{ color: session.suspicious ? "#f87171" : A1 }} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm" style={{ color: T.text }}>{session.user}</p>
                      {session.suspicious && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">SUSPICIOUS</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: T.sub }}>{session.device}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{session.location} · {session.ip}</p>
                    <p className="text-xs" style={{ color: T.sub }}>Active {session.active} · Duration: {session.duration}</p>
                  </div>
                </div>
                <button onClick={() => terminateSession(session.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background:"rgba(248,113,113,.15)", color:"#f87171" }}>
                  <LogOut className="h-3.5 w-3.5" /> Terminate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Session Timeout</h3>
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="text-sm font-bold" style={{ color: T.text }}>Timeout duration (minutes)</p>
              <div className="flex items-center gap-3">
                <input type="range" min={5} max={240} value={timeout} onChange={e => setTimeoutDuration(+e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="font-bold font-mono w-16 text-right" style={{ color: T.text }}>{timeout} min</span>
              </div>
            </div>
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border" style={{ borderColor: T.border }}>
              <div>
                <p className="font-bold text-sm" style={{ color: T.text }}>Auto logout on inactivity</p>
                <p className="text-xs mt-1" style={{ color: T.sub }}>Terminate session after {timeout} minutes of inactivity</p>
              </div>
              <button onClick={() => setAutoLogout(v => !v)} className="w-12 h-6 rounded-full relative transition-all shrink-0"
                style={{ background: autoLogout ? A1 : T.border }}>
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${autoLogout ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Session Health</h3>
            {[
              { label:"Suspicious login detection", ok:true },
              { label:"Multi-device tracking", ok:true },
              { label:"Session refresh mechanism", ok:true },
              { label:"Force logout capability", ok:true },
              { label:"Session conflict detection", ok:true },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Session Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Suspicious session flagged", user:"Unknown", ip:"192.168.99.1", action:"Alert sent to admin", time:"5 min ago", type:"warning" },
              { event:"Session terminated by admin", user:"Unknown", ip:"192.168.99.1", action:"Force logout applied", time:"5 min ago", type:"info" },
              { event:"Admin login detected", user:"Admin User", ip:"103.45.8.1", action:"New session created", time:"1 hr ago", type:"info" },
              { event:"Session expired", user:"User_482", ip:"45.21.8.4", action:"Auto-timeout after 30 min", time:"2 hrs ago", type:"info" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.user} · {l.ip} · {l.action}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type === "warning" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
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
