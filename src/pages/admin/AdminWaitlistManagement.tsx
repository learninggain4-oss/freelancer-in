// @ts-nocheck
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, Search, Users, ChevronLeft, ChevronRight, CheckSquare, Square, UserCheck } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const PAGE_SIZE=15;

const AdminWaitlistManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: users=[], isLoading } = useQuery({
    queryKey:["admin-waitlist", filter, typeFilter],
    queryFn: async () => {
      let q=supabase.from("profiles").select("id,user_id,full_name,user_code,email,user_type,approval_status,created_at,phone").order("created_at",{ascending:false}).limit(500);
      if(filter!=="all") q=q.eq("approval_status",filter);
      if(typeFilter!=="all") q=q.eq("user_type",typeFilter);
      const { data } = await q;
      return data||[];
    },
  });

  const filtered=users.filter((u:any)=>{
    const q=search.toLowerCase();
    const name=(u.full_name||[]).join(" ").toLowerCase();
    const code=(u.user_code||[]).join("").toLowerCase();
    const email=(u.email||"").toLowerCase();
    return !q||name.includes(q)||code.includes(q)||email.includes(q);
  });

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const paginated=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  const counts={pending:users.filter((u:any)=>u.approval_status==="pending").length,approved:users.filter((u:any)=>u.approval_status==="approved").length,rejected:users.filter((u:any)=>u.approval_status==="rejected").length};

  const updateStatus=async(userIds:string[],status:string)=>{
    const{error}=await supabase.from("profiles").update({approval_status:status}).in("user_id",userIds);
    if(error)return toast.error("Update failed");
    toast.success(`${userIds.length} user(s) ${status}`);
    setSelected(new Set());
    qc.invalidateQueries({queryKey:["admin-waitlist"]});
  };

  const toggleSelect=(userId:string)=>{
    const ns=new Set(selected);
    if(ns.has(userId))ns.delete(userId);else ns.add(userId);
    setSelected(ns);
  };

  const toggleAll=()=>{
    if(selected.size===paginated.length)setSelected(new Set());
    else setSelected(new Set(paginated.map((u:any)=>u.user_id)));
  };

  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});
  const statusStyle=(s:string)=>{const m:Record<string,any>={pending:{c:"#fbbf24",bg:"rgba(251,191,36,.12)"},approved:{c:"#4ade80",bg:"rgba(74,222,128,.12)"},rejected:{c:"#f87171",bg:"rgba(248,113,113,.12)"}};return bs(m[s]?.c||"#94a3b8",m[s]?.bg||"rgba(148,163,184,.12)")};

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Waitlist Management</h1>
        <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Manage pending user approvals with bulk actions</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[{label:"Pending Approval",value:counts.pending,color:"#fbbf24",f:"pending"},{label:"Approved",value:counts.approved,color:"#4ade80",f:"approved"},{label:"Rejected",value:counts.rejected,color:"#f87171",f:"rejected"}].map(s=>(
          <div key={s.label} onClick={()=>{setFilter(s.f);setPage(1);}} style={{ background:T.card,border:`2px solid ${filter===s.f?s.color:T.border}`,borderRadius:12,padding:"16px",textAlign:"center",cursor:"pointer" }}>
            <div style={{ fontWeight:800,fontSize:28,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12,color:T.sub,marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {selected.size>0&&(
        <div style={{ background:`${A1}10`,border:`1px solid ${A1}33`,borderRadius:10,padding:"10px 18px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
          <span style={{ fontSize:13,color:T.text,fontWeight:600 }}>{selected.size} users selected</span>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>updateStatus(Array.from(selected),"approved")} style={{ background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.3)",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:"#4ade80",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:5 }}><CheckCircle2 size={13}/> Approve All</button>
            <button onClick={()=>updateStatus(Array.from(selected),"rejected")} style={{ background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:"#f87171",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:5 }}><XCircle size={13}/> Reject All</button>
            <button onClick={()=>setSelected(new Set())} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",color:T.sub,fontSize:13 }}>Clear</button>
          </div>
        </div>
      )}

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",flex:1,minWidth:180 }}>
            <Search size={13} color={T.sub}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search by name, code, email..." style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:13,flex:1 }}/>
          </div>
          <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:13 }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:13 }}>
            <option value="all">All Types</option>
            <option value="employee">Freelancer</option>
            <option value="employer">Employer</option>
          </select>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              <th style={{ padding:"10px 14px",width:40 }}>
                <button onClick={toggleAll} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub }}>
                  {selected.size===paginated.length&&paginated.length>0?<CheckSquare size={15} color={A1}/>:<Square size={15}/>}
                </button>
              </th>
              {["Name","Type","Email","Status","Joined","Actions"].map(h=><th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:T.sub,textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {isLoading&&<tr><td colSpan={7} style={{ padding:32,textAlign:"center",color:T.sub }}>Loading...</td></tr>}
              {!isLoading&&paginated.length===0&&<tr><td colSpan={7} style={{ padding:32,textAlign:"center",color:T.sub }}>No users found</td></tr>}
              {paginated.map((u:any)=>(
                <tr key={u.id} style={{ borderBottom:`1px solid ${T.border}20`,background:selected.has(u.user_id)?`${A1}06`:"transparent" }}>
                  <td style={{ padding:"10px 14px" }}>
                    <button onClick={()=>toggleSelect(u.user_id)} style={{ background:"none",border:"none",cursor:"pointer",color:T.sub }}>
                      {selected.has(u.user_id)?<CheckSquare size={15} color={A1}/>:<Square size={15}/>}
                    </button>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{(u.full_name||[]).join(" ")||"User"}</div>
                    <div style={{ fontSize:11,color:T.sub }}>{(u.user_code||[]).join("")||"—"}</div>
                  </td>
                  <td style={{ padding:"10px 14px" }}><span style={bs(u.user_type==="employee"?"#6366f1":"#f59e0b",u.user_type==="employee"?"rgba(99,102,241,.12)":"rgba(245,158,11,.12)")}>{u.user_type==="employee"?"Freelancer":"Employer"}</span></td>
                  <td style={{ padding:"10px 14px",fontSize:12,color:T.sub }}>{u.email||"—"}</td>
                  <td style={{ padding:"10px 14px" }}><span style={statusStyle(u.approval_status||"pending")}>{u.approval_status||"pending"}</span></td>
                  <td style={{ padding:"10px 14px",fontSize:12,color:T.sub }}>{safeFmt(u.created_at,"dd MMM yyyy")}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex",gap:5 }}>
                      {u.approval_status!=="approved"&&<button onClick={()=>updateStatus([u.user_id],"approved")} style={{ background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:6,padding:"4px 9px",cursor:"pointer",color:"#4ade80",fontSize:11,fontWeight:700 }}>Approve</button>}
                      {u.approval_status!=="rejected"&&<button onClick={()=>updateStatus([u.user_id],"rejected")} style={{ background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,padding:"4px 9px",cursor:"pointer",color:"#f87171",fontSize:11,fontWeight:700 }}>Reject</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages>1&&(
          <div style={{ padding:"12px 18px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,color:T.sub }}>{filtered.length} users</span>
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

export default AdminWaitlistManagement;
