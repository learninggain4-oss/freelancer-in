import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, Search, Eye, IndianRupee, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { format } from "date-fns";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const GST=0.18;
const PAGE_SIZE=10;

const AdminInvoiceManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(format(new Date(),"yyyy-MM"));
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data: txns=[], isLoading } = useQuery({
    queryKey:["admin-invoices",month],
    queryFn: async () => {
      const start=`${month}-01`;
      const end=`${month}-31`;
      const { data } = await supabase
        .from("wallet_transactions")
        .select("id,amount,transaction_type,description,created_at,user_id,profile:user_id(full_name,user_code,email)")
        .gte("created_at",start)
        .lte("created_at",end+"T23:59:59")
        .order("created_at",{ascending:false})
        .limit(500);
      return (data||[]).map((t:any,i:number)=>({
        ...t,
        invoiceNo:`INV-${month.replace("-","")}-${String(i+1).padStart(4,"0")}`,
        gstAmount:Math.abs(Number(t.amount||0))*GST,
        netAmount:Math.abs(Number(t.amount||0))*(1+GST),
      }));
    },
  });

  const filtered=txns.filter((t:any)=>{
    const q=search.toLowerCase();
    const name=(t.profile?.full_name||[]).join(" ").toLowerCase();
    const mq=!q||name.includes(q)||t.invoiceNo.toLowerCase().includes(q)||t.transaction_type.toLowerCase().includes(q);
    const mf=filter==="all"||t.transaction_type===filter;
    return mq&&mf;
  });

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const paginated=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  const totalAmt=filtered.reduce((s:number,t:any)=>s+Math.abs(Number(t.amount||0)),0);
  const totalGST=totalAmt*GST;

  const generateInvoiceHTML=(t:any)=>{
    const amt=Math.abs(Number(t.amount||0));
    const gst=amt*GST;
    return `<!DOCTYPE html><html><head><title>Invoice ${t.invoiceNo}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#1e293b}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #6366f1;padding-bottom:20px;margin-bottom:30px}.logo{font-size:24px;font-weight:900;color:#6366f1}.invoice-no{font-size:18px;font-weight:700;color:#64748b}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f1f5f9;padding:10px;text-align:left;font-size:12px;text-transform:uppercase}td{padding:10px;border-bottom:1px solid #e2e8f0}.total-row{background:#f8faff;font-weight:700}.gst{color:#f59e0b}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8}</style></head><body><div class="header"><div class="logo">FreeLan.space</div><div class="invoice-no">${t.invoiceNo}</div></div><p><strong>Date:</strong> ${safeFmt(t.created_at,"dd MMM yyyy")}</p><p><strong>User:</strong> ${(t.profile?.full_name||[]).join(" ")||"User"}</p><p><strong>Transaction Type:</strong> ${t.transaction_type}</p><table><tr><th>Description</th><th>Amount</th></tr><tr><td>${t.description||t.transaction_type}</td><td>₹${amt.toFixed(2)}</td></tr><tr class="gst"><td>GST (18%)</td><td>₹${gst.toFixed(2)}</td></tr><tr class="total-row"><td>Total</td><td>₹${(amt+gst).toFixed(2)}</td></tr></table><div class="footer"><p>FreeLan.space — India's Freelancer Platform | CIN: U74999KL2024PTC000000 | GSTIN: 32AAAAA0000A1Z5</p><p>This is a computer-generated invoice and does not require a signature.</p></div></body></html>`;
  };

  const downloadInvoice=(t:any)=>{
    const html=generateInvoiceHTML(t);
    const blob=new Blob([html],{type:"text/html"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${t.invoiceNo}.html`;a.click();
    toast.success("Invoice downloaded");
  };

  const downloadAll=()=>{
    const rows=[["Invoice No","Type","User","Amount","GST 18%","Total","Date"],...filtered.map((t:any)=>[t.invoiceNo,t.transaction_type,(t.profile?.full_name||[]).join(" ")||"User",Math.abs(Number(t.amount||0)).toFixed(2),(Math.abs(Number(t.amount||0))*GST).toFixed(2),(Math.abs(Number(t.amount||0))*(1+GST)).toFixed(2),safeFmt(t.created_at,"dd/MM/yyyy")])];
    const csv=rows.map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=`Invoices_${month}.csv`;a.click();
    toast.success("All invoices exported");
  };

  const months=Array.from({length:12},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-i);return format(d,"yyyy-MM");});
  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  return (
    <div style={{ padding:"24px 16px", maxWidth:1000, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Invoice Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Auto-generated GST invoices for all platform transactions</p>
        </div>
        <button onClick={downloadAll} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Download size={14}/> Export All CSV
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[{label:"Total Invoices",value:filtered.length,color:"#6366f1"},{label:"Total Amount",value:`₹${totalAmt.toLocaleString("en-IN",{maximumFractionDigits:0})}`,color:"#4ade80"},{label:"Total GST",value:`₹${totalGST.toLocaleString("en-IN",{maximumFractionDigits:0})}`,color:"#f59e0b"}].map(s=>(
          <div key={s.label} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px",textAlign:"center" }}>
            <div style={{ fontWeight:800,fontSize:22,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12,color:T.sub,marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",flex:1,minWidth:160 }}>
            <Search size={13} color={T.sub}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search invoices..." style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:13,flex:1 }}/>
          </div>
          <select value={month} onChange={e=>{setMonth(e.target.value);setPage(1);}} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:13 }}>
            {months.map(m=><option key={m} value={m}>{format(new Date(m+"-01"),"MMMM yyyy")}</option>)}
          </select>
          <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:13 }}>
            <option value="all">All Types</option>
            <option value="commission">Commission</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="deposit">Deposit</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Invoice No","User","Type","Amount","GST (18%)","Total","Date","Actions"].map(h=><th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:T.sub,textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {isLoading&&<tr><td colSpan={8} style={{ padding:32,textAlign:"center",color:T.sub }}>Loading...</td></tr>}
              {!isLoading&&paginated.length===0&&<tr><td colSpan={8} style={{ padding:32,textAlign:"center",color:T.sub }}>No invoices found</td></tr>}
              {paginated.map((t:any)=>{
                const amt=Math.abs(Number(t.amount||0));
                return (
                  <tr key={t.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                    <td style={{ padding:"10px 14px",fontFamily:"monospace",fontSize:12,color:A1,fontWeight:700 }}>{t.invoiceNo}</td>
                    <td style={{ padding:"10px 14px",fontSize:13,color:T.text }}>{(t.profile?.full_name||[]).join(" ")||"User"}</td>
                    <td style={{ padding:"10px 14px" }}><span style={bs(A1,`${A1}15`)}>{t.transaction_type}</span></td>
                    <td style={{ padding:"10px 14px",fontSize:13,color:T.text,fontWeight:600 }}>₹{amt.toFixed(2)}</td>
                    <td style={{ padding:"10px 14px",fontSize:13,color:"#f59e0b" }}>₹{(amt*GST).toFixed(2)}</td>
                    <td style={{ padding:"10px 14px",fontSize:13,color:"#4ade80",fontWeight:700 }}>₹{(amt*(1+GST)).toFixed(2)}</td>
                    <td style={{ padding:"10px 14px",fontSize:12,color:T.sub }}>{safeFmt(t.created_at,"dd MMM")}</td>
                    <td style={{ padding:"10px 14px" }}>
                      <button onClick={()=>downloadInvoice(t)} style={{ background:`${A1}15`,border:`1px solid ${A1}33`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:A1,fontSize:12,display:"flex",alignItems:"center",gap:3 }}>
                        <Download size={11}/> Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages>1&&(
          <div style={{ padding:"12px 18px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,color:T.sub }}>{filtered.length} invoices</span>
            <div style={{ display:"flex",gap:6 }}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:T.text,fontSize:12 }}><ChevronLeft size={13}/></button>
              <span style={{ padding:"5px 10px",fontSize:12,color:T.sub }}>{page}/{totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:T.text,fontSize:12 }}><ChevronRight size={13}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvoiceManagement;
