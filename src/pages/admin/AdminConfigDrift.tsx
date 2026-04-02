import { useState } from "react";
import { GitBranch, AlertTriangle, CheckCircle2, RefreshCw, Lock, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ConfigItem{id:string;key:string;server1:string;server2:string;expected:string;drifted:boolean;lastSynced:string;category:string;}
const seed=():ConfigItem[]=>[
  {id:"c1",key:"MAX_UPLOAD_SIZE",server1:"50MB",server2:"50MB",expected:"50MB",drifted:false,lastSynced:new Date(Date.now()-3600000).toISOString(),category:"Storage"},
  {id:"c2",key:"SESSION_TIMEOUT",server1:"30min",server2:"60min",expected:"30min",drifted:true,lastSynced:new Date(Date.now()-7200000).toISOString(),category:"Security"},
  {id:"c3",key:"RATE_LIMIT_RPM",server1:"100",server2:"100",expected:"100",drifted:false,lastSynced:new Date(Date.now()-1800000).toISOString(),category:"API"},
  {id:"c4",key:"LOG_LEVEL",server1:"warn",server2:"debug",expected:"warn",drifted:true,lastSynced:new Date(Date.now()-86400000).toISOString(),category:"Logging"},
  {id:"c5",key:"PAYMENT_TIMEOUT_MS",server1:"30000",server2:"30000",expected:"30000",drifted:false,lastSynced:new Date(Date.now()-3600000).toISOString(),category:"Payments"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminConfigDrift(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[configs,setConfigs]=useState(()=>load("admin_config_drift_v1",seed));
  const[syncing,setSyncing]=useState<string|null>(null);
  const[syncAll,setSyncAll]=useState(false);

  const sync=async(id:string)=>{
    setSyncing(id);await new Promise(r=>setTimeout(r,1000));
    const upd=configs.map(c=>c.id===id?{...c,server2:c.expected,drifted:false,lastSynced:new Date().toISOString()}:c);
    localStorage.setItem("admin_config_drift_v1",JSON.stringify(upd));setConfigs(upd);setSyncing(null);
    toast({title:"Configuration synced"});
  };
  const syncAllFn=async()=>{
    setSyncAll(true);await new Promise(r=>setTimeout(r,2000));
    const upd=configs.map(c=>({...c,server2:c.expected,drifted:false,lastSynced:new Date().toISOString()}));
    localStorage.setItem("admin_config_drift_v1",JSON.stringify(upd));setConfigs(upd);setSyncAll(false);
    toast({title:"All configurations synced"});
  };

  const drifted=configs.filter(c=>c.drifted).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><GitBranch size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Configuration Synchronization</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Config comparison · Server sync · Version control · Change alerts · Audit logs · Backup · Rollback · Drift detection</p>
          </div>
          <button onClick={syncAllFn} disabled={syncAll} style={{padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{syncAll?"Syncing…":"Sync All"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Config Keys",v:configs.length,c:T.badgeFg},{l:"Drifted",v:drifted,c:drifted>0?"#f87171":"#4ade80"},{l:"In Sync",v:configs.length-drifted,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {configs.map(c=>(
          <div key={c.id} style={{background:T.card,border:`1px solid ${c.drifted?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{c.key}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 6px",borderRadius:4}}>{c.category}</span>
                {c.drifted?<span style={{fontSize:10,color:"#f87171",fontWeight:700}}>DRIFT DETECTED</span>:<span style={{fontSize:10,color:"#4ade80"}}>✓ In sync</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Server1: <code style={{color:T.text}}>{c.server1}</code></span>
                <span style={{fontSize:12,color:T.sub}}>Server2: <code style={{color:c.drifted?"#f87171":T.text}}>{c.server2}</code></span>
                {c.drifted&&<span style={{fontSize:12,color:T.sub}}>Expected: <code style={{color:"#4ade80"}}>{c.expected}</code></span>}
              </div>
              <p style={{fontSize:11,color:T.sub,margin:"3px 0 0"}}>Last synced: {safeDist(c.lastSynced)} ago</p>
            </div>
            {c.drifted&&<button onClick={()=>sync(c.id)} disabled={syncing===c.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {syncing===c.id?"Syncing…":"Sync"}
            </button>}
          </div>
        ))}
      </div>
    </div>
  );
}
