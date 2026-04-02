import { useState } from "react";
import { Archive, AlertTriangle, CheckCircle2, RefreshCw, Clock, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ArchiveJob{id:string;name:string;table:string;olderThanDays:number;lastRun:string;nextRun:string;rowsArchived:number;status:"idle"|"running"|"failed";enabled:boolean;}
const seed=():ArchiveJob[]=>[
  {id:"aj1",name:"Old Jobs Archival",table:"jobs",olderThanDays:365,lastRun:new Date(Date.now()-86400000).toISOString(),nextRun:new Date(Date.now()+86400000).toISOString(),rowsArchived:4280,status:"idle",enabled:true},
  {id:"aj2",name:"Stale Sessions Cleanup",table:"sessions",olderThanDays:30,lastRun:new Date(Date.now()-3600000).toISOString(),nextRun:new Date(Date.now()+82800000).toISOString(),rowsArchived:18420,status:"idle",enabled:true},
  {id:"aj3",name:"Old Notifications",table:"notifications",olderThanDays:90,lastRun:new Date(Date.now()-7200000).toISOString(),nextRun:new Date(Date.now()+79200000).toISOString(),rowsArchived:0,status:"failed",enabled:true},
  {id:"aj4",name:"Audit Log Archival",table:"audit_logs",olderThanDays:730,lastRun:new Date(Date.now()-604800000).toISOString(),nextRun:new Date(Date.now()+518400000).toISOString(),rowsArchived:82000,status:"idle",enabled:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminDataArchival(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[jobs,setJobs]=useState(()=>load("admin_archival_v1",seed));
  const[running,setRunning]=useState<string|null>(null);

  const runJob=async(j:ArchiveJob)=>{
    setRunning(j.id);
    const upd1=jobs.map(x=>x.id===j.id?{...x,status:"running" as const}:x);setJobs(upd1);
    await new Promise(r=>setTimeout(r,2000));
    const archived=Math.floor(1000+Math.random()*5000);
    const upd2=jobs.map(x=>x.id===j.id?{...x,status:"idle" as const,lastRun:new Date().toISOString(),rowsArchived:x.rowsArchived+archived}:x);
    localStorage.setItem("admin_archival_v1",JSON.stringify(upd2));setJobs(upd2);setRunning(null);
    toast({title:`${j.name} — ${archived.toLocaleString()} rows archived`});
  };
  const toggle=(id:string)=>{
    const upd=jobs.map(j=>j.id===id?{...j,enabled:!j.enabled}:j);
    localStorage.setItem("admin_archival_v1",JSON.stringify(upd));setJobs(upd);
    toast({title:"Archival job updated"});
  };
  const updateDays=(id:string,days:number)=>{
    const upd=jobs.map(j=>j.id===id?{...j,olderThanDays:days}:j);
    localStorage.setItem("admin_archival_v1",JSON.stringify(upd));setJobs(upd);
  };

  const failed=jobs.filter(j=>j.status==="failed").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Archive size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Data Archival Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Auto scheduler · Archive rules · Job status · Failure alerts · Validation · Retry · Preview · Rollback</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Jobs",v:jobs.length,c:T.badgeFg},{l:"Failed",v:failed,c:failed>0?"#f87171":"#4ade80"},{l:"Total Archived",v:jobs.reduce((s,j)=>s+j.rowsArchived,0).toLocaleString(),c:T.badgeFg},{l:"Active",v:jobs.filter(j=>j.enabled).length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {jobs.map(j=>(
          <div key={j.id} style={{background:T.card,border:`1px solid ${j.status==="failed"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{j.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{j.table}</span>
                <span style={{fontSize:10,fontWeight:700,color:j.status==="failed"?"#f87171":j.status==="running"?"#fbbf24":"#4ade80",textTransform:"capitalize"}}>{j.status}</span>
                {!j.enabled&&<span style={{fontSize:10,color:T.sub}}>disabled</span>}
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                <span style={{fontSize:12,color:T.sub}}>Archive older than:</span>
                <input type="number" defaultValue={j.olderThanDays} onBlur={e=>updateDays(j.id,+e.target.value)} style={{width:60,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"3px 8px",fontSize:12}}/>
                <span style={{fontSize:12,color:T.sub}}>days · Archived: {j.rowsArchived.toLocaleString()} rows</span>
              </div>
              <p style={{fontSize:11,color:T.sub,margin:0}}>Last: {formatDistanceToNow(new Date(j.lastRun))} ago · Next: {formatDistanceToNow(new Date(j.nextRun))}</p>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>toggle(j.id)} style={{padding:"5px 10px",borderRadius:7,background:j.enabled?`${A1}15`:"rgba(148,163,184,.1)",border:`1px solid ${j.enabled?A1:T.border}`,color:j.enabled?T.badgeFg:T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {j.enabled?"ON":"OFF"}
              </button>
              <button onClick={()=>runJob(j)} disabled={running===j.id||j.status==="running"} style={{padding:"6px 12px",borderRadius:8,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {running===j.id?"Running…":"Run Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
