import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Link, Plus, Copy, TrendingUp, ExternalLink, CheckCircle2 } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const deepLinks = [
  { id:"DL001", name:"Freelancer Profile", path:"/freelancer/:id", shortUrl:"https://freelan.space/f/", clicks:8420, platform:"All", created:"Mar 1", active:true },
  { id:"DL002", name:"Job Posting Detail", path:"/job/:id", shortUrl:"https://freelan.space/j/", clicks:12840, platform:"All", created:"Mar 1", active:true },
  { id:"DL003", name:"Promo Landing — Holi", path:"/promo/holi2026", shortUrl:"https://freelan.space/h26", clicks:3210, platform:"All", created:"Mar 14", active:false },
  { id:"DL004", name:"KYC Flow", path:"/kyc/start", shortUrl:"https://freelan.space/kyc", clicks:1840, platform:"Mobile", created:"Mar 20", active:true },
  { id:"DL005", name:"Refer & Earn", path:"/refer/:code", shortUrl:"https://freelan.space/r/", clicks:6480, platform:"All", created:"Feb 10", active:true },
];

export default function AdminDeepLinkManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [copied, setCopied] = useState<string|null>(null);

  const handleCopy = (url:string, id:string) => {
    navigator.clipboard.writeText(url).catch(()=>{});
    setCopied(id);
    setTimeout(()=>setCopied(null),2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Deep Link Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Create and manage universal deep links and short URLs that work across web, Android, and iOS with click tracking.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> Create Deep Link
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Deep Links", value:deepLinks.length, color:"#60a5fa", icon:Link },
          { label:"Total Clicks MTD", value:deepLinks.reduce((s,d)=>s+d.clicks,0).toLocaleString(), color:"#4ade80", icon:TrendingUp },
          { label:"Active Links", value:deepLinks.filter(d=>d.active).length, color:"#a78bfa", icon:CheckCircle2 },
          { label:"Platforms", value:"3", color:"#fbbf24", icon:ExternalLink },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {deepLinks.map(d=>(
          <div key={d.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <Link className="h-4 w-4" style={{ color:A1 }} />
                  <span className="font-bold" style={{ color:T.text }}>{d.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}12`, color:A1 }}>{d.platform}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:d.active?"rgba(74,222,128,.12)":"rgba(148,163,184,.12)", color:d.active?"#4ade80":"#94a3b8" }}>{d.active?"Active":"Inactive"}</span>
                </div>
                <p className="text-xs mb-2 font-mono" style={{ color:T.sub }}>Path: {d.path}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-1 rounded-lg border" style={{ background:`${A1}06`, borderColor:`${A1}20`, color:A1 }}>{d.shortUrl}</span>
                  <button onClick={()=>handleCopy(d.shortUrl,d.id)} className="p-1.5 rounded-lg border" style={{ borderColor:T.border, color:copied===d.id?"#4ade80":T.sub }}>
                    {copied===d.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color:"#60a5fa" }}>{d.clicks.toLocaleString()}</p>
                <p className="text-xs" style={{ color:T.sub }}>clicks</p>
                <p className="text-xs mt-1" style={{ color:T.sub }}>Created {d.created}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
