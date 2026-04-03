import { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertTriangle, RefreshCw, Eye, RotateCcw, FileText } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface ImportJob{id:string;fileName:string;target:string;rows:number;valid:number;invalid:number;status:"pending"|"validating"|"ready"|"importing"|"done"|"failed"|"rolled_back";progress:number;createdAt:string;errors:string[];}

const seedJobs=():ImportJob[]=>[
  {id:"ij1",fileName:"freelancers_batch_apr.csv",target:"profiles",rows:420,valid:418,invalid:2,status:"done",progress:100,createdAt:new Date(Date.now()-86400000).toISOString(),errors:["Row 208: invalid email format","Row 319: duplicate phone number"]},
  {id:"ij2",fileName:"jobs_export_q1.json",target:"jobs",rows:1840,valid:1840,invalid:0,status:"ready",progress:0,createdAt:new Date(Date.now()-3600000).toISOString(),errors:[]},
];

function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={pending:"#94a3b8",validating:"#a5b4fc",ready:"#fbbf24",importing:"#6366f1",done:"#4ade80",failed:"#f87171",rolled_back:"#fb923c"};

export default function AdminDataImport(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[jobs,setJobs]=useState<ImportJob[]>(()=>load("admin_data_import_v1",seedJobs));
  const[processing,setProcessing]=useState<string|null>(null);
  const[rolling,setRolling]=useState<string|null>(null);
  const[expandedErrors,setExpandedErrors]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  const importFile=async(j:ImportJob)=>{
    setProcessing(j.id);
    let prog=0;
    const upd=(p:number,st:ImportJob["status"])=>setJobs(prev=>prev.map(x=>x.id===j.id?{...x,progress:p,status:st}:x));
    upd(0,"validating");await new Promise(r=>setTimeout(r,1200));
    upd(30,"importing");await new Promise(r=>setTimeout(r,800));
    upd(65,"importing");await new Promise(r=>setTimeout(r,700));
    upd(100,"done");
    const final=jobs.map(x=>x.id===j.id?{...x,status:"done" as const,progress:100}:x);
    localStorage.setItem("admin_data_import_v1",JSON.stringify(final));setJobs(final);setProcessing(null);
    logAction("Data Import",`${j.fileName} → ${j.target} (${j.rows} rows)`,"System","success");
    toast({title:`${j.fileName} imported successfully — ${j.valid} rows`});
  };

  const rollback=async(j:ImportJob)=>{
    setRolling(j.id);
    await new Promise(r=>setTimeout(r,1500));
    const upd=jobs.map(x=>x.id===j.id?{...x,status:"rolled_back" as const,progress:0}:x);
    localStorage.setItem("admin_data_import_v1",JSON.stringify(upd));setJobs(upd);setRolling(null);
    logAction("Import Rollback",j.fileName,"System","warning");
    toast({title:`${j.fileName} import rolled back`});
  };

  const handleFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];
    if(!f)return;
    const newJob:ImportJob={id:`ij${Date.now()}`,fileName:f.name,target:"pending",rows:Math.floor(200+Math.random()*500),valid:0,invalid:0,status:"pending",progress:0,createdAt:new Date().toISOString(),errors:[]};
    const upd=[...jobs,newJob];
    localStorage.setItem("admin_data_import_v1",JSON.stringify(upd));setJobs(upd);
    toast({title:`${f.name} queued for validation`});
  };

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Upload size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Data Import Validation System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Import preview · Validation rules · Error detection · Retry mechanism · Progress indicator · Rollback</p>
          </div>
          <button onClick={()=>fileRef.current?.click()} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            <Upload size={13}/>Upload File
          </button>
          <input ref={fileRef} type="file" accept=".csv,.json,.xlsx" style={{display:"none"}} onChange={handleFile}/>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Import Jobs",v:jobs.length,c:T.badgeFg},{l:"Completed",v:jobs.filter(j=>j.status==="done").length,c:"#4ade80"},{l:"Ready",v:jobs.filter(j=>j.status==="ready").length,c:"#fbbf24"},{l:"Failed",v:jobs.filter(j=>j.status==="failed").length,c:jobs.some(j=>j.status==="failed")?"#f87171":"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {jobs.map(j=>(
          <div key={j.id} style={{background:T.card,border:`1px solid ${j.status==="failed"?"rgba(248,113,113,.2)":T.border}`,borderRadius:14,padding:"16px 18px"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:j.status==="importing"||j.status==="validating"?10:8}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:T.text}}>{j.fileName}</span>
                  <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5}}>{j.target}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[j.status],background:`${sColor[j.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{j.status.replace("_"," ")}</span>
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:T.sub}}>Rows: {j.rows}</span>
                  {j.valid>0&&<span style={{fontSize:12,color:"#4ade80"}}>{j.valid} valid</span>}
                  {j.invalid>0&&<span style={{fontSize:12,color:"#f87171"}}>{j.invalid} invalid</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                {(j.status==="ready"||j.status==="pending")&&<button onClick={()=>importFile(j)} disabled={processing===j.id} style={{padding:"6px 12px",borderRadius:8,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>{processing===j.id?"Importing…":"Import"}</button>}
                {j.status==="done"&&<button onClick={()=>rollback(j)} disabled={rolling===j.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(251,114,36,.08)",border:"1px solid rgba(251,114,36,.2)",color:"#fb923c",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  <RotateCcw size={10}/>{rolling===j.id?"Rolling…":"Rollback"}
                </button>}
                {j.errors.length>0&&<button onClick={()=>setExpandedErrors(expandedErrors===j.id?null:j.id)} style={{padding:"6px 12px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>{j.errors.length} errors</button>}
              </div>
            </div>
            {(j.status==="importing"||j.status==="validating")&&(
              <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,.07)",overflow:"hidden",marginBottom:4}}>
                <div style={{height:"100%",borderRadius:5,background:`linear-gradient(90deg,${A1},${A2})`,width:`${j.progress}%`,transition:"width .3s ease"}}/>
              </div>
            )}
            {expandedErrors===j.id&&<div style={{marginTop:8,background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.15)",borderRadius:8,padding:"8px 12px"}}>
              {j.errors.map((e,i)=><p key={i} style={{fontSize:11,color:"#f87171",margin:"2px 0"}}>{e}</p>)}
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
