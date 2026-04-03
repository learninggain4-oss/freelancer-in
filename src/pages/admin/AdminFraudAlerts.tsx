import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Bell, AlertTriangle, CheckCircle2, Eye, UserCheck, MessageSquare, X, Volume2, VolumeX, Filter } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type Alert = { id:string; message:string; source:string; priority:string; status:string; timestamp:string; user:string; note:string; assignedTo:string };

const INIT_ALERTS: Alert[] = [
  { id:"al1", message:"Critical: User attempting to bypass payment verification",   source:"Payment Monitor",   priority:"critical", status:"new",          timestamp:"Just now",     user:"user_2841", note:"", assignedTo:"" },
  { id:"al2", message:"High: Multiple login from different countries detected",      source:"IP Monitor",        priority:"high",     status:"investigating", timestamp:"3 min ago",    user:"user_5521", note:"", assignedTo:"admin@site.com" },
  { id:"al3", message:"High: Risk score exceeded 90 threshold",                     source:"Risk Engine",       priority:"high",     status:"new",          timestamp:"7 min ago",    user:"user_1204", note:"", assignedTo:"" },
  { id:"al4", message:"Medium: Suspicious messaging pattern detected",               source:"Message Monitor",   priority:"medium",   status:"investigating", timestamp:"15 min ago",   user:"user_8831", note:"Looking into it", assignedTo:"manager@site.com" },
  { id:"al5", message:"Medium: Rapid withdrawal requests (x5 in 10 min)",           source:"Withdrawal Engine", priority:"medium",   status:"resolved",      timestamp:"30 min ago",   user:"user_3391", note:"User verified manually", assignedTo:"admin@site.com" },
  { id:"al6", message:"Low: Failed login attempts x3",                               source:"Auth Monitor",      priority:"low",      status:"ignored",       timestamp:"1 hr ago",     user:"user_7710", note:"", assignedTo:"" },
  { id:"al7", message:"Critical: Duplicate payment of ₹1,20,000 detected",          source:"Payment Monitor",   priority:"critical", status:"new",          timestamp:"1 min ago",    user:"user_4411", note:"", assignedTo:"" },
  { id:"al8", message:"High: Proxy/VPN detected for financial transaction",          source:"IP Monitor",        priority:"high",     status:"new",          timestamp:"5 min ago",    user:"user_9920", note:"", assignedTo:"" },
];

const prioColor = (p: string) => p==="critical"?"#f87171":p==="high"?"#f97316":p==="medium"?"#fbbf24":"#4ade80";
const statusColor = (s: string) => s==="new"?"#60a5fa":s==="investigating"?"#fbbf24":s==="resolved"?"#4ade80":"#94a3b8";

