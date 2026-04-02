import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, Activity, Clock, Zap, HardDrive } from "lucide-react";
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

interface RecoveryPlan{id:string;name:string;rto:string;rpo:string;priority:"critical"|"high"|"medium";lastTested:string;testResult:"pass"|"fail"|"untested";autoRecovery:boolean;status:"ready"|"activating"|"not_ready";}
interface RecoveryLog{id:string;event:string;trigger:string;durationMins:number;success:boolean;at:string;}

const seedPlans=():RecoveryPlan[]=>[
  {id:"rp1",name:"Database Full Recovery",rto:"4h",rpo:"1h",priority:"critical",lastTested:new Date(Date.now()-86400000*7).toISOString(),testResult:"pass",autoRecovery:true,status:"ready"},
  {id:"rp2",name:"App Server Restart",rto:"15m",rpo:"0",priority:"critical",lastTested:new Date(Date.now()-86400000*14).toISOString(),testResult:"pass",autoRecovery:true,status:"ready"},
  {id:"rp3",name:"Payment Gateway Failover",rto:"30m",rpo:"5m",priority:"high",lastTested:new Date(Date.now()-86400000*30).toISOString(),testResult:"fail",autoRecovery:false,status:"not_ready"},
  {id:"rp4",name:"Full System Restore",rto:"24h",rpo:"4h",priority:"high",lastTested:new Date(Date.now()-86400000*90).toISOString(),testResult:"untested",autoRecovery:false,status:"not_ready"},
];
const seedLogs=():RecoveryLog[]=>[
  {id:"rl1",event:"DB connection pool exhausted — auto restart",trigger:"Auto",durationMins:4,success:true,at:new Date(Date.now()-86400000*3).toISOString()},
  {id:"rl2",event:"Payment gateway timeout — failover initiated",trigger:"Admin",durationMins:18,success:false,at:new Date(Date.now()-86400000*10).toISOString()},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={ready:"#4ade80",activating:"#a5b4fc",not_ready:"#f87171"};
const prColor={critical:"#f87171",high:"#fb923c",medium:"#fbbf24"};

export default function AdminDisasterRecovery(){
  const{theme}=useDashboardTheme();const T=TH[theme];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[tab,setTab]=useState<"plans"|"logs">("plans");
  const[plans,setPlans]=useState<RecoveryPlan[]>(()=>load("admin_dr_plans_v1",seedPlans));
  const[logs]=useState<RecoveryLog[]>(()=>load("admin_dr_logs_v1",seedLogs));
  const[testing,setTesting]=useState<string|null>(null);
  const[activating,setActivating]=useState<string|null>(null);
  const[confirmActivate,setConfirmActivate]=useState<string|null>(null);

  const testPlan=async(p:RecoveryPlan)=>{
    setTesting(p.id);
    await new Promise(r=>setTimeout(r,3000));
    const ok=Math.random()>.2;
    const upd=plans.map(x=>x.id===p.id?{...x,lastTested:new Date().toISOString(),testResult:ok?"pass" as const:"fail" as const,status:ok?"ready" as const:"not_ready" as const}:x);
    localStorage.setItem("admin_dr_plans_v1",JSON.stringify(upd));setPlans(upd);setTesting(null);
    logAction("DR Test",`${p.name} — ${ok?"PASS":"FAIL"}`,"System",ok?"success":"warning");
    toast({title:`${p.name} test — ${ok?"PASSED":"FAILED"}`});
  };

  const activatePlan=async(p:RecoveryPlan)=>{
    setActivating(p.id);setConfirmActivate(null);
    const upd1=plans.map(x=>x.id===p.id?{...x,status:"activating" as const}:x);setPlans(upd1);
    await new Promise(r=>setTimeout(r,4000));
    const upd2=plans.map(x=>x.id===p.id?{...x,status:"ready" as const}:x);
    localStorage.setItem("admin_dr_plans_v1",JSON.stringify(upd2));setPlans(upd2);setActivating(null);
    logAction("DR Activated",p.name,"System","warning");
    toast({title:`Disaster recovery plan activated: ${p.name}`});
  };

  const notReady=plans.filter(p=>p.status==="not_ready").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <ShieldCheck size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Disaster Recovery Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Recovery testing · Backup restore · Status monitoring · Recovery alerts · Logs · System restart automation</p>
          </div>
        </div>
        {notReady>0&&<div style={{marginTop:12,background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.2)",borderRadius:9,padding:"8px 14px",display:"flex",gap:8,alignItems:"center"}}>
          <AlertTriangle size={13} color="#f87171"/><span style={{fontSize:12,color:"#f87171"}}>{notReady} plan(s) not ready — test and fix before a real disaster strikes</span>
        </div>}
        <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
          {[{l:"Recovery Plans",v:plans.length,c:T.badgeFg},{l:"Ready",v:plans.filter(p=>p.status==="ready").length,c:"#4ade80"},{l:"Not Ready",v:notReady,c:notReady>0?"#f87171":"#4ade80"},{l:"Last Test",v:plans.filter(p=>p.testResult==="pass").length+" passed",c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:16,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["plans","Recovery Plans",ShieldCheck],["logs","Event Logs",Activity]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}
          </button>
        ))}
      </div>

      {tab==="plans"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {plans.map(p=>(
          <div key={p.id} style={{background:T.card,border:`1px solid ${p.status==="not_ready"?"rgba(248,113,113,.2)":p.status==="activating"?`${A1}40`:T.border}`,borderRadius:14,padding:"16px 18px"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{p.name}</span>
                  <span style={{fontSize:10,fontWeight:700,color:prColor[p.priority],background:`${prColor[p.priority]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{p.priority}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[p.status],background:`${sColor[p.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{p.status.replace("_"," ")}</span>
                  {p.autoRecovery&&<span style={{fontSize:10,color:"#4ade80"}}>✓ auto-recovery</span>}
                  {p.testResult==="pass"&&<span style={{fontSize:10,color:"#4ade80"}}>✓ tested</span>}
                  {p.testResult==="fail"&&<span style={{fontSize:10,color:"#f87171"}}>✗ test failed</span>}
                  {p.testResult==="untested"&&<span style={{fontSize:10,color:"#94a3b8"}}>untested</span>}
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:T.sub}}>RTO: <strong style={{color:T.text}}>{p.rto}</strong></span>
                  <span style={{fontSize:12,color:T.sub}}>RPO: <strong style={{color:T.text}}>{p.rpo||"0"}</strong></span>
                  <span style={{fontSize:12,color:T.sub}}>Last test: {formatDistanceToNow(new Date(p.lastTested))} ago</span>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>testPlan(p)} disabled={testing===p.id||p.status==="activating"} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <RefreshCw size={10} className={testing===p.id?"animate-spin":""}/>{testing===p.id?"Testing…":"Run Test"}
              </button>
              {confirmActivate===p.id
                ?<div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#fbbf24"}}>This will trigger live recovery. Confirm?</span>
                  <button onClick={()=>activatePlan(p)} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",color:"#f87171",fontSize:11,fontWeight:700,cursor:"pointer"}}>{activating===p.id?"Activating…":"Confirm"}</button>
                  <button onClick={()=>setConfirmActivate(null)} style={{padding:"6px 10px",borderRadius:8,background:T.input,border:`1px solid ${T.border}`,color:T.sub,fontSize:11,cursor:"pointer"}}>Cancel</button>
                </div>
                :<button onClick={()=>setConfirmActivate(p.id)} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>{p.status==="activating"?"Activating…":"Activate Plan"}</button>}
            </div>
          </div>
        ))}
      </div>}

      {tab==="logs"&&<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
        {logs.map((l,i)=>(
          <div key={l.id} style={{display:"flex",gap:12,padding:"13px 18px",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            {l.success?<CheckCircle2 size={14} color="#4ade80" style={{flexShrink:0}}/>:<AlertTriangle size={14} color="#f87171" style={{flexShrink:0}}/>}
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 2px"}}>{l.event}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>Trigger: {l.trigger} · Duration: {l.durationMins}m · {format(new Date(l.at),"MMM d, HH:mm")}</p>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
