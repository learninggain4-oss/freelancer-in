// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Folder, Plus, Paperclip, Loader2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type Evidence = { type:string; name:string; size:string; addedAt:string };
type TimelineEntry = { action:string; by:string; time:string };
type FraudCase = { id:string; caseId:string; status:string; priority:string; description:string; assignedAdmin:string; user:string; createdAt:string; updatedAt:string; notes:string; resolution:string; evidence:Evidence[]; timeline:TimelineEntry[] };

const statusColor = (s: string) => s==="open"?"#60a5fa":s==="investigating"?"#fbbf24":s==="resolved"?"#4ade80":"#f87171";
const prioColor = (p: string) => p==="critical"?"#f87171":p==="high"?"#f97316":p==="medium"?"#fbbf24":"#4ade80";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getPriority(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("fraud") || a.includes("chargeback") || a.includes("block") || a.includes("ban")) return "critical";
  if (a.includes("delete") || a.includes("restrict") || a.includes("suspend")) return "high";
  if (a.includes("update") || a.includes("flag") || a.includes("review")) return "medium";
  return "low";
}

export default function AdminFraudCases() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [selected, setSelected] = useState<FraudCase|null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [resolutionInput, setResolutionInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCase, setNewCase] = useState({ description:"", priority:"high", user:"" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [localCases, setLocalCases] = useState<FraudCase[]>(()=>load(LOCAL_CASES_KEY,seedLocalCases));
  const [overrides, setOverrides] = useState<Record<string, Partial<FraudCase>>>({});

  const { data: rawLogs = [], isLoading } = useQuery({
    queryKey: ["admin-fraud-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("id, action, admin_id, created_at, details, target_profile_id, target_profile_name")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const dbCases: FraudCase[] = rawLogs.map((l, i) => ({
    id: l.id,
    caseId: `CASE-${(i + 1).toString().padStart(4, "0")}`,
    status: overrides[l.id]?.status || "open",
    priority: overrides[l.id]?.priority || getPriority(l.action),
    description: l.action,
    assignedAdmin: overrides[l.id]?.assignedAdmin || "",
    user: l.target_profile_name || "Admin",
    createdAt: timeAgo(l.created_at),
    updatedAt: timeAgo(l.created_at),
    notes: overrides[l.id]?.notes || "",
    resolution: overrides[l.id]?.resolution || "",
    evidence: overrides[l.id]?.evidence || [],
    timeline: [{ action:"Case opened from audit log", by:"System", time:timeAgo(l.created_at) }, ...(overrides[l.id]?.timeline?.slice(1) || [])],
  }));

  const allCases = [...localCases, ...dbCases];
  const filteredCases = filterStatus==="all" ? allCases : allCases.filter(c=>c.status===filterStatus);

  const updateCase = (id: string, updates: Partial<FraudCase>) => {
    setOverrides(o => ({ ...o, [id]: { ...(o[id] || {}), ...updates } }));
    setLocalCases(c => c.map(x => x.id===id ? {...x,...updates} : x));
    if (selected?.id===id) setSelected(s=>s?{...s,...updates}:null);
  };

  const addEvidence = (caseId: string, type: string) => {
    const existing = allCases.find(c=>c.id===caseId)?.evidence || [];
    const ev: Evidence = { type, name:`${type}_evidence_${Date.now()}.pdf`, size:"0.8 MB", addedAt:"Just now" };
    updateCase(caseId, { evidence:[...existing, ev] });
  };

  const createCase = () => {
    const nc: FraudCase = { id:`c${Date.now()}`, caseId:`CASE-${Math.floor(Math.random()*9000+1000)}`, status:"open", priority:newCase.priority, description:newCase.description, assignedAdmin:"", user:newCase.user, createdAt:"Just now", updatedAt:"Just now", notes:"", resolution:"",
      evidence:[], timeline:[{ action:"Case Opened", by:"Admin", time:"Just now" }] };
    setLocalCases(c=>[nc,...c]); setShowAdd(false); setNewCase({ description:"", priority:"high", user:"" });
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
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:16, backdropFilter:"blur(10px)", height:"fit-content" }}>
            <div style={{ display:"flex", gap:4, marginBottom:14, flexWrap:"wrap" }}>
              {["all","open","investigating","resolved"].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:filterStatus===s?A1:"transparent", color:filterStatus===s?"#fff":T.sub, fontSize:11, cursor:"pointer", textTransform:"capitalize" }}>{s}</button>
              ))}
            </div>
            {isLoading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:32, gap:8 }}>
                <Loader2 size={16} color={A1} />
                <span style={{ color:T.sub, fontSize:13 }}>Loading cases…</span>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {filteredCases.length === 0
                  ? <div style={{ textAlign:"center", padding:"32px 12px", color:T.sub, fontSize:13 }}>No cases found</div>
                  : filteredCases.map(c => (
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
                  ))
                }
              </div>
            )}
          </div>

          {selected && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
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
