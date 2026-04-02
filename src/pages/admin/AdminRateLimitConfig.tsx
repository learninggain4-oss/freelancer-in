import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, RefreshCw, Activity, Zap } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface RateRule{id:string;endpoint:string;limitPerMin:number;burstLimit:number;perUser:number;perIp:number;throttleEnabled:boolean;violations24h:number;status:"ok"|"warning";}
interface ViolationEntry{id:string;ip:string;endpoint:string;attempts:number;blockedAt:string;}
const seedRules=():RateRule[]=>[
  {id:"r1",endpoint:"/api/jobs",limitPerMin:60,burstLimit:20,perUser:30,perIp:60,throttleEnabled:true,violations24h:4,status:"ok"},
  {id:"r2",endpoint:"/api/wallet/withdraw",limitPerMin:5,burstLimit:2,perUser:3,perIp:5,throttleEnabled:true,violations24h:12,status:"warning"},
  {id:"r3",endpoint:"/api/auth/login",limitPerMin:10,burstLimit:5,perUser:5,perIp:10,throttleEnabled:true,violations24h:38,status:"warning"},
  {id:"r4",endpoint:"/api/notifications",limitPerMin:120,burstLimit:40,perUser:60,perIp:120,throttleEnabled:false,violations24h:0,status:"ok"},
];
const seedViolations=():ViolationEntry[]=>[
  {id:"v1",ip:"45.79.12.200",endpoint:"/api/auth/login",attempts:85,blockedAt:new Date(Date.now()-1800000).toISOString()},
  {id:"v2",ip:"103.21.58.9",endpoint:"/api/wallet/withdraw",attempts:24,blockedAt:new Date(Date.now()-3600000).toISOString()},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminRateLimitConfig(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[rules,setRules]=useState(()=>load("admin_rate_limit_v1",seedRules));
  const[violations]=useState(()=>load("admin_rate_violations_v1",seedViolations));
  const[tab,setTab]=useState<"rules"|"violations">("rules");
  const[saving,setSaving]=useState<string|null>(null);

  const saveRule=async(id:string,field:string,val:number|boolean)=>{
    setSaving(id);await new Promise(r=>setTimeout(r,400));
    const upd=rules.map(r=>r.id===id?{...r,[field]:val}:r);
    localStorage.setItem("admin_rate_limit_v1",JSON.stringify(upd));setRules(upd);setSaving(null);
    toast({title:"Rate limit updated"});
  };

  const warnings=rules.filter(r=>r.status==="warning").length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Shield size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>API Rate Limit Management</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Per-user · Per-IP · Burst protection · Throttling rules · Violation alerts · Auto-adjust</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Endpoints",v:rules.length,c:T.badgeFg},{l:"Warnings",v:warnings,c:warnings>0?"#fbbf24":"#4ade80"},{l:"Violations (24h)",v:rules.reduce((s,r)=>s+r.violations24h,0),c:"#f87171"},{l:"Blocked IPs",v:violations.length,c:"#fbbf24"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {([["rules","Rate Rules",Shield],["violations","Violations",AlertTriangle]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer"}}>
            <Icon size={13}/>{l}
          </button>
        ))}
      </div>
      {tab==="rules"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {rules.map(r=>(
          <div key={r.id} style={{background:T.card,border:`1px solid ${r.status==="warning"?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:T.text}}>{r.endpoint}</span>
              <span style={{fontSize:10,fontWeight:700,color:r.status==="warning"?"#fbbf24":"#4ade80",textTransform:"capitalize"}}>{r.status}</span>
              {r.violations24h>0&&<span style={{fontSize:10,color:"#f87171"}}>{r.violations24h} violations today</span>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,flexWrap:"wrap"}}>
              {[{l:"Limit/min",f:"limitPerMin",v:r.limitPerMin},{l:"Burst",f:"burstLimit",v:r.burstLimit},{l:"Per User",f:"perUser",v:r.perUser},{l:"Per IP",f:"perIp",v:r.perIp}].map(({l,f,v})=>(
                <div key={f}>
                  <p style={{fontSize:11,color:T.sub,margin:"0 0 2px"}}>{l}</p>
                  <input type="number" defaultValue={v} onBlur={e=>saveRule(r.id,f,+e.target.value)} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:7,padding:"5px 8px",fontSize:12}}/>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12,color:T.sub}}>Throttle:</span>
              <button onClick={()=>saveRule(r.id,"throttleEnabled",!r.throttleEnabled)} style={{padding:"4px 12px",borderRadius:7,background:r.throttleEnabled?`${A1}15`:"rgba(148,163,184,.1)",border:`1px solid ${r.throttleEnabled?A1:T.border}`,color:r.throttleEnabled?T.badgeFg:T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {r.throttleEnabled?"Enabled":"Disabled"}
              </button>
            </div>
          </div>
        ))}
      </div>}
      {tab==="violations"&&<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
        {violations.map((v,i)=>(
          <div key={v.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<violations.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            <AlertTriangle size={13} color="#f87171" style={{flexShrink:0}}/>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 1px"}}>IP {v.ip} — {v.endpoint}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>{v.attempts} attempts · Blocked: {safeFmt(v.blockedAt, "MMM d, HH:mm")}</p>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
