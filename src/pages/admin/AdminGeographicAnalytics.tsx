import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Globe, MapPin, Users, TrendingUp } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const stateData = [
  { state:"Maharashtra", freelancers:3820, employers:1240, revenue:"₹12.4L", growth:"+22%", topSkill:"Web Dev" },
  { state:"Karnataka",   freelancers:3210, employers:980,  revenue:"₹10.1L", growth:"+31%", topSkill:"Mobile Apps" },
  { state:"Delhi NCR",   freelancers:2890, employers:1100, revenue:"₹9.8L",  growth:"+18%", topSkill:"Design" },
  { state:"Tamil Nadu",  freelancers:2140, employers:740,  revenue:"₹7.2L",  growth:"+26%", topSkill:"Web Dev" },
  { state:"Telangana",   freelancers:1980, employers:660,  revenue:"₹6.5L",  growth:"+29%", topSkill:"Data Sci" },
  { state:"West Bengal", freelancers:1540, employers:490,  revenue:"₹4.8L",  growth:"+14%", topSkill:"Content" },
  { state:"Gujarat",     freelancers:1320, employers:420,  revenue:"₹4.2L",  growth:"+19%", topSkill:"Web Dev" },
  { state:"Rajasthan",   freelancers:980,  employers:310,  revenue:"₹2.9L",  growth:"+12%", topSkill:"Design" },
  { state:"Punjab",      freelancers:840,  employers:280,  revenue:"₹2.4L",  growth:"+16%", topSkill:"Content" },
  { state:"Kerala",      freelancers:720,  employers:240,  revenue:"₹2.1L",  growth:"+21%", topSkill:"Mobile Apps" },
];

const cityData = [
  { city:"Mumbai",    users:2840, pct:18 },
  { city:"Bangalore", users:2410, pct:15 },
  { city:"Delhi",     users:2100, pct:13 },
  { city:"Hyderabad", users:1840, pct:12 },
  { city:"Pune",      users:1380, pct:9  },
  { city:"Chennai",   users:1190, pct:8  },
  { city:"Kolkata",   users:980,  pct:6  },
  { city:"Others",    users:3050, pct:19 },
];

export default function AdminGeographicAnalytics() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [view, setView] = useState<"state"|"city">("state");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Geographic Analytics</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>State and city-wise breakdown of users, revenue, and growth across India.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"States Active", value:"28", color:"#a78bfa", icon:Globe },
          { label:"Top State", value:"Maharashtra", color:"#4ade80", icon:MapPin },
          { label:"Total Users", value:"19,800+", color:"#60a5fa", icon:Users },
          { label:"Fastest Growing", value:"Karnataka +31%", color:"#fbbf24", icon:TrendingUp },
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
        {(["state","city"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className="px-4 py-2 rounded-xl text-sm font-bold capitalize border transition-all"
            style={{ background:view===v?A1:"transparent", color:view===v?"#fff":T.sub, borderColor:view===v?A1:T.border }}>
            {v==="state"?"State View":"City View"}
          </button>
        ))}
      </div>

      {view==="state" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor:T.border }}>
                  {["State","Freelancers","Employers","Revenue","Growth","Top Skill"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stateData.map((s,i) => (
                  <tr key={i} className="border-b hover:opacity-80 transition-opacity" style={{ borderColor:T.border }}>
                    <td className="px-4 py-3 font-bold" style={{ color:T.text }}>{s.state}</td>
                    <td className="px-4 py-3" style={{ color:T.sub }}>{s.freelancers.toLocaleString()}</td>
                    <td className="px-4 py-3" style={{ color:T.sub }}>{s.employers.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold" style={{ color:"#4ade80" }}>{s.revenue}</td>
                    <td className="px-4 py-3 font-bold" style={{ color:"#60a5fa" }}>{s.growth}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}15`, color:A1 }}>{s.topSkill}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view==="city" && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold mb-2" style={{ color:T.text }}>Top Cities by User Count</h3>
          {cityData.map(c => (
            <div key={c.city}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color:T.text }}>{c.city}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color:T.sub }}>{c.users.toLocaleString()} users</span>
                  <span className="text-xs font-bold" style={{ color:A1 }}>{c.pct}%</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full" style={{ background:`${A1}12` }}>
                <div className="h-2.5 rounded-full" style={{ width:`${c.pct*5}%`, background:A1 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
