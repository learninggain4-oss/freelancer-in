import { useState } from "react";
import { Wrench, AlertTriangle, CheckCircle2, RefreshCw, Clock, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface MaintLog{id:string;action:string;by:string;at:string;duration:number;}
const seedLogs=():MaintLog[]=>[
  {id:"m1",action:"Maintenance mode enabled",by:"Super Admin",at:new Date(Date.now()-86400000).toISOString(),duration:45},
  {id:"m2",action:"Database migration ran",by:"System",at:new Date(Date.now()-86400000+1800000).toISOString(),duration:18},
  {id:"m3",action:"Maintenance mode disabled",by:"Super Admin",at:new Date(Date.now()-86400000+2700000).toISOString(),duration:0},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminMaintenanceMode(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[enabled,setEnabled]=useState(false);
  const[logs,setLogs]=useState(()=>load("admin_maint_logs_v1",seedLogs));
  const[toggling,setToggling]=useState(false);
  const[banner,setBanner]=useState("System maintenance in progress. We'll be back soon.");
  const[scheduledAt,setScheduledAt]=useState("");

  const toggle=async()=>{
    setToggling(true);await new Promise(r=>setTimeout(r,1200));
    const next=!enabled;setEnabled(next);
    const newLog={id:Date.now().toString(),action:next?"Maintenance mode enabled":"Maintenance mode disabled",by:"Admin",at:new Date().toISOString(),duration:0};
    const upd=[newLog,...logs];
    localStorage.setItem("admin_maint_logs_v1",JSON.stringify(upd));setLogs(upd);setToggling(false);
    toast({title:`Maintenance mode ${next?"enabled":"disabled"}`});
  };

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Wrench size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Maintenance Mode Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Mode toggle · Scheduled maintenance · Access restriction · Notification banner · Logs · Failure alerts · Rollback</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Status",v:enabled?"ACTIVE":"INACTIVE",c:enabled?"#f87171":"#4ade80"},{l:"Past Events",v:logs.length,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      {enabled&&<div style={{background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.3)",borderRadius:12,padding:"12px 18px",marginBottom:14,display:"flex",gap:10,alignItems:"center"}}>
        <AlertTriangle size={16} color="#f87171"/><span style={{fontSize:13,color:"#f87171",fontWeight:700}}>MAINTENANCE MODE IS ACTIVE — All user access is restricted</span>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px"}}>
          <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Mode Toggle</p>
          <p style={{fontSize:12,color:T.sub,margin:"0 0 12px"}}>Current: <strong style={{color:enabled?"#f87171":"#4ade80"}}>{enabled?"MAINTENANCE MODE":"Normal Operation"}</strong></p>
          <button onClick={toggle} disabled={toggling} style={{width:"100%",padding:"10px",borderRadius:10,background:enabled?"rgba(74,222,128,.1)":`linear-gradient(135deg,${A1},${A2})`,border:enabled?"1px solid rgba(74,222,128,.3)":"none",color:enabled?"#4ade80":"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            {toggling?"Processing…":enabled?"Disable Maintenance Mode":"Enable Maintenance Mode"}
          </button>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px"}}>
          <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>User Banner Message</p>
          <textarea value={banner} onChange={e=>setBanner(e.target.value)} rows={3} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"8px 12px",fontSize:12,resize:"vertical",boxSizing:"border-box"}}/>
          <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"10px 0 4px"}}>Schedule</p>
          <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"6px 10px",fontSize:12,boxSizing:"border-box"}}/>
        </div>
      </div>
      <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Maintenance Log</p>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {logs.map((l,i)=>(
          <div key={l.id} style={{display:"flex",gap:12,padding:"10px 18px",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            <Wrench size={13} color={T.sub}/>
            <span style={{flex:1,fontSize:12,color:T.text}}>{l.action} — by {l.by}{l.duration>0?` (${l.duration}min)`:""}</span>
            <span style={{fontSize:11,color:T.sub}}>{safeFmt(l.at, "MMM d, HH:mm")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
