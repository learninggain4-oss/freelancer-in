import { useState } from "react";
import { Users, Clock, AlertTriangle, CheckCircle2, RefreshCw, Activity, FileText } from "lucide-react";
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

interface Session{id:string;userId:string;userName:string;role:string;ip:string;device:string;startedAt:string;lastActiveAt:string;idle:boolean;expiresAt:string;}
interface SessionConfig{timeoutMins:number;idleTimeoutMins:number;maxSessions:number;}

const seedSessions=():Session[]=>[
  {id:"s1",userId:"u001",userName:"Rahul Sharma",role:"freelancer",ip:"49.36.12.4",device:"Chrome / Android",startedAt:new Date(Date.now()-3600000).toISOString(),lastActiveAt:new Date(Date.now()-120000).toISOString(),idle:false,expiresAt:new Date(Date.now()+3600000).toISOString()},
  {id:"s2",userId:"u002",userName:"Priya Nair",role:"client",ip:"103.21.58.9",device:"Safari / iPhone",startedAt:new Date(Date.now()-7200000).toISOString(),lastActiveAt:new Date(Date.now()-3900000).toISOString(),idle:true,expiresAt:new Date(Date.now()+600000).toISOString()},
  {id:"s3",userId:"u003",userName:"Admin A",role:"admin",ip:"192.168.1.5",device:"Chrome / macOS",startedAt:new Date(Date.now()-1800000).toISOString(),lastActiveAt:new Date(Date.now()-60000).toISOString(),idle:false,expiresAt:new Date(Date.now()+7200000).toISOString()},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminSessionManagement(){
  const{theme}=useDashboardTheme();const T=TH[theme];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[tab,setTab]=useState<"active"|"config">("active");
  const[sessions,setSessions]=useState<Session[]>(()=>load("admin_sessions_v1",seedSessions));
  const[config,setConfig]=useState<SessionConfig>({timeoutMins:120,idleTimeoutMins:30,maxSessions:3});
  const[terminating,setTerminating]=useState<string|null>(null);

  const terminate=async(s:Session)=>{
    setTerminating(s.id);
    await new Promise(r=>setTimeout(r,600));
    const upd=sessions.filter(x=>x.id!==s.id);
    localStorage.setItem("admin_sessions_v1",JSON.stringify(upd));setSessions(upd);setTerminating(null);
    logAction("Session Terminated",`${s.userName} (${s.ip})`,"Security","warning");
    toast({title:`Session terminated for ${s.userName}`});
  };

  const terminateAll=async()=>{
    await new Promise(r=>setTimeout(r,500));
    const nonAdmin=sessions.filter(s=>s.role!=="admin");
    const upd=sessions.filter(s=>s.role==="admin");
    localStorage.setItem("admin_sessions_v1",JSON.stringify(upd));setSessions(upd);
    logAction("All Sessions Terminated",`${nonAdmin.length} sessions cleared`,"Security","warning");
    toast({title:`${nonAdmin.length} non-admin sessions terminated`});
  };

  const saveConfig=(f:Partial<SessionConfig>)=>{
    const upd={...config,...f};setConfig(upd);
    toast({title:"Session configuration saved"});
  };

  const idle=sessions.filter(s=>s.idle).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Users size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Session Management System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Session timeout · Idle detection · Activity tracking · Auto logout · Security logs</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Active Sessions",v:sessions.length,c:T.badgeFg},{l:"Idle",v:idle,c:idle>0?"#fbbf24":"#4ade80"},{l:"Timeout",v:`${config.timeoutMins}m`,c:A1},{l:"Max/User",v:config.maxSessions,c:A1}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["active","Active Sessions",Users],["config","Configuration",Activity]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}
          </button>
        ))}
        {tab==="active"&&sessions.length>1&&<button onClick={terminateAll} style={{marginLeft:"auto",padding:"9px 14px",borderRadius:10,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer"}}>Terminate All Non-Admin</button>}
      </div>

      {tab==="active"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sessions.map(s=>(
            <div key={s.id} style={{background:T.card,border:`1px solid ${s.idle?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:s.idle?"#fbbf24":"#4ade80",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{s.userName}</span>
                  <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5}}>{s.role}</span>
                  {s.idle&&<span style={{fontSize:10,fontWeight:700,color:"#fbbf24",background:"rgba(251,191,36,.1)",padding:"2px 7px",borderRadius:5}}>IDLE</span>}
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:T.sub}}>IP: {s.ip}</span>
                  <span style={{fontSize:12,color:T.sub}}>{s.device}</span>
                  <span style={{fontSize:12,color:T.sub}}>Active: {formatDistanceToNow(new Date(s.lastActiveAt))} ago</span>
                  <span style={{fontSize:12,color:T.sub}}>Expires: {formatDistanceToNow(new Date(s.expiresAt))}</span>
                </div>
              </div>
              <button onClick={()=>terminate(s)} disabled={terminating===s.id} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                {terminating===s.id?"…":"Terminate"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab==="config"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[{k:"timeoutMins" as const,l:"Session Timeout (minutes)",min:30,max:480,step:15},{k:"idleTimeoutMins" as const,l:"Idle Timeout (minutes)",min:5,max:120,step:5},{k:"maxSessions" as const,l:"Max Concurrent Sessions per User",min:1,max:10,step:1}].map(f=>(
            <div key={f.k} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"16px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <p style={{fontWeight:600,fontSize:13,color:T.text,margin:0}}>{f.l}</p>
                <span style={{fontWeight:800,fontSize:16,color:T.badgeFg}}>{config[f.k]}</span>
              </div>
              <input type="range" min={f.min} max={f.max} step={f.step} value={config[f.k]} onChange={e=>saveConfig({[f.k]:parseInt(e.target.value)})} style={{width:"100%",accentColor:A1}}/>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:10,color:T.sub}}>{f.min}</span>
                <span style={{fontSize:10,color:T.sub}}>{f.max}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
