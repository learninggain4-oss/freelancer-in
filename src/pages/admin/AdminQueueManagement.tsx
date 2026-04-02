import { useState } from "react";
import { Layers, AlertTriangle, CheckCircle2, RefreshCw, Activity, Pause, Play } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Queue{id:string;name:string;pending:number;processing:number;failed:number;concurrency:number;priority:number;processingSpeed:number;status:"running"|"paused"|"degraded";}
const seed=():Queue[]=>[
  {id:"q1",name:"Email Queue",pending:42,processing:5,failed:2,concurrency:5,priority:1,processingSpeed:120,status:"running"},
  {id:"q2",name:"SMS Queue",pending:180,processing:10,failed:18,concurrency:10,priority:2,processingSpeed:45,status:"degraded"},
  {id:"q3",name:"Push Notification Queue",pending:640,processing:20,failed:0,concurrency:20,priority:3,processingSpeed:280,status:"running"},
  {id:"q4",name:"Payment Webhook Queue",pending:8,processing:2,failed:0,concurrency:2,priority:1,processingSpeed:20,status:"running"},
  {id:"q5",name:"Report Generation Queue",pending:24,processing:0,failed:0,concurrency:3,priority:5,processingSpeed:0,status:"paused"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={running:"#4ade80",paused:"#94a3b8",degraded:"#fbbf24"};

export default function AdminQueueManagement(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[queues,setQueues]=useState(()=>load("admin_queue_mgmt_v1",seed));
  const[retrying,setRetrying]=useState<string|null>(null);

  const toggle=(id:string)=>{
    const upd=queues.map(q=>q.id===id?{...q,status:q.status==="paused"?"running" as const:"paused" as const}:q);
    localStorage.setItem("admin_queue_mgmt_v1",JSON.stringify(upd));setQueues(upd);
    toast({title:"Queue status updated"});
  };
  const retryFailed=async(id:string)=>{
    setRetrying(id);await new Promise(r=>setTimeout(r,1200));
    const upd=queues.map(q=>q.id===id?{...q,failed:0,pending:q.pending+q.failed}:q);
    localStorage.setItem("admin_queue_mgmt_v1",JSON.stringify(upd));setQueues(upd);setRetrying(null);
    toast({title:"Failed jobs re-queued"});
  };
  const setConcurrency=(id:string,val:number)=>{
    const upd=queues.map(q=>q.id===id?{...q,concurrency:val}:q);
    localStorage.setItem("admin_queue_mgmt_v1",JSON.stringify(upd));setQueues(upd);
    toast({title:"Concurrency updated"});
  };

  const totalPending=queues.reduce((s,q)=>s+q.pending,0);
  const totalFailed=queues.reduce((s,q)=>s+q.failed,0);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Layers size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Background Job Queue Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Queue dashboard · Length monitoring · Retry mechanism · Priority control · Concurrency · Health monitoring</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Total Pending",v:totalPending,c:totalPending>500?"#fbbf24":T.badgeFg},{l:"Failed",v:totalFailed,c:totalFailed>0?"#f87171":"#4ade80"},{l:"Queues",v:queues.length,c:T.badgeFg},{l:"Degraded",v:queues.filter(q=>q.status==="degraded").length,c:"#fbbf24"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {queues.map(q=>(
          <div key={q.id} style={{background:T.card,border:`1px solid ${q.status==="degraded"?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[q.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{q.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[q.status],textTransform:"capitalize"}}>{q.status}</span>
                <span style={{fontSize:10,color:T.sub}}>P{q.priority}</span>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:6}}>
                <span style={{fontSize:12,color:T.sub}}>Pending: <strong style={{color:q.pending>100?"#fbbf24":T.text}}>{q.pending}</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Processing: {q.processing}</span>
                <span style={{fontSize:12,color:T.sub}}>Failed: <strong style={{color:q.failed>0?"#f87171":"#4ade80"}}>{q.failed}</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Speed: {q.processingSpeed}/min</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:T.sub}}>Concurrency:</span>
                <input type="number" defaultValue={q.concurrency} onBlur={e=>setConcurrency(q.id,+e.target.value)} style={{width:55,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"3px 8px",fontSize:12}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {q.failed>0&&<button onClick={()=>retryFailed(q.id)} disabled={retrying===q.id} style={{padding:"5px 10px",borderRadius:7,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>{retrying===q.id?"…":"Retry"}</button>}
              <button onClick={()=>toggle(q.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 11px",borderRadius:8,background:q.status==="paused"?"rgba(74,222,128,.08)":"rgba(148,163,184,.08)",border:"1px solid rgba(148,163,184,.2)",color:q.status==="paused"?"#4ade80":"#94a3b8",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {q.status==="paused"?<Play size={10}/>:<Pause size={10}/>}{q.status==="paused"?"Resume":"Pause"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
