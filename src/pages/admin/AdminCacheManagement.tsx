import { useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2, Trash2, Clock, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface CacheModule{id:string;name:string;sizeMB:number;ttlMins:number;hitRate:number;status:"fresh"|"stale"|"expired";lastUpdated:string;}
const seed=():CacheModule[]=>[
  {id:"c1",name:"User Profiles",sizeMB:14.2,ttlMins:30,hitRate:94,status:"fresh",lastUpdated:new Date(Date.now()-900000).toISOString()},
  {id:"c2",name:"Job Listings",sizeMB:42.8,ttlMins:10,hitRate:87,status:"stale",lastUpdated:new Date(Date.now()-1800000).toISOString()},
  {id:"c3",name:"API Responses",sizeMB:8.4,ttlMins:5,hitRate:99,status:"fresh",lastUpdated:new Date(Date.now()-120000).toISOString()},
  {id:"c4",name:"Search Results",sizeMB:22.1,ttlMins:15,hitRate:78,status:"expired",lastUpdated:new Date(Date.now()-3600000).toISOString()},
  {id:"c5",name:"Wallet Balances",sizeMB:3.2,ttlMins:1,hitRate:91,status:"fresh",lastUpdated:new Date(Date.now()-30000).toISOString()},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={fresh:"#4ade80",stale:"#fbbf24",expired:"#f87171"};

export default function AdminCacheManagement(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[modules,setModules]=useState(()=>load("admin_cache_v1",seed));
  const[clearing,setClearing]=useState<string|null>(null);
  const[ttl,setTtl]=useState<Record<string,number>>(()=>Object.fromEntries(seed().map(m=>[m.id,m.ttlMins])));

  const clear=async(m:CacheModule)=>{
    setClearing(m.id);await new Promise(r=>setTimeout(r,800));
    const upd=modules.map(x=>x.id===m.id?{...x,sizeMB:0,status:"fresh" as const,hitRate:0,lastUpdated:new Date().toISOString()}:x);
    localStorage.setItem("admin_cache_v1",JSON.stringify(upd));setModules(upd);setClearing(null);
    toast({title:`${m.name} cache cleared`});
  };
  const clearAll=async()=>{
    setClearing("all");await new Promise(r=>setTimeout(r,1500));
    const upd=modules.map(x=>({...x,sizeMB:0,status:"fresh" as const,hitRate:0,lastUpdated:new Date().toISOString()}));
    localStorage.setItem("admin_cache_v1",JSON.stringify(upd));setModules(upd);setClearing(null);
    toast({title:"All caches cleared"});
  };
  const saveTtl=(id:string,val:number)=>{
    const upd=modules.map(x=>x.id===id?{...x,ttlMins:val}:x);
    localStorage.setItem("admin_cache_v1",JSON.stringify(upd));setModules(upd);
    toast({title:"TTL updated"});
  };

  const stale=modules.filter(m=>m.status!=="fresh").length;
  const totalMB=modules.reduce((s,m)=>s+m.sizeMB,0);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><RefreshCw size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Cache Management System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Manual clear · Auto refresh · TTL config · Cache status · Consistency check · Scheduled cleanup</p>
          </div>
          <button onClick={clearAll} disabled={clearing==="all"} style={{padding:"9px 16px",borderRadius:10,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {clearing==="all"?"Clearing…":"Clear All"}
          </button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Modules",v:modules.length,c:T.badgeFg},{l:"Stale/Expired",v:stale,c:stale>0?"#fbbf24":"#4ade80"},{l:"Total Size",v:`${totalMB.toFixed(1)} MB`,c:T.badgeFg},{l:"Avg Hit Rate",v:`${Math.round(modules.reduce((s,m)=>s+m.hitRate,0)/modules.length)}%`,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {modules.map(m=>(
          <div key={m.id} style={{background:T.card,border:`1px solid ${m.status!=="fresh"?`${sColor[m.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[m.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{m.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[m.status],background:`${sColor[m.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{m.status}</span>
                <span style={{fontSize:10,color:T.sub}}>Hit: {m.hitRate}%</span>
                <span style={{fontSize:10,color:T.sub}}>{m.sizeMB.toFixed(1)} MB</span>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>TTL:</span>
                <input type="number" value={ttl[m.id]||m.ttlMins} onChange={e=>setTtl(p=>({...p,[m.id]:+e.target.value}))} onBlur={()=>saveTtl(m.id,ttl[m.id])} style={{width:60,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"3px 8px",fontSize:12}}/>
                <span style={{fontSize:12,color:T.sub}}>mins · Last: {format(new Date(m.lastUpdated),"HH:mm:ss")}</span>
              </div>
            </div>
            <button onClick={()=>clear(m)} disabled={clearing===m.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              <Trash2 size={10}/>{clearing===m.id?"…":"Clear"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
