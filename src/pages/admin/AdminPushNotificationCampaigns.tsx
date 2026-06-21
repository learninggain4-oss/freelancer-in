import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Bell, Plus, Send, Eye, Smartphone, TrendingUp } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const pushCampaigns = [
  { id:"P001", title:"New job posted in your skill area", segment:"Freelancers", sent:18400, clicked:3210, status:"Sent", sentAt:"Today 10 AM" },
  { id:"P002", title:"Your bid was accepted! 🎉", segment:"Bid Winners", sent:840, clicked:718, status:"Sent", sentAt:"Today 9 AM" },
  { id:"P003", title:"Complete your KYC to withdraw", segment:"Unverified", sent:4200, clicked:1890, status:"Sent", sentAt:"Yesterday" },
  { id:"P004", title:"Weekend Promo — 0% Commission", segment:"All Users", sent:0, clicked:0, status:"Scheduled", sentAt:"Sat 9 AM" },
  { id:"P005", title:"Payment of ₹12,000 received", segment:"Triggered", sent:980, clicked:910, status:"Active", sentAt:"Ongoing" },
];

export default function AdminPushNotificationCampaigns() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("All Users");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Push Notification Campaigns</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Send web and mobile push notifications via OneSignal. Target by segment, schedule, or trigger.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor:T.border }}>
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs font-bold" style={{ color:T.sub }}>OneSignal Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Subscribers", value:"38,200", color:"#60a5fa", icon:Smartphone },
          { label:"Sent MTD", value:"24,420", color:"#4ade80", icon:Send },
          { label:"Avg CTR", value:"18.4%", color:"#a78bfa", icon:TrendingUp },
          { label:"Active Campaigns", value:"2", color:"#fbbf24", icon:Bell },
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
          <h3 className="font-bold mb-4" style={{ color:T.text }}>Quick Send Notification</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notification title..." className="w-full px-3 py-2 rounded-xl text-sm border" style={{ background:T.input, borderColor:T.border, color:T.text }} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Message</label>
              <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="Notification message..." className="w-full px-3 py-2 rounded-xl text-sm border resize-none" style={{ background:T.input, borderColor:T.border, color:T.text }} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Segment</label>
              <select value={segment} onChange={e=>setSegment(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border" style={{ background:T.input, borderColor:T.border, color:T.text }}>
                {["All Users","Freelancers","Clients","Unverified","Premium","Inactive 30d"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <button className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2" style={{ background:A1, color:"#fff" }}>
              <Send className="h-4 w-4" /> Send Now
            </button>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <div className="px-4 py-3 border-b font-bold text-sm" style={{ color:T.text, borderColor:T.border }}>Recent Campaigns</div>
          <div className="divide-y" style={{ borderColor:T.border }}>
            {pushCampaigns.map(p=>(
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold mb-0.5" style={{ color:T.text }}>{p.title}</p>
                    <p className="text-xs" style={{ color:T.sub }}>{p.segment} · {p.sentAt}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background:p.status==="Sent"?"rgba(74,222,128,.12)":p.status==="Active"?"rgba(99,102,241,.12)":"rgba(251,191,36,.12)", color:p.status==="Sent"?"#4ade80":p.status==="Active"?A1:"#fbbf24" }}>{p.status}</span>
                </div>
                {p.sent>0 && (
                  <div className="flex gap-4 mt-1.5 text-xs" style={{ color:T.sub }}>
                    <span>Sent: {p.sent.toLocaleString()}</span>
                    <span className="font-bold" style={{ color:"#4ade80" }}>CTR: {Math.round(p.clicked/p.sent*100)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
