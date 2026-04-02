import { useState } from "react";
import { Zap, AlertTriangle, CheckCircle2, RefreshCw, Users, Activity } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface FeatureFlag{id:string;name:string;key:string;enabled:boolean;rolloutPct:number;targetGroups:string[];env:"production"|"staging"|"testing";version:string;lastChanged:string;changedBy:string;}
const seed=():FeatureFlag[]=>[
  {id:"f1",name:"New Dashboard UI",key:"new_dashboard_ui",enabled:true,rolloutPct:30,targetGroups:["beta_users"],env:"production",version:"v3",lastChanged:new Date(Date.now()-86400000).toISOString(),changedBy:"Admin A"},
  {id:"f2",name:"AI Job Matching",key:"ai_job_matching",enabled:false,rolloutPct:0,targetGroups:[],env:"staging",version:"v1",lastChanged:new Date(Date.now()-172800000).toISOString(),changedBy:"Admin B"},
  {id:"f3",name:"Wallet 2.0",key:"wallet_v2",enabled:true,rolloutPct:100,targetGroups:["all"],env:"production",version:"v2",lastChanged:new Date(Date.now()-604800000).toISOString(),changedBy:"Super Admin"},
  {id:"f4",name:"Dark Mode",key:"dark_mode",enabled:true,rolloutPct:50,targetGroups:["freelancers"],env:"production",version:"v1",lastChanged:new Date(Date.now()-259200000).toISOString(),changedBy:"Admin A"},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminFeatureFlags(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[flags,setFlags]=useState(()=>load("admin_feature_flags_v1",seed));
  const[rolling,setRolling]=useState<string|null>(null);

  const toggle=(id:string)=>{
    const upd=flags.map(f=>f.id===id?{...f,enabled:!f.enabled,lastChanged:new Date().toISOString(),changedBy:"Admin"}:f);
    localStorage.setItem("admin_feature_flags_v1",JSON.stringify(upd));setFlags(upd);
    const f=flags.find(x=>x.id===id)!;
    toast({title:`${f.name} ${f.enabled?"disabled":"enabled"}`});
  };
  const setRollout=(id:string,pct:number)=>{
    const upd=flags.map(f=>f.id===id?{...f,rolloutPct:pct}:f);
    localStorage.setItem("admin_feature_flags_v1",JSON.stringify(upd));setFlags(upd);
  };
  const rollback=async(id:string)=>{
    setRolling(id);await new Promise(r=>setTimeout(r,800));
    const upd=flags.map(f=>f.id===id?{...f,enabled:false,rolloutPct:0,lastChanged:new Date().toISOString()}:f);
    localStorage.setItem("admin_feature_flags_v1",JSON.stringify(upd));setFlags(upd);setRolling(null);
    toast({title:"Feature rolled back"});
  };

  const enabled=flags.filter(f=>f.enabled).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Zap size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Feature Flag Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Enable/disable · Rollout % · Group targeting · Version control · Preview mode · Rollback</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Total Flags",v:flags.length,c:T.badgeFg},{l:"Enabled",v:enabled,c:"#4ade80"},{l:"Disabled",v:flags.length-enabled,c:"#94a3b8"},{l:"Production",v:flags.filter(f=>f.env==="production").length,c:A1}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {flags.map(f=>(
          <div key={f.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:T.text}}>{f.name}</span>
                  <span style={{fontSize:10,fontFamily:"monospace",color:T.sub,background:T.input,padding:"2px 7px",borderRadius:4}}>{f.key}</span>
                  <span style={{fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:4}}>{f.env}</span>
                  <span style={{fontSize:10,color:T.sub}}>{f.version}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:T.sub}}>Rollout:</span>
                  <input type="range" min={0} max={100} value={f.rolloutPct} onChange={e=>setRollout(f.id,+e.target.value)} style={{width:120,accentColor:A1}}/>
                  <span style={{fontSize:12,fontWeight:700,color:T.badgeFg}}>{f.rolloutPct}%</span>
                  {f.targetGroups.length>0&&<span style={{fontSize:11,color:T.sub}}>→ {f.targetGroups.join(", ")}</span>}
                </div>
                <p style={{fontSize:11,color:T.sub,margin:"4px 0 0"}}>Changed by {f.changedBy} · {safeFmt(f.lastChanged, "MMM d, HH:mm")}</p>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                <button onClick={()=>rollback(f.id)} disabled={rolling===f.id} style={{padding:"5px 10px",borderRadius:7,background:"rgba(251,114,36,.08)",border:"1px solid rgba(251,114,36,.2)",color:"#fb923c",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {rolling===f.id?"…":"Rollback"}
                </button>
                <button onClick={()=>toggle(f.id)} style={{padding:"6px 14px",borderRadius:8,background:f.enabled?`${A1}18`:"rgba(74,222,128,.08)",border:`1px solid ${f.enabled?A1:"rgba(74,222,128,.25)"}`,color:f.enabled?T.badgeFg:"#4ade80",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {f.enabled?"Disable":"Enable"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
