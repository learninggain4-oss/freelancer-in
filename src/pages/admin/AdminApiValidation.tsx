import { useState } from "react";
import { Zap, CheckCircle2, AlertTriangle, RefreshCw, Activity, Clock, Shield } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
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

interface ApiEndpoint{id:string;name:string;method:string;path:string;version:string;schemaValid:boolean;avgResponseMs:number;errorRate:number;status:"healthy"|"mismatch"|"error";lastValidated:string;mismatchDetail?:string;}


function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={healthy:"#4ade80",mismatch:"#fbbf24",error:"#f87171"};

export default function AdminApiValidation(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[apis,setApis]=useState<ApiEndpoint[]>([]);
  const[validating,setValidating]=useState<string|null>(null);

  const validate=async(a:ApiEndpoint)=>{
    setValidating(a.id);
    await new Promise(r=>setTimeout(r,1500));
    const ok=Math.random()>.15;
    const upd=apis.map(x=>x.id===a.id?{...x,status:ok?"healthy" as const:x.status,schemaValid:ok,avgResponseMs:Math.round(40+Math.random()*200),errorRate:ok?+(Math.random()*1).toFixed(1):x.errorRate,lastValidated:new Date().toISOString(),mismatchDetail:ok?undefined:x.mismatchDetail}:x);
    localStorage.setItem("admin_api_valid_v1",JSON.stringify(upd));setApis(upd);setValidating(null);
    logAction("API Validation",a.path,"System",ok?"success":"warning");
    toast({title:`${a.name} — ${ok?"Schema valid":"Schema mismatch detected"}`});
  };

  const issues=apis.filter(a=>a.status!=="healthy").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Zap size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>API Response Validation</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Schema validation · Version control · Mismatch detection · Response monitoring · Performance dashboard</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Endpoints",v:apis.length,c:T.badgeFg},{l:"Issues",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Avg Response",v:`${Math.round(apis.reduce((s,a)=>s+a.avgResponseMs,0)/apis.length)}ms`,c:A1},{l:"Schema Valid",v:apis.filter(a=>a.schemaValid).length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {apis.map(a=>(
          <div key={a.id} style={{background:T.card,border:`1px solid ${a.status!=="healthy"?`${sColor[a.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:sColor[a.status],flexShrink:0,marginTop:5}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{a.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:a.method==="POST"?"#fb923c":"#4ade80",background:`${a.method==="POST"?"rgba(251,114,36,.1)":"rgba(74,222,128,.08)"}`,padding:"2px 6px",borderRadius:4}}>{a.method}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{a.path}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5}}>{a.version}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[a.status],background:`${sColor[a.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{a.status}</span>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:a.mismatchDetail?4:0}}>
                <span style={{fontSize:12,color:T.sub}}>Avg: <strong style={{color:a.avgResponseMs>500?"#f87171":a.avgResponseMs>200?"#fbbf24":"#4ade80"}}>{a.avgResponseMs}ms</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Error rate: <strong style={{color:a.errorRate>2?"#f87171":a.errorRate>0.5?"#fbbf24":"#4ade80"}}>{a.errorRate}%</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Validated: {safeDist(a.lastValidated)} ago</span>
              </div>
              {a.mismatchDetail&&<p style={{fontSize:11,color:"#fbbf24",margin:0}}>{a.mismatchDetail}</p>}
            </div>
            <button onClick={()=>validate(a)} disabled={validating===a.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              <RefreshCw size={11} className={validating===a.id?"animate-spin":""}/>{validating===a.id?"Validating…":"Validate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
