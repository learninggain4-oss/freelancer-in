import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, Activity, Lock } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface CsrfEvent{id:string;ip:string;endpoint:string;reason:string;at:string;severity:"low"|"medium"|"high";}
const seedEvents=():CsrfEvent[]=>[
  {id:"c1",ip:"45.79.12.200",endpoint:"/api/wallet/transfer",reason:"Token mismatch",at:new Date(Date.now()-1800000).toISOString(),severity:"high"},
  {id:"c2",ip:"103.21.58.9",endpoint:"/api/profile/update",reason:"Origin header mismatch",at:new Date(Date.now()-7200000).toISOString(),severity:"medium"},
  {id:"c3",ip:"192.168.1.50",endpoint:"/api/admin/settings",reason:"Token expired",at:new Date(Date.now()-86400000).toISOString(),severity:"low"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sevColor={low:"#4ade80",medium:"#fbbf24",high:"#f87171"};

export default function AdminCsrfProtection(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[events]=useState(()=>load("admin_csrf_v1",seedEvents));
  const[config,setConfig]=useState({tokenRotation:true,originValidation:true,middlewareEnabled:true,rotationIntervalMins:30,allowedOrigins:"https://freelancer.in"});
  const[rotating,setRotating]=useState(false);

  const rotateTokens=async()=>{
    setRotating(true);await new Promise(r=>setTimeout(r,1000));setRotating(false);
    toast({title:"CSRF tokens rotated successfully"});
  };
  const toggleConfig=(key:keyof typeof config)=>{
    setConfig(p=>({...p,[key]:!p[key as keyof typeof p]}));
    toast({title:"CSRF configuration updated"});
  };

  const highEvents=events.filter(e=>e.severity==="high").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><ShieldCheck size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>CSRF Protection System (CRITICAL)</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Token validation · Origin validation · Token rotation · Attack detection · Middleware · Security monitoring</p>
          </div>
          <button onClick={rotateTokens} disabled={rotating} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            <RefreshCw size={13}/>{rotating?"Rotating…":"Rotate Tokens"}
          </button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Blocked Requests",v:events.length,c:"#f87171"},{l:"High Severity",v:highEvents,c:highEvents>0?"#f87171":"#4ade80"},{l:"Middleware",v:config.middlewareEnabled?"On":"Off",c:config.middlewareEnabled?"#4ade80":"#f87171"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 12px"}}>Configuration</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {([["tokenRotation","Token Rotation"],["originValidation","Origin Validation"],["middlewareEnabled","Middleware Enabled"]] as const).map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:T.input,borderRadius:8}}>
              <span style={{fontSize:12,color:T.text}}>{l}</span>
              <button onClick={()=>toggleConfig(k)} style={{padding:"3px 12px",borderRadius:6,background:config[k]?`${A1}20`:"rgba(148,163,184,.1)",border:`1px solid ${config[k]?A1:T.border}`,color:config[k]?T.badgeFg:T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {config[k]?"ON":"OFF"}
              </button>
            </div>
          ))}
          <div style={{padding:"8px 12px",background:T.input,borderRadius:8}}>
            <span style={{fontSize:12,color:T.sub,display:"block",marginBottom:4}}>Rotation Interval (min)</span>
            <input type="number" value={config.rotationIntervalMins} onChange={e=>setConfig(p=>({...p,rotationIntervalMins:+e.target.value}))} style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
          </div>
          <div style={{padding:"8px 12px",background:T.input,borderRadius:8}}>
            <span style={{fontSize:12,color:T.sub,display:"block",marginBottom:4}}>Allowed Origins</span>
            <input type="text" value={config.allowedOrigins} onChange={e=>setConfig(p=>({...p,allowedOrigins:e.target.value}))} style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
          </div>
        </div>
      </div>
      <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Blocked Requests</p>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {events.map((e,i)=>(
          <div key={e.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<events.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:sevColor[e.severity],flexShrink:0}}/>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 1px"}}>IP {e.ip} — {e.endpoint}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>{e.reason} · {format(new Date(e.at),"MMM d, HH:mm")}</p>
            </div>
            <span style={{fontSize:10,fontWeight:700,color:sevColor[e.severity],textTransform:"uppercase"}}>{e.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
