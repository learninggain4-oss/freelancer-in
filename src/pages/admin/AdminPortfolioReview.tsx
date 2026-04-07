import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Image, CheckCircle2, XCircle, Clock, Eye, Star } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type PStatus = "Pending"|"Approved"|"Rejected"|"Featured";

const portfolios = [
  { id:"P001", freelancer:"Priya Mehta",   category:"UI/UX Design",   title:"E-commerce App Redesign",   submitted:"2 hr ago",   status:"Pending" as PStatus,  quality:null },
  { id:"P002", freelancer:"Arjun Nair",    category:"Web Development", title:"Hospital Management System", submitted:"5 hr ago",   status:"Pending" as PStatus,  quality:null },
  { id:"P003", freelancer:"Sneha Gupta",   category:"Graphic Design",  title:"Brand Identity — TechStartup", submitted:"Yesterday", status:"Approved" as PStatus, quality:4.8 },
  { id:"P004", freelancer:"Rahul Das",     category:"Mobile Apps",     title:"Food Delivery App — Flutter",  submitted:"Yesterday", status:"Featured" as PStatus, quality:5.0 },
  { id:"P005", freelancer:"Vikram Singh",  category:"Content Writing", title:"SEO Blog Content Samples",     submitted:"2 days ago", status:"Rejected" as PStatus, quality:2.1 },
  { id:"P006", freelancer:"Neha Joshi",    category:"Video Editing",   title:"YouTube Channel Reel",          submitted:"3 days ago", status:"Approved" as PStatus, quality:4.5 },
];

const STATUS_COLOR: Record<PStatus,string> = { Pending:"#fbbf24", Approved:"#4ade80", Rejected:"#f87171", Featured:"#a78bfa" };

export default function AdminPortfolioReview() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<"All"|PStatus>("All");
  const [rejNote, setRejNote] = useState<Record<string,string>>({});

  const filtered = filter==="All" ? portfolios : portfolios.filter(p => p.status===filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Portfolio Review Queue</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Review, approve, reject, or feature freelancer portfolio submissions to maintain quality standards.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Pending Review", value:portfolios.filter(p=>p.status==="Pending").length, color:"#fbbf24", icon:Clock },
          { label:"Approved MTD", value:portfolios.filter(p=>p.status==="Approved").length, color:"#4ade80", icon:CheckCircle2 },
          { label:"Featured", value:portfolios.filter(p=>p.status==="Featured").length, color:"#a78bfa", icon:Star },
          { label:"Rejected", value:portfolios.filter(p=>p.status==="Rejected").length, color:"#f87171", icon:XCircle },
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
        {(["All","Pending","Approved","Featured","Rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f as "All"|PStatus)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(p => (
          <div key={p.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${A1}15` }}>
                  <Image className="h-6 w-6" style={{ color:A1 }} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-bold text-sm" style={{ color:T.text }}>{p.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${STATUS_COLOR[p.status]}15`, color:STATUS_COLOR[p.status] }}>{p.status}</span>
                  </div>
                  <p className="text-xs" style={{ color:T.sub }}>{p.freelancer} · {p.category} · {p.submitted}</p>
                  {p.quality && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3" style={{ color:"#fbbf24" }} />
                      <span className="text-xs font-bold" style={{ color:"#fbbf24" }}>{p.quality}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="p-2 rounded-xl border" style={{ borderColor:T.border, color:T.sub }}><Eye className="h-4 w-4" /></button>
              </div>
            </div>
            {p.status==="Pending" && (
              <div className="space-y-2">
                <input value={rejNote[p.id]||""} onChange={e=>setRejNote(prev=>({...prev,[p.id]:e.target.value}))}
                  placeholder="Rejection reason (optional)..." className="w-full px-3 py-2 rounded-xl text-xs border"
                  style={{ background:T.input, borderColor:T.border, color:T.text }} />
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>
                    <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />Approve
                  </button>
                  <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background:"rgba(167,139,250,.12)", color:"#a78bfa" }}>
                    <Star className="h-3.5 w-3.5 inline mr-1" />Feature
                  </button>
                  <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}>
                    <XCircle className="h-3.5 w-3.5 inline mr-1" />Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
