import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { CreditCard, AlertTriangle, CheckCircle2, XCircle, Flag, RefreshCw, Bell, Snowflake, RotateCcw, Ban, Activity } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type Payment = { id:string; txnId:string; user:string; amount:string; type:string; status:string; detected:string; time:string; ip:string; location:string };

const PAYMENTS: Payment[] = [];

const DETECTION_RULES = [
  { label:"Duplicate Payment Detection", count:0, active:true },
  { label:"Rapid Payment Attempts", count:0, active:true },
  { label:"Unusual Payment Amount", count:0, active:true },
  { label:"Refund Abuse Detection", count:0, active:true },
  { label:"Chargeback Detection", count:0, active:true },
  { label:"Location Mismatch Detection", count:0, active:true },
  { label:"Failed Payment Pattern", count:0, active:false },
  { label:"Payment Frequency Monitor", count:0, active:true },
];

const statusColor = (s: string) => s==="fraud"?"#f87171":s==="suspicious"?"#f97316":"#4ade80";
const typeLabel = (t: string) => ({ duplicate:"Duplicate", unusual_amount:"Unusual Amount", rapid_attempt:"Rapid Attempt", refund_abuse:"Refund Abuse", location_mismatch:"Location Mismatch", failed_pattern:"Failed Pattern", chargeback:"Chargeback" }[t] || t);

export default function AdminPaymentFraud() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [payments, setPayments] = useState(PAYMENTS);
  const [filter, setFilter] = useState("all");
  const [actionMsg, setActionMsg] = useState("");

  const filtered = filter==="all"?payments:payments.filter(p=>p.status===filter);

  const markAs = (id: string, status: string) => {
    setPayments(p => p.map(x => x.id===id ? {...x, status} : x));
    setActionMsg(`Payment marked as ${status}`);
    setTimeout(()=>setActionMsg(""),3000);
  };

  const stats = [
    { label:"Total Suspicious", value:payments.filter(p=>p.status!=="safe").length, color:"#f97316", icon:AlertTriangle },
    { label:"Fraud Confirmed", value:payments.filter(p=>p.status==="fraud").length, color:"#f87171", icon:XCircle },
    { label:"Under Review", value:payments.filter(p=>p.status==="suspicious").length, color:"#fbbf24", icon:Activity },
    { label:"Cleared Safe", value:payments.filter(p=>p.status==="safe").length, color:"#4ade80", icon:CheckCircle2 },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
            <CreditCard size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Payment Fraud Detection</h1>
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Detect duplicate payments, refund abuse, chargebacks, and location mismatches</p>
          </div>
          {actionMsg && <div style={{ marginLeft:"auto", padding:"8px 16px", borderRadius:8, background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}>{actionMsg}</div>}
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, backdropFilter:"blur(10px)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:12, color:T.sub }}>{s.label}</span>
                  <Icon size={18} color={s.color} />
                </div>
                <div style={{ fontSize:28, fontWeight:700, color:s.color }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20 }}>
          {/* Payments Table */}
          <div>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {["all","suspicious","fraud","safe"].map(f => (
                <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${filter===f?A1:T.border}`, background:filter===f?`${A1}15`:T.input, color:filter===f?A1:T.sub, fontSize:13, fontWeight:filter===f?600:400, cursor:"pointer", textTransform:"capitalize" }}>{f}</button>
              ))}
            </div>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:T.input }}>
                    {["Txn ID","User","Amount","Detection","Status","Location","Time","Actions"].map(h=>(
                      <th key={h} style={{ padding:"11px 12px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:"12px", fontFamily:"monospace", fontSize:12, color:A1 }}>{p.txnId}</td>
                      <td style={{ padding:"12px", fontSize:13, color:T.text, fontWeight:600 }}>{p.user}</td>
                      <td style={{ padding:"12px", fontSize:13, color:T.text, fontWeight:700 }}>{p.amount}</td>
                      <td style={{ padding:"12px" }}><span style={{ padding:"3px 8px", borderRadius:6, background:`${A1}15`, color:A1, fontSize:11 }}>{p.detected}</span></td>
                      <td style={{ padding:"12px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(p.status)}15`, color:statusColor(p.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{p.status}</span></td>
                      <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{p.location}</td>
                      <td style={{ padding:"12px", fontSize:12, color:T.sub }}>{p.time}</td>
                      <td style={{ padding:"12px" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={()=>markAs(p.id,"safe")} title="Mark Safe" style={{ padding:"4px 8px", borderRadius:6, border:`1px solid #4ade80`, background:"rgba(74,222,128,.1)", color:"#4ade80", cursor:"pointer", fontSize:11 }}>✓</button>
                          <button onClick={()=>markAs(p.id,"suspicious")} title="Suspicious" style={{ padding:"4px 8px", borderRadius:6, border:`1px solid #fbbf24`, background:"rgba(251,191,36,.1)", color:"#fbbf24", cursor:"pointer", fontSize:11 }}>⚠</button>
                          <button onClick={()=>markAs(p.id,"fraud")} title="Fraud" style={{ padding:"4px 8px", borderRadius:6, border:`1px solid #f87171`, background:"rgba(248,113,113,.1)", color:"#f87171", cursor:"pointer", fontSize:11 }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detection Rules */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20, backdropFilter:"blur(10px)", height:"fit-content" }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:T.text, margin:"0 0 16px" }}>Detection Rules</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {DETECTION_RULES.map(r => (
                <div key={r.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:8, background:T.input }}>
                  <div>
                    <div style={{ fontSize:12, color:T.text }}>{r.label}</div>
                    <div style={{ fontSize:11, color:T.sub }}>{r.count} triggered</div>
                  </div>
                  <div style={{ width:30, height:16, borderRadius:8, background:r.active?A1:T.border, cursor:"pointer", position:"relative" }}>
                    <div style={{ width:12, height:12, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:r.active?16:2, transition:"left .2s" }} />
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
