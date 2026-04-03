import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Users, Key, Clock, FileText, RefreshCw } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
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

interface LockedAdmin{id:string;name:string;email:string;lockedAt:string;failedAttempts:number;lockReason:string;recoveryTokenSent:boolean;}
interface RecoveryLog{id:string;admin:string;action:string;ip:string;at:string;success:boolean;}

const seedLocked=():LockedAdmin[]=>[
  {id:"la1",name:"Admin C",email:"admin.c@fi.com",lockedAt:new Date(Date.now()-3600000).toISOString(),failedAttempts:5,lockReason:"5 consecutive failed login attempts",recoveryTokenSent:true},
];
const seedRecoveryLogs=():RecoveryLog[]=>[
  {id:"rl1",admin:"Admin A",action:"Account unlocked manually",ip:"192.168.1.10",at:new Date(Date.now()-86400000*3).toISOString(),success:true},
  {id:"rl2",admin:"Admin B",action:"Recovery token sent",ip:"192.168.1.11",at:new Date(Date.now()-86400000*7).toISOString(),success:true},
  {id:"rl3",admin:"Unknown",action:"Login attempt — blocked IP",ip:"45.79.12.200",at:new Date(Date.now()-7200000).toISOString(),success:false},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminLockoutRecovery(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[tab,setTab]=useState<"locked"|"logs">("locked");
  const[locked,setLocked]=useState<LockedAdmin[]>(()=>load("admin_lockout_v1",seedLocked));
  const[logs]=useState<RecoveryLog[]>(()=>load("admin_recovery_logs_v1",seedRecoveryLogs));
  const[unlocking,setUnlocking]=useState<string|null>(null);
  const[sendingToken,setSendingToken]=useState<string|null>(null);

  const unlock=async(a:LockedAdmin)=>{
    setUnlocking(a.id);
    await new Promise(r=>setTimeout(r,800));
    const upd=locked.filter(x=>x.id!==a.id);
    localStorage.setItem("admin_lockout_v1",JSON.stringify(upd));setLocked(upd);setUnlocking(null);
    logAction("Admin Unlocked",a.email,"Security","warning");
    toast({title:`${a.name} unlocked — login access restored`});
  };

  const sendRecoveryToken=async(a:LockedAdmin)=>{
    setSendingToken(a.id);
    await new Promise(r=>setTimeout(r,1000));
    const upd=locked.map(x=>x.id===a.id?{...x,recoveryTokenSent:true}:x);
    localStorage.setItem("admin_lockout_v1",JSON.stringify(upd));setLocked(upd);setSendingToken(null);
    toast({title:`Recovery token sent to ${a.email}`});
  };

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <ShieldCheck size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Admin Lockout Recovery System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Emergency unlock · Recovery tokens · Login monitoring · Lockout alerts · Access recovery logs</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Locked Admins",v:locked.length,c:locked.length>0?"#f87171":"#4ade80"},{l:"Recovery Logs",v:logs.length,c:T.badgeFg},{l:"Suspicious Attempts",v:logs.filter(l=>!l.success).length,c:"#fbbf24"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["locked","Locked Accounts",ShieldCheck],["logs","Recovery Log",FileText]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}{t==="locked"&&locked.length>0&&<span style={{background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800}}>{locked.length}</span>}
          </button>
        ))}
      </div>

      {tab==="locked"&&(
        <>
          {locked.length===0&&<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"32px",textAlign:"center" as const}}>
            <CheckCircle2 size={32} color="#4ade80" style={{margin:"0 auto 10px"}}/>
            <p style={{color:"#4ade80",fontWeight:700,fontSize:14,margin:0}}>No admin accounts are currently locked</p>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {locked.map(a=>(
              <div key={a.id} style={{background:T.card,border:"1px solid rgba(248,113,113,.25)",borderRadius:13,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10}}>
                  <div style={{width:38,height:38,borderRadius:11,background:"rgba(248,113,113,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Users size={17} color="#f87171"/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:13,color:T.text}}>{a.name}</span>
                      <span style={{fontSize:11,color:T.sub}}>{a.email}</span>
                      <span style={{fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 7px",borderRadius:5}}>LOCKED</span>
                    </div>
                    <p style={{fontSize:12,color:"#f87171",margin:"0 0 2px"}}>{a.lockReason}</p>
                    <p style={{fontSize:11,color:T.sub,margin:0}}>Failed attempts: {a.failedAttempts} · Locked {safeDist(a.lockedAt)} ago</p>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>unlock(a)} disabled={unlocking===a.id} style={{padding:"7px 16px",borderRadius:8,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{unlocking===a.id?"Unlocking…":"Unlock Account"}</button>
                  {!a.recoveryTokenSent&&<button onClick={()=>sendRecoveryToken(a)} disabled={sendingToken===a.id} style={{padding:"7px 16px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer"}}>{sendingToken===a.id?"Sending…":"Send Recovery Token"}</button>}
                  {a.recoveryTokenSent&&<span style={{fontSize:11,color:"#4ade80",alignSelf:"center"}}>✓ Recovery token sent</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==="logs"&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
          {logs.map((l,i)=>(
            <div key={l.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
              {l.success?<CheckCircle2 size={14} color="#4ade80" style={{flexShrink:0}}/>:<AlertTriangle size={14} color="#f87171" style={{flexShrink:0}}/>}
              <div style={{flex:1}}>
                <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 2px"}}>{l.admin} — {l.action}</p>
                <p style={{fontSize:11,color:T.sub,margin:0}}>IP: {l.ip} · {safeFmt(l.at, "MMM d, HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
