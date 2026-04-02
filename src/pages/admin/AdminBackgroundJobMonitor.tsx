import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Cpu, Pause } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface BgJob{id:string;name:string;type:string;status:"running"|"stuck"|"completed"|"failed";startedAt:string;progress:number;memoryMB:number;pid:number;canKill:boolean;}
const seed=():BgJob[]=>[
  {id:"bj1",name:"Monthly Report Generation",type:"report",status:"running",startedAt:new Date(Date.now()-1800000).toISOString(),progress:72,memoryMB:284,pid:12481,canKill:true},
  {id:"bj2",name:"Database Cleanup",type:"cleanup",status:"stuck",startedAt:new Date(Date.now()-7200000).toISOString(),progress:45,memoryMB:128,pid:12052,canKill:true},
  {id:"bj3",name:"Email Campaign Send",type:"email",status:"completed",startedAt:new Date(Date.now()-3600000).toISOString(),progress:100,memoryMB:0,pid:0,canKill:false},
  {id:"bj4",name:"Backup Upload",type:"backup",status:"failed",startedAt:new Date(Date.now()-86400000).toISOString(),progress:0,memoryMB:0,pid:0,canKill:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={running:"#4ade80",stuck:"#fbbf24",completed:"#a5b4fc",failed:"#f87171"};

export default function AdminBackgroundJobMonitor(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[jobs,setJobs]=useState(()=>load("admin_bg_jobs_v1",seed));
  const[killing,setKilling]=useState<string|null>(null);

  const kill=async(j:BgJob)=>{
    setKilling(j.id);await new Promise(r=>setTimeout(r,800));
    const upd=jobs.map(x=>x.id===j.id?{...x,status:"failed" as const,progress:0,memoryMB:0,pid:0}:x);
    localStorage.setItem("admin_bg_jobs_v1",JSON.stringify(upd));setJobs(upd);setKilling(null);
    toast({title:`${j.name} (PID ${j.pid}) killed`});
  };

  const stuck=jobs.filter(j=>j.status==="stuck").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Cpu size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Background Job Monitoring</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Real-time status · Stuck job detection · Memory monitoring · Kill switch · Progress tracking · Retry</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Jobs",v:jobs.length,c:T.badgeFg},{l:"Stuck",v:stuck,c:stuck>0?"#fbbf24":"#4ade80"},{l:"Running",v:jobs.filter(j=>j.status==="running").length,c:"#4ade80"},{l:"Total Memory",v:`${jobs.reduce((s,j)=>s+j.memoryMB,0)} MB`,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {jobs.map(j=>(
          <div key={j.id} style={{background:T.card,border:`1px solid ${j.status==="stuck"?"rgba(251,191,36,.2)":j.status==="failed"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{j.name}</span>
                <span style={{fontSize:10,color:T.sub}}>{j.type}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[j.status],textTransform:"capitalize"}}>{j.status}</span>
                {j.pid>0&&<span style={{fontSize:10,color:T.sub}}>PID: {j.pid}</span>}
                {j.memoryMB>0&&<span style={{fontSize:10,color:T.sub}}>{j.memoryMB} MB</span>}
              </div>
              {(j.status==="running"||j.status==="stuck")&&<div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,color:T.sub}}>Progress: {j.progress}%</span>
                  <span style={{fontSize:11,color:T.sub}}>Running {formatDistanceToNow(new Date(j.startedAt))}</span>
                </div>
                <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,.07)"}}>
                  <div style={{height:"100%",borderRadius:4,background:j.status==="stuck"?"#fbbf24":"#4ade80",width:`${j.progress}%`,transition:"width .3s"}}/>
                </div>
              </div>}
            </div>
            {j.canKill&&<button onClick={()=>kill(j)} disabled={killing===j.id} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {killing===j.id?"Killing…":"Kill"}
            </button>}
          </div>
        ))}
      </div>
    </div>
  );
}
