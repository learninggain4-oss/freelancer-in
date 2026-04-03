import { useState } from "react";
import { FileUp, Shield, AlertTriangle, CheckCircle2, Eye, Trash2, Lock, ToggleLeft, ToggleRight, Activity, FolderOpen } from "lucide-react";
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

interface UploadLog { id:string; filename:string; uploader:string; userId:string; size:string; type:string; uploadedAt:string; status:"clean"|"quarantined"|"blocked"|"pending_scan"; reason?:string; }
interface FilePolicy { id:string; label:string; value:string|number|boolean; type:"text"|"number"|"boolean"; description:string; }

const seedLogs = (): UploadLog[] => [
  { id:"f1", filename:"profile_avatar_4821.jpg",  uploader:"User 4821",   userId:"4821", size:"124 KB",  type:"image/jpeg",       uploadedAt:new Date(Date.now()-300000).toISOString(),    status:"clean" },
  { id:"f2", filename:"resume_upload_2241.pdf",   uploader:"User 2241",   userId:"2241", size:"340 KB",  type:"application/pdf",  uploadedAt:new Date(Date.now()-600000).toISOString(),    status:"clean" },
  { id:"f3", filename:"project_files.zip",        uploader:"User 9901",   userId:"9901", size:"12.4 MB", type:"application/zip",  uploadedAt:new Date(Date.now()-1200000).toISOString(),   status:"quarantined", reason:"ZIP exceeds 10 MB limit and contains suspicious JS files" },
  { id:"f4", filename:"invoice_template.exe",     uploader:"User 1122",   userId:"1122", size:"890 KB",  type:"application/exe",  uploadedAt:new Date(Date.now()-3600000).toISOString(),   status:"blocked",     reason:"Executable file type (.exe) is not permitted" },
  { id:"f5", filename:"chat_attachment_img.png",  uploader:"User 5544",   userId:"5544", size:"2.1 MB",  type:"image/png",        uploadedAt:new Date(Date.now()-7200000).toISOString(),   status:"clean" },
  { id:"f6", filename:"large_dataset.csv",        uploader:"Admin A",     userId:"admin",size:"45 MB",   type:"text/csv",         uploadedAt:new Date(Date.now()-86400000).toISOString(),  status:"pending_scan" },
];

const seedPolicies = (): FilePolicy[] => [
  { id:"p1", label:"Max File Size (MB)",       value:10,    type:"number",  description:"Maximum allowed upload size per file" },
  { id:"p2", label:"Allowed Extensions",       value:"jpg,jpeg,png,gif,pdf,doc,docx,txt,csv", type:"text", description:"Comma-separated list of permitted file extensions" },
  { id:"p3", label:"Blocked Extensions",       value:"exe,bat,sh,cmd,js,php,py",              type:"text", description:"These extensions are always rejected regardless of content" },
  { id:"p4", label:"Max Uploads Per Hour",     value:20,    type:"number",  description:"Rate limit: max files a single user can upload per hour" },
  { id:"p5", label:"Auto-Quarantine Suspicious",value:true, type:"boolean", description:"Automatically quarantine files that fail validation checks" },
  { id:"p6", label:"Scan Before Storage",      value:true,  type:"boolean", description:"Run content validation before file is stored permanently" },
];

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor: Record<string,string> = { clean:"#4ade80", quarantined:"#fbbf24", blocked:"#f87171", pending_scan:A1 };
const statusLabel: Record<string,string> = { clean:"CLEAN", quarantined:"QUARANTINED", blocked:"BLOCKED", pending_scan:"SCANNING" };

