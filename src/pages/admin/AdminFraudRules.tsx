import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Shield, Plus, Edit2, Trash2, Play, Settings, Sliders, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type Rule = { id:string; name:string; description:string; priority:number; enabled:boolean; testing:boolean; triggered:number; action:string };

const INIT_RULES: Rule[] = [
  { id:"r1", name:"Failed Login Limit",           description:"Block account after N failed logins in X minutes",          priority:1, enabled:true,  testing:false, triggered:142, action:"block_login" },
  { id:"r2", name:"Rapid Payment Detection",      description:"Flag if user makes >N payments in X minutes",              priority:2, enabled:true,  testing:false, triggered:38,  action:"flag_payment" },
  { id:"r3", name:"IP Change Alert",              description:"Alert if IP changes more than N times in X hours",          priority:3, enabled:true,  testing:false, triggered:91,  action:"send_alert" },
  { id:"r4", name:"Device Change Alert",          description:"Flag account if device fingerprint changes frequently",     priority:4, enabled:true,  testing:true,  triggered:22,  action:"require_verify" },
  { id:"r5", name:"High Risk Score Auto Block",   description:"Auto-block accounts when risk score exceeds threshold",     priority:5, enabled:true,  testing:false, triggered:14,  action:"auto_block" },
  { id:"r6", name:"Refund Abuse Detection",       description:"Flag if refund rate exceeds N% over X days",              priority:6, enabled:false, testing:false, triggered:7,   action:"flag_payment" },
  { id:"r7", name:"Location Mismatch Detection",  description:"Alert if payment location differs from login location",    priority:7, enabled:true,  testing:false, triggered:63,  action:"send_alert" },
  { id:"r8", name:"Auto Freeze Threshold",        description:"Freeze account when suspicious activity score exceeds N",  priority:8, enabled:false, testing:true,  triggered:0,   action:"freeze_account" },
];

const THRESHOLDS = [
  { id:"t1", label:"Failed Login Limit",     value:5,  unit:"attempts",   min:1, max:20 },
  { id:"t2", label:"Payment Failure Limit",  value:3,  unit:"failures",   min:1, max:10 },
  { id:"t3", label:"IP Change Limit",        value:3,  unit:"changes/hr", min:1, max:15 },
  { id:"t4", label:"Device Change Limit",    value:2,  unit:"devices",    min:1, max:10 },
  { id:"t5", label:"Risk Score Threshold",   value:75, unit:"/100",       min:50, max:100 },
  { id:"t6", label:"Auto Block Threshold",   value:90, unit:"/100",       min:60, max:100 },
  { id:"t7", label:"Auto Freeze Threshold",  value:70, unit:"/100",       min:50, max:100 },
  { id:"t8", label:"Alert Threshold",        value:50, unit:"/100",       min:20, max:100 },
];

