import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Trophy, Crown, Star, TrendingUp, RefreshCw } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const leaders = [
  { rank:1, name:"Aarav Mehta", skill:"React / Node.js", city:"Mumbai", earnings:"₹4,82,000", projects:48, rating:4.98, badge:"Top Rated" },
  { rank:2, name:"Priya Iyer", skill:"UI/UX Design", city:"Bangalore", earnings:"₹3,94,000", projects:62, rating:4.97, badge:"Rising Star" },
  { rank:3, name:"Rohan Gupta", skill:"Python / ML", city:"Hyderabad", earnings:"₹3,41,000", projects:34, rating:4.95, badge:"Skill Ace" },
  { rank:4, name:"Sneha Verma", skill:"Content Writing", city:"Delhi", earnings:"₹2,88,000", projects:94, rating:4.94, badge:"Fast Responder" },
  { rank:5, name:"Kiran Nair", skill:"SEO / Digital Marketing", city:"Pune", earnings:"₹2,41,000", projects:57, rating:4.92, badge:"Top Rated" },
  { rank:6, name:"Divya Sharma", skill:"Graphic Design", city:"Chennai", earnings:"₹2,18,000", projects:71, rating:4.91, badge:"KYC Verified" },
  { rank:7, name:"Amit Joshi", skill:"DevOps / Cloud", city:"Bangalore", earnings:"₹1,98,000", projects:28, rating:4.90, badge:"Top Rated" },
  { rank:8, name:"Pooja Reddy", skill:"Data Analysis", city:"Hyderabad", earnings:"₹1,74,000", projects:39, rating:4.89, badge:"Skill Ace" },
  { rank:9, name:"Suresh Kumar", skill:"Android Dev", city:"Kolkata", earnings:"₹1,52,000", projects:31, rating:4.88, badge:"Rising Star" },
  { rank:10, name:"Meera Pillai", skill:"Video Editing", city:"Kochi", earnings:"₹1,34,000", projects:84, rating:4.87, badge:"Fast Responder" },
];

type Period = "MTD"|"QTD"|"YTD"|"All Time";

export default function AdminLeaderboardManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [period, setPeriod] = useState<Period>("MTD");
  const [category, setCategory] = useState("All Skills");

  const rankColor = (r:number) => r===1?"#fbbf24":r===2?"#94a3b8":r===3?"#f97316":"";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Leaderboard Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Manage and publish top freelancer rankings by earnings, ratings, and project completion across skill categories.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor:T.border, color:T.sub }}>
          <RefreshCw className="h-4 w-4" /> Recalculate
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total on Leaderboard", value:"500", color:"#a78bfa", icon:Trophy },
          { label:"Categories", value:"18", color:"#60a5fa", icon:Star },
          { label:"Avg Top-10 Earnings", value:"₹2.6L", color:"#fbbf24", icon:Crown },
          { label:"Last Updated", value:"Today 6 AM", color:"#4ade80", icon:TrendingUp },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1">
          {(["MTD","QTD","YTD","All Time"] as Period[]).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
              style={{ background:period===p?A1:"transparent", color:period===p?"#fff":T.sub, borderColor:period===p?A1:T.border }}>{p}</button>
          ))}
        </div>
        <select value={category} onChange={e=>setCategory(e.target.value)} className="px-3 py-1.5 rounded-xl text-xs border" style={{ background:T.input, borderColor:T.border, color:T.text }}>
          {["All Skills","Web Development","Design","Writing","Marketing","Data Science","Mobile Dev","Video"].map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
        <table className="w-full text-sm">
          <thead><tr className="border-b" style={{ borderColor:T.border }}>
            {["Rank","Freelancer","Skill","City","Earnings","Projects","Rating","Badge"].map(h=>(
              <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {leaders.map(l=>(
              <tr key={l.rank} className="border-b" style={{ borderColor:T.border }}>
                <td className="px-4 py-3">
                  {l.rank <= 3
                    ? <span className="text-lg">{l.rank===1?"🥇":l.rank===2?"🥈":"🥉"}</span>
                    : <span className="font-bold text-sm" style={{ color:T.sub }}>#{l.rank}</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background:`${A1}20`, color:A1 }}>{l.name[0]}</div>
                    <span className="font-bold text-sm" style={{ color:T.text }}>{l.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{l.skill}</td>
                <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{l.city}</td>
                <td className="px-4 py-3 font-bold text-sm" style={{ color:"#4ade80" }}>{l.earnings}</td>
                <td className="px-4 py-3 font-bold" style={{ color:T.sub }}>{l.projects}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 font-bold" style={{ color:"#fbbf24" }}>⭐ {l.rating}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}12`, color:A1 }}>{l.badge}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
