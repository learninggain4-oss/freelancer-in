import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { ClipboardList, Search, Download, User, Shield, CreditCard, LogIn, Activity, Loader2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const LOG_TYPES = ["admin","user","fraud","payment","login"];

const typeColor = (t: string) => ({ admin:A1, user:"#60a5fa", fraud:"#f87171", payment:"#4ade80", login:"#fbbf24" }[t] || "#94a3b8");
const typeIcon = (t: string) => ({ admin:Shield, user:User, fraud:Activity, payment:CreditCard, login:LogIn }[t] || Activity);
const statusColor = (s: string) => s==="critical"?"#f87171":s==="warning"?"#fbbf24":"#4ade80";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function classifyLog(action: string): { type: string; status: string } {
  const a = action.toLowerCase();
  if (a.includes("fraud") || a.includes("flag") || a.includes("risk") || a.includes("suspicious") || a.includes("chargeback")) return { type:"fraud", status:"critical" };
  if (a.includes("payment") || a.includes("transaction") || a.includes("withdraw") || a.includes("wallet")) return { type:"payment", status:"warning" };
  if (a.includes("login") || a.includes("auth") || a.includes("password") || a.includes("2fa")) return { type:"login", status:"warning" };
  if (a.includes("user") || a.includes("profile") || a.includes("register")) return { type:"user", status:"warning" };
  return { type:"admin", status:"success" };
}

export default function AdminFraudAuditLog() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [exportFormat, setExportFormat] = useState("csv");

  const { data: rawLogs = [], isLoading } = useQuery({
    queryKey: ["admin-fraud-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("id, action, admin_id, created_at, details, target_profile_id, target_profile_name")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const ALL_LOGS = rawLogs.map((l, i) => {
    const { type, status } = classifyLog(l.action);
    const det = l.details as Record<string, string> | null;
    return {
      id: i + 1,
      type,
      actor: l.target_profile_name || "Admin",
      target: l.target_profile_id?.slice(0, 8) || "—",
      action: l.action,
      status,
      time: timeAgo(l.created_at),
      ip: det?.ip || det?.ip_address || "—",
    };
  });

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

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
          {isLoading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48, gap:12 }}>
              <Loader2 size={20} color={A1} />
              <span style={{ color:T.sub, fontSize:14 }}>Loading audit logs…</span>
            </div>
          ) : (
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
          )}
          {!isLoading && filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:T.sub }}>No audit logs found</div>}
        </div>
      </div>
    </div>
  );
}
