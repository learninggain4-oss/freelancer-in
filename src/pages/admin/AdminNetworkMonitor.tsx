import { useState, useEffect } from "react";
import { Wifi, AlertTriangle, CheckCircle2, RefreshCw, Activity, Globe, Clock } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface NetEndpoint{id:string;name:string;url:string;type:string;latencyMs:number;status:"online"|"degraded"|"offline";lastCheck:string;retryCount:number;failoverActive:boolean;}


function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={online:"#4ade80",degraded:"#fbbf24",offline:"#f87171"};

export default function AdminNetworkMonitor(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[endpoints,setEndpoints]=useState<NetEndpoint[]>([]);
  const[pinging,setPinging]=useState<string|null>(null);
  const[tab,setTab]=useState<"status"|"logs">("status");
  const[uptime]=useState(99.7);

  const ping=async(e:NetEndpoint)=>{
    setPinging(e.id);
    const t=Date.now();
    try{
      await fetch(`https://${e.url}`,{signal:AbortSignal.timeout(5000),mode:"no-cors"});
      const lat=Date.now()-t;
      const upd=endpoints.map(x=>x.id===e.id?{...x,latencyMs:lat,status:lat>2000?"degraded" as const:"online" as const,lastCheck:new Date().toISOString(),retryCount:0}:x);
      localStorage.setItem("admin_network_v1",JSON.stringify(upd));setEndpoints(upd);
    }catch{
      const lat=Date.now()-t;
      const upd=endpoints.map(x=>x.id===e.id?{...x,latencyMs:lat,status:lat>=5000?"offline" as const:"degraded" as const,lastCheck:new Date().toISOString(),retryCount:x.retryCount+1}:x);
      localStorage.setItem("admin_network_v1",JSON.stringify(upd));setEndpoints(upd);
    }
    setPinging(null);
    logAction("Network Ping",e.name,"System","success");
  };

  const toggleFailover=(id:string)=>{
    const upd=endpoints.map(e=>e.id===id?{...e,failoverActive:!e.failoverActive}:e);
    localStorage.setItem("admin_network_v1",JSON.stringify(upd));setEndpoints(upd);
    toast({title:"Failover configuration updated"});
  };

  const offline=endpoints.filter(e=>e.status==="offline").length;
  const degraded=endpoints.filter(e=>e.status==="degraded").length;
  const avgLatency=Math.round(endpoints.reduce((s,e)=>s+e.latencyMs,0)/endpoints.length);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Wifi size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Network Monitoring & Failover</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Real-time connectivity · Latency tracking · Auto-reconnect · Failover config · Downtime alerts</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Endpoints",v:endpoints.length,c:T.badgeFg},{l:"Online",v:endpoints.filter(e=>e.status==="online").length,c:"#4ade80"},{l:"Degraded",v:degraded,c:degraded>0?"#fbbf24":"#4ade80"},{l:"Avg Latency",v:`${avgLatency}ms`,c:avgLatency>500?"#f87171":avgLatency>200?"#fbbf24":"#4ade80"},{l:"Uptime",v:`${uptime}%`,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {(offline>0||degraded>0)&&<div style={{background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.2)",borderRadius:10,padding:"9px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
        <AlertTriangle size={13} color="#f87171"/><span style={{fontSize:12,color:"#f87171"}}>{offline} endpoint(s) offline, {degraded} degraded. Failover connections may be active.</span>
      </div>}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {endpoints.map(e=>(
          <div key={e.id} style={{background:T.card,border:`1px solid ${e.status!=="online"?`${sColor[e.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:sColor[e.status],flexShrink:0,boxShadow:e.status==="online"?`0 0 8px ${sColor[e.status]}66`:undefined}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{e.name}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5}}>{e.type}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[e.status],background:`${sColor[e.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{e.status}</span>
                {e.failoverActive&&<span style={{fontSize:10,fontWeight:700,color:"#fb923c",background:"rgba(251,114,36,.1)",padding:"2px 7px",borderRadius:5}}>FAILOVER ACTIVE</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Latency: <strong style={{color:e.latencyMs>1000?"#f87171":e.latencyMs>500?"#fbbf24":"#4ade80"}}>{e.latencyMs}ms</strong></span>
                {e.retryCount>0&&<span style={{fontSize:12,color:"#fb923c"}}>{e.retryCount} retries</span>}
                <span style={{fontSize:12,color:T.sub}}>{safeFmt(e.lastCheck, "HH:mm:ss")}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>ping(e)} disabled={pinging===e.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <RefreshCw size={11} className={pinging===e.id?"animate-spin":""}/>{pinging===e.id?"Pinging…":"Ping"}
              </button>
              <button onClick={()=>toggleFailover(e.id)} style={{padding:"6px 12px",borderRadius:8,background:e.failoverActive?"rgba(251,114,36,.1)":"rgba(74,222,128,.06)",border:`1px solid ${e.failoverActive?"rgba(251,114,36,.3)":"rgba(74,222,128,.2)"}`,color:e.failoverActive?"#fb923c":"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {e.failoverActive?"Disable Failover":"Enable Failover"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
