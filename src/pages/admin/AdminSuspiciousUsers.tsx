import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Users, Search, Filter, Eye, Flag, Ban, UserX, ShieldCheck, AlertTriangle } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type SuspUser = { id:string; name:string; email:string; level:string; registered:string; lastLogin:string; country:string; device:string; ip:string; status:string; indicators:string[]; score:number };

const USERS: SuspUser[] = [];

const lvlColor = (l: string) => l==="critical"?"#f87171":l==="high"?"#f97316":l==="medium"?"#fbbf24":"#4ade80";
const statusColor = (s: string) => s==="active"?"#4ade80":s==="flagged"?"#f97316":s==="suspended"?"#f87171":"#94a3b8";

export default function AdminSuspiciousUsers() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [users, setUsers] = useState(USERS);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [selected, setSelected] = useState<SuspUser|null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.ip.includes(search);
    const matchLevel = filterLevel==="all"||u.level===filterLevel;
    const matchStatus = filterStatus==="all"||u.status===filterStatus;
    const matchCountry = filterCountry==="all"||u.country===filterCountry;
    return matchSearch && matchLevel && matchStatus && matchCountry;
  });

  const doAction = (id: string, action: string) => {
    const statusMap: Record<string,string> = { Flag:"flagged", Block:"blocked", Suspend:"suspended", Verify:"active" };
    const newStatus = statusMap[action];
    if (newStatus) setUsers(u => u.map(x => x.id===id ? {...x, status:newStatus} : x));
    setActionMsg(`${action} applied to user`);
    setTimeout(() => setActionMsg(""), 3000);
    setSelected(null);
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
            <Users size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Suspicious User Monitoring</h1>
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Identify fake accounts, scam users, and suspicious behavior patterns</p>
          </div>
          {actionMsg && <div style={{ marginLeft:"auto", padding:"8px 16px", borderRadius:8, background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}>{actionMsg}</div>}
        </div>

        {/* Filters */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:20, backdropFilter:"blur(10px)", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:200, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px" }}>
            <Search size={15} color={T.sub} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, IP…" style={{ border:"none", background:"transparent", color:T.text, fontSize:13, outline:"none", width:"100%" }} />
          </div>
          {[
            { label:"Risk Level", val:filterLevel, set:setFilterLevel, opts:["all","low","medium","high","critical"] },
            { label:"Status",     val:filterStatus,  set:setFilterStatus,  opts:["all","active","flagged","suspended","blocked"] },
            { label:"Country",    val:filterCountry, set:setFilterCountry, opts:["all","India","USA"] },
          ].map(f => (
            <select key={f.label} value={f.val} onChange={e=>f.set(e.target.value)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, cursor:"pointer" }}>
              {f.opts.map(o => <option key={o} value={o}>{o==="all"?`All ${f.label}s`:o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
            </select>
          ))}
          <div style={{ marginLeft:"auto", fontSize:13, color:T.sub }}>{filtered.length} users</div>
        </div>

        {/* Table */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:T.input }}>
                {["User","Risk","Indicators","Last Login","Country","IP","Status","Actions"].map(h => (
                  <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign:"center", padding:"48px 20px", color:T.sub, fontSize:14 }}>
                    No suspicious users detected
                  </td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":T.input+"40" }}>
                  <td style={{ padding:"14px" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{u.name}</div>
                    <div style={{ fontSize:11, color:T.sub }}>{u.email}</div>
                  </td>
                  <td style={{ padding:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:50, height:5, borderRadius:3, background:T.border, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${u.score}%`, background:lvlColor(u.level), borderRadius:3 }} />
                      </div>
                      <span style={{ padding:"2px 8px", borderRadius:10, background:`${lvlColor(u.level)}18`, color:lvlColor(u.level), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{u.level}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px" }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {u.indicators.slice(0,2).map(ind => (
                        <span key={ind} style={{ padding:"2px 8px", borderRadius:6, background:`${A1}15`, color:A1, fontSize:10 }}>{ind}</span>
                      ))}
                      {u.indicators.length>2 && <span style={{ fontSize:10, color:T.sub }}>+{u.indicators.length-2}</span>}
                    </div>
                  </td>
                  <td style={{ padding:"14px", fontSize:12, color:T.sub }}>{u.lastLogin}</td>
                  <td style={{ padding:"14px", fontSize:12, color:T.sub }}>{u.country}</td>
                  <td style={{ padding:"14px", fontSize:12, color:T.sub, fontFamily:"monospace" }}>{u.ip}</td>
                  <td style={{ padding:"14px" }}>
                    <span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(u.status)}18`, color:statusColor(u.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{u.status}</span>
                  </td>
                  <td style={{ padding:"14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>setSelected(u)} title="View" style={{ padding:"5px 8px", borderRadius:7, border:`1px solid ${T.border}`, background:T.input, color:T.sub, cursor:"pointer" }}><Eye size={13}/></button>
                      <button onClick={()=>doAction(u.id,"Flag")} title="Flag" style={{ padding:"5px 8px", borderRadius:7, border:`1px solid #f97316`, background:"rgba(249,115,22,.1)", color:"#f97316", cursor:"pointer" }}><Flag size={13}/></button>
                      <button onClick={()=>doAction(u.id,"Block")} title="Block" style={{ padding:"5px 8px", borderRadius:7, border:`1px solid #f87171`, background:"rgba(248,113,113,.1)", color:"#f87171", cursor:"pointer" }}><Ban size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {selected && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:500, maxHeight:"85vh", overflowY:"auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:18, fontWeight:700, color:T.text, margin:0 }}>{selected.name}</h2>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                {[["Email",selected.email],["IP",selected.ip],["Device",selected.device],["Country",selected.country],["Registered",selected.registered],["Last Login",selected.lastLogin]].map(([k,v])=>(
                  <div key={k} style={{ background:T.input, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:11, color:T.sub }}>{k}</div>
                    <div style={{ fontSize:13, color:T.text, fontWeight:600, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>Fraud Indicators</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {selected.indicators.map(ind => (
                    <span key={ind} style={{ padding:"4px 12px", borderRadius:20, background:"rgba(248,113,113,.12)", color:"#f87171", fontSize:12 }}><AlertTriangle size={10} style={{display:"inline",marginRight:4}}/>{ind}</span>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {["Flag","Block","Suspend","Require Verification"].map(act => (
                  <button key={act} onClick={()=>doAction(selected.id, act.split(" ")[0])} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${A1}`, background:`${A1}15`, color:A1, fontSize:13, cursor:"pointer" }}>{act}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
