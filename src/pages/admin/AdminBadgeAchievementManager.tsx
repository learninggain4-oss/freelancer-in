import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Star, Plus, Award, Users, CheckCircle2, Edit } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const badges = [
  { id:"B001", name:"Top Rated", emoji:"⭐", description:"Maintain 4.8+ rating with 20+ reviews", awarded:1840, criteria:"Rating ≥ 4.8 & Reviews ≥ 20", active:true, color:"#fbbf24" },
  { id:"B002", name:"KYC Verified", emoji:"✅", description:"Complete Aadhaar + Bank verification", awarded:28400, criteria:"Aadhaar verified + Bank verified", active:true, color:"#4ade80" },
  { id:"B003", name:"Rising Star", emoji:"🚀", description:"Complete 5+ projects in first 30 days", awarded:3210, criteria:"Projects ≥ 5 within 30 days of joining", active:true, color:"#60a5fa" },
  { id:"B004", name:"Skill Ace", emoji:"🧠", description:"Pass 3+ skill assessments with 80%+", awarded:4820, criteria:"Skill tests passed ≥ 3 with score ≥ 80", active:true, color:"#a78bfa" },
  { id:"B005", name:"Fast Responder", emoji:"⚡", description:"Average response time under 1 hour", awarded:2940, criteria:"Avg response time < 60 min, 30-day average", active:true, color:"#f97316" },
  { id:"B006", name:"Premium Member", emoji:"💎", description:"Subscribed to FreeLan Premium plan", awarded:980, criteria:"Active premium subscription", active:true, color:"#e879f9" },
  { id:"B007", name:"Mentor", emoji:"🎓", description:"Helped 10+ new freelancers with reviews", awarded:240, criteria:"Mentor interactions ≥ 10", active:false, color:"#2dd4bf" },
];

export default function AdminBadgeAchievementManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<"All"|"Active"|"Inactive">("All");
  const filtered = filter==="All" ? badges : badges.filter(b=>filter==="Active"?b.active:!b.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Badge & Achievement Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Create and manage achievement badges that are automatically awarded to freelancers based on defined criteria.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> New Badge
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Badges", value:badges.length, color:"#a78bfa", icon:Award },
          { label:"Total Awarded", value:badges.reduce((s,b)=>s+b.awarded,0).toLocaleString(), color:"#fbbf24", icon:Star },
          { label:"Active Badges", value:badges.filter(b=>b.active).length, color:"#4ade80", icon:CheckCircle2 },
          { label:"Users with Badges", value:"31,430", color:"#60a5fa", icon:Users },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["All","Active","Inactive"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>{f}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map(b=>(
          <div key={b.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background:`${b.color}15`, border:`1px solid ${b.color}30` }}>{b.emoji}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ color:T.text }}>{b.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:b.active?"rgba(74,222,128,.12)":"rgba(148,163,184,.12)", color:b.active?"#4ade80":"#94a3b8" }}>{b.active?"Active":"Inactive"}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color:T.sub }}>{b.description}</p>
                  <p className="text-xs font-mono p-2 rounded-lg" style={{ background:`${A1}08`, color:T.sub }}>Criteria: {b.criteria}</p>
                </div>
              </div>
              <button className="p-2 rounded-xl border shrink-0" style={{ borderColor:T.border, color:T.sub }}><Edit className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-3 pt-3 border-t" style={{ borderColor:T.border }}>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color:T.sub }}>Awarded to</span>
                <span className="font-bold" style={{ color:b.color }}>{b.awarded.toLocaleString()} users</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
