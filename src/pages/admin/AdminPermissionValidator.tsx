import { useState } from "react";
import { UserCog, Shield, Eye, Play, CheckCircle2, AlertTriangle, History, ChevronDown, ChevronRight, Lock, Unlock, GitCompare, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface Role { id:string; name:string; level:number; inheritsFrom?:string; permissions:string[]; color:string; userCount:number; }
interface PermConflict { id:string; role1:string; role2:string; permission:string; conflictType:"overlap"|"contradiction"; severity:"low"|"medium"|"high"; }
interface PermAudit { id:string; admin:string; role:string; change:string; timestamp:string; rolledBack:boolean; }

const PERMISSIONS = [
  "view_users","edit_users","delete_users","view_financials","approve_withdrawals",
  "view_jobs","edit_jobs","delete_jobs","view_audit_logs","manage_roles",
  "manage_settings","export_data","view_sensitive_data","manage_backups","emergency_access",
];

const ROLES: Role[] = [
  { id:"r1", name:"super_admin",  level:5, inheritsFrom:undefined,       color:"#f87171", userCount:1,  permissions:PERMISSIONS },
  { id:"r2", name:"admin",        level:4, inheritsFrom:"moderator",      color:"#a5b4fc", userCount:3,  permissions:["view_users","edit_users","view_financials","approve_withdrawals","view_jobs","edit_jobs","view_audit_logs","export_data","manage_backups"] },
  { id:"r3", name:"moderator",    level:3, inheritsFrom:"support",        color:"#4ade80", userCount:5,  permissions:["view_users","view_financials","view_jobs","edit_jobs","view_audit_logs"] },
  { id:"r4", name:"support",      level:2, inheritsFrom:"viewer",         color:"#fbbf24", userCount:8,  permissions:["view_users","view_jobs","view_audit_logs"] },
  { id:"r5", name:"viewer",       level:1, inheritsFrom:undefined,        color:"#94a3b8", userCount:12, permissions:["view_users","view_jobs"] },
];

const CONFLICTS: PermConflict[] = [
  { id:"c1", role1:"admin",     role2:"moderator", permission:"export_data",         conflictType:"overlap",        severity:"medium" },
  { id:"c2", role1:"moderator", role2:"support",   permission:"edit_jobs",           conflictType:"overlap",        severity:"low" },
  { id:"c3", role1:"admin",     role2:"support",   permission:"view_sensitive_data", conflictType:"contradiction",  severity:"high" },
];

const PERM_AUDIT: PermAudit[] = [
  { id:"a1", admin:"Super Admin", role:"admin",     change:"Added: export_data permission",             timestamp: new Date(Date.now()-3600000).toISOString(),   rolledBack:false },
  { id:"a2", admin:"Admin A",     role:"moderator", change:"Removed: approve_withdrawals permission",   timestamp: new Date(Date.now()-86400000).toISOString(),  rolledBack:false },
  { id:"a3", admin:"Super Admin", role:"support",   change:"Added: view_sensitive_data — ROLLED BACK",  timestamp: new Date(Date.now()-864e5*3).toISOString(),   rolledBack:true },
];

export default function AdminPermissionValidator() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]           = useState<"roles"|"simulate"|"conflicts"|"audit">("roles");
  const [expanded, setExpanded] = useState<string|null>(null);
  const [simRole, setSimRole]   = useState("admin");
  const [simUser, setSimUser]   = useState("test@example.com");
  const [simResult, setSimResult]= useState<{perm:string;granted:boolean}[]|null>(null);
  const [simRunning, setSimRunning] = useState(false);

  const simulate = async () => {
    setSimRunning(true);
    await new Promise(r=>setTimeout(r,1200));
    const role = ROLES.find(r=>r.name===simRole);
    const perms = PERMISSIONS.map(p=>({ perm:p, granted:role?.permissions.includes(p)||false }));
    setSimResult(perms);
    setSimRunning(false);
    logAction("Permission Simulation",`Simulated ${simRole} for ${simUser}`,"Security","success");
  };

  const resolveConflict = (id:string) => {
    logAction("Permission Conflict Reviewed",`Conflict ${id} marked for review`,"Security","warning");
    toast({ title:"Conflict flagged for review", description:"Added to permission audit queue" });
  };

  const sev = { low:"#4ade80", medium:"#fbbf24", high:"#f87171" };
  const inp=(s?:object)=>({ background:T.input, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, ...s });

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`, border:`1px solid rgba(99,102,241,.2)`, borderRadius:18, padding:"26px 28px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${A1}55`, flexShrink:0 }}>
            <UserCog size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text, fontWeight:800, fontSize:22, margin:0 }}>Permission Validator</h1>
            <p style={{ color:T.sub, fontSize:13, margin:"3px 0 0" }}>Role inheritance · Permission simulation · Conflict detection · Audit history</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
          {[{l:"Roles Defined",v:ROLES.length,c:T.badgeFg},{l:"Permissions",v:PERMISSIONS.length,c:"#4ade80"},{l:"Conflicts",v:CONFLICTS.length,c:CONFLICTS.length>0?"#f87171":"#4ade80"},{l:"High Severity",v:CONFLICTS.filter(c=>c.severity==="high").length,c:"#f87171"}].map(s=>(
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontWeight:800, fontSize:18, color:s.c }}>{s.v}</span>
              <span style={{ fontSize:11, color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {([["roles","Role Hierarchy",Shield],["simulate","Simulate Role",Play],["conflicts","Conflicts",AlertTriangle],["audit","Permission Audit",History]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 14px", borderRadius:10, border:`1px solid ${tab===t?A1:T.border}`, background:tab===t?`${A1}18`:T.card, color:tab===t?T.badgeFg:T.sub, fontWeight:600, fontSize:12, cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="conflicts"&&CONFLICTS.filter(c=>c.severity==="high").length>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{CONFLICTS.filter(c=>c.severity==="high").length}</span>}
          </button>
        ))}
      </div>

      {tab==="roles"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[...ROLES].sort((a,b)=>b.level-a.level).map(role=>(
            <div key={role.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", cursor:"pointer" }} onClick={()=>setExpanded(expanded===role.id?null:role.id)}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:role.color, flexShrink:0, boxShadow:`0 0 8px ${role.color}` }}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:14, color:role.color }}>{role.name}</span>
                    <span style={{ fontSize:11, color:T.sub }}>Level {role.level}</span>
                    {role.inheritsFrom&&<span style={{ fontSize:10, color:T.sub, background:T.input, padding:"2px 7px", borderRadius:5 }}>inherits: {role.inheritsFrom}</span>}
                    <span style={{ fontSize:10, color:T.sub }}>{role.permissions.length} permissions</span>
                    <span style={{ fontSize:10, color:T.sub }}>{role.userCount} users</span>
                  </div>
                </div>
                {expanded===role.id?<ChevronDown size={14} color={T.sub}/>:<ChevronRight size={14} color={T.sub}/>}
              </div>
              {expanded===role.id&&(
                <div style={{ padding:"0 18px 16px", borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                  <p style={{ fontSize:11, color:T.sub, fontWeight:600, margin:"0 0 8px", textTransform:"uppercase", letterSpacing:".06em" }}>Permissions</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {PERMISSIONS.map(p=>(
                      <span key={p} style={{ fontSize:10, fontFamily:"monospace", color:role.permissions.includes(p)?T.text:"#94a3b8", background:role.permissions.includes(p)?`${role.color}15`:T.input, border:`1px solid ${role.permissions.includes(p)?role.color+"33":T.border}`, padding:"3px 8px", borderRadius:6, display:"flex", alignItems:"center", gap:4 }}>
                        {role.permissions.includes(p)?<CheckCircle2 size={9} color={role.color}/>:<Lock size={9} color="#94a3b8"/>}{p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="simulate"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 22px" }}>
            <h3 style={{ color:T.text, fontWeight:700, fontSize:15, margin:"0 0 14px" }}>Role Simulation Environment</h3>
            <p style={{ fontSize:12, color:T.sub, margin:"0 0 14px", lineHeight:1.6 }}>Preview exactly what a user with a specific role can and cannot do before applying changes in production. This is a read-only simulation — no actual permissions are modified.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:11, color:T.sub, fontWeight:600, display:"block", marginBottom:5 }}>ROLE TO SIMULATE</label>
                <select value={simRole} onChange={e=>setSimRole(e.target.value)} style={{ ...inp(), width:"100%", padding:"10px 14px", fontSize:13 }}>
                  {ROLES.map(r=><option key={r.id} value={r.name}>{r.name} (Level {r.level})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, color:T.sub, fontWeight:600, display:"block", marginBottom:5 }}>TEST USER (for logging)</label>
                <Input value={simUser} onChange={e=>setSimUser(e.target.value)} placeholder="user@example.com" style={inp()}/>
              </div>
            </div>
            <button onClick={simulate} disabled={simRunning} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", opacity:simRunning?.7:1 }}>
              <Play size={13}/>{simRunning?"Simulating…":"Run Simulation"}
            </button>
          </div>
          {simResult&&(
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <CheckCircle2 size={14} color="#4ade80"/>
                <span style={{ fontWeight:700, fontSize:14, color:T.text }}>Results for role: <span style={{ color:ROLES.find(r=>r.name===simRole)?.color }}>{simRole}</span></span>
                <span style={{ fontSize:11, color:"#4ade80", marginLeft:"auto" }}>{simResult.filter(p=>p.granted).length}/{simResult.length} granted</span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {simResult.map(p=>(
                  <span key={p.perm} style={{ fontSize:10, fontFamily:"monospace", color:p.granted?T.text:"#94a3b8", background:p.granted?"rgba(74,222,128,.08)":"rgba(148,163,184,.06)", border:`1px solid ${p.granted?"rgba(74,222,128,.2)":T.border}`, padding:"4px 10px", borderRadius:7, display:"flex", alignItems:"center", gap:4 }}>
                    {p.granted?<Unlock size={9} color="#4ade80"/>:<Lock size={9} color="#94a3b8"/>}{p.perm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="conflicts"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ background:"rgba(248,113,113,.05)", border:"1px solid rgba(248,113,113,.15)", borderRadius:12, padding:"10px 14px", marginBottom:4, display:"flex", gap:8 }}>
            <AlertTriangle size={13} color="#f87171" style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:12, color:T.sub, margin:0, lineHeight:1.6 }}>Permission conflicts indicate roles that have overlapping or contradictory permissions. Overlaps may cause unexpected access; contradictions may block legitimate access. Review and resolve each.</p>
          </div>
          {CONFLICTS.map(c=>(
            <div key={c.id} style={{ background:T.card, border:`1px solid ${c.severity==="high"?"rgba(248,113,113,.3)":T.border}`, borderRadius:13, padding:"14px 18px", display:"flex", gap:12, alignItems:"center" }}>
              <AlertTriangle size={16} color={(sev as Record<string,string>)[c.severity]} style={{ flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace", fontSize:12, color:ROLES.find(r=>r.name===c.role1)?.color||T.text, fontWeight:700 }}>{c.role1}</span>
                  <span style={{ fontSize:11, color:T.sub }}>↔</span>
                  <span style={{ fontFamily:"monospace", fontSize:12, color:ROLES.find(r=>r.name===c.role2)?.color||T.text, fontWeight:700 }}>{c.role2}</span>
                  <span style={{ fontFamily:"monospace", fontSize:10, color:T.badgeFg, background:T.badge, padding:"2px 7px", borderRadius:5 }}>{c.permission}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:(sev as Record<string,string>)[c.severity], background:`${(sev as Record<string,string>)[c.severity]}15`, padding:"2px 7px", borderRadius:5, textTransform:"uppercase" }}>{c.severity}</span>
                  <span style={{ fontSize:10, color:c.conflictType==="contradiction"?"#f87171":"#fbbf24", background:c.conflictType==="contradiction"?"rgba(248,113,113,.1)":"rgba(251,191,36,.1)", padding:"2px 7px", borderRadius:5, textTransform:"capitalize" }}>{c.conflictType}</span>
                </div>
              </div>
              <button onClick={()=>resolveConflict(c.id)} style={{ padding:"6px 13px", borderRadius:8, background:`${A1}15`, border:`1px solid ${A1}33`, color:T.badgeFg, fontSize:11, fontWeight:600, cursor:"pointer", flexShrink:0 }}>Review</button>
            </div>
          ))}
        </div>
      )}

      {tab==="audit"&&(
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <History size={14} color={A1}/><span style={{ fontWeight:700, fontSize:14, color:T.text }}>Permission Change History</span>
          </div>
          {PERM_AUDIT.map((a,i)=>(
            <div key={a.id} style={{ display:"flex", gap:12, padding:"13px 18px", borderBottom:i<PERM_AUDIT.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:a.rolledBack?"#f87171":"#4ade80", flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, color:T.text, fontWeight:600, margin:"0 0 2px" }}>{a.change}</p>
                <p style={{ fontSize:11, color:T.sub, margin:0 }}>Role: <span style={{ color:ROLES.find(r=>r.name===a.role)?.color }}>{a.role}</span> · by {a.admin} · {format(new Date(a.timestamp),"MMM d, HH:mm")}</p>
              </div>
              {a.rolledBack&&<span style={{ fontSize:10, color:"#f87171", background:"rgba(248,113,113,.1)", padding:"2px 8px", borderRadius:5, fontWeight:700 }}>ROLLED BACK</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
