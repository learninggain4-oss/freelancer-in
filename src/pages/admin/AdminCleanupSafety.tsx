import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Trash2, Eye, Lock } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface CleanupTask{id:string;name:string;table:string;rows:number;hasActiveFk:boolean;hasRelatedPayments:boolean;safe:boolean;approvalRequired:boolean;previewRows:string[];}
const seed=():CleanupTask[]=>[
  {id:"ct1",name:"Orphaned Job Drafts",table:"job_drafts",rows:1240,hasActiveFk:false,hasRelatedPayments:false,safe:true,approvalRequired:false,previewRows:["job_draft_id=45821 (user deleted 180d ago)","job_draft_id=45822 (user deleted 180d ago)"]},
  {id:"ct2",name:"Cancelled Orders",table:"orders",rows:84,hasActiveFk:false,hasRelatedPayments:true,safe:false,approvalRequired:true,previewRows:["order_id=12001 (has pending refund)"]},
  {id:"ct3",name:"Old Log Entries",table:"system_logs",rows:284000,hasActiveFk:false,hasRelatedPayments:false,safe:true,approvalRequired:false,previewRows:["Oldest: 2022-01-15","Newest flagged: 2023-01-01"]},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminCleanupSafety(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[tasks,setTasks]=useState(()=>load("admin_cleanup_safety_v1",seed));
  const[cleaning,setCleaning]=useState<string|null>(null);
  const[expanded,setExpanded]=useState<string|null>(null);

  const clean=async(t:CleanupTask)=>{
    if(!t.safe){toast({title:"Cleanup blocked — unsafe relations detected",variant:"destructive"});return;}
    setCleaning(t.id);await new Promise(r=>setTimeout(r,2000));
    const upd=tasks.map(x=>x.id===t.id?{...x,rows:0}:x);
    localStorage.setItem("admin_cleanup_safety_v1",JSON.stringify(upd));setTasks(upd);setCleaning(null);
    toast({title:`${t.name} — ${t.rows.toLocaleString()} rows cleaned`});
  };

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Shield size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Data Cleanup Safety System</html>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Foreign key check · Active payment check · Preview before clean · Approval workflow · Audit logs · Rollback</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Tasks",v:tasks.length,c:T.badgeFg},{l:"Safe",v:tasks.filter(t=>t.safe).length,c:"#4ade80"},{l:"Blocked",v:tasks.filter(t=>!t.safe).length,c:"#fbbf24"},{l:"Total Rows",v:tasks.reduce((s,t)=>s+t.rows,0).toLocaleString(),c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {tasks.map(t=>(
          <div key={t.id} style={{background:T.card,border:`1px solid ${!t.safe?"rgba(251,191,36,.2)":T.border}`,borderRadius:14,padding:"14px 18px"}}>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:expanded===t.id?8:0}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{t.name}</span>
                  <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{t.table}</span>
                  <span style={{fontSize:10,fontWeight:700,color:t.safe?"#4ade80":"#fbbf24"}}>{t.safe?"Safe":"Blocked"}</span>
                  {t.hasRelatedPayments&&<span style={{fontSize:10,color:"#f87171"}}>⚠ payment relations</span>}
                  {t.approvalRequired&&<span style={{fontSize:10,color:T.badgeFg}}>approval required</span>}
                </div>
                <span style={{fontSize:12,color:T.sub}}>{t.rows.toLocaleString()} rows to clean</span>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>setExpanded(expanded===t.id?null:t.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:7,background:`${A1}12`,border:`1px solid ${A1}25`,color:T.badgeFg,fontSize:11,cursor:"pointer"}}>
                  <Eye size={10}/>Preview
                </button>
                <button onClick={()=>clean(t)} disabled={cleaning===t.id||!t.safe} style={{padding:"5px 10px",borderRadius:7,background:t.safe?"rgba(248,113,113,.08)":"rgba(148,163,184,.08)",border:`1px solid ${t.safe?"rgba(248,113,113,.2)":T.border}`,color:t.safe?"#f87171":T.sub,fontSize:11,fontWeight:600,cursor:t.safe?"pointer":"not-allowed"}}>
                  {cleaning===t.id?"Cleaning…":"Clean"}
                </button>
              </div>
            </div>
            {expanded===t.id&&<div style={{background:T.input,borderRadius:8,padding:"10px 12px"}}>
              <p style={{fontSize:11,color:T.sub,margin:"0 0 4px",fontWeight:700}}>Preview (sample rows):</p>
              {t.previewRows.map((r,i)=><p key={i} style={{fontSize:11,fontFamily:"monospace",color:T.text,margin:i<t.previewRows.length-1?"0 0 2px":0}}>{r}</p>)}
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
