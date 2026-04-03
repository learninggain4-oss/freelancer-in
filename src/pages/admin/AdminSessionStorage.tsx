import { useState, useEffect } from "react";
import { Monitor, AlertTriangle, CheckCircle2, RefreshCw, Activity, LogOut } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface SessionStats{activeSessions:number;maxSessions:number;expiredLast1h:number;avgSessionMins:number;overflowRisk:boolean;storageUsedMB:number;storageLimitMB:number;}
interface SessionEntry{id:string;user:string;device:string;startedAt:string;lastActivity:string;sizekb:number;}
const seedStats=():SessionStats=>({activeSessions:2840,maxSessions:5000,expiredLast1h:420,avgSessionMins:42,overflowRisk:false,storageUsedMB:280,storageLimitMB:500});
const seedSessions=():SessionEntry[]=>[
  {id:"s1",user:"admin@freelancer.in",device:"Chrome/Mac",startedAt:new Date(Date.now()-7200000).toISOString(),lastActivity:new Date(Date.now()-300000).toISOString(),sizekb:12},
  {id:"s2",user:"user_182 (idle 45min)",device:"Safari/iPhone",startedAt:new Date(Date.now()-3600000).toISOString(),lastActivity:new Date(Date.now()-2700000).toISOString(),sizekb:8},
  {id:"s3",user:"user_510",device:"Firefox/Windows",startedAt:new Date(Date.now()-1800000).toISOString(),lastActivity:new Date(Date.now()-60000).toISOString(),sizekb:15},
];
function load<T>(k:string,s:()=>T):T{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
function loadArr<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminSessionStorage(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];const{toast}=useToast();
  const[stats,setStats]=useState(()=>load("admin_sess_stor_stats_v1",seedStats));
  const[sessions,setSessions]=useState(()=>loadArr("admin_sess_stor_list_v1",seedSessions));
  const[cleaning,setCleaning]=useState(false);
  const[expiryMins,setExpiryMins]=useState(30);
  const[terminating,setTerminating]=useState<string|null>(null);

  const cleanup=async()=>{
    setCleaning(true);await new Promise(r=>setTimeout(r,2000));
    const freed=Math.round(stats.expiredLast1h*8);
    const newStats={...stats,storageUsedMB:Math.max(0,stats.storageUsedMB-freed/1024),activeSessions:stats.activeSessions-Math.round(stats.activeSessions*0.1)};
    localStorage.setItem("admin_sess_stor_stats_v1",JSON.stringify(newStats));setStats(newStats);setCleaning(false);
    toast({title:`Cleaned ${stats.expiredLast1h} expired sessions`});
  };
  const terminate=async(id:string)=>{
    setTerminating(id);await new Promise(r=>setTimeout(r,600));
    const upd=sessions.filter(s=>s.id!==id);
    localStorage.setItem("admin_sess_stor_list_v1",JSON.stringify(upd));setSessions(upd);setTerminating(null);
    toast({title:"Session terminated"});
  };

  const pct=Math.round((stats.storageUsedMB/stats.storageLimitMB)*100);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Monitor size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Session Storage Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Active session monitoring · Cleanup automation · Storage limit · Expiration enforcement · Overflow alerts</p>
          </div>
          <button onClick={cleanup} disabled={cleaning} style={{padding:"9px 14px",borderRadius:10,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer"}}>{cleaning?"Cleaning…":"Cleanup Expired"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Active Sessions",v:stats.activeSessions.toLocaleString(),c:T.badgeFg},{l:"Storage",v:`${pct}%`,c:pct>80?"#f87171":T.badgeFg},{l:"Avg Duration",v:`${stats.avgSessionMins}min`,c:T.badgeFg},{l:"Expired/hr",v:stats.expiredLast1h,c:T.sub}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Storage Usage</p>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:12,color:T.sub}}>{stats.storageUsedMB} / {stats.storageLimitMB} MB</span>
          <span style={{fontSize:12,color:pct>80?"#f87171":"#4ade80"}}>{pct}%</span>
        </div>
        <div style={{height:8,borderRadius:8,background:"rgba(255,255,255,.07)"}}>
          <div style={{height:"100%",borderRadius:8,background:pct>80?"#f87171":pct>60?"#fbbf24":"#4ade80",width:`${pct}%`}}/>
        </div>
        <div style={{marginTop:10,display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:12,color:T.sub}}>Session expiry:</span>
          <input type="number" value={expiryMins} onChange={e=>setExpiryMins(+e.target.value)} style={{width:70,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
          <span style={{fontSize:12,color:T.sub}}>min inactivity</span>
          <button onClick={()=>toast({title:`Session expiry set to ${expiryMins} min`})} style={{padding:"4px 12px",borderRadius:7,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,cursor:"pointer"}}>Save</button>
        </div>
      </div>
      <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Active Sessions (sample)</p>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {sessions.map((s,i)=>(
          <div key={s.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<sessions.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            <Monitor size={13} color={T.sub}/>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 1px"}}>{s.user} · {s.device}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>Active {safeDist(s.lastActivity)} ago · {s.sizekb} KB</p>
            </div>
            <button onClick={()=>terminate(s.id)} disabled={terminating===s.id} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:7,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,cursor:"pointer",flexShrink:0}}>
              <LogOut size={10}/>{terminating===s.id?"…":"Terminate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
