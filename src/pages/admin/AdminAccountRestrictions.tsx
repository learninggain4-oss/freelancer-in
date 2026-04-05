import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Ban, Lock, UserX, UserCheck, Clock, Shield, MessageSquare, CreditCard, Wallet, History } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type RestrictedUser = { id:string; name:string; email:string; blockType:string; restrictions:string[]; blockedAt:string; expiresAt:string; reason:string; blockedBy:string; history:{ action:string; date:string; by:string }[] };

const USERS: RestrictedUser[] = [];

const BLOCK_TYPES = [
  { id:"temp",      label:"Temporary Block",  icon:Clock,       color:"#fbbf24", desc:"Block for limited time" },
  { id:"permanent", label:"Permanent Ban",     icon:Ban,         color:"#f87171", desc:"Permanent account ban" },
  { id:"freeze",    label:"Account Freeze",    icon:Lock,        color:"#60a5fa", desc:"Freeze without full block" },
];

const RESTRICTION_OPTS = [
  { id:"login",      label:"Login Restriction",       icon:Lock },
  { id:"payment",    label:"Payment Restriction",     icon:CreditCard },
  { id:"messaging",  label:"Messaging Restriction",   icon:MessageSquare },
  { id:"withdrawal", label:"Withdrawal Restriction",  icon:Wallet },
];

const blockTypeColor = (t: string) => t==="permanent"?"#f87171":t==="temporary"?"#fbbf24":t==="freeze"?"#60a5fa":"#4ade80";

