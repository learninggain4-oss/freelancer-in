import { useState } from "react";
import { GitPullRequest, AlertTriangle, CheckCircle2, RefreshCw, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Module{id:string;name:string;version:string;deps:string[];reverseDeps:string[];issues:string[];healthy:boolean;}
const seed=():Module[]=>[
  {id:"m1",name:"Wallet Service",version:"v2.4",deps:["Payment Gateway","KYC Service","Notification Service"],reverseDeps:["Job Module","Freelancer Dashboard"],issues:[],healthy:true},
  {id:"m2",name:"Job Module",version:"v3.1",deps:["Wallet Service","User Auth","Search Service"],reverseDeps:["Freelancer Dashboard","Admin Panel"],issues:["Search Service v2.1 missing feature used in Job Module"],healthy:false},
  {id:"m3",name:"User Auth",version:"v1.8",deps:["Session Storage","Email Service"],reverseDeps:["All modules"],issues:[],healthy:true},
  {id:"m4",name:"Search Service",version:"v2.1",deps:[],reverseDeps:["Job Module","User Search"],issues:["Missing full-text search index"],healthy:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminModuleDependency(){
  const{theme,themeKey}=useDashboardTheme();const T=TH[themeKey];const{toast}=useToast();
  const[modules,setModules]=useState(()=>load("admin_module_dep_v1",seed));
  const[scanning,setScanning]=useState(false);

  const scan=async()=>{
    setScanning(true);await new Promise(r=>setTimeout(r,2000));
    const upd=modules.map(m=>({...m,issues:[],healthy:true}));
    localStorage.setItem("admin_module_dep_v1",JSON.stringify(upd));setModules(upd);setScanning(false);
    toast({title:"Module dependency scan complete"});
  };

  const unhealthy=modules.filter(m=>!m.healthy).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><GitPullRequest size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Module Dependency Tracking</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Impact analysis · Service dependency map · Health monitoring · Version compatibility · Dependency alerts</p>
          </div>
          <button onClick={scan} disabled={scanning} style={{padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{scanning?"Scanning…":"Scan All"}</button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Modules",v:modules.length,c:T.badgeFg},{l:"Unhealthy",v:unhealthy,c:unhealthy>0?"#f87171":"#4ade80"},{l:"Total Issues",v:modules.reduce((s,m)=>s+m.issues.length,0),c:"#fbbf24"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {modules.map(m=>(
          <div key={m.id} style={{background:T.card,border:`1px solid ${!m.healthy?"rgba(248,113,113,.2)":T.border}`,borderRadius:14,padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:T.text}}>{m.name}</span>
              <span style={{fontSize:10,color:T.sub}}>{m.version}</span>
              <span style={{fontSize:10,fontWeight:700,color:m.healthy?"#4ade80":"#f87171"}}>{m.healthy?"Healthy":"Issues Found"}</span>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:m.issues.length>0?8:0}}>
              {m.deps.length>0&&<div><p style={{fontSize:10,color:T.sub,margin:"0 0 3px"}}>Depends on:</p><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{m.deps.map(d=><span key={d} style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 6px",borderRadius:4}}>{d}</span>)}</div></div>}
            </div>
            {m.issues.length>0&&<div style={{background:"rgba(248,113,113,.05)",border:"1px solid rgba(248,113,113,.15)",borderRadius:8,padding:"8px 12px"}}>
              {m.issues.map((issue,i)=><p key={i} style={{fontSize:11,color:"#f87171",margin:i<m.issues.length-1?"0 0 3px":0}}>• {issue}</p>)}
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
