import { useState } from "react";
import { KeyRound, Eye, EyeOff, RefreshCw, AlertTriangle, CheckCircle2, Lock, Shield, Clock } from "lucide-react";
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

interface Secret { id:string; name:string; service:string; sensitivity:"critical"|"high"|"medium"; maskedValue:string; lastRotated:string; expiresIn?:number; status:"active"|"expired"|"needs_rotation"; accessCount:number; lastAccessed:string; inLogs:boolean; }
interface SecretLog { id:string; secretName:string; action:string; actor:string; ip:string; timestamp:string; suspicious:boolean; }

const seedSecrets = (): Secret[] => [
  { id:"sk1", name:"SUPABASE_SERVICE_ROLE_KEY", service:"Supabase",   sensitivity:"critical", maskedValue:"eyJhbGci••••••••••••••••••",   lastRotated:new Date(Date.now()-864e5*90).toISOString(),  expiresIn:275, status:"active",          accessCount:8420, lastAccessed:new Date(Date.now()-300000).toISOString(),   inLogs:false },
  { id:"sk2", name:"RAZORPAY_KEY_SECRET",       service:"Razorpay",   sensitivity:"critical", maskedValue:"rzp_live_••••••••••••WXYZ",     lastRotated:new Date(Date.now()-864e5*30).toISOString(),  expiresIn:335, status:"active",          accessCount:1240, lastAccessed:new Date(Date.now()-600000).toISOString(),   inLogs:false },
  { id:"sk3", name:"ONESIGNAL_REST_API_KEY",    service:"OneSignal",  sensitivity:"high",     maskedValue:"os_v2_app_••••••••••••ABCD",    lastRotated:new Date(Date.now()-864e5*60).toISOString(),  expiresIn:305, status:"active",          accessCount:580,  lastAccessed:new Date(Date.now()-1800000).toISOString(),  inLogs:false },
  { id:"sk4", name:"DATABASE_URL",              service:"Database",   sensitivity:"critical", maskedValue:"postgresql://postgres:••••@db", lastRotated:new Date(Date.now()-864e5*180).toISOString(), status:"needs_rotation",  accessCount:42100,lastAccessed:new Date(Date.now()-30000).toISOString(),    inLogs:true,  expiresIn:undefined },
  { id:"sk5", name:"SMTP_PASSWORD",             service:"Email",      sensitivity:"high",     maskedValue:"••••••••••••pass1234",          lastRotated:new Date(Date.now()-864e5*400).toISOString(), status:"expired",         accessCount:840,  lastAccessed:new Date(Date.now()-864e5*5).toISOString(),   inLogs:false },
];

