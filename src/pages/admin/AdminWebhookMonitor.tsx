import { useState } from "react";
import { Zap, AlertTriangle, CheckCircle2, RefreshCw, Activity, Shield } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Webhook{id:string;name:string;url:string;event:string;status:"active"|"failed"|"paused";deliveries24h:number;failures24h:number;avgResponseMs:number;retryCount:number;lastDelivery:string;backupUrl?:string;}
const seed=():Webhook[]=>[
  {id:"w1",name:"Razorpay Payment",url:"https://api.freelancer.in/webhooks/razorpay",event:"payment.captured",status:"active",deliveries24h:340,failures24h:2,avgResponseMs:84,retryCount:0,lastDelivery:new Date(Date.now()-120000).toISOString()},
  {id:"w2",name:"Job Status Update",url:"https://api.freelancer.in/webhooks/jobs",event:"job.completed",status:"active",deliveries24h:142,failures24h:0,avgResponseMs:42,retryCount:0,lastDelivery:new Date(Date.now()-900000).toISOString()},
  {id:"w3",name:"KYC Verification",url:"https://api.freelancer.in/webhooks/kyc",event:"kyc.verified",status:"failed",deliveries24h:28,failures24h:14,avgResponseMs:0,retryCount:8,lastDelivery:new Date(Date.now()-7200000).toISOString(),backupUrl:"https://api.freelancer.in/webhooks/kyc-fallback"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminWebhookMonitor(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[hooks,setHooks]=useState(()=>load("admin_webhooks_v1",seed));
  const[testing,setTesting]=useState<string|null>(null);
  const[retrying,setRetrying]=useState<string|null>(null);

  const testHook=async(w:Webhook)=>{
    setTesting(w.id);await new Promise(r=>setTimeout(r,1200));
    const ok=Math.random()>.2;
    const upd=hooks.map(x=>x.id===w.id?{...x,status:ok?"active" as const:x.status,avgResponseMs:ok?Math.round(40+Math.random()*200):0}:x);
    localStorage.setItem("admin_webhooks_v1",JSON.stringify(upd));setHooks(upd);setTesting(null);
    toast({title:`${w.name} test — ${ok?"200 OK":"Failed"}`});
  };
  const retry=async(w:Webhook)=>{
    setRetrying(w.id);await new Promise(r=>setTimeout(r,1000));
    const upd=hooks.map(x=>x.id===w.id?{...x,retryCount:0,failures24h:0,status:"active" as const,lastDelivery:new Date().toISOString()}:x);
    localStorage.setItem("admin_webhooks_v1",JSON.stringify(upd));setHooks(upd);setRetrying(null);
    toast({title:`${w.name} retried — failures cleared`});
  };

  const failed=hooks.filter(h=>h.status==="failed").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Zap size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Webhook Monitoring System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Delivery status · Retry mechanism · Failure alerts · Test tool · Queue · Timeout control · Response validation</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Webhooks",v:hooks.length,c:T.badgeFg},{l:"Failed",v:failed,c:failed>0?"#f87171":"#4ade80"},{l:"Deliveries (24h)",v:hooks.reduce((s,h)=>s+h.deliveries24h,0),c:"#4ade80"},{l:"Failures (24h)",v:hooks.reduce((s,h)=>s+h.failures24h,0),c:"#f87171"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {hooks.map(w=>(
          <div key={w.id} style={{background:T.card,border:`1px solid ${w.status==="failed"?"rgba(248,113,113,.25)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:w.status==="active"?"#4ade80":"#f87171",flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{w.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{w.event}</span>
                <span style={{fontSize:10,fontWeight:700,color:w.status==="active"?"#4ade80":"#f87171",textTransform:"capitalize"}}>{w.status}</span>
                {w.retryCount>0&&<span style={{fontSize:10,color:"#f87171"}}>{w.retryCount} retries</span>}
                {w.backupUrl&&<span style={{fontSize:10,color:"#4ade80"}}>✓ backup</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Sent: {w.deliveries24h}</span>
                <span style={{fontSize:12,color:T.sub}}>Failed: <strong style={{color:w.failures24h>0?"#f87171":"#4ade80"}}>{w.failures24h}</strong></span>
                {w.avgResponseMs>0&&<span style={{fontSize:12,color:T.sub}}>Avg: {w.avgResponseMs}ms</span>}
                <span style={{fontSize:12,color:T.sub}}>Last: {formatDistanceToNow(new Date(w.lastDelivery))} ago</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>testHook(w)} disabled={testing===w.id} style={{padding:"6px 11px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>{testing===w.id?"Testing…":"Test"}</button>
              {w.status==="failed"&&<button onClick={()=>retry(w)} disabled={retrying===w.id} style={{padding:"6px 11px",borderRadius:8,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>{retrying===w.id?"…":"Retry"}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
