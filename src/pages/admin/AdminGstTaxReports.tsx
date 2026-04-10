import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, IndianRupee, Percent, Calendar, Filter, BarChart3, TrendingUp } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const GST_RATE = 0.18;
const TDS_RATE = 0.01;

const AdminGstTaxReports = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: txns=[], isLoading } = useQuery({
    queryKey:["admin-gst-txns", month],
    queryFn: async () => {
      const start = `${month}-01`;
      const end = format(endOfMonth(new Date(start)), "yyyy-MM-dd");
      const { data } = await supabase
        .from("wallet_transactions")
        .select("id,amount,transaction_type,description,created_at,user_id")
        .gte("created_at", start)
        .lte("created_at", end + "T23:59:59")
        .order("created_at",{ascending:false})
        .limit(1000);
      return data||[];
    },
  });

  const totalAmt = txns.reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);
  const gstAmt = totalAmt * GST_RATE;
  const tdsAmt = txns.filter((t:any)=>t.transaction_type==="withdrawal").reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0) * TDS_RATE;
  const commAmt = txns.filter((t:any)=>t.transaction_type==="commission").reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);

  const months = Array.from({length:12},(_,i)=>format(subMonths(new Date(),i),"yyyy-MM"));

  const downloadCSV = () => {
    const rows = [
      ["Txn ID","Type","Amount (₹)","GST 18% (₹)","TDS 1% (₹)","Date"],
      ...txns.map((t:any) => [
        t.id,
        t.transaction_type,
        Math.abs(Number(t.amount||0)).toFixed(2),
        (Math.abs(Number(t.amount||0))*GST_RATE).toFixed(2),
        t.transaction_type==="withdrawal"?(Math.abs(Number(t.amount||0))*TDS_RATE).toFixed(2):"0.00",
        safeFmt(t.created_at,"dd/MM/yyyy"),
      ])
    ];
    const csv = rows.map(r=>r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `GST_Report_${month}.csv`; a.click();
  };

  const fmt = (n:number) => `₹${n.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>GST & Tax Reports</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>India-specific GST (18%) and TDS (1%) transaction reports</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <select value={month} onChange={e=>setMonth(e.target.value)} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13 }}>
            {months.map(m=><option key={m} value={m}>{format(new Date(m+"-01"),"MMMM yyyy")}</option>)}
          </select>
          <button onClick={downloadCSV} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"8px 16px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <Download size={14}/> Download CSV
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:24 }}>
        {[
          { label:"Total Transactions",  value:fmt(totalAmt),  color:"#6366f1", icon:IndianRupee },
          { label:"GST Collected (18%)", value:fmt(gstAmt),    color:"#f59e0b", icon:Percent },
          { label:"TDS on Withdrawals",  value:fmt(tdsAmt),    color:"#f87171", icon:TrendingUp },
          { label:"Commission Revenue",  value:fmt(commAmt),   color:"#4ade80", icon:BarChart3 },
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:`${s.color}20`,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <s.icon size={18} color={s.color}/>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:17, color:T.text }}>{s.value}</div>
              <div style={{ fontSize:11, color:T.sub }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:14, color:T.text }}>
          Transaction Tax Breakdown — {format(new Date(month+"-01"),"MMMM yyyy")}
        </div>
        {isLoading && <div style={{ padding:32, textAlign:"center", color:T.sub }}>Loading...</div>}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Type","Amount","GST (18%)","TDS (1%)","Net","Date"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:T.sub, textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {txns.slice(0,50).map((t:any)=>{
                const amt = Math.abs(Number(t.amount||0));
                const gst = amt*GST_RATE;
                const tds = t.transaction_type==="withdrawal"?amt*TDS_RATE:0;
                return (
                  <tr key={t.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                    <td style={{ padding:"10px 14px" }}><span style={{ background:`${A1}15`, color:A1, border:`1px solid ${A1}33`, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{t.transaction_type}</span></td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:T.text, fontWeight:600 }}>{fmt(amt)}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:"#f59e0b" }}>{fmt(gst)}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:"#f87171" }}>{tds>0?fmt(tds):"—"}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:"#4ade80", fontWeight:700 }}>{fmt(amt-gst-tds)}</td>
                    <td style={{ padding:"10px 14px", fontSize:12, color:T.sub }}>{safeFmt(t.created_at,"dd MMM")}</td>
                  </tr>
                );
              })}
              {txns.length === 0 && !isLoading && <tr><td colSpan={6} style={{ padding:32, textAlign:"center", color:T.sub }}>No transactions for this period</td></tr>}
            </tbody>
          </table>
        </div>
        {txns.length > 50 && <div style={{ padding:"10px 18px", fontSize:12, color:T.sub, textAlign:"center" }}>Showing first 50 of {txns.length} — download CSV for full report</div>}
      </div>
    </div>
  );
};

export default AdminGstTaxReports;
