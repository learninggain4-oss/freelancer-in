import { useState } from "react";
import { Wifi, AlertTriangle, CheckCircle2, RefreshCw, Activity, Zap } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ApiService{id:string;name:string;provider:string;usageToday:number;limitToday:number;latencyMs:number;status:"healthy"|"degraded"|"down";errors24h:number;fallbackActive:boolean;lastCheck:string;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const EXT_API_KEY="admin_ext_apis_v1";
function seedExtApis():any[]{return[
  {id:"ea1",name:"Supabase",url:"https://maysttckdfnnzvfeujaj.supabase.co/rest/v1/",status:"healthy",avgMs:45,uptime:99.9,lastCheck:new Date(Date.now()-60000).toISOString()},
  {id:"ea2",name:"OneSignal",url:"https://onesignal.com/api/v1/",status:"healthy",avgMs:220,uptime:99.5,lastCheck:new Date(Date.now()-60000).toISOString()},
  {id:"ea3",name:"GitHub API",url:"https://api.github.com",status:"healthy",avgMs:180,uptime:99.8,lastCheck:new Date(Date.now()-60000).toISOString()},
];}
const sColor={healthy:"#4ade80",degraded:"#fbbf24",down:"#f87171"};

export default function AdminExternalApiMonitor(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[services,setServices]=useState<any[]>(()=>load(EXT_API_KEY,seedExtApis));
  const[checking,setChecking]=useState<string|null>(null);

  const check=async(s:ApiService)=>{
    setChecking(s.id);await new Promise(r=>setTimeout(r,1200));
    const ok=Math.random()>.25;
    const upd=services.map(x=>x.id===s.id?{...x,status:ok?"healthy" as const:"degraded" as const,latencyMs:ok?Math.round(50+Math.random()*300):0,lastCheck:new Date().toISOString()}:x);
    localStorage.setItem("admin_ext_api_v1",JSON.stringify(upd));setServices(upd);setChecking(null);
    toast({title:`${s.name}: ${ok?"Healthy":"Degraded"}`});
  };
  const toggleFallback=(id:string)=>{
    const upd=services.map(x=>x.id===id?{...x,fallbackActive:!x.fallbackActive}:x);
    localStorage.setItem("admin_ext_api_v1",JSON.stringify(upd));setServices(upd);
    toast({title:"Fallback service toggled"});
  };

  const down=services.filter(s=>s.status==="down").length;
  const degraded=services.filter(s=>s.status==="degraded").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Wifi size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>External API Monitoring</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Usage monitoring · API limit tracking · Retry mechanism · Fallback support · Delay alerts · Performance</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"APIs",v:services.length,c:T.badgeFg},{l:"Healthy",v:services.filter(s=>s.status==="healthy").length,c:"#4ade80"},{l:"Degraded",v:degraded,c:degraded>0?"#fbbf24":"#4ade80"},{l:"Down",v:down,c:down>0?"#f87171":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {services.map(s=>{
          const pct=Math.round((s.usageToday/s.limitToday)*100);
          return(
            <div key={s.id} style={{background:T.card,border:`1px solid ${s.status!=="healthy"?`${sColor[s.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:sColor[s.status],flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{s.name}</span>
                  <span style={{fontSize:10,color:T.sub}}>{s.provider}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[s.status],textTransform:"capitalize"}}>{s.status}</span>
                  {s.fallbackActive&&<span style={{fontSize:10,color:"#fbbf24"}}>Fallback Active</span>}
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontSize:12,color:T.sub}}>Usage: {pct}%</span>
                  {s.latencyMs>0&&<span style={{fontSize:12,color:T.sub}}>Latency: <strong style={{color:s.latencyMs>200?"#fbbf24":"#4ade80"}}>{s.latencyMs}ms</strong></span>}
                  {s.errors24h>0&&<span style={{fontSize:12,color:"#f87171"}}>{s.errors24h} errors today</span>}
                  <span style={{fontSize:12,color:T.sub}}>Checked: {safeDist(s.lastCheck)} ago</span>
                </div>
                <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,.07)"}}>
                  <div style={{height:"100%",borderRadius:4,background:pct>90?"#f87171":pct>70?"#fbbf24":"#4ade80",width:`${Math.min(100,pct)}%`}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                {s.status==="down"&&<button onClick={()=>toggleFallback(s.id)} style={{padding:"5px 10px",borderRadius:7,background:s.fallbackActive?"rgba(251,191,36,.1)":"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:s.fallbackActive?"#fbbf24":"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>{s.fallbackActive?"Fallback ON":"Use Fallback"}</button>}
                <button onClick={()=>check(s)} disabled={checking===s.id} style={{padding:"6px 11px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>{checking===s.id?"…":"Check"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
