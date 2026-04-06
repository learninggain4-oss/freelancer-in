import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Search, Eye, EyeOff, Trash2, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1="#6366f1";
const PAGE_SIZE=10;

const AdminReviewManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: reviews=[], isLoading } = useQuery({
    queryKey:["admin-review-mgmt"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*,reviewer:reviewer_id(full_name,user_code,user_type),reviewee:reviewee_id(full_name,user_code,user_type)")
        .order("created_at",{ascending:false})
        .limit(500);
      return data||[];
    },
  });

  const filtered=reviews.filter((r:any)=>{
    const q=search.toLowerCase();
    const reviewerName=(r.reviewer?.full_name||[]).join(" ").toLowerCase();
    const revieweeName=(r.reviewee?.full_name||[]).join(" ").toLowerCase();
    const comment=(r.comment||"").toLowerCase();
    const mq=!q||reviewerName.includes(q)||revieweeName.includes(q)||comment.includes(q);
    const mf=filter==="all"||(filter==="visible"?r.is_visible!==false:r.is_visible===false)||(filter==="flagged"?r.is_flagged:!r.is_flagged);
    const mr=ratingFilter==="all"||String(r.rating)===ratingFilter;
    return mq&&(filter==="all"||mf)&&mr;
  });

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const paginated=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  const totalReviews=reviews.length;
  const avgRating=reviews.length>0?reviews.reduce((s:number,r:any)=>s+Number(r.rating||0),0)/reviews.length:0;
  const suspicious=reviews.filter((r:any)=>r.is_flagged||Number(r.rating||0)===5).length;

  const toggleVisibility=async(id:string,current:boolean)=>{
    const{error}=await supabase.from("reviews").update({is_visible:!current}).eq("id",id);
    if(error)return toast.error("Failed");
    toast.success(!current?"Review shown":"Review hidden");
    qc.invalidateQueries({queryKey:["admin-review-mgmt"]});
  };

  const flagReview=async(id:string,flagged:boolean)=>{
    const{error}=await supabase.from("reviews").update({is_flagged:!flagged}).eq("id",id);
    if(error)return toast.error("Failed");
    toast.success(!flagged?"Review flagged":"Flag removed");
    qc.invalidateQueries({queryKey:["admin-review-mgmt"]});
  };

  const deleteReview=async(id:string)=>{
    const{error}=await supabase.from("reviews").delete().eq("id",id);
    if(error)return toast.error("Delete failed");
    toast.success("Review deleted");
    qc.invalidateQueries({queryKey:["admin-review-mgmt"]});
  };

  const recalcRatings=()=>toast.info("Rating recalculation triggered (requires server function)");

  const stars=(n:number)=>Array.from({length:5},(_,i)=><Star key={i} size={11} fill={i<n?"#f59e0b":"none"} color="#f59e0b"/>);
  const bs=(c:string,bg:string)=>({background:bg,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700 as any});

  const FAKE_SIGNALS=(r:any)=>{
    const signals=[];
    if(Number(r.rating||0)===5&&!(r.comment))signals.push("⚠️ 5★ no comment");
    if((r.comment||"").length<10&&Number(r.rating||0)>=4)signals.push("⚠️ Short positive");
    return signals;
  };

  return (
    <div style={{ padding:"24px 16px", maxWidth:1000, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Review & Rating Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Moderate reviews, detect fake ratings, manage visibility</p>
        </div>
        <button onClick={recalcRatings} style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", cursor:"pointer", color:T.text, fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <RefreshCw size={13}/> Recalculate Ratings
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[{label:"Total Reviews",value:totalReviews,color:"#6366f1"},{label:"Avg Rating",value:`${avgRating.toFixed(1)} ★`,color:"#f59e0b"},{label:"Suspicious",value:suspicious,color:"#f87171"}].map(s=>(
          <div key={s.label} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px",textAlign:"center" }}>
            <div style={{ fontWeight:800,fontSize:26,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12,color:T.sub,marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",flex:1,minWidth:160 }}>
            <Search size={13} color={T.sub}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search reviews..." style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:13,flex:1 }}/>
          </div>
          <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:13 }}>
            <option value="all">All</option>
            <option value="flagged">Flagged</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <select value={ratingFilter} onChange={e=>{setRatingFilter(e.target.value);setPage(1);}} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:13 }}>
            <option value="all">All Ratings</option>
            {[5,4,3,2,1].map(n=><option key={n} value={String(n)}>{n} ★</option>)}
          </select>
        </div>
        <div>
          {isLoading&&<div style={{ padding:32,textAlign:"center",color:T.sub }}>Loading...</div>}
          {!isLoading&&paginated.length===0&&<div style={{ padding:32,textAlign:"center",color:T.sub }}>No reviews found</div>}
          {paginated.map((r:any)=>{
            const signals=FAKE_SIGNALS(r);
            return (
              <div key={r.id} style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}20`, display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5, flexWrap:"wrap" }}>
                    <div style={{ display:"flex", gap:1 }}>{stars(Number(r.rating||0))}</div>
                    <span style={{ fontSize:12, color:T.text, fontWeight:600 }}>{(r.reviewer?.full_name||[]).join(" ")||"Reviewer"}</span>
                    <span style={{ fontSize:11, color:T.sub }}>→</span>
                    <span style={{ fontSize:12, color:T.sub }}>{(r.reviewee?.full_name||[]).join(" ")||"Reviewee"}</span>
                    {r.is_flagged&&<span style={bs("#f87171","rgba(248,113,113,.12)")}>Flagged</span>}
                    {r.is_visible===false&&<span style={bs("#94a3b8","rgba(148,163,184,.12)")}>Hidden</span>}
                    {signals.map((s:string,i:number)=><span key={i} style={{ fontSize:11, color:"#f59e0b" }}>{s}</span>)}
                  </div>
                  <p style={{ fontSize:12, color:T.sub, margin:"4px 0 0", lineHeight:1.5 }}>{r.comment||<em style={{ opacity:.5 }}>No comment</em>}</p>
                  <div style={{ fontSize:11, color:T.sub, marginTop:4 }}>{safeFmt(r.created_at,"dd MMM yyyy")}</div>
                </div>
                <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                  <button onClick={()=>toggleVisibility(r.id,r.is_visible!==false)} title={r.is_visible===false?"Show":"Hide"} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 8px",cursor:"pointer",color:T.sub }}>{r.is_visible===false?<Eye size={12}/>:<EyeOff size={12}/>}</button>
                  <button onClick={()=>flagReview(r.id,r.is_flagged)} title="Flag" style={{ background:r.is_flagged?"rgba(248,113,113,.1)":T.input,border:`1px solid ${r.is_flagged?"rgba(248,113,113,.3)":T.border}`,borderRadius:6,padding:"5px 8px",cursor:"pointer",color:r.is_flagged?"#f87171":T.sub }}><Flag size={12}/></button>
                  <button onClick={()=>deleteReview(r.id)} title="Delete" style={{ background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,padding:"5px 8px",cursor:"pointer",color:"#f87171" }}><Trash2 size={12}/></button>
                </div>
              </div>
            );
          })}
        </div>
        {totalPages>1&&(
          <div style={{ padding:"12px 18px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,color:T.sub }}>{filtered.length} reviews</span>
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

export default AdminReviewManagement;
