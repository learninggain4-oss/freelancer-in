import { useState, useEffect } from "react";
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, Activity } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface NTPServer{id:string;host:string;region:string;offsetMs:number;latencyMs:number;status:"synced"|"drifted"|"unreachable";lastSync:string;}


function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
function safeFmt(raw:string|undefined,fmt:string,fallback="—"):string{try{if(!raw)return fallback;const d=new Date(raw);if(isNaN(d.getTime()))return fallback;return format(d,fmt);}catch{return fallback;}}

export default function AdminTimeSyncSystem(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[servers,setServers]=useState<NTPServer[]>([]);
  const[now,setNow]=useState(new Date());
  const[syncing,setSyncing]=useState<string|null>(null);
  const[tz,setTz]=useState("Asia/Kolkata");

  useEffect(()=>{const iv=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(iv);},[]);

  const syncServer=async(s:NTPServer)=>{
    setSyncing(s.id);
    await new Promise(r=>setTimeout(r,1500));
    const newOffset=Math.floor(Math.random()*20)-5;
    const upd=servers.map(x=>x.id===s.id?{...x,offsetMs:newOffset,status:Math.abs(newOffset)<50?"synced" as const:"drifted" as const,lastSync:new Date().toISOString()}:x);
    localStorage.setItem("admin_ntp_v1",JSON.stringify(upd));setServers(upd);setSyncing(null);
    logAction("NTP Sync",s.host,"System","success");
    toast({title:`${s.host} synced — offset: ${newOffset}ms`});
  };

  const drifted=servers.filter(s=>s.status==="drifted").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Clock size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Server Time Synchronization</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>NTP sync · Clock drift detection · Time validation · Timezone management · Accuracy alerts</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"NTP Servers",v:servers.length,c:T.badgeFg},{l:"Synced",v:servers.filter(s=>s.status==="synced").length,c:"#4ade80"},{l:"Drifted",v:drifted,c:drifted>0?"#fbbf24":"#4ade80"},{l:"System Timezone",v:tz,c:A1}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",textAlign:"center" as const}}>
          <p style={{fontSize:12,color:T.sub,margin:"0 0 6px"}}>System Clock</p>
          <p style={{fontFamily:"monospace",fontWeight:800,fontSize:24,color:T.badgeFg,margin:0}}>{format(now,"HH:mm:ss")}</p>
          <p style={{fontSize:11,color:T.sub,margin:"4px 0 0"}}>{format(now,"EEEE, MMM d yyyy")}</p>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",textAlign:"center" as const}}>
          <p style={{fontSize:12,color:T.sub,margin:"0 0 6px"}}>Timezone</p>
          <p style={{fontFamily:"monospace",fontWeight:800,fontSize:20,color:T.text,margin:0}}>{tz}</p>
          <p style={{fontSize:11,color:T.sub,margin:"4px 0 0"}}>UTC+5:30 · IST</p>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {servers.map(s=>(
          <div key={s.id} style={{background:T.card,border:`1px solid ${s.status==="drifted"?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:s.status==="synced"?"#4ade80":s.status==="drifted"?"#fbbf24":"#f87171",flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{s.host}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5}}>{s.region}</span>
                <span style={{fontSize:10,fontWeight:700,color:s.status==="synced"?"#4ade80":"#fbbf24",textTransform:"capitalize"}}>{s.status}</span>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Offset: <strong style={{color:Math.abs(s.offsetMs)>100?"#fbbf24":"#4ade80"}}>{s.offsetMs}ms</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Latency: {s.latencyMs}ms</span>
                <span style={{fontSize:12,color:T.sub}}>Synced: {safeFmt(s.lastSync,"HH:mm:ss")}</span>
              </div>
            </div>
            <button onClick={()=>syncServer(s)} disabled={syncing===s.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              <RefreshCw size={11} className={syncing===s.id?"animate-spin":""}/>{syncing===s.id?"Syncing…":"Force Sync"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
