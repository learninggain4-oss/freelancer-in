import { useState, useEffect } from "react";
import { Server, AlertTriangle, CheckCircle2, RefreshCw, Activity, HardDrive, Cpu } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";

const A1="#6366f1",A2="#8b5cf6";
const TH={
  black:{bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc"},
  white:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
  wb:{bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5"},
};

interface ResourceMetric{label:string;pct:number;used:string;total:string;unit:string;color:string;icon:typeof Cpu;}

function genMetrics():ResourceMetric[]{
  const cpu=Math.round(20+Math.random()*35);
  const ram=Math.round(55+Math.random()*20);
  const disk=Math.round(48+Math.random()*10);
  const net=Math.round(5+Math.random()*20);
  return[
    {label:"CPU",pct:cpu,used:`${cpu}%`,total:"100%",unit:"cores",color:cpu>80?"#f87171":cpu>60?"#fbbf24":"#4ade80",icon:Cpu},
    {label:"RAM",pct:ram,used:`${Math.round(ram*5.12/100*10)/10} GB`,total:"5.12 GB",unit:"memory",color:ram>85?"#f87171":ram>70?"#fbbf24":"#4ade80",icon:Activity},
    {label:"Disk",pct:disk,used:`${Math.round(disk*.5*10)/10} GB`,total:"50 GB",unit:"storage",color:disk>90?"#f87171":disk>75?"#fbbf24":"#4ade80",icon:HardDrive},
    {label:"Network",pct:net,used:`${net} Mbps`,total:"100 Mbps",unit:"bandwidth",color:net>80?"#f87171":net>60?"#fbbf24":"#4ade80",icon:Activity},
  ];
}

interface Alert{id:string;metric:string;value:string;at:string;resolved:boolean;}
function load<T>(k:string,s:()=>T[]):T[]{try{const d=localStorage.getItem(k);if(d)return JSON.parse(d);}catch{}const v=s();localStorage.setItem(k,JSON.stringify(v));return v;}

function CircularBar({pct,color,size=90,label}:{pct:number;color:string;size?:number;label:string}){
  const r=size*.38,cx=size/2,cy=size/2,circ=2*Math.PI*r;
  const dash=(pct/100)*circ*0.75;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={7} strokeDasharray={`${circ*0.75} ${circ}`} strokeLinecap="round" transform={`rotate(-225 ${cx} ${cy})`}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={7} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-225 ${cx} ${cy})`} style={{transition:"stroke-dasharray .6s ease"}}/>
        <text x={cx} y={cy+4} textAnchor="middle" fill={color} fontSize={size*.18} fontWeight="800">{pct}%</text>
      </svg>
      <span style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{label}</span>
    </div>
  );
}

export default function AdminSystemResources(){
  const{theme,themeKey}=useAdminTheme();const T=TH[themeKey];
  const{toast}=useToast();
  const[metrics,setMetrics]=useState<ResourceMetric[]>(genMetrics);
  const[alerts]=useState<Alert[]>([]);
  const[refreshing,setRefreshing]=useState(false);

  useEffect(()=>{const iv=setInterval(()=>setMetrics(genMetrics()),8000);return()=>clearInterval(iv);},[]);

  const refresh=async()=>{
    setRefreshing(true);
    await new Promise(r=>setTimeout(r,600));
    setMetrics(genMetrics());
    setRefreshing(false);
    toast({title:"Resource metrics refreshed"});
  };

  const highLoad=metrics.filter(m=>m.pct>80).length;

  return(
    <div style={{maxWidth:980,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0}}>
            <Server size={22} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{color:T.text,fontWeight:800,fontSize:22,margin:0}}>System Resource Monitor</h1>
            <p style={{color:T.sub,fontSize:13,margin:"3px 0 0"}}>CPU · RAM · Disk · Network · High load detection · Resource limits · Auto-refresh</p>
          </div>
          <button onClick={refresh} disabled={refreshing} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            <RefreshCw size={13} className={refreshing?"animate-spin":""}/>{refreshing?"…":"Refresh"}
          </button>
        </div>
        {highLoad>0&&<div style={{marginTop:14,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:9,padding:"8px 14px",display:"flex",gap:8,alignItems:"center"}}>
          <AlertTriangle size={13} color="#f87171"/><span style={{fontSize:12,color:"#f87171"}}>{highLoad} resource(s) above 80% threshold — monitor closely</span>
        </div>}
      </div>

      <div style={{display:"flex",gap:12,justifyContent:"space-around",background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"24px 20px",marginBottom:14,flexWrap:"wrap"}}>
        {metrics.map(m=><CircularBar key={m.label} pct={m.pct} color={m.color} label={m.label}/>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {metrics.map(m=>(
          <div key={m.label} style={{background:T.card,border:`1px solid ${m.pct>80?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 16px"}}>
            <p style={{fontSize:12,color:T.sub,margin:"0 0 4px"}}>{m.label}</p>
            <p style={{fontWeight:800,fontSize:22,color:m.color,margin:"0 0 2px"}}>{m.used}</p>
            <p style={{fontSize:11,color:T.sub,margin:"0 0 8px"}}>of {m.total}</p>
            <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,.07)",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:4,background:m.color,width:`${m.pct}%`,transition:"width .5s ease"}}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 18px"}}>
        <p style={{fontWeight:700,fontSize:13,color:T.text,margin:"0 0 10px"}}>Alert History</p>
        {alerts.map((a,i)=>(
          <div key={a.id} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:i<alerts.length-1?`1px solid ${T.border}`:"none"}}>
            {a.resolved?<CheckCircle2 size={13} color="#4ade80"/>:<AlertTriangle size={13} color="#f87171"/>}
            <span style={{fontSize:12,color:T.text,flex:1}}>{a.metric} hit {a.value}</span>
            <span style={{fontSize:11,color:a.resolved?"#4ade80":"#f87171"}}>{a.resolved?"Resolved":"Active"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
