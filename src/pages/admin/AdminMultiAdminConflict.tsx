import { useState } from "react";
import { Users, AlertTriangle, CheckCircle2, RefreshCw, Lock, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ConfigLock{id:string;section:string;lockedBy:string;lockedAt:string;expiresAt:string;}
interface ChangeEvent{id:string;admin:string;section:string;change:string;conflict:boolean;at:string;rolled:boolean;}
const seedLocks=():ConfigLock[]=>[
  {id:"lk1",section:"Payment Settings",lockedBy:"Admin A",lockedAt:new Date(Date.now()-900000).toISOString(),expiresAt:new Date(Date.now()+300000).toISOString()},
];
const seedEvents=():ChangeEvent[]=>[
  {id:"ch1",admin:"Admin A",section:"Payment Settings",change:"Changed Razorpay key",conflict:false,at:new Date(Date.now()-3600000).toISOString(),rolled:false},
  {id:"ch2",admin:"Admin B",section:"Payment Settings",change:"Attempted commission rate change — CONFLICT",conflict:true,at:new Date(Date.now()-1800000).toISOString(),rolled:false},
  {id:"ch3",admin:"Super Admin",section:"User Roles",change:"Added moderator permission",conflict:false,at:new Date(Date.now()-86400000).toISOString(),rolled:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminMultiAdminConflict(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[locks,setLocks]=useState(()=>load("admin_locks_v1",seedLocks));
  const[events,setEvents]=useState(()=>load("admin_conflict_events_v1",seedEvents));
  const[releasing,setReleasing]=useState<string|null>(null);
  const[rolling,setRolling]=useState<string|null>(null);

  const releaseLock=async(id:string)=>{
    setReleasing(id);await new Promise(r=>setTimeout(r,600));
    const upd=locks.filter(l=>l.id!==id);
    localStorage.setItem("admin_locks_v1",JSON.stringify(upd));setLocks(upd);setReleasing(null);
    toast({title:"Lock released"});
  };
  const rollback=async(id:string)=>{
    setRolling(id);await new Promise(r=>setTimeout(r,800));
    const upd=events.map(e=>e.id===id?{...e,rolled:true}:e);
    localStorage.setItem("admin_conflict_events_v1",JSON.stringify(upd));setEvents(upd);setRolling(null);
    toast({title:"Change rolled back"});
  };

  const conflicts=events.filter(e=>e.conflict).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Users size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Admin Change Conflict Protection</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Real-time locking · Conflict detection · Merge validation · Approval workflow · Version control · Rollback</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Active Locks",v:locks.length,c:locks.length>0?"#fbbf24":"#4ade80"},{l:"Conflicts",v:conflicts,c:conflicts>0?"#f87171":"#4ade80"},{l:"Changes Today",v:events.length,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      {locks.length>0&&<div style={{marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Active Configuration Locks</p>
        {locks.map(l=>(
          <div key={l.id} style={{background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.2)",borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center",marginBottom:6}}>
            <Lock size={14} color="#fbbf24" style={{flexShrink:0}}/>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,fontSize:12,color:T.text,margin:"0 0 2px"}}>{l.section} — locked by {l.lockedBy}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>Locked {safeDist(l.lockedAt)} ago · Expires {safeDist(l.expiresAt)}</p>
            </div>
            <button onClick={()=>releaseLock(l.id)} disabled={releasing===l.id} style={{padding:"5px 12px",borderRadius:7,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>
              {releasing===l.id?"…":"Release"}
            </button>
          </div>
        ))}
      </div>}
      <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Change History</p>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {events.map((e,i)=>(
          <div key={e.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<events.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:e.conflict?"#f87171":"#4ade80",flexShrink:0}}/>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 1px"}}>{e.admin} — {e.section}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>{e.change} · {safeFmt(e.at, "MMM d, HH:mm")}</p>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
              {e.conflict&&<span style={{fontSize:10,color:"#f87171",fontWeight:700}}>CONFLICT</span>}
              {e.rolled&&<span style={{fontSize:10,color:"#fbbf24"}}>Rolled back</span>}
              {!e.rolled&&<button onClick={()=>rollback(e.id)} disabled={rolling===e.id} style={{padding:"4px 10px",borderRadius:6,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:10,fontWeight:600,cursor:"pointer"}}>{rolling===e.id?"…":"Rollback"}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
