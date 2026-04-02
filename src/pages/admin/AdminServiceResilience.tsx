import { useState, useEffect } from "react";
import { Globe, CheckCircle2, AlertTriangle, RefreshCw, Clock, Activity, ToggleLeft, ToggleRight, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface ServiceConfig { id:string; name:string; category:string; url:string; timeoutMs:number; maxRetries:number; hasFallback:boolean; fallbackService?:string; status:"healthy"|"degraded"|"offline"|"unknown"; avgLatencyMs?:number; lastChecked?:string; failCount24h:number; autoFailover:boolean; }

const seedServices = (): ServiceConfig[] => [
  { id:"s1", name:"Razorpay Payments",   category:"Payments",    url:"https://api.razorpay.com",          timeoutMs:10000, maxRetries:3, hasFallback:false, status:"healthy",  avgLatencyMs:142, lastChecked:new Date(Date.now()-60000).toISOString(),    failCount24h:0,  autoFailover:false },
  { id:"s2", name:"OneSignal Push",      category:"Notifications",url:"https://onesignal.com/api/v1",     timeoutMs:8000,  maxRetries:3, hasFallback:true,  fallbackService:"Firebase FCM", status:"degraded", avgLatencyMs:940, lastChecked:new Date(Date.now()-120000).toISOString(), failCount24h:14, autoFailover:true },
  { id:"s3", name:"Supabase DB",         category:"Database",    url:"https://maysttckdfnnzvfeujaj.supabase.co", timeoutMs:5000,  maxRetries:2, hasFallback:false, status:"healthy",  avgLatencyMs:22,  lastChecked:new Date(Date.now()-30000).toISOString(),    failCount24h:0,  autoFailover:false },
  { id:"s4", name:"Resend Email",        category:"Email",       url:"https://api.resend.com",            timeoutMs:15000, maxRetries:2, hasFallback:true,  fallbackService:"SMTP Direct", status:"healthy",  avgLatencyMs:380, lastChecked:new Date(Date.now()-90000).toISOString(),   failCount24h:1,  autoFailover:true },
  { id:"s5", name:"Replit Hosting",      category:"Hosting",     url:"https://replit.com",                timeoutMs:30000, maxRetries:1, hasFallback:false, status:"healthy",  avgLatencyMs:55,  lastChecked:new Date(Date.now()-45000).toISOString(),    failCount24h:0,  autoFailover:false },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor = { healthy:"#4ade80", degraded:"#fbbf24", offline:"#f87171", unknown:"#94a3b8" };

export default function AdminServiceResilience() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [services, setServices] = useState<ServiceConfig[]>(()=>load("admin_svc_resilience_v1",seedServices));
  const [checking, setChecking] = useState<string|null>(null);
  const [editId, setEditId]     = useState<string|null>(null);
  const [editTimeout, setEditTimeout] = useState("");
  const [editRetries, setEditRetries] = useState("");

  const checkService = async (id:string) => {
    setChecking(id);
    const svc = services.find(s=>s.id===id)!;
    const t = Date.now();
    try {
      await fetch(svc.url, { signal:AbortSignal.timeout(svc.timeoutMs), mode:"no-cors" });
      const latency = Date.now()-t;
      const updated = services.map(s=>s.id===id?{...s,status:"healthy" as const,avgLatencyMs:latency,lastChecked:new Date().toISOString()}:s);
      localStorage.setItem("admin_svc_resilience_v1",JSON.stringify(updated));
      setServices(updated);
    } catch {
      const latency = Date.now()-t;
      const updated = services.map(s=>s.id===id?{...s,status:latency>=svc.timeoutMs?"offline" as const:"degraded" as const,avgLatencyMs:latency,lastChecked:new Date().toISOString()}:s);
      localStorage.setItem("admin_svc_resilience_v1",JSON.stringify(updated));
      setServices(updated);
    }
    setChecking(null);
  };

  const saveConfig = (id:string) => {
    const updated = services.map(s=>s.id===id?{...s,timeoutMs:Number(editTimeout)*1000||s.timeoutMs,maxRetries:Number(editRetries)||s.maxRetries}:s);
    localStorage.setItem("admin_svc_resilience_v1",JSON.stringify(updated));
    setServices(updated);
    toast({ title:"Service config updated" });
    setEditId(null);
  };

  const toggleFailover = (id:string) => {
    const updated = services.map(s=>s.id===id?{...s,autoFailover:!s.autoFailover}:s);
    localStorage.setItem("admin_svc_resilience_v1",JSON.stringify(updated));
    setServices(updated);
  };

  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,...s });
  const degraded = services.filter(s=>s.status!=="healthy").length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Globe size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Third-Party Service Resilience</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Timeout control · Retry mechanism · Fallback services · Health monitoring · Auto-failover</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Monitored Services",v:services.length,c:T.badgeFg},{l:"Degraded / Offline",v:degraded,c:degraded>0?"#f87171":"#94a3b8"},{l:"With Fallback",v:services.filter(s=>s.hasFallback).length,c:"#4ade80"},{l:"Auto-Failover On",v:services.filter(s=>s.autoFailover).length,c:A1}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {services.map(s=>(
          <div key={s.id} style={{ background:T.card,border:`1px solid ${s.status!=="healthy"?"rgba(248,113,113,.2)":T.border}`,borderRadius:14,padding:"16px 18px" }}>
            <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700,fontSize:14,color:T.text }}>{s.name}</span>
                  <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{s.category}</span>
                  <span style={{ fontSize:10,fontWeight:700,color:(statusColor as Record<string,string>)[s.status],background:`${(statusColor as Record<string,string>)[s.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{s.status}</span>
                  {s.failCount24h>0&&<span style={{ fontSize:10,color:"#f87171" }}>{s.failCount24h} failures today</span>}
                </div>
                <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:6 }}>
                  {editId===s.id?(
                    <>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <span style={{ fontSize:11,color:T.sub }}>Timeout (s):</span>
                        <Input type="number" value={editTimeout} onChange={e=>setEditTimeout(e.target.value)} style={{ ...inp(),width:60,padding:"4px 8px",fontSize:12 }}/>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <span style={{ fontSize:11,color:T.sub }}>Retries:</span>
                        <Input type="number" value={editRetries} onChange={e=>setEditRetries(e.target.value)} style={{ ...inp(),width:50,padding:"4px 8px",fontSize:12 }}/>
                      </div>
                      <button onClick={()=>saveConfig(s.id)} style={{ padding:"4px 12px",borderRadius:7,background:`${A1}20`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer" }}>Save</button>
                      <button onClick={()=>setEditId(null)} style={{ padding:"4px 8px",borderRadius:7,background:T.input,border:`1px solid ${T.border}`,color:T.sub,fontSize:11,cursor:"pointer" }}>×</button>
                    </>
                  ):(
                    <>
                      <span style={{ fontSize:12,color:T.sub }}>Timeout: <strong style={{ color:T.text }}>{s.timeoutMs/1000}s</strong></span>
                      <span style={{ fontSize:12,color:T.sub }}>Retries: <strong style={{ color:T.text }}>{s.maxRetries}</strong></span>
                      {s.avgLatencyMs&&<span style={{ fontSize:12,color:T.sub }}>Avg latency: <strong style={{ color:s.avgLatencyMs>1000?"#f87171":s.avgLatencyMs>500?"#fbbf24":"#4ade80" }}>{s.avgLatencyMs}ms</strong></span>}
                      <button onClick={()=>{setEditId(s.id);setEditTimeout(String(s.timeoutMs/1000));setEditRetries(String(s.maxRetries));}} style={{ fontSize:10,color:T.badgeFg,background:T.badge,border:"none",borderRadius:5,padding:"2px 8px",cursor:"pointer" }}>edit config</button>
                    </>
                  )}
                </div>
                {s.hasFallback&&<p style={{ fontSize:11,color:"#4ade80",margin:"0 0 4px" }}>✓ Fallback: {s.fallbackService}</p>}
                {s.lastChecked&&<p style={{ fontSize:11,color:T.sub,margin:0 }}>Last checked: {safeDist(s.lastChecked)} ago</p>}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0,alignItems:"flex-end" }}>
                <button onClick={()=>checkService(s.id)} disabled={checking===s.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                  <RefreshCw size={11} className={checking===s.id?"animate-spin":""}/>{checking===s.id?"Checking…":"Test"}
                </button>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ fontSize:10,color:T.sub }}>Auto-failover</span>
                  <button onClick={()=>toggleFailover(s.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}>
                    {s.autoFailover?<ToggleRight size={24} color="#4ade80"/>:<ToggleLeft size={24} color="#94a3b8"/>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
