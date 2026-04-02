import { useState } from "react";
import { HardDrive, AlertTriangle, CheckCircle2, Trash2, Upload, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface StorageBucket{id:string;name:string;usedGB:number;limitGB:number;files:number;maxFileMB:number;retentionDays:number;status:"ok"|"warning"|"full";}
const seed=():StorageBucket[]=>[
  {id:"b1",name:"User Avatars",usedGB:4.2,limitGB:10,files:12840,maxFileMB:5,retentionDays:365,status:"ok"},
  {id:"b2",name:"Job Attachments",usedGB:18.6,limitGB:20,files:4510,maxFileMB:50,retentionDays:180,status:"warning"},
  {id:"b3",name:"KYC Documents",usedGB:9.8,limitGB:10,files:6200,maxFileMB:20,retentionDays:1825,status:"warning"},
  {id:"b4",name:"Invoice PDFs",usedGB:2.1,limitGB:50,files:84200,maxFileMB:2,retentionDays:2555,status:"ok"},
  {id:"b5",name:"Backups",usedGB:44.8,limitGB:50,files:124,maxFileMB:5120,retentionDays:90,status:"warning"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={ok:"#4ade80",warning:"#fbbf24",full:"#f87171"};

export default function AdminStorageManager(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[buckets,setBuckets]=useState(()=>load("admin_storage_v1",seed));
  const[cleaning,setCleaning]=useState<string|null>(null);

  const cleanup=async(b:StorageBucket)=>{
    setCleaning(b.id);await new Promise(r=>setTimeout(r,1800));
    const freed=b.usedGB*.3;
    const upd=buckets.map(x=>x.id===b.id?{...x,usedGB:Math.max(0,x.usedGB-freed),status:(x.usedGB-freed)/x.limitGB<.7?"ok" as const:"warning" as const}:x);
    localStorage.setItem("admin_storage_v1",JSON.stringify(upd));setBuckets(upd);setCleaning(null);
    toast({title:`${b.name} — ${freed.toFixed(1)} GB freed`});
  };
  const saveLimit=(id:string,val:number)=>{
    const upd=buckets.map(b=>b.id===id?{...b,maxFileMB:val}:b);
    localStorage.setItem("admin_storage_v1",JSON.stringify(upd));setBuckets(upd);
    toast({title:"File size limit updated"});
  };

  const totalUsed=buckets.reduce((s,b)=>s+b.usedGB,0);
  const totalLimit=buckets.reduce((s,b)=>s+b.limitGB,0);
  const warnings=buckets.filter(b=>b.status!=="ok").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><HardDrive size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Storage Management System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Usage monitoring · Limit config · Usage alerts · Auto cleanup · File size limits · Retention policy</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Total Used",v:`${totalUsed.toFixed(1)} GB`,c:totalUsed/totalLimit>.8?"#f87171":T.badgeFg},{l:"Total Limit",v:`${totalLimit} GB`,c:T.badgeFg},{l:"Warnings",v:warnings,c:warnings>0?"#fbbf24":"#4ade80"},{l:"Total Files",v:buckets.reduce((s,b)=>s+b.files,0).toLocaleString(),c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {buckets.map(b=>{
          const pct=Math.round((b.usedGB/b.limitGB)*100);
          return(
            <div key={b.id} style={{background:T.card,border:`1px solid ${b.status!=="ok"?`${sColor[b.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:13,color:T.text}}>{b.name}</span>
                    <span style={{fontSize:10,fontWeight:700,color:sColor[b.status],textTransform:"capitalize"}}>{b.status}</span>
                    <span style={{fontSize:10,color:T.sub}}>Max: {b.maxFileMB} MB/file</span>
                    <span style={{fontSize:10,color:T.sub}}>Retain: {b.retentionDays}d</span>
                  </div>
                  <div style={{marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:T.sub}}>{b.usedGB.toFixed(1)} / {b.limitGB} GB ({pct}%)</span>
                      <span style={{fontSize:11,color:T.sub}}>{b.files.toLocaleString()} files</span>
                    </div>
                    <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,.07)"}}>
                      <div style={{height:"100%",borderRadius:5,background:sColor[b.status],width:`${pct}%`,transition:"width .5s"}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,color:T.sub}}>File limit (MB):</span>
                    <input type="number" defaultValue={b.maxFileMB} onBlur={e=>saveLimit(b.id,+e.target.value)} style={{width:70,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"3px 8px",fontSize:12}}/>
                  </div>
                </div>
                <button onClick={()=>cleanup(b)} disabled={cleaning===b.id} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                  {cleaning===b.id?"Cleaning…":"Auto Cleanup"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
