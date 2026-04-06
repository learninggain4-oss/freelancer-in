import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Users, Search, Eye, Flag, Ban, AlertTriangle, Loader2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type SuspUser = { id:string; name:string; email:string; level:string; registered:string; lastLogin:string; country:string; device:string; ip:string; status:string; indicators:string[]; score:number };

const lvlColor = (l: string) => l==="critical"?"#f87171":l==="high"?"#f97316":l==="medium"?"#fbbf24":"#4ade80";
const statusColor = (s: string) => s==="active"?"#4ade80":s==="flagged"?"#f97316":s==="suspended"?"#f87171":"#94a3b8";

const getName = (fn: string[] | null | undefined) => fn?.join(" ").trim() || "Unknown User";

export default function AdminSuspiciousUsers() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [selected, setSelected] = useState<SuspUser|null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const { data: rawProfiles = [], isLoading } = useQuery({
    queryKey: ["admin-suspicious-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_code, user_type, wallet_active, available_balance, registration_region, created_at, updated_at")
        .eq("wallet_active", false)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const users: SuspUser[] = rawProfiles.map(p => {
    const indicators: string[] = [];
    if (!p.wallet_active) indicators.push("Inactive wallet");
    if ((p.available_balance || 0) === 0) indicators.push("Zero balance");
    if (p.user_type === "employee") indicators.push("Freelancer");
    const score = Math.min(100, indicators.length * 25 + 10);
    const level = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
    return {
      id: p.id,
      name: getName(p.full_name),
      email: p.email || "—",
      level,
      registered: p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—",
      lastLogin: p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-IN") : "—",
      country: p.registration_region || "India",
      device: "Unknown",
      ip: "—",
      status: p.wallet_active ? "active" : "suspended",
      indicators,
      score,
    };
  });

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.ip.includes(search);
    const matchLevel = filterLevel==="all"||u.level===filterLevel;
    const matchStatus = filterStatus==="all"||u.status===filterStatus;
    const matchCountry = filterCountry==="all"||u.country===filterCountry;
    return matchSearch && matchLevel && matchStatus && matchCountry;
  });

  const doAction = (_id: string, action: string) => {
    setActionMsg(`${action} action noted — update status in user profile.`);
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
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Identify inactive accounts and suspicious behavior patterns</p>
          </div>
          {actionMsg && <div style={{ marginLeft:"auto", padding:"8px 16px", borderRadius:8, background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}>{actionMsg}</div>}
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:20, backdropFilter:"blur(10px)", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:200, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px" }}>
            <Search size={15} color={T.sub} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email…" style={{ border:"none", background:"transparent", color:T.text, fontSize:13, outline:"none", width:"100%" }} />
          </div>
          {[
            { label:"Risk Level", val:filterLevel, set:setFilterLevel, opts:["all","low","medium","high"] },
            { label:"Status",     val:filterStatus, set:setFilterStatus, opts:["all","active","suspended"] },
            { label:"Country",    val:filterCountry, set:setFilterCountry, opts:["all","India","USA"] },
          ].map(f => (
            <select key={f.label} value={f.val} onChange={e=>f.set(e.target.value)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, cursor:"pointer" }}>
              {f.opts.map(o => <option key={o} value={o}>{o==="all"?`All ${f.label}s`:o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
            </select>
          ))}
          <div style={{ marginLeft:"auto", fontSize:13, color:T.sub }}>{filtered.length} users</div>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
          {isLoading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48, gap:12 }}>
              <Loader2 size={20} color={A1} />
              <span style={{ color:T.sub, fontSize:14 }}>Loading suspicious users…</span>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:T.input }}>
                  {["User","Risk","Indicators","Registered","Region","Status","Actions"].map(h => (
                    <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign:"center", padding:"48px 20px", color:T.sub, fontSize:14 }}>
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
                    <td style={{ padding:"14px", fontSize:12, color:T.sub }}>{u.registered}</td>
                    <td style={{ padding:"14px", fontSize:12, color:T.sub }}>{u.country}</td>
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
          )}
        </div>

        {selected && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:500, maxHeight:"85vh", overflowY:"auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:18, fontWeight:700, color:T.text, margin:0 }}>{selected.name}</h2>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:20 }}>×</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                {[["Email",selected.email],["Risk Score",String(selected.score)],["Country",selected.country],["Registered",selected.registered],["Status",selected.status],["Level",selected.level]].map(([k,v])=>(
                  <div key={k} style={{ background:T.input, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:11, color:T.sub }}>{k}</div>
                    <div style={{ fontSize:13, color:T.text, fontWeight:600, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>Risk Indicators</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {selected.indicators.map(ind => (
                    <span key={ind} style={{ padding:"4px 12px", borderRadius:20, background:"rgba(248,113,113,.12)", color:"#f87171", fontSize:12 }}><AlertTriangle size={10} style={{display:"inline",marginRight:4}}/>{ind}</span>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {["Flag","Block","Suspend","Verify"].map(act => (
                  <button key={act} onClick={()=>doAction(selected.id, act)} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${A1}`, background:`${A1}15`, color:A1, fontSize:13, cursor:"pointer" }}>{act}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
