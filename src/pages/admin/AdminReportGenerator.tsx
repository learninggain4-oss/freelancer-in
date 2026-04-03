import { useState } from "react";
import { BarChart3, Clock, CheckCircle2, AlertTriangle, Play, Download, RefreshCw, List, Settings, ToggleLeft, ToggleRight } from "lucide-react";
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

interface Report { id:string; name:string; type:string; status:"queued"|"generating"|"ready"|"failed"|"cached"; rowCount?:number; sizeMB?:number; pct?:number; requestedAt:string; completedAt?:string; requestedBy:string; error?:string; cached:boolean; scheduledDaily:boolean; }
interface ReportSetting { id:string; label:string; value:number|boolean; type:"number"|"boolean"; description:string; }

const seedReports = (): Report[] => [
  { id:"r1", name:"Monthly Revenue Summary",     type:"Finance",    status:"ready",      rowCount:8420,  sizeMB:0.4, requestedAt:new Date(Date.now()-3600000).toISOString(),   completedAt:new Date(Date.now()-3420000).toISOString(),  requestedBy:"Admin A",     cached:true,  scheduledDaily:true  },
  { id:"r2", name:"User KYC Status Export",      type:"Compliance", status:"generating", rowCount:undefined, pct:62,   requestedAt:new Date(Date.now()-600000).toISOString(),    requestedBy:"Admin B",     cached:false, scheduledDaily:false },
  { id:"r3", name:"Full Transaction History",    type:"Finance",    status:"failed",     requestedAt:new Date(Date.now()-7200000).toISOString(),  requestedBy:"Super Admin", cached:false, scheduledDaily:false, error:"Report exceeded 100,000 row limit — use date filters to narrow range" },
  { id:"r4", name:"Job Applications Summary",    type:"Operations", status:"ready",      rowCount:4510,  sizeMB:0.2, requestedAt:new Date(Date.now()-864e5).toISOString(),      completedAt:new Date(Date.now()-864e5+1200000).toISOString(), requestedBy:"Admin A", cached:false, scheduledDaily:false },
  { id:"r5", name:"Platform Health Dashboard",   type:"System",     status:"queued",     requestedAt:new Date(Date.now()-300000).toISOString(),    requestedBy:"Admin B",     cached:false, scheduledDaily:true },
];

