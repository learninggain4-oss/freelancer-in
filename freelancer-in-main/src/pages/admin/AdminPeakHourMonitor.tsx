import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Activity, Clock, Users, Zap } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const hourlyData = [
  12,8,5,4,3,4,8,22,38,54,68,75,
  80,72,65,58,70,84,90,88,74,56,38,20
];

const dayData = [
  { day:"Mon", peak:"11 PM", traffic:78, bids:320, messages:1240 },
  { day:"Tue", peak:"10 PM", traffic:82, bids:344, messages:1380 },
  { day:"Wed", peak:"9 PM",  traffic:75, bids:298, messages:1120 },
  { day:"Thu", peak:"11 PM", traffic:88, bids:412, messages:1560 },
  { day:"Fri", peak:"8 PM",  traffic:94, bids:480, messages:1820 },
  { day:"Sat", peak:"7 PM",  traffic:70, bids:280, messages:980 },
  { day:"Sun", peak:"6 PM",  traffic:58, bids:210, messages:720 },
];

export default function AdminPeakHourMonitor() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [view, setView] = useState<"hourly"|"daily">("hourly");
  const maxH = Math.max(...hourlyData);

  const currentHour = new Date().getHours();
  const currentTraffic = hourlyData[currentHour];
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Peak Hour Monitor</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Analyse traffic patterns, peak usage times, and plan infrastructure scaling accordingly.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Current Traffic", value:`${currentTraffic}%`, color:currentTraffic>70?"#f87171":"#4ade80", icon:Activity },
          { label:"Peak Hour Today", value:`${peakHour}:00`, color:"#fbbf24", icon:Clock },
          { label:"Active Users Now", value:"1,284", color:"#60a5fa", icon:Users },
          { label:"Requests/min", value:"3,420", color:"#a78bfa", icon:Zap },
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
        {(["hourly","daily"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className="px-4 py-2 rounded-xl text-sm font-bold capitalize border transition-all"
            style={{ background:view===v?A1:"transparent", color:view===v?"#fff":T.sub, borderColor:view===v?A1:T.border }}>
            {v==="hourly"?"24-Hour View":"Weekly View"}
          </button>
        ))}
      </div>

      {view==="hourly" && (
        <div className="rounded-2xl border p-6" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold mb-4" style={{ color:T.text }}>Traffic by Hour (Today)</h3>
          <div className="flex items-end gap-1 h-32">
            {hourlyData.map((v,i) => (
              <div key={i} className="flex-1 rounded-t-sm transition-all" title={`${i}:00 — ${v}%`}
                style={{ height:`${(v/maxH)*100}%`, background:i===currentHour?"#f87171":i===peakHour?"#fbbf24":`${A1}80`, minWidth:0, cursor:"pointer" }} />
            ))}
          </div>
          <div className="flex mt-2 overflow-hidden">
            {Array.from({length:24},(_,i)=>(
              <span key={i} className="flex-1 text-center text-[8px]" style={{ color:i===currentHour?"#f87171":T.sub }}>{i}</span>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-3 flex-wrap">
            <div className="flex items-center gap-2"><div className="h-3 w-4 rounded" style={{ background:"#f87171" }} /><span className="text-xs" style={{ color:T.sub }}>Current</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-4 rounded" style={{ background:"#fbbf24" }} /><span className="text-xs" style={{ color:T.sub }}>Peak</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-4 rounded" style={{ background:`${A1}80` }} /><span className="text-xs" style={{ color:T.sub }}>Normal</span></div>
          </div>
        </div>
      )}

      {view==="daily" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor:T.border }}>
                  {["Day","Peak Hour","Traffic %","Bids Placed","Messages"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayData.map((d,i) => (
                  <tr key={i} className="border-b" style={{ borderColor:T.border }}>
                    <td className="px-4 py-3 font-bold" style={{ color:T.text }}>{d.day}</td>
                    <td className="px-4 py-3 font-mono" style={{ color:T.sub }}>{d.peak}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full" style={{ background:`${A1}20` }}>
                          <div className="h-2 rounded-full" style={{ width:`${d.traffic}%`, background:A1 }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color:d.traffic>80?"#f87171":A1 }}>{d.traffic}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color:"#4ade80" }}>{d.bids}</td>
                    <td className="px-4 py-3" style={{ color:T.sub }}>{d.messages.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
        <h3 className="font-bold" style={{ color:T.text }}>Auto-Scaling Recommendations</h3>
        {[
          { time:"Fri 6–11 PM", action:"Scale API servers to 3× capacity", status:"Scheduled" },
          { time:"Daily 9–11 AM", action:"Increase DB connection pool to 200", status:"Active" },
          { time:"Mon–Fri 7–9 AM", action:"Pre-warm CDN cache for job listings", status:"Active" },
        ].map(r => (
          <div key={r.time} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
            <div>
              <p className="font-bold text-sm" style={{ color:T.text }}>{r.time}</p>
              <p className="text-xs" style={{ color:T.sub }}>{r.action}</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
