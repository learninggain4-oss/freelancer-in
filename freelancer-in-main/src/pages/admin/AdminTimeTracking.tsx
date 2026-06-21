import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Clock, Users, TrendingUp, BarChart3 } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const logs = [
  { freelancer:"Priya Mehta",   project:"E-commerce Redesign",   hours:6.5,  date:"Today",      status:"Active" },
  { freelancer:"Arjun Nair",    project:"Hospital System",        hours:8.0,  date:"Today",      status:"Active" },
  { freelancer:"Sneha Gupta",   project:"Brand Identity",         hours:4.25, date:"Today",      status:"Completed" },
  { freelancer:"Rahul Das",     project:"Flutter Food App",       hours:7.5,  date:"Yesterday",  status:"Completed" },
  { freelancer:"Vikram Singh",  project:"SEO Content",            hours:3.0,  date:"Yesterday",  status:"Completed" },
  { freelancer:"Neha Joshi",    project:"YouTube Reel Edit",      hours:5.5,  date:"2 days ago", status:"Completed" },
  { freelancer:"Amit Kumar",    project:"Django REST API",        hours:9.0,  date:"2 days ago", status:"Completed" },
];

const weeklyHours = [42, 58, 71, 65, 80, 55, 34];

export default function AdminTimeTracking() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"logs"|"summary">("logs");
  const maxH = Math.max(...weeklyHours);

  const totalHours = logs.reduce((s,l)=>s+l.hours,0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Time Tracking Monitor</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Monitor freelancer time logs across all active and completed projects on the platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Hours Logged", value:`${totalHours.toFixed(1)}h`, color:"#60a5fa", icon:Clock },
          { label:"Active Freelancers", value:"2", color:"#4ade80", icon:Users },
          { label:"Avg Hours/Day", value:"6.2h", color:"#a78bfa", icon:TrendingUp },
          { label:"Projects Tracked", value:"7", color:"#fbbf24", icon:BarChart3 },
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

      <div className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
        <h3 className="font-bold mb-4" style={{ color:T.text }}>Platform-wide Hours This Week</h3>
        <div className="flex items-end gap-2 h-24">
          {weeklyHours.map((h,i) => (
            <div key={i} className="flex-1 rounded-t-lg flex items-end justify-center pb-1"
              style={{ height:`${(h/maxH)*100}%`, background:`${A1}80` }}>
              <span className="text-[9px] font-bold text-white">{h}h</span>
            </div>
          ))}
        </div>
        <div className="flex mt-2">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <span key={d} className="flex-1 text-center text-[10px]" style={{ color:T.sub }}>{d}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor:T.border }}>
        {(["logs","summary"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="logs"?"Time Logs":"Project Summary"}
          </button>
        ))}
      </div>

      {tab==="logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor:T.border }}>
                {["Freelancer","Project","Hours","Date","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((l,i) => (
                <tr key={i} className="border-b" style={{ borderColor:T.border }}>
                  <td className="px-4 py-3 font-bold" style={{ color:T.text }}>{l.freelancer}</td>
                  <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{l.project}</td>
                  <td className="px-4 py-3 font-bold font-mono" style={{ color:A1 }}>{l.hours}h</td>
                  <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{l.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:l.status==="Active"?"rgba(74,222,128,.12)":"rgba(96,165,250,.12)", color:l.status==="Active"?"#4ade80":"#60a5fa" }}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="summary" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>Top Freelancers by Hours</h3>
            {logs.sort((a,b)=>b.hours-a.hours).slice(0,5).map((l,i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
                <span className="text-sm" style={{ color:T.text }}>{l.freelancer}</span>
                <span className="font-bold font-mono text-sm" style={{ color:A1 }}>{l.hours}h</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>Overtime Alerts</h3>
            {logs.filter(l=>l.hours>=8).map((l,i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:"rgba(248,113,113,.2)" }}>
                <span className="text-sm" style={{ color:T.text }}>{l.freelancer}</span>
                <span className="font-bold font-mono text-sm" style={{ color:"#f87171" }}>{l.hours}h ⚠</span>
              </div>
            ))}
            {logs.filter(l=>l.hours>=8).length===0 && (
              <p className="text-sm text-center py-4" style={{ color:T.sub }}>No overtime alerts</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