export default function AdminFraudAlerts() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [alerts, setAlerts] = useState(INIT_ALERTS);
  const [filterPrio, setFilterPrio] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sound, setSound] = useState(true);
  const [selected, setSelected] = useState<Alert|null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [assignInput, setAssignInput] = useState("");

  const filtered = alerts.filter(a => {
    const matchPrio = filterPrio==="all"||a.priority===filterPrio;
    const matchStatus = filterStatus==="all"||a.status===filterStatus;
    return matchPrio && matchStatus;
  });

  const updateStatus = (id: string, status: string) => {
    setAlerts(a => a.map(x => x.id===id ? {...x, status} : x));
    if (selected?.id===id) setSelected(s=>s?{...s,status}:null);
  };
  const saveNote = (id: string) => {
    setAlerts(a => a.map(x => x.id===id ? {...x, note:noteInput} : x));
    if (selected?.id===id) setSelected(s=>s?{...s,note:noteInput}:null);
  };
  const assignAlert = (id: string) => {
    setAlerts(a => a.map(x => x.id===id ? {...x, assignedTo:assignInput} : x));
    if (selected?.id===id) setSelected(s=>s?{...s,assignedTo:assignInput}:null);
  };

  const newCount = alerts.filter(a=>a.status==="new").length;
  const critCount = alerts.filter(a=>a.priority==="critical"&&a.status==="new").length;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40`, position:"relative" }}>
              <Bell size={24} color="#fff" />
              {newCount>0 && <span style={{ position:"absolute", top:-4, right:-4, width:18, height:18, borderRadius:"50%", background:"#f87171", color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{newCount}</span>}
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Real-Time Fraud Alerts</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>{critCount} critical · {newCount} new alerts</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setSound(x=>!x)} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, display:"flex", alignItems:"center", gap:6, fontSize:13, cursor:"pointer" }}>
              {sound?<Volume2 size={14}/>:<VolumeX size={14}/>} Sound {sound?"On":"Off"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:4, background:T.card, borderRadius:10, padding:4, border:`1px solid ${T.border}` }}>
            {["all","critical","high","medium","low"].map(p=>(
              <button key={p} onClick={()=>setFilterPrio(p)} style={{ padding:"5px 12px", borderRadius:7, border:"none", background:filterPrio===p?prioColor(p==="all"?A1:p):"transparent", color:filterPrio===p?"#fff":T.sub, fontSize:12, fontWeight:filterPrio===p?700:400, cursor:"pointer", textTransform:"capitalize" }}>{p}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:4, background:T.card, borderRadius:10, padding:4, border:`1px solid ${T.border}` }}>
            {["all","new","investigating","resolved","ignored"].map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:"5px 12px", borderRadius:7, border:"none", background:filterStatus===s?A1:"transparent", color:filterStatus===s?"#fff":T.sub, fontSize:12, fontWeight:filterStatus===s?700:400, cursor:"pointer", textTransform:"capitalize" }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(a => (
            <div key={a.id} style={{ background:T.card, border:`1px solid ${a.status==="new"?prioColor(a.priority)+"44":T.border}`, borderRadius:14, padding:"16px 20px", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:prioColor(a.priority), flexShrink:0, animation:a.status==="new"?"pulse 2s infinite":"none" }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:4 }}>{a.message}</div>
                <div style={{ display:"flex", gap:12, fontSize:12, color:T.sub }}>
                  <span>User: <span style={{ color:A1 }}>{a.user}</span></span>
                  <span>Source: {a.source}</span>
                  <span>{a.timestamp}</span>
                  {a.assignedTo && <span>Assigned: <span style={{ color:"#4ade80" }}>{a.assignedTo}</span></span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ padding:"3px 10px", borderRadius:20, background:`${prioColor(a.priority)}18`, color:prioColor(a.priority), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{a.priority}</span>
                <span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(a.status)}15`, color:statusColor(a.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{a.status}</span>
                <button onClick={()=>{setSelected(a);setNoteInput(a.note);setAssignInput(a.assignedTo);}} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Eye size={13}/> Details</button>
                <button onClick={()=>updateStatus(a.id,"resolved")} disabled={a.status==="resolved"} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid #4ade80`, background:"rgba(74,222,128,.1)", color:"#4ade80", fontSize:12, cursor:a.status==="resolved"?"not-allowed":"pointer", opacity:a.status==="resolved"?0.5:1 }}><CheckCircle2 size={13}/></button>
                <button onClick={()=>updateStatus(a.id,"ignored")} style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.sub, fontSize:12, cursor:"pointer" }}><X size={13}/></button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:T.sub, fontSize:14 }}>No alerts matching filters</div>}
        </div>

        {/* Detail Modal */}
        {selected && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:520 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>Alert Details</h2>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ padding:"12px 16px", borderRadius:10, background:`${prioColor(selected.priority)}12`, border:`1px solid ${prioColor(selected.priority)}30`, marginBottom:20 }}>
                <div style={{ fontSize:14, color:T.text, fontWeight:600 }}>{selected.message}</div>
                <div style={{ fontSize:12, color:T.sub, marginTop:4 }}>{selected.source} · {selected.timestamp}</div>
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                {["new","investigating","resolved","ignored"].map(s=>(
                  <button key={s} onClick={()=>updateStatus(selected.id,s)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${statusColor(s)}`, background:selected.status===s?`${statusColor(s)}20`:"transparent", color:statusColor(s), fontSize:12, cursor:"pointer", fontWeight:selected.status===s?700:400, textTransform:"capitalize" }}>{s}</button>
                ))}
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:T.sub, marginBottom:6 }}>Assign to Admin</div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={assignInput} onChange={e=>setAssignInput(e.target.value)} placeholder="admin@site.com" style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }} />
                  <button onClick={()=>assignAlert(selected.id)} style={{ padding:"8px 14px", borderRadius:8, background:A1, color:"#fff", border:"none", fontSize:13, cursor:"pointer" }}>Assign</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:6 }}>Notes</div>
                <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Add investigation notes…" rows={3} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box" }} />
                <button onClick={()=>saveNote(selected.id)} style={{ marginTop:8, padding:"8px 20px", borderRadius:8, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer" }}>Save Notes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