const seedLogs = (): SecretLog[] => [
  { id:"l1", secretName:"SUPABASE_SERVICE_ROLE_KEY", action:"Key accessed",     actor:"System (API)",  ip:"127.0.0.1",   timestamp:new Date(Date.now()-300000).toISOString(),   suspicious:false },
  { id:"l2", secretName:"DATABASE_URL",              action:"Key accessed",     actor:"System (API)",  ip:"127.0.0.1",   timestamp:new Date(Date.now()-600000).toISOString(),   suspicious:false },
  { id:"l3", secretName:"RAZORPAY_KEY_SECRET",       action:"Accessed via log", actor:"Unknown",       ip:"45.79.12.200", timestamp:new Date(Date.now()-3600000).toISOString(),  suspicious:true  },
  { id:"l4", secretName:"SUPABASE_SERVICE_ROLE_KEY", action:"Rotation attempted",actor:"Admin A",      ip:"192.168.1.10",timestamp:new Date(Date.now()-7200000).toISOString(),  suspicious:false },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const sensColor = { critical:"#f87171", high:"#fb923c", medium:"#fbbf24" };
const statusColor = { active:"#4ade80", expired:"#f87171", needs_rotation:"#fbbf24" };

export default function AdminSecretsManager() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]       = useState<"secrets"|"logs">("secrets");
  const [secrets, setSecrets] = useState<Secret[]>(()=>load("admin_secrets_v1",seedSecrets));
  const [logs]              = useState<SecretLog[]>(()=>load("admin_secret_logs_v1",seedLogs));
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [rotating, setRotating] = useState<string|null>(null);

  const toggleVisible = (id:string) => setVisible(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  const rotate = async (s: Secret) => {
    setRotating(s.id);
    await new Promise(r=>setTimeout(r,2000));
    const updated = secrets.map(x=>x.id===s.id?{...x,status:"active" as const,lastRotated:new Date().toISOString(),expiresIn:365}:x);
    localStorage.setItem("admin_secrets_v1",JSON.stringify(updated));
    setSecrets(updated); setRotating(null);
    logAction("Secret Rotated",s.name,"Security","warning");
    toast({ title:`${s.name} rotated — update all services using this key` });
  };

  const issues = secrets.filter(s=>s.status!=="active"||s.inLogs).length;
  const suspicious = logs.filter(l=>l.suspicious).length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <KeyRound size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Secrets & Environment Variables</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Encryption · Access restriction · Log masking · Rotation · Audit trail · Unauthorized access detection</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Secrets",v:secrets.length,c:T.badgeFg},{l:"Issues",v:issues,c:issues>0?"#f87171":"#94a3b8"},{l:"In Logs (Risk)",v:secrets.filter(s=>s.inLogs).length,c:secrets.some(s=>s.inLogs)?"#f87171":"#4ade80"},{l:"Suspicious Access",v:suspicious,c:suspicious>0?"#f87171":"#94a3b8"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["secrets","Secrets",KeyRound],["logs","Access Log",Clock]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="logs"&&suspicious>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{suspicious}</span>}
          </button>
        ))}
      </div>

      {tab==="secrets"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {secrets.filter(s=>s.inLogs).length>0&&(
            <div style={{ background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.2)",borderRadius:10,padding:"10px 14px",display:"flex",gap:8 }}>
              <AlertTriangle size={13} color="#f87171" style={{ flexShrink:0,marginTop:1 }}/>
              <p style={{ fontSize:12,color:"#f87171",margin:0 }}>⚠ One or more secrets may have been exposed in application logs. Rotate immediately and review log access records.</p>
            </div>
          )}
          {secrets.map(s=>(
            <div key={s.id} style={{ background:T.card,border:`1px solid ${s.status!=="active"||s.inLogs?"rgba(248,113,113,.2)":T.border}`,borderRadius:14,padding:"16px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text }}>{s.name}</span>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{s.service}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:sensColor[s.sensitivity],background:`${sensColor[s.sensitivity]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{s.sensitivity}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:statusColor[s.status],background:`${statusColor[s.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{s.status.replace("_"," ")}</span>
                    {s.inLogs&&<span style={{ fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 8px",borderRadius:5 }}>⚠ FOUND IN LOGS</span>}
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,background:T.input,borderRadius:8,padding:"6px 12px",marginBottom:6 }}>
                    <span style={{ fontFamily:"monospace",fontSize:12,color:T.text,flex:1 }}>{visible.has(s.id)?s.maskedValue.replace(/•+/,"[masked — view in Replit secrets]"):s.maskedValue}</span>
                    <button onClick={()=>toggleVisible(s.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:2,color:T.sub }}>
                      {visible.has(s.id)?<EyeOff size={13}/>:<Eye size={13}/>}
                    </button>
                  </div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    <span style={{ fontSize:12,color:T.sub }}>Rotated: {safeDist(s.lastRotated)} ago</span>
                    {s.expiresIn&&<span style={{ fontSize:12,color:T.sub }}>Expires in: <strong style={{ color:s.expiresIn<30?"#f87171":"#4ade80" }}>{s.expiresIn} days</strong></span>}
                    <span style={{ fontSize:12,color:T.sub }}>Accesses: {s.accessCount.toLocaleString()}</span>
                    <span style={{ fontSize:12,color:T.sub }}>Last: {safeDist(s.lastAccessed)} ago</span>
                  </div>
                </div>
                <button onClick={()=>rotate(s)} disabled={rotating===s.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,background:s.status!=="active"?`linear-gradient(135deg,${A1},${A2})`:`${A1}15`,border:s.status!=="active"?"none":`1px solid ${A1}33`,color:s.status!=="active"?"#fff":T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0 }}>
                  <RefreshCw size={11} className={rotating===s.id?"animate-spin":""}/>{rotating===s.id?"Rotating…":"Rotate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden" }}>
          {logs.map((l,i)=>(
            <div key={l.id} style={{ display:"flex",gap:12,padding:"12px 18px",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none",alignItems:"center",background:l.suspicious?"rgba(248,113,113,.03)":"transparent" }}>
              {l.suspicious?<AlertTriangle size={14} color="#f87171" style={{ flexShrink:0 }}/>:<CheckCircle2 size={14} color="#4ade80" style={{ flexShrink:0 }}/>}
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:1,flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace",fontWeight:600,fontSize:12,color:T.text }}>{l.secretName}</span>
                  <span style={{ fontSize:11,color:T.sub }}>{l.action}</span>
                  {l.suspicious&&<span style={{ fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 6px",borderRadius:4 }}>SUSPICIOUS</span>}
                </div>
                <p style={{ fontSize:11,color:T.sub,margin:0 }}>By {l.actor} · IP: {l.ip} · {safeFmt(l.timestamp, "MMM d, HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
