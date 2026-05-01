// @ts-nocheck
import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle2, Clock, RefreshCw, ToggleLeft, ToggleRight, Layers, Zap, Activity, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface NotifJob { id:string; title:string; type:string; recipients:number; attempts:number; maxAttempts:number; status:"queued"|"sending"|"delivered"|"failed"|"cooldown"; sentAt?:string; failReason?:string; isDuplicate:boolean; cooldownUntil?:string; }
interface NotifLog { id:string; title:string; type:string; recipients:number; delivered:number; failed:number; timestamp:string; triggeredBy:string; }
interface NotifSetting { id:string; label:string; value:number|boolean; type:"number"|"boolean"; description:string; }




function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
const NOTIF_JOBS_KEY="admin_notif_jobs_v1";const NOTIF_LOGS_KEY="admin_notif_logs_v1";const NOTIF_SETTINGS_KEY="admin_notif_settings_v1";
function seedNotifJobs():NotifJob[]{return[
  {id:"nj1",title:"Welcome Email — New User",type:"email",recipients:1,attempts:1,maxAttempts:3,status:"delivered",sentAt:new Date(Date.now()-3600000).toISOString(),isDuplicate:false},
  {id:"nj2",title:"Withdrawal Approved",type:"push",recipients:1,attempts:1,maxAttempts:3,status:"delivered",sentAt:new Date(Date.now()-7200000).toISOString(),isDuplicate:false},
  {id:"nj3",title:"Weekly Digest",type:"email",recipients:1240,attempts:2,maxAttempts:3,status:"failed",failReason:"SMTP limit reached",isDuplicate:false},
];}
function seedNotifLogs():NotifLog[]{return[
  {id:"nl1",title:"Welcome Email — New User",type:"email",recipients:1,delivered:1,failed:0,timestamp:new Date(Date.now()-3600000).toISOString(),triggeredBy:"auth.signup"},
];}
function seedNotifSettings():NotifSetting[]{return[
  {id:"ns1",label:"Daily Email Limit",value:5000,type:"number",description:"Max emails per day"},
  {id:"ns2",label:"Retry Failed Notifications",value:true,type:"boolean",description:"Auto retry failed jobs"},
  {id:"ns3",label:"Cooldown Between Retries (min)",value:15,type:"number",description:"Wait time between retry attempts"},
];}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor: Record<string,string> = { queued:"#94a3b8", sending:A1, delivered:"#4ade80", failed:"#f87171", cooldown:"#fbbf24" };

