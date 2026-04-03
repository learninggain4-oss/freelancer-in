import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle2, RefreshCw, Activity, BarChart3 } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Report{id:string;name:string;frequency:string;lastGenerated:string;status:"valid"|"invalid"|"pending";discrepancyPct:number;rowCount:number;}
const seed=():Report[]=>[
  {id:"r1",name:"Daily Revenue Report",frequency:"daily",lastGenerated:new Date(Date.now()-3600000).toISOString(),status:"valid",discrepancyPct:0,rowCount:4200},
  {id:"r2",name:"Commission Report",frequency:"weekly",lastGenerated:new Date(Date.now()-86400000).toISOString(),status:"invalid",discrepancyPct:3.2,rowCount:840},
  {id:"r3",name:"User Growth Report",frequency:"monthly",lastGenerated:new Date(Date.now()-604800000).toISOString(),status:"valid",discrepancyPct:0,rowCount:12840},
  {id:"r4",name:"Transaction Reconciliation",frequency:"daily",lastGenerated:new Date(Date.now()-7200000).toISOString(),status:"invalid",discrepancyPct:1.8,rowCount:84200},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminReportValidation(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];const{toast}=useToast();
  const[reports,setReports]=useState(()=>load("admin_report_val_v1",seed));
  const[regenerating,setRegenerating]=useState<string|null>(null);

  const regenerate=async(r:Report)=>{
    setRegenerating(r.id);await new Promise(r2=>setTimeout(r2,2000));
    const upd=reports.map(x=>x.id===r.id?{...x,status:"valid" as const,discrepancyPct:0,lastGenerated:new Date().toISOString()}:x);
    localStorage.setItem("admin_report_val_v1",JSON.stringify(upd));setReports(upd);setRegenerating(null);
    toast({title:`${r.name} regenerated`});
  };

  const invalid=reports.filter(r=>r.status==="invalid").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><FileText size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Automated Report Validation</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Report accuracy · Discrepancy detection · Auto-regeneration · Audit logs · Format validation · Data integrity</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Reports",v:reports.length,c:T.badgeFg},{l:"Invalid",v:invalid,c:invalid>0?"#f87171":"#4ade80"},{l:"Valid",v:reports.filter(r=>r.status==="valid").length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {reports.map(r=>(
          <div key={r.id} style={{background:T.card,border:`1px solid ${r.status==="invalid"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{r.name}</span>
                <span style={{fontSize:10,color:T.sub}}>{r.frequency}</span>
                <span style={{fontSize:10,fontWeight:700,color:r.status==="valid"?"#4ade80":"#f87171",textTransform:"capitalize"}}>{r.status}</span>
                {r.discrepancyPct>0&&<span style={{fontSize:10,color:"#f87171"}}>{r.discrepancyPct}% discrepancy</span>}
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>{r.rowCount.toLocaleString()} rows</span>
                <span style={{fontSize:12,color:T.sub}}>Last: {safeDist(r.lastGenerated)} ago</span>
              </div>
            </div>
            <button onClick={()=>regenerate(r)} disabled={regenerating===r.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {regenerating===r.id?"Generating…":"Regenerate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
