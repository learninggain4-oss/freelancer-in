import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Smartphone, Plus, AlertCircle, CheckCircle2, Download, Settings } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const versions = [
  { version:"2.4.1", platform:"Android", status:"Current", users:"18,420", forceUpdate:false, releaseDate:"Apr 5, 2026", notes:"Bug fixes: bid submission crash, UPI timeout" },
  { version:"2.4.0", platform:"Android", status:"Supported", users:"6,840", forceUpdate:false, releaseDate:"Mar 20, 2026", notes:"Feature: Push notifications, Leaderboard" },
  { version:"2.3.5", platform:"Android", status:"Deprecated", users:"2,410", forceUpdate:true, releaseDate:"Feb 10, 2026", notes:"Security patch required" },
  { version:"2.2.0", platform:"Android", status:"Blocked", users:"184", forceUpdate:true, releaseDate:"Jan 5, 2026", notes:"Critical: Data leak vulnerability" },
  { version:"2.4.1", platform:"iOS", status:"Current", users:"9,210", forceUpdate:false, releaseDate:"Apr 5, 2026", notes:"Same as Android 2.4.1" },
  { version:"2.4.0", platform:"iOS", status:"Supported", users:"3,420", forceUpdate:false, releaseDate:"Mar 22, 2026", notes:"Feature parity with Android" },
  { version:"2.3.5", platform:"iOS", status:"Deprecated", users:"840", forceUpdate:true, releaseDate:"Feb 12, 2026", notes:"Security patch required" },
];

export default function AdminAppVersionManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [platform, setPlatform] = useState<"All"|"Android"|"iOS">("All");
  const filtered = platform==="All" ? versions : versions.filter(v=>v.platform===platform);

  const statusColor = (s:string) => s==="Current"?"#4ade80":s==="Supported"?"#60a5fa":s==="Deprecated"?"#fbbf24":"#f87171";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>App Version Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Manage Android and iOS app versions, configure force-update rules, and block vulnerable versions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> Add Version
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total App Users", value:"40,328", color:"#60a5fa", icon:Smartphone },
          { label:"On Latest Version", value:"72.1%", color:"#4ade80", icon:CheckCircle2 },
          { label:"Force Update Active", value:versions.filter(v=>v.forceUpdate).length, color:"#f87171", icon:AlertCircle },
          { label:"Blocked Versions", value:versions.filter(v=>v.status==="Blocked").length, color:"#fbbf24", icon:Settings },
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
        {(["All","Android","iOS"] as const).map(p=>(
          <button key={p} onClick={()=>setPlatform(p)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:platform===p?A1:"transparent", color:platform===p?"#fff":T.sub, borderColor:platform===p?A1:T.border }}>{p}</button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
        <table className="w-full text-sm">
          <thead><tr className="border-b" style={{ borderColor:T.border }}>
            {["Version","Platform","Status","Users","Force Update","Released","Release Notes","Action"].map(h=>(
              <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((v,i)=>(
              <tr key={i} className="border-b" style={{ borderColor:T.border }}>
                <td className="px-4 py-3 font-mono font-bold" style={{ color:T.text }}>v{v.version}</td>
                <td className="px-4 py-3"><span className="text-xs font-bold" style={{ color:T.sub }}>{v.platform}</span></td>
                <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor(v.status)}15`, color:statusColor(v.status) }}>{v.status}</span></td>
                <td className="px-4 py-3 font-bold text-xs" style={{ color:T.text }}>{v.users}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold" style={{ color:v.forceUpdate?"#f87171":"#4ade80" }}>{v.forceUpdate?"YES":"No"}</span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{v.releaseDate}</td>
                <td className="px-4 py-3 text-xs max-w-[200px] truncate" style={{ color:T.sub }}>{v.notes}</td>
                <td className="px-4 py-3">
                  <button className="text-xs font-bold px-2 py-1 rounded-lg border" style={{ borderColor:T.border, color:T.sub }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
