import { useState, useEffect } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Eye, Server } from "lucide-react";
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

interface MonitoringService{id:string;name:string;type:string;primary:boolean;status:"active"|"standby"|"failed"|"recovering";uptimePct:number;lastCheck:string;failoverReady:boolean;}

const seedServices=():MonitoringService[]=>[
  {id:"ms1",name:"Supabase Realtime",type:"database",primary:true,status:"active",uptimePct:99.9,lastCheck:new Date(Date.now()-30000).toISOString(),failoverReady:true},
  {id:"ms2",name:"Replit Health Monitor",type:"infrastructure",primary:true,status:"active",uptimePct:99.7,lastCheck:new Date(Date.now()-60000).toISOString(),failoverReady:true},
  {id:"ms3",name:"Error Tracking (Primary)",type:"errors",primary:true,status:"failed",uptimePct:94.2,lastCheck:new Date(Date.now()-900000).toISOString(),failoverReady:false},
  {id:"ms4",name:"Error Tracking (Backup)",type:"errors",primary:false,status:"recovering",uptimePct:98.4,lastCheck:new Date(Date.now()-120000).toISOString(),failoverReady:false},
  {id:"ms5",name:"Uptime Robot",type:"uptime",primary:false,status:"standby",uptimePct:100,lastCheck:new Date(Date.now()-1800000).toISOString(),failoverReady:true},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={active:"#4ade80",standby:"#94a3b8",failed:"#f87171",recovering:"#fbbf24"};

export default function AdminMonitoringRedundancy(){
  const{theme}=useDashboardTheme();const T=TH[theme];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[services,setServices]=useState<MonitoringService[]>(()=>load("admin_mon_redundancy_v1",seedServices));
  const[activating,setActivating]=useState<string|null>(null);

  const activateFailover=async(s:MonitoringService)=>{
    setActivating(s.id);
    await new Promise(r=>setTimeout(r,1500));
    const upd=services.map(x=>x.id===s.id?{...x,status:"active" as const,failoverReady:true}:x);
    localStorage.setItem("admin_mon_redundancy_v1",JSON.stringify(upd));setServices(upd);setActivating(null);
    logAction("Monitoring Failover",`${s.name} activated`,"System","warning");
    toast({title:`${s.name} failover activated`});
  };

  const failed=services.filter(s=>s.status==="failed").length;
  const active=services.filter(s=>s.status==="active").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Activity size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Monitoring Redundancy System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Redundancy · Health check alerts · Service backup · Failover · Uptime tracking · Health verification</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Services",v:services.length,c:T.badgeFg},{l:"Active",v:active,c:"#4ade80"},{l:"Failed",v:failed,c:failed>0?"#f87171":"#4ade80"},{l:"Standby",v:services.filter(s=>s.status==="standby").length,c:"#94a3b8"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {services.map(s=>(
          <div key={s.id} style={{background:T.card,border:`1px solid ${s.status==="failed"?"rgba(248,113,113,.25)":s.status==="recovering"?"rgba(251,191,36,.15)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:sColor[s.status],flexShrink:0,boxShadow:s.status==="active"?`0 0 8px ${sColor[s.status]}66`:undefined}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{s.name}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{s.type}</span>
                {s.primary&&<span style={{fontSize:10,color:A1,background:`${A1}15`,padding:"2px 7px",borderRadius:5}}>primary</span>}
                <span style={{fontSize:10,fontWeight:700,color:sColor[s.status],background:`${sColor[s.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{s.status}</span>
                {s.failoverReady&&<span style={{fontSize:10,color:"#4ade80"}}>✓ failover ready</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Uptime: <strong style={{color:s.uptimePct>99?"#4ade80":s.uptimePct>95?"#fbbf24":"#f87171"}}>{s.uptimePct}%</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Last check: {safeDist(s.lastCheck)} ago</span>
              </div>
            </div>
            {(s.status==="failed"||s.status==="standby"||s.status==="recovering")&&<button onClick={()=>activateFailover(s)} disabled={activating===s.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {activating===s.id?"Activating…":"Activate Failover"}
            </button>}
          </div>
        ))}
      </div>
    </div>
  );
}
