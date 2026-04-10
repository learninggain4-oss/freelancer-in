import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Mail, Plus, Send, Eye, TrendingUp, Users, BarChart3, Clock } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const campaigns = [
  { id:"C001", name:"Welcome Series — New Freelancers", type:"Drip", sent:4820, opened:2410, clicked:892, status:"Active", lastSent:"Today 9 AM" },
  { id:"C002", name:"Weekly Job Digest", type:"Newsletter", sent:28400, opened:9940, clicked:3210, status:"Active", lastSent:"Mon 8 AM" },
  { id:"C003", name:"KYC Incomplete Reminder", type:"Triggered", sent:1240, opened:810, clicked:420, status:"Active", lastSent:"Ongoing" },
  { id:"C004", name:"Re-engagement — 30 Day Inactive", type:"Triggered", sent:3800, opened:1140, clicked:310, status:"Paused", lastSent:"Mar 28" },
  { id:"C005", name:"Premium Upgrade Promo", type:"Blast", sent:18000, opened:5400, clicked:1080, status:"Completed", lastSent:"Mar 15" },
];

type Tab = "campaigns"|"templates"|"analytics";

export default function AdminEmailCampaignManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<Tab>("campaigns");
  const totalSent = campaigns.reduce((s,c)=>s+c.sent,0);
  const totalOpened = campaigns.reduce((s,c)=>s+c.opened,0);
  const avgOpen = Math.round(totalOpened/totalSent*100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Email Campaign Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Create, schedule and monitor bulk email campaigns, drip sequences, and transactional mailers.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Sent MTD", value:totalSent.toLocaleString(), color:"#60a5fa", icon:Send },
          { label:"Avg Open Rate", value:`${avgOpen}%`, color:"#4ade80", icon:Eye },
          { label:"Active Campaigns", value:campaigns.filter(c=>c.status==="Active").length, color:"#a78bfa", icon:Mail },
          { label:"Subscribers", value:"42,800", color:"#fbbf24", icon:Users },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor:T.border }}>
        {(["campaigns","templates","analytics"] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="campaigns"?"All Campaigns":t==="templates"?"Email Templates":"Analytics"}
          </button>
        ))}
      </div>

      {tab==="campaigns" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor:T.border }}>
              {["Campaign","Type","Sent","Open Rate","Click Rate","Status","Last Sent"].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {campaigns.map(c=>(
                <tr key={c.id} className="border-b" style={{ borderColor:T.border }}>
                  <td className="px-4 py-3 font-bold" style={{ color:T.text }}>{c.name}</td>
                  <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}12`, color:A1 }}>{c.type}</span></td>
                  <td className="px-4 py-3 font-mono" style={{ color:T.sub }}>{c.sent.toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold" style={{ color:"#4ade80" }}>{Math.round(c.opened/c.sent*100)}%</td>
                  <td className="px-4 py-3 font-bold" style={{ color:"#60a5fa" }}>{Math.round(c.clicked/c.sent*100)}%</td>
                  <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:c.status==="Active"?"rgba(74,222,128,.12)":c.status==="Paused"?"rgba(251,191,36,.12)":"rgba(148,163,184,.12)", color:c.status==="Active"?"#4ade80":c.status==="Paused"?"#fbbf24":"#94a3b8" }}>{c.status}</span></td>
                  <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{c.lastSent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="templates" && (
        <div className="grid lg:grid-cols-3 gap-4">
          {["Welcome Email","KYC Reminder","Job Alert","Payment Received","Bid Won","Review Request"].map(t=>(
            <div key={t} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="h-24 rounded-xl mb-3 flex items-center justify-center" style={{ background:`${A1}08`, border:`1px dashed ${A1}30` }}>
                <Mail className="h-8 w-8" style={{ color:`${A1}60` }} />
              </div>
              <p className="font-bold text-sm mb-2" style={{ color:T.text }}>{t}</p>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>Edit</button>
                <button className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{ background:A1, color:"#fff" }}>Use</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="analytics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold mb-4" style={{ color:T.text }}>Open Rate by Day</h3>
            <div className="flex items-end gap-2 h-28">
              {[28,34,22,41,38,29,45].map((v,i)=>(
                <div key={i} className="flex-1 rounded-t-lg" style={{ height:`${(v/45)*100}%`, background:`${A1}80` }} />
              ))}
            </div>
            <div className="flex mt-2">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
              <span key={d} className="flex-1 text-center text-[10px]" style={{ color:T.sub }}>{d}</span>
            ))}</div>
          </div>
          <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>Top Performing Campaigns</h3>
            {campaigns.sort((a,b)=>b.opened/b.sent - a.opened/a.sent).slice(0,4).map(c=>(
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
                <span className="text-xs" style={{ color:T.text }}>{c.name}</span>
                <span className="font-bold text-sm" style={{ color:"#4ade80" }}>{Math.round(c.opened/c.sent*100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
