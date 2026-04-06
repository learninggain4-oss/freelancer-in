import { useState } from "react";
import { Lock, AlertTriangle, CheckCircle2, RefreshCw, Activity, Clock, BarChart3 } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface LockEntry{id:string;table:string;query:string;pid:number;waitingMs:number;status:"running"|"waiting"|"deadlock"|"resolved";startedAt:string;}
interface DeadlockEvent{id:string;tables:string[];resolvedBy:string;durationMs:number;at:string;auto:boolean;}

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const LOCK_KEY="admin_locks_v1";const DEADLOCK_KEY="admin_deadlocks_v1";
function seedLocks():LockEntry[]{return[
  {id:"lk1",table:"profiles",type:"row",holder:"tx_4821",waitedBy:"tx_4822",durationMs:120,status:"active",detectedAt:new Date(Date.now()-60000).toISOString()},
];}
function seedDeadlocks():DeadlockEvent[]{return[
  {id:"dl1",tables:["profiles","withdrawals"],transactions:["tx_4800","tx_4801"],resolvedBy:"auto-rollback",at:new Date(Date.now()-3600000).toISOString(),durationMs:450},
];}
const sColor={running:"#4ade80",waiting:"#fbbf24",deadlock:"#f87171",resolved:"#94a3b8"};

export default function AdminDeadlockProtection(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[tab,setTab]=useState<"locks"|"history">("locks");
  const[locks,setLocks]=useState<LockEntry[]>(()=>load(LOCK_KEY,seedLocks));
  const[events,setEvents]=useState<DeadlockEvent[]>(()=>load(DEADLOCK_KEY,seedDeadlocks));
  const[killing,setKilling]=useState<string|null>(null);

  const killLock=async(l:LockEntry)=>{
    setKilling(l.id);
    await new Promise(r=>setTimeout(r,800));
    const upd=locks.map(x=>x.id===l.id?{...x,status:"resolved" as const,waitingMs:0}:x);
    localStorage.setItem("admin_locks_v1",JSON.stringify(upd));setLocks(upd);setKilling(null);
    logAction("DB Lock Killed",`PID ${l.pid} on ${l.table}`,"System","warning");
    toast({title:`Lock on ${l.table} resolved — PID ${l.pid} terminated`});
  };

  const deadlocks=locks.filter(l=>l.status==="deadlock").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Lock size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Database Lock & Deadlock Protection</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Deadlock detection · Transaction retry · Lock monitoring · Query timeout · Conflict resolution</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Active Locks",v:locks.filter(l=>l.status==="running").length,c:T.badgeFg},{l:"Waiting",v:locks.filter(l=>l.status==="waiting").length,c:"#fbbf24"},{l:"Deadlocks",v:deadlocks,c:deadlocks>0?"#f87171":"#4ade80"},{l:"Events Today",v:events.length,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["locks","Active Locks",Lock],["history","Deadlock History",BarChart3]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}{t==="locks"&&deadlocks>0&&<span style={{background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800}}>{deadlocks}</span>}
          </button>
        ))}
      </div>

      {tab==="locks"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {locks.map(l=>(
            <div key={l.id} style={{background:T.card,border:`1px solid ${l.status==="deadlock"?"rgba(248,113,113,.25)":l.status==="waiting"?"rgba(251,191,36,.15)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:sColor[l.status],flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:T.text}}>{l.table}</span>
                  <span style={{fontSize:10,color:T.sub}}>PID {l.pid}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[l.status],background:`${sColor[l.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{l.status}</span>
                  {l.waitingMs>0&&<span style={{fontSize:10,color:"#fbbf24"}}>waiting {(l.waitingMs/1000).toFixed(1)}s</span>}
                </div>
                <p style={{fontFamily:"monospace",fontSize:11,color:T.sub,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:500}}>{l.query}</p>
              </div>
              {(l.status==="deadlock"||l.status==="waiting")&&<button onClick={()=>killLock(l)} disabled={killing===l.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                {killing===l.id?"Killing…":"Kill Lock"}
              </button>}
            </div>
          ))}
        </div>
      )}

      {tab==="history"&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
          {events.map((e,i)=>(
            <div key={e.id} style={{display:"flex",gap:12,padding:"13px 18px",borderBottom:i<events.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
              <AlertTriangle size={14} color="#f87171" style={{flexShrink:0}}/>
              <div style={{flex:1}}>
                <p style={{fontWeight:700,fontSize:12,color:T.text,margin:"0 0 2px"}}>Deadlock — {e.tables.join(" ↔ ")}</p>
                <p style={{fontSize:11,color:T.sub,margin:0}}>Resolved by: {e.resolvedBy}{e.auto?" (auto)":""} · Duration: {(e.durationMs/1000).toFixed(1)}s · {safeFmt(e.at, "MMM d, HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
