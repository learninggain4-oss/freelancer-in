import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Zap, Play, Pause, Settings, Clock, AlertTriangle, CheckCircle2, RefreshCw, Plus, Trash2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type AutoAction = { id:string; trigger:string; action:string; enabled:boolean; delay:number; priority:number; retries:number; exceptions:string[]; triggeredCount:number; lastTriggered:string };

const INIT_ACTIONS: AutoAction[] = [
  { id:"aa1", trigger:"Risk score ≥ 90",       action:"Auto Block User",           enabled:true,  delay:0,  priority:1, retries:0, exceptions:["whitelisted_users"], triggeredCount:14, lastTriggered:"2 hrs ago" },
  { id:"aa2", trigger:"Risk score ≥ 70",       action:"Auto Freeze Account",       enabled:true,  delay:5,  priority:2, retries:0, exceptions:[], triggeredCount:28, lastTriggered:"1 hr ago" },
  { id:"aa3", trigger:"Duplicate payment detected", action:"Auto Flag Payment",    enabled:true,  delay:0,  priority:3, retries:2, exceptions:[], triggeredCount:38, lastTriggered:"30 min ago" },
  { id:"aa4", trigger:"Failed login ≥ 5",      action:"Auto Require Verification", enabled:true,  delay:0,  priority:4, retries:1, exceptions:["admin_accounts"], triggeredCount:142, lastTriggered:"5 min ago" },
  { id:"aa5", trigger:"Login from new country", action:"Auto Lock Login",          enabled:false, delay:30, priority:5, retries:0, exceptions:["trusted_devices"], triggeredCount:22, lastTriggered:"3 hrs ago" },
  { id:"aa6", trigger:"Payment from blocked IP","action":"Auto Send Alert",        enabled:true,  delay:0,  priority:6, retries:3, exceptions:[], triggeredCount:63, lastTriggered:"15 min ago" },
];

const EXCEPTION_OPTS = ["whitelisted_users","admin_accounts","trusted_devices","verified_kyc","premium_users"];
const ACTION_OPTS = ["Auto Block User","Auto Freeze Account","Auto Flag Payment","Auto Require Verification","Auto Lock Login","Auto Send Alert","Auto Suspend Account","Auto Refund Payment"];
const TRIGGER_OPTS = ["Risk score ≥ 90","Risk score ≥ 70","Risk score ≥ 50","Failed login ≥ 5","Failed login ≥ 10","Duplicate payment detected","Login from new country","Payment from blocked IP","IP change ≥ 3","VPN detected"];

