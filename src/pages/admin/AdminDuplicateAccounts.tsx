import { useState } from "react";
import { Users, AlertTriangle, CheckCircle2, RefreshCw, UserCheck, Shield } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface DuplicateGroup{id:string;matchType:"email"|"phone";identifier:string;accounts:number;primaryId:string;detectedAt:string;mergeStatus:"pending"|"merged"|"dismissed";}
const seed=():DuplicateGroup[]=>[
  {id:"dg1",matchType:"email",identifier:"rahul.k@gmail.com",accounts:2,primaryId:"user_182",detectedAt:new Date(Date.now()-3600000).toISOString(),mergeStatus:"pending"},
  {id:"dg2",matchType:"phone",identifier:"+91 9876543210",accounts:3,primaryId:"user_510",detectedAt:new Date(Date.now()-7200000).toISOString(),mergeStatus:"pending"},
  {id:"dg3",matchType:"email",identifier:"priya.m@yahoo.com",accounts:2,primaryId:"user_288",detectedAt:new Date(Date.now()-86400000).toISOString(),mergeStatus:"merged"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminDuplicateAccounts(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[groups,setGroups]=useState(()=>load("admin_dup_accounts_v1",seed));
  const[scanning,setScanning]=useState(false);
  const[acting,setActing]=useState<string|null>(null);
  const[config,setConfig]=useState({checkEmail:true,checkPhone:true,autoDetect:true});

  const scan=async()=>{
    setScanning(true);await new Promise(r=>setTimeout(r,2500));setScanning(false);
    toast({title:`Scan complete — ${groups.filter(g=>g.mergeStatus==="pending").length} duplicate groups found`});
  };
  const merge=async(id:string)=>{
    setActing(id);await new Promise(r=>setTimeout(r,1000));
    const upd=groups.map(g=>g.id===id?{...g,mergeStatus:"merged" as const}:g);
    localStorage.setItem("admin_dup_accounts_v1",JSON.stringify(upd));setGroups(upd);setActing(null);
    toast({title:"Accounts merged into primary"});
  };
  const dismiss=async(id:string)=>{
    setActing(id);await new Promise(r=>setTimeout(r,400));
    const upd=groups.map(g=>g.id===id?{...g,mergeStatus:"dismissed" as const}:g);
    localStorage.setItem("admin_dup_accounts_v1",JSON.stringify(upd));setGroups(upd);setActing(null);
    toast({title:"Duplicate dismissed"});
  };

  const pending=groups.filter(g=>g.mergeStatus==="pending").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Users size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Duplicate Account Prevention</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Unique email/phone validation · Duplicate detection · Account merge · Alerts · Verification · Integrity monitoring</p>
          </div>
          <button onClick={scan} disabled={scanning} style={{padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{scanning?"Scanning…":"Scan Now"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Pending",v:pending,c:pending>0?"#fbbf24":"#4ade80"},{l:"Merged",v:groups.filter(g=>g.mergeStatus==="merged").length,c:"#4ade80"},{l:"Total Groups",v:groups.length,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 18px",marginBottom:12,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,color:T.text,fontWeight:700}}>Detection Rules:</span>
        {([["checkEmail","Email"],["checkPhone","Phone"],["autoDetect","Auto-detect"]] as const).map(([k,l])=>(
          <button key={k} onClick={()=>setConfig(p=>({...p,[k]:!p[k as keyof typeof p]}))} style={{padding:"4px 12px",borderRadius:6,background:config[k]?`${A1}18`:"rgba(148,163,184,.1)",border:`1px solid ${config[k]?A1:T.border}`,color:config[k]?T.badgeFg:T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>
            {l}: {config[k]?"ON":"OFF"}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {groups.map(g=>(
          <div key={g.id} style={{background:T.card,border:`1px solid ${g.mergeStatus==="pending"?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:4,textTransform:"uppercase"}}>{g.matchType}</span>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{g.identifier}</span>
                <span style={{fontSize:10,color:"#fbbf24"}}>{g.accounts} accounts</span>
                <span style={{fontSize:10,fontWeight:700,color:g.mergeStatus==="pending"?"#fbbf24":g.mergeStatus==="merged"?"#4ade80":"#94a3b8",textTransform:"capitalize"}}>{g.mergeStatus}</span>
              </div>
              <p style={{fontSize:12,color:T.sub,margin:0}}>Primary: {g.primaryId} · Detected: {format(new Date(g.detectedAt),"MMM d, HH:mm")}</p>
            </div>
            {g.mergeStatus==="pending"&&<div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>merge(g.id)} disabled={acting===g.id} style={{padding:"5px 10px",borderRadius:7,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>Merge</button>
              <button onClick={()=>dismiss(g.id)} disabled={acting===g.id} style={{padding:"5px 10px",borderRadius:7,background:"rgba(148,163,184,.1)",border:`1px solid ${T.border}`,color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}}>Dismiss</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
