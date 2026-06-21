import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Flame, Bell, Clock, AlertCircle, CheckCircle2, Settings } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const breaches = [
  { id:"SLA-001", category:"Payment Disputes", ticket:"TKT-0842", overdue:"1d 4h", target:"24h", severity:"Critical", assignee:"Finance Head", notified:true },
  { id:"SLA-002", category:"Account Suspension Appeal", ticket:"TKT-0839", overdue:"4h", target:"12h", severity:"High", assignee:"Priya (Support)", notified:false },
  { id:"SLA-003", category:"KYC Rejection Review", ticket:"TKT-0831", overdue:"2h 30m", target:"8h", severity:"Medium", assignee:"KYC Team", notified:true },
  { id:"SLA-004", category:"Fraud Report", ticket:"TKT-0835", overdue:"14h", target:"12h", severity:"High", assignee:"Trust Team", notified:true },
];

const rules = [
  { category:"Payment Issues", l1:"2 hours", l2:"8 hours", l3:"24 hours", alertChannel:"Email + SMS", active:true },
  { category:"Account Disputes", l1:"4 hours", l2:"12 hours", l3:"48 hours", alertChannel:"Email", active:true },
  { category:"KYC Reviews", l1:"8 hours", l2:"24 hours", l3:"72 hours", alertChannel:"Email", active:true },
  { category:"Technical Bugs", l1:"4 hours", l2:"24 hours", l3:"72 hours", alertChannel:"Slack + Email", active:true },
  { category:"General Queries", l1:"8 hours", l2:"24 hours", l3:"—", alertChannel:"Email", active:false },
];

export default function AdminSlaBreachAlerts() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"active"|"rules">("active");
  const sevColor = (s:string) => s==="Critical"?"#f87171":s==="High"?"#fbbf24":"#60a5fa";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>SLA Breach Alerts</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Monitor active SLA breaches and configure automated alert rules and escalation thresholds by ticket category.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor:T.border, color:T.sub }}>
          <Settings className="h-4 w-4" /> Alert Settings
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Active Breaches", value:breaches.length, color:"#f87171", icon:Flame },
          { label:"Critical", value:breaches.filter(b=>b.severity==="Critical").length, color:"#f87171", icon:AlertCircle },
          { label:"Pending Notification", value:breaches.filter(b=>!b.notified).length, color:"#fbbf24", icon:Bell },
          { label:"Resolved Today", value:"8", color:"#4ade80", icon:CheckCircle2 },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor:T.border }}>
        {(["active","rules"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="active"?"Active Breaches":"SLA Rule Config"}
          </button>
        ))}
      </div>

      {tab==="active" && (
        <div className="space-y-3">
          {breaches.map(b=>(
            <div key={b.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:`${sevColor(b.severity)}40` }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Flame className="h-4 w-4" style={{ color:sevColor(b.severity) }} />
                    <span className="font-bold" style={{ color:T.text }}>{b.category}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${sevColor(b.severity)}15`, color:sevColor(b.severity) }}>{b.severity}</span>
                    {!b.notified && <span className="text-[10px] font-bold text-yellow-400">⚠ Not Notified</span>}
                  </div>
                  <p className="text-xs mb-1" style={{ color:T.sub }}>Ticket: {b.ticket} · Assignee: {b.assignee}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color:T.sub }}>SLA Target: <span className="font-bold" style={{ color:T.text }}>{b.target}</span></span>
                    <span style={{ color:"#f87171" }}>Overdue by: <span className="font-bold">{b.overdue}</span></span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!b.notified && <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(251,191,36,.12)", color:"#fbbf24" }}><Bell className="h-3.5 w-3.5 inline mr-1" />Notify Now</button>}
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:A1, color:"#fff" }}>Escalate</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="rules" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor:T.border }}>
              {["Category","L1 SLA","L2 SLA","L3 SLA","Alert Channel","Active"].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rules.map((r,i)=>(
                <tr key={i} className="border-b" style={{ borderColor:T.border }}>
                  <td className="px-4 py-3 font-bold text-sm" style={{ color:T.text }}>{r.category}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color:T.sub }}>{r.l1}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color:T.sub }}>{r.l2}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color:T.sub }}>{r.l3}</td>
                  <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{r.alertChannel}</td>
                  <td className="px-4 py-3"><span className="text-[10px] font-bold" style={{ color:r.active?"#4ade80":"#94a3b8" }}>{r.active?"Active":"Off"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
