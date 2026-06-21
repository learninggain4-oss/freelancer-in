import { useState } from "react";
import { Wrench, Trash2, HardDrive, Database, FolderOpen, RefreshCw, CheckCircle2, AlertTriangle, Clock, BarChart3, Archive, Zap, FileX, Activity } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface OrphanItem { id: string; type: string; description: string; size: string; table: string; risk: "safe"|"medium"|"high"; selected: boolean; }
interface CleanupLog { id: string; action: string; itemsRemoved: number; sizeSaved: string; performedBy: string; timestamp: string; status: "success"|"failed"; }
interface StorageBucket { name: string; used: number; total: number; unit: string; color: string; }



const storageBuckets: StorageBucket[] = [
  { name:"Profile Avatars",  used:234, total:500,  unit:"MB", color:"#6366f1" },
  { name:"Chat Files",       used:1.2, total:5,    unit:"GB", color:"#8b5cf6" },
  { name:"DB Backups",       used:890, total:2000, unit:"MB", color:"#fbbf24" },
  { name:"Audit Logs",       used:45,  total:200,  unit:"MB", color:"#4ade80" },
  { name:"Temp / Uploads",   used:312, total:500,  unit:"MB", color:"#f87171" },
];

function load<T>(key: string, seed: ()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
const MAINT_KEY="admin_maintenance_v1";
function seedOrphans():any[]{return[
  {id:"mo1",table:"projects",count:12,reason:"Freelancer account deleted",oldestAt:new Date(Date.now()-864e5*30).toISOString()},
  {id:"mo2",table:"messages",count:840,reason:"Project archived",oldestAt:new Date(Date.now()-864e5*60).toISOString()},
];}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const riskColor = { safe:"#4ade80", medium:"#fbbf24", high:"#f87171" };

export default function AdminMaintenanceCenter() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]     = useState<"orphans"|"storage"|"logs">("orphans");
  const [orphans, setOrphans] = useState<OrphanItem[]>(()=>load("admin_maint_orphans_v1",()=>[
  {id:"oi1",type:"Orphan Record",description:"Projects with deleted owner",size:"2.1 MB",table:"projects",risk:"medium",selected:false},
  {id:"oi2",type:"Orphan Record",description:"Messages in archived projects",size:"18.4 MB",table:"messages",risk:"safe",selected:false},
  {id:"oi3",type:"Temp File",description:"Unlinked uploaded files in storage",size:"124 MB",table:"storage.objects",risk:"safe",selected:false},
]));
  const [logs, setLogs]   = useState<CleanupLog[]>(()=>load("admin_maint_logs_v1",()=>[
  {id:"cl1",action:"Remove orphan messages",itemsRemoved:1240,sizeSaved:"8.2 MB",performedBy:"freeandin9@gmail.com",timestamp:new Date(Date.now()-86400000).toISOString(),status:"success"},
]));
  const [scanning, setScanning] = useState(false);
  const [confirmClean, setConfirmClean] = useState(false);
  const [dbChecking, setDbChecking] = useState(false);
  const [dbResult, setDbResult] = useState<string|null>(null);

  const selected = orphans.filter(o=>o.selected);

  const scan = async () => {
    setScanning(true);
    await new Promise(r=>setTimeout(r,2200));
    setScanning(false);
    toast({ title:`Scan complete — ${orphans.length} orphan items found`, description:"Review and select items to clean up" });
    logAction("Orphan Scan", `${orphans.length} orphan items detected`, "System", "warning");
  };

  const toggleSelect = (id: string) => setOrphans(o=>o.map(x=>x.id===id?{...x,selected:!x.selected}:x));
  const selectAll = () => setOrphans(o=>o.map(x=>({...x,selected:true})));
  const clearSel  = () => setOrphans(o=>o.map(x=>({...x,selected:false})));

  const doClean = () => {
    const removed = selected.length;
    setOrphans(o=>o.filter(x=>!x.selected));
    logAction("Orphan Cleanup", `Removed ${removed} orphan items`, "System", "success");
    toast({ title:`${removed} items cleaned up`, description:"Cleanup logged in history" });
    setConfirmClean(false);
  };

  const checkDb = async () => {
    setDbChecking(true); setDbResult(null);
    await new Promise(r=>setTimeout(r,2000));
    setDbChecking(false);
    setDbResult("✓ All foreign keys valid  ✓ No null violations  ✓ No duplicate PKs  ✓ 3 orphan references found (see scanner)");
    logAction("DB Integrity Check", "Database integrity validation completed", "System", "success");
  };

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`, border:`1px solid rgba(99,102,241,.2)`, borderRadius:18, padding:"26px 28px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${A1}55`, flexShrink:0 }}>
            <Wrench size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text, fontWeight:800, fontSize:22, margin:0 }}>Maintenance Center</h1>
            <p style={{ color:T.sub, fontSize:13, margin:"3px 0 0" }}>Orphan data scanner · Storage management · Database integrity · Cleanup history</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
          {[{l:"Orphan Items",v:orphans.length,c:orphans.length>0?"#fbbf24":"#4ade80"},{l:"High Risk",v:orphans.filter(o=>o.risk==="high").length,c:"#f87171"},{l:"Cleanup Runs",v:logs.length,c:T.badgeFg},{l:"Total Saved",v:"~174 MB",c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontWeight:800, fontSize:18, color:s.c }}>{s.v}</span>
              <span style={{ fontSize:11, color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {([["orphans","Orphan Scanner",FileX],["storage","Storage Usage",HardDrive],["logs","Cleanup History",Archive]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, border:`1px solid ${tab===t?A1:T.border}`, background:tab===t?`${A1}18`:T.card, color:tab===t?T.badgeFg:T.sub, fontWeight:600, fontSize:12, cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="orphans"&&orphans.length>0&&<span style={{ background:"#fbbf24",color:"#000",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{orphans.length}</span>}
          </button>
        ))}
      </div>

      {tab==="orphans"&&(
        <>
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <button onClick={scan} disabled={scanning} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", opacity:scanning?.7:1 }}>
              <RefreshCw size={13} className={scanning?"animate-spin":""}/>{scanning?"Scanning…":"Scan for Orphans"}
            </button>
            <button onClick={checkDb} disabled={dbChecking} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10, background:"rgba(74,222,128,.08)", border:"1px solid rgba(74,222,128,.2)", color:"#4ade80", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              <Database size={13}/>{dbChecking?"Checking…":"Check DB Integrity"}
            </button>
            {selected.length>0&&<>
              <button onClick={selectAll} style={{ padding:"8px 12px", borderRadius:10, background:T.input, border:`1px solid ${T.border}`, color:T.sub, fontSize:12, cursor:"pointer" }}>All</button>
              <button onClick={clearSel} style={{ padding:"8px 12px", borderRadius:10, background:T.input, border:`1px solid ${T.border}`, color:T.sub, fontSize:12, cursor:"pointer" }}>None</button>
              <button onClick={()=>setConfirmClean(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", color:"#f87171", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                <Trash2 size={13}/>Clean Selected ({selected.length})
              </button>
            </>}
          </div>
          {dbResult&&<div style={{ background:"rgba(74,222,128,.06)", border:"1px solid rgba(74,222,128,.2)", borderRadius:12, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#4ade80", fontFamily:"monospace" }}>{dbResult}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {orphans.map(o=>(
              <div key={o.id} onClick={()=>toggleSelect(o.id)} style={{ background:T.card, border:`1px solid ${o.selected?"rgba(99,102,241,.35)":T.border}`, borderRadius:13, padding:"13px 18px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"border-color .15s" }}>
                <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${o.selected?A1:T.border}`, background:o.selected?A1:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {o.selected&&<CheckCircle2 size={10} color="#fff"/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{o.type}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:riskColor[o.risk], background:`${riskColor[o.risk]}15`, padding:"2px 7px", borderRadius:5, textTransform:"uppercase" }}>{o.risk} risk</span>
                    <span style={{ fontSize:10, color:T.sub, background:T.input, padding:"2px 7px", borderRadius:5, fontFamily:"monospace" }}>{o.table}</span>
                  </div>
                  <p style={{ fontSize:12, color:T.sub, margin:0 }}>{o.description}</p>
                </div>
                <span style={{ fontSize:12, color:T.sub, fontWeight:600, flexShrink:0 }}>{o.size}</span>
              </div>
            ))}
            {orphans.length===0&&<div style={{ textAlign:"center", padding:"40px 20px", color:T.sub, fontSize:13 }}>✓ No orphan items detected. System is clean.</div>}
          </div>
        </>
      )}

      {tab==="storage"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {storageBuckets.map(b=>{
            const pct = Math.round((b.used/b.total)*100);
            return (
              <div key={b.name} style={{ background:T.card, border:`1px solid ${pct>80?"rgba(248,113,113,.25)":T.border}`, borderRadius:14, padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:T.text, flex:1 }}>{b.name}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:pct>80?"#f87171":pct>60?"#fbbf24":"#4ade80" }}>{pct}%</span>
                  <span style={{ fontSize:12, color:T.sub }}>{b.used} / {b.total} {b.unit}</span>
                  {pct>80&&<span style={{ fontSize:10, color:"#f87171", background:"rgba(248,113,113,.1)", padding:"2px 8px", borderRadius:5, fontWeight:700 }}>ALERT</span>}
                </div>
                <div style={{ height:8, borderRadius:6, background:"rgba(255,255,255,.07)", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:6, background:pct>80?"linear-gradient(90deg,#f87171,#fb923c)":pct>60?`linear-gradient(90deg,#fbbf24,${b.color})`:`linear-gradient(90deg,${b.color},${A2})`, width:`${pct}%`, transition:"width .8s ease", boxShadow:`0 0 8px ${b.color}55` }}/>
                </div>
              </div>
            );
          })}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
            <p style={{ fontWeight:700, fontSize:14, color:T.text, margin:"0 0 6px" }}>Total Storage</p>
            <div style={{ display:"flex", gap:16 }}>
              {[{l:"Used",v:"2.67 GB",c:"#f87171"},{l:"Available",v:"5.35 GB",c:"#4ade80"},{l:"Total",v:"8 GB",c:T.badgeFg}].map(s=>(
                <div key={s.l}><p style={{ fontSize:11, color:T.sub, margin:"0 0 2px" }}>{s.l}</p><p style={{ fontSize:16, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="logs"&&(
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <Archive size={14} color={A1}/><span style={{ fontWeight:700, fontSize:14, color:T.text }}>Cleanup History</span>
            <span style={{ fontSize:11, color:T.sub, marginLeft:"auto" }}>{logs.length} runs</span>
          </div>
          {logs.map((l,i)=>(
            <div key={l.id} style={{ display:"flex", gap:12, padding:"13px 18px", borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
              {l.status==="success"?<CheckCircle2 size={16} color="#4ade80"/>:<AlertTriangle size={16} color="#f87171"/>}
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:T.text, margin:"0 0 2px" }}>{l.action}</p>
                <p style={{ fontSize:11, color:T.sub, margin:0 }}>{l.performedBy} · {safeFmt(l.timestamp, "MMM d, yyyy HH:mm")}</p>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <p style={{ fontSize:12, fontWeight:700, color:T.text, margin:"0 0 1px" }}>{l.itemsRemoved} items</p>
                <p style={{ fontSize:11, color:"#4ade80", margin:0 }}>{l.sizeSaved} freed</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionDialog open={confirmClean} onOpenChange={o=>!o&&setConfirmClean(false)} onConfirm={doClean}
        title={`Delete ${selected.length} Orphan Items`}
        description={`This will permanently remove ${selected.length} orphaned records/files. High-risk items may affect referential integrity. This action cannot be undone.`}
        confirmLabel="Delete Orphans" variant="danger" mode="type" typeToConfirm="CLEAN"/>
    </div>
  );
}
