import { useState } from "react";
import { CalendarClock, AlertTriangle, CheckCircle2, RefreshCw, Play, Pause, Activity } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface CronJob{id:string;name:string;schedule:string;priority:number;status:"running"|"paused"|"failed"|"idle";lastRun:string;nextRun:string;duration:number;retries:number;conflict:boolean;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const CRON_KEY="admin_cron_jobs_v1";
function seedCrons():CronJob[]{return[
  {id:"cj1",name:"Daily DB Backup",schedule:"0 2 * * *",priority:1,status:"idle",lastRun:new Date(Date.now()-86400000).toISOString(),nextRun:new Date(Date.now()+7200000).toISOString(),duration:340,retries:0,conflict:false},
  {id:"cj2",name:"Send Weekly Digest",schedule:"0 9 * * 1",priority:2,status:"idle",lastRun:new Date(Date.now()-864e5*7).toISOString(),nextRun:new Date(Date.now()+864e5*5).toISOString(),duration:1200,retries:0,conflict:false},
  {id:"cj3",name:"Clean Expired Sessions",schedule:"*/30 * * * *",priority:3,status:"running",lastRun:new Date(Date.now()-1800000).toISOString(),nextRun:new Date(Date.now()+1800000).toISOString(),duration:8,retries:0,conflict:false},
  {id:"cj4",name:"Sync User Scores",schedule:"0 */4 * * *",priority:4,status:"failed",lastRun:new Date(Date.now()-14400000).toISOString(),nextRun:new Date(Date.now()+3600000).toISOString(),duration:0,retries:3,conflict:false},
];}
const sColor={running:"#4ade80",paused:"#94a3b8",failed:"#f87171",idle:"#a5b4fc"};

export default function AdminCronJobs(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[jobs,setJobs]=useState<CronJob[]>(()=>load(CRON_KEY,seedCrons));
  const[running,setRunning]=useState<string|null>(null);

  const toggle=(j:CronJob)=>{
    const newStatus=j.status==="paused"?"idle":"paused";
    const upd=jobs.map(x=>x.id===j.id?{...x,status:newStatus as CronJob["status"]}:x);
    localStorage.setItem("admin_cron_jobs_v1",JSON.stringify(upd));setJobs(upd);
    toast({title:`${j.name} ${newStatus}`});
  };
  const run=async(j:CronJob)=>{
    setRunning(j.id);
    const upd1=jobs.map(x=>x.id===j.id?{...x,status:"running" as const}:x);setJobs(upd1);
    await new Promise(r=>setTimeout(r,2000));
    const ok=Math.random()>.2;
    const upd2=jobs.map(x=>x.id===j.id?{...x,status:ok?"idle" as const:"failed" as const,lastRun:new Date().toISOString(),retries:ok?0:x.retries+1}:x);
    localStorage.setItem("admin_cron_jobs_v1",JSON.stringify(upd2));setJobs(upd2);setRunning(null);
    toast({title:`${j.name} — ${ok?"Completed":"Failed"}`});
  };

  const conflicts=jobs.filter(j=>j.conflict).length;
  const failed=jobs.filter(j=>j.status==="failed").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><CalendarClock size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Cron Job Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Scheduled tasks · Conflict detection · Priority control · Retry mechanism · Pause/Resume · Logs</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Jobs",v:jobs.length,c:T.badgeFg},{l:"Running",v:jobs.filter(j=>j.status==="running").length,c:"#4ade80"},{l:"Failed",v:failed,c:failed>0?"#f87171":"#4ade80"},{l:"Conflicts",v:conflicts,c:conflicts>0?"#fbbf24":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {jobs.sort((a,b)=>a.priority-b.priority).map(j=>(
          <div key={j.id} style={{background:T.card,border:`1px solid ${j.status==="failed"?"rgba(248,113,113,.25)":j.conflict?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[j.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{j.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub,background:T.input,padding:"2px 6px",borderRadius:4}}>{j.schedule}</span>
                <span style={{fontSize:10,color:T.sub}}>P{j.priority}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[j.status],textTransform:"capitalize"}}>{j.status}</span>
                {j.conflict&&<span style={{fontSize:10,color:"#fbbf24"}}>⚠ conflict detected</span>}
                {j.retries>0&&<span style={{fontSize:10,color:"#f87171"}}>{j.retries} retries</span>}
              </div>
              <p style={{fontSize:12,color:T.sub,margin:0}}>Last: {safeDist(j.lastRun)} ago{j.duration>0?` (${j.duration}s)`:""} · Next: {safeDist(j.nextRun)}</p>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>run(j)} disabled={running===j.id||j.status==="running"} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <Play size={10}/>{running===j.id?"Running…":"Run Now"}
              </button>
              <button onClick={()=>toggle(j)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:8,background:j.status==="paused"?"rgba(74,222,128,.08)":"rgba(148,163,184,.08)",border:"1px solid rgba(148,163,184,.2)",color:j.status==="paused"?"#4ade80":"#94a3b8",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {j.status==="paused"?<Play size={10}/>:<Pause size={10}/>}{j.status==="paused"?"Resume":"Pause"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
