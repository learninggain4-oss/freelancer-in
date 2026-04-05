import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, Eye, RotateCcw, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface ChangeRequest{id:string;field:string;table:string;oldValue:string;newValue:string;requestedBy:string;status:"pending"|"approved"|"rejected"|"rolled_back";risk:"low"|"medium"|"high";createdAt:string;reviewedAt?:string;reviewedBy?:string;rejectReason?:string;}

const seedChanges=():ChangeRequest[]=>[
  {id:"cr1",field:"platform_fee_pct",table:"config",oldValue:"10%",newValue:"12%",requestedBy:"Admin A",status:"pending",risk:"high",createdAt:new Date(Date.now()-1800000).toISOString()},
  {id:"cr2",field:"withdrawal_limit",table:"config",oldValue:"₹50,000",newValue:"₹25,000",requestedBy:"Admin B",status:"pending",risk:"high",createdAt:new Date(Date.now()-3600000).toISOString()},
  {id:"cr3",field:"kyc_required",table:"config",oldValue:"false",newValue:"true",requestedBy:"Admin A",status:"approved",risk:"medium",createdAt:new Date(Date.now()-86400000).toISOString(),reviewedAt:new Date(Date.now()-82800000).toISOString(),reviewedBy:"Super Admin"},
  {id:"cr4",field:"min_payout_amount",table:"config",oldValue:"₹100",newValue:"₹500",requestedBy:"Admin B",status:"rolled_back",risk:"medium",createdAt:new Date(Date.now()-172800000).toISOString(),reviewedAt:new Date(Date.now()-170000000).toISOString(),reviewedBy:"Super Admin",rejectReason:"User complaints — reverted to ₹100"},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={pending:"#fbbf24",approved:"#4ade80",rejected:"#f87171",rolled_back:"#fb923c"};
const riskColor={low:"#4ade80",medium:"#fbbf24",high:"#f87171"};

export default function AdminChangeApproval(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[tab,setTab]=useState<"pending"|"history">("pending");
  const[changes,setChanges]=useState<ChangeRequest[]>(()=>load("admin_change_approval_v1",seedChanges));
  const[approving,setApproving]=useState<string|null>(null);
  const[rejecting,setRejecting]=useState<string|null>(null);
  const[rolling,setRolling]=useState<string|null>(null);
  const[rejectNote,setRejectNote]=useState("");

  const approve=async(id:string)=>{
    setApproving(id);await new Promise(r=>setTimeout(r,700));
    const upd=changes.map(x=>x.id===id?{...x,status:"approved" as const,reviewedAt:new Date().toISOString(),reviewedBy:"Super Admin"}:x);
    localStorage.setItem("admin_change_approval_v1",JSON.stringify(upd));setChanges(upd);setApproving(null);
    const c=changes.find(x=>x.id===id)!;
    logAction("Change Approved",`${c.field}: ${c.oldValue} → ${c.newValue}`,"System","warning");
    toast({title:"Change approved and applied"});
  };

  const reject=async(id:string)=>{
    setRejecting(id);await new Promise(r=>setTimeout(r,700));
    const upd=changes.map(x=>x.id===id?{...x,status:"rejected" as const,reviewedAt:new Date().toISOString(),reviewedBy:"Super Admin",rejectReason:rejectNote||"Rejected by admin"}:x);
    localStorage.setItem("admin_change_approval_v1",JSON.stringify(upd));setChanges(upd);setRejecting(null);setRejectNote("");
    logAction("Change Rejected",changes.find(x=>x.id===id)?.field||"","System","warning");
    toast({title:"Change rejected"});
  };

  const rollback=async(id:string)=>{
    setRolling(id);await new Promise(r=>setTimeout(r,1000));
    const upd=changes.map(x=>x.id===id?{...x,status:"rolled_back" as const}:x);
    localStorage.setItem("admin_change_approval_v1",JSON.stringify(upd));setChanges(upd);setRolling(null);
    const c=changes.find(x=>x.id===id)!;
    logAction("Change Rolled Back",`${c.field} restored to ${c.oldValue}`,"System","warning");
    toast({title:`${c.field} rolled back to ${c.oldValue}`});
  };

  const pending=changes.filter(c=>c.status==="pending");
  const history=changes.filter(c=>c.status!=="pending");

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <ShieldCheck size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Change Approval & Audit System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Approval workflow · Edit permissions · Role restrictions · Change history · Rollback · Audit trail</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Pending Approval",v:pending.length,c:pending.length>0?"#fbbf24":"#4ade80"},{l:"Approved",v:changes.filter(c=>c.status==="approved").length,c:"#4ade80"},{l:"Rolled Back",v:changes.filter(c=>c.status==="rolled_back").length,c:"#fb923c"},{l:"Total Changes",v:changes.length,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["pending","Pending",Clock],["history","History",FileText]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}{t==="pending"&&pending.length>0&&<span style={{background:"#fbbf24",color:"#000",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800}}>{pending.length}</span>}
          </button>
        ))}
      </div>

      {tab==="pending"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {pending.length===0&&<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"24px",textAlign:"center"}}><p style={{color:T.sub,margin:0}}>No pending changes — all clear</p></div>}
          {pending.map(c=>(
            <div key={c.id} style={{background:T.card,border:`1px solid rgba(251,191,36,.2)`,borderRadius:14,padding:"16px 18px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{c.field}</span>
                    <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5}}>{c.table}</span>
                    <span style={{fontSize:10,fontWeight:700,color:riskColor[c.risk],background:`${riskColor[c.risk]}15`,padding:"2px 7px",borderRadius:5}}>{c.risk} risk</span>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:12,background:"rgba(248,113,113,.1)",color:"#f87171",padding:"3px 10px",borderRadius:6,fontFamily:"monospace"}}>{c.oldValue}</span>
                    <span style={{fontSize:12,color:T.sub}}>→</span>
                    <span style={{fontSize:12,background:"rgba(74,222,128,.1)",color:"#4ade80",padding:"3px 10px",borderRadius:6,fontFamily:"monospace"}}>{c.newValue}</span>
                  </div>
                  <p style={{fontSize:12,color:T.sub,margin:0}}>Requested by {c.requestedBy} · {safeDist(c.createdAt)} ago</p>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <Input value={rejectNote} onChange={e=>setRejectNote(e.target.value)} placeholder="Rejection reason (optional)…" style={{background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,fontSize:12,flex:1,minWidth:180}}/>
                <button onClick={()=>approve(c.id)} disabled={approving===c.id} style={{padding:"7px 16px",borderRadius:8,background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.25)",color:"#4ade80",fontSize:12,fontWeight:700,cursor:"pointer"}}>{approving===c.id?"…":"Approve"}</button>
                <button onClick={()=>reject(c.id)} disabled={rejecting===c.id} style={{padding:"7px 16px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:12,fontWeight:700,cursor:"pointer"}}>{rejecting===c.id?"…":"Reject"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="history"&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
          {history.map((c,i)=>(
            <div key={c.id} style={{display:"flex",gap:12,padding:"13px 18px",borderBottom:i<history.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:sColor[c.status],flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:1,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:T.text}}>{c.field}</span>
                  <span style={{fontSize:10,color:T.sub}}>{c.oldValue} → {c.newValue}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[c.status],textTransform:"capitalize"}}>{c.status.replace("_"," ")}</span>
                </div>
                <p style={{fontSize:11,color:T.sub,margin:0}}>By {c.requestedBy}{c.reviewedBy?` · Reviewed by ${c.reviewedBy}`:""}{c.rejectReason?` · ${c.rejectReason}`:""}</p>
              </div>
              {c.status==="approved"&&<button onClick={()=>rollback(c.id)} disabled={rolling===c.id} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,background:"rgba(251,114,36,.08)",border:"1px solid rgba(251,114,36,.2)",color:"#fb923c",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                <RotateCcw size={10}/>{rolling===c.id?"…":"Rollback"}
              </button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
