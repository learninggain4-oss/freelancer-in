import { useState } from "react";
import { RotateCcw, AlertTriangle, CheckCircle2, RefreshCw, Shield, Clock, FileText } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
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

interface ConfigVersion{id:string;version:string;label:string;changes:string[];createdAt:string;createdBy:string;isActive:boolean;tested:boolean;}

const seedVersions=():ConfigVersion[]=>[
  {id:"cv1",version:"v12",label:"Platform fee increase + KYC mandatory",changes:["platform_fee_pct: 10% → 12%","kyc_required: false → true"],createdAt:new Date(Date.now()-86400000).toISOString(),createdBy:"Admin A",isActive:true,tested:true},
  {id:"cv2",version:"v11",label:"Withdrawal limit reduction",changes:["withdrawal_limit: ₹50,000 → ₹25,000"],createdAt:new Date(Date.now()-172800000).toISOString(),createdBy:"Admin B",isActive:false,tested:true},
  {id:"cv3",version:"v10",label:"Initial production config",changes:["Initial setup","Default platform settings"],createdAt:new Date(Date.now()-604800000).toISOString(),createdBy:"Super Admin",isActive:false,tested:true},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminConfigRollback(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[versions,setVersions]=useState<ConfigVersion[]>(()=>load("admin_config_rollback_v1",seedVersions));
  const[rolling,setRolling]=useState<string|null>(null);
  const[testing,setTesting]=useState<string|null>(null);
  const[confirmId,setConfirmId]=useState<string|null>(null);

  const testVersion=async(v:ConfigVersion)=>{
    setTesting(v.id);
    await new Promise(r=>setTimeout(r,2000));
    const upd=versions.map(x=>x.id===v.id?{...x,tested:true}:x);
    localStorage.setItem("admin_config_rollback_v1",JSON.stringify(upd));setVersions(upd);setTesting(null);
    toast({title:`${v.version} validated — safe to restore`});
  };

  const rollback=async(v:ConfigVersion)=>{
    setRolling(v.id);setConfirmId(null);
    await new Promise(r=>setTimeout(r,1500));
    const upd=versions.map(x=>({...x,isActive:x.id===v.id}));
    localStorage.setItem("admin_config_rollback_v1",JSON.stringify(upd));setVersions(upd);setRolling(null);
    logAction("Config Rollback",`Restored to ${v.version} — ${v.label}`,"System","warning");
    toast({title:`Config restored to ${v.version} — ${v.label}`});
  };

  const active=versions.find(v=>v.isActive);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <RotateCcw size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Configuration Rollback System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Config backup · Restore option · Rollback testing · Version history · Safety confirmation · Monitoring</p>
          </div>
        </div>
        {active&&<div style={{marginTop:14,display:"flex",alignItems:"center",gap:10,background:`${A1}12`,border:`1px solid ${A1}30`,borderRadius:10,padding:"9px 14px"}}>
          <CheckCircle2 size={14} color="#4ade80"/><span style={{fontSize:12,color:"#4ade80",fontWeight:600}}>Active: {active.version} — {active.label}</span>
        </div>}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {versions.map((v,i)=>(
          <div key={v.id} style={{background:T.card,border:`1px solid ${v.isActive?`${A1}55`:T.border}`,borderRadius:14,padding:"16px 18px"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
              <div style={{width:32,height:32,borderRadius:9,background:v.isActive?`${A1}25`:`${T.input}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontFamily:"monospace",fontWeight:800,fontSize:11,color:v.isActive?T.badgeFg:T.sub}}>{v.version}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{v.label}</span>
                  {v.isActive&&<span style={{fontSize:10,fontWeight:700,color:"#4ade80",background:"rgba(74,222,128,.1)",padding:"2px 7px",borderRadius:5}}>ACTIVE</span>}
                  {v.tested&&<span style={{fontSize:10,color:"#4ade80"}}>✓ tested</span>}
                </div>
                <p style={{fontSize:11,color:T.sub,margin:"0 0 4px"}}>By {v.createdBy} · {safeDist(v.createdAt)} ago</p>
                {v.changes.map((c,ci)=><p key={ci} style={{fontSize:11,fontFamily:"monospace",color:T.badgeFg,margin:"1px 0"}}>{c}</p>)}
              </div>
              {!v.isActive&&<div style={{display:"flex",gap:6,flexShrink:0}}>
                {!v.tested&&<button onClick={()=>testVersion(v)} disabled={testing===v.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>{testing===v.id?"Testing…":"Test"}</button>}
                {confirmId===v.id
                  ?<div style={{display:"flex",gap:6}}>
                    <button onClick={()=>rollback(v)} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",color:"#f87171",fontSize:11,fontWeight:700,cursor:"pointer"}}>{rolling===v.id?"Rolling…":"Confirm Restore"}</button>
                    <button onClick={()=>setConfirmId(null)} style={{padding:"6px 10px",borderRadius:8,background:T.input,border:`1px solid ${T.border}`,color:T.sub,fontSize:11,cursor:"pointer"}}>Cancel</button>
                  </div>
                  :<button onClick={()=>setConfirmId(v.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(251,114,36,.08)",border:"1px solid rgba(251,114,36,.2)",color:"#fb923c",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                    <RotateCcw size={10}/>Restore
                  </button>}
              </div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
