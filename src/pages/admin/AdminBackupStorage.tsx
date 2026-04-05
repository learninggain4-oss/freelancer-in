import { useState } from "react";
import { Database, AlertTriangle, CheckCircle2, RefreshCw, HardDrive, Shield } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface BackupSet{id:string;name:string;usedGB:number;limitGB:number;retentionDays:number;lastBackup:string;status:"ok"|"warning"|"paused";autoPause:boolean;}
const seed=():BackupSet[]=>[
  {id:"bs1",name:"Database Backups",usedGB:38.4,limitGB:50,retentionDays:30,lastBackup:new Date(Date.now()-3600000).toISOString(),status:"warning",autoPause:true},
  {id:"bs2",name:"Media Files Backup",usedGB:18.2,limitGB:100,retentionDays:90,lastBackup:new Date(Date.now()-86400000).toISOString(),status:"ok",autoPause:true},
  {id:"bs3",name:"Config Backups",usedGB:0.8,limitGB:5,retentionDays:365,lastBackup:new Date(Date.now()-1800000).toISOString(),status:"ok",autoPause:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={ok:"#4ade80",warning:"#fbbf24",paused:"#94a3b8"};

export default function AdminBackupStorage(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[sets,setSets]=useState(()=>load("admin_backup_storage_v1",seed));
  const[cleaning,setCleaning]=useState<string|null>(null);

  const cleanup=async(b:BackupSet)=>{
    setCleaning(b.id);await new Promise(r=>setTimeout(r,2000));
    const freed=b.usedGB*0.35;
    const upd=sets.map(x=>x.id===b.id?{...x,usedGB:Math.max(0,x.usedGB-freed),status:"ok" as const}:x);
    localStorage.setItem("admin_backup_storage_v1",JSON.stringify(upd));setSets(upd);setCleaning(null);
    toast({title:`${b.name} — ${freed.toFixed(1)} GB freed`});
  };
  const updateRetention=(id:string,days:number)=>{
    const upd=sets.map(b=>b.id===id?{...b,retentionDays:days}:b);
    localStorage.setItem("admin_backup_storage_v1",JSON.stringify(upd));setSets(upd);
    toast({title:"Retention policy updated"});
  };
  const toggleAutoPause=(id:string)=>{
    const upd=sets.map(b=>b.id===id?{...b,autoPause:!b.autoPause}:b);
    localStorage.setItem("admin_backup_storage_v1",JSON.stringify(upd));setSets(upd);
    toast({title:"Auto-pause setting updated"});
  };

  const warnings=sets.filter(s=>s.status==="warning").length;
  const totalUsed=sets.reduce((s,b)=>s+b.usedGB,0);
  const totalLimit=sets.reduce((s,b)=>s+b.limitGB,0);

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Database size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Backup Storage Monitoring</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Usage monitoring · Capacity alerts · Auto-cleanup · Retention policy · Health monitoring · Forecasting</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Total Used",v:`${totalUsed.toFixed(1)} GB`,c:totalUsed/totalLimit>.8?"#f87171":T.badgeFg},{l:"Total Limit",v:`${totalLimit} GB`,c:T.badgeFg},{l:"Warnings",v:warnings,c:warnings>0?"#fbbf24":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sets.map(b=>{
          const pct=Math.round((b.usedGB/b.limitGB)*100);
          const forecastDays=Math.round((b.limitGB-b.usedGB)/(b.usedGB/30));
          return(
            <div key={b.id} style={{background:T.card,border:`1px solid ${b.status!=="ok"?`${sColor[b.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:13,color:T.text}}>{b.name}</span>
                    <span style={{fontSize:10,fontWeight:700,color:sColor[b.status],textTransform:"capitalize"}}>{b.status}</span>
                    {b.autoPause&&<span style={{fontSize:10,color:"#4ade80"}}>Auto-pause ON</span>}
                  </div>
                  <div style={{marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:T.sub}}>{b.usedGB.toFixed(1)} / {b.limitGB} GB ({pct}%)</span>
                      <span style={{fontSize:11,color:T.sub}}>~{forecastDays}d until full</span>
                    </div>
                    <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,.07)"}}>
                      <div style={{height:"100%",borderRadius:5,background:sColor[b.status],width:`${pct}%`}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:T.sub}}>Retention:</span>
                    <input type="number" defaultValue={b.retentionDays} onBlur={e=>updateRetention(b.id,+e.target.value)} style={{width:60,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"3px 8px",fontSize:12}}/>
                    <span style={{fontSize:12,color:T.sub}}>days · Last: {safeDist(b.lastBackup)} ago</span>
                    <button onClick={()=>toggleAutoPause(b.id)} style={{padding:"3px 10px",borderRadius:6,background:b.autoPause?`${A1}15`:"rgba(148,163,184,.1)",border:`1px solid ${b.autoPause?A1:T.border}`,color:b.autoPause?T.badgeFg:T.sub,fontSize:11,cursor:"pointer"}}>Auto-pause</button>
                  </div>
                </div>
                <button onClick={()=>cleanup(b)} disabled={cleaning===b.id} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                  {cleaning===b.id?"Cleaning…":"Cleanup"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
