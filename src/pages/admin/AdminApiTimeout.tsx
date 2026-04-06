import { useState } from "react";
import { Wifi, AlertTriangle, CheckCircle2, RefreshCw, Activity, Clock } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ApiConfig{id:string;name:string;endpoint:string;timeoutMs:number;retries:number;avgLatencyMs:number;timeouts24h:number;status:"healthy"|"slow"|"timing-out";}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const API_TIMEOUT_KEY="admin_api_timeout_v1";
function seedApiConfigs():ApiConfig[]{return[
  {id:"ac1",name:"Supabase REST",endpoint:"https://maysttckdfnnzvfeujaj.supabase.co/rest/v1/",timeoutMs:5000,retries:2,avgLatencyMs:45,timeouts24h:0,status:"healthy"},
  {id:"ac2",name:"OneSignal Push API",endpoint:"https://onesignal.com/api/v1/notifications",timeoutMs:8000,retries:3,avgLatencyMs:220,timeouts24h:1,status:"healthy"},
  {id:"ac3",name:"Email SMTP",endpoint:"smtp.gmail.com:587",timeoutMs:10000,retries:2,avgLatencyMs:850,timeouts24h:3,status:"slow"},
];}
const sColor={healthy:"#4ade80",slow:"#fbbf24","timing-out":"#f87171"};

export default function AdminApiTimeout(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[configs,setConfigs]=useState<ApiConfig[]>(()=>load(API_TIMEOUT_KEY,seedApiConfigs));
  const[testing,setTesting]=useState<string|null>(null);

  const test=async(c:ApiConfig)=>{
    setTesting(c.id);await new Promise(r=>setTimeout(r,1500));
    const withinLimit=c.avgLatencyMs<c.timeoutMs;
    const upd=configs.map(x=>x.id===c.id?{...x,status:withinLimit?(c.avgLatencyMs>c.timeoutMs*0.7?"slow" as const:"healthy" as const):"timing-out" as const}:x);
    localStorage.setItem("admin_api_timeout_v1",JSON.stringify(upd));setConfigs(upd);setTesting(null);
    toast({title:`${c.name}: avg ${c.avgLatencyMs}ms / limit ${c.timeoutMs}ms`});
  };
  const saveConfig=(id:string,field:string,val:number)=>{
    const upd=configs.map(c=>c.id===id?{...c,[field]:val}:c);
    localStorage.setItem("admin_api_timeout_v1",JSON.stringify(upd));setConfigs(upd);
    toast({title:"Timeout config updated"});
  };

  const issues=configs.filter(c=>c.status!=="healthy").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Clock size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>API Timeout Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Configurable timeouts · Monitoring · Failure alerts · Retry mechanism · Latency tracking · Dashboard · Testing tool</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"APIs",v:configs.length,c:T.badgeFg},{l:"Issues",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Timeouts (24h)",v:configs.reduce((s,c)=>s+c.timeouts24h,0),c:"#f87171"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {configs.map(c=>(
          <div key={c.id} style={{background:T.card,border:`1px solid ${c.status!=="healthy"?`${sColor[c.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{c.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{c.endpoint}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[c.status],textTransform:"capitalize"}}>{c.status}</span>
                {c.timeouts24h>0&&<span style={{fontSize:10,color:"#f87171"}}>{c.timeouts24h} timeouts today</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <div>
                  <p style={{fontSize:11,color:T.sub,margin:"0 0 2px"}}>Timeout (ms)</p>
                  <input type="number" defaultValue={c.timeoutMs} onBlur={e=>saveConfig(c.id,"timeoutMs",+e.target.value)} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
                </div>
                <div>
                  <p style={{fontSize:11,color:T.sub,margin:"0 0 2px"}}>Retries</p>
                  <input type="number" defaultValue={c.retries} onBlur={e=>saveConfig(c.id,"retries",+e.target.value)} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                  <p style={{fontSize:11,color:T.sub,margin:"0 0 2px"}}>Avg Latency</p>
                  <span style={{fontSize:13,fontWeight:700,color:c.avgLatencyMs>c.timeoutMs*0.7?"#fbbf24":"#4ade80"}}>{c.avgLatencyMs}ms</span>
                </div>
              </div>
            </div>
            <button onClick={()=>test(c)} disabled={testing===c.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {testing===c.id?"Testing…":"Test"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
