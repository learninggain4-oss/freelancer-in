import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { TrendingUp, AlertTriangle, RefreshCw, Lock, RotateCcw, Edit2, CheckCircle2, ChevronDown, ChevronUp, Shield } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type User = { id:string; name:string; email:string; score:number; level:string; locked:boolean;
  factors:{ name:string; value:number; weight:number }[];
  history:{ date:string; score:number; reason:string }[] };

const USERS: User[] = [
  { id:"u1", name:"Rahul Sharma", email:"rahul@mail.com", score:91, level:"critical", locked:false,
    factors:[
      { name:"Failed login attempts", value:12, weight:20 },
      { name:"IP address changes", value:8, weight:18 },
      { name:"Device changes", value:5, weight:15 },
      { name:"Payment failures", value:6, weight:14 },
      { name:"Multiple account detection", value:2, weight:12 },
      { name:"Suspicious messaging", value:34, weight:8 },
      { name:"Rapid transactions", value:9, weight:10 },
      { name:"Location mismatch", value:4, weight:8 },
      { name:"Account age (days)", value:12, weight:5 },
      { name:"Refund frequency", value:3, weight:6 },
    ],
    history:[
      { date:"Today 09:00", score:91, reason:"IP change + login failure spike" },
      { date:"Yesterday", score:72, reason:"Multiple device logins" },
      { date:"3 days ago", score:45, reason:"Payment failure x3" },
      { date:"1 week ago", score:20, reason:"Initial baseline" },
    ]
  },
  { id:"u2", name:"Priya Mehta", email:"priya@mail.com", score:78, level:"high", locked:false,
    factors:[
      { name:"Failed login attempts", value:7, weight:20 },
      { name:"IP address changes", value:5, weight:18 },
      { name:"Device changes", value:2, weight:15 },
      { name:"Payment failures", value:4, weight:14 },
      { name:"Multiple account detection", value:1, weight:12 },
      { name:"Suspicious messaging", value:18, weight:8 },
      { name:"Rapid transactions", value:6, weight:10 },
      { name:"Location mismatch", value:2, weight:8 },
      { name:"Account age (days)", value:30, weight:5 },
      { name:"Refund frequency", value:2, weight:6 },
    ],
    history:[
      { date:"Today 11:30", score:78, reason:"Suspicious messaging pattern" },
      { date:"Yesterday", score:55, reason:"Rapid transactions" },
    ]
  },
  { id:"u3", name:"Ajay Kumar", email:"ajay@mail.com", score:52, level:"medium", locked:true,
    factors:[
      { name:"Failed login attempts", value:4, weight:20 },
      { name:"IP address changes", value:3, weight:18 },
      { name:"Device changes", value:1, weight:15 },
      { name:"Payment failures", value:2, weight:14 },
      { name:"Multiple account detection", value:0, weight:12 },
      { name:"Suspicious messaging", value:9, weight:8 },
      { name:"Rapid transactions", value:3, weight:10 },
      { name:"Location mismatch", value:1, weight:8 },
      { name:"Account age (days)", value:60, weight:5 },
      { name:"Refund frequency", value:1, weight:6 },
    ],
    history:[
      { date:"Today 08:00", score:52, reason:"IP change" },
    ]
  },
];

const lvlColor = (l: string) => l==="critical"?"#f87171":l==="high"?"#f97316":l==="medium"?"#fbbf24":"#4ade80";

