import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Bell, AlertTriangle, CheckCircle2, RefreshCw, Eye, XCircle, Mail, Smartphone } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const ALERTS = [
  { id:"a1", title:"Payment gateway down", priority:"critical", acknowledged:false, channels:["email","sms","inapp"], time:"5 min ago" },
  { id:"a2", title:"Storage above 75%", priority:"high", acknowledged:true, channels:["inapp"], time:"30 min ago" },
  { id:"a3", title:"Unusual login pattern", priority:"high", acknowledged:false, channels:["email","inapp"], time:"1 hr ago" },
  { id:"a4", title:"Backup completed", priority:"low", acknowledged:true, channels:["inapp"], time:"2 hrs ago" },
  { id:"a5", title:"Search index corrupted", priority:"critical", acknowledged:false, channels:["email","sms","inapp"], time:"15 min ago" },
];

export default function AdminAlertVisibility() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [alerts, setAlerts] = useState(ALERTS);
  const [activeTab, setActiveTab] = useState<"alerts"|"channels"|"escalation">("alerts");

  const acknowledge = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? {...a, acknowledged:true} : a));
  const acknowledgeAll = () => setAlerts(prev => prev.map(a => ({...a, acknowledged:true})));

  const priorityColor = (p: string) => p==="critical"?"#f87171":p==="high"?"#fbbf24":p==="medium"?"#60a5fa":"#94a3b8";

  const stats = [
    { label:"Total Alerts", value:alerts.length, color:"#60a5fa", icon:Bell },
    { label:"Critical", value:alerts.filter(a=>a.priority==="critical").length, color:"#f87171", icon:AlertTriangle },
    { label:"Unacknowledged", value:alerts.filter(a=>!a.acknowledged).length, color:"#fbbf24", icon:Eye },
    { label:"Channels Active", value:3, color:"#4ade80", icon:CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Alert Visibility Management</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Prioritize critical alerts, manage channels, escalate unacknowledged alerts, and track history.</p>
        </div>
        <button onClick={acknowledgeAll} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: A1, color: A1 }}>
          <CheckCircle2 className="h-4 w-4" /> Acknowledge All
        </button>
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
        {(["alerts","channels","escalation"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "alerts" ? "Alert Dashboard" : tab === "channels" ? "Channels" : "Escalation"}
          </button>
        ))}
      </div>

      {activeTab === "alerts" && (
        <div className="space-y-3">
          {alerts.sort((a,b) => {
            const order = {critical:0,high:1,medium:2,low:3};
            return (order[a.priority as keyof typeof order]??3) - (order[b.priority as keyof typeof order]??3);
          }).map(alert => (
            <div key={alert.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: !alert.acknowledged && alert.priority==="critical" ? "rgba(248,113,113,.4)" : T.border, opacity: alert.acknowledged ? .7 : 1 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-3 w-3 rounded-full mt-1 shrink-0 ${!alert.acknowledged&&alert.priority==="critical"?"animate-pulse":""}`} style={{ background: priorityColor(alert.priority) }} />
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-sm" style={{ color: T.text }}>{alert.title}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${priorityColor(alert.priority)}18`, color: priorityColor(alert.priority) }}>{alert.priority}</span>
                      {alert.acknowledged && <span className="text-xs text-green-400 font-bold">✓ Acknowledged</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {alert.channels.map(ch => (
                        <span key={ch} className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background:`${A1}15`, color: A1 }}>{ch}</span>
                      ))}
                      <span className="text-xs" style={{ color: T.sub }}>· {alert.time}</span>
                    </div>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button onClick={() => acknowledge(alert.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0" style={{ background: A1, color:"#fff" }}>
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "channels" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Notification Channels</h3>
            {[
              { channel:"In-App Alerts", icon:Bell, active:true, priority:"All levels" },
              { channel:"Email Notifications", icon:Mail, active:true, priority:"High + Critical" },
              { channel:"SMS Alerts", icon:Smartphone, active:true, priority:"Critical only" },
            ].map(c => (
              <div key={c.channel} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/15"><c.icon className="h-4 w-4 text-green-400" /></div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{c.channel}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{c.priority}</p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Alert Health</h3>
            {[
              { label:"Alert delivery rate", value:"99.4%" },
              { label:"Avg acknowledgment time", value:"4 min" },
              { label:"Critical unacknowledged", value:alerts.filter(a=>a.priority==="critical"&&!a.acknowledged).length.toString() },
              { label:"Alert failure detection", value:"Active" },
              { label:"Retry on delivery fail", value:"3×" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono text-sm" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "escalation" && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
          <h3 className="font-bold" style={{ color: T.text }}>Escalation Workflow</h3>
          <p className="text-sm" style={{ color: T.sub }}>Alerts that remain unacknowledged are automatically escalated.</p>
          {[
            { step:"0 min", action:"Alert sent via In-App + Email", trigger:"On alert creation" },
            { step:"5 min", action:"SMS sent to on-call admin", trigger:"If unacknowledged" },
            { step:"15 min", action:"Escalate to supervisor", trigger:"If still unacknowledged" },
            { step:"30 min", action:"All admins notified", trigger:"If critical and unresolved" },
          ].map((s,i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border" style={{ borderColor: T.border }}>
              <div className="flex flex-col items-center gap-1">
                <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background:`${A1}20`, color: A1 }}>{i+1}</div>
                {i < 3 && <div className="w-0.5 h-4" style={{ background: T.border }} />}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: T.text }}>{s.action}</p>
                <p className="text-xs mt-0.5" style={{ color: T.sub }}>{s.trigger} · {s.step}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
