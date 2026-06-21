import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Trophy, Star, UserPlus, IndianRupee } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const leaders = [
  { rank:1,  name:"Sita Rao",      city:"Bangalore", referrals:61, earned:"₹18,300", badge:"🥇", streak:12 },
  { rank:2,  name:"Ravi Shankar",  city:"Mumbai",    referrals:42, earned:"₹12,600", badge:"🥈", streak:8 },
  { rank:3,  name:"Priya Mehta",   city:"Delhi",     referrals:38, earned:"₹11,400", badge:"🥉", streak:6 },
  { rank:4,  name:"Arjun Nair",    city:"Kochi",     referrals:31, earned:"₹9,300",  badge:"",  streak:4 },
  { rank:5,  name:"Sneha Gupta",   city:"Pune",      referrals:28, earned:"₹8,400",  badge:"",  streak:7 },
  { rank:6,  name:"Neha Joshi",    city:"Hyderabad", referrals:28, earned:"₹8,400",  badge:"",  streak:3 },
  { rank:7,  name:"Vikram Singh",  city:"Jaipur",    referrals:21, earned:"₹6,300",  badge:"",  streak:2 },
  { rank:8,  name:"Anjali Sharma", city:"Chennai",   referrals:18, earned:"₹5,400",  badge:"",  streak:5 },
  { rank:9,  name:"Amit Das",      city:"Kolkata",   referrals:14, earned:"₹4,200",  badge:"",  streak:1 },
  { rank:10, name:"Mohan Verma",   city:"Lucknow",   referrals:9,  earned:"₹2,700",  badge:"",  streak:2 },
];

export default function AdminReferralLeaderboard() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [period, setPeriod] = useState<"monthly"|"alltime">("monthly");

  const top3 = leaders.slice(0,3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Referral Leaderboard</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Gamified referral rankings — reward top referrers and drive viral growth.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Referrers", value:"284", color:"#60a5fa", icon:UserPlus },
          { label:"Total Referrals MTD", value:"732", color:"#a78bfa", icon:Star },
          { label:"Rewards Paid MTD", value:"₹2.19L", color:"#4ade80", icon:IndianRupee },
          { label:"Top Referrer", value:"Sita Rao", color:"#fbbf24", icon:Trophy },
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

      <div className="rounded-2xl border p-6" style={{ background:T.card, borderColor:T.border }}>
        <h3 className="font-bold mb-6 text-center" style={{ color:T.text }}>🏆 Top 3 Referrers This Month</h3>
        <div className="flex items-end justify-center gap-4">
          {[top3[1], top3[0], top3[2]].map((l, idx) => {
            const height = idx===1 ? 120 : idx===0 ? 90 : 70;
            const color = idx===1 ? "#fbbf24" : idx===0 ? "#94a3b8" : "#f97316";
            return (
              <div key={l.rank} className="flex flex-col items-center gap-2">
                <p className="text-2xl">{l.badge}</p>
                <p className="font-bold text-sm text-center" style={{ color:T.text }}>{l.name}</p>
                <p className="text-xs" style={{ color:T.sub }}>{l.referrals} referrals</p>
                <div className="w-20 rounded-t-xl flex items-end justify-center pb-2" style={{ height, background:`${color}30`, border:`2px solid ${color}50` }}>
                  <span className="font-bold text-lg" style={{ color }}>{l.rank===1?"🥇":l.rank===2?"🥈":"🥉"}</span>
                </div>
                <p className="text-xs font-bold" style={{ color:"#4ade80" }}>{l.earned}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        {(["monthly","alltime"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className="px-4 py-2 rounded-xl text-sm font-bold capitalize border transition-all"
            style={{ background:period===p?A1:"transparent", color:period===p?"#fff":T.sub, borderColor:period===p?A1:T.border }}>
            {p==="monthly"?"This Month":"All Time"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor:T.border }}>
              {["Rank","Referrer","City","Referrals","Earned","Streak"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaders.map(l => (
              <tr key={l.rank} className="border-b" style={{ borderColor:T.border, background:l.rank<=3?`${A1}06`:"transparent" }}>
                <td className="px-4 py-3">
                  <span className="font-bold text-sm" style={{ color:l.rank===1?"#fbbf24":l.rank===2?"#94a3b8":l.rank===3?"#f97316":T.sub }}>
                    {l.badge||`#${l.rank}`}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold" style={{ color:T.text }}>{l.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{l.city}</td>
                <td className="px-4 py-3 font-bold" style={{ color:A1 }}>{l.referrals}</td>
                <td className="px-4 py-3 font-bold" style={{ color:"#4ade80" }}>{l.earned}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold" style={{ color:"#f97316" }}>🔥 {l.streak} day{l.streak!==1?"s":""}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
