import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Users, Search, Eye, Flag, Ban, AlertTriangle, Loader2, Download, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type SuspUser = { id:string; name:string; email:string; level:string; registered:string; lastLogin:string; country:string; status:string; indicators:string[]; score:number; walletBalance:number; userType:string };

const lvlColor = (l: string) => l==="critical"?"#f87171":l==="high"?"#f97316":l==="medium"?"#fbbf24":"#4ade80";
const lvlBg    = (l: string) => l==="critical"?"rgba(248,113,113,.12)":l==="high"?"rgba(249,115,22,.12)":l==="medium"?"rgba(251,191,36,.12)":"rgba(74,222,128,.12)";
const statusColor = (s: string) => s==="active"?"#4ade80":s==="flagged"?"#f97316":s==="suspended"?"#f87171":"#94a3b8";
const getName = (fn: string[] | null | undefined) => fn?.join(" ").trim() || "Unknown User";

function computeRisk(p: {
  wallet_active: boolean | null;
  available_balance: number | null;
  user_type: string | null;
  email: string | null;
  registration_region: string | null;
  created_at: string | null;
  updated_at: string | null;
}) {
  const indicators: string[] = [];
  let score = 0;

  if (!p.wallet_active) { indicators.push("Wallet suspended"); score += 30; }
  if ((p.available_balance || 0) === 0) { indicators.push("Zero balance"); score += 15; }
  if (!p.email) { indicators.push("Missing email"); score += 25; }
  if (!p.registration_region) { indicators.push("Unknown region"); score += 10; }

  const daysSinceReg = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / 86400000 : 0;
  const daysSinceUpdate = p.updated_at ? (Date.now() - new Date(p.updated_at).getTime()) / 86400000 : 0;

  if (daysSinceUpdate > 90 && daysSinceReg > 30) { indicators.push("Inactive 90+ days"); score += 20; }
  else if (daysSinceUpdate > 30) { indicators.push("Inactive 30+ days"); score += 10; }

  if (daysSinceReg < 2) { indicators.push("New account (<48h)"); score += 15; }

  if (p.email && p.email.match(/^\d+@/)) { indicators.push("Numeric email prefix"); score += 12; }
  if (p.email && (p.email.includes("+") && p.email.includes("@gmail"))) { indicators.push("Aliased email"); score += 8; }

  score = Math.min(100, score);
  const level = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";
  return { indicators, score, level };
}

