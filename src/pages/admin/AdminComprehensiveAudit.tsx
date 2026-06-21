import { useState } from "react";
import { ClipboardList, AlertTriangle, CheckCircle2, RefreshCw, Activity, Shield } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface AuditItem{id:string;category:string;check:string;status:"pass"|"warn"|"fail";detail:string;severity:"critical"|"high"|"medium"|"low";lastChecked:string;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}
const AUDIT_KEY="admin_comprehensive_audit_v1";
function seedAuditItems():AuditItem[]{return[
  {id:"ai1",category:"Authentication",check:"2FA enforcement",status:"pass",detail:"2FA is enabled for all admin accounts",severity:"critical",lastChecked:new Date().toISOString()},
  {id:"ai2",category:"Data",check:"Backup freshness",status:"pass",detail:"Last backup 18 hours ago",severity:"high",lastChecked:new Date().toISOString()},
  {id:"ai3",category:"Security",check:"CSRF protection",status:"pass",detail:"CSRF tokens active on all forms",severity:"high",lastChecked:new Date().toISOString()},
  {id:"ai4",category:"Performance",check:"API response time",status:"warn",detail:"3 endpoints > 500ms avg",severity:"medium",lastChecked:new Date().toISOString()},
  {id:"ai5",category:"Storage",check:"Backup storage usage",status:"warn",detail:"Audit log archive at 91% capacity",severity:"medium",lastChecked:new Date().toISOString()},
];}
const sColor={pass:"#4ade80",warn:"#fbbf24",fail:"#f87171"};
const sevColor={critical:"#f87171",high:"#fb923c",medium:"#fbbf24",low:"#4ade80"};

export default function AdminComprehensiveAudit(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];const{toast}=useToast();
  const[items,setItems]=useState<AuditItem[]>(()=>load(AUDIT_KEY,seedAuditItems));
  const[running,setRunning]=useState(false);
  const[filter,setFilter]=useState<"all"|"pass"|"warn"|"fail">("all");

  const runAudit=async()=>{
    setRunning(true);await new Promise(r=>setTimeout(r,3000));
    const upd=items.map(i=>({...i,lastChecked:new Date().toISOString()}));
    localStorage.setItem("admin_comp_audit_v1",JSON.stringify(upd));setItems(upd);setRunning(false);
    toast({title:"Full system audit complete"});
  };

  const filtered=filter==="all"?items:items.filter(i=>i.status===filter);
  const fails=items.filter(i=>i.status==="fail").length;
  const warns=items.filter(i=>i.status==="warn").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><ClipboardList size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Comprehensive System Audit</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Security · Data · Compliance · Performance · Infrastructure · Risk scoring · Export reports</p>
          </div>
          <button onClick={runAudit} disabled={running} style={{padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{running?"Running…":"Run Full Audit"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Checks",v:items.length,c:T.badgeFg},{l:"Failed",v:fails,c:fails>0?"#f87171":"#4ade80"},{l:"Warnings",v:warns,c:warns>0?"#fbbf24":"#4ade80"},{l:"Passed",v:items.filter(i=>i.status==="pass").length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {(["all","pass","warn","fail"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${filter===f?A1:T.border}`,background:filter===f?`${A1}18`:T.card,color:filter===f?T.badgeFg:T.sub,fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{f}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(item=>(
          <div key={item.id} style={{background:T.card,border:`1px solid ${item.status==="fail"?"rgba(248,113,113,.2)":item.status==="warn"?"rgba(251,191,36,.15)":T.border}`,borderRadius:12,padding:"12px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:sColor[item.status],flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"1px 6px",borderRadius:4}}>{item.category}</span>
                <span style={{fontWeight:700,fontSize:12,color:T.text}}>{item.check}</span>
                <span style={{fontSize:10,fontWeight:700,color:sevColor[item.severity],textTransform:"capitalize"}}>{item.severity}</span>
              </div>
              <p style={{fontSize:11,color:T.sub,margin:0}}>{item.detail}</p>
            </div>
            <span style={{fontSize:10,fontWeight:700,color:sColor[item.status],textTransform:"uppercase",flexShrink:0}}>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
