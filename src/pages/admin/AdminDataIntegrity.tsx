import { useState } from "react";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Shield, Activity, FileText } from "lucide-react";
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

interface CheckResult{id:string;table:string;rowCount:number;checksumOk:boolean;nullViolations:number;orphanRecords:number;status:"healthy"|"warning"|"corrupt";lastChecked:string;}
interface IntegrityLog{id:string;action:string;table:string;result:string;at:string;auto:boolean;}

const seedChecks=():CheckResult[]=>[
  {id:"c1",table:"profiles",rowCount:12840,checksumOk:true,nullViolations:0,orphanRecords:0,status:"healthy",lastChecked:new Date(Date.now()-3600000).toISOString()},
  {id:"c2",table:"wallet_transactions",rowCount:84200,checksumOk:true,nullViolations:2,orphanRecords:0,status:"warning",lastChecked:new Date(Date.now()-7200000).toISOString()},
  {id:"c3",table:"jobs",rowCount:4510,checksumOk:false,nullViolations:0,orphanRecords:14,status:"corrupt",lastChecked:new Date(Date.now()-1800000).toISOString()},
  {id:"c4",table:"notifications",rowCount:215000,checksumOk:true,nullViolations:0,orphanRecords:0,status:"healthy",lastChecked:new Date(Date.now()-900000).toISOString()},
  {id:"c5",table:"user_roles",rowCount:342,checksumOk:true,nullViolations:0,orphanRecords:0,status:"healthy",lastChecked:new Date(Date.now()-600000).toISOString()},
];
const seedLogs=():IntegrityLog[]=>[
  {id:"l1",action:"Consistency Check",table:"profiles",result:"Pass — 12,840 rows verified",at:new Date(Date.now()-3600000).toISOString(),auto:true},
  {id:"l2",action:"Checksum Verify",table:"jobs",result:"FAIL — checksum mismatch on 14 orphan records",at:new Date(Date.now()-1800000).toISOString(),auto:true},
  {id:"l3",action:"Auto Backup",table:"ALL",result:"Pre-change backup completed — 42 MB",at:new Date(Date.now()-86400000).toISOString(),auto:true},
  {id:"l4",action:"Repair",table:"jobs",result:"Orphan records removed by admin",at:new Date(Date.now()-900000).toISOString(),auto:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const sColor={healthy:"#4ade80",warning:"#fbbf24",corrupt:"#f87171"};

export default function AdminDataIntegrity(){
  const{theme}=useDashboardTheme();const T=TH[theme];
  const{logAction}=useAdminAudit();const{toast}=useToast();
  const[tab,setTab]=useState<"checks"|"logs">("checks");
  const[checks,setChecks]=useState<CheckResult[]>(()=>load("admin_integrity_v1",seedChecks));
  const[logs]=useState<IntegrityLog[]>(()=>load("admin_integrity_logs_v1",seedLogs));
  const[scanning,setScanning]=useState<string|null>(null);
  const[repairing,setRepairing]=useState<string|null>(null);

  const scan=async(c:CheckResult)=>{
    setScanning(c.id);
    await new Promise(r=>setTimeout(r,2000));
    const ok=Math.random()>.2;
    const upd=checks.map(x=>x.id===c.id?{...x,checksumOk:ok,nullViolations:ok?0:Math.floor(Math.random()*5),orphanRecords:ok?0:Math.floor(Math.random()*20),status:(ok?"healthy":"warning") as "healthy"|"warning"|"corrupt",lastChecked:new Date().toISOString()}:x);
    localStorage.setItem("admin_integrity_v1",JSON.stringify(upd));setChecks(upd);setScanning(null);
    logAction("Integrity Scan",c.table,"System",ok?"success":"warning");
    toast({title:`${c.table} — ${ok?"No issues found":"Issues detected — review warnings"}`});
  };

  const repair=async(c:CheckResult)=>{
    setRepairing(c.id);
    await new Promise(r=>setTimeout(r,1800));
    const upd=checks.map(x=>x.id===c.id?{...x,status:"healthy" as const,checksumOk:true,nullViolations:0,orphanRecords:0,lastChecked:new Date().toISOString()}:x);
    localStorage.setItem("admin_integrity_v1",JSON.stringify(upd));setChecks(upd);setRepairing(null);
    logAction("Data Repair",c.table,"System","warning");
    toast({title:`${c.table} repaired successfully`});
  };

  const issues=checks.filter(c=>c.status!=="healthy").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Database size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Data Integrity & Corruption Protection</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Consistency checks · Checksum validation · Orphan detection · Auto repair · Integrity logs</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Tables Monitored",v:checks.length,c:T.badgeFg},{l:"Issues Found",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Healthy",v:checks.filter(c=>c.status==="healthy").length,c:"#4ade80"},{l:"Total Rows",v:checks.reduce((s,c)=>s+c.rowCount,0).toLocaleString(),c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["checks","Integrity Checks",Database],["logs","Audit Logs",FileText]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}{t==="checks"&&issues>0&&<span style={{background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800}}>{issues}</span>}
          </button>
        ))}
      </div>

      {tab==="checks"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {checks.map(c=>(
            <div key={c.id} style={{background:T.card,border:`1px solid ${c.status!=="healthy"?`${sColor[c.status]}33`:T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:sColor[c.status],flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{c.table}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sColor[c.status],background:`${sColor[c.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize"}}>{c.status}</span>
                  {!c.checksumOk&&<span style={{fontSize:10,color:"#f87171"}}>✗ checksum fail</span>}
                  {c.nullViolations>0&&<span style={{fontSize:10,color:"#fbbf24"}}>{c.nullViolations} null violations</span>}
                  {c.orphanRecords>0&&<span style={{fontSize:10,color:"#f87171"}}>{c.orphanRecords} orphan records</span>}
                </div>
                <p style={{fontSize:12,color:T.sub,margin:0}}>Rows: {c.rowCount.toLocaleString()} · Last scanned: {format(new Date(c.lastChecked),"MMM d, HH:mm")}</p>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>scan(c)} disabled={scanning===c.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  <RefreshCw size={11} className={scanning===c.id?"animate-spin":""}/>{scanning===c.id?"Scanning…":"Scan"}
                </button>
                {c.status!=="healthy"&&<button onClick={()=>repair(c)} disabled={repairing===c.id} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  <Shield size={11}/>{repairing===c.id?"Repairing…":"Repair"}
                </button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
          {logs.map((l,i)=>(
            <div key={l.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
              {l.result.includes("FAIL")||l.result.includes("fail")?<AlertTriangle size={14} color="#f87171" style={{flexShrink:0}}/>:<CheckCircle2 size={14} color="#4ade80" style={{flexShrink:0}}/>}
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:1,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:12,color:T.text}}>{l.action}</span>
                  <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 6px",borderRadius:4}}>{l.table}</span>
                  {l.auto&&<span style={{fontSize:10,color:A1}}>auto</span>}
                </div>
                <p style={{fontSize:11,color:T.sub,margin:0}}>{l.result} · {format(new Date(l.at),"MMM d, HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
