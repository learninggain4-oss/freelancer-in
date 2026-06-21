import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { AlertCircle, Clock, User, ChevronUp, CheckCircle2, Flame } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const tickets = [
  { id:"TKT-0842", user:"Rahul Mehta", issue:"Payment ₹48,000 not received after project closed", priority:"Critical", age:"3d 4h", sla:"Breached", level:"L3", assignee:"Head of Finance", status:"Open" },
  { id:"TKT-0839", user:"Sunita Gupta", issue:"Account suspended without reason", priority:"High", age:"1d 8h", sla:"At Risk", level:"L2", assignee:"Priya (Support)", status:"In Progress" },
  { id:"TKT-0835", user:"Arjun Verma", issue:"Fake freelancer profile reported", priority:"High", age:"2d 2h", sla:"At Risk", level:"L2", assignee:"Ravi (Trust)", status:"Open" },
  { id:"TKT-0829", user:"Meera Pillai", issue:"Double deduction from wallet", priority:"Critical", age:"4h", sla:"OK", level:"L2", assignee:"Finance Team", status:"In Progress" },
  { id:"TKT-0821", user:"Kiran Nair", issue:"Bid submission error on iOS", priority:"Medium", age:"12h", sla:"OK", level:"L1", assignee:"Tech Support", status:"Open" },
  { id:"TKT-0818", user:"Deepa Sharma", issue:"KYC not updating after re-submission", priority:"Medium", age:"1d 2h", sla:"OK", level:"L1", assignee:"KYC Team", status:"Resolved" },
];

const matrix = [
  { level:"L1", label:"Tier 1 — Frontline Support", description:"General queries, How-to, Navigation help", sla:"4 hours", team:"Support Agents (Priya, Ravi, Anjali)", auto:"Chatbot first, then L1 if unresolved" },
  { level:"L2", label:"Tier 2 — Specialist Team", description:"Account issues, KYC, Disputes, Billing queries", sla:"12 hours", team:"Trust & Safety + Finance + KYC Team", auto:"Auto-escalate from L1 after 4h SLA breach" },
  { level:"L3", label:"Tier 3 — Management", description:"Critical payment failure, Legal, PR-sensitive issues", sla:"24 hours", team:"Head of Finance, VP Operations, Legal", auto:"Auto-escalate from L2 after 12h SLA breach" },
];

export default function AdminTicketEscalationMatrix() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"tickets"|"matrix">("tickets");

  const priorityColor = (p:string) => p==="Critical"?"#f87171":p==="High"?"#fbbf24":p==="Medium"?"#60a5fa":"#4ade80";
  const slaColor = (s:string) => s==="Breached"?"#f87171":s==="At Risk"?"#fbbf24":"#4ade80";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Ticket Escalation Matrix</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>View all support tickets by priority and escalation level. Manage automatic SLA-based escalation rules.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Open Tickets", value:tickets.filter(t=>t.status!=="Resolved").length, color:"#f87171", icon:AlertCircle },
          { label:"SLA Breached", value:tickets.filter(t=>t.sla==="Breached").length, color:"#f87171", icon:Flame },
          { label:"At Risk", value:tickets.filter(t=>t.sla==="At Risk").length, color:"#fbbf24", icon:Clock },
          { label:"Resolved Today", value:"12", color:"#4ade80", icon:CheckCircle2 },
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
        {(["tickets","matrix"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="tickets"?"All Tickets":"Escalation Matrix Config"}
          </button>
        ))}
      </div>

      {tab==="tickets" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor:T.border }}>
              {["ID","User","Issue","Priority","Age","SLA","Level","Assignee","Status"].map(h=>(
                <th key={h} className="text-left px-3 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {tickets.map(t=>(
                <tr key={t.id} className="border-b" style={{ borderColor:T.border }}>
                  <td className="px-3 py-3 font-mono text-xs font-bold" style={{ color:A1 }}>{t.id}</td>
                  <td className="px-3 py-3 text-xs font-bold" style={{ color:T.text }}>{t.user}</td>
                  <td className="px-3 py-3 text-xs max-w-[200px] truncate" style={{ color:T.sub }}>{t.issue}</td>
                  <td className="px-3 py-3"><span className="text-[10px] font-bold" style={{ color:priorityColor(t.priority) }}>{t.priority}</span></td>
                  <td className="px-3 py-3 text-xs" style={{ color:T.sub }}>{t.age}</td>
                  <td className="px-3 py-3"><span className="text-[10px] font-bold" style={{ color:slaColor(t.sla) }}>{t.sla}</span></td>
                  <td className="px-3 py-3"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:`${A1}12`, color:A1 }}>{t.level}</span></td>
                  <td className="px-3 py-3 text-xs" style={{ color:T.sub }}>{t.assignee}</td>
                  <td className="px-3 py-3"><span className="text-[10px] font-bold" style={{ color:t.status==="Resolved"?"#4ade80":t.status==="In Progress"?"#fbbf24":"#f87171" }}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="matrix" && (
        <div className="space-y-4">
          {matrix.map((m,i)=>(
            <div key={i} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0" style={{ background:`${A1}15`, color:A1 }}>{m.level}</div>
                <div className="flex-1">
                  <p className="font-bold mb-1" style={{ color:T.text }}>{m.label}</p>
                  <p className="text-xs mb-2" style={{ color:T.sub }}>{m.description}</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><p className="font-bold mb-0.5" style={{ color:T.sub }}>SLA Target</p><p style={{ color:T.text }}>{m.sla}</p></div>
                    <div><p className="font-bold mb-0.5" style={{ color:T.sub }}>Team</p><p style={{ color:T.text }}>{m.team}</p></div>
                    <div><p className="font-bold mb-0.5" style={{ color:T.sub }}>Auto-Escalation</p><p style={{ color:T.text }}>{m.auto}</p></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
