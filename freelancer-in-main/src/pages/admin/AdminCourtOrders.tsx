import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Scale, AlertTriangle, CheckCircle2, FileText, Plus } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type OrderStatus = "Active Hold"|"Complied"|"Pending Review"|"Challenged";

const orders = [
  { id:"CO001", court:"Delhi High Court", caseNo:"WP-4821/2026", subject:"Account freeze — fraud investigation", affectedUser:"user_4821", issued:"Mar 15, 2026", deadline:"Apr 15, 2026", status:"Active Hold" as OrderStatus },
  { id:"CO002", court:"Mumbai District Court", caseNo:"CS-1240/2025", subject:"Data disclosure — income tax notice", affectedUser:"user_2210", issued:"Jan 8, 2026", deadline:"Complied Feb 8", status:"Complied" as OrderStatus },
  { id:"CO003", court:"NCLT Bangalore", caseNo:"CP-99/2026", subject:"Payment dispute arbitration hold", affectedUser:"user_9001", issued:"Apr 1, 2026", deadline:"Apr 30, 2026", status:"Pending Review" as OrderStatus },
  { id:"CO004", court:"Madras High Court", caseNo:"WA-342/2026", subject:"NDA violation — IP dispute", affectedUser:"user_7710", issued:"Feb 20, 2026", deadline:"Apr 20, 2026", status:"Challenged" as OrderStatus },
];

const STATUS_COLOR: Record<OrderStatus,string> = {
  "Active Hold":"#f87171",
  "Complied":"#4ade80",
  "Pending Review":"#fbbf24",
  "Challenged":"#a78bfa",
};

export default function AdminCourtOrders() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<"All"|OrderStatus>("All");

  const filtered = filter==="All" ? orders : orders.filter(o => o.status===filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Court Order Management</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Track and comply with court orders, account freezes, data disclosure requirements, and legal holds.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> Log Order
        </button>
      </div>

      <div className="p-4 rounded-2xl border" style={{ background:"rgba(248,113,113,.07)", borderColor:"rgba(248,113,113,.25)" }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" style={{ color:"#f87171" }} />
          <p className="text-sm font-bold" style={{ color:"#f87171" }}>Legal Notice: Non-compliance with court orders is a criminal offence under Indian law. All orders must be actioned within the specified deadline.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Orders", value:"4", color:"#60a5fa", icon:Scale },
          { label:"Active Holds", value:"1", color:"#f87171", icon:AlertTriangle },
          { label:"Complied", value:"1", color:"#4ade80", icon:CheckCircle2 },
          { label:"Pending/Challenged", value:"2", color:"#fbbf24", icon:FileText },
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
        {(["All","Active Hold","Complied","Pending Review","Challenged"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f as "All"|OrderStatus)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(o => (
          <div key={o.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:o.status==="Active Hold"?"rgba(248,113,113,.3)":T.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <Scale className="h-4 w-4" style={{ color:A1 }} />
                  <span className="font-bold text-sm" style={{ color:T.text }}>{o.court}</span>
                  <span className="font-mono text-xs" style={{ color:T.sub }}>{o.caseNo}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${STATUS_COLOR[o.status]}15`, color:STATUS_COLOR[o.status] }}>{o.status}</span>
                </div>
                <p className="text-sm font-bold mb-1" style={{ color:T.text }}>{o.subject}</p>
                <p className="text-xs" style={{ color:T.sub }}>Affected: {o.affectedUser} · Issued: {o.issued} · Deadline: {o.deadline}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>View Docs</button>
                {o.status==="Active Hold" && (
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}>Manage Hold</button>
                )}
                {o.status==="Pending Review" && (
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>Mark Complied</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
