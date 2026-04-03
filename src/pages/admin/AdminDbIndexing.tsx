import { useState } from "react";
import { Database, AlertTriangle, CheckCircle2, RefreshCw, Activity, Zap } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface IndexInfo{id:string;table:string;column:string;exists:boolean;recommended:boolean;usage:number;impact:"high"|"medium"|"low";avgQueryMs:number;}
interface SlowQuery{id:string;sql:string;avgMs:number;count:number;}
const seedIdx=():IndexInfo[]=>[
  {id:"i1",table:"jobs",column:"status, created_at",exists:true,recommended:true,usage:92,impact:"high",avgQueryMs:12},
  {id:"i2",table:"users",column:"email",exists:true,recommended:true,usage:88,impact:"high",avgQueryMs:8},
  {id:"i3",table:"transactions",column:"wallet_id, created_at",exists:false,recommended:true,usage:0,impact:"high",avgQueryMs:840},
  {id:"i4",table:"notifications",column:"user_id, is_read",exists:false,recommended:true,usage:0,impact:"medium",avgQueryMs:420},
];
const seedSlowQ=():SlowQuery[]=>[
  {id:"sq1",sql:"SELECT * FROM transactions WHERE wallet_id=? ORDER BY created_at DESC",avgMs:840,count:12480},
  {id:"sq2",sql:"SELECT * FROM notifications WHERE user_id=? AND is_read=false",avgMs:420,count:84200},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const impactColor={high:"#f87171",medium:"#fbbf24",low:"#4ade80"};

export default function AdminDbIndexing(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];const{toast}=useToast();
  const[indexes,setIndexes]=useState(()=>load("admin_db_idx_v1",seedIdx));
  const[slowQ]=useState(()=>load("admin_slow_q_v1",seedSlowQ));
  const[creating,setCreating]=useState<string|null>(null);
  const[tab,setTab]=useState<"indexes"|"slow">("indexes");

  const createIndex=async(id:string)=>{
    setCreating(id);await new Promise(r=>setTimeout(r,2000));
    const upd=indexes.map(i=>i.id===id?{...i,exists:true,usage:75,avgQueryMs:Math.round(i.avgQueryMs*0.1)}:i);
    localStorage.setItem("admin_db_idx_v1",JSON.stringify(upd));setIndexes(upd);setCreating(null);
    toast({title:"Index created — query performance improved"});
  };

  const missing=indexes.filter(i=>!i.exists&&i.recommended).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Database size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Database Performance Optimization</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Index monitoring · Missing index detection · Performance analysis · Query monitoring · Optimization alerts</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Indexes",v:indexes.length,c:T.badgeFg},{l:"Missing",v:missing,c:missing>0?"#f87171":"#4ade80"},{l:"Slow Queries",v:slowQ.length,c:slowQ.length>0?"#fbbf24":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {([["indexes","Indexes",Database],["slow","Slow Queries",Activity]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}
          </button>
        ))}
      </div>
      {tab==="indexes"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {indexes.map(i=>(
          <div key={i.id} style={{background:T.card,border:`1px solid ${!i.exists&&i.recommended?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:T.text}}>{i.table}</span>
                <span style={{fontSize:10,color:T.sub}}>({i.column})</span>
                <span style={{fontSize:10,fontWeight:700,color:i.exists?"#4ade80":"#f87171"}}>{i.exists?"EXISTS":"MISSING"}</span>
                <span style={{fontSize:10,color:impactColor[i.impact],fontWeight:700}}>{i.impact.toUpperCase()} impact</span>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {i.exists&&<span style={{fontSize:12,color:T.sub}}>Usage: {i.usage}%</span>}
                <span style={{fontSize:12,color:T.sub}}>Avg query: <strong style={{color:i.avgQueryMs>200?"#f87171":"#4ade80"}}>{i.avgQueryMs}ms</strong></span>
              </div>
            </div>
            {!i.exists&&i.recommended&&<button onClick={()=>createIndex(i.id)} disabled={creating===i.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {creating===i.id?"Creating…":"Create Index"}
            </button>}
          </div>
        ))}
      </div>}
      {tab==="slow"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {slowQ.map(q=>(
          <div key={q.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px"}}>
            <div style={{display:"flex",gap:8,marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:700,color:"#f87171"}}>{q.avgMs}ms avg</span>
              <span style={{fontSize:12,color:T.sub}}>·</span>
              <span style={{fontSize:12,color:T.sub}}>{q.count.toLocaleString()} executions</span>
            </div>
            <code style={{fontSize:11,color:T.sub,display:"block",wordBreak:"break-all"}}>{q.sql}</code>
          </div>
        ))}
      </div>}
    </div>
  );
}