export default function AdminFraudAutomation() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [actions, setActions] = useState(INIT_ACTIONS);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [editAction, setEditAction] = useState<AutoAction|null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newAction, setNewAction] = useState({ trigger:TRIGGER_OPTS[0], action:ACTION_OPTS[0], delay:0, priority:actions.length+1, retries:0 });
  const [testing, setTesting] = useState<string|null>(null);

  const toggleAction = (id: string) => setActions(a => a.map(x => x.id===id ? {...x,enabled:!x.enabled} : x));
  const deleteAction = (id: string) => setActions(a => a.filter(x=>x.id!==id));
  const runTest = (id: string) => { setTesting(id); setTimeout(()=>setTesting(null),2000); };
  const saveEdit = () => {
    if (!editAction) return;
    setActions(a => a.map(x => x.id===editAction.id ? editAction : x));
    setEditAction(null);
  };
  const addNew = () => {
    const na: AutoAction = { id:`aa${Date.now()}`, trigger:newAction.trigger, action:newAction.action, enabled:false, delay:newAction.delay, priority:newAction.priority, retries:newAction.retries, exceptions:[], triggeredCount:0, lastTriggered:"Never" };
    setActions(a=>[...a,na]); setShowAdd(false);
  };

  const stats = [
    { label:"Active Automations", value:actions.filter(a=>a.enabled).length, color:"#4ade80" },
    { label:"Disabled", value:actions.filter(a=>!a.enabled).length, color:"#f87171" },
    { label:"Total Triggered", value:actions.reduce((s,a)=>s+a.triggeredCount,0), color:A1 },
    { label:"System Status", value:globalEnabled?"Active":"Paused", color:globalEnabled?"#4ade80":"#f87171" },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, marginBottom:28, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
              <Zap size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Automation & Auto Action System</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>Automatically respond to fraud events with configurable triggers and actions</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setGlobalEnabled(x=>!x)} style={{ padding:"9px 18px", borderRadius:10, border:`1px solid ${globalEnabled?"#f87171":"#4ade80"}`, background:globalEnabled?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)", color:globalEnabled?"#f87171":"#4ade80", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              {globalEnabled?<Pause size={15}/>:<Play size={15}/>} {globalEnabled?"Pause All":"Resume All"}
            </button>
            <button onClick={()=>setShowAdd(true)} style={{ padding:"9px 18px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Plus size={15}/> Add Automation</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
              <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>{s.label}</div>
              <div style={{ fontSize:s.label==="System Status"?16:28, fontWeight:700, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {actions.map(a => (
            <div key={a.id} style={{ background:T.card, border:`1px solid ${!globalEnabled||!a.enabled?T.border:A1+"33"}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)", opacity:!globalEnabled||!a.enabled?0.7:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${A2}20`, color:A2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0 }}>{a.priority}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <span style={{ fontSize:13, color:T.sub }}>TRIGGER:</span>
                    <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{a.trigger}</span>
                    <span style={{ color:T.sub }}>→</span>
                    <span style={{ fontSize:13, fontWeight:700, color:A1 }}>{a.action}</span>
                  </div>
                  <div style={{ display:"flex", gap:14, fontSize:12, color:T.sub }}>
                    <span>Delay: {a.delay}s</span>
                    <span>Retries: {a.retries}</span>
                    {a.exceptions.length>0 && <span>Exceptions: {a.exceptions.join(", ")}</span>}
                    <span style={{ color:T.text }}>Triggered: {a.triggeredCount}×</span>
                    <span>Last: {a.lastTriggered}</span>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <button onClick={()=>runTest(a.id)} disabled={testing===a.id} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.sub, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                    <RefreshCw size={13} style={{ animation:testing===a.id?"spin 1s linear infinite":"none" }} /> Test
                  </button>
                  <button onClick={()=>setEditAction({...a})} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.sub, fontSize:12, cursor:"pointer" }}><Settings size={13}/></button>
                  <button onClick={()=>deleteAction(a.id)} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid #f87171`, background:"rgba(248,113,113,.1)", color:"#f87171", fontSize:12, cursor:"pointer" }}><Trash2 size={13}/></button>
                  <div onClick={()=>toggleAction(a.id)} style={{ width:40, height:22, borderRadius:11, background:a.enabled&&globalEnabled?A1:T.input, cursor:"pointer", position:"relative", transition:"background .2s" }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:a.enabled&&globalEnabled?20:2, transition:"left .2s" }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {editAction && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:500 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>Edit Automation</h2>
                <button onClick={()=>setEditAction(null)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div><label style={{ fontSize:12, color:T.sub }}>Trigger</label>
                  <select value={editAction.trigger} onChange={e=>setEditAction(a=>a?{...a,trigger:e.target.value}:null)} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
                    {TRIGGER_OPTS.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:12, color:T.sub }}>Action</label>
                  <select value={editAction.action} onChange={e=>setEditAction(a=>a?{...a,action:e.target.value}:null)} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
                    {ACTION_OPTS.map(ac=><option key={ac} value={ac}>{ac}</option>)}
                  </select>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <div><label style={{ fontSize:12, color:T.sub }}>Delay (sec)</label><input type="number" value={editAction.delay} onChange={e=>setEditAction(a=>a?{...a,delay:parseInt(e.target.value)||0}:null)} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, boxSizing:"border-box" }} /></div>
                  <div><label style={{ fontSize:12, color:T.sub }}>Priority</label><input type="number" value={editAction.priority} onChange={e=>setEditAction(a=>a?{...a,priority:parseInt(e.target.value)||1}:null)} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, boxSizing:"border-box" }} /></div>
                  <div><label style={{ fontSize:12, color:T.sub }}>Retries</label><input type="number" value={editAction.retries} onChange={e=>setEditAction(a=>a?{...a,retries:parseInt(e.target.value)||0}:null)} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, boxSizing:"border-box" }} /></div>
                </div>
                <div>
                  <label style={{ fontSize:12, color:T.sub }}>Exception Rules</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                    {EXCEPTION_OPTS.map(e=>(
                      <button key={e} onClick={()=>setEditAction(a=>a?{...a,exceptions:a.exceptions.includes(e)?a.exceptions.filter(x=>x!==e):[...a.exceptions,e]}:null)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${editAction.exceptions.includes(e)?A1:T.border}`, background:editAction.exceptions.includes(e)?`${A1}15`:T.input, color:editAction.exceptions.includes(e)?A1:T.sub, fontSize:12, cursor:"pointer" }}>{e}</button>
                    ))}
                  </div>
                </div>
                <button onClick={saveEdit} style={{ padding:"10px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer" }}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:460 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>New Automation</h2>
                <button onClick={()=>setShowAdd(false)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div><label style={{ fontSize:12, color:T.sub }}>Trigger</label>
                  <select value={newAction.trigger} onChange={e=>setNewAction(a=>({...a,trigger:e.target.value}))} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
                    {TRIGGER_OPTS.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:12, color:T.sub }}>Action</label>
                  <select value={newAction.action} onChange={e=>setNewAction(a=>({...a,action:e.target.value}))} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
                    {ACTION_OPTS.map(ac=><option key={ac} value={ac}>{ac}</option>)}
                  </select>
                </div>
                <button onClick={addNew} style={{ padding:"10px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer" }}>Create Automation</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
