import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { BarChart2, Download, TrendingUp, TrendingDown, Calendar, Users, CreditCard, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const DAILY = [
  { day:"Mon", fraud:12, suspicious:28, resolved:8 },
  { day:"Tue", fraud:9,  suspicious:22, resolved:11 },
  { day:"Wed", fraud:18, suspicious:41, resolved:14 },
  { day:"Thu", fraud:15, suspicious:31, resolved:12 },
  { day:"Fri", fraud:22, suspicious:49, resolved:18 },
  { day:"Sat", fraud:8,  suspicious:18, resolved:6 },
  { day:"Sun", fraud:6,  suspicious:14, resolved:5 },
];

const FRAUD_TYPES = [
  { type:"Payment Fraud",        count:184, pct:35, color:"#f87171" },
  { type:"Account Takeover",     count:98,  pct:19, color:"#f97316" },
  { type:"Duplicate Payments",   count:76,  pct:15, color:"#fbbf24" },
  { type:"Refund Abuse",         count:62,  pct:12, color:"#a78bfa" },
  { type:"Identity Fraud",       count:54,  pct:10, color:"#60a5fa" },
  { type:"Chargeback Fraud",     count:46,  pct:9,  color:"#4ade80" },
];

const HIGH_RISK_USERS = [
  { name:"Rahul Sharma", score:91, incidents:7, blocked:true },
  { name:"Priya Mehta",  score:78, incidents:5, blocked:false },
  { name:"Ajay Kumar",   score:65, incidents:4, blocked:true },
  { name:"Sneha Patel",  score:52, incidents:3, blocked:false },
  { name:"Vikram Rao",   score:41, incidents:2, blocked:false },
];

const MONTHLY = [
  { month:"Oct", fraud:210, resolved:195, rate:92 },
  { month:"Nov", fraud:248, resolved:231, rate:93 },
  { month:"Dec", fraud:302, resolved:284, rate:94 },
  { month:"Jan", fraud:271, resolved:256, rate:94 },
  { month:"Feb", fraud:189, resolved:181, rate:96 },
  { month:"Mar", fraud:320, resolved:297, rate:93 },
];

export default function AdminFraudReports() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const [period, setPeriod] = useState<"daily"|"weekly"|"monthly">("daily");
  const [exportFmt, setExportFmt] = useState("pdf");

  const maxFraud = Math.max(...DAILY.map(d=>d.fraud));
  const maxMonth = Math.max(...MONTHLY.map(m=>m.fraud));

  const kpis = [
    { label:"Total Fraud Events",   value:"1,284", change:"+12%",  up:true,  color:"#f87171", icon:AlertTriangle },
    { label:"Resolved Cases",        value:"1,214", change:"+8%",   up:true,  color:"#4ade80", icon:CheckCircle2 },
    { label:"Avg Resolution Time",   value:"4.2h",  change:"-18%",  up:false, color:A1,        icon:Clock },
    { label:"High Risk Users",        value:"230",   change:"+5%",   up:true,  color:"#f97316", icon:Users },
    { label:"Payment Fraud",          value:"₹28.4L",change:"+22%",  up:true,  color:"#fbbf24", icon:CreditCard },
    { label:"Detection Accuracy",     value:"94.2%", change:"+1.8%", up:false, color:"#4ade80", icon:TrendingUp },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, marginBottom:28, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
              <BarChart2 size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Fraud Reports & Analytics</h1>
              <p style={{ fontSize:13, color:T.sub, margin:0 }}>Comprehensive fraud statistics with trend analysis and export</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ display:"flex", gap:4, background:T.card, borderRadius:10, padding:4, border:`1px solid ${T.border}` }}>
              {(["daily","weekly","monthly"] as const).map(p=>(
                <button key={p} onClick={()=>setPeriod(p)} style={{ padding:"6px 14px", borderRadius:7, border:"none", background:period===p?`linear-gradient(135deg,${A1},${A2})`:"transparent", color:period===p?"#fff":T.sub, fontSize:12, cursor:"pointer", textTransform:"capitalize" }}>{p}</button>
              ))}
            </div>
            <select value={exportFmt} onChange={e=>setExportFmt(e.target.value)} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }}>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button style={{ padding:"7px 16px", borderRadius:8, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Download size={14}/> Export {exportFmt.toUpperCase()}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginBottom:28 }}>
          {kpis.map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:12, color:T.sub }}>{k.label}</span>
                  <Icon size={16} color={k.color} />
                </div>
                <div style={{ fontSize:22, fontWeight:700, color:k.color }}>{k.value}</div>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                  {k.up ? <TrendingUp size={12} color="#f87171"/> : <TrendingDown size={12} color="#4ade80"/>}
                  <span style={{ fontSize:11, color:k.up?"#f87171":"#4ade80" }}>{k.change} vs last period</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
          {/* Daily Fraud Trend */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Daily Fraud Trend (This Week)</h3>
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:130, marginBottom:10 }}>
              {DAILY.map(d => (
                <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:11, color:"#f87171" }}>{d.fraud}</span>
                  <div style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <div style={{ width:"60%", borderRadius:3, background:"#f87171", height:`${(d.fraud/maxFraud)*80}px`, minHeight:4 }} />
                    <div style={{ width:"60%", borderRadius:3, background:A1, height:`${(d.suspicious/maxFraud)*80*0.6}px`, minHeight:4, opacity:0.5 }} />
                  </div>
                  <span style={{ fontSize:10, color:T.sub }}>{d.day}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:16, fontSize:12 }}>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:10, height:10, borderRadius:2, background:"#f87171" }}/> Fraud</span>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:10, height:10, borderRadius:2, background:A1, opacity:0.5 }}/> Suspicious</span>
            </div>
          </div>

          {/* Fraud Type Distribution */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Fraud Type Distribution</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {FRAUD_TYPES.map(f => (
                <div key={f.type}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:13, color:T.text }}>{f.type}</span>
                    <span style={{ fontSize:13, color:T.sub }}>{f.count} ({f.pct}%)</span>
                  </div>
                  <div style={{ height:8, borderRadius:4, background:T.input, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${f.pct*2.86}%`, borderRadius:4, background:f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          {/* Monthly Trend */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>Monthly Fraud Report</h3>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Month","Fraud Events","Resolved","Rate"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:12, color:T.sub, borderBottom:`1px solid ${T.border}`, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHLY.map(m => (
                  <tr key={m.month} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:"10px", fontSize:13, color:T.text, fontWeight:600 }}>{m.month}</td>
                    <td style={{ padding:"10px", fontSize:13, color:"#f87171", fontWeight:600 }}>{m.fraud}</td>
                    <td style={{ padding:"10px", fontSize:13, color:"#4ade80" }}>{m.resolved}</td>
                    <td style={{ padding:"10px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:50, height:5, borderRadius:3, background:T.input, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${m.rate}%`, background:"#4ade80", borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:12, color:"#4ade80", fontWeight:600 }}>{m.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* High Risk User Report */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 20px" }}>High Risk User Report</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {HIGH_RISK_USERS.map((u,i) => (
                <div key={u.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px", borderRadius:10, background:T.input }}>
                  <span style={{ fontSize:13, fontWeight:700, color:T.sub, width:20 }}>#{i+1}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{u.name}</div>
                    <div style={{ fontSize:12, color:T.sub }}>{u.incidents} incidents</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:60, height:6, borderRadius:3, background:T.border, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${u.score}%`, background:u.score>=80?"#f87171":u.score>=60?"#f97316":"#fbbf24", borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:u.score>=80?"#f87171":u.score>=60?"#f97316":"#fbbf24" }}>{u.score}</span>
                    {u.blocked && <span style={{ padding:"2px 8px", borderRadius:10, background:"rgba(248,113,113,.15)", color:"#f87171", fontSize:10, fontWeight:700 }}>BLOCKED</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
