import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { MessageCircle, Eye, Users, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const chats = [
  { id:"CH001", user:"Rahul Mehta", type:"Freelancer", topic:"Payment not received", agent:"Priya (Support)", status:"Active", waiting:"2m", messages:8, priority:"High" },
  { id:"CH002", user:"Sunita Gupta", type:"Client", topic:"How to post a job?", agent:"Bot", status:"Bot", waiting:"0m", messages:4, priority:"Low" },
  { id:"CH003", user:"Arjun Verma", type:"Freelancer", topic:"KYC rejection reason", agent:"Ravi (Support)", status:"Active", waiting:"5m", messages:12, priority:"Medium" },
  { id:"CH004", user:"Meera Pillai", type:"Freelancer", topic:"Bid limit exceeded", agent:"Unassigned", status:"Waiting", waiting:"12m", messages:2, priority:"Medium" },
  { id:"CH005", user:"Kiran Nair", type:"Client", topic:"Dispute with freelancer", agent:"Unassigned", status:"Waiting", waiting:"18m", messages:6, priority:"High" },
  { id:"CH006", user:"Deepa Sharma", type:"Freelancer", topic:"Invoice download", agent:"Bot", status:"Resolved", waiting:"0m", messages:3, priority:"Low" },
];

export default function AdminLiveChatMonitor() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [selected, setSelected] = useState<string|null>(null);
  const active = chats.filter(c=>c.status==="Active").length;
  const waiting = chats.filter(c=>c.status==="Waiting").length;

  const priorityColor = (p:string) => p==="High"?"#f87171":p==="Medium"?"#fbbf24":"#4ade80";
  const statusColor = (s:string) => s==="Active"?"#4ade80":s==="Waiting"?"#f87171":s==="Bot"?"#60a5fa":"#94a3b8";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Live Chat Monitor</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Admin view of all ongoing support chats. Monitor agent performance, escalate, and intervene in real-time.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Active Chats", value:active, color:"#4ade80", icon:MessageCircle },
          { label:"Waiting", value:waiting, color:"#f87171", icon:Clock },
          { label:"Total Today", value:chats.length, color:"#60a5fa", icon:Eye },
          { label:"Agents Online", value:"3", color:"#a78bfa", icon:Users },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor:T.border }}>
          <span className="font-bold text-sm" style={{ color:T.text }}>All Chats</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color:T.sub }}>Live</span>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor:T.border }}>
          {chats.map(c=>(
            <div key={c.id} onClick={()=>setSelected(selected===c.id?null:c.id)} className="px-4 py-4 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm" style={{ color:T.text }}>{c.user}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:`${A1}12`, color:A1 }}>{c.type}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:`${priorityColor(c.priority)}12`, color:priorityColor(c.priority) }}>{c.priority}</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color:T.sub }}>{c.topic}</p>
                  <p className="text-xs" style={{ color:T.sub }}>Agent: {c.agent} · {c.messages} messages</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full block mb-1" style={{ background:`${statusColor(c.status)}12`, color:statusColor(c.status) }}>{c.status}</span>
                  {c.waiting!=="0m" && <p className="text-xs" style={{ color:c.status==="Waiting"?"#f87171":T.sub }}>Wait: {c.waiting}</p>}
                </div>
              </div>
              {selected===c.id && (
                <div className="mt-3 pt-3 border-t flex gap-2" style={{ borderColor:T.border }}>
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:A1, color:"#fff" }}><Eye className="h-3.5 w-3.5 inline mr-1" />Watch Chat</button>
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>Assign Agent</button>
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}><AlertCircle className="h-3.5 w-3.5 inline mr-1" />Escalate</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
