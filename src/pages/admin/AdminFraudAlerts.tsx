import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Bell, AlertTriangle, CheckCircle2, Eye, X, Volume2, VolumeX, Loader2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type Alert = { id:string; message:string; source:string; priority:string; status:string; timestamp:string; user:string; note:string; assignedTo:string };

const prioColor = (p: string) => p==="critical"?"#f87171":p==="high"?"#f97316":p==="medium"?"#fbbf24":"#4ade80";
const statusColor = (s: string) => s==="new"?"#60a5fa":s==="investigating"?"#fbbf24":s==="resolved"?"#4ade80":"#94a3b8";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function classifyPriority(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("fraud") || a.includes("block") || a.includes("ban") || a.includes("chargeback")) return "critical";
  if (a.includes("delete") || a.includes("restrict") || a.includes("suspend")) return "high";
  if (a.includes("update") || a.includes("edit") || a.includes("flag")) return "medium";
  return "low";
}

export default function AdminFraudAlerts() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filterPrio, setFilterPrio] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sound, setSound] = useState(true);
  const [selected, setSelected] = useState<Alert|null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [assignInput, setAssignInput] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({});
  const [assignOverrides, setAssignOverrides] = useState<Record<string, string>>({});

  const { data: rawLogs = [], isLoading } = useQuery({
    queryKey: ["admin-fraud-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("id, action, admin_id, created_at, details, target_profile_name")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const alerts: Alert[] = rawLogs.map(l => ({
    id: l.id,
    message: l.action,
    source: "Admin Audit Log",
    priority: classifyPriority(l.action),
    status: statusOverrides[l.id] || "new",
    timestamp: timeAgo(l.created_at),
    user: l.target_profile_name || "Admin",
    note: noteOverrides[l.id] || "",
    assignedTo: assignOverrides[l.id] || "",
  }));

  const filtered = alerts.filter(a => {
    const matchPrio = filterPrio==="all"||a.priority===filterPrio;
    const matchStatus = filterStatus==="all"||a.status===filterStatus;
    return matchPrio && matchStatus;
  });

  const updateStatus = (id: string, status: string) => {
    setStatusOverrides(o => ({ ...o, [id]: status }));
    if (selected?.id===id) setSelected(s=>s?{...s,status}:null);
  };
  const saveNote = (id: string) => {
    setNoteOverrides(o => ({ ...o, [id]: noteInput }));
    if (selected?.id===id) setSelected(s=>s?{...s,note:noteInput}:null);
  };
  const assignAlert = (id: string) => {
    setAssignOverrides(o => ({ ...o, [id]: assignInput }));
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

        {isLoading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:64, gap:12 }}>
            <Loader2 size={24} color={A1} />
            <span style={{ color:T.sub, fontSize:14 }}>Loading fraud alerts…</span>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(a => (
              <div key={a.id} style={{ background:T.card, border:`1px solid ${a.status==="new"?prioColor(a.priority)+"44":T.border}`, borderRadius:14, padding:"16px 20px", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:12, height:12, borderRadius:"50%", background:prioColor(a.priority), flexShrink:0 }} />
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
            {filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:T.sub, fontSize:14 }}>{rawLogs.length===0?"No audit logs found":"No alerts match your filters"}</div>}
          </div>
        )}

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
