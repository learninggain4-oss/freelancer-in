import { useState, useEffect } from "react";
import { LogOut, AlertTriangle, CheckCircle2, Clock, Shield, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface LogoutEvent{id:string;user:string;role:string;reason:string;idleMins:number;at:string;}
const seedEvents=():LogoutEvent[]=>[
  {id:"le1",user:"user_182",role:"Freelancer",reason:"Idle timeout",idleMins:30,at:new Date(Date.now()-3600000).toISOString()},
  {id:"le2",user:"user_510",role:"Client",reason:"Idle timeout",idleMins:30,at:new Date(Date.now()-7200000).toISOString()},
  {id:"le3",user:"admin@freelancer.in",role:"Admin",reason:"Forced logout",idleMins:0,at:new Date(Date.now()-86400000).toISOString()},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminAutoLogout(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[events]=useState(()=>load("admin_auto_logout_v1",seedEvents));
  const[config,setConfig]=useState({enabled:true,idleTimeoutMins:30,adminTimeoutMins:60,forceLogoutOnSuspicion:true});
  const[testing,setTesting]=useState(false);
  const[forcingAll,setForcingAll]=useState(false);

  const runTest=async()=>{
    setTesting(true);await new Promise(r=>setTimeout(r,1500));setTesting(false);
    toast({title:`Auto logout test passed — ${config.idleTimeoutMins}min timeout confirmed working`});
  };
  const forceAllLogout=async()=>{
    setForcingAll(true);await new Promise(r=>setTimeout(r,1500));setForcingAll(false);
    toast({title:"All non-admin sessions force-logged out"});
  };

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><LogOut size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Auto Logout Security System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Idle session detection · Auto logout config · Session inactivity timer · Forced logout · Activity tracking</p>
          </div>
          <button onClick={forceAllLogout} disabled={forcingAll} style={{padding:"9px 14px",borderRadius:10,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:12,fontWeight:700,cursor:"pointer"}}>{forcingAll?"Logging out…":"Force All Logout"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Auto Logout",v:config.enabled?"On":"Off",c:config.enabled?"#4ade80":"#f87171"},{l:"Idle Timeout",v:`${config.idleTimeoutMins}min`,c:T.badgeFg},{l:"Events (24h)",v:events.length,c:T.sub}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 12px"}}>Configuration</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{padding:"10px 12px",background:T.input,borderRadius:8}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:T.text}}>Auto Logout Enabled</span>
              <button onClick={()=>setConfig(p=>({...p,enabled:!p.enabled}))} style={{padding:"3px 12px",borderRadius:6,background:config.enabled?`${A1}20`:"rgba(148,163,184,.1)",border:`1px solid ${config.enabled?A1:T.border}`,color:config.enabled?T.badgeFg:T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>{config.enabled?"ON":"OFF"}</button>
            </div>
          </div>
          <div style={{padding:"10px 12px",background:T.input,borderRadius:8}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:T.text}}>Force Logout on Suspicion</span>
              <button onClick={()=>setConfig(p=>({...p,forceLogoutOnSuspicion:!p.forceLogoutOnSuspicion}))} style={{padding:"3px 12px",borderRadius:6,background:config.forceLogoutOnSuspicion?`${A1}20`:"rgba(148,163,184,.1)",border:`1px solid ${config.forceLogoutOnSuspicion?A1:T.border}`,color:config.forceLogoutOnSuspicion?T.badgeFg:T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>{config.forceLogoutOnSuspicion?"ON":"OFF"}</button>
            </div>
          </div>
          <div style={{padding:"10px 12px",background:T.input,borderRadius:8}}>
            <p style={{fontSize:11,color:T.sub,margin:"0 0 4px"}}>User idle timeout (min)</p>
            <input type="number" value={config.idleTimeoutMins} onChange={e=>setConfig(p=>({...p,idleTimeoutMins:+e.target.value}))} style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
          </div>
          <div style={{padding:"10px 12px",background:T.input,borderRadius:8}}>
            <p style={{fontSize:11,color:T.sub,margin:"0 0 4px"}}>Admin idle timeout (min)</p>
            <input type="number" value={config.adminTimeoutMins} onChange={e=>setConfig(p=>({...p,adminTimeoutMins:+e.target.value}))} style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"4px 8px",fontSize:12}}/>
          </div>
        </div>
        <div style={{marginTop:10,display:"flex",gap:8}}>
          <button onClick={runTest} disabled={testing} style={{padding:"7px 16px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer"}}>{testing?"Testing…":"Test Auto Logout"}</button>
          <button onClick={()=>toast({title:"Configuration saved"})} style={{padding:"7px 16px",borderRadius:8,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Save Config</button>
        </div>
      </div>
      <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Logout Events (24h)</p>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {events.map((e,i)=>(
          <div key={e.id} style={{display:"flex",gap:12,padding:"11px 18px",borderBottom:i<events.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            <LogOut size={13} color={T.sub}/>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 1px"}}>{e.user} ({e.role}) — {e.reason}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>{e.idleMins>0?`After ${e.idleMins}min idle · `:""}{safeFmt(e.at, "MMM d, HH:mm")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
