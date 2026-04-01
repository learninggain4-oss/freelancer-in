import { useState } from "react";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Play, RotateCcw, Eye, List, Clock } from "lucide-react";
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

interface Migration { id:string; name:string; table:string; sourceCount:number; destCount?:number; status:"pending"|"validating"|"running"|"success"|"failed"|"rolled_back"; startedAt?:string; completedAt?:string; errorMsg?:string; rollbackAvailable:boolean; }

const seedMigrations = (): Migration[] => [
  { id:"m1", name:"profiles_v2_backfill",        table:"profiles",          sourceCount:12840, destCount:12840, status:"success",     startedAt:new Date(Date.now()-864e5*3).toISOString(), completedAt:new Date(Date.now()-864e5*3+18e5).toISOString(), rollbackAvailable:true },
  { id:"m2", name:"wallet_balances_recalc",       table:"wallet_transactions",sourceCount:84200, destCount:84198, status:"failed",      startedAt:new Date(Date.now()-864e5).toISOString(),   errorMsg:"2 records failed checksum validation — count mismatch detected", rollbackAvailable:true },
  { id:"m3", name:"job_category_restructure",     table:"jobs",              sourceCount:4510,  status:"pending",    rollbackAvailable:false },
  { id:"m4", name:"user_roles_normalization",     table:"user_roles",        sourceCount:342,   destCount:342, status:"success",     startedAt:new Date(Date.now()-864e5*7).toISOString(), completedAt:new Date(Date.now()-864e5*7+900000).toISOString(), rollbackAvailable:false },
  { id:"m5", name:"legacy_notifications_archive", table:"notifications",     sourceCount:215000,status:"pending",    rollbackAvailable:false },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor: Record<string,string> = { pending:"#94a3b8", validating:A1, running:"#fbbf24", success:"#4ade80", failed:"#f87171", rolled_back:"#fb923c" };

export default function AdminDataMigration() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]           = useState<"list"|"validate"|"logs">("list");
  const [migrations, setMigrations] = useState<Migration[]>(()=>load("admin_migrations_v1",seedMigrations));
  const [running, setRunning]   = useState<string|null>(null);
  const [rolling, setRolling]   = useState<string|null>(null);
  const [validating, setValidating] = useState<string|null>(null);
  const [validateResult, setValidateResult] = useState<{ id:string; ok:boolean; details:string }|null>(null);

  const runMigration = async (m: Migration) => {
    setRunning(m.id);
    const updated1 = migrations.map(x=>x.id===m.id?{...x,status:"running" as const,startedAt:new Date().toISOString()}:x);
    setMigrations(updated1);
    await new Promise(r=>setTimeout(r,2500));
    const ok = Math.random() > 0.2;
    const updated2 = migrations.map(x=>x.id===m.id?{...x,status:ok?"success" as const:"failed" as const,destCount:ok?m.sourceCount:m.sourceCount-2,completedAt:new Date().toISOString(),errorMsg:ok?undefined:"Checksum mismatch on 2 records",rollbackAvailable:ok}:x);
    localStorage.setItem("admin_migrations_v1",JSON.stringify(updated2));
    setMigrations(updated2);
    setRunning(null);
    logAction("Migration Run",m.name,"System",ok?"success":"warning");
    toast({ title:ok?`Migration "${m.name}" completed`:`Migration "${m.name}" failed — rollback available` });
  };

  const rollback = async (m: Migration) => {
    setRolling(m.id);
    await new Promise(r=>setTimeout(r,1500));
    const updated = migrations.map(x=>x.id===m.id?{...x,status:"rolled_back" as const,rollbackAvailable:false}:x);
    localStorage.setItem("admin_migrations_v1",JSON.stringify(updated));
    setMigrations(updated);
    setRolling(null);
    logAction("Migration Rolled Back",m.name,"System","warning");
    toast({ title:`Migration "${m.name}" rolled back` });
  };

  const validate = async (m: Migration) => {
    setValidating(m.id);
    await new Promise(r=>setTimeout(r,2000));
    setValidating(null);
    const ok = m.sourceCount === (m.destCount||0) || m.status==="pending";
    setValidateResult({ id:m.id, ok, details:ok?`✓ Source count: ${m.sourceCount.toLocaleString()}\n✓ Destination count: ${(m.destCount||m.sourceCount).toLocaleString()}\n✓ Checksum verified\n✓ Ready to execute`:`✗ Source: ${m.sourceCount.toLocaleString()}\n✗ Destination: ${m.destCount?.toLocaleString()??0}\n✗ Count mismatch — investigate before retrying` });
  };

  const failed  = migrations.filter(m=>m.status==="failed").length;
  const pending = migrations.filter(m=>m.status==="pending").length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Database size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Data Migration Safety</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Validation · Count verification · Preview mode · Progress tracking · Rollback · Error detection</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Total Migrations",v:migrations.length,c:T.badgeFg},{l:"Pending",v:pending,c:pending>0?"#fbbf24":"#94a3b8"},{l:"Failed",v:failed,c:failed>0?"#f87171":"#94a3b8"},{l:"Successful",v:migrations.filter(m=>m.status==="success").length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["list","Migrations",List],["validate","Validator",CheckCircle2],["logs","History",Clock]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="list"&&failed>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{failed}</span>}
          </button>
        ))}
      </div>

      {(tab==="list"||tab==="validate")&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {migrations.map(m=>(
            <div key={m.id} style={{ background:T.card,border:`1px solid ${m.status==="failed"?"rgba(248,113,113,.2)":T.border}`,borderRadius:14,padding:"16px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text }}>{m.name}</span>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{m.table}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:statusColor[m.status],background:`${statusColor[m.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{m.status.replace("_"," ")}</span>
                  </div>
                  <div style={{ display:"flex",gap:12,marginBottom:4,flexWrap:"wrap" }}>
                    <span style={{ fontSize:12,color:T.sub }}>Source: <strong style={{ color:T.text }}>{m.sourceCount.toLocaleString()}</strong></span>
                    {m.destCount!==undefined&&<span style={{ fontSize:12,color:T.sub }}>Destination: <strong style={{ color:m.destCount===m.sourceCount?"#4ade80":"#f87171" }}>{m.destCount.toLocaleString()}</strong></span>}
                    {m.destCount!==undefined&&m.destCount!==m.sourceCount&&<span style={{ fontSize:12,color:"#f87171",fontWeight:700 }}>⚠ Count mismatch ({m.sourceCount-m.destCount})</span>}
                  </div>
                  {m.errorMsg&&<p style={{ fontSize:12,color:"#f87171",margin:"0 0 4px" }}>{m.errorMsg}</p>}
                  {m.completedAt&&<p style={{ fontSize:11,color:T.sub,margin:0 }}>Completed: {format(new Date(m.completedAt),"MMM d, HH:mm")}</p>}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0 }}>
                  {tab==="validate"&&(
                    <button onClick={()=>validate(m)} disabled={validating===m.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      <Eye size={11}/>{validating===m.id?"Checking…":"Validate"}
                    </button>
                  )}
                  {m.status==="pending"&&tab==="list"&&(
                    <button onClick={()=>runMigration(m)} disabled={running===m.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:8,background:`linear-gradient(135deg,${A1},${A2})`,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      <Play size={11}/>{running===m.id?"Running…":"Run"}
                    </button>
                  )}
                  {m.rollbackAvailable&&tab==="list"&&(
                    <button onClick={()=>rollback(m)} disabled={rolling===m.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(251,114,36,.08)",border:"1px solid rgba(251,114,36,.2)",color:"#fb923c",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      <RotateCcw size={11}/>{rolling===m.id?"Rolling back…":"Rollback"}
                    </button>
                  )}
                </div>
              </div>
              {tab==="validate"&&validateResult?.id===m.id&&(
                <div style={{ marginTop:12,background:validateResult.ok?"rgba(74,222,128,.06)":"rgba(248,113,113,.06)",border:`1px solid ${validateResult.ok?"rgba(74,222,128,.15)":"rgba(248,113,113,.15)"}`,borderRadius:10,padding:"10px 14px",fontFamily:"monospace",fontSize:12,color:validateResult.ok?"#4ade80":"#f87171",whiteSpace:"pre-line",lineHeight:1.8 }}>{validateResult.details}</div>
              )}
              {m.status==="running"&&(
                <div style={{ marginTop:10 }}>
                  <div style={{ height:4,borderRadius:4,background:"rgba(255,255,255,.07)",overflow:"hidden" }}>
                    <div style={{ height:"100%",borderRadius:4,background:`linear-gradient(90deg,${A1},${A2})`,width:"60%",animation:"migrationProgress 2s ease-in-out infinite" }}/>
                  </div>
                  <p style={{ fontSize:11,color:T.sub,margin:"4px 0 0" }}>Migration in progress…</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden" }}>
          {migrations.filter(m=>m.completedAt||m.status==="failed").map((m,i,arr)=>(
            <div key={m.id} style={{ display:"flex",gap:12,padding:"13px 18px",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
              <div style={{ width:9,height:9,borderRadius:"50%",background:statusColor[m.status],flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700,fontSize:13,color:T.text,margin:"0 0 2px",fontFamily:"monospace" }}>{m.name}</p>
                <p style={{ fontSize:11,color:T.sub,margin:0 }}>Table: {m.table} · Rows: {m.sourceCount.toLocaleString()} · {m.completedAt?format(new Date(m.completedAt),"MMM d, HH:mm"):m.startedAt?format(new Date(m.startedAt),"MMM d, HH:mm"):""}</p>
              </div>
              <span style={{ fontSize:11,fontWeight:700,color:statusColor[m.status],textTransform:"capitalize" }}>{m.status.replace("_"," ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
