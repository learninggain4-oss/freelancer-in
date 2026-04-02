import { useState } from "react";
import { BookOpen, AlertTriangle, CheckCircle2, RefreshCw, Activity, Search } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface SearchIdx{id:string;name:string;documents:number;status:"healthy"|"corrupted"|"rebuilding"|"stale";accuracyPct:number;lastRebuild:string;sizeKb:number;}
const seed=():SearchIdx[]=>[
  {id:"i1",name:"Jobs Index",documents:4510,status:"healthy",accuracyPct:99,lastRebuild:new Date(Date.now()-86400000).toISOString(),sizeKb:8400},
  {id:"i2",name:"Freelancer Index",documents:12840,status:"stale",accuracyPct:78,lastRebuild:new Date(Date.now()-604800000).toISOString(),sizeKb:14200},
  {id:"i3",name:"Portfolio Index",documents:8200,status:"corrupted",accuracyPct:0,lastRebuild:new Date(Date.now()-1209600000).toISOString(),sizeKb:0},
  {id:"i4",name:"Notification Index",documents:215000,status:"healthy",accuracyPct:100,lastRebuild:new Date(Date.now()-3600000).toISOString(),sizeKb:42000},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={healthy:"#4ade80",corrupted:"#f87171",rebuilding:"#fbbf24",stale:"#fb923c"};

export default function AdminSearchIndex(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[indexes,setIndexes]=useState(()=>load("admin_search_idx_v1",seed));
  const[rebuilding,setRebuilding]=useState<string|null>(null);

  const rebuild=async(idx:SearchIdx)=>{
    setRebuilding(idx.id);
    const upd1=indexes.map(x=>x.id===idx.id?{...x,status:"rebuilding" as const}:x);setIndexes(upd1);
    await new Promise(r=>setTimeout(r,2500));
    const upd2=indexes.map(x=>x.id===idx.id?{...x,status:"healthy" as const,accuracyPct:100,lastRebuild:new Date().toISOString()}:x);
    localStorage.setItem("admin_search_idx_v1",JSON.stringify(upd2));setIndexes(upd2);setRebuilding(null);
    toast({title:`${idx.name} rebuilt successfully`});
  };
  const rebuildAll=async()=>{
    setRebuilding("all");await new Promise(r=>setTimeout(r,4000));
    const upd=indexes.map(x=>({...x,status:"healthy" as const,accuracyPct:100,lastRebuild:new Date().toISOString()}));
    localStorage.setItem("admin_search_idx_v1",JSON.stringify(upd));setIndexes(upd);setRebuilding(null);
    toast({title:"All indexes rebuilt"});
  };

  const issues=indexes.filter(i=>i.status!=="healthy").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><BookOpen size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Search Index Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Health monitoring · Index rebuild · Consistency check · Performance · Error alerts · Backup · Recovery</p>
          </div>
          <button onClick={rebuildAll} disabled={!!rebuilding} style={{padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{rebuilding==="all"?"Rebuilding…":"Rebuild All"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Indexes",v:indexes.length,c:T.badgeFg},{l:"Issues",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Total Docs",v:indexes.reduce((s,i)=>s+i.documents,0).toLocaleString(),c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {indexes.map(idx=>(
          <div key={idx.id} style={{background:T.card,border:`1px solid ${idx.status!=="healthy"?`${sColor[idx.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:sColor[idx.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{idx.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[idx.status],textTransform:"capitalize"}}>{idx.status}</span>
                <span style={{fontSize:10,color:T.sub}}>{idx.documents.toLocaleString()} docs</span>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Accuracy: <strong style={{color:idx.accuracyPct>90?"#4ade80":"#f87171"}}>{idx.accuracyPct}%</strong></span>
                <span style={{fontSize:12,color:T.sub}}>Size: {(idx.sizeKb/1024).toFixed(1)} MB</span>
                <span style={{fontSize:12,color:T.sub}}>Last rebuild: {formatDistanceToNow(new Date(idx.lastRebuild))} ago</span>
              </div>
            </div>
            <button onClick={()=>rebuild(idx)} disabled={!!rebuilding} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {rebuilding===idx.id?"Rebuilding…":"Rebuild"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
