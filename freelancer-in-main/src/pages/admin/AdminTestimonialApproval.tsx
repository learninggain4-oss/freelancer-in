import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Star, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type TStatus = "Pending"|"Approved"|"Rejected"|"Featured";

const testimonials = [
  { id:"T001", client:"Rajan Mehta", company:"TechStartup", freelancer:"Priya S.", rating:5, text:"Priya delivered an outstanding UI redesign. She understood our brand instantly and the results exceeded expectations. Highly recommended!", project:"SaaS Dashboard UI", submitted:"3 hr ago", status:"Pending" as TStatus },
  { id:"T002", client:"Anjali Roy",  company:"E-Store",      freelancer:"Arjun N.", rating:5, text:"Arjun built our entire e-commerce backend in 3 weeks. Exceptional code quality and communication throughout the project.", project:"E-commerce Backend", submitted:"6 hr ago", status:"Pending" as TStatus },
  { id:"T003", client:"Vikram Jain", company:"FinApp",       freelancer:"Sneha G.", rating:4, text:"Great work on the mobile app. A few minor revisions were needed but overall very professional delivery.", project:"Flutter FinApp", submitted:"Yesterday", status:"Approved" as TStatus },
  { id:"T004", client:"Neha Singh",  company:"ContentCo",    freelancer:"Rahul D.", rating:3, text:"Average quality writing. Met deadlines but the content needed significant editing before publishing.", project:"Blog Content", submitted:"2 days ago", status:"Rejected" as TStatus },
  { id:"T005", client:"Amit Kumar",  company:"HealthTech",   freelancer:"Priya S.", rating:5, text:"Best freelancer on the platform! Priya's React skills are top-notch. We will definitely hire her again.", project:"Patient Portal", submitted:"3 days ago", status:"Featured" as TStatus },
];

const STATUS_COLOR: Record<TStatus,string> = { Pending:"#fbbf24", Approved:"#4ade80", Rejected:"#f87171", Featured:"#a78bfa" };

export default function AdminTestimonialApproval() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<"All"|TStatus>("All");

  const filtered = filter==="All" ? testimonials : testimonials.filter(t => t.status===filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Testimonial Approval</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Review and moderate client testimonials before they appear on freelancer profiles and the platform homepage.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Pending Review", value:testimonials.filter(t=>t.status==="Pending").length, color:"#fbbf24", icon:Clock },
          { label:"Approved", value:testimonials.filter(t=>t.status==="Approved").length, color:"#4ade80", icon:CheckCircle2 },
          { label:"Featured", value:testimonials.filter(t=>t.status==="Featured").length, color:"#a78bfa", icon:Star },
          { label:"Rejected", value:testimonials.filter(t=>t.status==="Rejected").length, color:"#f87171", icon:XCircle },
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
          <button key={f} onClick={() => setFilter(f as "All"|TStatus)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(t => (
          <div key={t.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-bold text-sm" style={{ color:T.text }}>{t.client}</span>
                  <span className="text-xs" style={{ color:T.sub }}>({t.company})</span>
                  <span className="text-xs" style={{ color:T.sub }}>→ {t.freelancer}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${STATUS_COLOR[t.status]}15`, color:STATUS_COLOR[t.status] }}>{t.status}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({length:5},(_,i) => (
                    <Star key={i} className="h-3.5 w-3.5" style={{ color:i<t.rating?"#fbbf24":"rgba(148,163,184,.3)", fill:i<t.rating?"#fbbf24":"none" }} />
                  ))}
                  <span className="text-xs" style={{ color:T.sub }}>· {t.project} · {t.submitted}</span>
                </div>
              </div>
              <button className="p-2 rounded-xl border shrink-0" style={{ borderColor:T.border, color:T.sub }}>
                <Eye className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm italic mb-3 p-3 rounded-xl border" style={{ color:T.sub, borderColor:T.border }}>"{t.text}"</p>

            {t.status==="Pending" && (
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>
                  <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />Approve
                </button>
                <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background:"rgba(167,139,250,.12)", color:"#a78bfa" }}>
                  <Star className="h-3.5 w-3.5 inline mr-1" />Feature on Homepage
                </button>
                <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}>
                  <XCircle className="h-3.5 w-3.5 inline mr-1" />Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
