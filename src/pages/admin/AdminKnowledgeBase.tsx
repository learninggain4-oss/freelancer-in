import { useState } from "react";
import { BookOpen, User, CheckCircle2, Clock, Plus, Search, Shield, Users, FileText, Award } from "lucide-react";
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

interface Guide { id:string; title:string; category:string; role:string[]; lastUpdated:string; updatedBy:string; content:string; essential:boolean; }
interface BackupAdmin { id:string; name:string; email:string; role:string; coveredAreas:string[]; trainingCompleted:boolean; lastActive:string; }
interface TrainingLog { id:string; admin:string; guide:string; completedAt:string; passed:boolean; }
interface Checklist { id:string; task:string; category:string; completed:boolean; completedAt?:string; completedBy?:string; }

const seedGuides = (): Guide[] => [
  { id:"g1", title:"Emergency Withdrawal Freeze Procedure",  category:"Emergency",    role:["super_admin"],              lastUpdated:new Date(Date.now()-864e5*7).toISOString(),   updatedBy:"Super Admin",  content:"1. Navigate to Finance → Wallet Control. 2. Toggle FREEZE_WITHDRAWALS to ON. 3. Post status update to system banner. 4. Notify payment gateway via admin portal. 5. Document reason in audit log.", essential:true },
  { id:"g2", title:"User Account Suspension Guide",          category:"User Mgmt",    role:["super_admin","admin"],      lastUpdated:new Date(Date.now()-864e5*14).toISOString(),  updatedBy:"Admin A",       content:"Only suspend after reviewing all evidence. 1. Check user activity logs. 2. Review reports against user. 3. Use Admin → User Management → Suspend with reason. 4. Email user with reference ID.", essential:true },
  { id:"g3", title:"Database Backup Verification",           category:"Technical",    role:["super_admin"],              lastUpdated:new Date(Date.now()-864e5*3).toISOString(),   updatedBy:"Super Admin",  content:"Weekly: Navigate to System Infrastructure → High Availability → Backup Systems. Click Verify Backup to confirm latest backup integrity. Log result.", essential:false },
  { id:"g4", title:"Bulk Operation Safety Checklist",        category:"Operations",   role:["super_admin","admin"],      lastUpdated:new Date(Date.now()-864e5*30).toISOString(),  updatedBy:"Super Admin",  content:"Before any bulk op: 1. Use Preview Mode. 2. Get second-admin sign-off for high-risk ops. 3. Confirm undo is available. 4. Run during off-peak hours.", essential:false },
  { id:"g5", title:"New Admin Onboarding Checklist",         category:"Onboarding",   role:["super_admin"],              lastUpdated:new Date(Date.now()-864e5*60).toISOString(),  updatedBy:"Super Admin",  content:"1. Create account. 2. Assign role with minimum required permissions. 3. Complete all required training guides. 4. Assign backup admin coverage area. 5. Enable 2FA before first login.", essential:true },
];

const seedBackups = (): BackupAdmin[] => [
  { id:"ba1", name:"Admin A",   email:"admin.a@fi.com",   role:"admin",  coveredAreas:["User Management","Finance","KYC"], trainingCompleted:true,  lastActive:new Date(Date.now()-300000).toISOString()   },
  { id:"ba2", name:"Admin B",   email:"admin.b@fi.com",   role:"admin",  coveredAreas:["Technical","System Monitoring"],  trainingCompleted:true,  lastActive:new Date(Date.now()-3600000).toISOString()  },
  { id:"ba3", name:"Admin C",   email:"admin.c@fi.com",   role:"admin",  coveredAreas:["Content","Moderation"],           trainingCompleted:false, lastActive:new Date(Date.now()-86400000).toISOString() },
];

