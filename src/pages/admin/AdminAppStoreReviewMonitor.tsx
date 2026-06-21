import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Star, MessageSquare, TrendingUp, AlertCircle, ThumbsUp } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const reviews = [
  { id:"R001", platform:"Play Store", user:"Rahul M.", rating:5, text:"Excellent app! Got my first project within 2 days. Payments are smooth via UPI.", date:"Apr 6", responded:true, version:"2.4.1" },
  { id:"R002", platform:"Play Store", user:"Sunita K.", rating:2, text:"App crashes when I try to submit a bid. Very frustrating. Please fix ASAP.", date:"Apr 5", responded:false, version:"2.3.5", flagged:true },
  { id:"R003", platform:"App Store", user:"Arjun V.", rating:4, text:"Good platform. KYC process could be faster. Otherwise very useful.", date:"Apr 5", responded:true, version:"2.4.1" },
  { id:"R004", platform:"Play Store", user:"Priya T.", rating:1, text:"Terrible! My account was suspended without reason. No response from support.", date:"Apr 4", responded:false, version:"2.4.0", flagged:true },
  { id:"R005", platform:"App Store", user:"Manish R.", rating:5, text:"Best freelancing app for India. Love the Hindi support and INR payments!", date:"Apr 4", responded:false, version:"2.4.1" },
  { id:"R006", platform:"Play Store", user:"Deepa N.", rating:3, text:"Average experience. Too many bids get ignored. Clients need to be more responsive.", date:"Apr 3", responded:false, version:"2.4.0" },
];

type Filter = "All"|"Unresponded"|"Flagged"|"5★"|"1★"|"2★";

export default function AdminAppStoreReviewMonitor() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<Filter>("All");
  const [reply, setReply] = useState<string|null>(null);

  const filtered = filter==="All" ? reviews
    : filter==="Unresponded" ? reviews.filter(r=>!r.responded)
    : filter==="Flagged" ? reviews.filter(r=>(r as any).flagged)
    : reviews.filter(r=>r.rating===parseInt(filter[0]));

  const avgRating = (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>App Store Review Monitor</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Monitor and respond to Google Play Store and Apple App Store reviews from the admin panel.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Avg Rating (Play)", value:"4.2 ⭐", color:"#fbbf24", icon:Star },
          { label:"Avg Rating (iOS)", value:"4.4 ⭐", color:"#fbbf24", icon:Star },
          { label:"Unresponded", value:reviews.filter(r=>!r.responded).length, color:"#f87171", icon:AlertCircle },
          { label:"Total Reviews", value:reviews.length, color:"#60a5fa", icon:MessageSquare },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["All","Unresponded","Flagged","5★","1★","2★"] as Filter[]).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>{f}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(r=>(
          <div key={r.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:(r as any).flagged?"rgba(248,113,113,.3)":T.border }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}12`, color:A1 }}>{r.platform}</span>
                  <span className="font-bold text-sm" style={{ color:T.text }}>{r.user}</span>
                  <span>{"⭐".repeat(r.rating)}</span>
                  {(r as any).flagged && <span className="text-xs font-bold text-red-400">⚠ Flagged</span>}
                </div>
                <p className="text-xs" style={{ color:T.sub }}>v{r.version} · {r.date}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background:r.responded?"rgba(74,222,128,.12)":"rgba(248,113,113,.12)", color:r.responded?"#4ade80":"#f87171" }}>{r.responded?"Responded":"Pending"}</span>
            </div>
            <p className="text-sm mb-3" style={{ color:T.text }}>{r.text}</p>
            {reply===r.id ? (
              <div className="space-y-2">
                <textarea rows={3} placeholder="Write your reply..." className="w-full px-3 py-2 rounded-xl text-sm border resize-none" style={{ background:T.input, borderColor:T.border, color:T.text }} />
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:A1, color:"#fff" }}>Post Reply</button>
                  <button onClick={()=>setReply(null)} className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setReply(r.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>
                <ThumbsUp className="h-3.5 w-3.5" /> Reply to Review
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
