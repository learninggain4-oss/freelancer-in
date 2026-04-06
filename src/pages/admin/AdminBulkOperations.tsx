import { useState } from "react";
import { Layers, AlertTriangle, CheckCircle2, Eye, RotateCcw, Play, List, Clock } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
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

interface BulkOp { id:string; name:string; description:string; target:string; count:number; status:"preview"|"pending_approval"|"running"|"completed"|"failed"|"cancelled"|"undone"; risk:"low"|"medium"|"high"; createdAt:string; completedAt?:string; canUndo:boolean; executedBy?:string; errorMsg?:string; }


function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor: Record<string,string> = { preview:A1, pending_approval:"#fbbf24", running:"#fbbf24", completed:"#4ade80", failed:"#f87171", cancelled:"#94a3b8", undone:"#fb923c" };
const riskColor = { low:"#4ade80", medium:"#fbbf24", high:"#f87171" };

export default function AdminBulkOperations() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [ops, setOps]   = useState<BulkOp[]>([]);
  const [tab, setTab]   = useState<"ops"|"logs">("ops");
  const [confirmOp, setConfirmOp] = useState<BulkOp|null>(null);
  const [confirmUndo, setConfirmUndo] = useState<BulkOp|null>(null);
  const [executing, setExecuting] = useState<string|null>(null);
  const [undoing, setUndoing]     = useState<string|null>(null);

  const executeOp = async (op: BulkOp) => {
    setExecuting(op.id);
    const updated1 = ops.map(x=>x.id===op.id?{...x,status:"running" as const}:x);
    setOps(updated1);
    await new Promise(r=>setTimeout(r,2000));
    const updated2 = ops.map(x=>x.id===op.id?{...x,status:"completed" as const,completedAt:new Date().toISOString(),executedBy:"Super Admin"}:x);
    localStorage.setItem("admin_bulk_ops_v1",JSON.stringify(updated2));
    setOps(updated2); setExecuting(null); setConfirmOp(null);
    logAction("Bulk Operation Executed",`${op.name} — ${op.count.toLocaleString()} ${op.target}`,"System","warning");
    toast({ title:`Bulk operation completed — ${op.count.toLocaleString()} ${op.target} updated` });
  };

  const undoOp = async (op: BulkOp) => {
    setUndoing(op.id);
    await new Promise(r=>setTimeout(r,1500));
    const updated = ops.map(x=>x.id===op.id?{...x,status:"undone" as const,canUndo:false}:x);
    localStorage.setItem("admin_bulk_ops_v1",JSON.stringify(updated));
    setOps(updated); setUndoing(null); setConfirmUndo(null);
    logAction("Bulk Operation Undone",op.name,"System","warning");
    toast({ title:`Bulk operation "${op.name}" undone` });
  };

  const approve = (id:string) => {
    const updated = ops.map(x=>x.id===id?{...x,status:"preview" as const}:x);
    localStorage.setItem("admin_bulk_ops_v1",JSON.stringify(updated));
    setOps(updated);
    toast({ title:"Operation approved — now in preview" });
  };

  const pending = ops.filter(o=>o.status==="pending_approval").length;
  const failed  = ops.filter(o=>o.status==="failed").length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Layers size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Bulk Operation Safety</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Confirmation dialogs · Preview mode · Approval workflow · Undo history · Execution logging</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Total Operations",v:ops.length,c:T.badgeFg},{l:"Pending Approval",v:pending,c:pending>0?"#fbbf24":"#94a3b8"},{l:"Failed",v:failed,c:failed>0?"#f87171":"#94a3b8"},{l:"Can Undo",v:ops.filter(o=>o.canUndo).length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["ops","Operations",Layers],["logs","Execution Log",Clock]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="ops"&&(pending+failed)>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{pending+failed}</span>}
          </button>
        ))}
      </div>

      {tab==="ops"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {ops.map(op=>(
            <div key={op.id} style={{ background:T.card,border:`1px solid ${op.status==="failed"?"rgba(248,113,113,.2)":op.status==="pending_approval"?"rgba(251,191,36,.2)":T.border}`,borderRadius:14,padding:"16px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{op.name}</span>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{op.target}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:riskColor[op.risk],background:`${riskColor[op.risk]}15`,padding:"2px 7px",borderRadius:5 }}>{op.risk} risk</span>
                    <span style={{ fontSize:10,fontWeight:700,color:statusColor[op.status],background:`${statusColor[op.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{op.status.replace("_"," ")}</span>
                  </div>
                  <p style={{ fontSize:12,color:T.sub,margin:"0 0 3px" }}>{op.description}</p>
                  <p style={{ fontSize:12,color:T.sub,margin:0 }}>{op.count.toLocaleString()} {op.target} affected{op.executedBy?` · By: ${op.executedBy}`:""}{op.completedAt?` · ${safeDist(op.completedAt)} ago`:""}</p>
                  {op.errorMsg&&<p style={{ fontSize:12,color:"#f87171",margin:"3px 0 0" }}>{op.errorMsg}</p>}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0 }}>
                  {op.status==="pending_approval"&&<button onClick={()=>approve(op.id)} style={{ padding:"6px 12px",borderRadius:8,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer" }}>Approve</button>}
                  {op.status==="preview"&&<button onClick={()=>setConfirmOp(op)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:8,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}><Play size={11}/>Execute</button>}
                  {op.canUndo&&op.status==="completed"&&<button onClick={()=>setConfirmUndo(op)} disabled={undoing===op.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(251,114,36,.08)",border:"1px solid rgba(251,114,36,.2)",color:"#fb923c",fontSize:11,fontWeight:600,cursor:"pointer" }}><RotateCcw size={11}/>{undoing===op.id?"…":"Undo"}</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden" }}>
          {ops.filter(o=>o.completedAt||o.status==="failed").map((op,i,arr)=>(
            <div key={op.id} style={{ display:"flex",gap:12,padding:"13px 18px",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
              <div style={{ width:9,height:9,borderRadius:"50%",background:statusColor[op.status],flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700,fontSize:13,color:T.text,margin:"0 0 2px" }}>{op.name}</p>
                <p style={{ fontSize:11,color:T.sub,margin:0 }}>{op.count.toLocaleString()} {op.target} · By {op.executedBy||"Unknown"}{op.completedAt?` · ${safeFmt(op.completedAt, "MMM d, HH:mm")}`:""}</p>
              </div>
              <span style={{ fontSize:11,fontWeight:700,color:statusColor[op.status],textTransform:"capitalize" }}>{op.status.replace("_"," ")}</span>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionDialog open={!!confirmOp} onOpenChange={o=>!o&&setConfirmOp(null)} onConfirm={()=>confirmOp&&executeOp(confirmOp)}
        title={`Execute: ${confirmOp?.name}?`}
        description={`This will affect ${confirmOp?.count.toLocaleString()} ${confirmOp?.target}. Risk level: ${confirmOp?.risk}. ${confirmOp?.canUndo?"This operation can be undone.":"This operation cannot be undone."}`}
        confirmLabel="Execute" variant={confirmOp?.risk==="high"?"danger":"warning"} mode={confirmOp?.risk==="high"?"type":"single"} typeToConfirm="EXECUTE"/>
      <ConfirmActionDialog open={!!confirmUndo} onOpenChange={o=>!o&&setConfirmUndo(null)} onConfirm={()=>confirmUndo&&undoOp(confirmUndo)}
        title={`Undo "${confirmUndo?.name}"?`}
        description={`This will reverse the operation applied to ${confirmUndo?.count.toLocaleString()} ${confirmUndo?.target}. Once undone, it cannot be re-applied automatically.`}
        confirmLabel="Undo Operation" variant="warning"/>
    </div>
  );
}
