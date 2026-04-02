import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Activity, Eye, Lock } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

interface ThreatEvent{id:string;type:string;payload:string;field:string;user:string;ip:string;at:string;blocked:boolean;}
const seed=():ThreatEvent[]=>[
  {id:"t1",type:"Script Injection",payload:"<script>alert(1)</script>",field:"job_title",user:"anonymous",ip:"45.79.12.200",at:new Date(Date.now()-3600000).toISOString(),blocked:true},
  {id:"t2",type:"HTML Injection",payload:"<img onerror='fetch(...)'>",field:"bio",user:"user_182",ip:"103.21.58.9",at:new Date(Date.now()-7200000).toISOString(),blocked:true},
  {id:"t3",type:"Suspicious Input",payload:"javascript:void(0)",field:"portfolio_url",user:"user_510",ip:"122.161.45.12",at:new Date(Date.now()-1800000).toISOString(),blocked:false},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminXssProtection(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[events]=useState(()=>load("admin_xss_v1",seed));
  const[config,setConfig]=useState({sanitizationEnabled:true,htmlValidation:true,contentFiltering:true,alertsEnabled:true,cspEnabled:true});
  const[testInput,setTestInput]=useState("");
  const[testResult,setTestResult]=useState<string|null>(null);

  const runTest=()=>{
    const malicious=/<script|onerror|javascript:|<img|<iframe/i.test(testInput);
    setTestResult(malicious?"⚠ Malicious input detected — would be blocked":"✓ Clean input — would be allowed");
    toast({title:malicious?"XSS detected":"Input is clean"});
  };
  const toggle=(k:keyof typeof config)=>setConfig(p=>({...p,[k]:!p[k as keyof typeof p]}));

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><ShieldCheck size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>XSS / Input Security Validation (CRITICAL)</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Input sanitization · Script injection detection · HTML validation · Content filtering · Security alerts</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
          {[{l:"Blocked Threats",v:events.filter(e=>e.blocked).length,c:"#f87171"},{l:"Flagged",v:events.filter(e=>!e.blocked).length,c:"#fbbf24"},{l:"Sanitization",v:config.sanitizationEnabled?"On":"Off",c:config.sanitizationEnabled?"#4ade80":"#f87171"}].map(s=>(
            <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</span><span style={{fontSize:11,color:T.sub}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 10px"}}>Security Rules</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {([["sanitizationEnabled","Input Sanitization"],["htmlValidation","HTML Validation"],["contentFiltering","Content Filtering"],["alertsEnabled","Security Alerts"],["cspEnabled","CSP Header"]] as const).map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:T.input,borderRadius:8}}>
              <span style={{fontSize:12,color:T.text}}>{l}</span>
              <button onClick={()=>toggle(k)} style={{padding:"3px 12px",borderRadius:6,background:config[k]?`${A1}20`:"rgba(148,163,184,.1)",border:`1px solid ${config[k]?A1:T.border}`,color:config[k]?T.badgeFg:T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>{config[k]?"ON":"OFF"}</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Test Input</p>
        <div style={{display:"flex",gap:8}}>
          <input value={testInput} onChange={e=>setTestInput(e.target.value)} placeholder="Paste suspicious input here..." style={{flex:1,background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"8px 12px",fontSize:13}}/>
          <button onClick={runTest} style={{padding:"8px 16px",borderRadius:8,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Test</button>
        </div>
        {testResult&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:testResult.startsWith("⚠")?"rgba(248,113,113,.08)":"rgba(74,222,128,.08)",border:`1px solid ${testResult.startsWith("⚠")?"rgba(248,113,113,.2)":"rgba(74,222,128,.2)"}`}}>
          <span style={{fontSize:12,color:testResult.startsWith("⚠")?"#f87171":"#4ade80"}}>{testResult}</span>
        </div>}
      </div>
      <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 8px"}}>Recent Threats</p>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {events.map((e,i)=>(
          <div key={e.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:i<events.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}>
            <AlertTriangle size={13} color={e.blocked?"#f87171":"#fbbf24"} style={{flexShrink:0}}/>
            <div style={{flex:1}}>
              <p style={{fontWeight:600,fontSize:12,color:T.text,margin:"0 0 1px"}}>{e.type} — field: <code style={{fontSize:11}}>{e.field}</code></p>
              <p style={{fontSize:11,color:T.sub,margin:"0 0 1px",fontFamily:"monospace",wordBreak:"break-all"}}>{e.payload.slice(0,60)}{e.payload.length>60?"…":""}</p>
              <p style={{fontSize:11,color:T.sub,margin:0}}>IP: {e.ip} · {safeFmt(e.at, "MMM d, HH:mm")}</p>
            </div>
            <span style={{fontSize:10,fontWeight:700,color:e.blocked?"#f87171":"#fbbf24",textTransform:"uppercase",flexShrink:0}}>{e.blocked?"BLOCKED":"FLAGGED"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
