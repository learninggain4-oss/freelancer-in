import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Folder, Plus, Clock, CheckCircle2, AlertTriangle, User, Paperclip, MessageSquare, XCircle, ArrowRight } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type Evidence = { type:string; name:string; size:string; addedAt:string };
type TimelineEntry = { action:string; by:string; time:string };
type FraudCase = { id:string; caseId:string; status:string; priority:string; description:string; assignedAdmin:string; user:string; createdAt:string; updatedAt:string; notes:string; resolution:string; evidence:Evidence[]; timeline:TimelineEntry[] };

const CASES: FraudCase[] = [
  { id:"c1", caseId:"CASE-2841", status:"investigating", priority:"critical", description:"User attempting multiple payment bypasses using duplicate card entries. Evidence of coordinated fraud pattern.", assignedAdmin:"superadmin@site.com", user:"Rahul Sharma (user_2841)", createdAt:"Today 09:00", updatedAt:"30 min ago", notes:"Confirmed multiple device fingerprints. Card data matches known fraud pattern.", resolution:"",
    evidence:[{ type:"screenshot", name:"payment_bypass.png", size:"1.2 MB", addedAt:"Today 09:30" },{ type:"document", name:"transaction_log.pdf", size:"450 KB", addedAt:"Today 10:00" }],
    timeline:[{ action:"Case Opened", by:"System", time:"Today 09:00" },{ action:"Assigned to superadmin", by:"System", time:"Today 09:01" },{ action:"Evidence added (2 files)", by:"superadmin@site.com", time:"Today 09:30" },{ action:"Status: Investigating", by:"superadmin@site.com", time:"Today 10:00" }] },
  { id:"c2", caseId:"CASE-5521", status:"open", priority:"high", description:"Login from 4 different countries within 2 hours. Suspected account takeover.", assignedAdmin:"", user:"Priya Mehta (user_5521)", createdAt:"Today 11:00", updatedAt:"15 min ago", notes:"", resolution:"",
    evidence:[],
    timeline:[{ action:"Case Opened", by:"System", time:"Today 11:00" }] },
  { id:"c3", caseId:"CASE-1204", status:"resolved", priority:"high", description:"Duplicate payment of ₹1,20,000 detected. Refund initiated after investigation.", assignedAdmin:"admin@site.com", user:"Ajay Kumar (user_1204)", createdAt:"Yesterday", updatedAt:"2 hrs ago", notes:"Duplicate transaction confirmed. Refund processed.", resolution:"Refund initiated. No further action needed. User warned.",
    evidence:[{ type:"payment_proof", name:"refund_receipt.pdf", size:"230 KB", addedAt:"Yesterday 15:00" }],
    timeline:[{ action:"Case Opened", by:"System", time:"Yesterday 10:00" },{ action:"Assigned to admin@site.com", by:"superadmin", time:"Yesterday 10:05" },{ action:"Refund Initiated", by:"admin@site.com", time:"Yesterday 14:00" },{ action:"Case Resolved", by:"admin@site.com", time:"Yesterday 15:30" }] },
];

const statusColor = (s: string) => s==="open"?"#60a5fa":s==="investigating"?"#fbbf24":s==="resolved"?"#4ade80":"#f87171";
const prioColor = (p: string) => p==="critical"?"#f87171":p==="high"?"#f97316":p==="medium"?"#fbbf24":"#4ade80";