export default function AdminNotificationCenter() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]         = useState<"queue"|"logs"|"settings">("queue");
  const [jobs, setJobs]       = useState<NotifJob[]>(()=>load(NOTIF_JOBS_KEY,seedNotifJobs));
  const [logs, setLogs]       = useState<NotifLog[]>(()=>load(NOTIF_LOGS_KEY,seedNotifLogs));
  const [settings, setSettings] = useState<NotifSetting[]>(()=>load(NOTIF_SETTINGS_KEY,seedNotifSettings));
  const [editId, setEditId]   = useState<string|null>(null);
  const [editVal, setEditVal] = useState<string|number>("");
  const [retrying, setRetrying] = useState<string|null>(null);

  const retryJob = async (id:string) => {
    setRetrying(id);
    await new Promise(r=>setTimeout(r,1500));
    const updated = jobs.map(j=>j.id===id?{...j,status:"delivered" as const,attempts:j.attempts+1,sentAt:new Date().toISOString()}:j);
    localStorage.setItem("admin_notif_jobs_v1",JSON.stringify(updated));
    setJobs(updated);
    setRetrying(null);
    toast({ title:"Notification retried and delivered" });
  };

  const cancelJob = (id:string) => {
    const updated = jobs.filter(j=>j.id!==id);
    localStorage.setItem("admin_notif_jobs_v1",JSON.stringify(updated));
    setJobs(updated);
    toast({ title:"Notification cancelled from queue" });
    logAction("Notification Cancelled",jobs.find(j=>j.id===id)?.title||"","System","warning");
  };

  const saveSetting = (id:string) => {
    const updated = settings.map(s=>s.id===id?{...s,value:s.type==="number"?Number(editVal):Boolean(editVal)}:s);
    localStorage.setItem("admin_notif_settings_v1",JSON.stringify(updated));
    setSettings(updated);
    toast({ title:"Setting updated" });
    setEditId(null);
  };

  const exportLogsCSV = () => {
    const rows = [["Title","Type","Recipients","Delivered","Failed","Triggered By","Timestamp"]];
    logs.forEach(l=>rows.push([l.title,l.type,String(l.recipients),String(l.delivered),String(l.failed),l.triggeredBy,l.timestamp]));
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `notification-history-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const toggleSetting = (id:string) => {
    const updated = settings.map(s=>s.id===id?{...s,value:!s.value}:s);
    localStorage.setItem("admin_notif_settings_v1",JSON.stringify(updated));
    setSettings(updated);
  };

  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,...s });
  const failed = jobs.filter(j=>j.status==="failed").length;
  const dupes = jobs.filter(j=>j.isDuplicate).length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Bell size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Notification Center</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Queue management · Loop prevention · Duplicate detection · Retry limits · Cooldown control</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"In Queue",v:jobs.filter(j=>["queued","sending"].includes(j.status)).length,c:A1},{l:"Delivered",v:jobs.filter(j=>j.status==="delivered").length,c:"#4ade80"},{l:"Failed",v:failed,c:failed>0?"#f87171":"#94a3b8"},{l:"Duplicates Blocked",v:dupes,c:dupes>0?"#fbbf24":"#94a3b8"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["queue","Queue",Layers],["logs","History",Activity],["settings","Settings",Bell]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="queue"&&failed>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{failed}</span>}
          </button>
        ))}
      </div>

      {tab==="queue"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {jobs.map(j=>(
            <div key={j.id} style={{ background:T.card,border:`1px solid ${j.status==="failed"?"rgba(248,113,113,.2)":j.isDuplicate?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center" }}>
              <div style={{ width:9,height:9,borderRadius:"50%",background:statusColor[j.status],flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{j.title}</span>
                  <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{j.type}</span>
                  <span style={{ fontSize:10,fontWeight:700,color:statusColor[j.status],background:`${statusColor[j.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{j.status}</span>
                  {j.isDuplicate&&<span style={{ fontSize:10,fontWeight:700,color:"#fbbf24",background:"rgba(251,191,36,.1)",padding:"2px 7px",borderRadius:5 }}>DUPLICATE — BLOCKED</span>}
                </div>
                <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                  <span style={{ fontSize:12,color:T.sub }}>{j.recipients.toLocaleString()} recipients</span>
                  <span style={{ fontSize:12,color:T.sub }}>Attempts: {j.attempts}/{j.maxAttempts}</span>
                  {j.failReason&&<span style={{ fontSize:12,color:"#f87171" }}>{j.failReason}</span>}
                  {j.cooldownUntil&&<span style={{ fontSize:12,color:"#fbbf24" }}>Cooldown until: {safeFmt(j.cooldownUntil, "HH:mm:ss")}</span>}
                </div>
              </div>
              <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                {j.status==="failed"&&j.attempts<j.maxAttempts&&(
                  <button onClick={()=>retryJob(j.id)} disabled={retrying===j.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                    <RefreshCw size={11} className={retrying===j.id?"animate-spin":""}/>{retrying===j.id?"…":"Retry"}
                  </button>
                )}
                {["queued","cooldown"].includes(j.status)&&(
                  <button onClick={()=>cancelJob(j.id)} style={{ padding:"6px 10px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer" }}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden" }}>
          <div style={{ padding:"12px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,fontWeight:700,color:T.sub,textTransform:"uppercase",letterSpacing:1 }}>{logs.length} entries</span>
            <button onClick={exportLogsCSV} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:`${T.input}`,border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",color:T.text,fontSize:12,fontWeight:600 }}>
              <Download size={12}/> Export CSV
            </button>
          </div>
          {logs.map((l,i)=>(
            <div key={l.id} style={{ display:"flex",gap:12,padding:"14px 18px",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{l.title}</span>
                  <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{l.type}</span>
                </div>
                <p style={{ fontSize:11,color:T.sub,margin:0 }}>By {l.triggeredBy} · {safeFmt(l.timestamp, "MMM d, HH:mm")} · {l.recipients.toLocaleString()} recipients</p>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <p style={{ fontSize:12,fontWeight:700,color:"#4ade80",margin:"0 0 1px" }}>{l.delivered.toLocaleString()} delivered</p>
                {l.failed>0&&<p style={{ fontSize:11,color:"#f87171",margin:0 }}>{l.failed} failed</p>}
              </div>
            </div>
          ))}
        </div>
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