const seedChecklist = (): Checklist[] => [
  { id:"c1", task:"Verify daily backup completed",        category:"Maintenance", completed:true,  completedAt:new Date(Date.now()-43200000).toISOString(),  completedBy:"System" },
  { id:"c2", task:"Review new KYC submissions",           category:"Compliance",  completed:true,  completedAt:new Date(Date.now()-7200000).toISOString(),   completedBy:"Admin A" },
  { id:"c3", task:"Check failed job queue",               category:"Technical",   completed:false },
  { id:"c4", task:"Review suspended user appeals",        category:"User Mgmt",   completed:false },
  { id:"c5", task:"Monitor withdrawal queue",             category:"Finance",     completed:true,  completedAt:new Date(Date.now()-1800000).toISOString(),   completedBy:"Admin B" },
  { id:"c6", task:"Review platform health metrics",       category:"Monitoring",  completed:false },
  { id:"c7", task:"Rotate any expiring API keys",         category:"Security",    completed:false },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

export default function AdminKnowledgeBase() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]         = useState<"guides"|"backup"|"checklist">("guides");
  const [guides]              = useState<Guide[]>(()=>load("admin_kb_guides_v1",seedGuides));
  const [backups]             = useState<BackupAdmin[]>(()=>load("admin_kb_backups_v1",seedBackups));
  const [checklist, setChecklist] = useState<Checklist[]>(()=>load("admin_kb_checklist_v1",seedChecklist));
  const [expanded, setExpanded] = useState<string|null>(null);
  const [search, setSearch]   = useState("");

  const toggleTask = (id:string) => {
    const item = checklist.find(c=>c.id===id)!;
    const updated = checklist.map(c=>c.id===id?{...c,completed:!c.completed,completedAt:!c.completed?new Date().toISOString():undefined,completedBy:!c.completed?"Super Admin":undefined}:c);
    localStorage.setItem("admin_kb_checklist_v1",JSON.stringify(updated));
    setChecklist(updated);
    if(!item.completed) toast({ title:`"${item.task}" marked complete` });
  };

  const filteredGuides = guides.filter(g=>!search||g.title.toLowerCase().includes(search.toLowerCase())||g.category.toLowerCase().includes(search.toLowerCase()));
  const incomplete = checklist.filter(c=>!c.completed).length;
  const noTraining = backups.filter(b=>!b.trainingCompleted).length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <BookOpen size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Admin Knowledge & Operations</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Documentation · Training guides · Backup admin assignments · Daily checklists · Role knowledge</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Guides",v:guides.length,c:T.badgeFg},{l:"Essential Guides",v:guides.filter(g=>g.essential).length,c:A1},{l:"Pending Checklist",v:incomplete,c:incomplete>0?"#fbbf24":"#4ade80"},{l:"Training Gaps",v:noTraining,c:noTraining>0?"#f87171":"#4ade80"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["guides","Guides",BookOpen],["backup","Backup Admins",Users],["checklist","Daily Checklist",CheckCircle2]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="checklist"&&incomplete>0&&<span style={{ background:"#fbbf24",color:"#000",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{incomplete}</span>}
          </button>
        ))}
      </div>

      {tab==="guides"&&(
        <>
          <div style={{ position:"relative",marginBottom:12 }}>
            <Search size={13} style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:T.sub }}/>
            <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search guides…" style={{ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,paddingLeft:32,fontSize:12 }}/>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {filteredGuides.map(g=>(
              <div key={g.id} style={{ background:T.card,border:`1px solid ${expanded===g.id?A1:T.border}`,borderRadius:14,overflow:"hidden" }}>
                <button onClick={()=>setExpanded(expanded===g.id?null:g.id)} style={{ width:"100%",display:"flex",gap:12,padding:"14px 18px",alignItems:"center",background:"none",border:"none",cursor:"pointer",textAlign:"left" as const }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{g.title}</span>
                      <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{g.category}</span>
                      {g.essential&&<span style={{ fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 7px",borderRadius:5 }}>ESSENTIAL</span>}
                    </div>
                    <p style={{ fontSize:11,color:T.sub,margin:0 }}>Roles: {g.role.join(", ")} · Updated {safeDist(g.lastUpdated)} ago by {g.updatedBy}</p>
                  </div>
                  <span style={{ color:T.sub,fontSize:14 }}>{expanded===g.id?"▲":"▼"}</span>
                </button>
                {expanded===g.id&&(
                  <div style={{ padding:"0 18px 16px",borderTop:`1px solid ${T.border}` }}>
                    <p style={{ fontSize:12,color:T.text,lineHeight:1.8,margin:"12px 0 0",whiteSpace:"pre-line" }}>{g.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab==="backup"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          <div style={{ background:"rgba(99,102,241,.06)",border:"1px solid rgba(99,102,241,.15)",borderRadius:10,padding:"10px 14px",marginBottom:4,display:"flex",gap:8 }}>
            <Shield size={13} color={T.badgeFg} style={{ flexShrink:0,marginTop:1 }}/>
            <p style={{ fontSize:12,color:T.sub,margin:0,lineHeight:1.6 }}>Backup admins are secondary operators assigned to cover specific platform areas. They ensure the system can be managed even when the primary admin is unavailable.</p>
          </div>
          {backups.map(b=>(
            <div key={b.id} style={{ background:T.card,border:`1px solid ${!b.trainingCompleted?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"flex-start" }}>
              <div style={{ width:38,height:38,borderRadius:11,background:`${A1}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <User size={17} color={A1}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{b.name}</span>
                  <span style={{ fontSize:10,color:T.sub }}>{b.email}</span>
                  {b.trainingCompleted?<span style={{ fontSize:10,color:"#4ade80" }}>✓ trained</span>:<span style={{ fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,.1)",padding:"2px 7px",borderRadius:5 }}>TRAINING INCOMPLETE</span>}
                </div>
                <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:4 }}>
                  {b.coveredAreas.map(a=><span key={a} style={{ fontSize:10,color:T.badgeFg,background:T.badge,padding:"2px 8px",borderRadius:5 }}>{a}</span>)}
                </div>
                <p style={{ fontSize:11,color:T.sub,margin:0 }}>Last active: {safeDist(b.lastActive)} ago</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="checklist"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
            <span style={{ fontSize:12,color:T.sub }}>Today's daily checklist — {checklist.filter(c=>c.completed).length}/{checklist.length} complete</span>
            <span style={{ fontWeight:700,fontSize:13,color:incomplete===0?"#4ade80":"#fbbf24" }}>{incomplete===0?"✓ All done":""+incomplete+" remaining"}</span>
          </div>
          {checklist.map(c=>(
            <div key={c.id} style={{ background:T.card,border:`1px solid ${c.completed?T.border:"rgba(251,191,36,.1)"}`,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center",cursor:"pointer" }} onClick={()=>toggleTask(c.id)}>
              <div style={{ width:20,height:20,borderRadius:6,border:`2px solid ${c.completed?"#4ade80":T.border}`,background:c.completed?"rgba(74,222,128,.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {c.completed&&<CheckCircle2 size={12} color="#4ade80"/>}
              </div>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:13,color:c.completed?T.sub:T.text,fontWeight:c.completed?400:600,textDecoration:c.completed?"line-through":"none" }}>{c.task}</span>
                <div style={{ display:"flex",gap:8,marginTop:2 }}>
                  <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"1px 6px",borderRadius:4 }}>{c.category}</span>
                  {c.completedAt&&c.completedBy&&<span style={{ fontSize:10,color:T.sub }}>by {c.completedBy} · {safeFmt(c.completedAt, "HH:mm")}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
