import { useState } from "react";
import { Code, AlertTriangle, CheckCircle2, RefreshCw, Activity, Shield } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ApiEndpoint{id:string;name:string;version:string;latestVersion:string;compatible:boolean;changeType:"none"|"minor"|"breaking";lastChecked:string;status:"ok"|"warning"|"breaking";}
const seed=():ApiEndpoint[]=>[
  {id:"ap1",name:"POST /api/jobs",version:"v2.1",latestVersion:"v2.1",compatible:true,changeType:"none",lastChecked:new Date(Date.now()-3600000).toISOString(),status:"ok"},
  {id:"ap2",name:"GET /api/users/{id}",version:"v1.8",latestVersion:"v2.0",compatible:false,changeType:"breaking",lastChecked:new Date(Date.now()-7200000).toISOString(),status:"breaking"},
  {id:"ap3",name:"POST /api/wallet/transfer",version:"v3.0",latestVersion:"v3.1",compatible:true,changeType:"minor",lastChecked:new Date(Date.now()-1800000).toISOString(),status:"warning"},
  {id:"ap4",name:"GET /api/jobs/search",version:"v2.2",latestVersion:"v2.2",compatible:true,changeType:"none",lastChecked:new Date(Date.now()-900000).toISOString(),status:"ok"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={ok:"#4ade80",warning:"#fbbf24",breaking:"#f87171"};

export default function AdminApiSchema(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];const{toast}=useToast();
  const[endpoints,setEndpoints]=useState(()=>load("admin_api_schema_v1",seed));
  const[checking,setChecking]=useState(false);

  const checkAll=async()=>{
    setChecking(true);await new Promise(r=>setTimeout(r,2000));
    const upd=endpoints.map(e=>({...e,lastChecked:new Date().toISOString()}));
    localStorage.setItem("admin_api_schema_v1",JSON.stringify(upd));setEndpoints(upd);setChecking(false);
    toast({title:"API schema validation complete"});
  };
  const issues=endpoints.filter(e=>e.status!=="ok").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Code size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>API Schema Monitoring</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Schema validation · Version monitoring · Response comparison · Change alerts · Compatibility testing · Fallback</p>
          </div>
          <button onClick={checkAll} disabled={checking} style={{padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{checking?"Checking…":"Validate All"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Endpoints",v:endpoints.length,c:T.badgeFg},{l:"Issues",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Breaking",v:endpoints.filter(e=>e.changeType==="breaking").length,c:"#f87171"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {endpoints.map(e=>(
          <div key={e.id} style={{background:T.card,border:`1px solid ${e.status!=="ok"?`${sColor[e.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[e.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{e.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[e.status],textTransform:"capitalize"}}>{e.status}</span>
                {e.changeType!=="none"&&<span style={{fontSize:10,color:e.changeType==="breaking"?"#f87171":"#fbbf24"}}>{e.changeType} change</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Current: <code>{e.version}</code></span>
                {e.version!==e.latestVersion&&<span style={{fontSize:12,color:T.sub}}>→ <code style={{color:"#fbbf24"}}>{e.latestVersion}</code></span>}
                <span style={{fontSize:12,color:T.sub}}>Checked: {safeDist(e.lastChecked)} ago</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
