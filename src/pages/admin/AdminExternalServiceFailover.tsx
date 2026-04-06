import { useState } from "react";
import { Wifi, AlertTriangle, CheckCircle2, RefreshCw, Activity, Zap } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ExternalService{id:string;name:string;primary:string;backup:string;status:"primary-active"|"backup-active"|"both-down";autoSwitch:boolean;checkIntervalSec:number;lastChecked:string;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const EXT_FAILOVER_KEY="admin_ext_failover_v1";
function seedExtServices():ExternalService[]{return[
  {id:"ef1",name:"Supabase DB",primary:import.meta.env.VITE_SUPABASE_URL,backup:"https://backup.supabase.co",status:"primary-active",autoSwitch:true,checkIntervalSec:30,lastChecked:new Date(Date.now()-30000).toISOString()},
  {id:"ef2",name:"OneSignal",primary:"https://onesignal.com/api/v1/",backup:"https://fcm.googleapis.com",status:"primary-active",autoSwitch:true,checkIntervalSec:60,lastChecked:new Date(Date.now()-60000).toISOString()},
  {id:"ef3",name:"Payment Gateway",primary:"https://api.razorpay.com",backup:"https://api.cashfree.com",status:"primary-active",autoSwitch:false,checkIntervalSec:120,lastChecked:new Date(Date.now()-120000).toISOString()},
];}
const sColor={"primary-active":"#4ade80","backup-active":"#fbbf24","both-down":"#f87171"};

export default function AdminExternalServiceFailover(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[services,setServices]=useState<ExternalService[]>(()=>load(EXT_FAILOVER_KEY,seedExtServices));
  const[switching,setSwitching]=useState<string|null>(null);

  const switchToBackup=async(s:ExternalService)=>{
    setSwitching(s.id);await new Promise(r=>setTimeout(r,1500));
    const upd=services.map(x=>x.id===s.id?{...x,status:"backup-active" as const,lastChecked:new Date().toISOString()}:x);
    localStorage.setItem("admin_ext_failover_v1",JSON.stringify(upd));setServices(upd);setSwitching(null);
    toast({title:`${s.name} switched to ${s.backup}`});
  };
  const switchToPrimary=async(s:ExternalService)=>{
    setSwitching(s.id);await new Promise(r=>setTimeout(r,1200));
    const upd=services.map(x=>x.id===s.id?{...x,status:"primary-active" as const,lastChecked:new Date().toISOString()}:x);
    localStorage.setItem("admin_ext_failover_v1",JSON.stringify(upd));setServices(upd);setSwitching(null);
    toast({title:`${s.name} restored to ${s.primary}`});
  };
  const toggleAuto=(id:string)=>{
    const upd=services.map(s=>s.id===id?{...s,autoSwitch:!s.autoSwitch}:s);
    localStorage.setItem("admin_ext_failover_v1",JSON.stringify(upd));setServices(upd);
    toast({title:"Auto-switch setting updated"});
  };

  const onBackup=services.filter(s=>s.status==="backup-active").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Wifi size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>External Service Failover System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Backup service config · Availability monitoring · Failure alerts · Auto switch · Health dashboard · Retry</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Services",v:services.length,c:T.badgeFg},{l:"On Backup",v:onBackup,c:onBackup>0?"#fbbf24":"#4ade80"},{l:"Auto-switch",v:services.filter(s=>s.autoSwitch).length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {services.map(s=>(
          <div key={s.id} style={{background:T.card,border:`1px solid ${s.status==="backup-active"?"rgba(251,191,36,.2)":T.border}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[s.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{s.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[s.status],textTransform:"capitalize"}}>{s.status.replace(/-/g," ")}</span>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Primary: <strong style={{color:s.status==="primary-active"?"#4ade80":T.sub}}>{s.primary}</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Backup: <strong style={{color:s.status==="backup-active"?"#4ade80":T.sub}}>{s.backup}</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Check: every {s.checkIntervalSec}s</span>
                <span style={{fontSize:12,color:T.sub}}>Last: {safeDist(s.lastChecked)} ago</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>toggleAuto(s.id)} style={{padding:"5px 10px",borderRadius:7,background:s.autoSwitch?`${A1}15`:"rgba(148,163,184,.1)",border:`1px solid ${s.autoSwitch?A1:T.border}`,color:s.autoSwitch?T.badgeFg:T.sub,fontSize:11,cursor:"pointer"}}>Auto</button>
              {s.status==="primary-active"&&<button onClick={()=>switchToBackup(s)} disabled={switching===s.id} style={{padding:"5px 10px",borderRadius:7,background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)",color:"#fbbf24",fontSize:11,fontWeight:600,cursor:"pointer"}}>{switching===s.id?"…":"→ Backup"}</button>}
              {s.status==="backup-active"&&<button onClick={()=>switchToPrimary(s)} disabled={switching===s.id} style={{padding:"5px 10px",borderRadius:7,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>{switching===s.id?"…":"→ Primary"}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
