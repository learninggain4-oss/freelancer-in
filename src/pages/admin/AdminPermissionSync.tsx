import { useState } from "react";
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Clock, Activity, Users } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface RoleCache{id:string;role:string;users:number;cacheAge:number;syncStatus:"synced"|"stale"|"syncing";lastSync:string;pendingChanges:number;}

const seedCaches=():RoleCache[]=>[
  {id:"rc1",role:"admin",users:3,cacheAge:45,syncStatus:"synced",lastSync:new Date(Date.now()-2700000).toISOString(),pendingChanges:0},
  {id:"rc2",role:"client",users:4200,cacheAge:840,syncStatus:"stale",lastSync:new Date(Date.now()-50400000).toISOString(),pendingChanges:12},
  {id:"rc3",role:"freelancer",users:8560,cacheAge:720,syncStatus:"stale",lastSync:new Date(Date.now()-43200000).toISOString(),pendingChanges:34},
  {id:"rc4",role:"moderator",users:8,cacheAge:90,syncStatus:"synced",lastSync:new Date(Date.now()-5400000).toISOString(),pendingChanges:0},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={synced:"#4ade80",stale:"#fbbf24",syncing:"#a5b4fc"};

export default function AdminPermissionSync(){
  const{theme}=useDashboardTheme();const T=TH[theme];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[caches,setCaches]=useState<RoleCache[]>(()=>load("admin_perm_sync_v1",seedCaches));
  const[syncing,setSyncing]=useState<string|null>(null);
  const[syncingAll,setSyncingAll]=useState(false);

  const syncRole=async(rc:RoleCache)=>{
    setSyncing(rc.id);
    const upd1=caches.map(x=>x.id===rc.id?{...x,syncStatus:"syncing" as const}:x);
    setCaches(upd1);
    await new Promise(r=>setTimeout(r,2000));
    const upd2=caches.map(x=>x.id===rc.id?{...x,syncStatus:"synced" as const,cacheAge:0,pendingChanges:0,lastSync:new Date().toISOString()}:x);
    localStorage.setItem("admin_perm_sync_v1",JSON.stringify(upd2));setCaches(upd2);setSyncing(null);
    logAction("Permission Sync",`Role: ${rc.role} — ${rc.pendingChanges} changes applied`,"System","success");
    toast({title:`${rc.role} permissions synced — ${rc.pendingChanges} changes applied`});
  };

  const syncAll=async()=>{
    setSyncingAll(true);
    const upd1=caches.map(x=>({...x,syncStatus:"syncing" as const}));
    setCaches(upd1);
    await new Promise(r=>setTimeout(r,3000));
    const upd2=caches.map(x=>({...x,syncStatus:"synced" as const,cacheAge:0,pendingChanges:0,lastSync:new Date().toISOString()}));
    localStorage.setItem("admin_perm_sync_v1",JSON.stringify(upd2));setCaches(upd2);setSyncingAll(false);
    logAction("Full Permission Sync","All roles synced","System","success");
    toast({title:"All permission caches refreshed"});
  };

  const stale=caches.filter(c=>c.syncStatus==="stale").length;
  const pending=caches.reduce((s,c)=>s+c.pendingChanges,0);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <ShieldCheck size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Permission Synchronization System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Cache refresh · Access validation · Permission sync · Role sync · Change alerts</p>
          </div>
          <button onClick={syncAll} disabled={syncingAll} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            <RefreshCw size={13} className={syncingAll?"animate-spin":""}/>{syncingAll?"Syncing…":"Sync All"}
          </button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Roles",v:caches.length,c:T.badgeFg},{l:"Stale Caches",v:stale,c:stale>0?"#fbbf24":"#4ade80"},{l:"Pending Changes",v:pending,c:pending>0?"#f87171":"#4ade80"},{l:"Total Users",v:caches.reduce((s,c)=>s+c.users,0).toLocaleString(),c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {caches.map(rc=>(
          <div key={rc.id} style={{background:T.card,border:`1px solid ${rc.syncStatus==="stale"?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"16px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:sColor[rc.syncStatus],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text,textTransform:"capitalize"}}>{rc.role}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5}}>{rc.users.toLocaleString()} users</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[rc.syncStatus],background:`${sColor[rc.syncStatus]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{rc.syncStatus}</span>
                {rc.pendingChanges>0&&<span style={{fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 7px",borderRadius:5}}>{rc.pendingChanges} pending</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Cache age: <strong style={{color:rc.cacheAge>600?"#f87171":rc.cacheAge>120?"#fbbf24":"#4ade80"}}>{rc.cacheAge} min</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Last sync: {safeDist(rc.lastSync)} ago</span>
              </div>
            </div>
            <button onClick={()=>syncRole(rc)} disabled={syncing===rc.id||rc.syncStatus==="syncing"} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              <RefreshCw size={11} className={syncing===rc.id||rc.syncStatus==="syncing"?"animate-spin":""}/>{syncing===rc.id||rc.syncStatus==="syncing"?"Syncing…":"Sync"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