export default function AdminAccountRestrictions() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [users, setUsers] = useState(USERS);
  const [selected, setSelected] = useState<RestrictedUser|null>(null);
  const [actionPanel, setActionPanel] = useState<string|null>(null);
  const [blockType, setBlockType] = useState("temporary");
  const [duration, setDuration] = useState("24h");
  const [reason, setReason] = useState("");
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [actionMsg, setActionMsg] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const applyAction = (userId: string, action: string) => {
    if (action==="Activate") {
      setUsers(u => u.map(x => x.id===userId ? {...x, blockType:"none", restrictions:[], reason:"—", blockedBy:"—"} : x));
      setActionMsg("Account activated successfully");
    } else if (action==="Block") {
      setUsers(u => u.map(x => x.id===userId ? {...x, blockType, restrictions:selectedRestrictions, reason, blockedBy:"admin@site.com"} : x));
      setActionMsg("Restrictions applied successfully");
    }
    setActionPanel(null); setReason(""); setSelectedRestrictions([]);
    setTimeout(()=>setActionMsg(""),3000);
  };

  const toggleRestriction = (id: string) => setSelectedRestrictions(r => r.includes(id)?r.filter(x=>x!==id):[...r,id]);

  const stats = [
    { label:"Permanently Banned", value:users.filter(u=>u.blockType==="permanent").length, color:"#f87171" },
    { label:"Temporarily Blocked", value:users.filter(u=>u.blockType==="temporary").length, color:"#fbbf24" },
    { label:"Account Frozen", value:users.filter(u=>u.blockType==="freeze").length, color:"#60a5fa" },
    { label:"Active Accounts", value:users.filter(u=>u.blockType==="none").length, color:"#4ade80" },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
            <Ban size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Account Blocking & Restrictions</h1>
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Block, freeze, suspend, or restrict users with granular controls</p>
          </div>
          {actionMsg && <div style={{ marginLeft:"auto", padding:"8px 16px", borderRadius:8, background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}>{actionMsg}</div>}
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
              <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>{s.label}</div>
              <div style={{ fontSize:30, fontWeight:700, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
          {/* Users Table */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:T.input }}>
                  {["User","Block Type","Restrictions","Blocked At","Expires","Reason","Actions"].map(h=>(
                    <th key={h} style={{ padding:"11px 12px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign:"center", padding:"48px 20px", color:T.sub, fontSize:14 }}>No restricted accounts</td></tr>
                  : users.map(u => (
                    <tr key={u.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:"14px 12px" }}>
                        <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{u.name}</div>
                        <div style={{ fontSize:11, color:T.sub }}>{u.email}</div>
                      </td>
                      <td style={{ padding:"14px 12px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:20, background:`${blockTypeColor(u.blockType)}15`, color:blockTypeColor(u.blockType), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{u.blockType==="none"?"Active":u.blockType}</span>
                      </td>
                      <td style={{ padding:"14px 12px" }}>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {u.restrictions.length===0 ? <span style={{ fontSize:11, color:T.sub }}>None</span> : u.restrictions.map(r => (
                            <span key={r} style={{ padding:"2px 8px", borderRadius:6, background:`${A1}15`, color:A1, fontSize:10, textTransform:"capitalize" }}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:12, color:T.sub }}>{u.blockedAt}</td>
                      <td style={{ padding:"14px 12px", fontSize:12, color:T.sub }}>{u.expiresAt}</td>
                      <td style={{ padding:"14px 12px", fontSize:12, color:T.sub, maxWidth:150 }}>
                        <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.reason}</div>
                      </td>
                      <td style={{ padding:"14px 12px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={()=>{setSelected(u);setActionPanel("block");}} style={{ padding:"5px 10px", borderRadius:7, border:`1px solid #f87171`, background:"rgba(248,113,113,.1)", color:"#f87171", fontSize:12, cursor:"pointer" }}>Restrict</button>
                          <button onClick={()=>applyAction(u.id,"Activate")} style={{ padding:"5px 10px", borderRadius:7, border:`1px solid #4ade80`, background:"rgba(74,222,128,.1)", color:"#4ade80", fontSize:12, cursor:"pointer" }}>Activate</button>
                          <button onClick={()=>{setSelected(u);setShowHistory(true);}} style={{ padding:"5px 8px", borderRadius:7, border:`1px solid ${T.border}`, background:T.input, color:T.sub, fontSize:12, cursor:"pointer" }}><History size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Block Type Cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {BLOCK_TYPES.map(bt => {
              const Icon = bt.icon;
              return (
                <div key={bt.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:18, backdropFilter:"blur(10px)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <Icon size={18} color={bt.color} />
                    <span style={{ fontSize:14, fontWeight:600, color:T.text }}>{bt.label}</span>
                  </div>
                  <div style={{ fontSize:12, color:T.sub }}>{bt.desc}</div>
                </div>
              );
            })}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:18, backdropFilter:"blur(10px)" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>Restriction Types</div>
              {RESTRICTION_OPTS.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                    <Icon size={15} color={A1} />
                    <span style={{ fontSize:13, color:T.sub, flex:1 }}>{r.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Restrict Modal */}
        {selected && actionPanel==="block" && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:480 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>Restrict: {selected.name}</h2>
                <button onClick={()=>{setSelected(null);setActionPanel(null);}} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>Block Type</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["temporary","permanent","freeze"].map(bt=>(
                    <button key={bt} onClick={()=>setBlockType(bt)} style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${blockType===bt?"#f87171":T.border}`, background:blockType===bt?"rgba(248,113,113,.1)":T.input, color:blockType===bt?"#f87171":T.sub, fontSize:12, cursor:"pointer", textTransform:"capitalize" }}>{bt}</button>
                  ))}
                </div>
              </div>
              {blockType==="temporary" && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>Duration</div>
                  <select value={duration} onChange={e=>setDuration(e.target.value)} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
                    {["1h","6h","24h","48h","72h","1week","1month"].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>Restrictions</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {RESTRICTION_OPTS.map(r=>(
                    <button key={r.id} onClick={()=>toggleRestriction(r.id)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${selectedRestrictions.includes(r.id)?A1:T.border}`, background:selectedRestrictions.includes(r.id)?`${A1}15`:T.input, color:selectedRestrictions.includes(r.id)?A1:T.sub, fontSize:12, cursor:"pointer" }}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>Reason</div>
                <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Enter block reason…" rows={2} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box" }} />
              </div>
              <button onClick={()=>applyAction(selected.id,"Block")} style={{ width:"100%", padding:"10px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer" }}>Apply Restrictions</button>
            </div>
          </div>
        )}

        {/* History Modal */}
        {selected && showHistory && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:420 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>Block History: {selected.name}</h2>
                <button onClick={()=>{setSelected(null);setShowHistory(false);}} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              {selected.history.length===0 ? (
                <div style={{ textAlign:"center", padding:24, color:T.sub }}>No history available</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {selected.history.map((h,i) => (
                    <div key={i} style={{ display:"flex", gap:12, padding:"12px", borderRadius:10, background:T.input }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:A1, marginTop:4, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:13, color:T.text, fontWeight:600 }}>{h.action}</div>
                        <div style={{ fontSize:12, color:T.sub }}>{h.date} · by {h.by}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
