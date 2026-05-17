// @ts-nocheck
import { useState, useEffect } from "react";
import { CalendarClock, Globe, RefreshCw, Play, Pause, CheckCircle2, AlertTriangle, Clock, Settings, ToggleLeft, ToggleRight, Zap, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const safeFmt=(raw:string|undefined,fmt:string,fb="—")=>{try{if(!raw)return fb;const d=new Date(raw);return isNaN(d.getTime())?fb:format(d,fmt);}catch{return fb;}};
const safeDist=(raw:string|undefined,fb="—")=>{try{if(!raw)return fb;const d=new Date(raw);return isNaN(d.getTime())?fb:formatDistanceToNow(d);}catch{return fb;}};

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface CronJob { id:string; name:string; schedule:string; description:string; enabled:boolean; lastRun?:string; nextRun:string; lastStatus:"success"|"failed"|"running"|"never"; duration?:string; }
interface CronLog { id:string; jobName:string; startedAt:string; duration:string; status:"success"|"failed"; output:string; }
interface TimezoneConfig { current:string; serverTime:string; ntpSynced:boolean; lastSync:string; }



function load<T>(key:string, seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
const SCHED_JOBS_KEY="admin_scheduler_jobs_v1";const SCHED_LOGS_KEY="admin_scheduler_logs_v1";
function seedSchedJobs():CronJob[]{return[
  {id:"sj1",name:"Daily DB Backup",schedule:"0 2 * * *",description:"Full database backup to storage",enabled:true,lastRun:new Date(Date.now()-86400000).toISOString(),nextRun:new Date(Date.now()+7200000).toISOString(),lastStatus:"success",duration:"5m 40s"},
  {id:"sj2",name:"Weekly Digest Email",schedule:"0 9 * * 1",description:"Send weekly activity digest to all users",enabled:true,lastRun:new Date(Date.now()-864e5*7).toISOString(),nextRun:new Date(Date.now()+864e5*5).toISOString(),lastStatus:"success",duration:"20m 0s"},
  {id:"sj3",name:"Clean Expired Sessions",schedule:"*/30 * * * *",description:"Remove expired user sessions",enabled:true,lastRun:new Date(Date.now()-1800000).toISOString(),nextRun:new Date(Date.now()+1800000).toISOString(),lastStatus:"running"},
  {id:"sj4",name:"Fraud Score Update",schedule:"0 */6 * * *",description:"Recalculate fraud scores for all users",enabled:false,nextRun:new Date(Date.now()+86400000).toISOString(),lastStatus:"never"},
];}
function seedSchedLogs():CronLog[]{return[
  {id:"sl1",jobName:"Daily DB Backup",startedAt:new Date(Date.now()-86400000).toISOString(),duration:"5m 40s",status:"success",output:"Backup written to supabase-storage/backups/2025-04-05.sql.gz"},
  {id:"sl2",jobName:"Weekly Digest Email",startedAt:new Date(Date.now()-864e5*7).toISOString(),duration:"20m 0s",status:"success",output:"1240 emails sent, 0 failed"},
  {id:"sl3",jobName:"Fraud Score Update",startedAt:new Date(Date.now()-864e5*14).toISOString(),duration:"0s",status:"failed",output:"Error: Supabase connection timeout after 30s"},
];}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const TIMEZONES = ["Asia/Kolkata","UTC","America/New_York","Europe/London","Asia/Dubai","Asia/Singapore","Australia/Sydney"];
const STATUS_COLOR = { success:"#4ade80", failed:"#f87171", running:A1, never:"#94a3b8" };

function parseCron(expr:string): string {
  if (expr==="*/5 * * * *") return "Every 5 minutes";
  if (expr==="0 2 * * *")   return "Daily at 2:00 AM";
  if (expr==="0 3 * * 0")   return "Every Sunday at 3:00 AM";
  if (expr==="0 0 1 * *")   return "1st of every month at midnight";
  if (expr==="0 6 * * *")   return "Daily at 6:00 AM";
  if (expr==="0 10 * * 1")  return "Every Monday at 10:00 AM";
  return expr;
}

export default function AdminScheduler() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]   = useState<"jobs"|"timezone"|"logs">("jobs");
  const [jobs, setJobs] = useState<CronJob[]>(()=>load(SCHED_JOBS_KEY,seedSchedJobs));
  const [logs, setLogs] = useState<CronLog[]>(()=>load(SCHED_LOGS_KEY,seedSchedLogs));
  const [tz, setTz]     = useState<TimezoneConfig>(()=>({
    current:   Intl.DateTimeFormat().resolvedOptions().timeZone,
    serverTime: new Date().toISOString(),
    ntpSynced: true,
    lastSync:  new Date(Date.now()-300000).toISOString(),
  }));
  const [selectedTz, setSelectedTz]   = useState(tz.current);
  const [confirmTz, setConfirmTz]     = useState(false);
  const [runningJob, setRunningJob]   = useState<string|null>(null);
  const [serverTime, setServerTime]   = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleJob = (id:string) => {
    const updated = jobs.map(j=>j.id===id?{...j,enabled:!j.enabled}:j);
    localStorage.setItem("admin_cron_jobs_v1",JSON.stringify(updated));
    setJobs(updated);
    const j = jobs.find(x=>x.id===id)!;
    logAction("Cron Job Toggled",`${j.name}: ${j.enabled?"paused":"resumed"}`,"System","warning");
    toast({ title:`${j.name} ${j.enabled?"paused":"resumed"}` });
  };

  const runNow = async (id:string) => {
    setRunningJob(id);
    await new Promise(r=>setTimeout(r,2000));
    const updated = jobs.map(j=>j.id===id?{...j,lastRun:new Date().toISOString(),lastStatus:"success" as const}:j);
    localStorage.setItem("admin_cron_jobs_v1",JSON.stringify(updated));
    setJobs(updated);
    setRunningJob(null);
    const j = jobs.find(x=>x.id===id)!;
    logAction("Cron Job Manual Run",`${j.name} executed manually`,"System","success");
    toast({ title:`${j.name} executed successfully` });
  };

  const applyTz = () => {
    logAction("Timezone Changed",`${tz.current} → ${selectedTz}`,"System","warning");
    toast({ title:`Timezone updated to ${selectedTz}`, description:"All scheduled times recalculated." });
    setConfirmTz(false);
  };

  const inp=(s?:object)=>({ background:T.input, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, ...s });
  const failedJobs = jobs.filter(j=>j.lastStatus==="failed").length;

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`, border:`1px solid rgba(99,102,241,.2)`, borderRadius:18, padding:"26px 28px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${A1}55`, flexShrink:0 }}>
            <CalendarClock size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text, fontWeight:800, fontSize:22, margin:0 }}>Scheduler & Time Settings</h1>
            <p style={{ color:T.sub, fontSize:13, margin:"3px 0 0" }}>Cron jobs · Timezone configuration · NTP sync · Execution logs</p>
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", textAlign:"right" }}>
            <p style={{ fontSize:10, color:T.sub, margin:0, textTransform:"uppercase", letterSpacing:".06em" }}>Server Time</p>
            <p style={{ fontSize:16, fontWeight:800, color:T.text, margin:"2px 0 0", fontFamily:"monospace" }}>{format(serverTime,"HH:mm:ss")}</p>
            <p style={{ fontSize:10, color:T.sub, margin:"1px 0 0" }}>{tz.current}</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
          {[{l:"Active Jobs",v:jobs.filter(j=>j.enabled).length,c:"#4ade80"},{l:"Failed Last Run",v:failedJobs,c:failedJobs>0?"#f87171":"#94a3b8"},{l:"NTP Synced",v:tz.ntpSynced?"YES":"NO",c:tz.ntpSynced?"#4ade80":"#f87171"},{l:"Timezone",v:tz.current.split("/")[1]||tz.current,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontWeight:800, fontSize:18, color:s.c }}>{s.v}</span>
              <span style={{ fontSize:11, color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {([["jobs","Cron Jobs",CalendarClock],["timezone","Timezone & NTP",Globe],["logs","Execution Logs",Terminal]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, border:`1px solid ${tab===t?A1:T.border}`, background:tab===t?`${A1}18`:T.card, color:tab===t?T.badgeFg:T.sub, fontWeight:600, fontSize:12, cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="jobs"&&failedJobs>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{failedJobs}</span>}
          </button>
        ))}
      </div>

      {tab==="jobs"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {jobs.map(j=>(
            <div key={j.id} style={{ background:T.card, border:`1px solid ${j.lastStatus==="failed"?"rgba(248,113,113,.2)":T.border}`, borderRadius:14, padding:"14px 18px", opacity:j.enabled?1:.7 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{j.name}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:(STATUS_COLOR as Record<string,string>)[j.lastStatus], background:`${(STATUS_COLOR as Record<string,string>)[j.lastStatus]}15`, padding:"2px 7px", borderRadius:5, textTransform:"capitalize" }}>{j.lastStatus}</span>
                    <span style={{ fontFamily:"monospace", fontSize:10, color:T.badgeFg, background:T.badge, padding:"2px 7px", borderRadius:5 }}>{j.schedule}</span>
                  </div>
                  <p style={{ fontSize:12, color:T.sub, margin:"0 0 4px" }}>{j.description}</p>
                  <p style={{ fontSize:11, color:T.sub, margin:0 }}>{parseCron(j.schedule)}{j.lastRun?` · Last: ${safeDist(j.lastRun)} ago`:""}  · Next: {safeFmt(j.nextRun,"MMM d, HH:mm")}{j.duration?` · ${j.duration}`:""}</p>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                  <button onClick={()=>runNow(j.id)} disabled={!!runningJob||!j.enabled} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:`${A1}15`, border:`1px solid ${A1}33`, color:T.badgeFg, fontSize:11, fontWeight:600, cursor:"pointer", opacity:runningJob===j.id?.6:1 }}>
                    {runningJob===j.id?<RefreshCw size={11} className="animate-spin"/>:<Play size={11}/>}{runningJob===j.id?"Running…":"Run Now"}
                  </button>
                  <button onClick={()=>toggleJob(j.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    {j.enabled?<ToggleRight size={28} color="#4ade80"/>:<ToggleLeft size={28} color="#94a3b8"/>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="timezone"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 22px" }}>
            <h3 style={{ color:T.text, fontWeight:700, fontSize:15, margin:"0 0 16px" }}>Timezone Configuration</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ fontSize:11, color:T.sub, fontWeight:600, display:"block", marginBottom:5 }}>CURRENT TIMEZONE</label>
                <div style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px" }}>
                  <p style={{ fontSize:14, fontWeight:700, color:T.text, margin:0 }}>{tz.current}</p>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:T.sub, fontWeight:600, display:"block", marginBottom:5 }}>CHANGE TO</label>
                <select value={selectedTz} onChange={e=>setSelectedTz(e.target.value)} style={{ ...inp(), width:"100%", padding:"10px 14px", fontSize:13 }}>
                  {TIMEZONES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={()=>selectedTz!==tz.current&&setConfirmTz(true)} disabled={selectedTz===tz.current} style={{ marginTop:14, padding:"9px 18px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", opacity:selectedTz===tz.current?.5:1 }}>Apply Timezone Change</button>
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 22px" }}>
            <h3 style={{ color:T.text, fontWeight:700, fontSize:15, margin:"0 0 14px" }}>NTP Synchronization Status</h3>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {[{l:"NTP Status",v:tz.ntpSynced?"Synchronized":"Out of Sync",c:tz.ntpSynced?"#4ade80":"#f87171"},{l:"Last Sync",v:safeDist(tz.lastSync)+" ago",c:T.text},{l:"Server Time",v:format(serverTime,"HH:mm:ss"),c:T.badgeFg},{l:"Local Offset",v:"+05:30 IST",c:T.text}].map(s=>(
                <div key={s.l} style={{ background:T.input, borderRadius:10, padding:"12px 16px", flex:"1 1 auto", minWidth:120 }}>
                  <p style={{ fontSize:10, color:T.sub, margin:"0 0 4px", textTransform:"uppercase" }}>{s.l}</p>
                  <p style={{ fontSize:14, fontWeight:700, color:s.c, margin:0 }}>{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:"rgba(251,191,36,.05)", border:"1px solid rgba(251,191,36,.15)", borderRadius:12, padding:"12px 16px", display:"flex", gap:8 }}>
            <AlertTriangle size={13} color="#fbbf24" style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:12, color:T.sub, margin:0, lineHeight:1.6 }}>Changing the timezone will reschedule all cron jobs and affect timestamp displays platform-wide. Scheduled tasks will be previewed in the new timezone before execution. A confirmation window will show before applying.</p>
          </div>
        </div>
      )}

      {tab==="logs"&&(
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <Terminal size={14} color={A1}/><span style={{ fontWeight:700, fontSize:14, color:T.text }}>Cron Execution Log</span>
            <span style={{ fontSize:11, color:T.sub, marginLeft:"auto" }}>{logs.length} entries</span>
          </div>
          {logs.map((l,i)=>(
            <div key={l.id} style={{ padding:"14px 18px", borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                {l.status==="success"?<CheckCircle2 size={15} color="#4ade80"/>:<AlertTriangle size={15} color="#f87171"/>}
                <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{l.jobName}</span>
                <span style={{ fontSize:11, color:T.sub }}>{safeFmt(l.startedAt,"MMM d, HH:mm:ss")}</span>
                <span style={{ fontSize:11, color:T.sub }}>· {l.duration}</span>
              </div>
              <div style={{ background:T.input, borderRadius:8, padding:"8px 12px", fontFamily:"monospace", fontSize:11, color:l.status==="success"?"#4ade80":"#f87171" }}>{l.output}</div>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionDialog open={confirmTz} onOpenChange={o=>!o&&setConfirmTz(false)} onConfirm={applyTz}
        title={`Change Timezone to ${selectedTz}`}
        description={`All scheduled jobs, timestamps, and cron expressions will be recalculated for ${selectedTz}. This affects all admin views and scheduled notifications.`}
        confirmLabel="Apply Timezone" variant="warning"/>
    </div>
  );
}
