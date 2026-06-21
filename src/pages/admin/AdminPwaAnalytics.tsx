import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Smartphone, Monitor, Wifi, Download, TrendingUp, Users } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const installData = [
  { platform:"Android Chrome", installs:8420, active:6840, offline:1240, color:"#4ade80" },
  { platform:"iOS Safari (Add to Home)", installs:2140, active:1840, offline:320, color:"#60a5fa" },
  { platform:"Desktop Chrome", installs:1820, active:1440, offline:180, color:"#a78bfa" },
  { platform:"Desktop Edge", installs:480, active:380, offline:40, color:"#fbbf24" },
];

const weeklyInstalls = [42, 68, 54, 81, 74, 92, 88];

export default function AdminPwaAnalytics() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const totalInstalls = installData.reduce((s,d)=>s+d.installs,0);
  const totalActive = installData.reduce((s,d)=>s+d.active,0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>PWA Analytics</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Track Progressive Web App installs, usage, offline sessions, and service worker health across all platforms.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total PWA Installs", value:totalInstalls.toLocaleString(), color:"#60a5fa", icon:Download },
          { label:"Active PWA Users", value:totalActive.toLocaleString(), color:"#4ade80", icon:Users },
          { label:"Offline Sessions MTD", value:"1,780", color:"#fbbf24", icon:Wifi },
          { label:"Install Rate", value:"8.4%", color:"#a78bfa", icon:TrendingUp },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold mb-4" style={{ color:T.text }}>Weekly Installs</h3>
          <div className="flex items-end gap-2 h-28">
            {weeklyInstalls.map((v,i)=>(
              <div key={i} className="flex-1 rounded-t-xl" style={{ height:`${(v/92)*100}%`, background:`${A1}80` }} />
            ))}
          </div>
          <div className="flex mt-2">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
              <span key={d} className="flex-1 text-center text-[10px]" style={{ color:T.sub }}>{d}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-5 space-y-4" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold" style={{ color:T.text }}>Installs by Platform</h3>
          {installData.map(d=>(
            <div key={d.platform}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold" style={{ color:T.text }}>{d.platform}</span>
                <span style={{ color:d.color }}>{d.installs.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background:`${d.color}15` }}>
                <div className="h-2 rounded-full" style={{ width:`${(d.installs/totalInstalls)*100}%`, background:d.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
        <div className="px-4 py-3 border-b font-bold text-sm" style={{ color:T.text, borderColor:T.border }}>Service Worker Status</div>
        <div className="grid grid-cols-3 divide-x" style={{ borderColor:T.border }}>
          {[
            { label:"Service Worker Active", value:"99.2%", color:"#4ade80" },
            { label:"Cache Hit Rate", value:"84.1%", color:"#60a5fa" },
            { label:"Offline Capable Pages", value:"12", color:"#a78bfa" },
          ].map(s=>(
            <div key={s.label} className="p-5 text-center" style={{ borderColor:T.border }}>
              <p className="text-2xl font-bold mb-1" style={{ color:s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color:T.sub }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
