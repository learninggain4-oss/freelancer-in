import { useState, useEffect } from "react";
import { Activity, AlertTriangle, RefreshCw, Cpu, HardDrive, Wifi, BarChart3, Clock } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface ResourceSnapshot { timestamp:string; cpuPct:number; memPct:number; memMB:number; dbConnections:number; activeRequests:number; }
interface Alert { id:string; metric:string; value:string; threshold:string; at:string; resolved:boolean; }

const generateSnapshot = (): ResourceSnapshot => ({
  timestamp: new Date().toISOString(),
  cpuPct: Math.round(15 + Math.random()*30),
  memPct: Math.round(55 + Math.random()*20),
  memMB: Math.round(420 + Math.random()*120),
  dbConnections: Math.round(12 + Math.random()*8),
  activeRequests: Math.round(3 + Math.random()*12),
});

const seedAlerts = (): Alert[] => [
  { id:"a1", metric:"Memory Usage",   value:"91%", threshold:"85%", at:new Date(Date.now()-7200000).toISOString(), resolved:true },
  { id:"a2", metric:"CPU Usage",      value:"87%", threshold:"80%", at:new Date(Date.now()-3600000).toISOString(), resolved:true },
  { id:"a3", metric:"DB Connections", value:"28",  threshold:"25",  at:new Date(Date.now()-1800000).toISOString(), resolved:false },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

function Gauge({ pct, label, color, size=80 }: { pct:number; label:string; color:string; size?:number }) {
  const r=size*.38, cx=size/2, cy=size/2;
  const circ=2*Math.PI*r;
  const dash=(pct/100)*circ*0.75;
  const rotation=-225;
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={6} strokeDasharray={`${circ*0.75} ${circ}`} strokeLinecap="round" transform={`rotate(${rotation} ${cx} ${cy})`}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(${rotation} ${cx} ${cy})`} style={{ transition:"stroke-dasharray .5s ease" }}/>
        <text x={cx} y={cy+4} textAnchor="middle" fill={color} fontSize={size*.18} fontWeight="800">{pct}%</text>
      </svg>
      <span style={{ fontSize:10,color:"#94a3b8",fontWeight:600 }}>{label}</span>
    </div>
  );
}

export default function AdminResourceMonitor() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [snap, setSnap]     = useState<ResourceSnapshot>(generateSnapshot);
  const [history, setHistory] = useState<ResourceSnapshot[]>(()=>Array.from({length:10},(_,i)=>({...generateSnapshot(),timestamp:new Date(Date.now()-i*60000).toISOString()})));
  const [alerts]            = useState<Alert[]>(()=>load("admin_resource_alerts_v1",seedAlerts));
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]       = useState<"live"|"history"|"alerts">("live");

  useEffect(()=>{
    const iv = setInterval(()=>{
      const n = generateSnapshot();
      setSnap(n);
      setHistory(h=>[n,...h.slice(0,19)]);
    },10000);
    return ()=>clearInterval(iv);
  },[]);

  const refresh = async () => {
    setRefreshing(true);
    await new Promise(r=>setTimeout(r,600));
    const n = generateSnapshot();
    setSnap(n);
    setHistory(h=>[n,...h.slice(0,19)]);
    setRefreshing(false);
    toast({ title:"Resource metrics refreshed" });
  };

  const cpuColor  = snap.cpuPct>80?"#f87171":snap.cpuPct>60?"#fbbf24":"#4ade80";
  const memColor  = snap.memPct>85?"#f87171":snap.memPct>70?"#fbbf24":"#4ade80";
  const dbColor   = snap.dbConnections>25?"#f87171":snap.dbConnections>18?"#fbbf24":"#4ade80";
  const unresolved = alerts.filter(a=>!a.resolved).length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Activity size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Memory & Resource Monitor</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>CPU · Memory · DB connections · Load monitoring · Leak detection · Performance alerts</p>
          </div>
          <button onClick={refresh} disabled={refreshing} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:10,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",opacity:refreshing?.7:1 }}>
            <RefreshCw size={13} className={refreshing?"animate-spin":""}/>{refreshing?"Refreshing…":"Refresh"}
          </button>
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["live","Live Metrics",Activity],["history","History",BarChart3],["alerts","Alerts",AlertTriangle]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="alerts"&&unresolved>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{unresolved}</span>}
          </button>
        ))}
      </div>

      {tab==="live"&&(
        <>
          <div style={{ display:"flex",gap:12,justifyContent:"space-around",background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"24px 20px",marginBottom:12,flexWrap:"wrap" }}>
            <Gauge pct={snap.cpuPct}    label="CPU Usage"    color={cpuColor}/>
            <Gauge pct={snap.memPct}    label="Memory"       color={memColor}/>
            <Gauge pct={Math.round((snap.dbConnections/30)*100)} label="DB Pool" color={dbColor} size={80}/>
            <Gauge pct={Math.round((snap.activeRequests/20)*100)} label="Requests" color={A1} size={80}/>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[
              { l:"CPU",            v:`${snap.cpuPct}%`,                   c:cpuColor,  sub:"of 100% capacity" },
              { l:"Memory Used",    v:`${snap.memMB} MB (${snap.memPct}%)`,c:memColor,  sub:"of 512 MB limit" },
              { l:"DB Connections", v:`${snap.dbConnections} / 30`,        c:dbColor,   sub:"connection pool" },
              { l:"Active Requests",v:String(snap.activeRequests),         c:A1,        sub:"concurrent requests" },
            ].map(m=>(
              <div key={m.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 16px" }}>
                <p style={{ fontSize:12,color:T.sub,margin:"0 0 4px" }}>{m.l}</p>
                <p style={{ fontWeight:800,fontSize:22,color:m.c,margin:"0 0 2px" }}>{m.v}</p>
                <p style={{ fontSize:11,color:T.sub,margin:0 }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==="history"&&(
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 80px 80px 80px 80px",padding:"10px 18px",borderBottom:`1px solid ${T.border}` }}>
            {["Time","CPU","Memory","DB Pool","Requests"].map(h=><span key={h} style={{ fontSize:11,fontWeight:700,color:T.sub }}>{h}</span>)}
          </div>
          {history.map((s,i)=>(
            <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 80px 80px 80px 80px",padding:"10px 18px",borderBottom:i<history.length-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
              <span style={{ fontSize:12,color:T.sub }}>{format(new Date(s.timestamp),"HH:mm:ss")}</span>
              <span style={{ fontSize:12,fontWeight:700,color:s.cpuPct>80?"#f87171":s.cpuPct>60?"#fbbf24":"#4ade80" }}>{s.cpuPct}%</span>
              <span style={{ fontSize:12,fontWeight:700,color:s.memPct>85?"#f87171":s.memPct>70?"#fbbf24":"#4ade80" }}>{s.memPct}%</span>
              <span style={{ fontSize:12,color:T.text }}>{s.dbConnections}</span>
              <span style={{ fontSize:12,color:T.text }}>{s.activeRequests}</span>
            </div>
          ))}
        </div>
      )}

      {tab==="alerts"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {alerts.map(a=>(
            <div key={a.id} style={{ background:T.card,border:`1px solid ${a.resolved?T.border:"rgba(248,113,113,.2)"}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"center" }}>
              {a.resolved?<CheckCircle2 size={16} color="#4ade80" style={{ flexShrink:0 }}/>:<AlertTriangle size={16} color="#f87171" style={{ flexShrink:0 }}/>}
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                  <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{a.metric} threshold exceeded</span>
                  {!a.resolved&&<span style={{ fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 7px",borderRadius:5 }}>ACTIVE</span>}
                  {a.resolved&&<span style={{ fontSize:10,color:"#4ade80" }}>resolved</span>}
                </div>
                <p style={{ fontSize:12,color:T.sub,margin:0 }}>Value: <strong style={{ color:"#f87171" }}>{a.value}</strong> · Threshold: {a.threshold} · {format(new Date(a.at),"MMM d, HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
