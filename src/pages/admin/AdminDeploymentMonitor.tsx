import { useState } from "react";
import { Server, AlertTriangle, CheckCircle2, RefreshCw, Activity, Zap } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Deployment{id:string;version:string;environment:string;deployedAt:string;deployedBy:string;status:"success"|"failed"|"rolling-back"|"in-progress";rollbackAvailable:boolean;healthScore:number;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const DEPLOY_MON_KEY="admin_deploy_monitor_v1";
function seedDeploys():any[]{return[
  {id:"dm1",version:"v2.4.1",status:"live",deployedAt:new Date(Date.now()-3600000).toISOString(),deployedBy:"freeandin9@gmail.com",duration:145,healthChecks:4,passed:4,rollbackAvailable:true},
  {id:"dm2",version:"v2.4.0",status:"live",deployedAt:new Date(Date.now()-86400000).toISOString(),deployedBy:"freeandin9@gmail.com",duration:138,healthChecks:4,passed:4,rollbackAvailable:true},
  {id:"dm3",version:"v2.3.9",status:"rolled_back",deployedAt:new Date(Date.now()-172800000).toISOString(),deployedBy:"freeandin9@gmail.com",duration:92,healthChecks:4,passed:2,rollbackAvailable:false},
];}
const sColor={success:"#4ade80",failed:"#f87171","rolling-back":"#fbbf24","in-progress":"#a5b4fc"};

export default function AdminDeploymentMonitor(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[deploys,setDeploys]=useState<any[]>(()=>load(DEPLOY_MON_KEY,seedDeploys));
  const[rollingBack,setRollingBack]=useState<string|null>(null);

  const rollback=async(d:Deployment)=>{
    setRollingBack(d.id);
    const upd1=deploys.map(x=>x.id===d.id?{...x,status:"rolling-back" as const}:x);setDeploys(upd1);
    await new Promise(r=>setTimeout(r,2500));
    const upd2=deploys.map(x=>x.id===d.id?{...x,status:"success" as const,version:`${d.version}-rollback`}:x);
    localStorage.setItem("admin_deployments_v1",JSON.stringify(upd2));setDeploys(upd2);setRollingBack(null);
    toast({title:`Rolled back to ${d.version}`});
  };

  const failed=deploys.filter(d=>d.status==="failed").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Server size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Deployment Environment Monitor</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Health monitoring · Version tracking · Rollback · Environment verification · Smoke tests · Config validation</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Deployments",v:deploys.length,c:T.badgeFg},{l:"Failed",v:failed,c:failed>0?"#f87171":"#4ade80"},{l:"Health Score",v:`${deploys.filter(d=>d.status==="success").length>0?Math.round(deploys.filter(d=>d.status==="success").reduce((s,d)=>s+d.healthScore,0)/deploys.filter(d=>d.status==="success").length):0}%`,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {deploys.map(d=>(
          <div key={d.id} style={{background:T.card,border:`1px solid ${d.status==="failed"?"rgba(248,113,113,.25)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[d.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{d.version}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:4}}>{d.environment}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[d.status],textTransform:"capitalize"}}>{d.status.replace(/-/g," ")}</span>
                {d.status==="success"&&<span style={{fontSize:10,color:"#4ade80"}}>Health: {d.healthScore}%</span>}
              </div>
              <p style={{fontSize:12,color:T.sub,margin:0}}>By {d.deployedBy} · {safeDist(d.deployedAt)} ago</p>
            </div>
            {d.rollbackAvailable&&d.status!=="rolling-back"&&<button onClick={()=>rollback(d)} disabled={rollingBack===d.id} style={{padding:"6px 12px",borderRadius:8,background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)",color:"#fbbf24",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {rollingBack===d.id?"Rolling back…":"Rollback"}
            </button>}
          </div>
        ))}
      </div>
    </div>
  );
}
