import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Layers, ChevronUp, Users, Settings, TrendingUp, Award } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const tiers = [
  { name:"Starter", color:"#94a3b8", emoji:"🌱", users:28400, criteria:{ projects:"0+", rating:"Any", earnings:"₹0+" }, benefits:["20 bids/month","Basic profile listing","Standard support"] },
  { name:"Bronze", color:"#f97316", emoji:"🥉", users:8400, criteria:{ projects:"5+", rating:"4.0+", earnings:"₹10,000+" }, benefits:["40 bids/month","Profile badge","Priority listing"] },
  { name:"Silver", color:"#94a3b8", emoji:"🥈", users:3200, criteria:{ projects:"15+", rating:"4.5+", earnings:"₹50,000+" }, benefits:["60 bids/month","Silver badge","Email support SLA 24h","Featured in search"] },
  { name:"Gold", color:"#fbbf24", emoji:"🥇", users:840, criteria:{ projects:"30+", rating:"4.7+", earnings:"₹1,00,000+" }, benefits:["Unlimited bids","Gold badge","Priority support 12h","Homepage feature once/month"] },
  { name:"Platinum", color:"#e879f9", emoji:"💎", users:124, criteria:{ projects:"60+", rating:"4.9+", earnings:"₹5,00,000+" }, benefits:["Unlimited bids","Platinum badge","Dedicated account manager","First access to premium clients","Top search placement"] },
];

export default function AdminLevelTierUpgradeRules() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [selected, setSelected] = useState<string|null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Level & Tier Upgrade Rules</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Define the criteria, benefits, and automated upgrade rules for each freelancer tier on the platform.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor:T.border, color:T.sub }}>
          <Settings className="h-4 w-4" /> Upgrade Settings
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Tiered Users", value:tiers.reduce((s,t)=>s+t.users,0).toLocaleString(), color:"#60a5fa", icon:Users },
          { label:"Tier Levels", value:tiers.length, color:"#a78bfa", icon:Layers },
          { label:"Upgrades This Month", value:"342", color:"#4ade80", icon:ChevronUp },
          { label:"Platinum Members", value:tiers[4].users, color:"#e879f9", icon:Award },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative overflow-x-auto">
        <div className="flex items-end gap-4 pb-4" style={{ minWidth:"600px" }}>
          {tiers.map((t,i)=>{
            const maxUsers = Math.max(...tiers.map(x=>x.users));
            const pct = Math.round(t.users/maxUsers*100);
            return (
              <div key={t.name} className="flex-1 text-center">
                <p className="text-xs mb-1 font-bold" style={{ color:T.sub }}>{t.users.toLocaleString()}</p>
                <div className="rounded-t-xl mx-auto w-full" style={{ height:`${pct*1.2}px`, background:`${t.color}40`, border:`1px solid ${t.color}60`, transition:"height .4s" }} />
                <div className="mt-2">
                  <span className="text-xl">{t.emoji}</span>
                  <p className="text-xs font-bold mt-1" style={{ color:t.color }}>{t.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {tiers.map(t=>(
          <div key={t.name} onClick={()=>setSelected(selected===t.name?null:t.name)} className="rounded-2xl border p-5 cursor-pointer transition-all" style={{ background:T.card, borderColor:selected===t.name?t.color:T.border }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <span className="font-bold" style={{ color:t.color }}>{t.name} Tier</span>
                  <p className="text-xs" style={{ color:T.sub }}>{t.users.toLocaleString()} users</p>
                </div>
              </div>
              <ChevronUp className={`h-4 w-4 transition-transform ${selected===t.name?"":"rotate-180"}`} style={{ color:T.sub }} />
            </div>
            {selected===t.name && (
              <div className="space-y-3 pt-3 border-t" style={{ borderColor:T.border }}>
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color:T.sub }}>Upgrade Criteria</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(t.criteria).map(([k,v])=>(
                      <div key={k} className="p-2 rounded-xl text-center border" style={{ borderColor:T.border }}>
                        <p className="text-[10px] capitalize" style={{ color:T.sub }}>{k}</p>
                        <p className="font-bold text-xs" style={{ color:T.text }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color:T.sub }}>Benefits</p>
                  <ul className="space-y-1">
                    {t.benefits.map((b,i)=>(
                      <li key={i} className="flex items-center gap-2 text-xs" style={{ color:T.text }}>
                        <span style={{ color:t.color }}>✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <button className="w-full py-2 rounded-xl text-xs font-bold" style={{ background:`${t.color}15`, color:t.color }}>Edit This Tier</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