const seedSettings = (): ReportSetting[] => [
  { id:"s1", label:"Max Rows Per Report",     value:100000, type:"number",  description:"Reports exceeding this row count are rejected to prevent timeout" },
  { id:"s2", label:"Report Timeout (sec)",    value:120,    type:"number",  description:"Reports that take longer than this are automatically cancelled" },
  { id:"s3", label:"Max Report Size (MB)",    value:50,     type:"number",  description:"Generated report files larger than this are split into chunks" },
  { id:"s4", label:"Cache Duration (hours)",  value:6,      type:"number",  description:"Identical reports within this window are served from cache" },
  { id:"s5", label:"Background Processing",   value:true,   type:"boolean", description:"Run report generation in the background queue instead of blocking" },
  { id:"s6", label:"Alert on Long Reports",   value:true,   type:"boolean", description:"Notify admins when a report takes more than 60 seconds to generate" },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor: Record<string,string> = { queued:"#94a3b8", generating:A1, ready:"#4ade80", failed:"#f87171", cached:"#4ade80" };

export default function AdminReportGenerator() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]           = useState<"reports"|"settings">("reports");
  const [reports, setReports]   = useState<Report[]>(()=>load("admin_reports_v1",seedReports));
  const [settings, setSettings] = useState<ReportSetting[]>(()=>load("admin_report_settings_v1",seedSettings));
  const [editId, setEditId]     = useState<string|null>(null);
  const [editVal, setEditVal]   = useState<string|number>("");
  const [regenerating, setRegenerating] = useState<string|null>(null);

  const regenerate = async (r: Report) => {
    setRegenerating(r.id);
    const u1 = reports.map(x=>x.id===r.id?{...x,status:"generating" as const,pct:0}:x);
    setReports(u1);
    for(let p=0;p<=100;p+=20) {
      await new Promise(res=>setTimeout(res,300));
      setReports(x=>x.map(y=>y.id===r.id?{...y,pct:p}:y));
    }
    const u2 = reports.map(x=>x.id===r.id?{...x,status:"ready" as const,pct:undefined,rowCount:Math.round(1000+Math.random()*8000),sizeMB:+(Math.random()*2).toFixed(2),completedAt:new Date().toISOString(),cached:false}:x);
    localStorage.setItem("admin_reports_v1",JSON.stringify(u2));
    setReports(u2); setRegenerating(null);
    logAction("Report Generated",r.name,"System","success");
    toast({ title:`Report "${r.name}" generated` });
  };

  const saveSetting = (id:string) => {
    const updated = settings.map(s=>s.id===id?{...s,value:s.type==="number"?Number(editVal):Boolean(editVal)}:s);
    localStorage.setItem("admin_report_settings_v1",JSON.stringify(updated));
    setSettings(updated); toast({ title:"Report setting updated" }); setEditId(null);
  };

  const toggleSetting = (id:string) => {
    const updated = settings.map(s=>s.id===id?{...s,value:!s.value}:s);
    localStorage.setItem("admin_report_settings_v1",JSON.stringify(updated));
    setSettings(updated);
  };

  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,...s });
  const failed = reports.filter(r=>r.status==="failed").length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <BarChart3 size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Report Generation Control</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Background queue · Size limits · Timeout control · Caching · Progress tracking · Scheduled reports</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Total Reports",v:reports.length,c:T.badgeFg},{l:"Ready",v:reports.filter(r=>r.status==="ready").length,c:"#4ade80"},{l:"Generating",v:reports.filter(r=>r.status==="generating").length,c:A1},{l:"Failed",v:failed,c:failed>0?"#f87171":"#94a3b8"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["reports","Report Queue",List],["settings","Settings",Settings]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="reports"&&failed>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{failed}</span>}
          </button>
        ))}
      </div>

      {tab==="reports"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {reports.map(r=>(
            <div key={r.id} style={{ background:T.card,border:`1px solid ${r.status==="failed"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:r.status==="generating"?10:0 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{r.name}</span>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{r.type}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:statusColor[r.status],background:`${statusColor[r.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"capitalize" }}>{r.status}</span>
                    {r.cached&&<span style={{ fontSize:10,color:"#4ade80" }}>cached</span>}
                    {r.scheduledDaily&&<span style={{ fontSize:10,color:A1 }}>daily</span>}
                  </div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    {r.rowCount&&<span style={{ fontSize:12,color:T.sub }}>Rows: <strong style={{ color:T.text }}>{r.rowCount.toLocaleString()}</strong></span>}
                    {r.sizeMB&&<span style={{ fontSize:12,color:T.sub }}>Size: <strong style={{ color:T.text }}>{r.sizeMB} MB</strong></span>}
                    <span style={{ fontSize:12,color:T.sub }}>By: {r.requestedBy}</span>
                    {r.completedAt&&<span style={{ fontSize:12,color:T.sub }}>{safeDist(r.completedAt)} ago</span>}
                  </div>
                  {r.error&&<p style={{ fontSize:12,color:"#f87171",margin:"3px 0 0" }}>{r.error}</p>}
                </div>
                <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                  {r.status==="ready"&&<button style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer" }}><Download size={11}/>Download</button>}
                  {(r.status==="failed"||r.status==="queued")&&(
                    <button onClick={()=>regenerate(r)} disabled={regenerating===r.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                      <RefreshCw size={11}/>{regenerating===r.id?"…":"Generate"}
                    </button>
                  )}
                </div>
              </div>
              {r.status==="generating"&&(
                <div>
                  <div style={{ height:5,borderRadius:4,background:"rgba(255,255,255,.07)",overflow:"hidden" }}>
                    <div style={{ height:"100%",borderRadius:4,background:`linear-gradient(90deg,${A1},${A2})`,width:`${r.pct||0}%`,transition:"width .3s ease" }}/>
                  </div>
                  <p style={{ fontSize:11,color:T.sub,margin:"4px 0 0" }}>{r.pct||0}% complete — running in background queue</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="settings"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {settings.map(s=>(
            <div key={s.id} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700,fontSize:13,color:T.text,margin:"0 0 3px" }}>{s.label}</p>
                <p style={{ fontSize:12,color:T.sub,margin:0 }}>{s.description}</p>
              </div>
              {s.type==="boolean"?(
                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:s.value?"#4ade80":"#94a3b8" }}>{s.value?"ON":"OFF"}</span>
                  <button onClick={()=>toggleSetting(s.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}>
                    {s.value?<ToggleRight size={28} color="#4ade80"/>:<ToggleLeft size={28} color="#94a3b8"/>}
                  </button>
                </div>
              ):editId===s.id?(
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  <Input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ ...inp(),width:90,padding:"6px 10px",fontSize:13 }}/>
                  <button onClick={()=>saveSetting(s.id)} style={{ padding:"6px 12px",borderRadius:8,background:`${A1}20`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer" }}>Save</button>
                  <button onClick={()=>setEditId(null)} style={{ padding:"6px 8px",borderRadius:8,background:T.input,border:`1px solid ${T.border}`,color:T.sub,fontSize:12,cursor:"pointer" }}>×</button>
                </div>
              ):(
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontWeight:800,fontSize:16,color:T.badgeFg }}>{String(s.value)}</span>
                  <button onClick={()=>{setEditId(s.id);setEditVal(s.value as number);}} style={{ fontSize:10,color:T.badgeFg,background:T.badge,border:"none",borderRadius:5,padding:"2px 8px",cursor:"pointer" }}>edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
