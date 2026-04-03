import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { ClipboardList, Search, Download, Filter, User, Shield, CreditCard, LogIn, Activity } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const LOG_TYPES = ["admin","user","fraud","payment","login"];

const ALL_LOGS = [
  { id:1,  type:"fraud",   actor:"System",            target:"user_2841", action:"Risk score exceeded 90 — auto-flagged",          status:"critical", time:"2 min ago",  ip:"103.22.11.4" },
  { id:2,  type:"admin",   actor:"superadmin@site.com",target:"user_2841",action:"Account restricted — payment & login blocked",   status:"warning",  time:"3 min ago",  ip:"192.168.1.1" },
  { id:3,  type:"payment", actor:"user_5521",          target:"TXN-3391", action:"Duplicate payment attempt detected (×2)",         status:"critical", time:"7 min ago",  ip:"45.77.21.3" },
  { id:4,  type:"login",   actor:"user_1204",          target:"Auth",     action:"Failed login attempt #10 — account locked",       status:"warning",  time:"12 min ago", ip:"182.74.3.2" },
  { id:5,  type:"fraud",   actor:"System",             target:"user_8831",action:"VPN + proxy detected — session flagged",           status:"warning",  time:"20 min ago", ip:"103.55.8.1" },
  { id:6,  type:"user",    actor:"user_3391",          target:"Profile",  action:"Profile information changed 3× in 10 minutes",    status:"warning",  time:"35 min ago", ip:"192.168.0.1" },
  { id:7,  type:"admin",   actor:"admin@site.com",     target:"TXN-7741", action:"Payment marked as fraud — refund initiated",      status:"success",  time:"1 hr ago",   ip:"192.168.1.2" },
  { id:8,  type:"payment", actor:"user_7710",          target:"TXN-9933", action:"Unusual withdrawal amount ₹75,000 flagged",       status:"critical", time:"1 hr ago",   ip:"106.51.1.2" },
  { id:9,  type:"login",   actor:"user_4411",          target:"Auth",     action:"Login from new country: USA (usual: India)",      status:"warning",  time:"2 hrs ago",  ip:"49.204.1.5" },
  { id:10, type:"fraud",   actor:"System",             target:"user_9920",action:"Chargeback pattern detected — case opened",       status:"critical", time:"2 hrs ago",  ip:"103.22.11.7" },
  { id:11, type:"admin",   actor:"manager@site.com",   target:"Settings", action:"Fraud threshold updated: Risk score → 75",        status:"success",  time:"3 hrs ago",  ip:"192.168.1.3" },
  { id:12, type:"user",    actor:"user_2201",          target:"Account",  action:"Multiple device fingerprints detected (×4)",      status:"warning",  time:"4 hrs ago",  ip:"103.55.8.2" },
];

const typeColor = (t: string) => ({ admin:A1, user:"#60a5fa", fraud:"#f87171", payment:"#4ade80", login:"#fbbf24" }[t] || "#94a3b8");
const typeIcon = (t: string) => ({ admin:Shield, user:User, fraud:Activity, payment:CreditCard, login:LogIn }[t] || Activity);
const statusColor = (s: string) => s==="critical"?"#f87171":s==="warning"?"#fbbf24":"#4ade80";

export default function AdminFraudAuditLog() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [exportFormat, setExportFormat] = useState("csv");

  const filtered = ALL_LOGS.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase()) || l.target.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType==="all"||l.type===filterType;
    const matchStatus = filterStatus==="all"||l.status===filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = LOG_TYPES.map(t => ({ type:t, count:ALL_LOGS.filter(l=>l.type===t).length }));

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, marginBottom:28, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
              <ClipboardList size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Fraud Audit Log & Activity Tracking</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>Complete audit trail: admin, user, fraud, payment, and login activity</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <select value={exportFormat} onChange={e=>setExportFormat(e.target.value)} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
              <option value="csv">Export CSV</option>
              <option value="pdf">Export PDF</option>
              <option value="excel">Export Excel</option>
            </select>
            <button style={{ padding:"7px 16px", borderRadius:8, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Download size={14}/> Export
            </button>
          </div>
        </div>

        {/* Log Type Stats */}
        <div style={{ display:"flex", gap:12, marginBottom:24, overflowX:"auto" }}>
          {stats.map(s => {
            const Icon = typeIcon(s.type);
            return (
              <div key={s.type} onClick={()=>setFilterType(filterType===s.type?"all":s.type)} style={{ background:T.card, border:`1px solid ${filterType===s.type?typeColor(s.type):T.border}`, borderRadius:12, padding:"14px 20px", backdropFilter:"blur(10px)", cursor:"pointer", flexShrink:0, minWidth:120 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <Icon size={15} color={typeColor(s.type)} />
                  <span style={{ fontSize:11, color:T.sub, textTransform:"capitalize" }}>{s.type} Logs</span>
                </div>
                <div style={{ fontSize:22, fontWeight:700, color:typeColor(s.type) }}>{s.count}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:20, backdropFilter:"blur(10px)", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:220, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px" }}>
            <Search size={14} color={T.sub} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search action, actor, target…" style={{ border:"none", background:"transparent", color:T.text, fontSize:13, outline:"none", width:"100%" }} />
          </div>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
            <option value="all">All Types</option>
            {LOG_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)} Logs</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
            <option value="all">All Status</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
          </select>
          <select value={dateRange} onChange={e=>setDateRange(e.target.value)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <div style={{ marginLeft:"auto", fontSize:13, color:T.sub }}>{filtered.length} logs</div>
        </div>

        {/* Log Table */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:T.input }}>
                {["#","Type","Actor","Target","Action","Status","Time","IP"].map(h=>(
                  <th key={h} style={{ padding:"11px 12px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const Icon = typeIcon(l.type);
                return (
                  <tr key={l.id} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":T.input+"40" }}>
                    <td style={{ padding:"11px 12px", fontSize:12, color:T.sub }}>{l.id}</td>
                    <td style={{ padding:"11px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <Icon size={13} color={typeColor(l.type)} />
                        <span style={{ fontSize:11, color:typeColor(l.type), fontWeight:700, textTransform:"capitalize" }}>{l.type}</span>
                      </div>
                    </td>
                    <td style={{ padding:"11px 12px", fontSize:12, color:T.text }}>{l.actor}</td>
                    <td style={{ padding:"11px 12px", fontSize:12, color:A1 }}>{l.target}</td>
                    <td style={{ padding:"11px 12px", fontSize:12, color:T.text, maxWidth:280 }}>{l.action}</td>
                    <td style={{ padding:"11px 12px" }}><span style={{ padding:"2px 8px", borderRadius:10, background:`${statusColor(l.status)}15`, color:statusColor(l.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{l.status}</span></td>
                    <td style={{ padding:"11px 12px", fontSize:12, color:T.sub, whiteSpace:"nowrap" }}>{l.time}</td>
                    <td style={{ padding:"11px 12px", fontFamily:"monospace", fontSize:11, color:T.sub }}>{l.ip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:T.sub }}>No logs match your filters</div>}
        </div>
      </div>
    </div>
  );
}
