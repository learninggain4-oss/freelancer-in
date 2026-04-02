import { useState } from "react";
import { Users, Monitor, LogOut, AlertTriangle, CheckCircle2, Clock, RefreshCw, Wifi, WifiOff, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface Session { id:string; userId:string; username:string; email:string; role:string; device:string; ip:string; location:string; startedAt:string; lastActive:string; suspicious:boolean; deviceCount:number; }
interface SessionPolicy { id:string; label:string; value:number|boolean; type:"number"|"boolean"; description:string; }

const seedSessions = (): Session[] => [
  { id:"s1", userId:"d57d",  username:"Super Admin",  email:"freeandin@gmail.com",  role:"super_admin", device:"Chrome / macOS",  ip:"192.168.1.1",  location:"Mumbai, IN",    startedAt:new Date(Date.now()-7200000).toISOString(),  lastActive:new Date(Date.now()-120000).toISOString(),  suspicious:false, deviceCount:1 },
  { id:"s2", userId:"4821",  username:"Admin A",       email:"admin.a@fi.com",       role:"admin",       device:"Firefox / Win",   ip:"192.168.1.10", location:"Delhi, IN",     startedAt:new Date(Date.now()-3600000).toISOString(),  lastActive:new Date(Date.now()-300000).toISOString(),  suspicious:false, deviceCount:2 },
  { id:"s3", userId:"4821",  username:"Admin A",       email:"admin.a@fi.com",       role:"admin",       device:"Mobile / iOS",    ip:"103.21.58.44", location:"Delhi, IN",     startedAt:new Date(Date.now()-1800000).toISOString(),  lastActive:new Date(Date.now()-60000).toISOString(),   suspicious:false, deviceCount:2 },
  { id:"s4", userId:"2241",  username:"Admin B",       email:"admin.b@fi.com",       role:"admin",       device:"Chrome / Linux",  ip:"192.168.1.11", location:"Bangalore, IN", startedAt:new Date(Date.now()-5400000).toISOString(),  lastActive:new Date(Date.now()-3600000).toISOString(), suspicious:false, deviceCount:1 },
  { id:"s5", userId:"9901",  username:"Support1",      email:"support1@fi.com",      role:"support",     device:"Chrome / Win",    ip:"45.79.12.200", location:"Unknown",       startedAt:new Date(Date.now()-10800000).toISOString(), lastActive:new Date(Date.now()-7200000).toISOString(), suspicious:true,  deviceCount:1 },
];

const seedPolicies = (): SessionPolicy[] => [
  { id:"p1", label:"Session Limit Per User",    value:3,    type:"number",  description:"Maximum simultaneous sessions allowed per user" },
  { id:"p2", label:"Idle Timeout (minutes)",    value:30,   type:"number",  description:"Automatically expire sessions idle for this duration" },
  { id:"p3", label:"Max Session Duration (hr)", value:8,    type:"number",  description:"Force logout after this many hours regardless of activity" },
  { id:"p4", label:"Multiple Device Detection", value:true, type:"boolean", description:"Alert admins when a user logs in from multiple devices simultaneously" },
  { id:"p5", label:"Suspicious IP Alert",       value:true, type:"boolean", description:"Flag sessions from unrecognized IP ranges or locations" },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const roleColor: Record<string,string> = { super_admin:"#f87171", admin:"#a5b4fc", moderator:"#4ade80", support:"#fbbf24" };

export default function AdminSessionManager() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]         = useState<"sessions"|"policy">("sessions");
  const [sessions, setSessions] = useState<Session[]>(()=>load("admin_sessions_v1",seedSessions));
  const [policies, setPolicies] = useState<SessionPolicy[]>(()=>load("admin_session_policy_v1",seedPolicies));
  const [confirmLogout, setConfirmLogout] = useState<Session|null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [editId, setEditId]   = useState<string|null>(null);
  const [editVal, setEditVal] = useState<string|number>("");
  const [terminating, setTerminating] = useState<string|null>(null);

  const forceLogout = async (s: Session) => {
    setTerminating(s.id);
    await new Promise(r=>setTimeout(r,800));
    const updated = sessions.filter(x=>x.id!==s.id);
    localStorage.setItem("admin_sessions_v1",JSON.stringify(updated));
    setSessions(updated);
    setTerminating(null);
    logAction("Session Terminated",`Forced logout: ${s.username} (${s.ip})`,"Security","warning");
    toast({ title:`${s.username}'s session terminated` });
    setConfirmLogout(null);
  };

  const logoutAll = () => {
    const admin = sessions.filter(s=>s.userId==="d57d");
    localStorage.setItem("admin_sessions_v1",JSON.stringify(admin));
    setSessions(admin);
    logAction("All Sessions Terminated","All non-super-admin sessions force-logged out","Security","warning");
    toast({ title:"All sessions terminated",description:"Only current Super Admin session retained" });
    setConfirmAll(false);
  };

  const savePol = (id:string) => {
    const updated = policies.map(p=>p.id===id?{...p,value:p.type==="number"?Number(editVal):editVal}:p);
    localStorage.setItem("admin_session_policy_v1",JSON.stringify(updated));
    setPolicies(updated);
    toast({ title:"Session policy updated" });
    setEditId(null);
  };

  const togglePol = (id:string) => {
    const updated = policies.map(p=>p.id===id?{...p,value:!p.value}:p);
    localStorage.setItem("admin_session_policy_v1",JSON.stringify(updated));
    setPolicies(updated);
  };

  const suspicious = sessions.filter(s=>s.suspicious).length;
  const multiDevice = sessions.filter(s=>s.deviceCount>1);
  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,...s });

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Users size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Session Management</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Active session monitoring · Force logout · Multi-device detection · Idle timeout · Session policy</p>
          </div>
          <button onClick={()=>setConfirmAll(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer" }}>
            <LogOut size={13}/>Logout All
          </button>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Active Sessions",v:sessions.length,c:T.badgeFg},{l:"Suspicious",v:suspicious,c:suspicious>0?"#f87171":"#94a3b8"},{l:"Multi-Device",v:multiDevice.length,c:multiDevice.length>0?"#fbbf24":"#94a3b8"},{l:"Unique Users",v:new Set(sessions.map(s=>s.userId)).size,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["sessions","Active Sessions",Monitor],["policy","Session Policy",Shield]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="sessions"&&suspicious>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{suspicious}</span>}
          </button>
        ))}
      </div>

      {tab==="sessions"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {sessions.map(s=>(
            <div key={s.id} style={{ background:T.card,border:`1px solid ${s.suspicious?"rgba(248,113,113,.25)":T.border}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:12,alignItems:"flex-start" }}>
              <div style={{ width:38,height:38,borderRadius:11,background:`${(roleColor[s.role]||A1)}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <Monitor size={17} color={roleColor[s.role]||A1}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{s.username}</span>
                  <span style={{ fontSize:10,fontWeight:700,color:roleColor[s.role]||T.badgeFg,background:`${roleColor[s.role]||A1}15`,padding:"2px 7px",borderRadius:5 }}>{s.role}</span>
                  {s.suspicious&&<span style={{ fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 7px",borderRadius:5 }}>SUSPICIOUS</span>}
                  {s.deviceCount>1&&<span style={{ fontSize:10,color:"#fbbf24",background:"rgba(251,191,36,.1)",padding:"2px 7px",borderRadius:5 }}>multi-device ({s.deviceCount})</span>}
                </div>
                <p style={{ fontSize:12,color:T.sub,margin:"0 0 2px" }}>{s.device} · IP: {s.ip} · {s.location}</p>
                <p style={{ fontSize:11,color:T.sub,margin:0 }}>Started {safeDist(s.startedAt)} ago · Last active {safeDist(s.lastActive)} ago</p>
              </div>
              <button onClick={()=>setConfirmLogout(s)} disabled={terminating===s.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0 }}>
                <LogOut size={12}/>{terminating===s.id?"…":"Force Logout"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab==="policy"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {policies.map(p=>(
            <div key={p.id} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700,fontSize:13,color:T.text,margin:"0 0 3px" }}>{p.label}</p>
                <p style={{ fontSize:12,color:T.sub,margin:0 }}>{p.description}</p>
              </div>
              {p.type==="boolean"?(
                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:p.value?"#4ade80":"#94a3b8" }}>{p.value?"ON":"OFF"}</span>
                  <button onClick={()=>togglePol(p.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}>
                    {p.value?<ToggleRight size={28} color="#4ade80"/>:<ToggleLeft size={28} color="#94a3b8"/>}
                  </button>
                </div>
              ):editId===p.id?(
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  <Input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ ...inp(),width:70,padding:"6px 10px",fontSize:13 }}/>
                  <button onClick={()=>savePol(p.id)} style={{ padding:"6px 12px",borderRadius:8,background:`${A1}20`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer" }}>Save</button>
                  <button onClick={()=>setEditId(null)} style={{ padding:"6px 8px",borderRadius:8,background:T.input,border:`1px solid ${T.border}`,color:T.sub,fontSize:12,cursor:"pointer" }}>×</button>
                </div>
              ):(
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontWeight:800,fontSize:16,color:T.badgeFg }}>{String(p.value)}</span>
                  <button onClick={()=>{setEditId(p.id);setEditVal(p.value as number);}} style={{ fontSize:10,color:T.badgeFg,background:T.badge,border:"none",borderRadius:5,padding:"2px 8px",cursor:"pointer" }}>edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmActionDialog open={!!confirmLogout} onOpenChange={o=>!o&&setConfirmLogout(null)} onConfirm={()=>confirmLogout&&forceLogout(confirmLogout)}
        title={`Force logout ${confirmLogout?.username}?`}
        description={`This will immediately terminate ${confirmLogout?.username}'s session on ${confirmLogout?.device} (${confirmLogout?.ip}). They will need to log in again.`}
        confirmLabel="Force Logout" variant="warning"/>
      <ConfirmActionDialog open={confirmAll} onOpenChange={o=>!o&&setConfirmAll(false)} onConfirm={logoutAll}
        title="Terminate ALL Sessions?"
        description="This will force-logout every active user and admin except your current Super Admin session. All users will need to log back in."
        confirmLabel="Logout All" variant="danger" mode="type" typeToConfirm="LOGOUT ALL"/>
    </div>
  );
}

