import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2, Activity, Clock, Shield } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface SyncJob{id:string;name:string;source:string;target:string;intervalMins:number;lastSyncAt:string;nextSyncAt:string;status:"synced"|"syncing"|"delayed"|"error";delayMins:number;rowsSync:number;errors:number;}

const seedJobs=():SyncJob[]=>[
  {id:"sj1",name:"User Profiles Sync",source:"Supabase Primary",target:"Supabase Replica",intervalMins:5,lastSyncAt:new Date(Date.now()-180000).toISOString(),nextSyncAt:new Date(Date.now()+120000).toISOString(),status:"synced",delayMins:0,rowsSync:12840,errors:0},
  {id:"sj2",name:"Wallet Transactions",source:"Supabase Primary",target:"Analytics DB",intervalMins:15,lastSyncAt:new Date(Date.now()-1800000).toISOString(),nextSyncAt:new Date(Date.now()-600000).toISOString(),status:"delayed",delayMins:10,rowsSync:84200,errors:0},
  {id:"sj3",name:"Notification Queue",source:"Queue Service",target:"Supabase Primary",intervalMins:1,lastSyncAt:new Date(Date.now()-3600000).toISOString(),nextSyncAt:new Date(Date.now()-3000000).toISOString(),status:"error",delayMins:50,rowsSync:215000,errors:14},
  {id:"sj4",name:"Job Listings Cache",source:"Supabase Primary",target:"Redis Cache",intervalMins:10,lastSyncAt:new Date(Date.now()-540000).toISOString(),nextSyncAt:new Date(Date.now()+60000).toISOString(),status:"synced",delayMins:0,rowsSync:4510,errors:0},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={synced:"#4ade80",syncing:"#a5b4fc",delayed:"#fbbf24",error:"#f87171"};

export default function AdminDataSync(){
  const{theme}=useDashboardTheme();const T=TH[theme];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[jobs,setJobs]=useState<SyncJob[]>(()=>load("admin_data_sync_v1",seedJobs));
  const[syncing,setSyncing]=useState<string|null>(null);

  const forceSync=async(j:SyncJob)=>{
    setSyncing(j.id);
    const upd1=jobs.map(x=>x.id===j.id?{...x,status:"syncing" as const}:x);
    setJobs(upd1);
    await new Promise(r=>setTimeout(r,2000));
    const upd2=jobs.map(x=>x.id===j.id?{...x,status:"synced" as const,delayMins:0,errors:0,lastSyncAt:new Date().toISOString(),nextSyncAt:new Date(Date.now()+j.intervalMins*60000).toISOString()}:x);
    localStorage.setItem("admin_data_sync_v1",JSON.stringify(upd2));setJobs(upd2);setSyncing(null);
    logAction("Force Sync",j.name,"System","success");
    toast({title:`${j.name} synced — ${j.rowsSync.toLocaleString()} rows`});
  };

  const issues=jobs.filter(j=>j.status!=="synced").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <RefreshCw size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Data Synchronization Monitor</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Sync status · Retry mechanism · Delay alerts · Performance dashboard · Error detection · Consistency</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Sync Jobs",v:jobs.length,c:T.badgeFg},{l:"Synced",v:jobs.filter(j=>j.status==="synced").length,c:"#4ade80"},{l:"Issues",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Total Rows",v:jobs.reduce((s,j)=>s+j.rowsSync,0).toLocaleString(),c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {jobs.map(j=>(
          <div key={j.id} style={{background:T.card,border:`1px solid ${j.status!=="synced"?`${sColor[j.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:sColor[j.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{j.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[j.status],background:`${sColor[j.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{j.status}</span>
                {j.delayMins>0&&<span style={{fontSize:10,color:"#fbbf24"}}>⚠ {j.delayMins}m delay</span>}
                {j.errors>0&&<span style={{fontSize:10,color:"#f87171"}}>{j.errors} errors</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>{j.source} → {j.target}</span>
                <span style={{fontSize:12,color:T.sub}}>Every {j.intervalMins}m</span>
                <span style={{fontSize:12,color:T.sub}}>{j.rowsSync.toLocaleString()} rows</span>
                <span style={{fontSize:12,color:T.sub}}>Last: {formatDistanceToNow(new Date(j.lastSyncAt))} ago</span>
              </div>
            </div>
            {j.status!=="synced"&&<button onClick={()=>forceSync(j)} disabled={syncing===j.id||j.status==="syncing"} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              <RefreshCw size={11} className={syncing===j.id||j.status==="syncing"?"animate-spin":""}/>{syncing===j.id||j.status==="syncing"?"Syncing…":"Force Sync"}
            </button>}
          </div>
        ))}
      </div>
    </div>
  );
}
