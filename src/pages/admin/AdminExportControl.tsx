import { useState } from "react";
import { Download, AlertTriangle, CheckCircle2, Lock, FileText, Shield } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ExportRequest{id:string;requestedBy:string;dataType:string;status:"pending"|"approved"|"rejected"|"completed";sizeKb:number;maskPII:boolean;encrypted:boolean;requestedAt:string;approvedBy?:string;}
const seed=():ExportRequest[]=>[
  {id:"e1",requestedBy:"Admin A",dataType:"User Data (10k records)",status:"pending",sizeKb:4200,maskPII:true,encrypted:true,requestedAt:new Date(Date.now()-3600000).toISOString()},
  {id:"e2",requestedBy:"Support Team",dataType:"Transaction Logs",status:"approved",sizeKb:18400,maskPII:false,encrypted:true,requestedAt:new Date(Date.now()-86400000).toISOString(),approvedBy:"Super Admin"},
  {id:"e3",requestedBy:"Finance",dataType:"Commission Reports",status:"completed",sizeKb:1200,maskPII:false,encrypted:false,requestedAt:new Date(Date.now()-172800000).toISOString(),approvedBy:"Admin B"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={pending:"#fbbf24",approved:"#4ade80",rejected:"#f87171",completed:"#a5b4fc"};

export default function AdminExportControl(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[requests,setRequests]=useState(()=>load("admin_export_ctrl_v1",seed));
  const[acting,setActing]=useState<string|null>(null);
  const[maxSizeMB,setMaxSizeMB]=useState(50);

  const approve=async(id:string)=>{
    setActing(id);await new Promise(r=>setTimeout(r,600));
    const upd=requests.map(r=>r.id===id?{...r,status:"approved" as const,approvedBy:"Admin"}:r);
    localStorage.setItem("admin_export_ctrl_v1",JSON.stringify(upd));setRequests(upd);setActing(null);
    toast({title:"Export approved"});
  };
  const reject=async(id:string)=>{
    setActing(id);await new Promise(r=>setTimeout(r,400));
    const upd=requests.map(r=>r.id===id?{...r,status:"rejected" as const}:r);
    localStorage.setItem("admin_export_ctrl_v1",JSON.stringify(upd));setRequests(upd);setActing(null);
    toast({title:"Export rejected"});
  };

  const pending=requests.filter(r=>r.status==="pending").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Download size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Data Export Control System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Export permissions · Data masking · Approval workflow · Export logs · Size limit · Encryption · Audit trail</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Pending",v:pending,c:pending>0?"#fbbf24":"#4ade80"},{l:"Approved",v:requests.filter(r=>r.status==="approved").length,c:"#4ade80"},{l:"Max Size",v:`${maxSizeMB} MB`,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 18px",marginBottom:12,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:12,color:T.sub}}>Max export size (MB):</span>
        <input type="number" value={maxSizeMB} onChange={e=>setMaxSizeMB(+e.target.value)} style={{width:80,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:7,padding:"5px 8px",fontSize:12}}/>
        <button onClick={()=>toast({title:`Max export size set to ${maxSizeMB} MB`})} style={{padding:"6px 14px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer"}}>Save</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {requests.map(r=>(
          <div key={r.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{r.dataType}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[r.status],textTransform:"capitalize"}}>{r.status}</span>
                {r.maskPII&&<span style={{fontSize:10,color:"#4ade80"}}>PII masked</span>}
                {r.encrypted&&<span style={{fontSize:10,color:"#4ade80"}}>Encrypted</span>}
                <span style={{fontSize:10,color:T.sub}}>{(r.sizeKb/1024).toFixed(1)} MB</span>
              </div>
              <p style={{fontSize:12,color:T.sub,margin:0}}>By {r.requestedBy} · {format(new Date(r.requestedAt),"MMM d, HH:mm")}{r.approvedBy?` · Approved by ${r.approvedBy}`:""}</p>
            </div>
            {r.status==="pending"&&<div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>approve(r.id)} disabled={acting===r.id} style={{padding:"6px 12px",borderRadius:8,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>Approve</button>
              <button onClick={()=>reject(r.id)} disabled={acting===r.id} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>Reject</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
