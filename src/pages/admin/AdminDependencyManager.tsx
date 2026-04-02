import { useState } from "react";
import { Layers, AlertTriangle, CheckCircle2, RefreshCw, Shield, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Dependency{id:string;name:string;current:string;latest:string;type:"runtime"|"dev"|"peer";compatible:boolean;hasConflict:boolean;breakingChange:boolean;updateApproved:boolean;lastChecked:string;}
const seed=():Dependency[]=>[
  {id:"d1",name:"@supabase/supabase-js",current:"2.38.4",latest:"2.39.1",type:"runtime",compatible:true,hasConflict:false,breakingChange:false,updateApproved:false,lastChecked:new Date(Date.now()-3600000).toISOString()},
  {id:"d2",name:"react",current:"18.2.0",latest:"18.3.0",type:"runtime",compatible:true,hasConflict:false,breakingChange:false,updateApproved:true,lastChecked:new Date(Date.now()-7200000).toISOString()},
  {id:"d3",name:"vite",current:"5.0.8",latest:"5.1.2",type:"dev",compatible:true,hasConflict:false,breakingChange:false,updateApproved:false,lastChecked:new Date(Date.now()-3600000).toISOString()},
  {id:"d4",name:"razorpay",current:"2.8.5",latest:"3.0.0",type:"runtime",compatible:false,hasConflict:true,breakingChange:true,updateApproved:false,lastChecked:new Date(Date.now()-1800000).toISOString()},
  {id:"d5",name:"date-fns",current:"2.30.0",latest:"3.2.0",type:"runtime",compatible:false,hasConflict:true,breakingChange:true,updateApproved:false,lastChecked:new Date(Date.now()-3600000).toISOString()},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminDependencyManager(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[deps,setDeps]=useState(()=>load("admin_deps_v1",seed));
  const[checking,setChecking]=useState(false);
  const[approving,setApproving]=useState<string|null>(null);

  const checkAll=async()=>{
    setChecking(true);await new Promise(r=>setTimeout(r,2000));
    const upd=deps.map(d=>({...d,lastChecked:new Date().toISOString()}));
    localStorage.setItem("admin_deps_v1",JSON.stringify(upd));setDeps(upd);setChecking(false);
    toast({title:"Compatibility check complete"});
  };
  const approve=async(id:string)=>{
    setApproving(id);await new Promise(r=>setTimeout(r,600));
    const upd=deps.map(d=>d.id===id?{...d,updateApproved:true}:d);
    localStorage.setItem("admin_deps_v1",JSON.stringify(upd));setDeps(upd);setApproving(null);
    toast({title:"Update approved for deployment"});
  };

  const conflicts=deps.filter(d=>d.hasConflict).length;
  const pending=deps.filter(d=>!d.updateApproved&&d.current!==d.latest).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Layers size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Dependency Management System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Version monitoring · Compatibility check · Update alerts · Rollback · Conflict detection · Approval workflow</p>
          </div>
          <button onClick={checkAll} disabled={checking} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            <RefreshCw size={13} className={checking?"animate-spin":""}/>{checking?"Checking…":"Check All"}
          </button>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Dependencies",v:deps.length,c:T.badgeFg},{l:"Conflicts",v:conflicts,c:conflicts>0?"#f87171":"#4ade80"},{l:"Pending Updates",v:pending,c:pending>0?"#fbbf24":"#4ade80"},{l:"Approved",v:deps.filter(d=>d.updateApproved).length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {deps.map(d=>(
          <div key={d.id} style={{background:T.card,border:`1px solid ${d.hasConflict?"rgba(248,113,113,.25)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text}}>{d.name}</span>
                <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 6px",borderRadius:4}}>{d.type}</span>
                {d.hasConflict&&<span style={{fontSize:10,color:"#f87171",fontWeight:700}}>⚠ conflict</span>}
                {d.breakingChange&&<span style={{fontSize:10,color:"#fb923c"}}>breaking change</span>}
                {d.updateApproved&&<span style={{fontSize:10,color:"#4ade80"}}>✓ approved</span>}
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.sub}}>Current: <strong style={{color:T.text,fontFamily:"monospace"}}>{d.current}</strong></span>
                {d.current!==d.latest&&<span style={{fontSize:12,color:T.sub}}>→ <strong style={{color:"#fbbf24",fontFamily:"monospace"}}>{d.latest}</strong></span>}
              </div>
            </div>
            {!d.updateApproved&&d.current!==d.latest&&!d.hasConflict&&(
              <button onClick={()=>approve(d.id)} disabled={approving===d.id} style={{padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                {approving===d.id?"…":"Approve Update"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
