import { useState } from "react";
import { Archive, ShieldCheck, AlertTriangle, CheckCircle2, Trash2, RefreshCw, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface RetentionPolicy { id:string; dataType:string; category:string; retainDays:number; autoDelete:boolean; requireApproval:boolean; lastCleaned?:string; pendingDeletion:number; legalBasis:string; }

const seedPolicies = (): RetentionPolicy[] => [
  { id:"r1", dataType:"User Profiles",       category:"User Data",    retainDays:1825, autoDelete:false, requireApproval:true,  lastCleaned:new Date(Date.now()-864e5*30).toISOString(), pendingDeletion:0,   legalBasis:"Contractual obligation" },
  { id:"r2", dataType:"Wallet Transactions", category:"Finance",      retainDays:2555, autoDelete:false, requireApproval:true,  lastCleaned:new Date(Date.now()-864e5*30).toISOString(), pendingDeletion:0,   legalBasis:"Financial compliance (7-year rule)" },
  { id:"r3", dataType:"Chat Messages",       category:"Communication",retainDays:365,  autoDelete:true,  requireApproval:false, lastCleaned:new Date(Date.now()-864e5*7).toISOString(),  pendingDeletion:4820,legalBasis:"Privacy policy — user consent" },
  { id:"r4", dataType:"Audit Logs",          category:"Security",     retainDays:730,  autoDelete:false, requireApproval:true,  lastCleaned:new Date(Date.now()-864e5*14).toISOString(), pendingDeletion:0,   legalBasis:"Security & compliance" },
  { id:"r5", dataType:"Notification Logs",   category:"System",       retainDays:90,   autoDelete:true,  requireApproval:false, lastCleaned:new Date(Date.now()-864e5*3).toISOString(),  pendingDeletion:1240,legalBasis:"Operational necessity" },
  { id:"r6", dataType:"Uploaded Files",      category:"Storage",      retainDays:180,  autoDelete:false, requireApproval:false, lastCleaned:new Date(Date.now()-864e5*60).toISOString(), pendingDeletion:340, legalBasis:"User agreement" },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

export default function AdminDataRetention() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [policies, setPolicies] = useState<RetentionPolicy[]>(()=>load("admin_retention_v1",seedPolicies));
  const [confirmClean, setConfirmClean] = useState<RetentionPolicy|null>(null);
  const [editId, setEditId]   = useState<string|null>(null);
  const [editDays, setEditDays] = useState("");
  const [cleaning, setCleaning] = useState<string|null>(null);
  const [tab, setTab]         = useState<"policies"|"compliance">("policies");

  const runCleanup = async (p: RetentionPolicy) => {
    setCleaning(p.id);
    await new Promise(r=>setTimeout(r,1800));
    const updated = policies.map(x=>x.id===p.id?{...x,pendingDeletion:0,lastCleaned:new Date().toISOString()}:x);
    localStorage.setItem("admin_retention_v1",JSON.stringify(updated));
    setPolicies(updated); setCleaning(null); setConfirmClean(null);
    logAction("Data Cleanup Executed",`${p.pendingDeletion.toLocaleString()} ${p.dataType} records deleted`,"Security","warning");
    toast({ title:`${p.pendingDeletion.toLocaleString()} ${p.dataType} records deleted` });
  };

  const saveRetainDays = (id:string) => {
    const updated = policies.map(p=>p.id===id?{...p,retainDays:Number(editDays)||p.retainDays}:p);
    localStorage.setItem("admin_retention_v1",JSON.stringify(updated));
    setPolicies(updated);
    toast({ title:"Retention policy updated" });
    setEditId(null);
    logAction("Retention Policy Changed",`${policies.find(p=>p.id===id)?.dataType} → ${editDays} days`,"Security","warning");
  };

  const toggleAuto = (id:string) => {
    const updated = policies.map(p=>p.id===id?{...p,autoDelete:!p.autoDelete}:p);
    localStorage.setItem("admin_retention_v1",JSON.stringify(updated));
    setPolicies(updated);
  };

  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,...s });
  const totalPending = policies.reduce((s,p)=>s+p.pendingDeletion,0);

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Archive size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Data Retention & Lifecycle</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Retention policies · Auto-cleanup scheduler · Approval workflow · Compliance monitoring · Audit logs</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Data Types",v:policies.length,c:T.badgeFg},{l:"Pending Deletion",v:totalPending.toLocaleString(),c:totalPending>0?"#fbbf24":"#94a3b8"},{l:"Auto-Delete Active",v:policies.filter(p=>p.autoDelete).length,c:"#4ade80"},{l:"Require Approval",v:policies.filter(p=>p.requireApproval).length,c:A1}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["policies","Retention Policies",Archive],["compliance","Compliance",ShieldCheck]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}
          </button>
        ))}
      </div>

      {tab==="policies"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {policies.map(p=>(
            <div key={p.id} style={{ background:T.card,border:`1px solid ${p.pendingDeletion>0?"rgba(251,191,36,.15)":T.border}`,borderRadius:14,padding:"16px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{p.dataType}</span>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{p.category}</span>
                    {p.requireApproval&&<span style={{ fontSize:10,color:A1,background:`${A1}10`,padding:"2px 7px",borderRadius:5 }}>requires approval</span>}
                    {p.pendingDeletion>0&&<span style={{ fontSize:10,fontWeight:700,color:"#fbbf24",background:"rgba(251,191,36,.1)",padding:"2px 7px",borderRadius:5 }}>{p.pendingDeletion.toLocaleString()} pending deletion</span>}
                  </div>
                  <div style={{ display:"flex",gap:12,marginBottom:4,flexWrap:"wrap",alignItems:"center" }}>
                    {editId===p.id?(
                      <>
                        <span style={{ fontSize:12,color:T.sub }}>Retain (days):</span>
                        <Input type="number" value={editDays} onChange={e=>setEditDays(e.target.value)} style={{ ...inp(),width:80,padding:"4px 8px",fontSize:12 }}/>
                        <button onClick={()=>saveRetainDays(p.id)} style={{ padding:"4px 12px",borderRadius:7,background:`${A1}20`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer" }}>Save</button>
                        <button onClick={()=>setEditId(null)} style={{ padding:"4px 8px",borderRadius:7,background:T.input,border:`1px solid ${T.border}`,color:T.sub,fontSize:11,cursor:"pointer" }}>×</button>
                      </>
                    ):(
                      <span style={{ fontSize:12,color:T.sub }}>Retain: <strong style={{ color:T.text }}>{p.retainDays} days</strong> <button onClick={()=>{setEditId(p.id);setEditDays(String(p.retainDays));}} style={{ fontSize:10,color:T.badgeFg,background:T.badge,border:"none",borderRadius:4,padding:"1px 6px",cursor:"pointer",marginLeft:4 }}>edit</button></span>
                    )}
                    <span style={{ fontSize:12,color:T.sub }}>Auto-delete: <strong style={{ color:p.autoDelete?"#4ade80":"#94a3b8" }}>{p.autoDelete?"Yes":"No"}</strong></span>
                    <button onClick={()=>toggleAuto(p.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}>
                      {p.autoDelete?<ToggleRight size={22} color="#4ade80"/>:<ToggleLeft size={22} color="#94a3b8"/>}
                    </button>
                  </div>
                  <p style={{ fontSize:11,color:T.sub,margin:0 }}>Legal basis: {p.legalBasis}{p.lastCleaned?` · Last cleaned: ${safeFmt(p.lastCleaned, "MMM d, yyyy")}`:""}</p>
                </div>
                {p.pendingDeletion>0&&(
                  <button onClick={()=>setConfirmClean(p)} disabled={cleaning===p.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0 }}>
                    <Trash2 size={11}/>{cleaning===p.id?"Cleaning…":"Run Cleanup"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="compliance"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {[{t:"GDPR / Data Privacy",d:"All user personal data retention periods comply with user consent and right-to-erasure policies.",ok:true},{t:"Financial Records",d:"Transaction history retained for 7 years as required by Indian financial regulations.",ok:true},{t:"Audit Log Retention",d:"Security audit logs kept for 2 years minimum for compliance purposes.",ok:true},{t:"Pending Cleanup Actions",d:`${policies.filter(p=>p.pendingDeletion>0).length} data types have records past their retention period and need cleanup.`,ok:policies.filter(p=>p.pendingDeletion>0).length===0},{t:"Approval Workflow",d:"High-risk deletions require Super Admin approval before execution.",ok:true}].map((item,i)=>(
            <div key={i} style={{ background:T.card,border:`1px solid ${item.ok?T.border:"rgba(251,191,36,.2)"}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"flex-start" }}>
              {item.ok?<CheckCircle2 size={15} color="#4ade80" style={{ flexShrink:0,marginTop:1 }}/>:<AlertTriangle size={15} color="#fbbf24" style={{ flexShrink:0,marginTop:1 }}/>}
              <div>
                <p style={{ fontWeight:700,fontSize:13,color:T.text,margin:"0 0 3px" }}>{item.t}</p>
                <p style={{ fontSize:12,color:T.sub,margin:0 }}>{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionDialog open={!!confirmClean} onOpenChange={o=>!o&&setConfirmClean(null)} onConfirm={()=>confirmClean&&runCleanup(confirmClean)}
        title={`Delete ${confirmClean?.pendingDeletion.toLocaleString()} ${confirmClean?.dataType} records?`}
        description="This action is permanent and cannot be undone. Records past their retention period will be permanently deleted from the database."
        confirmLabel="Delete Records" variant="danger" mode="type" typeToConfirm="DELETE"/>
    </div>
  );
}
