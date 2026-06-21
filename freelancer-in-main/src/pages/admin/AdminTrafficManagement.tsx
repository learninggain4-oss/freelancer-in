import { useState, useEffect } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Zap, Shield } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

const BARS=20;
function genBar(rps:number){return Math.max(5,Math.min(100,Math.round(rps/20+Math.random()*15)));}

export default function AdminTrafficManagement(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[rps,setRps]=useState(820);
  const[bars,setBars]=useState<number[]>(Array(BARS).fill(0).map(()=>genBar(820)));
  const[config,setConfig]=useState({rateLimit:1000,autoScaling:true,loadBalancing:true,ddosProtection:true,maxConcurrent:5000});
  const[alertActive,setAlertActive]=useState(false);

  useEffect(()=>{
    const iv=setInterval(()=>{
      const newRps=Math.max(200,Math.min(1500,rps+(Math.random()-.48)*100));
      setRps(Math.round(newRps));
      setBars(p=>[...p.slice(1),genBar(newRps)]);
      if(newRps>config.rateLimit*0.9){setAlertActive(true);setTimeout(()=>setAlertActive(false),5000);}
    },1500);
    return()=>clearInterval(iv);
  },[rps,config.rateLimit]);

  const toggle=(k:keyof typeof config)=>{
    if(typeof config[k]==="boolean")setConfig(p=>({...p,[k]:!p[k as keyof typeof p]}));
  };
  const spikePct=Math.round((rps/config.rateLimit)*100);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Activity size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Traffic Load Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Real-time monitoring · Spike detection · Auto-scaling · Load balancing · Traffic alerts · Rate limit control</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Current RPS",v:rps.toLocaleString(),c:rps>config.rateLimit*0.8?"#f87171":T.badgeFg},{l:"Limit",v:config.rateLimit.toLocaleString(),c:T.badgeFg},{l:"Load",v:`${spikePct}%`,c:spikePct>80?"#f87171":spikePct>60?"#fbbf24":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      {alertActive&&<div style={{background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.2)",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
        <AlertTriangle size={13} color="#f87171"/><span style={{fontSize:12,color:"#f87171"}}>Traffic spike detected — {spikePct}% of limit</span>
      </div>}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:12,color:T.sub,margin:"0 0 10px"}}>REAL-TIME TRAFFIC (RPS)</p>
        <div style={{display:"flex",gap:2,alignItems:"flex-end",height:60}}>
          {bars.map((h,i)=>(
            <div key={i} style={{flex:1,borderRadius:"2px 2px 0 0",background:h>80?"#f87171":h>60?"#fbbf24":`${A1}`,opacity:0.4+(i/BARS)*0.6,height:`${h}%`,transition:"height .3s"}}/>
          ))}
        </div>
        <p style={{fontSize:11,color:T.sub,margin:"4px 0 0",textAlign:"right"}}>{rps} req/s live</p>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 10px"}}>Protection Settings</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {([["autoScaling","Auto Scaling"],["loadBalancing","Load Balancing"],["ddosProtection","DDoS Protection"]] as const).map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:T.input,borderRadius:8}}>
              <span style={{fontSize:12,color:T.text}}>{l}</span>
              <button onClick={()=>toggle(k)} style={{padding:"3px 12px",borderRadius:6,background:(config[k] as boolean)?`${A1}20`:"rgba(148,163,184,.1)",border:`1px solid ${(config[k] as boolean)?A1:T.border}`,color:(config[k] as boolean)?T.badgeFg:T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>{config[k]?"ON":"OFF"}</button>
            </div>
          ))}
          <div style={{padding:"8px 12px",background:T.input,borderRadius:8}}>
            <p style={{fontSize:11,color:T.sub,margin:"0 0 4px"}}>Rate Limit (RPS)</p>
            <input type="number" value={config.rateLimit} onChange={e=>setConfig(p=>({...p,rateLimit:+e.target.value}))} style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
          </div>
        </div>
      </div>
    </div>
  );
}
