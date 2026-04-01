import { useState } from "react";
import { Cpu, Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Clock, ToggleLeft, ToggleRight, List, Activity, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface Job { id:string; name:string; type:string; priority:"high"|"normal"|"low"; status:"queued"|"running"|"completed"|"failed"|"paused"; attempts:number; maxAttempts:number; durationMs?:number; scheduledAt:string; startedAt?:string; completedAt?:string; error?:string; }
interface JobSetting { id:string; label:string; value:number|boolean; type:"number"|"boolean"; description:string; }

const seedJobs = (): Job[] => [
  { id:"j1", name:"Daily wallet reconciliation",    type:"Finance",    priority:"high",   status:"running",   attempts:1, maxAttempts:3, scheduledAt:new Date(Date.now()-3600000).toISOString(), startedAt:new Date(Date.now()-120000).toISOString() },
  { id:"j2", name:"Push notification batch (8,420)",type:"Messaging",  priority:"normal", status:"queued",    attempts:0, maxAttempts:3, scheduledAt:new Date(Date.now()-600000).toISOString() },
  { id:"j3", name:"Orphan file cleanup",            type:"Maintenance", priority:"low",    status:"completed", attempts:1, maxAttempts:3, durationMs:4200, scheduledAt:new Date(Date.now()-864e5).toISOString(), completedAt:new Date(Date.now()-864e5+42e2).toISOString() },
  { id:"j4", name:"Invoice PDF generation (340)",   type:"Reports",    priority:"normal", status:"failed",    attempts:3, maxAttempts:3, scheduledAt:new Date(Date.now()-7200000).toISOString(), error:"PDF renderer out of memory after 512 MB limit" },
  { id:"j5", name:"KYC verification batch",         type:"Compliance", priority:"high",   status:"paused",    attempts:0, maxAttempts:5, scheduledAt:new Date(Date.now()-1800000).toISOString() },
  { id:"j6", name:"Search index rebuild",           type:"Performance",priority:"low",    status:"queued",    attempts:0, maxAttempts:2, scheduledAt:new Date(Date.now()-300000).toISOString() },
];

const seedSettings = (): JobSetting[] => [
  { id:"s1", label:"Max Concurrent Jobs",        value:5,    type:"number",  description:"Maximum number of jobs that can run simultaneously" },
  { id:"s2", label:"Default Job Timeout (sec)",  value:300,  type:"number",  description:"Jobs exceeding this duration are auto-terminated" },
  { id:"s3", label:"Max Retry Attempts",         value:3,    type:"number",  description:"Maximum retries before a job is marked as permanently failed" },
  { id:"s4", label:"Retry Backoff (sec)",        value:60,   type:"number",  description:"Wait time between retry attempts (exponential backoff base)" },
  { id:"s5", label:"Queue Auto-Drain",           value:true, type:"boolean", description:"Automatically process queued jobs when worker slots are free" },
  { id:"s6", label:"Alert on Failed Jobs",       value:true, type:"boolean", description:"Notify admins immediately when a job fails after all retries" },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor: Record<string,string> = { queued:"#94a3b8", running:A1, completed:"#4ade80", failed:"#f87171", paused:"#fbbf24" };
const prioColor = { high:"#f87171", normal:A1, low:"#94a3b8" };

export default function AdminJobQueue() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]           = useState<"queue"|"settings">("queue");
  const [jobs, setJobs]         = useState<Job[]>(()=>load("admin_jobs_v1",seedJobs));
  const [settings, setSettings] = useState<JobSetting[]>(()=>load("admin_job_settings_v1",seedSettings));
  const [editId, setEditId]     = useState<string|null>(null);
  const [editVal, setEditVal]   = useState<string|number>("");
  const [retrying, setRetrying] = useState<string|null>(null);
  const [filter, setFilter]     = useState("all");

  const retryJob = async (j: Job) => {
    setRetrying(j.id);
    await new Promise(r=>setTimeout(r,1500));
    const updated = jobs.map(x=>x.id===j.id?{...x,status:"queued" as const,attempts:0,error:undefined}:x);
    localStorage.setItem("admin_jobs_v1",JSON.stringify(updated));
    setJobs(updated); setRetrying(null);
    logAction("Job Retried",j.name,"System","success");
    toast({ title:`Job "${j.name}" requeued` });
  };

  const pauseResume = (j: Job) => {
    const next = j.status==="paused"?"queued" as const:"paused" as const;
    const updated = jobs.map(x=>x.id===j.id?{...x,status:next}:x);
    localStorage.setItem("admin_jobs_v1",JSON.stringify(updated));
    setJobs(updated);
    toast({ title:next==="queued"?`Job "${j.name}" resumed`:`Job "${j.name}" paused` });
  };

  const saveSetting = (id:string) => {
    const updated = settings.map(s=>s.id===id?{...s,value:s.type==="number"?Number(editVal):editVal}:s);
    localStorage.setItem("admin_job_settings_v1",JSON.stringify(updated));
    setSettings(updated); toast({ title:"Job setting updated" }); setEditId(null);
  };

  const toggleSetting = (id:string) => {
    const updated = settings.map(s=>s.id===id?{...s,value:!s.value}:s);
    localStorage.setItem("admin_job_settings_v1",JSON.stringify(updated));
    setSettings(updated);
  };

  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,...s });
  const filtered = filter==="all" ? jobs : jobs.filter(j=>j.status===filter);
  const failed = jobs.filter(j=>j.status==="failed").length;
  const running = jobs.filter(j=>j.status==="running").length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Cpu size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Background Job Queue</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Queue management · Priority control · Concurrency limits · Retry mechanism · Job monitoring</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Total Jobs",v:jobs.length,c:T.badgeFg},{l:"Running",v:running,c:running>0?A1:"#94a3b8"},{l:"Queued",v:jobs.filter(j=>j.status==="queued").length,c:"#fbbf24"},{l:"Failed",v:failed,c:failed>0?"#f87171":"#94a3b8"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["queue","Job Queue",List],["settings","Settings",Settings]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="queue"&&failed>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{failed}</span>}
          </button>
        ))}
      </div>

      {tab==="queue"&&(
        <>
          <div style={{ display:"flex",gap:6,marginBottom:10,flexWrap:"wrap" }}>
            {["all","running","queued","failed","paused","completed"].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{ padding:"5px 13px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===s?A1:T.border}`,background:filter===s?`${A1}15`:T.card,color:filter===s?T.badgeFg:T.sub,textTransform:"capitalize" }}>{s}</button>
            ))}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {filtered.map(j=>(
              <div key={j.id} style={{ background:T.card,border:`1px solid ${j.status==="failed"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"flex-start" }}>
                <div style={{ width:9,height:9,borderRadius:"50%",background:statusColor[j.status],flexShrink:0,marginTop:5 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{j.name}</span>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{j.type}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:prioColor[j.priority],background:`${prioColor[j.priority]}15`,padding:"2px 7px",borderRadius:5 }}>{j.priority} priority</span>
                    <span style={{ fontSize:10,fontWeight:700,color:statusColor[j.status],background:`${statusColor[j.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{j.status}</span>
                  </div>
                  <p style={{ fontSize:12,color:T.sub,margin:"0 0 2px" }}>Attempts: {j.attempts}/{j.maxAttempts} · Scheduled: {format(new Date(j.scheduledAt),"MMM d, HH:mm")}</p>
                  {j.error&&<p style={{ fontSize:12,color:"#f87171",margin:0 }}>{j.error}</p>}
                  {j.durationMs&&<p style={{ fontSize:11,color:T.sub,margin:0 }}>Duration: {(j.durationMs/1000).toFixed(1)}s</p>}
                </div>
                <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                  {j.status==="failed"&&j.attempts<j.maxAttempts&&(
                    <button onClick={()=>retryJob(j)} disabled={retrying===j.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      <RotateCcw size={11}/>{retrying===j.id?"…":"Retry"}
                    </button>
                  )}
                  {(j.status==="queued"||j.status==="paused")&&(
                    <button onClick={()=>pauseResume(j)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)",color:"#fbbf24",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      {j.status==="paused"?<Play size={11}/>:<Pause size={11}/>}{j.status==="paused"?"Resume":"Pause"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==="settings"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {settings.map(s=>(
            <div key={s.id} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700,fontSize:13,color:T.text,margin:"0 0 3px" }}>{s.label}</p>
                <p style={{ fontSize:12,color:T.sub,margin:0 }}>{s.description}</p>
              </div>
              {s.type==="boolean"?(
                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:s.value?"#4ade80":"#94a3b8" }}>{s.value?"ON":"OFF"}</span>
                  <button onClick={()=>toggleSetting(s.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}>
                    {s.value?<ToggleRight size={28} color="#4ade80"/>:<ToggleLeft size={28} color="#94a3b8"/>}
                  </button>
                </div>
              ):editId===s.id?(
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  <Input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ ...inp(),width:80,padding:"6px 10px",fontSize:13 }}/>
                  <button onClick={()=>saveSetting(s.id)} style={{ padding:"6px 12px",borderRadius:8,background:`${A1}20`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer" }}>Save</button>
                  <button onClick={()=>setEditId(null)} style={{ padding:"6px 8px",borderRadius:8,background:T.input,border:`1px solid ${T.border}`,color:T.sub,fontSize:12,cursor:"pointer" }}>×</button>
                </div>
              ):(
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontWeight:800,fontSize:16,color:T.badgeFg }}>{String(s.value)}</span>
                  <button onClick={()=>{setEditId(s.id);setEditVal(s.value as number);}} style={{ fontSize:10,color:T.badgeFg,background:T.badge,border:"none",borderRadius:5,padding:"2px 8px",cursor:"pointer" }}>edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
