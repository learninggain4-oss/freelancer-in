import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, LogOut, Monitor, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Session{id:string;user:string;ip:string;device:string;location:string;startedAt:string;lastActivity:string;suspicious:boolean;expiryMins:number;}
const seed=():Session[]=>[
  {id:"s1",user:"admin@freelancer.in",ip:"122.161.45.12",device:"Chrome/Windows",location:"Mumbai, IN",startedAt:new Date(Date.now()-7200000).toISOString(),lastActivity:new Date(Date.now()-300000).toISOString(),suspicious:false,expiryMins:60},
  {id:"s2",user:"rahul@example.com",ip:"45.79.12.200",device:"Safari/Mac",location:"New York, US",startedAt:new Date(Date.now()-3600000).toISOString(),lastActivity:new Date(Date.now()-60000).toISOString(),suspicious:true,expiryMins:30},
  {id:"s3",user:"priya@example.com",ip:"103.21.58.9",device:"Chrome/Android",location:"Delhi, IN",startedAt:new Date(Date.now()-1800000).toISOString(),lastActivity:new Date(Date.now()-120000).toISOString(),suspicious:false,expiryMins:60},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminSecureSessionMgr(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];const{toast}=useToast();
  const[sessions,setSessions]=useState(()=>load("admin_secure_sess_v1",seed));
  const[revoking,setRevoking]=useState<string|null>(null);
  const[expiryMins,setExpiryMins]=useState(60);

  const revoke=async(s:Session)=>{
    setRevoking(s.id);await new Promise(r=>setTimeout(r,800));
    const upd=sessions.filter(x=>x.id!==s.id);
    localStorage.setItem("admin_secure_sess_v1",JSON.stringify(upd));setSessions(upd);setRevoking(null);
    toast({title:`Session for ${s.user} revoked`});
  };
  const revokeAll=async()=>{
    await new Promise(r=>setTimeout(r,1200));
    localStorage.setItem("admin_secure_sess_v1",JSON.stringify([]));setSessions([]);
    toast({title:"All sessions revoked"});
  };

  const suspicious=sessions.filter(s=>s.suspicious).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Shield size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Secure Session Management (CRITICAL)</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Token generation · Expiry control · IP validation · Device validation · Suspicious login · Forced logout</p>
          </div>
          <button onClick={revokeAll} style={{padding:"9px 14px",borderRadius:10,background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:12,fontWeight:700,cursor:"pointer"}}>Revoke All</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Active Sessions",v:sessions.length,c:T.badgeFg},{l:"Suspicious",v:suspicious,c:suspicious>0?"#f87171":"#4ade80"},{l:"Expiry (mins)",v:expiryMins,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:14}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Session Expiry Configuration</p>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input type="range" min={15} max={480} step={15} value={expiryMins} onChange={e=>setExpiryMins(+e.target.value)} style={{width:200,accentColor:A1}}/>
          <span style={{fontWeight:700,color:T.badgeFg,fontSize:14}}>{expiryMins} min</span>
          <button onClick={()=>toast({title:`Session expiry set to ${expiryMins} mins`})} style={{padding:"6px 14px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer"}}>Save</button>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sessions.map(s=>(
          <div key={s.id} style={{background:T.card,border:`1px solid ${s.suspicious?"rgba(248,113,113,.25)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <Monitor size={16} color={s.suspicious?"#f87171":T.sub} style={{flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{s.user}</span>
                {s.suspicious&&<span style={{fontSize:10,color:"#f87171",fontWeight:700}}>⚠ SUSPICIOUS</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>IP: {s.ip}</span>
                <span style={{fontSize:12,color:T.sub}}>{s.device}</span>
                <span style={{fontSize:12,color:T.sub}}>{s.location}</span>
                <span style={{fontSize:12,color:T.sub}}>Active: {safeDist(s.lastActivity)} ago</span>
              </div>
            </div>
            <button onClick={()=>revoke(s)} disabled={revoking===s.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              <LogOut size={10}/>{revoking===s.id?"…":"Revoke"}
            </button>
          </div>
        ))}
        {sessions.length===0&&<div style={{textAlign:"center",padding:32,color:T.sub,fontSize:13}}>No active sessions</div>}
      </div>
    </div>
  );
}
