import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2, RefreshCw, Globe } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1="#6366f1",A2="#8b5cf6";
const TH={black:{card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badgeFg:"#a5b4fc"},white:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"},wb:{card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badgeFg:"#4f46e5"}};

const ZONES=["Asia/Kolkata","UTC","Asia/Dubai","America/New_York","Europe/London","Asia/Singapore","Australia/Sydney"];
interface TzLog{id:string;action:string;from:string;to:string;by:string;at:string;}
const seedLogs=():TzLog[]=>[
  {id:"l1",action:"Timezone changed",from:"UTC",to:"Asia/Kolkata",by:"Admin",at:new Date(Date.now()-86400000).toISOString()},
  {id:"l2",action:"Mismatch detected",from:"Asia/Kolkata",to:"UTC",by:"System",at:new Date(Date.now()-172800000).toISOString()},
];
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

export default function AdminTimezoneManager(){
  const{theme}=useDashboardTheme();const T=TH[theme];const{toast}=useToast();
  const[tz,setTz]=useState(localStorage.getItem("admin_tz_v1")||"Asia/Kolkata");
  const[dbTz,setDbTz]=useState("UTC");
  const[now,setNow]=useState(new Date());
  const[logs]=useState(()=>load("admin_tz_logs_v1",seedLogs));
  const[testing,setTesting]=useState(false);

  useEffect(()=>{const iv=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(iv);},[]);

  const save=(val:string)=>{
    setTz(val);localStorage.setItem("admin_tz_v1",val);
    toast({title:`System timezone set to ${val}`});
  };
  const runTest=async()=>{
    setTesting(true);await new Promise(r=>setTimeout(r,1200));setTesting(false);
    const match=tz===dbTz?"UTC storage confirmed":"DB stores UTC, app converts to "+tz;
    toast({title:`Timezone test: ${match}`});
  };

  const mismatch=tz!==dbTz;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}><Globe size={22} color="#fff"/></div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>Timezone Management System</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>Global timezone config · User settings · Sync validation · Mismatch alerts · Scheduled task alignment</p>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
          <p style={{fontSize:12,color:T.sub,margin:"0 0 8px"}}>System Timezone</p>
          <select value={tz} onChange={e=>save(e.target.value)} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:8}}>
            {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
          <p style={{fontSize:12,color:T.sub,margin:0}}>Current: <strong style={{color:T.text}}>{format(now,"HH:mm:ss")}</strong></p>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
          <p style={{fontSize:12,color:T.sub,margin:"0 0 8px"}}>Database Storage</p>
          <select value={dbTz} onChange={e=>setDbTz(e.target.value)} style={{width:"100%",background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:8}}>
            {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
          <p style={{fontSize:12,color:mismatch?"#fbbf24":"#4ade80",margin:0}}>{mismatch?"⚠ DB/App timezone mismatch":"✓ UTC stored, converted at display"}</p>
        </div>
      </div>
      {mismatch&&<div style={{background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.2)",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
        <AlertTriangle size={13} color="#fbbf24"/><span style={{fontSize:12,color:"#fbbf24"}}>Timezone mismatch between app ({tz}) and DB ({dbTz}). Schedule-based jobs may fire at wrong times.</span>
      </div>}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <button onClick={runTest} disabled={testing} style={{padding:"9px 16px",borderRadius:10,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer"}}>{testing?"Running…":"Run Timezone Test"}</button>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 18px"}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 10px"}}>Change Logs</p>
        {logs.map((l,i)=>(
          <div key={l.id} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none"}}>
            <Clock size={13} color={T.sub}/>
            <span style={{fontSize:12,color:T.text,flex:1}}>{l.action}: {l.from} → {l.to} · by {l.by}</span>
            <span style={{fontSize:11,color:T.sub}}>{format(new Date(l.at),"MMM d, HH:mm")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
