import { useState } from "react";
import { Zap, Key, Activity, AlertTriangle, CheckCircle2, RefreshCw, Eye, EyeOff, ToggleLeft, ToggleRight, BarChart3, Package } from "lucide-react";
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

interface ApiKey { id:string; name:string; service:string; maskedKey:string; permissions:string[]; lastRotated:string; expiresAt:string; status:"active"|"expired"|"revoked"; requestsToday:number; requestLimit:number; }
interface ApiLog { id:string; method:string; endpoint:string; status:number; latencyMs:number; ip:string; apiKey:string; timestamp:string; }
interface Dependency { id:string; name:string; current:string; latest:string; type:"prod"|"dev"; hasConflict:boolean; securityAlert:boolean; lastChecked:string; }

const seedKeys = (): ApiKey[] => [
  { id:"k1", name:"Razorpay Live",      service:"Payments",    maskedKey:"rzp_live_••••••••••ABCD", permissions:["payments.create","payments.capture","refunds.create"], lastRotated:new Date(Date.now()-864e5*30).toISOString(),  expiresAt:new Date(Date.now()+864e5*335).toISOString(), status:"active",  requestsToday:142, requestLimit:1000 },
  { id:"k2", name:"OneSignal Push",     service:"Push",        maskedKey:"os_••••••••••••••••WXYZ", permissions:["notifications.send","players.read"],                   lastRotated:new Date(Date.now()-864e5*60).toISOString(),  expiresAt:new Date(Date.now()+864e5*305).toISOString(), status:"active",  requestsToday:89,  requestLimit:500 },
  { id:"k3", name:"Supabase Service",   service:"Database",    maskedKey:"eyJhbGciOiJIUzI1NiIs••••", permissions:["database.read","database.write","auth.admin"],         lastRotated:new Date(Date.now()-864e5*90).toISOString(),  expiresAt:new Date(Date.now()+864e5*9).toISOString(),  status:"active",  requestsToday:2140,requestLimit:5000 },
  { id:"k4", name:"Resend Email (old)", service:"Email",       maskedKey:"re_old_••••••••••••DEAD", permissions:["emails.send"],                                         lastRotated:new Date(Date.now()-864e5*200).toISOString(), expiresAt:new Date(Date.now()-864e5*5).toISOString(),  status:"expired", requestsToday:0,   requestLimit:200 },
];

const seedLogs = (): ApiLog[] => [
  { id:"l1", method:"POST", endpoint:"/api/webhooks/razorpay",  status:200, latencyMs:142, ip:"103.21.58.44", apiKey:"k1", timestamp:new Date(Date.now()-300000).toISOString()  },
  { id:"l2", method:"GET",  endpoint:"/api/admin/users",        status:200, latencyMs:88,  ip:"192.168.1.10", apiKey:"k3", timestamp:new Date(Date.now()-600000).toISOString()  },
  { id:"l3", method:"POST", endpoint:"/api/notifications/send", status:429, latencyMs:12,  ip:"45.79.12.200", apiKey:"k2", timestamp:new Date(Date.now()-900000).toISOString()  },
  { id:"l4", method:"POST", endpoint:"/api/auth/admin",         status:401, latencyMs:24,  ip:"45.79.12.200", apiKey:"?",  timestamp:new Date(Date.now()-1200000).toISOString() },
  { id:"l5", method:"GET",  endpoint:"/api/admin/withdrawals",  status:200, latencyMs:210, ip:"192.168.1.11", apiKey:"k3", timestamp:new Date(Date.now()-1500000).toISOString() },
];

