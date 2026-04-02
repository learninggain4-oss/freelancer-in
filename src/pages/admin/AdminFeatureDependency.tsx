import { useState } from "react";
import { GitBranch, AlertTriangle, CheckCircle2, RefreshCw, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface Feature{id:string;name:string;enabled:boolean;requiredFeatures:string[];conflictsWith:string[];impactedModules:string[];safeToToggle:boolean;}
const seed=():Feature[]=>[
  {id:"f1",name:"Wallet 2.0",enabled:true,requiredFeatures:["Payment Gateway v3"],conflictsWith:["Legacy Wallet"],impactedModules:["Freelancer Dashboard","Client Portal","Admin Finance"],safeToToggle:false},
  {id:"f2",name:"AI Job Matching",enabled:false,requiredFeatures:["Search Service v2","ML Pipeline"],conflictsWith:[],impactedModules:["Job Listings","Freelancer Recommendations"],safeToToggle:true},
  {id:"f3",name:"Multi-currency",enabled:false,requiredFeatures:["Currency API","Wallet 2.0"],conflictsWith:["INR-only Mode"],impactedModules:["Wallet","Payments","Reports"],safeToToggle:false},
  {id:"f4",name:"Real-time Chat",enabled:true,requiredFeatures:["WebSocket Server"],conflictsWith:[],impactedModules:["Messaging Module"],safeToToggle:true},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminFeatureDependency(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[features,setFeatures]=useState(()=>load("admin_feat_dep_v1",seed));
  const[toggling,setToggling]=useState<string|null>(null);

  const toggle=async(f:Feature)=>{
    if(!f.safeToToggle){
      toast({title:`Cannot toggle ${f.name} — dependency conflicts would break ${f.impactedModules.join(", ")}`,variant:"destructive"});
      return;
    }
    setToggling(f.id);await new Promise(r=>setTimeout(r,800));
    const upd=features.map(x=>x.id===f.id?{...x,enabled:!x.enabled}:x);
    localStorage.setItem("admin_feat_dep_v1",JSON.stringify(upd));setFeatures(upd);setToggling(null);
    toast({title:`${f.name} ${f.enabled?"disabled":"enabled"}`});
  };

  const conflicts=features.filter(f=>f.conflictsWith.length>0).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><GitBranch size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Feature Toggle Dependency Manager</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Safe toggle enforcement · Dependency mapping · Conflict detection · Impact analysis · Rollback · Testing</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Features",v:features.length,c:T.badgeFg},{l:"Enabled",v:features.filter(f=>f.enabled).length,c:"#4ade80"},{l:"Conflict Potential",v:conflicts,c:conflicts>0?"#fbbf24":"#4ade80"},{l:"Locked",v:features.filter(f=>!f.safeToToggle).length,c:"#94a3b8"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {features.map(f=>(
          <div key={f.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{f.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:f.enabled?"#4ade80":"#94a3b8"}}>{f.enabled?"ENABLED":"DISABLED"}</span>
                {!f.safeToToggle&&<span style={{fontSize:10,color:"#fbbf24"}}>🔒 locked</span>}
              </div>
              {f.requiredFeatures.length>0&&<div style={{marginBottom:4}}>
                <span style={{fontSize:11,color:T.sub}}>Requires: </span>
                {f.requiredFeatures.map(r=><span key={r} style={{fontSize:10,color:T.sub,background:T.input,padding:"1px 6px",borderRadius:4,marginRight:4}}>{r}</span>)}
              </div>}
              {f.conflictsWith.length>0&&<div style={{marginBottom:4}}>
                <span style={{fontSize:11,color:"#f87171"}}>Conflicts with: </span>
                {f.conflictsWith.map(c=><span key={c} style={{fontSize:10,color:"#f87171",background:"rgba(248,113,113,.08)",padding:"1px 6px",borderRadius:4,marginRight:4}}>{c}</span>)}
              </div>}
              <div>
                <span style={{fontSize:11,color:T.sub}}>Impacts: </span>
                {f.impactedModules.map(m=><span key={m} style={{fontSize:10,color:T.sub,background:T.input,padding:"1px 6px",borderRadius:4,marginRight:4}}>{m}</span>)}
              </div>
            </div>
            <button onClick={()=>toggle(f)} disabled={toggling===f.id} style={{padding:"7px 14px",borderRadius:9,background:f.enabled?`${A1}12`:"rgba(74,222,128,.08)",border:`1px solid ${f.enabled?A1+"25":"rgba(74,222,128,.2)"}`,color:f.enabled?T.badgeFg:"#4ade80",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
              {toggling===f.id?"…":f.enabled?"Disable":"Enable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
