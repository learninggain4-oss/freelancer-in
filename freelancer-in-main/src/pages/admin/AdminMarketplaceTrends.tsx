import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { TrendingUp, BarChart3, Zap, Globe } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const topSkills = [
  { skill:"React.js",       demand:94, supply:72, avgRate:"₹1,200/hr", trend:"+18%" },
  { skill:"AI/ML Engineer", demand:98, supply:41, avgRate:"₹2,100/hr", trend:"+42%" },
  { skill:"Flutter",        demand:86, supply:58, avgRate:"₹1,100/hr", trend:"+24%" },
  { skill:"Video Editing",  demand:78, supply:82, avgRate:"₹600/hr",  trend:"+8%" },
  { skill:"Content Writing",demand:72, supply:91, avgRate:"₹250/hr",  trend:"-3%" },
  { skill:"UI/UX Design",   demand:88, supply:65, avgRate:"₹900/hr",  trend:"+15%" },
  { skill:"Node.js",        demand:82, supply:69, avgRate:"₹950/hr",  trend:"+11%" },
  { skill:"DevOps",         demand:90, supply:38, avgRate:"₹1,800/hr",trend:"+31%" },
];

export default function AdminMarketplaceTrends() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [view, setView] = useState<"skills"|"categories"|"rates">("skills");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Marketplace Trends</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>In-demand skills, category growth, rate benchmarks, and supply-demand analysis across the platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Hottest Skill", value:"AI/ML", color:"#f87171", icon:Zap },
          { label:"Highest Growth", value:"+42% AI/ML", color:"#4ade80", icon:TrendingUp },
          { label:"Avg Platform Rate", value:"₹980/hr", color:"#a78bfa", icon:BarChart3 },
          { label:"Skills Tracked", value:"128", color:"#60a5fa", icon:Globe },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div>
                <p className="text-sm font-bold" style={{ color:T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["skills","categories","rates"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className="px-4 py-2 rounded-xl text-sm font-bold capitalize border transition-all"
            style={{ background:view===v?A1:"transparent", color:view===v?"#fff":T.sub, borderColor:view===v?A1:T.border }}>
            {v==="skills"?"Top Skills":v==="categories"?"Category Trends":"Rate Benchmarks"}
          </button>
        ))}
      </div>

      {view==="skills" && (
        <div className="space-y-3">
          {topSkills.map(s => (
            <div key={s.skill} className="rounded-2xl border p-4" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm" style={{ color:T.text }}>{s.skill}</span>
                  <span className="text-xs font-bold" style={{ color:s.trend.startsWith("+")?"#4ade80":"#f87171" }}>{s.trend}</span>
                </div>
                <span className="text-sm font-bold" style={{ color:A1 }}>{s.avgRate}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px]" style={{ color:T.sub }}>Demand</span>
                    <span className="text-[10px] font-bold" style={{ color:"#f87171" }}>{s.demand}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background:"rgba(248,113,113,.2)" }}>
                    <div className="h-1.5 rounded-full" style={{ width:`${s.demand}%`, background:"#f87171" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px]" style={{ color:T.sub }}>Supply</span>
                    <span className="text-[10px] font-bold" style={{ color:"#4ade80" }}>{s.supply}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background:"rgba(74,222,128,.2)" }}>
                    <div className="h-1.5 rounded-full" style={{ width:`${s.supply}%`, background:"#4ade80" }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view==="categories" && (
        <div className="grid lg:grid-cols-2 gap-4">
          {[
            { cat:"Technology", growth:"+28%", jobs:4820, color:"#6366f1" },
            { cat:"Design",     growth:"+19%", jobs:2140, color:"#f472b6" },
            { cat:"Marketing",  growth:"+11%", jobs:1890, color:"#fbbf24" },
            { cat:"Writing",    growth:"-2%",  jobs:1540, color:"#94a3b8" },
            { cat:"Finance",    growth:"+7%",  jobs:980,  color:"#4ade80" },
            { cat:"Education",  growth:"+34%", jobs:760,  color:"#60a5fa" },
          ].map(c => (
            <div key={c.cat} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color:T.text }}>{c.cat}</span>
                <span className="font-bold text-sm" style={{ color:c.growth.startsWith("+")?"#4ade80":"#f87171" }}>{c.growth}</span>
              </div>
              <p className="text-2xl font-bold mb-2" style={{ color:c.color }}>{c.jobs.toLocaleString()}</p>
              <p className="text-xs" style={{ color:T.sub }}>active jobs</p>
            </div>
          ))}
        </div>
      )}

      {view==="rates" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor:T.border }}>
                {["Skill","Min Rate","Avg Rate","Max Rate","YoY Change"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { skill:"React.js",  min:"₹600",  avg:"₹1,200", max:"₹2,400", yoy:"+12%" },
                { skill:"AI/ML",     min:"₹1,000",avg:"₹2,100", max:"₹5,000", yoy:"+42%" },
                { skill:"Flutter",   min:"₹500",  avg:"₹1,100", max:"₹2,200", yoy:"+24%" },
                { skill:"UI/UX",     min:"₹400",  avg:"₹900",   max:"₹1,800", yoy:"+15%" },
                { skill:"Content",   min:"₹100",  avg:"₹250",   max:"₹600",   yoy:"-3%" },
                { skill:"DevOps",    min:"₹800",  avg:"₹1,800", max:"₹4,000", yoy:"+31%" },
              ].map(r => (
                <tr key={r.skill} className="border-b" style={{ borderColor:T.border }}>
                  <td className="px-4 py-3 font-bold" style={{ color:T.text }}>{r.skill}</td>
                  <td className="px-4 py-3" style={{ color:T.sub }}>{r.min}</td>
                  <td className="px-4 py-3 font-bold" style={{ color:A1 }}>{r.avg}</td>
                  <td className="px-4 py-3" style={{ color:T.sub }}>{r.max}</td>
                  <td className="px-4 py-3 font-bold" style={{ color:r.yoy.startsWith("+")?"#4ade80":"#f87171" }}>{r.yoy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
