import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { MessageSquare, Plus, Send, Phone, TrendingUp, IndianRupee } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const smsCampaigns = [
  { name:"OTP Verification", type:"Transactional", sent:84200, delivered:83910, cost:1684, status:"Active" },
  { name:"Bid Accepted Alert", type:"Transactional", sent:4820, delivered:4801, cost:96, status:"Active" },
  { name:"Promo — 0% Commission Weekend", type:"Promotional", sent:28000, delivered:27440, cost:1372, status:"Completed" },
  { name:"KYC Pending Reminder", type:"Transactional", sent:3200, delivered:3168, cost:64, status:"Active" },
  { name:"Payment Credited Alert", type:"Transactional", sent:9800, delivered:9780, cost:196, status:"Active" },
];

export default function AdminSmsCampaignManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [msg, setMsg] = useState("");
  const [numbers, setNumbers] = useState("");
  const totalCost = smsCampaigns.reduce((s,c)=>s+c.cost,0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>SMS Campaign Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Send transactional and promotional SMS via Twilio / MSG91. DLT registered sender IDs.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"SMS Sent MTD", value:"1,30,020", color:"#60a5fa", icon:MessageSquare },
          { label:"Delivery Rate", value:"99.4%", color:"#4ade80", icon:Phone },
          { label:"MTD Cost", value:`₹${totalCost.toLocaleString()}`, color:"#f87171", icon:IndianRupee },
          { label:"Active Templates", value:"8", color:"#fbbf24", icon:TrendingUp },
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
          <h3 className="font-bold mb-4" style={{ color:T.text }}>Quick SMS Blast</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Message (160 chars)</label>
              <textarea value={msg} onChange={e=>setMsg(e.target.value.slice(0,160))} rows={4} placeholder="Type your SMS message..." className="w-full px-3 py-2 rounded-xl text-sm border resize-none" style={{ background:T.input, borderColor:T.border, color:T.text }} />
              <p className="text-xs text-right mt-1" style={{ color:T.sub }}>{msg.length}/160</p>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Recipients (phone numbers, comma-separated)</label>
              <textarea value={numbers} onChange={e=>setNumbers(e.target.value)} rows={2} placeholder="+919876543210, +918765432109..." className="w-full px-3 py-2 rounded-xl text-sm border resize-none" style={{ background:T.input, borderColor:T.border, color:T.text }} />
            </div>
            <div className="flex gap-2">
              <select className="flex-1 px-3 py-2 rounded-xl text-sm border" style={{ background:T.input, borderColor:T.border, color:T.text }}>
                {["Transactional","Promotional"].map(t=><option key={t}>{t}</option>)}
              </select>
              <button className="px-4 py-2 rounded-xl font-bold flex items-center gap-2" style={{ background:A1, color:"#fff" }}>
                <Send className="h-4 w-4" /> Send
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <div className="px-4 py-3 border-b font-bold text-sm" style={{ color:T.text, borderColor:T.border }}>Campaign Log</div>
          <table className="w-full text-xs">
            <thead><tr className="border-b" style={{ borderColor:T.border }}>
              {["Campaign","Sent","Delivered","Cost","Status"].map(h=><th key={h} className="text-left px-3 py-2 font-bold" style={{ color:T.sub }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {smsCampaigns.map((c,i)=>(
                <tr key={i} className="border-b" style={{ borderColor:T.border }}>
                  <td className="px-3 py-2.5 font-bold" style={{ color:T.text }}>{c.name}</td>
                  <td className="px-3 py-2.5" style={{ color:T.sub }}>{c.sent.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-bold" style={{ color:"#4ade80" }}>{Math.round(c.delivered/c.sent*100)}%</td>
                  <td className="px-3 py-2.5" style={{ color:"#f87171" }}>₹{c.cost}</td>
                  <td className="px-3 py-2.5"><span className="font-bold" style={{ color:c.status==="Active"?"#4ade80":"#94a3b8" }}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
