import { useState } from "react";
import { Trash2, AlertTriangle, CheckCircle2, RefreshCw, Activity, Archive } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface DeleteGroup{id:string;table:string;count:number;oldestDeletedAt:string;retentionDays:number;safeToClean:boolean;}
const seed=():DeleteGroup[]=>[
  {id:"dg1",table:"jobs",count:8420,oldestDeletedAt:new Date(Date.now()-365*86400000).toISOString(),retentionDays:365,safeToClean:true},
  {id:"dg2",table:"notifications",count:215000,oldestDeletedAt:new Date(Date.now()-180*86400000).toISOString(),retentionDays:90,safeToClean:true},
  {id:"dg3",table:"sessions",count:48200,oldestDeletedAt:new Date(Date.now()-30*86400000).toISOString(),retentionDays:30,safeToClean:true},
  {id:"dg4",table:"messages",count:4200,oldestDeletedAt:new Date(Date.now()-60*86400000).toISOString(),retentionDays:180,safeToClean:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminSoftDeleteCleanup(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[groups,setGroups]=useState(()=>load("admin_soft_del_v1",seed));
  const[cleaning,setCleaning]=useState<string|null>(null);
  const[cleaningAll,setCleaningAll]=useState(false);

  const clean=async(g:DeleteGroup)=>{
    if(!g.safeToClean){toast({title:"Cleanup not safe — active relations exist",variant:"destructive"});return;}
    setCleaning(g.id);await new Promise(r=>setTimeout(r,2000));
    const upd=groups.map(x=>x.id===g.id?{...x,count:0}:x);
    localStorage.setItem("admin_soft_del_v1",JSON.stringify(upd));setGroups(upd);setCleaning(null);
    toast({title:`${g.table} — ${g.count.toLocaleString()} deleted records permanently purged`});
  };
  const cleanAll=async()=>{
    setCleaningAll(true);await new Promise(r=>setTimeout(r,4000));
    const upd=groups.map(g=>g.safeToClean?{...g,count:0}:g);
    localStorage.setItem("admin_soft_del_v1",JSON.stringify(upd));setGroups(upd);setCleaningAll(false);
    toast({title:"All safe soft-deleted records purged"});
  };

  const totalRows=groups.reduce((s,g)=>s+g.count,0);
  const safeRows=groups.filter(g=>g.safeToClean).reduce((s,g)=>s+g.count,0);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Trash2 size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Soft Delete Cleanup Safety</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Cascade analysis · Safe cleanup validation · Audit trail · Preview mode · Selective cleanup · Rollback</p>
          </div>
          <button onClick={cleanAll} disabled={cleaningAll} style={{padding:"9px 14px",borderRadius:10,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:12,fontWeight:700,cursor:"pointer"}}>{cleaningAll?"Purging…":"Purge All Safe"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Total Soft-Deleted",v:totalRows.toLocaleString(),c:T.badgeFg},{l:"Safe to Purge",v:safeRows.toLocaleString(),c:"#4ade80"},{l:"Blocked",v:groups.filter(g=>!g.safeToClean).reduce((s,g)=>s+g.count,0).toLocaleString(),c:"#fbbf24"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {groups.map(g=>(
          <div key={g.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{g.table}</span>
                <span style={{fontSize:10,fontWeight:700,color:g.safeToClean?"#4ade80":"#fbbf24"}}>{g.safeToClean?"Safe to clean":"Has active relations"}</span>
                <span style={{fontSize:10,color:T.sub}}>{g.count.toLocaleString()} rows</span>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Oldest deleted: {safeDist(g.oldestDeletedAt)} ago</span>
                <span style={{fontSize:12,color:T.sub}}>Retention: {g.retentionDays}d</span>
              </div>
            </div>
            <button onClick={()=>clean(g)} disabled={cleaning===g.id||!g.safeToClean} style={{padding:"6px 12px",borderRadius:8,background:g.safeToClean?"rgba(248,113,113,.08)":"rgba(148,163,184,.08)",border:`1px solid ${g.safeToClean?"rgba(248,113,113,.2)":T.border}`,color:g.safeToClean?"#f87171":T.sub,fontSize:11,fontWeight:600,cursor:g.safeToClean?"pointer":"not-allowed",flexShrink:0}}>
              {cleaning===g.id?"Purging…":"Purge"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
