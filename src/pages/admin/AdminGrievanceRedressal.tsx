import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { AlertCircle, CheckCircle2, Clock, MessageSquare, User } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type GStatus = "Open"|"In Progress"|"Resolved"|"Escalated";
type Priority = "High"|"Medium"|"Low";

const grievances = [
  { id:"G001", user:"Priya Sharma", type:"Payment Dispute", description:"Client released payment but funds not received in wallet after 5 days.", priority:"High" as Priority, status:"Open" as GStatus, raised:"2 days ago", assigned:"Unassigned" },
  { id:"G002", user:"Arjun Das", type:"Fake Review", description:"Competitor posted false 1-star reviews on my profile using multiple accounts.", priority:"High" as Priority, status:"In Progress" as GStatus, raised:"3 days ago", assigned:"Admin Ravi" },
  { id:"G003", user:"Neha Joshi", type:"KYC Rejection", description:"My Aadhaar was rejected despite being valid. Need urgent resolution.", priority:"Medium" as Priority, status:"In Progress" as GStatus, raised:"4 days ago", assigned:"Admin Priya" },
  { id:"G004", user:"Vikram Singh", type:"Account Suspension", description:"Account suspended without reason. I have not violated any terms.", priority:"High" as Priority, status:"Escalated" as GStatus, raised:"1 day ago", assigned:"Super Admin" },
  { id:"G005", user:"Sita Rao", type:"Bid Cancellation", description:"My winning bid was cancelled without notification or refund of bid credits.", priority:"Medium" as Priority, status:"Resolved" as GStatus, raised:"7 days ago", assigned:"Admin Ravi" },
];

const STATUS_COLOR: Record<GStatus,string> = { "Open":"#fbbf24", "In Progress":"#60a5fa", "Resolved":"#4ade80", "Escalated":"#f87171" };
const PRIORITY_COLOR: Record<Priority,string> = { High:"#f87171", Medium:"#fbbf24", Low:"#4ade80" };

export default function AdminGrievanceRedressal() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<"All"|GStatus>("All");
  const [note, setNote] = useState<Record<string,string>>({});

  const filtered = filter==="All" ? grievances : grievances.filter(g => g.status===filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Grievance Redressal System</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Formal complaint management system ensuring every user grievance is addressed within the SLA timeline.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Open Grievances", value:grievances.filter(g=>g.status==="Open").length, color:"#fbbf24", icon:AlertCircle },
          { label:"In Progress", value:grievances.filter(g=>g.status==="In Progress").length, color:"#60a5fa", icon:Clock },
          { label:"Escalated", value:grievances.filter(g=>g.status==="Escalated").length, color:"#f87171", icon:AlertCircle },
          { label:"Resolved MTD", value:grievances.filter(g=>g.status==="Resolved").length, color:"#4ade80", icon:CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div>
                <p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["All","Open","In Progress","Escalated","Resolved"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f as "All"|GStatus)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(g => (
          <div key={g.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:g.status==="Escalated"?"rgba(248,113,113,.3)":T.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-mono text-xs" style={{ color:T.sub }}>{g.id}</span>
                  <span className="font-bold text-sm" style={{ color:T.text }}>{g.type}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${PRIORITY_COLOR[g.priority]}15`, color:PRIORITY_COLOR[g.priority] }}>{g.priority}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${STATUS_COLOR[g.status]}15`, color:STATUS_COLOR[g.status] }}>{g.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" style={{ color:T.sub }} />
                  <span className="text-xs" style={{ color:T.sub }}>{g.user} · {g.raised} · Assigned: {g.assigned}</span>
                </div>
              </div>
            </div>
            <p className="text-sm mb-3" style={{ color:T.sub }}>"{g.description}"</p>
            <div className="flex items-center gap-2">
              <input value={note[g.id]||""} onChange={e=>setNote(prev=>({...prev,[g.id]:e.target.value}))}
                placeholder="Add response note..." className="flex-1 px-3 py-2 rounded-xl text-xs border"
                style={{ background:T.input, borderColor:T.border, color:T.text }} />
              <button className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background:A1, color:"#fff" }}>
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
              {g.status!=="Resolved" && (
                <button className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>Resolve</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
