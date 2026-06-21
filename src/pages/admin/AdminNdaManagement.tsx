import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Lock, FileText, CheckCircle2, Clock, AlertTriangle, Plus } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type NDAStatus = "Active"|"Pending"|"Expired"|"Violated";

const ndas = [
  { id:"N001", parties:"Infosys BPM ↔ Ravi Sharma", project:"Banking Core Module", signed:"Jan 15, 2026", expires:"Jan 15, 2027", status:"Active" as NDAStatus },
  { id:"N002", parties:"Zomato ↔ Priya Mehta",      project:"ML Recommendation Engine", signed:"Feb 3, 2026",  expires:"Feb 3, 2027",  status:"Active" as NDAStatus },
  { id:"N003", parties:"Startup X ↔ Arjun Nair",    project:"Mobile App MVP",            signed:"Dec 1, 2025",  expires:"Jun 1, 2026",  status:"Active" as NDAStatus },
  { id:"N004", parties:"TechCo ↔ Sneha Gupta",       project:"Data Pipeline",             signed:"Sep 5, 2025",  expires:"Mar 5, 2026",  status:"Expired" as NDAStatus },
  { id:"N005", parties:"ClientY ↔ Vikram Singh",     project:"E-commerce Platform",       signed:"Mar 20, 2026", expires:"Pending sign", status:"Pending" as NDAStatus },
  { id:"N006", parties:"FinCo ↔ Anonymous",           project:"Confidential Analysis",     signed:"Nov 1, 2025",  expires:"N/A",          status:"Violated" as NDAStatus },
];

const STATUS_COLOR: Record<NDAStatus,string> = { Active:"#4ade80", Pending:"#fbbf24", Expired:"#94a3b8", Violated:"#f87171" };
const STATUS_ICON: Record<NDAStatus, typeof CheckCircle2> = { Active:CheckCircle2, Pending:Clock, Expired:AlertTriangle, Violated:AlertTriangle };

export default function AdminNdaManagement() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<"All"|NDAStatus>("All");

  const filtered = filter==="All" ? ndas : ndas.filter(n => n.status===filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>NDA Management</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Manage Non-Disclosure Agreements between clients and freelancers. Track signing, expiry, and violations.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> Create NDA
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total NDAs", value:"6", color:"#60a5fa", icon:FileText },
          { label:"Active", value:"3", color:"#4ade80", icon:CheckCircle2 },
          { label:"Pending Signature", value:"1", color:"#fbbf24", icon:Clock },
          { label:"Violations", value:"1", color:"#f87171", icon:AlertTriangle },
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
        {(["All","Active","Pending","Expired","Violated"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(n => {
          const Icon = STATUS_ICON[n.status];
          return (
            <div key={n.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:n.status==="Violated"?"rgba(248,113,113,.3)":T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <Lock className="h-4 w-4" style={{ color:A1 }} />
                    <span className="font-bold text-sm" style={{ color:T.text }}>{n.parties}</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background:`${STATUS_COLOR[n.status]}15` }}>
                      <Icon className="h-3 w-3" style={{ color:STATUS_COLOR[n.status] }} />
                      <span className="text-[10px] font-bold" style={{ color:STATUS_COLOR[n.status] }}>{n.status}</span>
                    </div>
                  </div>
                  <p className="text-xs mb-1" style={{ color:T.sub }}>Project: {n.project}</p>
                  <p className="text-xs" style={{ color:T.sub }}>Signed: {n.signed} · Expires: {n.expires}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>View</button>
                  {n.status==="Violated" && (
                    <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}>Take Action</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
