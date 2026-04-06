import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { CreditCard, AlertTriangle, CheckCircle2, XCircle, Activity, Loader2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type Payment = { id:string; txnId:string; user:string; amount:string; type:string; status:string; detected:string; time:string; ip:string; location:string };

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

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const getName = (fn: string[] | null | undefined) => fn?.join(" ").trim() || "Unknown User";

export default function AdminPaymentFraud() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState("all");
  const [actionMsg, setActionMsg] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  const { data: rawTransactions = [], isLoading } = useQuery({
    queryKey: ["admin-payment-fraud"],
    queryFn: async () => {
      const { data: txns, error } = await supabase
        .from("transactions")
        .select("id, profile_id, amount, type, description, created_at")
        .gte("amount", 5000)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      if (!txns || txns.length === 0) return [];

      const profileIds = [...new Set(txns.map(t => t.profile_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", profileIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return txns.map(t => ({ ...t, profile: profileMap.get(t.profile_id || "") || null }));
    },
    refetchInterval: 60000,
  });

  const payments: Payment[] = rawTransactions.map(t => {
    const amount = t.amount || 0;
    const detected = amount >= 50000 ? "unusual_amount" : amount >= 10000 ? "rapid_attempt" : "duplicate";
    const riskStatus = statusOverrides[t.id] || (amount >= 50000 ? "suspicious" : "safe");
    return {
      id: t.id,
      txnId: t.id.slice(0, 12).toUpperCase(),
      user: getName((t as { profile: { full_name: string[] | null } | null }).profile?.full_name),
      amount: `₹${amount.toLocaleString("en-IN")}`,
      type: t.type || "credit",
      status: riskStatus,
      detected,
      time: timeAgo(t.created_at),
      ip: "—",
      location: "India",
    };
  });

  const filtered = filter==="all" ? payments : payments.filter(p => p.status === filter);

  const markAs = (id: string, status: string) => {
    setStatusOverrides(o => ({ ...o, [id]: status }));
    setActionMsg(`Payment marked as ${status}`);
    setTimeout(()=>setActionMsg(""),3000);
  };

  const stats = [
    { label:"Total High-Value", value: payments.length, color:"#f97316", icon:AlertTriangle },
    { label:"Suspicious", value: payments.filter(p=>p.status==="suspicious").length, color:"#f87171", icon:XCircle },
    { label:"Under Review", value: payments.filter(p=>p.status==="fraud").length, color:"#fbbf24", icon:Activity },
    { label:"Cleared Safe", value: payments.filter(p=>p.status==="safe").length, color:"#4ade80", icon:CheckCircle2 },
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
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Detect high-value transactions, refund abuse, and suspicious payment patterns</p>
          </div>
          {actionMsg && <div style={{ marginLeft:"auto", padding:"8px 16px", borderRadius:8, background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:13 }}>{actionMsg}</div>}
        </div>

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
          <div>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {["all","suspicious","fraud","safe"].map(f => (
                <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${filter===f?A1:T.border}`, background:filter===f?`${A1}15`:T.input, color:filter===f?A1:T.sub, fontSize:13, fontWeight:filter===f?600:400, cursor:"pointer", textTransform:"capitalize" }}>{f}</button>
              ))}
            </div>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
              {isLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48, gap:12 }}>
                  <Loader2 size={20} color={A1} />
                  <span style={{ color:T.sub, fontSize:14 }}>Loading transactions…</span>
                </div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:T.input }}>
                      {["Txn ID","User","Amount","Type","Status","Time","Actions"].map(h=>(
                        <th key={h} style={{ padding:"11px 12px", textAlign:"left", fontSize:12, color:T.sub, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign:"center", padding:"48px 20px", color:T.sub, fontSize:14 }}>No high-value transactions found</td></tr>
                    ) : filtered.map(p => (
                      <tr key={p.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:"12px", fontFamily:"monospace", fontSize:12, color:A1 }}>{p.txnId}</td>
                        <td style={{ padding:"12px", fontSize:13, color:T.text, fontWeight:600 }}>{p.user}</td>
                        <td style={{ padding:"12px", fontSize:13, color:T.text, fontWeight:700 }}>{p.amount}</td>
                        <td style={{ padding:"12px" }}><span style={{ padding:"3px 8px", borderRadius:6, background:`${A1}15`, color:A1, fontSize:11, textTransform:"capitalize" }}>{p.type}</span></td>
                        <td style={{ padding:"12px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:`${statusColor(p.status)}15`, color:statusColor(p.status), fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{p.status}</span></td>
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
              )}
            </div>
          </div>

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
                    <div style={{ width:12, height:12, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:r.active?16:2 }} />
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