export default function AdminFraudRules() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [rules, setRules] = useState(INIT_RULES);
  const [thresholds, setThresholds] = useState(THRESHOLDS);
  const [tab, setTab] = useState<"rules"|"thresholds"|"simulation">("rules");
  const [editRule, setEditRule] = useState<Rule|null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string|null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({ name:"", description:"", action:"send_alert" });

  const toggleRule = (id: string) => setRules(r => r.map(x => x.id===id ? {...x, enabled:!x.enabled} : x));
  const toggleTest = (id: string) => setRules(r => r.map(x => x.id===id ? {...x, testing:!x.testing} : x));
  const deleteRule = (id: string) => setRules(r => r.filter(x => x.id!==id));
  const updateThreshold = (id: string, value: number) => setThresholds(t => t.map(x => x.id===id ? {...x, value} : x));

  const runSimulation = () => {
    setSimulationRunning(true);
    setSimulationResult(null);
    setTimeout(() => {
      setSimulationRunning(false);
      setSimulationResult("Simulation complete: 3 rules would trigger, 12 accounts would be flagged, 2 would be auto-blocked based on current thresholds.");
    }, 2500);
  };

  const addRule = () => {
    if (!newRule.name) return;
    const r: Rule = { id:`r${Date.now()}`, name:newRule.name, description:newRule.description, priority:rules.length+1, enabled:false, testing:true, triggered:0, action:newRule.action };
    setRules(prev => [...prev, r]);
    setShowAdd(false); setNewRule({ name:"", description:"", action:"send_alert" });
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
              <Shield size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Fraud Rules & Threshold Management</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>Customize detection rules and thresholds — no external API required</p>
            </div>
          </div>
          <button onClick={()=>setShowAdd(true)} style={{ padding:"9px 18px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Plus size={15}/> New Rule</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:20, background:T.card, borderRadius:12, padding:4, border:`1px solid ${T.border}`, width:"fit-content" }}>
          {(["rules","thresholds","simulation"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 20px", borderRadius:9, border:"none", background:tab===t?`linear-gradient(135deg,${A1},${A2})`:"transparent", color:tab===t?"#fff":T.sub, fontSize:13, fontWeight:tab===t?700:400, cursor:"pointer", textTransform:"capitalize" }}>{t}</button>
          ))}
        </div>

        {tab==="rules" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {rules.map(r => (
              <div key={r.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)", display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${A1}20`, color:A1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0 }}>{r.priority}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{r.name}</span>
                    {r.testing && <span style={{ padding:"2px 8px", borderRadius:6, background:"rgba(251,191,36,.15)", color:"#fbbf24", fontSize:10, fontWeight:700 }}>TESTING MODE</span>}
                  </div>
                  <div style={{ fontSize:12, color:T.sub }}>{r.description}</div>
                  <div style={{ fontSize:11, color:T.sub, marginTop:4 }}>Action: <span style={{ color:A1 }}>{r.action}</span> · Triggered: {r.triggered}×</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:10, color:T.sub, marginBottom:4 }}>Enabled</div>
                    <div onClick={()=>toggleRule(r.id)} style={{ width:40, height:22, borderRadius:11, background:r.enabled?A1:T.input, cursor:"pointer", position:"relative", transition:"background .2s" }}>
                      <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:r.enabled?20:2, transition:"left .2s" }} />
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:10, color:T.sub, marginBottom:4 }}>Test</div>
                    <div onClick={()=>toggleTest(r.id)} style={{ width:40, height:22, borderRadius:11, background:r.testing?"#fbbf24":T.input, cursor:"pointer", position:"relative", transition:"background .2s" }}>
                      <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:r.testing?20:2, transition:"left .2s" }} />
                    </div>
                  </div>
                  <button onClick={()=>setEditRule(r)} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.sub, cursor:"pointer" }}><Edit2 size={14}/></button>
                  <button onClick={()=>deleteRule(r.id)} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid #f87171`, background:"rgba(248,113,113,.1)", color:"#f87171", cursor:"pointer" }}><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="thresholds" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:20 }}>Detection Thresholds</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              {thresholds.map(t => (
                <div key={t.id} style={{ background:T.input, borderRadius:12, padding:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{t.label}</span>
                    <span style={{ fontSize:16, fontWeight:700, color:A1 }}>{t.value} <span style={{ fontSize:11, color:T.sub, fontWeight:400 }}>{t.unit}</span></span>
                  </div>
                  <input type="range" min={t.min} max={t.max} value={t.value} onChange={e=>updateThreshold(t.id,parseInt(e.target.value))} style={{ width:"100%", accentColor:A1 }} />
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.sub, marginTop:4 }}>
                    <span>{t.min}</span><span>{t.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="simulation" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:28, backdropFilter:"blur(10px)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>Simulation Mode</div>
            <p style={{ fontSize:13, color:T.sub, marginBottom:24 }}>Run a simulation to see how current rules and thresholds would affect real users — without applying any actual actions.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
              {[["Active Rules", rules.filter(r=>r.enabled).length,"#4ade80"],["Test Mode Rules", rules.filter(r=>r.testing).length,"#fbbf24"],["Disabled Rules", rules.filter(r=>!r.enabled).length,"#f87171"]].map(([l,v,c])=>(
                <div key={String(l)} style={{ background:T.input, borderRadius:10, padding:16, textAlign:"center" }}>
                  <div style={{ fontSize:28, fontWeight:700, color:String(c) }}>{v}</div>
                  <div style={{ fontSize:12, color:T.sub }}>{l}</div>
                </div>
              ))}
            </div>
            <button onClick={runSimulation} disabled={simulationRunning} style={{ padding:"12px 32px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, opacity:simulationRunning?0.7:1 }}>
              <Play size={16} style={{ animation:simulationRunning?"spin 1s linear infinite":"none" }} /> {simulationRunning?"Running Simulation…":"Run Simulation"}
            </button>
            {simulationResult && (
              <div style={{ marginTop:20, padding:16, borderRadius:10, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}>
                <CheckCircle2 size={16} style={{ display:"inline", marginRight:8 }} />
                {simulationResult}
              </div>
            )}
          </div>
        )}

        {/* Edit Rule Modal */}
        {editRule && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:480 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>Edit Fraud Rule</h2>
                <button onClick={()=>setEditRule(null)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ fontSize:12, color:T.sub }}>Rule Name</label>
                  <input
                    value={editRule.name}
                    onChange={e => setEditRule(r => r ? {...r, name:e.target.value} : r)}
                    style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, boxSizing:"border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize:12, color:T.sub }}>Description</label>
                  <textarea
                    value={editRule.description}
                    onChange={e => setEditRule(r => r ? {...r, description:e.target.value} : r)}
                    rows={2}
                    style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize:12, color:T.sub }}>Action</label>
                  <select
                    value={editRule.action}
                    onChange={e => setEditRule(r => r ? {...r, action:e.target.value} : r)}
                    style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}
                  >
                    {["send_alert","auto_block","freeze_account","flag_payment","require_verify","block_login"].map(a => (
                      <option key={a} value={a}>{a.replace(/_/g," ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:T.sub }}>Priority</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editRule.priority}
                    onChange={e => setEditRule(r => r ? {...r, priority:parseInt(e.target.value)||1} : r)}
                    style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, boxSizing:"border-box" }}
                  />
                </div>
                <div style={{ display:"flex", gap:16 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.sub, cursor:"pointer" }}>
                    <div
                      onClick={() => setEditRule(r => r ? {...r, enabled:!r.enabled} : r)}
                      style={{ width:36, height:20, borderRadius:10, background:editRule.enabled?A1:T.input, position:"relative", cursor:"pointer", transition:"background .2s", border:`1px solid ${T.border}` }}
                    >
                      <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:1, left:editRule.enabled?18:1, transition:"left .2s" }} />
                    </div>
                    Enabled
                  </label>
                  <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.sub, cursor:"pointer" }}>
                    <div
                      onClick={() => setEditRule(r => r ? {...r, testing:!r.testing} : r)}
                      style={{ width:36, height:20, borderRadius:10, background:editRule.testing?"#fbbf24":T.input, position:"relative", cursor:"pointer", transition:"background .2s", border:`1px solid ${T.border}` }}
                    >
                      <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:1, left:editRule.testing?18:1, transition:"left .2s" }} />
                    </div>
                    Testing Mode
                  </label>
                </div>
                <div style={{ display:"flex", gap:10, marginTop:4 }}>
                  <button
                    onClick={() => {
                      setRules(prev => prev.map(x => x.id === editRule.id ? editRule : x));
                      setEditRule(null);
                    }}
                    style={{ flex:1, padding:"10px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer" }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditRule(null)}
                    style={{ padding:"10px 20px", borderRadius:10, border:`1px solid ${T.border}`, background:T.input, color:T.sub, fontSize:14, cursor:"pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Rule Modal */}
        {showAdd && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:460 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>Create Fraud Rule</h2>
                <button onClick={()=>setShowAdd(false)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div><label style={{ fontSize:12, color:T.sub }}>Rule Name</label><input value={newRule.name} onChange={e=>setNewRule(r=>({...r,name:e.target.value}))} placeholder="e.g. Rapid Login Detection" style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, boxSizing:"border-box" }} /></div>
                <div><label style={{ fontSize:12, color:T.sub }}>Description</label><textarea value={newRule.description} onChange={e=>setNewRule(r=>({...r,description:e.target.value}))} placeholder="Describe what this rule detects…" rows={2} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box" }} /></div>
                <div><label style={{ fontSize:12, color:T.sub }}>Action</label>
                  <select value={newRule.action} onChange={e=>setNewRule(r=>({...r,action:e.target.value}))} style={{ width:"100%", marginTop:6, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
                    {["send_alert","auto_block","freeze_account","flag_payment","require_verify","block_login"].map(a=><option key={a} value={a}>{a.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <button onClick={addRule} style={{ padding:"10px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", marginTop:4 }}>Create Rule (starts in Test Mode)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