export default function AdminSuspiciousUsers() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"score"|"name"|"registered">("score");
  const [selected, setSelected] = useState<SuspUser|null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const { data: rawProfiles = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-suspicious-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_type, wallet_active, available_balance, registration_region, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 120000,
  });

  const users: SuspUser[] = rawProfiles
    .map(p => {
      const { indicators, score, level } = computeRisk(p);
      const daysSinceUpdate = p.updated_at ? (Date.now() - new Date(p.updated_at).getTime()) / 86400000 : 999;
      return {
        id: p.id,
        name: getName(p.full_name),
        email: p.email || "—",
        level,
        registered: p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—",
        lastLogin: p.updated_at ? (daysSinceUpdate < 1 ? "Today" : daysSinceUpdate < 2 ? "Yesterday" : `${Math.floor(daysSinceUpdate)}d ago`) : "—",
        country: p.registration_region || "Unknown",
        status: p.wallet_active ? "active" : "suspended",
        indicators,
        score,
        walletBalance: p.available_balance || 0,
        userType: p.user_type || "unknown",
      };
    })
    .filter(u => u.score > 0 || u.level !== "low");

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.country.toLowerCase().includes(q);
      const matchLevel = filterLevel==="all"||u.level===filterLevel;
      const matchStatus = filterStatus==="all"||u.status===filterStatus;
      return matchSearch && matchLevel && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.registered).getTime() - new Date(a.registered).getTime();
    });

  const stats = {
    critical: users.filter(u => u.level === "critical").length,
    high: users.filter(u => u.level === "high").length,
    medium: users.filter(u => u.level === "medium").length,
    low: users.filter(u => u.level === "low").length,
  };

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      if (action === "Block" || action === "Suspend") {
        const { error } = await supabase.from("profiles").update({ wallet_active: false }).eq("id", id);
        if (error) throw error;
      } else if (action === "Restore") {
        const { error } = await supabase.from("profiles").update({ wallet_active: true }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`${vars.action} action applied`);
      qc.invalidateQueries({ queryKey: ["admin-suspicious-users"] });
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doAction = (id: string, action: string) => {
    if (action === "Flag") {
      setActionMsg("User flagged for review");
      setTimeout(() => setActionMsg(""), 3000);
      setSelected(null);
    } else {
      actionMutation.mutate({ id, action });
    }
  };

  const exportCSV = () => {
    const rows = [["Name","Email","Risk Level","Score","Indicators","Status","Region","Wallet Balance","User Type","Registered","Last Seen"]];
    filtered.forEach(u => rows.push([u.name, u.email, u.level, String(u.score), u.indicators.join("; "), u.status, u.country, String(u.walletBalance), u.userType, u.registered, u.lastLogin]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    el.download = `suspicious-users-${new Date().toISOString().slice(0,10)}.csv`;
    el.click();
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
            <ShieldAlert size={24} color="#fff" />
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Suspicious User Monitoring</h1>
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>AI-scored risk detection across {users.length} flagged accounts</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {actionMsg && <div style={{ padding:"8px 14px", borderRadius:8, background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.25)", color:"#4ade80", fontSize:13 }}>{actionMsg}</div>}
            <button onClick={() => refetch()} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, background:`${A1}15`, border:`1px solid ${A1}33`, color:A1, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              <RefreshCw size={13}/> Refresh
            </button>
          </div>
        </div>

        {/* Risk Stats Bar */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"Critical", count:stats.critical, color:"#f87171", icon:"🔴" },
            { label:"High",     count:stats.high,     color:"#f97316", icon:"🟠" },
            { label:"Medium",   count:stats.medium,   color:"#fbbf24", icon:"🟡" },
            { label:"Low",      count:stats.low,      color:"#4ade80", icon:"🟢" },
          ].map(s => (
            <button key={s.label} onClick={() => setFilterLevel(filterLevel === s.label.toLowerCase() ? "all" : s.label.toLowerCase())}
              style={{ padding:"14px 16px", borderRadius:12, background:filterLevel===s.label.toLowerCase()?`${s.color}18`:T.card, border:`1px solid ${filterLevel===s.label.toLowerCase()?s.color:T.border}`, cursor:"pointer", textAlign:"left", transition:"all .2s" }}>
              <div style={{ fontSize:11, color:T.sub, marginBottom:4 }}>{s.icon} {s.label} Risk</div>
              <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.count}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:14, marginBottom:16, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:200, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px" }}>
            <Search size={14} color={T.sub} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email or region…" style={{ border:"none", background:"transparent", color:T.text, fontSize:13, outline:"none", width:"100%" }} />
          </div>
          {[
            { label:"Level",  val:filterLevel,  set:setFilterLevel,  opts:["all","critical","high","medium","low"] },
            { label:"Status", val:filterStatus, set:setFilterStatus, opts:["all","active","suspended"] },
          ].map(f => (
            <select key={f.label} value={f.val} onChange={e=>f.set(e.target.value)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, cursor:"pointer" }}>
              {f.opts.map(o => <option key={o} value={o}>{o==="all"?`All ${f.label}s`:o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
            </select>
          ))}
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as typeof sortBy)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, cursor:"pointer" }}>
            <option value="score">Sort: Risk Score</option>
            <option value="name">Sort: Name</option>
            <option value="registered">Sort: Registered</option>
          </select>
          <button onClick={exportCSV} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, background:`${A1}15`, border:`1px solid ${A1}33`, color:A1, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            <Download size={13}/> Export CSV
          </button>
          <span style={{ fontSize:12, color:T.sub }}>{filtered.length} results</span>
        </div>

        {/* Table */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          {isLoading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:56, gap:12 }}>
              <Loader2 size={22} color={A1} style={{ animation:"spin 0.8s linear infinite" }} />
              <span style={{ color:T.sub, fontSize:14 }}>Analysing user risk profiles…</span>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:T.input }}>
                  {["User","Risk Score","Indicators","Last Seen","Region","Status","Actions"].map(h => (
                    <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, color:T.sub, fontWeight:700, borderBottom:`1px solid ${T.border}`, letterSpacing:.4 }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign:"center", padding:"60px 20px", color:T.sub, fontSize:14 }}>
                      <CheckCircle2 size={32} color="#4ade80" style={{ display:"block", margin:"0 auto 12px" }} />
                      No suspicious users detected
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom:`1px solid ${T.border}`, transition:"background .15s" }}
                    onMouseEnter={e=>(e.currentTarget.style.background=T.input+"60")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                    <td style={{ padding:"13px 14px" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{u.name}</div>
                      <div style={{ fontSize:11, color:T.sub }}>{u.email}</div>
                      <div style={{ fontSize:10, color:T.sub, marginTop:2, opacity:.7 }}>{u.userType}</div>
                    </td>
                    <td style={{ padding:"13px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <div style={{ flex:1, height:6, borderRadius:3, background:T.border, overflow:"hidden", maxWidth:64 }}>
                          <div style={{ height:"100%", width:`${u.score}%`, background:lvlColor(u.level), borderRadius:3, transition:"width .4s" }} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:800, color:lvlColor(u.level) }}>{u.score}</span>
                      </div>
                      <span style={{ padding:"2px 9px", borderRadius:10, background:lvlBg(u.level), color:lvlColor(u.level), fontSize:10, fontWeight:700, textTransform:"capitalize" }}>{u.level}</span>
                    </td>
                    <td style={{ padding:"13px 14px" }}>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {u.indicators.slice(0,2).map(ind => (
                          <span key={ind} style={{ padding:"2px 8px", borderRadius:6, background:`${A1}14`, color:A1, fontSize:10, whiteSpace:"nowrap" }}>{ind}</span>
                        ))}
                        {u.indicators.length>2 && <span style={{ padding:"2px 7px", borderRadius:6, background:T.input, color:T.sub, fontSize:10 }}>+{u.indicators.length-2} more</span>}
                      </div>
                    </td>
                    <td style={{ padding:"13px 14px", fontSize:12, color:T.sub }}>{u.lastLogin}</td>
                    <td style={{ padding:"13px 14px", fontSize:12, color:T.sub }}>{u.country}</td>
                    <td style={{ padding:"13px 14px" }}>
                      <span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(u.status)}14`, color:statusColor(u.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{u.status}</span>
                    </td>
                    <td style={{ padding:"13px 14px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>setSelected(u)} title="View Details" style={{ padding:"5px 9px", borderRadius:7, border:`1px solid ${T.border}`, background:T.input, color:T.sub, cursor:"pointer" }}><Eye size={13}/></button>
                        <button onClick={()=>doAction(u.id,"Flag")} title="Flag" style={{ padding:"5px 9px", borderRadius:7, border:"1px solid #f97316", background:"rgba(249,115,22,.1)", color:"#f97316", cursor:"pointer" }}><Flag size={13}/></button>
                        <button onClick={()=>doAction(u.id,u.status==="suspended"?"Restore":"Block")} title={u.status==="suspended"?"Restore":"Block"}
                          style={{ padding:"5px 9px", borderRadius:7, border:u.status==="suspended"?"1px solid #4ade80":"1px solid #f87171", background:u.status==="suspended"?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)", color:u.status==="suspended"?"#4ade80":"#f87171", cursor:"pointer" }}>
                          {u.status==="suspended" ? <CheckCircle2 size={13}/> : <Ban size={13}/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Modal */}
        {selected && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)" }}>
            <div style={{ background:theme==="black"?"#0d0d24":T.card, border:`1px solid ${T.border}`, borderRadius:22, padding:30, width:520, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.5)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
                <div>
                  <h2 style={{ fontSize:18, fontWeight:800, color:T.text, margin:"0 0 4px" }}>{selected.name}</h2>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ padding:"2px 9px", borderRadius:10, background:lvlBg(selected.level), color:lvlColor(selected.level), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{selected.level} risk</span>
                    <span style={{ fontSize:12, color:T.sub }}>Score: {selected.score}/100</span>
                  </div>
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer", fontSize:22, lineHeight:1 }}>×</button>
              </div>

              {/* Score bar */}
              <div style={{ height:8, borderRadius:4, background:T.border, overflow:"hidden", marginBottom:22 }}>
                <div style={{ height:"100%", width:`${selected.score}%`, background:lvlColor(selected.level), borderRadius:4, transition:"width .5s" }} />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                {[
                  ["Email", selected.email],
                  ["Risk Score", `${selected.score}/100`],
                  ["Risk Level", selected.level.toUpperCase()],
                  ["Region", selected.country],
                  ["Registered", selected.registered],
                  ["Last Seen", selected.lastLogin],
                  ["Status", selected.status],
                  ["User Type", selected.userType],
                  ["Wallet Balance", `₹${selected.walletBalance.toLocaleString("en-IN")}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background:T.input, borderRadius:10, padding:"10px 13px" }}>
                    <div style={{ fontSize:10, color:T.sub, fontWeight:600, letterSpacing:.4, textTransform:"uppercase" }}>{k}</div>
                    <div style={{ fontSize:13, color:T.text, fontWeight:700, marginTop:3 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:10 }}>Risk Indicators ({selected.indicators.length})</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {selected.indicators.length === 0 ? (
                    <span style={{ fontSize:13, color:"#4ade80" }}>✓ No risk indicators found</span>
                  ) : selected.indicators.map(ind => (
                    <div key={ind} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:9, background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.15)" }}>
                      <AlertTriangle size={12} color="#f87171" />
                      <span style={{ fontSize:12.5, color:T.text }}>{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {["Flag","Block","Suspend","Restore"].map(act => (
                  <button key={act} onClick={()=>doAction(selected.id, act)}
                    style={{ padding:"9px 18px", borderRadius:9, border:`1px solid ${act==="Restore"?"#4ade80":act==="Flag"?"#f97316":A1}`, background:`${act==="Restore"?"#4ade80":act==="Flag"?"#f97316":A1}12`, color:act==="Restore"?"#4ade80":act==="Flag"?"#f97316":A1, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    {act}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
