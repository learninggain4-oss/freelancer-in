import { useState, useEffect } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { ShieldAlert, AlertTriangle, Users, CreditCard, Ban, Activity, RefreshCw, Download, TrendingUp, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const ALERTS_FEED: { id:number; user:string; action:string; level:string; time:string; ip:string }[] = [];

const TOP_SUSPICIOUS: { id:string; name:string; score:number; level:string; flags:number; last:string }[] = [];

const RISK_DIST: { level:string; count:number; color:string; pct:number }[] = [];

const TREND: { day:string; alerts:number }[] = [];

const lvlColor = (l: string) => l==="critical"?"#f87171":l==="high"?"#f97316":l==="medium"?"#fbbf24":"#4ade80";
const lvlBg   = (l: string) => l==="critical"?"rgba(248,113,113,.12)":l==="high"?"rgba(249,115,22,.12)":l==="medium"?"rgba(251,191,36,.12)":"rgba(74,222,128,.12)";

export default function AdminFraudDashboard() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [detectionActive, setDetectionActive] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("7d");
  const [tab, setTab] = useState<"overview"|"alerts"|"users">("overview");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => setTick(x => x+1), 30000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  const doRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const stats = [
    { label:"Total Alerts", value:"—", color:"#f87171", icon:ShieldAlert, sub:"No data" },
    { label:"High Risk Users", value:"—", color:"#f97316", icon:AlertTriangle, sub:"No data" },
    { label:"Suspicious Payments", value:"—", color:"#fbbf24", icon:CreditCard, sub:"No data" },
    { label:"Blocked Accounts", value:"—", color:A1, icon:Ban, sub:"No data" },
    { label:"Accuracy Rate", value:"—", color:"#4ade80", icon:Activity, sub:"No data" },
    { label:"Suspicious Users", value:"—", color:A2, icon:Users, sub:"No data" },
  ];

  const maxTrend = TREND.length > 0 ? Math.max(...TREND.map(t => t.alerts)) : 1;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
              <ShieldAlert size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Fraud Detection Dashboard</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>Real-time fraud monitoring & AI detection system</p>
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
            <button onClick={doRefresh} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
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

        {/* Stats Grid */}
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

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:20, background:T.card, borderRadius:12, padding:4, border:`1px solid ${T.border}`, width:"fit-content" }}>
          {(["overview","alerts","users"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 18px", borderRadius:9, border:"none", background:tab===t?`linear-gradient(135deg,${A1},${A2})`:"transparent", color:tab===t?"#fff":T.sub, fontSize:13, fontWeight:tab===t?700:400, cursor:"pointer", textTransform:"capitalize" }}>{t}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {/* Trend Chart */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:0 }}>Fraud Trends (7 days)</h3>
                <TrendingUp size={16} color={A1} />
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:120 }}>
                {TREND.map(t => (
                  <div key={t.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:11, color:T.sub }}>{t.alerts}</span>
                    <div style={{ width:"100%", borderRadius:6, background:`linear-gradient(to top,${A1},${A2})`, height:`${(t.alerts/maxTrend)*100}px`, minHeight:8, opacity:0.85 }} />
                    <span style={{ fontSize:11, color:T.sub }}>{t.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Distribution */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Risk Level Distribution</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {RISK_DIST.map(r => (
                  <div key={r.level}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:13, color:T.text }}>{r.level}</span>
                      <span style={{ fontSize:13, color:T.sub }}>{r.count.toLocaleString()} ({r.pct}%)</span>
                    </div>
                    <div style={{ height:8, borderRadius:4, background:T.input, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${r.pct}%`, borderRadius:4, background:r.color, transition:"width .5s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Real-Time Fraud Alerts Feed</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {ALERTS_FEED.length === 0
                ? <div style={{ textAlign:"center", padding:40, color:T.sub, fontSize:14 }}>No fraud alerts at this time</div>
                : ALERTS_FEED.map(a => (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:10, background:lvlBg(a.level), border:`1px solid ${lvlColor(a.level)}22` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:lvlColor(a.level), animation:"pulse 2s infinite" }} />
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
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Top Suspicious Users</h3>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["User","Risk Score","Level","Flags","Last Activity","Action"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:12, color:T.sub, borderBottom:`1px solid ${T.border}`, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_SUSPICIOUS.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign:"center", padding:40, color:T.sub, fontSize:14 }}>No suspicious users detected</td></tr>
                  : TOP_SUSPICIOUS.map(u => (
                    <tr key={u.id}>
                      <td style={{ padding:"12px", color:T.text, fontSize:13, fontWeight:600 }}>{u.name}</td>
                      <td style={{ padding:"12px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:60, height:6, borderRadius:3, background:T.input, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${u.score}%`, background:lvlColor(u.level), borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:13, color:lvlColor(u.level), fontWeight:700 }}>{u.score}</span>
                        </div>
                      </td>
                      <td style={{ padding:"12px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:lvlBg(u.level), color:lvlColor(u.level), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{u.level}</span></td>
                      <td style={{ padding:"12px", color:T.sub, fontSize:13 }}>{u.flags} flags</td>
                      <td style={{ padding:"12px", color:T.sub, fontSize:13 }}>{u.last}</td>
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
