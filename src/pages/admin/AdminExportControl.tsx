import { useState } from "react";
import { Download, Shield, Clock, Eye, AlertTriangle, CheckCircle2, Lock, FileText, Droplets, XCircle, Hash, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface ExportRequest { id:string; requestedBy:string; description:string; tables:string[]; rowCount:number; status:"pending"|"approved"|"rejected"|"expired"; requestedAt:string; expiresAt?:string; downloadCount:number; watermark:string; sensitiveFields:string[]; }
interface ExportLog { id:string; admin:string; exportId:string; action:string; timestamp:string; ip:string; }
interface ExportPolicy { id:string; label:string; value:string|number|boolean; type:"number"|"boolean"|"select"; description:string; }

const seedRequests = (): ExportRequest[] => [
  { id:"e1", requestedBy:"Admin A", description:"Compliance audit — full user export", tables:["profiles","aadhaar_verifications"], rowCount:8420, status:"pending", requestedAt: new Date(Date.now()-1800000).toISOString(), expiresAt: new Date(Date.now()+864e5).toISOString(), downloadCount:0, watermark:"CONFIDENTIAL - ADMIN A - "+new Date().toLocaleDateString(), sensitiveFields:["mobile_number","aadhaar_number","bank_account_number"] },
  { id:"e2", requestedBy:"Admin B", description:"Wallet reconciliation report Q1",     tables:["wallet_transactions"],               rowCount:12340, status:"approved", requestedAt: new Date(Date.now()-864e5).toISOString(), expiresAt: new Date(Date.now()+864e5*2).toISOString(), downloadCount:1, watermark:"CONFIDENTIAL - ADMIN B - "+new Date().toLocaleDateString(), sensitiveFields:[] },
  { id:"e3", requestedBy:"Admin C", description:"Job analytics export",                tables:["jobs","job_applications"],           rowCount:3200,  status:"rejected", requestedAt: new Date(Date.now()-864e5*2).toISOString(), downloadCount:0, watermark:"", sensitiveFields:[] },
  { id:"e4", requestedBy:"Admin A", description:"Old user CSV from 2023",              tables:["profiles"],                          rowCount:1100,  status:"expired",  requestedAt: new Date(Date.now()-864e5*10).toISOString(), downloadCount:2, watermark:"EXPIRED", sensitiveFields:["mobile_number"] },
];

const seedLogs = (): ExportLog[] => [
  { id:"l1", admin:"Admin B", exportId:"e2", action:"Downloaded export",           timestamp: new Date(Date.now()-3600000).toISOString(),  ip:"103.21.58.44" },
  { id:"l2", admin:"Admin A", exportId:"e1", action:"Submitted export request",    timestamp: new Date(Date.now()-1800000).toISOString(),  ip:"192.168.1.1" },
  { id:"l3", admin:"Admin C", exportId:"e3", action:"Export rejected by approver", timestamp: new Date(Date.now()-864e5*2).toISOString(), ip:"45.79.12.200" },
];

const seedPolicies = (): ExportPolicy[] => [
  { id:"p1", label:"Max Export Rows",        value:10000,   type:"number",  description:"Maximum number of rows allowed per export request" },
  { id:"p2", label:"Export Expiry (hours)",  value:48,      type:"number",  description:"How long an approved export link remains valid" },
  { id:"p3", label:"Require Approval",       value:true,    type:"boolean", description:"All export requests must be approved by a second admin" },
  { id:"p4", label:"Watermark Exports",      value:true,    type:"boolean", description:"Automatically embed admin name and date in exported files" },
  { id:"p5", label:"Mask Sensitive Fields",  value:true,    type:"boolean", description:"Phone, Aadhaar, bank account masked in exports by default" },
  { id:"p6", label:"Bulk Export Limit/day",  value:3,       type:"number",  description:"Max bulk exports any admin can request per day" },
];

function load<T>(key:string, seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor = { pending:"#fbbf24", approved:"#4ade80", rejected:"#f87171", expired:"#94a3b8" };

export default function AdminExportControl() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]     = useState<"requests"|"policy"|"logs">("requests");
  const [requests, setRequests] = useState<ExportRequest[]>(()=>load("admin_export_requests_v2",seedRequests));
  const [policies, setPolicies] = useState<ExportPolicy[]>(()=>load("admin_export_policies_v1",seedPolicies));
  const [logs]            = useState<ExportLog[]>(()=>load("admin_export_logs_v1",seedLogs));
  const [editPol, setEditPol] = useState<string|null>(null);
  const [editVal, setEditVal] = useState<string|number>("");

  const resolve = (id:string, status:"approved"|"rejected") => {
    const updated = requests.map(r=>r.id===id?{...r,status}:r);
    localStorage.setItem("admin_export_requests_v2",JSON.stringify(updated));
    setRequests(updated);
    logAction(`Export ${status}`,requests.find(r=>r.id===id)?.description||"","Security",status==="approved"?"success":"warning");
    toast({ title:`Export request ${status}` });
  };

  const savePolicy = (id:string) => {
    const updated = policies.map(p=>p.id===id?{...p,value:p.type==="number"?Number(editVal):editVal}:p);
    localStorage.setItem("admin_export_policies_v1",JSON.stringify(updated));
    setPolicies(updated);
    logAction("Export Policy Updated",`${policies.find(p=>p.id===id)?.label} → ${editVal}`,"Security","warning");
    toast({ title:"Policy updated" });
    setEditPol(null);
  };

  const toggleBool = (id:string) => {
    const pol = policies.find(p=>p.id===id)!;
    const updated = policies.map(p=>p.id===id?{...p,value:!p.value}:p);
    localStorage.setItem("admin_export_policies_v1",JSON.stringify(updated));
    setPolicies(updated);
    logAction("Export Policy Toggled",`${pol.label}: ${pol.value} → ${!pol.value}`,"Security","warning");
    toast({ title:`${pol.label} ${pol.value?"disabled":"enabled"}` });
  };

  const inp=(s?:object)=>({ background:T.input, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, ...s });
  const pending = requests.filter(r=>r.status==="pending").length;

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`, border:`1px solid rgba(99,102,241,.2)`, borderRadius:18, padding:"26px 28px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${A1}55`, flexShrink:0 }}>
            <Download size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text, fontWeight:800, fontSize:22, margin:0 }}>Data Export & Leak Prevention</h1>
            <p style={{ color:T.sub, fontSize:13, margin:"3px 0 0" }}>Export approval workflow · Watermarking · Sensitive field masking · Access tracking</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
          {[{l:"Pending Approval",v:pending,c:pending>0?"#fbbf24":"#94a3b8"},{l:"Approved Exports",v:requests.filter(r=>r.status==="approved").length,c:"#4ade80"},{l:"Downloads Today",v:logs.filter(l=>l.action.includes("Download")).length,c:T.badgeFg},{l:"Expired",v:requests.filter(r=>r.status==="expired").length,c:"#94a3b8"}].map(s=>(
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontWeight:800, fontSize:18, color:s.c }}>{s.v}</span>
              <span style={{ fontSize:11, color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {([["requests","Export Requests",Download],["policy","Protection Policy",Shield],["logs","Access Logs",Eye]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, border:`1px solid ${tab===t?A1:T.border}`, background:tab===t?`${A1}18`:T.card, color:tab===t?T.badgeFg:T.sub, fontWeight:600, fontSize:12, cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="requests"&&pending>0&&<span style={{ background:"#fbbf24",color:"#000",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{pending}</span>}
          </button>
        ))}
      </div>

      {tab==="requests"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {requests.map(req=>(
            <div key={req.id} style={{ background:T.card, border:`1px solid ${req.status==="pending"?"rgba(251,191,36,.25)":T.border}`, borderRadius:14, padding:"16px 18px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:req.status==="pending"?12:0 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{req.description}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:(statusColor as Record<string,string>)[req.status], background:`${(statusColor as Record<string,string>)[req.status]}15`, padding:"2px 8px", borderRadius:5, textTransform:"capitalize" }}>{req.status}</span>
                  </div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:6 }}>
                    <span style={{ fontSize:12, color:T.sub }}>By: <strong style={{ color:T.text }}>{req.requestedBy}</strong></span>
                    <span style={{ fontSize:12, color:T.sub }}>{req.rowCount.toLocaleString()} rows</span>
                    <span style={{ fontSize:12, color:T.sub }}>{format(new Date(req.requestedAt),"MMM d, HH:mm")}</span>
                    {req.expiresAt&&req.status==="approved"&&<span style={{ fontSize:12, color:T.sub }}>Expires: {format(new Date(req.expiresAt),"MMM d, HH:mm")}</span>}
                    {req.downloadCount>0&&<span style={{ fontSize:12, color:T.sub }}>Downloaded: {req.downloadCount}×</span>}
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {req.tables.map(t=><span key={t} style={{ fontSize:10, color:T.badgeFg, background:T.badge, padding:"2px 8px", borderRadius:5, fontFamily:"monospace" }}>{t}</span>)}
                    {req.sensitiveFields.length>0&&<span style={{ fontSize:10, color:"#f87171", background:"rgba(248,113,113,.1)", padding:"2px 8px", borderRadius:5 }}>⚠ Sensitive: {req.sensitiveFields.join(", ")}</span>}
                  </div>
                  {req.watermark&&<p style={{ fontSize:10, color:T.sub, margin:"6px 0 0", fontFamily:"monospace", opacity:.7 }}>Watermark: {req.watermark}</p>}
                </div>
              </div>
              {req.status==="pending"&&(
                <div style={{ display:"flex", gap:8, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                  <button onClick={()=>resolve(req.id,"approved")} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 16px", borderRadius:9, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.25)", color:"#4ade80", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    <CheckCircle2 size={13}/> Approve Export
                  </button>
                  <button onClick={()=>resolve(req.id,"rejected")} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:9, background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", color:"#f87171", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    <XCircle size={13}/> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="policy"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {policies.map(pol=>(
            <div key={pol.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:13, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, fontSize:13, color:T.text, margin:"0 0 3px" }}>{pol.label}</p>
                <p style={{ fontSize:12, color:T.sub, margin:0 }}>{pol.description}</p>
              </div>
              {pol.type==="boolean"?(
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:pol.value?"#4ade80":"#94a3b8" }}>{pol.value?"ON":"OFF"}</span>
                  <button onClick={()=>toggleBool(pol.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    {pol.value?<ToggleRight size={28} color="#4ade80"/>:<ToggleLeft size={28} color="#94a3b8"/>}
                  </button>
                </div>
              ):editPol===pol.id?(
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ ...inp(), width:80, padding:"6px 10px", fontSize:13, textAlign:"center" }}/>
                  <button onClick={()=>savePolicy(pol.id)} style={{ padding:"6px 12px", borderRadius:8, background:`${A1}20`, border:`1px solid ${A1}33`, color:T.badgeFg, fontSize:12, fontWeight:600, cursor:"pointer" }}>Save</button>
                  <button onClick={()=>setEditPol(null)} style={{ padding:"6px 8px", borderRadius:8, background:T.input, border:`1px solid ${T.border}`, color:T.sub, fontSize:12, cursor:"pointer" }}>×</button>
                </div>
              ):(
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontWeight:800, fontSize:16, color:T.badgeFg }}>{String(pol.value)}</span>
                  <button onClick={()=>{setEditPol(pol.id);setEditVal(pol.value as number);}} style={{ fontSize:10, color:T.badgeFg, background:T.badge, border:"none", borderRadius:5, padding:"2px 8px", cursor:"pointer" }}>edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <Eye size={14} color={A1}/><span style={{ fontWeight:700, fontSize:14, color:T.text }}>Export Access Log</span>
          </div>
          {logs.map((l,i)=>(
            <div key={l.id} style={{ display:"flex", gap:12, padding:"13px 18px", borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:l.action.includes("Download")?"#f87171":l.action.includes("rejected")?"#fbbf24":"#4ade80", flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:T.text, margin:"0 0 2px" }}>{l.action}</p>
                <p style={{ fontSize:11, color:T.sub, margin:0 }}>{l.admin} · IP: {l.ip} · Export #{l.exportId}</p>
              </div>
              <span style={{ fontSize:11, color:T.sub, flexShrink:0 }}>{format(new Date(l.timestamp),"MMM d, HH:mm")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

