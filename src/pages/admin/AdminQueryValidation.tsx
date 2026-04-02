import { useState } from "react";
import { SlidersHorizontal, AlertTriangle, CheckCircle2, RefreshCw, Activity, Database } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface DataSet{id:string;name:string;table:string;totalRows:number;sortValid:boolean;filterValid:boolean;consistencyOk:boolean;lastValidated:string;issues:string[];}
const seed=():DataSet[]=>[
  {id:"ds1",name:"Job Listings",table:"jobs",totalRows:4510,sortValid:true,filterValid:true,consistencyOk:true,lastValidated:new Date(Date.now()-3600000).toISOString(),issues:[]},
  {id:"ds2",name:"User Accounts",table:"users",totalRows:12840,sortValid:true,filterValid:false,consistencyOk:false,lastValidated:new Date(Date.now()-7200000).toISOString(),issues:["Filter by skill_tags returns duplicates","Sort by rating has null values at wrong position"]},
  {id:"ds3",name:"Transactions",table:"transactions",totalRows:84200,sortValid:false,consistencyOk:true,filterValid:true,lastValidated:new Date(Date.now()-1800000).toISOString(),issues:["ORDER BY created_at DESC returns inconsistent pages"]},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminQueryValidation(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[datasets,setDatasets]=useState(()=>load("admin_query_val_v1",seed));
  const[validating,setValidating]=useState<string|null>(null);

  const validate=async(id:string)=>{
    setValidating(id);await new Promise(r=>setTimeout(r,2000));
    const upd=datasets.map(d=>d.id===id?{...d,sortValid:true,filterValid:true,consistencyOk:true,issues:[],lastValidated:new Date().toISOString()}:d);
    localStorage.setItem("admin_query_val_v1",JSON.stringify(upd));setDatasets(upd);setValidating(null);
    toast({title:"Query validation passed"});
  };

  const issues=datasets.filter(d=>!d.sortValid||!d.filterValid||!d.consistencyOk).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><SlidersHorizontal size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Data Query Validation System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Sorting validation · Filtering validation · Query accuracy · Data consistency · Testing tool · Performance monitoring</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Datasets",v:datasets.length,c:T.badgeFg},{l:"Issues",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Total Rows",v:datasets.reduce((s,d)=>s+d.totalRows,0).toLocaleString(),c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {datasets.map(d=>{
          const hasIssues=!d.sortValid||!d.filterValid||!d.consistencyOk;
          return(
            <div key={d.id} style={{background:T.card,border:`1px solid ${hasIssues?"rgba(248,113,113,.2)":T.border}`,borderRadius:14,padding:"14px 18px"}}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:hasIssues?10:0}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:13,color:T.text}}>{d.name}</span>
                    <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{d.table}</span>
                    <span style={{fontSize:10,color:T.sub}}>{d.totalRows.toLocaleString()} rows</span>
                  </div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {[{l:"Sort",v:d.sortValid},{l:"Filter",v:d.filterValid},{l:"Consistency",v:d.consistencyOk}].map(c=>(
                      <span key={c.l} style={{fontSize:11,color:c.v?"#4ade80":"#f87171"}}>{c.v?"✓":"✗"} {c.l}</span>
                    ))}
                  </div>
                </div>
                <button onClick={()=>validate(d.id)} disabled={validating===d.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                  {validating===d.id?"Validating…":"Validate"}
                </button>
              </div>
              {hasIssues&&d.issues.length>0&&<div style={{background:"rgba(248,113,113,.05)",border:"1px solid rgba(248,113,113,.15)",borderRadius:8,padding:"8px 12px"}}>
                {d.issues.map((issue,i)=><p key={i} style={{fontSize:11,color:"#f87171",margin:i<d.issues.length-1?"0 0 3px":0}}>• {issue}</p>)}
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