export default function AdminUserRiskScore() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [users, setUsers] = useState(USERS);
  const [selected, setSelected] = useState<string|null>("u1");
  const [overrideVal, setOverrideVal] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [recalculating, setRecalculating] = useState<string|null>(null);
  const [expandHistory, setExpandHistory] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  const sel = users.find(u => u.id === selected);

  const resetScore = (id: string) => setUsers(u => u.map(x => x.id===id ? {...x, score:0, level:"low"} : x));
  const lockScore = (id: string) => setUsers(u => u.map(x => x.id===id ? {...x, locked:!x.locked} : x));
  const forceRecalc = (id: string) => {
    setRecalculating(id);
    setTimeout(() => setRecalculating(null), 1800);
  };
  const applyOverride = () => {
    const v = parseInt(overrideVal);
    if (isNaN(v) || !selected) return;
    const clamped = Math.min(100, Math.max(0, v));
    const lvl = clamped>=80?"critical":clamped>=60?"high":clamped>=40?"medium":"low";
    setUsers(u => u.map(x => x.id===selected ? {...x, score:clamped, level:lvl} : x));
    setShowOverride(false); setOverrideVal("");
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>User Risk Score Management</h1>
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Risk scoring (0–100) with factor breakdown and admin controls</p>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.sub, cursor:"pointer" }}>
              <div onClick={()=>setAutoUpdate(x=>!x)} style={{ width:36, height:20, borderRadius:10, background:autoUpdate?A1:T.input, position:"relative", cursor:"pointer", transition:"background .2s" }}>
                <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:autoUpdate?18:2, transition:"left .2s" }} />
              </div>
              Auto Update
            </label>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20 }}>
          {/* User List */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:16, backdropFilter:"blur(10px)", height:"fit-content" }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>Users ({users.length})</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {users.map(u => (
                <div key={u.id} onClick={()=>setSelected(u.id)} style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${selected===u.id?A1:T.border}`, background:selected===u.id?`${A1}10`:T.input, cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{u.name}</div>
                      <div style={{ fontSize:11, color:T.sub }}>{u.email}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:18, fontWeight:700, color:lvlColor(u.level) }}>{u.score}</div>
                      <span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:`${lvlColor(u.level)}18`, color:lvlColor(u.level), fontWeight:700, textTransform:"capitalize" }}>{u.level}</span>
                    </div>
                  </div>
                  {u.locked && <div style={{ fontSize:11, color:"#fbbf24", marginTop:4 }}>🔒 Score Locked</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {sel && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Score Card */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                  <div>
                    <h2 style={{ fontSize:18, fontWeight:700, color:T.text, margin:0 }}>{sel.name}</h2>
                    <div style={{ fontSize:13, color:T.sub }}>{sel.email}</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:48, fontWeight:800, color:lvlColor(sel.level), lineHeight:1 }}>{sel.score}</div>
                    <span style={{ padding:"4px 12px", borderRadius:20, background:`${lvlColor(sel.level)}18`, color:lvlColor(sel.level), fontSize:12, fontWeight:700, textTransform:"capitalize" }}>{sel.level} Risk</span>
                  </div>
                </div>
                <div style={{ height:12, borderRadius:6, background:T.input, overflow:"hidden", marginBottom:20 }}>
                  <div style={{ height:"100%", width:`${sel.score}%`, borderRadius:6, background:`linear-gradient(to right,#4ade80,#fbbf24,#f87171)`, transition:"width .5s" }} />
                </div>
                {/* Action Buttons */}
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={()=>setShowOverride(x=>!x)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${A1}`, background:`${A1}15`, color:A1, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Edit2 size={14} /> Override Score</button>
                  <button onClick={()=>resetScore(sel.id)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid #fbbf24`, background:`rgba(251,191,36,.1)`, color:"#fbbf24", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><RotateCcw size={14} /> Reset Score</button>
                  <button onClick={()=>lockScore(sel.id)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${sel.locked?"#4ade80":"#f87171"}`, background:sel.locked?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)", color:sel.locked?"#4ade80":"#f87171", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Lock size={14} /> {sel.locked?"Unlock":"Lock"} Score</button>
                  <button onClick={()=>forceRecalc(sel.id)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><RefreshCw size={14} style={{ animation:recalculating===sel.id?"spin 1s linear infinite":"none" }} /> Force Recalculate</button>
                </div>
                {showOverride && (
                  <div style={{ marginTop:16, display:"flex", gap:10, alignItems:"center" }}>
                    <input value={overrideVal} onChange={e=>setOverrideVal(e.target.value)} placeholder="Enter score (0–100)" type="number" style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }} />
                    <button onClick={applyOverride} style={{ padding:"8px 16px", borderRadius:8, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer" }}>Apply</button>
                  </div>
                )}
              </div>

              {/* Risk Factor Breakdown */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 16px" }}>Risk Score Breakdown — Why Flagged?</h3>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {sel.factors.map(f => (
                    <div key={f.name} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:180, fontSize:12, color:T.sub }}>{f.name}</div>
                      <div style={{ flex:1, height:6, borderRadius:3, background:T.input, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(100,(f.value/15)*100)}%`, borderRadius:3, background:A1, opacity:0.8 }} />
                      </div>
                      <div style={{ width:40, fontSize:12, color:T.text, textAlign:"right" }}>×{f.value}</div>
                      <div style={{ width:50, fontSize:12, color:T.sub, textAlign:"right" }}>w:{f.weight}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:0 }}>Risk Score History</h3>
                  <button onClick={()=>setExpandHistory(x=>!x)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer" }}>{expandHistory?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {(expandHistory?sel.history:sel.history.slice(0,3)).map((h,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, background:T.input }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:A1 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:T.text }}>{h.reason}</div>
                        <div style={{ fontSize:11, color:T.sub }}>{h.date}</div>
                      </div>
                      <div style={{ fontSize:16, fontWeight:700, color:h.score>=80?"#f87171":h.score>=60?"#f97316":h.score>=40?"#fbbf24":"#4ade80" }}>{h.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
