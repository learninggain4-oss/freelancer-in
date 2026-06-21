import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { UserX, RefreshCw, Mail, Bell, TrendingUp, Users } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const segments = [
  { label:"Inactive 7–14 Days", count:1840, lastAction:"Browse only", recoveryRate:28, action:"Gentle Nudge" },
  { label:"Inactive 15–30 Days", count:3210, lastAction:"No login", recoveryRate:18, action:"Win-back Email" },
  { label:"Inactive 30–60 Days", count:4820, lastAction:"Incomplete profile", recoveryRate:11, action:"Profile Completion Push" },
  { label:"Inactive 60–90 Days", count:2940, lastAction:"No bid submitted", recoveryRate:6, action:"Special Offer SMS" },
  { label:"Inactive 90+ Days (Churned)", count:8100, lastAction:"No activity", recoveryRate:2, action:"Re-activation Campaign" },
];

const sequences = [
  { name:"7-Day Inactivity", steps:["Day 1: Push — Miss you!", "Day 3: Email — New jobs in your skill", "Day 7: SMS — Special offer"], active:true },
  { name:"30-Day Win-back", steps:["Day 1: Email — We noticed you left", "Day 7: Push — Exclusive promo", "Day 14: SMS — Last chance"], active:true },
  { name:"Profile Incomplete", steps:["Day 1: Push — Complete profile for 2x visibility", "Day 3: Email — Tips to win bids"], active:false },
];

export default function AdminAbandonedUserReengagement() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"segments"|"sequences">("segments");
  const totalAbandoned = segments.reduce((s,g)=>s+g.count,0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Abandoned User Re-engagement</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Identify inactive users and automatically trigger personalized re-engagement campaigns across email, SMS, and push.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Inactive Users", value:totalAbandoned.toLocaleString(), color:"#f87171", icon:UserX },
          { label:"Recovered This Month", value:"1,284", color:"#4ade80", icon:RefreshCw },
          { label:"Recovery Rate Avg", value:"13%", color:"#fbbf24", icon:TrendingUp },
          { label:"Active Sequences", value:"2", color:"#a78bfa", icon:Bell },
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
        {(["segments","sequences"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="segments"?"Inactive Segments":"Re-engagement Sequences"}
          </button>
        ))}
      </div>

      {tab==="segments" && (
        <div className="space-y-3">
          {segments.map((s,i)=>(
            <div key={i} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Users className="h-4 w-4" style={{ color:A1 }} />
                    <span className="font-bold text-sm" style={{ color:T.text }}>{s.label}</span>
                    <span className="text-xl font-bold ml-2" style={{ color:"#f87171" }}>{s.count.toLocaleString()}</span>
                    <span className="text-xs" style={{ color:T.sub }}>users</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color:T.sub }}>Last action: {s.lastAction} · Recovery rate: {s.recoveryRate}%</p>
                  <div className="h-1.5 rounded-full w-48" style={{ background:`${A1}15` }}>
                    <div className="h-1.5 rounded-full" style={{ width:`${s.recoveryRate}%`, background:s.recoveryRate>20?"#4ade80":s.recoveryRate>10?"#fbbf24":"#f87171" }} />
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0" style={{ background:A1, color:"#fff" }}>
                  <Mail className="h-3.5 w-3.5 inline mr-1" />{s.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="sequences" && (
        <div className="space-y-4">
          {sequences.map((s,i)=>(
            <div key={i} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold" style={{ color:T.text }}>{s.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:s.active?"rgba(74,222,128,.12)":"rgba(148,163,184,.12)", color:s.active?"#4ade80":"#94a3b8" }}>{s.active?"Active":"Paused"}</span>
                </div>
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>Edit Sequence</button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {s.steps.map((step,j)=>(
                  <div key={j} className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-2 rounded-xl text-xs border" style={{ background:`${A1}08`, borderColor:`${A1}20`, color:T.text }}>{step}</div>
                    {j<s.steps.length-1 && <span style={{ color:T.sub }}>→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="w-full py-3 rounded-2xl border-2 border-dashed text-sm font-bold" style={{ borderColor:`${A1}30`, color:A1 }}>+ Add New Sequence</button>
        </div>
      )}
    </div>
  );
}
