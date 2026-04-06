import { useState } from "react";
import { Database, AlertTriangle, CheckCircle2, RefreshCw, Shield, Clock } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Backup{id:string;name:string;version:string;appVersion:string;sizeGB:number;createdAt:string;status:"compatible"|"incompatible"|"unknown";tables:number;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={compatible:"#4ade80",incompatible:"#f87171",unknown:"#94a3b8"};

export default function AdminRestoreVersionControl(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[backups]=useState([]);
  const[restoring,setRestoring]=useState<string|null>(null);
  const[checking,setChecking]=useState<string|null>(null);
  const currentSchema="schema_v48";const currentApp="v2.4";

  const check=async(id:string)=>{
    setChecking(id);await new Promise(r=>setTimeout(r,1200));setChecking(null);
    toast({title:"Version compatibility checked"});
  };
  const restore=async(b:Backup)=>{
    if(b.status==="incompatible"){toast({title:"Cannot restore — schema version incompatible",variant:"destructive"});return;}
    setRestoring(b.id);await new Promise(r=>setTimeout(r,3000));setRestoring(null);
    toast({title:`${b.name} restored successfully`});
  };

  const incompatible=backups.filter(b=>b.status==="incompatible").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Database size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Backup Restore & Version Control</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Version snapshot · Schema comparison · Compatibility check · Restore validation · Migration logs · Rollback</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Backups",v:backups.length,c:T.badgeFg},{l:"Incompatible",v:incompatible,c:incompatible>0?"#f87171":"#4ade80"},{l:"Current Schema",v:currentSchema,c:"#4ade80"},{l:"App",v:currentApp,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {backups.map(b=>(
          <div key={b.id} style={{background:T.card,border:`1px solid ${b.status==="incompatible"?"rgba(248,113,113,.25)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{b.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{b.version}</span>
                <span style={{fontSize:10,color:T.sub}}>App {b.appVersion}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[b.status],textTransform:"capitalize"}}>{b.status}</span>
                {b.status==="incompatible"&&<span style={{fontSize:10,color:"#f87171"}}>⚠ schema mismatch</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>{b.sizeGB} GB</span>
                <span style={{fontSize:12,color:T.sub}}>{b.tables} tables</span>
                <span style={{fontSize:12,color:T.sub}}>{safeDist(b.createdAt)} ago</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>check(b.id)} disabled={checking===b.id} style={{padding:"5px 10px",borderRadius:7,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,cursor:"pointer"}}>{checking===b.id?"…":"Check"}</button>
              <button onClick={()=>restore(b)} disabled={restoring===b.id||b.status==="incompatible"} style={{padding:"5px 10px",borderRadius:7,background:b.status==="incompatible"?"rgba(148,163,184,.1)":`rgba(74,222,128,.08)`,border:`1px solid ${b.status==="incompatible"?T.border:"rgba(74,222,128,.2)"}`,color:b.status==="incompatible"?T.sub:"#4ade80",fontSize:11,fontWeight:600,cursor:b.status==="incompatible"?"not-allowed":"pointer"}}>
                {restoring===b.id?"Restoring…":"Restore"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
