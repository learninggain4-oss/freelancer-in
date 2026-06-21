import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Users, TrendingUp, Calendar, BarChart3 } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const cohorts = [
  { month:"Jan 2026", users:1240, w1:82, w2:61, w4:48, w8:39, w12:32 },
  { month:"Feb 2026", users:1580, w1:79, w2:58, w4:44, w8:36, w12:null },
  { month:"Mar 2026", users:2010, w1:84, w2:64, w4:51, w8:null, w12:null },
  { month:"Apr 2026", users:1890, w1:81, w2:null, w4:null, w8:null, w12:null },
];

function retentionColor(val: number|null): string {
  if(val===null) return "rgba(255,255,255,.04)";
  if(val>=70) return "rgba(74,222,128,.25)";
  if(val>=50) return "rgba(96,165,250,.2)";
  if(val>=35) return "rgba(251,191,36,.18)";
  return "rgba(248,113,113,.18)";
}
function retentionText(val: number|null, T: {sub:string}): string {
  return val===null ? T.sub : val>=70 ? "#4ade80" : val>=50 ? "#60a5fa" : val>=35 ? "#fbbf24" : "#f87171";
}

export default function AdminCohortAnalysis() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [metric, setMetric] = useState<"retention"|"revenue">("retention");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Cohort Analysis</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Track user retention and behaviour over time, grouped by signup month.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Avg Week-1 Retention", value:"81.5%", color:"#4ade80", icon:Users },
          { label:"Avg Week-4 Retention", value:"47.8%", color:"#60a5fa", icon:TrendingUp },
          { label:"Best Cohort", value:"Mar 2026", color:"#a78bfa", icon:Calendar },
          { label:"Total Cohorts Tracked", value:"16", color:"#fbbf24", icon:BarChart3 },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div>
                <p className="text-lg font-bold" style={{ color:T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["retention","revenue"] as const).map(m => (
          <button key={m} onClick={() => setMetric(m)} className="px-4 py-2 rounded-xl text-sm font-bold capitalize border transition-all"
            style={{ background:metric===m?A1:"transparent", color:metric===m?"#fff":T.sub, borderColor:metric===m?A1:T.border }}>
            {m==="retention"?"Retention Cohort":"Revenue Cohort"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
        <div className="p-4 border-b" style={{ borderColor:T.border }}>
          <h3 className="font-bold" style={{ color:T.text }}>User Retention Heatmap</h3>
          <p className="text-xs mt-1" style={{ color:T.sub }}>% of users still active after each week</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor:T.border }}>
                <th className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>Cohort</th>
                <th className="px-4 py-3 text-xs font-bold text-center" style={{ color:T.sub }}>Users</th>
                {["Week 1","Week 2","Week 4","Week 8","Week 12"].map(w => (
                  <th key={w} className="px-4 py-3 text-xs font-bold text-center" style={{ color:T.sub }}>{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c,i) => (
                <tr key={i} className="border-b" style={{ borderColor:T.border }}>
                  <td className="px-4 py-3 font-bold text-sm" style={{ color:T.text }}>{c.month}</td>
                  <td className="px-4 py-3 text-center text-sm" style={{ color:T.sub }}>{c.users.toLocaleString()}</td>
                  {[c.w1,c.w2,c.w4,c.w8,c.w12].map((v,j) => (
                    <td key={j} className="px-2 py-1.5 text-center">
                      <div className="mx-auto rounded-lg py-1.5 px-3 text-xs font-bold" style={{ background:retentionColor(v), color:retentionText(v,T) }}>
                        {v===null ? "—" : `${v}%`}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex items-center gap-4 flex-wrap">
          {[["≥70%","#4ade80","Excellent"],["50–69%","#60a5fa","Good"],["35–49%","#fbbf24","Average"],["<35%","#f87171","Poor"]].map(([pct,color,label]) => (
            <div key={pct} className="flex items-center gap-2">
              <div className="h-3 w-6 rounded" style={{ background:`${color}40` }} />
              <span className="text-xs" style={{ color:T.sub }}>{pct} — {label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold" style={{ color:T.text }}>Retention Drivers</h3>
          {[
            { factor:"Completed first project", impact:"+28% retention" },
            { factor:"Enabled 2FA security", impact:"+19% retention" },
            { factor:"Posted portfolio", impact:"+15% retention" },
            { factor:"Used chat feature", impact:"+12% retention" },
            { factor:"Received first review", impact:"+22% retention" },
          ].map(d => (
            <div key={d.factor} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
              <span className="text-sm" style={{ color:T.text }}>{d.factor}</span>
              <span className="text-sm font-bold" style={{ color:"#4ade80" }}>{d.impact}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold" style={{ color:T.text }}>Churn Risk Factors</h3>
          {[
            { factor:"No project in 30 days", risk:"High" },
            { factor:"KYC not completed", risk:"High" },
            { factor:"Low bid acceptance rate", risk:"Medium" },
            { factor:"No chat response in 48h", risk:"Medium" },
            { factor:"Single-category focus", risk:"Low" },
          ].map(d => (
            <div key={d.factor} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
              <span className="text-sm" style={{ color:T.text }}>{d.factor}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:d.risk==="High"?"rgba(248,113,113,.12)":d.risk==="Medium"?"rgba(251,191,36,.12)":"rgba(74,222,128,.12)", color:d.risk==="High"?"#f87171":d.risk==="Medium"?"#fbbf24":"#4ade80" }}>{d.risk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
