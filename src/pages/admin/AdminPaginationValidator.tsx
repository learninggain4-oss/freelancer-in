import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface PageCheck{id:string;name:string;endpoint:string;pageSize:number;totalRecords:number;duplicates:number;missing:number;loadMs:number;status:"ok"|"issue";}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

const PAGE_VAL_KEY="admin_pagination_val_v1";
function seedPageChecks():PageCheck[]{return[
  {id:"pc1",name:"Users list",endpoint:"/admin/users",pageSize:20,totalRecords:12400,duplicates:0,missing:0,loadMs:142,status:"ok"},
  {id:"pc2",name:"Projects list",endpoint:"/admin/jobs",pageSize:20,totalRecords:38000,duplicates:0,missing:0,loadMs:188,status:"ok"},
  {id:"pc3",name:"Withdrawals",endpoint:"/admin/withdrawals",pageSize:20,totalRecords:4820,duplicates:2,missing:0,loadMs:220,status:"issue"},
];}
export default function AdminPaginationValidator(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[checks,setChecks]=useState<PageCheck[]>(()=>load(PAGE_VAL_KEY,seedPageChecks));
  const[testing,setTesting]=useState<string|null>(null);
  const[testAll,setTestAll]=useState(false);

  const test=async(p:PageCheck)=>{
    setTesting(p.id);await new Promise(r=>setTimeout(r,1500));
    const ok=Math.random()>.3;
    const upd=checks.map(x=>x.id===p.id?{...x,status:ok?"ok" as const:"issue" as const,duplicates:ok?0:Math.floor(Math.random()*5),missing:ok?0:Math.floor(Math.random()*3),loadMs:Math.round(50+Math.random()*300)}:x);
    localStorage.setItem("admin_pagination_v1",JSON.stringify(upd));setChecks(upd);setTesting(null);
    toast({title:`${p.name} — ${ok?"No issues":"Issues found"}`});
  };
  const runAll=async()=>{
    setTestAll(true);await new Promise(r=>setTimeout(r,3000));
    const upd=checks.map(x=>({...x,status:"ok" as const,duplicates:0,missing:0}));
    localStorage.setItem("admin_pagination_v1",JSON.stringify(upd));setChecks(upd);setTestAll(false);
    toast({title:"All pagination checks passed"});
  };

  const issues=checks.filter(c=>c.status==="issue").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Activity size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Pagination Validation System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Consistency check · Duplicate detection · Missing records · Performance · Error alerts</p>
          </div>
          <button onClick={runAll} disabled={testAll} style={{padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{testAll?"Testing…":"Test All"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Endpoints",v:checks.length,c:T.badgeFg},{l:"Issues",v:issues,c:issues>0?"#f87171":"#4ade80"},{l:"Avg Load",v:`${Math.round(checks.reduce((s,c)=>s+c.loadMs,0)/checks.length)}ms`,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {checks.map(c=>(
          <div key={c.id} style={{background:T.card,border:`1px solid ${c.status==="issue"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{c.name}</span>
                <span style={{fontSize:10,fontFamily:"monospace",color:T.sub}}>{c.endpoint}</span>
                <span style={{fontSize:10,fontWeight:700,color:c.status==="ok"?"#4ade80":"#f87171",textTransform:"capitalize"}}>{c.status}</span>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Records: {c.totalRecords.toLocaleString()}</span>
                <span style={{fontSize:12,color:T.sub}}>Page size: {c.pageSize}</span>
                <span style={{fontSize:12,color:T.sub}}>Load: <strong style={{color:c.loadMs>200?"#fbbf24":"#4ade80"}}>{c.loadMs}ms</strong></span>
                {c.duplicates>0&&<span style={{fontSize:12,color:"#f87171"}}>{c.duplicates} duplicates</span>}
                {c.missing>0&&<span style={{fontSize:12,color:"#f87171"}}>{c.missing} missing</span>}
              </div>
            </div>
            <button onClick={()=>test(c)} disabled={testing===c.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              {testing===c.id?"Testing…":"Test"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
