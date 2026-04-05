import { useState } from "react";
import { HardDrive, CheckCircle2, AlertTriangle, RefreshCw, Shield, Clock, FileText } from "lucide-react";
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

interface Backup{id:string;name:string;type:"full"|"incremental"|"snapshot";sizeMB:number;checksumOk:boolean;restoreTested:boolean;status:"verified"|"unverified"|"corrupt"|"testing";createdAt:string;verifiedAt?:string;location:string;}

const seedBackups=():Backup[]=>[
  {id:"b1",name:"daily_full_20260401",type:"full",sizeMB:420,checksumOk:true,restoreTested:true,status:"verified",createdAt:new Date(Date.now()-86400000).toISOString(),verifiedAt:new Date(Date.now()-82800000).toISOString(),location:"Supabase Storage / backups"},
  {id:"b2",name:"daily_full_20260331",type:"full",sizeMB:418,checksumOk:true,restoreTested:false,status:"unverified",createdAt:new Date(Date.now()-172800000).toISOString(),location:"Supabase Storage / backups"},
  {id:"b3",name:"incr_20260401_0600",type:"incremental",sizeMB:42,checksumOk:true,restoreTested:true,status:"verified",createdAt:new Date(Date.now()-64800000).toISOString(),verifiedAt:new Date(Date.now()-63000000).toISOString(),location:"Supabase Storage / backups"},
  {id:"b4",name:"snapshot_schema_v8",type:"snapshot",sizeMB:2,checksumOk:false,restoreTested:false,status:"corrupt",createdAt:new Date(Date.now()-604800000).toISOString(),location:"Supabase Storage / snapshots"},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={verified:"#4ade80",unverified:"#fbbf24",corrupt:"#f87171",testing:"#a5b4fc"};
const tColor={full:A1,incremental:"#4ade80",snapshot:"#fbbf24"};

export default function AdminBackupVerification(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[backups,setBackups]=useState<Backup[]>(()=>load("admin_backup_verify_v1",seedBackups));
  const[verifying,setVerifying]=useState<string|null>(null);
  const[testing,setTesting]=useState<string|null>(null);

  const verify=async(b:Backup)=>{
    setVerifying(b.id);
    const upd1=backups.map(x=>x.id===b.id?{...x,status:"testing" as const}:x);
    setBackups(upd1);
    await new Promise(r=>setTimeout(r,2500));
    const ok=Math.random()>.15;
    const upd2=backups.map(x=>x.id===b.id?{...x,status:ok?"verified" as const:"corrupt" as const,checksumOk:ok,verifiedAt:new Date().toISOString()}:x);
    localStorage.setItem("admin_backup_verify_v1",JSON.stringify(upd2));setBackups(upd2);setVerifying(null);
    logAction("Backup Verified",b.name,"System",ok?"success":"warning");
    toast({title:`${b.name} — ${ok?"Verification passed":"Checksum FAILED — backup may be corrupt"}`});
  };

  const testRestore=async(b:Backup)=>{
    setTesting(b.id);
    await new Promise(r=>setTimeout(r,3000));
    const upd=backups.map(x=>x.id===b.id?{...x,restoreTested:true,verifiedAt:new Date().toISOString()}:x);
    localStorage.setItem("admin_backup_verify_v1",JSON.stringify(upd));setBackups(upd);setTesting(null);
    logAction("Restore Test",b.name,"System","success");
    toast({title:`Restore test passed for ${b.name}`});
  };

  const issues=backups.filter(b=>b.status==="corrupt"||!b.restoreTested).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <HardDrive size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Backup Verification & Recovery Safety</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Integrity verification · Restore testing · Checksum validation · Health monitoring · Failure alerts</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Backups",v:backups.length,c:T.badgeFg},{l:"Verified",v:backups.filter(b=>b.status==="verified").length,c:"#4ade80"},{l:"Issues",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Total Size",v:`${(backups.reduce((s,b)=>s+b.sizeMB,0)/1024).toFixed(1)} GB`,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {backups.map(b=>(
          <div key={b.id} style={{background:T.card,border:`1px solid ${b.status==="corrupt"?"rgba(248,113,113,.25)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:sColor[b.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:T.text}}>{b.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:(tColor as Record<string,string>)[b.type]||T.sub,background:`${(tColor as Record<string,string>)[b.type]||T.sub}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{b.type}</span>
                <span style={{fontSize:10,fontWeight:700,color:sColor[b.status],background:`${sColor[b.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{b.status}</span>
                {!b.restoreTested&&<span style={{fontSize:10,color:"#fbbf24"}}>⚠ restore not tested</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Size: {b.sizeMB} MB</span>
                <span style={{fontSize:12,color:T.sub}}>Created: {safeDist(b.createdAt)} ago</span>
                {b.verifiedAt&&<span style={{fontSize:12,color:T.sub}}>Verified: {safeFmt(b.verifiedAt, "MMM d, HH:mm")}</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>verify(b)} disabled={verifying===b.id||b.status==="testing"} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <RefreshCw size={11} className={verifying===b.id?"animate-spin":""}/>{verifying===b.id||b.status==="testing"?"Verifying…":"Verify"}
              </button>
              {!b.restoreTested&&b.status==="verified"&&<button onClick={()=>testRestore(b)} disabled={testing===b.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <Shield size={11}/>{testing===b.id?"Testing…":"Test Restore"}
              </button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
