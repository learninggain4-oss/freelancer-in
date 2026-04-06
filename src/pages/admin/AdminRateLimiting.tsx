import { useState } from "react";
import { Gauge, AlertTriangle, CheckCircle2, Clock, Zap, Activity, RefreshCw, Shield, Ban, ToggleLeft, ToggleRight, Eye, Cpu } from "lucide-react";
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

interface RateRule { id:string; action:string; limitPerMin:number; limitPerHour:number; currentUsage:number; enabled:boolean; superAdminOverride:boolean; category:string; cooldownSec:number; }
interface AbuseAlert { id:string; type:string; ip:string; adminEmail:string; occurrences:number; timestamp:string; status:"active"|"resolved"; }
interface FailedJob { id:string; jobName:string; error:string; attempts:number; maxAttempts:number; lastAttempt:string; status:"queued"|"retrying"|"failed"|"success"; nextRetry?:string; }
interface OpQueueItem { id:string; operation:string; requestedBy:string; size:number; status:"queued"|"processing"|"done"; queuedAt:string; }





function load<T>(key:string, seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor = { queued:"#fbbf24", processing:A1, done:"#4ade80", retrying:"#fb923c", failed:"#f87171", success:"#4ade80", active:"#f87171", resolved:"#94a3b8" };

export default function AdminRateLimiting() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]   = useState<"rules"|"abuse"|"jobs"|"queue">("rules");
  const [rules, setRules] = useState<RateRule[]>([]);
  const [alerts, setAlerts] = useState<AbuseAlert[]>([]);
  const [jobs, setJobs] = useState<FailedJob[]>([]);
  const [queue] = useState<OpQueueItem[]>([]);
  const [editId, setEditId] = useState<string|null>(null);
  const [editLimit, setEditLimit] = useState(0);
  const [retrying, setRetrying] = useState<string|null>(null);

  const toggleRule = (id:string) => {
    const updated = rules.map(r=>r.id===id?{...r,enabled:!r.enabled}:r);
    localStorage.setItem("admin_rate_rules_v1",JSON.stringify(updated));
    setRules(updated);
    const r = rules.find(x=>x.id===id)!;
    logAction("Rate Rule Toggled",`${r.action}: ${r.enabled?"disabled":"enabled"}`,"Security","warning");
    toast({ title:`${r.action} ${r.enabled?"disabled":"enabled"}` });
  };

  const saveLimit = (id:string) => {
    const updated = rules.map(r=>r.id===id?{...r,limitPerHour:editLimit}:r);
    localStorage.setItem("admin_rate_rules_v1",JSON.stringify(updated));
    setRules(updated);
    logAction("Rate Limit Updated",`${rules.find(r=>r.id===id)?.action} → ${editLimit}/hr`,"Security","warning");
    toast({ title:"Rate limit updated" });
    setEditId(null);
  };

  const resolveAlert = (id:string) => {
    const updated = alerts.map(a=>a.id===id?{...a,status:"resolved" as const}:a);
    localStorage.setItem("admin_abuse_alerts_v1",JSON.stringify(updated));
    setAlerts(updated);
    toast({ title:"Alert marked resolved" });
  };

  const retryJob = async (id:string) => {
    setRetrying(id);
    await new Promise(r=>setTimeout(r,1800));
    const updated = jobs.map(j=>j.id===id?{...j,status:"success" as const,attempts:j.attempts+1,lastAttempt:new Date().toISOString()}:j);
    localStorage.setItem("admin_failed_jobs_v1",JSON.stringify(updated));
    setJobs(updated);
    setRetrying(null);
    toast({ title:"Job retried successfully" });
  };

  const inp=(s?:object)=>({ background:T.input, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, ...s });
  const catColor:Record<string,string> = { "User Mgmt":"#4ade80", Finance:"#fb923c", Security:"#f87171", Comms:"#a5b4fc", Database:"#fbbf24" };
  const activeAlerts = alerts.filter(a=>a.status==="active").length;

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`, border:`1px solid rgba(99,102,241,.2)`, borderRadius:18, padding:"26px 28px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${A1}55`, flexShrink:0 }}>
            <Gauge size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text, fontWeight:800, fontSize:22, margin:0 }}>Rate Limiting & System Health</h1>
            <p style={{ color:T.sub, fontSize:13, margin:"3px 0 0" }}>Admin action limits · Abuse detection · Failed job monitoring · Operation queue</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
          {[{l:"Active Rules",v:rules.filter(r=>r.enabled).length,c:"#4ade80"},{l:"Abuse Alerts",v:activeAlerts,c:activeAlerts>0?"#f87171":"#94a3b8"},{l:"Failed Jobs",v:jobs.filter(j=>j.status==="failed").length,c:"#f87171"},{l:"Queued Ops",v:queue.filter(q=>q.status==="queued").length,c:"#fbbf24"}].map(s=>(
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontWeight:800, fontSize:18, color:s.c }}>{s.v}</span>
              <span style={{ fontSize:11, color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {([["rules","Rate Rules",Gauge],["abuse","Abuse Alerts",AlertTriangle],["jobs","Background Jobs",Cpu],["queue","Op Queue",Clock]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 14px", borderRadius:10, border:`1px solid ${tab===t?A1:T.border}`, background:tab===t?`${A1}18`:T.card, color:tab===t?T.badgeFg:T.sub, fontWeight:600, fontSize:12, cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="abuse"&&activeAlerts>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{activeAlerts}</span>}
          </button>
        ))}
      </div>

      {tab==="rules"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {rules.map(r=>(
            <div key={r.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{r.action}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:catColor[r.category]||T.badgeFg, background:`${catColor[r.category]||A1}15`, padding:"2px 7px", borderRadius:5 }}>{r.category}</span>
                    {r.superAdminOverride&&<span style={{ fontSize:10, color:"#fbbf24", background:"rgba(251,191,36,.1)", padding:"2px 7px", borderRadius:5 }}>SA OVERRIDE</span>}
                  </div>
                  <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                    <span style={{ fontSize:12, color:T.sub }}>Limit: <strong style={{ color:T.text }}>{r.limitPerMin}/min</strong></span>
                    {editId===r.id?(
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:T.sub }}>Per hour:</span>
                        <Input type="number" value={editLimit} onChange={e=>setEditLimit(Number(e.target.value))} style={{ ...inp(), width:70, padding:"4px 8px", fontSize:12 }}/>
                        <button onClick={()=>saveLimit(r.id)} style={{ padding:"4px 10px", borderRadius:7, background:`${A1}20`, border:`1px solid ${A1}33`, color:T.badgeFg, fontSize:11, fontWeight:600, cursor:"pointer" }}>Save</button>
                        <button onClick={()=>setEditId(null)} style={{ padding:"4px 8px", borderRadius:7, background:T.input, border:`1px solid ${T.border}`, color:T.sub, fontSize:11, cursor:"pointer" }}>×</button>
                      </div>
                    ):(
                      <span style={{ fontSize:12, color:T.sub }}>Per hour: <strong style={{ color:T.text }}>{r.limitPerHour}</strong> <button onClick={()=>{setEditId(r.id);setEditLimit(r.limitPerHour);}} style={{ fontSize:10, color:T.badgeFg, background:T.badge, border:"none", borderRadius:4, padding:"1px 6px", cursor:"pointer" }}>edit</button></span>
                    )}
                    <span style={{ fontSize:12, color:T.sub }}>Cooldown: <strong style={{ color:T.text }}>{r.cooldownSec}s</strong></span>
                    <span style={{ fontSize:12, color:T.sub }}>Usage: <strong style={{ color:r.currentUsage/r.limitPerMin>0.8?"#f87171":"#4ade80" }}>{r.currentUsage}/{r.limitPerMin}</strong></span>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:r.enabled?"#4ade80":"#94a3b8" }}>{r.enabled?"ON":"OFF"}</span>
                  <button onClick={()=>toggleRule(r.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    {r.enabled?<ToggleRight size={28} color="#4ade80"/>:<ToggleLeft size={28} color="#94a3b8"/>}
                  </button>
                </div>
              </div>
              <div style={{ marginTop:10, height:4, borderRadius:4, background:"rgba(255,255,255,.07)", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:4, background:r.currentUsage/r.limitPerMin>0.8?"#f87171":A1, width:`${Math.min(100,(r.currentUsage/r.limitPerMin)*100)}%`, transition:"width .5s ease" }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="abuse"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {alerts.map(a=>(
            <div key={a.id} style={{ background:T.card, border:`1px solid ${a.status==="active"?"rgba(248,113,113,.25)":T.border}`, borderRadius:13, padding:"14px 18px", display:"flex", gap:12, alignItems:"center", opacity:a.status==="resolved"?.65:1 }}>
              <AlertTriangle size={18} color={a.status==="active"?"#f87171":"#94a3b8"} style={{ flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:T.text, margin:"0 0 3px" }}>{a.type}</p>
                <p style={{ fontSize:12, color:T.sub, margin:0 }}>IP: {a.ip} · {a.adminEmail} · {a.occurrences}x · {safeDist(a.timestamp)} ago</p>
              </div>
              {a.status==="active"?(
                <button onClick={()=>resolveAlert(a.id)} style={{ padding:"6px 13px", borderRadius:8, background:"rgba(74,222,128,.08)", border:"1px solid rgba(74,222,128,.2)", color:"#4ade80", fontSize:12, fontWeight:600, cursor:"pointer" }}>Resolve</button>
              ):<span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>✓ Resolved</span>}
            </div>
          ))}
        </div>
      )}

      {tab==="jobs"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {jobs.map(j=>(
            <div key={j.id} style={{ background:T.card, border:`1px solid ${j.status==="failed"?"rgba(248,113,113,.2)":j.status==="retrying"?"rgba(251,146,60,.2)":T.border}`, borderRadius:13, padding:"14px 18px", display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:(statusColor as Record<string,string>)[j.status], flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{j.jobName}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:(statusColor as Record<string,string>)[j.status], background:`${(statusColor as Record<string,string>)[j.status]}15`, padding:"2px 7px", borderRadius:5, textTransform:"capitalize" }}>{j.status}</span>
                </div>
                {j.error&&<p style={{ fontSize:12, color:"#f87171", margin:"0 0 3px", fontFamily:"monospace" }}>{j.error}</p>}
                <p style={{ fontSize:11, color:T.sub, margin:0 }}>Attempts: {j.attempts}/{j.maxAttempts} · Last: {safeFmt(j.lastAttempt, "MMM d, HH:mm")}{j.nextRetry?` · Next retry: ${safeFmt(j.nextRetry, "HH:mm")}`:""}</p>
              </div>
              {(j.status==="failed"||j.status==="retrying")&&(
                <button onClick={()=>retryJob(j.id)} disabled={retrying===j.id} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 13px", borderRadius:8, background:"rgba(99,102,241,.1)", border:`1px solid rgba(99,102,241,.2)`, color:T.badgeFg, fontSize:12, fontWeight:600, cursor:"pointer", opacity:retrying===j.id?.7:1 }}>
                  <RefreshCw size={12} className={retrying===j.id?"animate-spin":""}/>{retrying===j.id?"Retrying…":"Retry"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="queue"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ background:"rgba(99,102,241,.06)", border:"1px solid rgba(99,102,241,.15)", borderRadius:12, padding:"10px 14px", marginBottom:4 }}>
            <p style={{ fontSize:12, color:T.sub, margin:0, lineHeight:1.6 }}>Heavy operations are queued to prevent server overload. Queue items process one at a time in order of submission. Super Admins can re-order or cancel queued operations.</p>
          </div>
          {queue.map((q,i)=>(
            <div key={q.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:13, padding:"14px 18px", display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:24, height:24, borderRadius:7, background:`${(statusColor as Record<string,string>)[q.status]}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:800, color:(statusColor as Record<string,string>)[q.status] }}>#{i+1}</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:T.text, margin:"0 0 3px" }}>{q.operation}</p>
                <p style={{ fontSize:12, color:T.sub, margin:0 }}>By {q.requestedBy} · {q.size.toLocaleString()} items · Queued {safeDist(q.queuedAt)} ago</p>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:(statusColor as Record<string,string>)[q.status], background:`${(statusColor as Record<string,string>)[q.status]}15`, padding:"3px 9px", borderRadius:6, textTransform:"capitalize" }}>{q.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
