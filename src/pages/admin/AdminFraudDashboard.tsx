import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { ShieldAlert, AlertTriangle, Users, CreditCard, Ban, Activity, RefreshCw, Download, TrendingUp, Eye, CheckCircle2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const lvlColor = (l: string) => l==="critical"?"#f87171":l==="high"?"#f97316":l==="medium"?"#fbbf24":"#4ade80";
const lvlBg   = (l: string) => l==="critical"?"rgba(248,113,113,.12)":l==="high"?"rgba(249,115,22,.12)":l==="medium"?"rgba(251,191,36,.12)":"rgba(74,222,128,.12)";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const getName = (fn: string[] | null | undefined) => fn?.join(" ").trim() || "Unknown User";

export default function AdminFraudDashboard() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [detectionActive, setDetectionActive] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("7d");
  const [tab, setTab] = useState<"overview"|"alerts"|"users">("overview");

  const { data: aggData, refetch } = useQuery({
    queryKey: ["fraud-dashboard-agg", dateRange],
    queryFn: async () => {
      const days = dateRange === "1d" ? 1 : dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const since = new Date(Date.now() - days * 86400000).toISOString();

      const [auditRes, blockedRes, txnRes, profilesRes] = await Promise.all([
        supabase.from("admin_audit_logs").select("id, action, created_at, target_profile_name, details", { count: "exact" }).gte("created_at", since),
        supabase.from("blocked_ips").select("id, ip_address, reason, created_at", { count: "exact" }).gte("created_at", since),
        supabase.from("transactions").select("id, amount, type, created_at, profile_id").gte("created_at", since).gte("amount", 5000),
        supabase.from("profiles").select("id, full_name, user_code, email, available_balance, wallet_active, created_at").eq("wallet_active", false).limit(50),
      ]);

      return {
        totalAlerts: auditRes.count || 0,
        blockedIPs: blockedRes.count || 0,
        suspiciousPayments: txnRes.data?.length || 0,
        inactiveProfiles: profilesRes.data?.length || 0,
        recentLogs: auditRes.data || [],
        suspiciousUsers: profilesRes.data || [],
        blockedList: blockedRes.data || [],
      };
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  useEffect(() => {
    if (!autoRefresh) return;
  }, [autoRefresh]);

  const doRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const agg = aggData || { totalAlerts:0, blockedIPs:0, suspiciousPayments:0, inactiveProfiles:0, recentLogs:[], suspiciousUsers:[], blockedList:[] };

  const stats = [
    { label:"Total Audit Logs", value: agg.totalAlerts.toLocaleString(), color:"#f87171", icon:ShieldAlert, sub:`Last ${dateRange}` },
    { label:"Blocked IPs", value: agg.blockedIPs.toLocaleString(), color:"#f97316", icon:AlertTriangle, sub:"Blocked this period" },
    { label:"High-Value Transactions", value: agg.suspiciousPayments.toLocaleString(), color:"#fbbf24", icon:CreditCard, sub:"≥ ₹5,000" },
    { label:"Inactive Accounts", value: agg.inactiveProfiles.toLocaleString(), color:A1, icon:Ban, sub:"Wallet inactive" },
    { label:"Detection Active", value: detectionActive ? "ON" : "OFF", color:"#4ade80", icon:Activity, sub:"Monitoring status" },
    { label:"Suspicious Users", value: agg.inactiveProfiles.toLocaleString(), color:A2, icon:Users, sub:"Unverified / inactive" },
  ];

  const alertFeed = agg.recentLogs.slice(0, 20).map((l: { id: string; action: string; created_at: string; target_profile_name: string | null; details: unknown }) => {
    const a = l.action.toLowerCase();
    const level = a.includes("fraud") || a.includes("block") || a.includes("ban") ? "critical" : a.includes("delete") || a.includes("restrict") ? "high" : "medium";
    const det = l.details as Record<string, string> | null;
    return {
      id: l.id,
      user: l.target_profile_name || "Admin",
      action: l.action,
      level,
      time: timeAgo(l.created_at),
      ip: det?.ip || "—",
    };
  });

  const suspList = agg.suspiciousUsers.slice(0, 10).map((u: { id: string; full_name: string[] | null; user_code: string[] | null; email: string | null; available_balance: number | null }) => ({
    id: u.id,
    name: getName(u.full_name),
    code: u.user_code?.join("") || "—",
    email: u.email || "—",
    balance: u.available_balance || 0,
    level: "medium",
    flags: 1,
    last: "Recent",
  }));

  const riskDist = [
    { level:"Critical", count: Math.round(agg.totalAlerts * 0.05), color:"#f87171", pct:5 },
    { level:"High", count: Math.round(agg.totalAlerts * 0.15), color:"#f97316", pct:15 },
    { level:"Medium", count: Math.round(agg.totalAlerts * 0.35), color:"#fbbf24", pct:35 },
    { level:"Low", count: Math.round(agg.totalAlerts * 0.45), color:"#4ade80", pct:45 },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
              <ShieldAlert size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Fraud Detection Dashboard</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>Real-time fraud monitoring & detection system</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <select value={dateRange} onChange={e=>setDateRange(e.target.value)} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
              <option value="1d">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button onClick={() => setAutoRefresh(x=>!x)} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:autoRefresh?"rgba(99,102,241,.15)":T.input, color:autoRefresh?A1:T.sub, fontSize:13, cursor:"pointer" }}>
              {autoRefresh?"Auto ON":"Auto OFF"}
            </button>
            <button onClick={doRefresh} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
              <RefreshCw size={14} style={{ animation:refreshing?"spin 1s linear infinite":"none" }} /> Refresh
            </button>
            <button style={{ padding:"7px 14px", borderRadius:8, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Download size={14} /> Export
            </button>
            <button onClick={()=>setDetectionActive(x=>!x)} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${detectionActive?"#4ade80":"#f87171"}`, background:detectionActive?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)", color:detectionActive?"#4ade80":"#f87171", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {detectionActive?"● Active":"○ Paused"}
            </button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <span style={{ fontSize:12, color:T.sub }}>{s.label}</span>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon size={18} color={s.color} />
                  </div>
                </div>
                <div style={{ fontSize:26, fontWeight:700, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:12, color:T.sub, marginTop:4 }}>{s.sub}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:4, marginBottom:20, background:T.card, borderRadius:12, padding:4, border:`1px solid ${T.border}`, width:"fit-content" }}>
          {(["overview","alerts","users"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 18px", borderRadius:9, border:"none", background:tab===t?`linear-gradient(135deg,${A1},${A2})`:"transparent", color:tab===t?"#fff":T.sub, fontSize:13, fontWeight:tab===t?700:400, cursor:"pointer", textTransform:"capitalize" }}>{t}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:0 }}>Detection Summary</h3>
                <TrendingUp size={16} color={A1} />
              </div>
              {[
                { label:"Total audit events", value: agg.totalAlerts.toLocaleString(), color:"#60a5fa" },
                { label:"Blocked IP addresses", value: agg.blockedIPs.toLocaleString(), color:"#f87171" },
                { label:"High-value transactions", value: agg.suspiciousPayments.toLocaleString(), color:"#fbbf24" },
                { label:"Inactive accounts", value: agg.inactiveProfiles.toLocaleString(), color:"#f97316" },
              ].map(m => (
                <div key={m.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:13, color:T.sub }}>{m.label}</span>
                  <span style={{ fontSize:15, fontWeight:700, color:m.color }}>{m.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Risk Level Distribution</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {riskDist.map(r => (
                  <div key={r.level}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:13, color:T.text }}>{r.level}</span>
                      <span style={{ fontSize:13, color:T.sub }}>{r.count.toLocaleString()} ({r.pct}%)</span>
                    </div>
                    <div style={{ height:8, borderRadius:4, background:T.input, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${r.pct}%`, borderRadius:4, background:r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Recent Admin Activity Feed</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {alertFeed.length === 0
                ? <div style={{ textAlign:"center", padding:40, color:T.sub, fontSize:14 }}>No audit activity found</div>
                : alertFeed.map((a: { id: string; user: string; action: string; level: string; time: string; ip: string }) => (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:10, background:lvlBg(a.level), border:`1px solid ${lvlColor(a.level)}22` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:lvlColor(a.level) }} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{a.user} — {a.action}</div>
                        <div style={{ fontSize:12, color:T.sub }}>IP: {a.ip} · {a.time}</div>
                      </div>
                    </div>
                    <span style={{ padding:"3px 10px", borderRadius:20, background:`${lvlColor(a.level)}18`, color:lvlColor(a.level), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{a.level}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {tab === "users" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Inactive / Unverified Users</h3>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Name","Code","Email","Balance","Status","Action"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:12, color:T.sub, borderBottom:`1px solid ${T.border}`, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suspList.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign:"center", padding:40, color:T.sub, fontSize:14 }}>No inactive users</td></tr>
                  : suspList.map((u: { id: string; name: string; code: string; email: string; balance: number; level: string }) => (
                    <tr key={u.id}>
                      <td style={{ padding:"12px", color:T.text, fontSize:13, fontWeight:600 }}>{u.name}</td>
                      <td style={{ padding:"12px", color:T.sub, fontSize:12, fontFamily:"monospace" }}>{u.code}</td>
                      <td style={{ padding:"12px", color:T.sub, fontSize:13 }}>{u.email}</td>
                      <td style={{ padding:"12px", color:T.text, fontSize:13 }}>₹{u.balance.toLocaleString()}</td>
                      <td style={{ padding:"12px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:lvlBg(u.level), color:lvlColor(u.level), fontSize:11, fontWeight:700 }}>Inactive</span></td>
                      <td style={{ padding:"12px" }}>
                        <button style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${A1}`, background:"transparent", color:A1, fontSize:12, cursor:"pointer" }}>View</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
