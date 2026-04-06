import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, Search, CheckCircle2, XCircle, Clock, Eye, ChevronLeft, ChevronRight, Fingerprint, Landmark, User } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const PAGE_SIZE=10;

const AdminKycDashboard = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"aadhaar"|"bank">("aadhaar");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [comment, setComment] = useState("");

  const { data: aadhaarItems=[], isLoading: loadingA } = useQuery({
    queryKey:["admin-kyc-aadhaar"],
    queryFn: async () => {
      const { data } = await supabase
        .from("aadhaar_verifications")
        .select("*,profile:profile_id(id,full_name,user_code,user_type,email)")
        .order("created_at",{ascending:false})
        .limit(300);
      return data||[];
    },
  });

  const { data: bankItems=[], isLoading: loadingB } = useQuery({
    queryKey:["admin-kyc-bank"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_verifications")
        .select("*,profile:profile_id(id,full_name,user_code,user_type,email)")
        .order("created_at",{ascending:false})
        .limit(300);
      return data||[];
    },
  });

  const items = tab==="aadhaar" ? aadhaarItems : bankItems;
  const loading = tab==="aadhaar" ? loadingA : loadingB;

  const filtered = items.filter((i:any)=>{
    const q=search.toLowerCase();
    const name=(i.profile?.full_name||[]).join(" ").toLowerCase();
    const code=(i.profile?.user_code||[]).join("").toLowerCase();
    const matchQ=!q||name.includes(q)||code.includes(q);
    const matchF=filter==="all"||i.status===filter;
    return matchQ&&matchF;
  });

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const paginated=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  const pending=items.filter((i:any)=>i.status==="pending").length;
  const approved=items.filter((i:any)=>i.status==="approved").length;
  const rejected=items.filter((i:any)=>i.status==="rejected").length;

  const updateStatus = async (id:string, status:"approved"|"rejected") => {
    const table = tab==="aadhaar"?"aadhaar_verifications":"bank_verifications";
    const { error } = await supabase.from(table).update({ status, admin_notes: comment||null, reviewed_at: new Date().toISOString() }).eq("id",id);
    if(error) return toast.error("Update failed");
    toast.success(`KYC ${status}`);
    qc.invalidateQueries({queryKey:[tab==="aadhaar"?"admin-kyc-aadhaar":"admin-kyc-bank"]});
    setSelected(null); setComment("");
  };

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});
  const statusStyle=(s:string)=>{const m:Record<string,any>={pending:{c:"#fbbf24",bg:"rgba(251,191,36,.12)"},approved:{c:"#4ade80",bg:"rgba(74,222,128,.12)"},rejected:{c:"#f87171",bg:"rgba(248,113,113,.12)"}};return bs(m[s]?.c||"#94a3b8",m[s]?.bg||"rgba(148,163,184,.12)")};

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>KYC Unified Dashboard</h1>
        <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Review and approve Aadhaar + Bank verifications in one place</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
        {[{label:"Pending Review",value:pending,color:"#fbbf24"},{label:"Approved",value:approved,color:"#4ade80"},{label:"Rejected",value:rejected,color:"#f87171"}].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px", textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:28, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:0, marginBottom:18, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden", width:"fit-content" }}>
        {([["aadhaar","Aadhaar Verify",Fingerprint],["bank","Bank Verify",Landmark]] as any[]).map(([key,label,Icon])=>(
          <button key={key} onClick={()=>{setTab(key);setPage(1);}} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 20px",border:"none",cursor:"pointer",background:tab===key?A1:"transparent",color:tab===key?"#fff":T.sub,fontWeight:tab===key?700:500,fontSize:13,transition:"all .2s" }}>
            <Icon size={14}/> {label}
          </button>
        ))}
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",flex:1,minWidth:180 }}>
            <Search size={13} color={T.sub}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search by name or code..." style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:13,flex:1 }}/>
          </div>
          <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:13 }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["User","Type",tab==="aadhaar"?"Aadhaar No":"Account No","Status","Submitted","Action"].map(h=>(
                <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:T.sub,textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={6} style={{ padding:32,textAlign:"center",color:T.sub }}>Loading...</td></tr>}
              {!loading&&paginated.length===0&&<tr><td colSpan={6} style={{ padding:32,textAlign:"center",color:T.sub }}>No records found</td></tr>}
              {paginated.map((item:any)=>(
                <tr key={item.id} style={{ borderBottom:`1px solid ${T.border}20` }}>
                  <td style={{ padding:"11px 14px" }}>
                    <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{(item.profile?.full_name||[]).join(" ")||"User"}</div>
                    <div style={{ fontSize:11,color:T.sub }}>{(item.profile?.user_code||[]).join("")}</div>
                  </td>
                  <td style={{ padding:"11px 14px",fontSize:12,color:T.sub,textTransform:"capitalize" }}>{item.profile?.user_type||"—"}</td>
                  <td style={{ padding:"11px 14px",fontSize:12,color:T.text,fontFamily:"monospace" }}>
                    {tab==="aadhaar"?(item.aadhaar_number?"****"+item.aadhaar_number.slice(-4):"—"):(item.account_number?"****"+String(item.account_number).slice(-4):"—")}
                  </td>
                  <td style={{ padding:"11px 14px" }}><span style={statusStyle(item.status)}>{item.status}</span></td>
                  <td style={{ padding:"11px 14px",fontSize:12,color:T.sub }}>{safeFmt(item.created_at,"dd MMM yyyy")}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <button onClick={()=>{setSelected(item);setComment(item.admin_notes||"");}} style={{ background:`${A1}15`,border:`1px solid ${A1}33`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:A1,fontSize:12,display:"flex",alignItems:"center",gap:3 }}>
                      <Eye size={12}/> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages>1&&(
          <div style={{ padding:"12px 18px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,color:T.sub }}>{filtered.length} records</span>
            <div style={{ display:"flex",gap:6 }}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:T.text,fontSize:12 }}><ChevronLeft size={13}/></button>
              <span style={{ padding:"5px 10px",fontSize:12,color:T.sub }}>{page}/{totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:T.text,fontSize:12 }}><ChevronRight size={13}/></button>
            </div>
          </div>
        )}
      </div>

      {selected&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:themeKey==="black"?"#0f0f23":"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:28,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
              <h2 style={{ fontWeight:800,fontSize:17,color:T.text,margin:0 }}>KYC Review — {tab==="aadhaar"?"Aadhaar":"Bank"}</h2>
              <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub }}><XCircle size={20}/></button>
            </div>
            <div style={{ background:`${A1}08`,borderRadius:10,padding:"14px 16px",marginBottom:16 }}>
              <div style={{ fontWeight:700,fontSize:15,color:T.text,marginBottom:4 }}>{(selected.profile?.full_name||[]).join(" ")||"User"}</div>
              <div style={{ fontSize:12,color:T.sub }}>{selected.profile?.user_type} · {(selected.profile?.user_code||[]).join("")}</div>
            </div>
            {tab==="aadhaar"
              ? [["Aadhaar Number",selected.aadhaar_number||"—"],["Name on Aadhaar",selected.name_on_aadhaar||"—"],["Date of Birth",selected.date_of_birth||"—"],["Gender",selected.gender||"—"],["Status",selected.status]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex",gap:12,marginBottom:8 }}>
                    <span style={{ fontSize:12,color:T.sub,width:130,flexShrink:0 }}>{k}</span>
                    <span style={{ fontSize:13,color:T.text,fontWeight:600 }}>{v}</span>
                  </div>
                ))
              : [["Account Number",selected.account_number||"—"],["IFSC Code",selected.ifsc_code||"—"],["Bank Name",selected.bank_name||"—"],["Account Holder",selected.account_holder_name||"—"],["Status",selected.status]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex",gap:12,marginBottom:8 }}>
                    <span style={{ fontSize:12,color:T.sub,width:130,flexShrink:0 }}>{k}</span>
                    <span style={{ fontSize:13,color:T.text,fontWeight:600 }}>{v}</span>
                  </div>
                ))
            }
            <div style={{ marginTop:16 }}>
              <label style={{ fontSize:12,color:T.sub,display:"block",marginBottom:6 }}>Admin Comment</label>
              <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3} placeholder="Reason for approval/rejection..." style={{ width:"100%",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,resize:"vertical",boxSizing:"border-box" as any }}/>
            </div>
            <div style={{ display:"flex",gap:8,marginTop:16 }}>
              <button onClick={()=>setSelected(null)} style={{ flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",cursor:"pointer",color:T.text,fontWeight:600 }}>Cancel</button>
              <button onClick={()=>updateStatus(selected.id,"rejected")} style={{ flex:1,background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8,padding:"9px",cursor:"pointer",color:"#f87171",fontWeight:700 }}>Reject</button>
              <button onClick={()=>updateStatus(selected.id,"approved")} style={{ flex:2,background:"linear-gradient(135deg,#4ade80,#22c55e)",border:"none",borderRadius:8,padding:"9px",cursor:"pointer",color:"#000",fontWeight:700 }}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKycDashboard;