export default function AdminFraudCases() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [cases, setCases] = useState(CASES);
  const [selected, setSelected] = useState<FraudCase|null>(CASES[0]);
  const [noteInput, setNoteInput] = useState("");
  const [resolutionInput, setResolutionInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCase, setNewCase] = useState({ description:"", priority:"high", user:"" });
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredCases = filterStatus==="all"?cases:cases.filter(c=>c.status===filterStatus);

  const updateCase = (id: string, updates: Partial<FraudCase>) => {
    setCases(c => c.map(x => x.id===id ? {...x,...updates} : x));
    if (selected?.id===id) setSelected(s=>s?{...s,...updates}:null);
  };

  const addEvidence = (caseId: string, type: string) => {
    const ev: Evidence = { type, name:`${type}_evidence_${Date.now()}.pdf`, size:"0.8 MB", addedAt:"Just now" };
    updateCase(caseId, { evidence:[...(cases.find(c=>c.id===caseId)?.evidence||[]),ev] });
  };

  const createCase = () => {
    const nc: FraudCase = { id:`c${Date.now()}`, caseId:`CASE-${Math.floor(Math.random()*9000+1000)}`, status:"open", priority:newCase.priority, description:newCase.description, assignedAdmin:"", user:newCase.user, createdAt:"Just now", updatedAt:"Just now", notes:"", resolution:"",
      evidence:[], timeline:[{ action:"Case Opened", by:"Admin", time:"Just now" }] };
    setCases(c=>[nc,...c]); setShowAdd(false); setNewCase({ description:"", priority:"high", user:"" });
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
              <Folder size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Fraud Investigation & Case Management</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>Manage fraud cases with timelines, evidence, and resolution tracking</p>
            </div>
          </div>
          <button onClick={()=>setShowAdd(true)} style={{ padding:"9px 18px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Plus size={15}/> New Case</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:20 }}>
          {/* Cases List */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:16, backdropFilter:"blur(10px)", height:"fit-content" }}>
            <div style={{ display:"flex", gap:4, marginBottom:14, flexWrap:"wrap" }}>
              {["all","open","investigating","resolved"].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:filterStatus===s?A1:"transparent", color:filterStatus===s?"#fff":T.sub, fontSize:11, cursor:"pointer", textTransform:"capitalize" }}>{s}</button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filteredCases.map(c => (
                <div key={c.id} onClick={()=>setSelected(c)} style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${selected?.id===c.id?A1:T.border}`, background:selected?.id===c.id?`${A1}10`:T.input, cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:A1 }}>{c.caseId}</span>
                    <span style={{ padding:"2px 7px", borderRadius:10, background:`${statusColor(c.status)}15`, color:statusColor(c.status), fontSize:10, fontWeight:700, textTransform:"capitalize" }}>{c.status}</span>
                  </div>
                  <div style={{ fontSize:12, color:T.text, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.description}</div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ padding:"2px 6px", borderRadius:5, background:`${prioColor(c.priority)}15`, color:prioColor(c.priority), fontSize:10, fontWeight:700, textTransform:"capitalize" }}>{c.priority}</span>
                    <span style={{ fontSize:10, color:T.sub }}>{c.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Case Detail */}
          {selected && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Header */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                      <span style={{ fontSize:18, fontWeight:700, color:A1 }}>{selected.caseId}</span>
                      <span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(selected.status)}15`, color:statusColor(selected.status), fontSize:12, fontWeight:700, textTransform:"capitalize" }}>{selected.status}</span>
                      <span style={{ padding:"3px 10px", borderRadius:20, background:`${prioColor(selected.priority)}15`, color:prioColor(selected.priority), fontSize:12, fontWeight:700, textTransform:"capitalize" }}>{selected.priority}</span>
                    </div>
                    <div style={{ fontSize:12, color:T.sub }}>User: {selected.user} · Created: {selected.createdAt}</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["open","investigating","resolved"].map(s=>(
                      <button key={s} onClick={()=>updateCase(selected.id,{status:s})} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${statusColor(s)}`, background:selected.status===s?`${statusColor(s)}20`:"transparent", color:statusColor(s), fontSize:12, cursor:"pointer", textTransform:"capitalize" }}>{s}</button>
                    ))}
                    <button onClick={()=>updateCase(selected.id,{status:"closed"})} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid #f87171`, background:"rgba(248,113,113,.1)", color:"#f87171", fontSize:12, cursor:"pointer" }}>Close</button>
                  </div>
                </div>
                <p style={{ fontSize:13, color:T.text, lineHeight:1.6, margin:0 }}>{selected.description}</p>
              </div>

              {/* Assign + Notes + Resolution */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
                  <h3 style={{ fontSize:13, fontWeight:700, color:T.text, margin:"0 0 12px" }}>Assigned Admin</h3>
                  <input value={selected.assignedAdmin} onChange={e=>updateCase(selected.id,{assignedAdmin:e.target.value})} placeholder="admin@site.com" style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, boxSizing:"border-box" }} />
                  <h3 style={{ fontSize:13, fontWeight:700, color:T.text, margin:"16px 0 10px" }}>Investigation Notes</h3>
                  <textarea value={selected.notes||noteInput} onChange={e=>{ setNoteInput(e.target.value); updateCase(selected.id,{notes:e.target.value}); }} placeholder="Add investigation notes…" rows={3} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box" }} />
                </div>
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
                  <h3 style={{ fontSize:13, fontWeight:700, color:T.text, margin:"0 0 12px" }}>Case Resolution</h3>
                  <textarea value={selected.resolution||resolutionInput} onChange={e=>{ setResolutionInput(e.target.value); updateCase(selected.id,{resolution:e.target.value}); }} placeholder="Document the resolution…" rows={4} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box" }} />
                  <button onClick={()=>updateCase(selected.id,{status:"resolved"})} style={{ marginTop:10, padding:"8px 20px", borderRadius:8, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer" }}>Mark Resolved</button>
                </div>
              </div>

              {/* Evidence */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <h3 style={{ fontSize:13, fontWeight:700, color:T.text, margin:0 }}>Evidence ({selected.evidence.length})</h3>
                  <div style={{ display:"flex", gap:8 }}>
                    {["screenshot","payment_proof","document"].map(t=>(
                      <button key={t} onClick={()=>addEvidence(selected.id,t)} style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${A1}`, background:`${A1}15`, color:A1, fontSize:11, cursor:"pointer" }}>+ {t.replace("_"," ")}</button>
                    ))}
                  </div>
                </div>
                {selected.evidence.length===0 ? (
                  <div style={{ textAlign:"center", padding:20, color:T.sub, fontSize:13 }}>No evidence uploaded yet</div>
                ) : (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                    {selected.evidence.map((e,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:T.input, border:`1px solid ${T.border}` }}>
                        <Paperclip size={15} color={A1} />
                        <div>
                          <div style={{ fontSize:12, color:T.text, fontWeight:600 }}>{e.name}</div>
                          <div style={{ fontSize:10, color:T.sub }}>{e.size} · {e.addedAt}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
                <h3 style={{ fontSize:13, fontWeight:700, color:T.text, margin:"0 0 14px" }}>Investigation Timeline</h3>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {selected.timeline.map((t,i) => (
                    <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:A1, marginTop:4, flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{t.action}</span>
                        <span style={{ fontSize:12, color:T.sub, marginLeft:8 }}>by {t.by}</span>
                        <div style={{ fontSize:11, color:T.sub }}>{t.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New Case Modal */}
        {showAdd && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:480 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>Open New Fraud Case</h2>
                <button onClick={()=>setShowAdd(false)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div><label style={{ fontSize:12, color:T.sub }}>User</label><input value={newCase.user} onChange={e=>setNewCase(c=>({...c,user:e.target.value}))} placeholder="User name or ID" style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, boxSizing:"border-box" }} /></div>
                <div><label style={{ fontSize:12, color:T.sub }}>Priority</label>
                  <select value={newCase.priority} onChange={e=>setNewCase(c=>({...c,priority:e.target.value}))} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
                    {["low","medium","high","critical"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:12, color:T.sub }}>Case Description</label><textarea value={newCase.description} onChange={e=>setNewCase(c=>({...c,description:e.target.value}))} placeholder="Describe the fraud case…" rows={3} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box" }} /></div>
                <button onClick={createCase} style={{ padding:"10px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer" }}>Open Case</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