const seedDeps = (): Dependency[] => [
  { id:"d1", name:"react",          current:"18.3.1",  latest:"18.3.1",  type:"prod", hasConflict:false, securityAlert:false, lastChecked:new Date(Date.now()-86400000).toISOString() },
  { id:"d2", name:"@supabase/supabase-js", current:"2.43.4", latest:"2.45.0", type:"prod", hasConflict:false, securityAlert:false, lastChecked:new Date(Date.now()-86400000).toISOString() },
  { id:"d3", name:"vite",           current:"5.2.0",   latest:"5.4.21",  type:"dev",  hasConflict:false, securityAlert:true,  lastChecked:new Date(Date.now()-86400000).toISOString() },
  { id:"d4", name:"date-fns",       current:"3.3.1",   latest:"3.6.0",   type:"prod", hasConflict:false, securityAlert:false, lastChecked:new Date(Date.now()-86400000).toISOString() },
  { id:"d5", name:"lucide-react",   current:"0.344.0", latest:"0.441.0", type:"prod", hasConflict:true,  securityAlert:false, lastChecked:new Date(Date.now()-86400000).toISOString() },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

export default function AdminApiManager() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]       = useState<"keys"|"logs"|"deps">("keys");
  const [keys, setKeys]     = useState<ApiKey[]>(()=>load("admin_api_keys_v1",seedKeys));
  const [logs]              = useState<ApiLog[]>(()=>load("admin_api_logs_v1",seedLogs));
  const [deps]              = useState<Dependency[]>(()=>load("admin_dep_manager_v1",seedDeps));
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [rotating, setRotating] = useState<string|null>(null);

  const toggleShow = (id:string) => setShowKeys(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  const rotateKey = async (id:string) => {
    setRotating(id);
    await new Promise(r=>setTimeout(r,1800));
    const updated = keys.map(k=>k.id===id?{...k,lastRotated:new Date().toISOString(),maskedKey:k.maskedKey.replace(/[A-Z]{4}$/,Math.random().toString(36).slice(-4).toUpperCase())}:k);
    localStorage.setItem("admin_api_keys_v1",JSON.stringify(updated));
    setKeys(updated);
    setRotating(null);
    logAction("API Key Rotated",keys.find(k=>k.id===id)?.name||"","Security","warning");
    toast({ title:"API key rotated successfully",description:"Update the key in your environment config" });
  };

  const revokeKey = (id:string) => {
    const updated = keys.map(k=>k.id===id?{...k,status:"revoked" as const}:k);
    localStorage.setItem("admin_api_keys_v1",JSON.stringify(updated));
    setKeys(updated);
    logAction("API Key Revoked",keys.find(k=>k.id===id)?.name||"","Security","warning");
    toast({ title:"API key revoked" });
  };

  const alerts = keys.filter(k=>k.status!=="active"||k.requestsToday/k.requestLimit>0.8).length;
  const secDeps = deps.filter(d=>d.securityAlert||d.hasConflict).length;
  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,...s });

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Zap size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>API & Dependency Manager</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>API key rotation · Rate monitoring · Auth enforcement · Dependency audit · Version control</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Active Keys",v:keys.filter(k=>k.status==="active").length,c:"#4ade80"},{l:"Alerts",v:alerts,c:alerts>0?"#f87171":"#94a3b8"},{l:"4xx/5xx Today",v:logs.filter(l=>l.status>=400).length,c:"#f87171"},{l:"Dep Issues",v:secDeps,c:secDeps>0?"#fbbf24":"#94a3b8"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["keys","API Keys",Key],["logs","API Logs",Activity],["deps","Dependencies",Package]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="deps"&&secDeps>0&&<span style={{ background:"#fbbf24",color:"#000",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{secDeps}</span>}
          </button>
        ))}
      </div>

      {tab==="keys"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {keys.map(k=>(
            <div key={k.id} style={{ background:T.card,border:`1px solid ${k.status!=="active"?"rgba(248,113,113,.25)":k.requestsToday/k.requestLimit>0.8?"rgba(251,191,36,.2)":T.border}`,borderRadius:14,padding:"16px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700,fontSize:14,color:T.text }}>{k.name}</span>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{k.service}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:k.status==="active"?"#4ade80":k.status==="expired"?"#f87171":"#94a3b8",background:`${k.status==="active"?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)"}`,padding:"2px 7px",borderRadius:5,textTransform:"uppercase" }}>{k.status}</span>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:6,background:T.input,borderRadius:8,padding:"6px 12px",marginBottom:6 }}>
                    <span style={{ fontFamily:"monospace",fontSize:12,color:T.text,flex:1 }}>{showKeys.has(k.id)?k.maskedKey.replace(/•+/g,"[hidden]"):k.maskedKey}</span>
                    <button onClick={()=>toggleShow(k.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:2,color:T.sub }}>
                      {showKeys.has(k.id)?<EyeOff size={13}/>:<Eye size={13}/>}
                    </button>
                  </div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:6 }}>
                    <span style={{ fontSize:12,color:T.sub }}>Last rotated: {safeDist(k.lastRotated)} ago</span>
                    <span style={{ fontSize:12,color:T.sub }}>Expires: {safeFmt(k.expiresAt, "MMM d, yyyy")}</span>
                    <span style={{ fontSize:12,color:k.requestsToday/k.requestLimit>0.8?"#f87171":T.sub }}>Today: {k.requestsToday}/{k.requestLimit}</span>
                  </div>
                  <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                    {k.permissions.map(p=><span key={p} style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5,fontFamily:"monospace" }}>{p}</span>)}
                  </div>
                </div>
                {k.status==="active"&&(
                  <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0 }}>
                    <button onClick={()=>rotateKey(k.id)} disabled={rotating===k.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      <RefreshCw size={11} className={rotating===k.id?"animate-spin":""}/>{rotating===k.id?"Rotating…":"Rotate Key"}
                    </button>
                    <button onClick={()=>revokeKey(k.id)} style={{ padding:"6px 13px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer" }}>Revoke</button>
                  </div>
                )}
              </div>
              <div style={{ height:4,borderRadius:4,background:"rgba(255,255,255,.07)",overflow:"hidden" }}>
                <div style={{ height:"100%",borderRadius:4,background:k.requestsToday/k.requestLimit>0.8?"linear-gradient(90deg,#f87171,#fb923c)":`linear-gradient(90deg,${A1},${A2})`,width:`${Math.min(100,(k.requestsToday/k.requestLimit)*100)}%` }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden" }}>
          {logs.map((l,i)=>(
            <div key={l.id} style={{ display:"flex",gap:12,padding:"12px 18px",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
              <span style={{ fontSize:10,fontFamily:"monospace",fontWeight:700,color:l.method==="POST"?A1:T.sub,background:T.input,padding:"2px 7px",borderRadius:5,flexShrink:0 }}>{l.method}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:12,fontFamily:"monospace",color:T.text,margin:"0 0 2px" }}>{l.endpoint}</p>
                <p style={{ fontSize:11,color:T.sub,margin:0 }}>IP: {l.ip} · {l.latencyMs}ms · Key: {l.apiKey} · {safeFmt(l.timestamp, "HH:mm:ss")}</p>
              </div>
              <span style={{ fontSize:12,fontWeight:700,color:l.status<300?"#4ade80":l.status<400?"#fbbf24":"#f87171",background:l.status<300?"rgba(74,222,128,.1)":l.status<400?"rgba(251,191,36,.1)":"rgba(248,113,113,.1)",padding:"3px 9px",borderRadius:7,flexShrink:0 }}>{l.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab==="deps"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {deps.map(d=>(
            <div key={d.id} style={{ background:T.card,border:`1px solid ${d.securityAlert?"rgba(248,113,113,.25)":d.hasConflict?"rgba(251,191,36,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text }}>{d.name}</span>
                  <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{d.type}</span>
                  {d.securityAlert&&<span style={{ fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 8px",borderRadius:5 }}>⚠ SECURITY ALERT</span>}
                  {d.hasConflict&&<span style={{ fontSize:10,fontWeight:700,color:"#fbbf24",background:"rgba(251,191,36,.1)",padding:"2px 8px",borderRadius:5 }}>⚠ CONFLICT</span>}
                </div>
                <div style={{ display:"flex",gap:12 }}>
                  <span style={{ fontSize:12,color:T.sub }}>Installed: <strong style={{ color:T.text }}>{d.current}</strong></span>
                  <span style={{ fontSize:12,color:T.sub }}>Latest: <strong style={{ color:d.current===d.latest?"#4ade80":"#fbbf24" }}>{d.latest}</strong></span>
                  {d.current!==d.latest&&<span style={{ fontSize:11,color:"#fbbf24" }}>↑ Update available</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