export default function AdminFileManager() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]         = useState<"uploads"|"policy">("uploads");
  const [logs, setLogs]       = useState<UploadLog[]>(()=>load("admin_file_logs_v1",seedLogs));
  const [policies, setPolicies] = useState<FilePolicy[]>(()=>load("admin_file_policies_v1",seedPolicies));
  const [editId, setEditId]   = useState<string|null>(null);
  const [editVal, setEditVal] = useState<string|number>("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleting, setDeleting] = useState<string|null>(null);

  const deleteFile = async (id:string) => {
    setDeleting(id);
    await new Promise(r=>setTimeout(r,600));
    const updated = logs.filter(f=>f.id!==id);
    localStorage.setItem("admin_file_logs_v1",JSON.stringify(updated));
    setLogs(updated);
    setDeleting(null);
    logAction("File Deleted",logs.find(f=>f.id===id)?.filename||"","Security","warning");
    toast({ title:"File deleted and removed from storage" });
  };

  const releaseFromQuarantine = (id:string) => {
    const updated = logs.map(f=>f.id===id?{...f,status:"clean" as const,reason:undefined}:f);
    localStorage.setItem("admin_file_logs_v1",JSON.stringify(updated));
    setLogs(updated);
    toast({ title:"File released from quarantine" });
    logAction("Quarantine Released",logs.find(f=>f.id===id)?.filename||"","Security","success");
  };

  const savePol = (id:string) => {
    const p = policies.find(x=>x.id===id)!;
    const updated = policies.map(x=>x.id===id?{...x,value:p.type==="number"?Number(editVal):editVal}:x);
    localStorage.setItem("admin_file_policies_v1",JSON.stringify(updated));
    setPolicies(updated);
    toast({ title:"File policy updated" });
    setEditId(null);
  };

  const togglePol = (id:string) => {
    const updated = policies.map(p=>p.id===id?{...p,value:!p.value}:p);
    localStorage.setItem("admin_file_policies_v1",JSON.stringify(updated));
    setPolicies(updated);
  };

  const filtered = filterStatus==="all" ? logs : logs.filter(f=>f.status===filterStatus);
  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,...s });
  const issues = logs.filter(f=>f.status!=="clean").length;

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <FileUp size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>File Upload Security</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Type validation · Size limits · Auto-quarantine · Content scanning · Upload rate limiting</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Total Uploads",v:logs.length,c:T.badgeFg},{l:"Quarantined",v:logs.filter(f=>f.status==="quarantined").length,c:"#fbbf24"},{l:"Blocked",v:logs.filter(f=>f.status==="blocked").length,c:"#f87171"},{l:"Clean",v:logs.filter(f=>f.status==="clean").length,c:"#4ade80"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16,flexWrap:"wrap" }}>
        {([["uploads","Upload Log",FileUp],["policy","Security Policy",Shield]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="uploads"&&issues>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{issues}</span>}
          </button>
        ))}
      </div>

      {tab==="uploads"&&(
        <>
          <div style={{ display:"flex",gap:6,marginBottom:10,flexWrap:"wrap" }}>
            {["all","clean","quarantined","blocked","pending_scan"].map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:"5px 13px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${filterStatus===s?A1:T.border}`,background:filterStatus===s?`${A1}15`:T.card,color:filterStatus===s?T.badgeFg:T.sub,textTransform:"capitalize" }}>{s.replace("_"," ")}</button>
            ))}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {filtered.map(f=>(
              <div key={f.id} style={{ background:T.card,border:`1px solid ${f.status!=="clean"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",gap:12,alignItems:"flex-start" }}>
                <div style={{ width:36,height:36,borderRadius:10,background:`${statusColor[f.status]}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <FolderOpen size={16} color={statusColor[f.status]}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{f.filename}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:statusColor[f.status],background:`${statusColor[f.status]}15`,padding:"2px 7px",borderRadius:5 }}>{statusLabel[f.status]}</span>
                  </div>
                  <p style={{ fontSize:12,color:T.sub,margin:"0 0 3px" }}>{f.uploader} · {f.size} · {f.type} · {safeDist(f.uploadedAt)} ago</p>
                  {f.reason&&<p style={{ fontSize:12,color:"#f87171",margin:0 }}>{f.reason}</p>}
                </div>
                <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                  {f.status==="quarantined"&&(
                    <button onClick={()=>releaseFromQuarantine(f.id)} style={{ padding:"6px 11px",borderRadius:8,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",color:"#4ade80",fontSize:11,fontWeight:600,cursor:"pointer" }}>Release</button>
                  )}
                  <button onClick={()=>deleteFile(f.id)} disabled={deleting===f.id} style={{ display:"flex",alignItems:"center",gap:4,padding:"6px 11px",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                    <Trash2 size={11}/>{deleting===f.id?"…":"Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==="policy"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {policies.map(p=>(
            <div key={p.id} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"14px 18px",display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700,fontSize:13,color:T.text,margin:"0 0 3px" }}>{p.label}</p>
                <p style={{ fontSize:12,color:T.sub,margin:0 }}>{p.description}</p>
                {p.type==="text"&&<p style={{ fontSize:11,color:T.badgeFg,fontFamily:"monospace",margin:"4px 0 0" }}>{String(p.value)}</p>}
              </div>
              {p.type==="boolean"?(
                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:p.value?"#4ade80":"#94a3b8" }}>{p.value?"ON":"OFF"}</span>
                  <button onClick={()=>togglePol(p.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}>
                    {p.value?<ToggleRight size={28} color="#4ade80"/>:<ToggleLeft size={28} color="#94a3b8"/>}
                  </button>
                </div>
              ):p.type==="number"&&editId===p.id?(
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  <Input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ ...inp(),width:70,padding:"6px 10px",fontSize:13 }}/>
                  <button onClick={()=>savePol(p.id)} style={{ padding:"6px 12px",borderRadius:8,background:`${A1}20`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:12,fontWeight:600,cursor:"pointer" }}>Save</button>
                  <button onClick={()=>setEditId(null)} style={{ padding:"6px 8px",borderRadius:8,background:T.input,border:`1px solid ${T.border}`,color:T.sub,fontSize:12,cursor:"pointer" }}>×</button>
                </div>
              ):p.type==="number"?(
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontWeight:800,fontSize:16,color:T.badgeFg }}>{String(p.value)}</span>
                  <button onClick={()=>{setEditId(p.id);setEditVal(p.value as number);}} style={{ fontSize:10,color:T.badgeFg,background:T.badge,border:"none",borderRadius:5,padding:"2px 8px",cursor:"pointer" }}>edit</button>
                </div>
              ):null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
