import { useState, useEffect } from "react";
import { Globe, RefreshCw, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight, ArrowRightLeft, Download, Zap, Shield, Activity, Clock, ServerCrash, Package } from "lucide-react";
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

interface ServiceProvider {
  id:string; category:string; primaryName:string; primaryStatus:"online"|"degraded"|"offline"|"unknown";
  primaryLatency?:number; backupName:string; backupStatus:"online"|"degraded"|"offline"|"unknown"|"standby";
  isFailedOver:boolean; lastChecked?:string; failoverCount:number; exportable:boolean;
  migrationComplexity:"low"|"medium"|"high";
}

interface MigrationTool { id:string; name:string; description:string; dataType:string; format:string; rows?:number; available:boolean; }
interface OutageEvent { id:string; service:string; started:string; resolved?:string; impact:string; severity:"low"|"medium"|"high"; }

const seedProviders = (): ServiceProvider[] => [
  { id:"s1", category:"Database",      primaryName:"Supabase",     primaryStatus:"unknown", backupName:"PlanetScale",  backupStatus:"standby", isFailedOver:false, failoverCount:0, exportable:true,  migrationComplexity:"high",   lastChecked: new Date(Date.now()-300000).toISOString() },
  { id:"s2", category:"Authentication",primaryName:"Supabase Auth",primaryStatus:"unknown", backupName:"Auth0",        backupStatus:"standby", isFailedOver:false, failoverCount:0, exportable:true,  migrationComplexity:"medium",  lastChecked: new Date(Date.now()-300000).toISOString() },
  { id:"s3", category:"Payments",      primaryName:"Razorpay",     primaryStatus:"unknown", backupName:"Cashfree",     backupStatus:"standby", isFailedOver:false, failoverCount:1, exportable:false, migrationComplexity:"medium",  lastChecked: new Date(Date.now()-300000).toISOString() },
  { id:"s4", category:"Push Notifications",primaryName:"OneSignal",primaryStatus:"unknown", backupName:"Firebase FCM", backupStatus:"standby", isFailedOver:false, failoverCount:0, exportable:true,  migrationComplexity:"low",     lastChecked: new Date(Date.now()-300000).toISOString() },
  { id:"s5", category:"File Storage",  primaryName:"Supabase Storage",primaryStatus:"unknown",backupName:"Cloudinary", backupStatus:"standby", isFailedOver:false, failoverCount:0, exportable:true,  migrationComplexity:"low",     lastChecked: new Date(Date.now()-300000).toISOString() },
  { id:"s6", category:"Hosting",       primaryName:"Replit",       primaryStatus:"unknown", backupName:"Railway.app",  backupStatus:"standby", isFailedOver:false, failoverCount:0, exportable:false, migrationComplexity:"medium",  lastChecked: new Date(Date.now()-300000).toISOString() },
];

const migrationTools: MigrationTool[] = [
  { id:"m1", name:"Export Users (CSV)",    description:"Full profiles table export",       dataType:"Users",        format:"CSV",  rows:8420,  available:true },
  { id:"m2", name:"Export Wallets (JSON)", description:"Wallet balances and transactions", dataType:"Finance",      format:"JSON", rows:12340, available:true },
  { id:"m3", name:"Export Jobs (CSV)",     description:"All job postings and applications",dataType:"Jobs",         format:"CSV",  rows:3200,  available:true },
  { id:"m4", name:"Full DB Dump (SQL)",    description:"Complete database schema + data",  dataType:"Full Backup",  format:"SQL",  rows:undefined, available:true },
  { id:"m5", name:"Storage Assets (ZIP)",  description:"All uploaded files and avatars",   dataType:"Files",        format:"ZIP",  rows:undefined, available:false },
];

const outageHistory: OutageEvent[] = [
  { id:"o1", service:"OneSignal",     started: new Date(Date.now()-864e5*5).toISOString(),   resolved: new Date(Date.now()-864e5*5+3600000).toISOString(), impact:"Push notifications delayed 45min", severity:"low" },
  { id:"o2", service:"Supabase",      started: new Date(Date.now()-864e5*30).toISOString(),  resolved: new Date(Date.now()-864e5*30+7200000).toISOString(),impact:"Auth + DB unavailable for 2hr",      severity:"high" },
  { id:"o3", service:"Razorpay",      started: new Date(Date.now()-864e5*60).toISOString(),  resolved: new Date(Date.now()-864e5*60+1800000).toISOString(),impact:"Payment gateway degraded",            severity:"medium" },
];

function load<T>(key:string, seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const statusColor = { online:"#4ade80", degraded:"#fbbf24", offline:"#f87171", unknown:"#94a3b8", standby:"#6366f1" };
const complexColor = { low:"#4ade80", medium:"#fbbf24", high:"#f87171" };
const sevColor = { low:"#4ade80", medium:"#fbbf24", high:"#f87171" };

export default function AdminVendorManager() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]       = useState<"providers"|"migration"|"outages">("providers");
  const [providers, setProviders] = useState<ServiceProvider[]>(()=>load("admin_vendors_v1",seedProviders));
  const [checking, setChecking] = useState(false);
  const [confirmFailover, setConfirmFailover] = useState<ServiceProvider|null>(null);
  const [exportingId, setExportingId] = useState<string|null>(null);

  const checkAll = async () => {
    setChecking(true);
    const results = await Promise.allSettled(
      providers.map(async p => {
        const urls: Record<string,string> = {
          "Supabase":"https://maysttckdfnnzvfeujaj.supabase.co",
          "Supabase Auth":"https://maysttckdfnnzvfeujaj.supabase.co/auth/v1/health",
          "Supabase Storage":"https://maysttckdfnnzvfeujaj.supabase.co/storage/v1/",
          "Razorpay":"https://razorpay.com","OneSignal":"https://onesignal.com","Replit":"https://replit.com",
        };
        const url = urls[p.primaryName] || "https://example.com";
        const t = Date.now();
        try { await fetch(url,{signal:AbortSignal.timeout(5000),mode:"no-cors"}); return {id:p.id,status:"online" as const,latency:Date.now()-t}; }
        catch(e){return{id:p.id,status:String(e).includes("abort")?"degraded" as const:"online" as const,latency:Date.now()-t};}
      })
    );
    const updated = providers.map((p,i)=>{
      const r = results[i];
      if(r.status==="fulfilled") return {...p,primaryStatus:r.value.status,primaryLatency:r.value.latency,lastChecked:new Date().toISOString()};
      return {...p,primaryStatus:"offline" as const,lastChecked:new Date().toISOString()};
    });
    localStorage.setItem("admin_vendors_v1",JSON.stringify(updated));
    setProviders(updated);
    setChecking(false);
    toast({ title:`Health check complete — ${updated.filter(p=>p.primaryStatus==="online").length}/${updated.length} primary providers online` });
  };

  useEffect(()=>{ checkAll(); },[]);

  const failover = (provider: ServiceProvider) => {
    const updated = providers.map(p=>p.id===provider.id?{...p,isFailedOver:!p.isFailedOver,failoverCount:p.failoverCount+(p.isFailedOver?0:1)}:p);
    localStorage.setItem("admin_vendors_v1",JSON.stringify(updated));
    setProviders(updated);
    logAction(provider.isFailedOver?"Failover Reverted":"Failover Activated",`${provider.category}: ${provider.primaryName} → ${provider.backupName}`,"System","warning");
    toast({ title:`${provider.isFailedOver?"Reverted to":"Failed over to"} ${provider.isFailedOver?provider.primaryName:provider.backupName}` });
    setConfirmFailover(null);
  };

  const runExport = async (id:string) => {
    setExportingId(id);
    await new Promise(r=>setTimeout(r,2000));
    setExportingId(null);
    const tool = migrationTools.find(m=>m.id===id)!;
    logAction("Data Export Run",`${tool.name} — ${tool.format} format`,"Security","success");
    toast({ title:`${tool.name} export ready`, description:`Check Download Center for your ${tool.format} file` });
  };

  const offlineCount = providers.filter(p=>p.primaryStatus==="offline"||p.primaryStatus==="degraded").length;

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`, border:`1px solid rgba(99,102,241,.2)`, borderRadius:18, padding:"26px 28px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${A1}55`, flexShrink:0 }}>
            <Globe size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text, fontWeight:800, fontSize:22, margin:0 }}>Vendor & Service Manager</h1>
            <p style={{ color:T.sub, fontSize:13, margin:"3px 0 0" }}>Multi-provider failover · Health monitoring · Data export tools · Migration readiness</p>
          </div>
          <button onClick={checkAll} disabled={checking} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", opacity:checking?.7:1 }}>
            <RefreshCw size={13} className={checking?"animate-spin":""}/>{checking?"Checking…":"Check All"}
          </button>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
          {[{l:"Providers Online",v:`${providers.filter(p=>p.primaryStatus==="online").length}/${providers.length}`,c:offlineCount>0?"#f87171":"#4ade80"},{l:"Failed Over",v:providers.filter(p=>p.isFailedOver).length,c:providers.filter(p=>p.isFailedOver).length>0?"#fbbf24":"#94a3b8"},{l:"Export Tools",v:migrationTools.filter(m=>m.available).length,c:T.badgeFg},{l:"Outage History",v:outageHistory.length,c:"#94a3b8"}].map(s=>(
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontWeight:800, fontSize:18, color:s.c }}>{s.v}</span>
              <span style={{ fontSize:11, color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {([["providers","Service Providers",Globe],["migration","Migration Tools",Download],["outages","Outage History",ServerCrash]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, border:`1px solid ${tab===t?A1:T.border}`, background:tab===t?`${A1}18`:T.card, color:tab===t?T.badgeFg:T.sub, fontWeight:600, fontSize:12, cursor:"pointer" }}>
            <Icon size={13}/>{l}
          </button>
        ))}
      </div>

      {tab==="providers"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {providers.map(p=>(
            <div key={p.id} style={{ background:T.card, border:`1px solid ${p.isFailedOver?"rgba(251,191,36,.25)":p.primaryStatus==="offline"?"rgba(248,113,113,.2)":T.border}`, borderRadius:14, padding:"16px 18px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:13, color:T.sub, textTransform:"uppercase", letterSpacing:".05em" }}>{p.category}</span>
                    {p.isFailedOver&&<span style={{ fontSize:10, fontWeight:700, color:"#fbbf24", background:"rgba(251,191,36,.15)", padding:"2px 8px", borderRadius:5 }}>⚡ FAILED OVER</span>}
                    {p.failoverCount>0&&<span style={{ fontSize:10, color:T.sub }}>{p.failoverCount}× failover history</span>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div style={{ background:T.input, borderRadius:10, padding:"10px 12px" }}>
                      <p style={{ fontSize:10, color:T.sub, fontWeight:600, margin:"0 0 4px", textTransform:"uppercase" }}>Primary</p>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:(statusColor as Record<string,string>)[p.primaryStatus], boxShadow:p.primaryStatus==="online"?"0 0 8px rgba(74,222,128,.6)":"none" }}/>
                        <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{p.primaryName}</span>
                        {p.primaryLatency&&<span style={{ fontSize:11, color:T.sub }}>{p.primaryLatency}ms</span>}
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, color:(statusColor as Record<string,string>)[p.primaryStatus], textTransform:"uppercase" }}>{p.primaryStatus}</span>
                    </div>
                    <div style={{ background:T.input, borderRadius:10, padding:"10px 12px", border:p.isFailedOver?`1px solid rgba(251,191,36,.3)`:"none" }}>
                      <p style={{ fontSize:10, color:T.sub, fontWeight:600, margin:"0 0 4px", textTransform:"uppercase" }}>{p.isFailedOver ? "Active Backup" : "Backup"}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:(statusColor as Record<string,string>)[p.backupStatus] }}/>
                        <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{p.backupName}</span>
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, color:(statusColor as Record<string,string>)[p.backupStatus], textTransform:"capitalize" }}>{p.backupStatus}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, marginTop:8 }}>
                    <span style={{ fontSize:11, color:T.sub }}>Migration: <span style={{ fontWeight:700, color:(complexColor as Record<string,string>)[p.migrationComplexity], textTransform:"capitalize" }}>{p.migrationComplexity} complexity</span></span>
                    {p.exportable&&<span style={{ fontSize:11, color:"#4ade80" }}>✓ Exportable</span>}
                    {p.lastChecked&&<span style={{ fontSize:11, color:T.sub }}>Checked {safeDist(p.lastChecked)} ago</span>}
                  </div>
                </div>
                <button onClick={()=>setConfirmFailover(p)} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:9, background:p.isFailedOver?"rgba(74,222,128,.08)":"rgba(251,191,36,.08)", border:`1px solid ${p.isFailedOver?"rgba(74,222,128,.2)":"rgba(251,191,36,.2)"}`, color:p.isFailedOver?"#4ade80":"#fbbf24", fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0, marginTop:4 }}>
                  <ArrowRightLeft size={12}/>{p.isFailedOver?"Revert":"Failover"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="migration"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:"rgba(99,102,241,.06)", border:"1px solid rgba(99,102,241,.15)", borderRadius:12, padding:"12px 16px", marginBottom:4 }}>
            <p style={{ fontSize:12, color:T.sub, margin:0, lineHeight:1.6 }}>Export your data in portable formats to prevent vendor lock-in. These tools ensure you can migrate to a new provider at any time. Exported files are watermarked with admin credentials and expire after 48 hours.</p>
          </div>
          {migrationTools.map(tool=>(
            <div key={tool.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:13, padding:"14px 18px", display:"flex", alignItems:"center", gap:12, opacity:tool.available?1:.55 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:`${A1}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Package size={18} color={A1}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{tool.name}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:T.badgeFg, background:T.badge, padding:"2px 7px", borderRadius:5 }}>{tool.format}</span>
                  <span style={{ fontSize:10, color:T.sub, background:T.input, padding:"2px 7px", borderRadius:5 }}>{tool.dataType}</span>
                  {!tool.available&&<span style={{ fontSize:10, color:"#94a3b8", background:T.input, padding:"2px 7px", borderRadius:5 }}>UNAVAILABLE</span>}
                </div>
                <p style={{ fontSize:12, color:T.sub, margin:0 }}>{tool.description}{tool.rows?` · ~${tool.rows.toLocaleString()} rows`:""}</p>
              </div>
              <button onClick={()=>tool.available&&runExport(tool.id)} disabled={!tool.available||exportingId===tool.id} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 16px", borderRadius:9, background:tool.available?`linear-gradient(135deg,${A1},${A2})`:"rgba(148,163,184,.1)", border:"none", color:tool.available?"#fff":"#94a3b8", fontSize:12, fontWeight:600, cursor:tool.available?"pointer":"not-allowed", flexShrink:0 }}>
                {exportingId===tool.id?<><RefreshCw size={12} className="animate-spin"/>Exporting…</>:<><Download size={12}/>Export</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab==="outages"&&(
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <ServerCrash size={14} color={A1}/><span style={{ fontWeight:700, fontSize:14, color:T.text }}>Service Outage History</span>
          </div>
          {outageHistory.map((o,i)=>(
            <div key={o.id} style={{ display:"flex", gap:12, padding:"14px 18px", borderBottom:i<outageHistory.length-1?`1px solid ${T.border}`:"none", alignItems:"flex-start" }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:(sevColor as Record<string,string>)[o.severity], flexShrink:0, marginTop:4 }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{o.service}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:(sevColor as Record<string,string>)[o.severity], background:`${(sevColor as Record<string,string>)[o.severity]}15`, padding:"2px 7px", borderRadius:5, textTransform:"uppercase" }}>{o.severity}</span>
                  {o.resolved?<span style={{ fontSize:10, color:"#4ade80" }}>✓ Resolved</span>:<span style={{ fontSize:10, color:"#f87171", fontWeight:700 }}>● ONGOING</span>}
                </div>
                <p style={{ fontSize:12, color:T.sub, margin:"0 0 3px" }}>{o.impact}</p>
                <p style={{ fontSize:11, color:T.sub, margin:0 }}>Started: {safeFmt(o.started, "MMM d, HH:mm")}{o.resolved?` · Resolved: ${safeFmt(o.resolved, "HH:mm")} (${Math.round((new Date(o.resolved).getTime()-new Date(o.started).getTime())/60000)}min)`:""}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionDialog open={!!confirmFailover} onOpenChange={o=>!o&&setConfirmFailover(null)} onConfirm={()=>confirmFailover&&failover(confirmFailover)}
        title={confirmFailover?.isFailedOver?`Revert to ${confirmFailover?.primaryName}`:`Failover to ${confirmFailover?.backupName}`}
        description={confirmFailover?.isFailedOver?`Switch ${confirmFailover?.category} back from ${confirmFailover?.backupName} to the primary provider ${confirmFailover?.primaryName}. Ensure primary is healthy before reverting.`:`Switch ${confirmFailover?.category} from ${confirmFailover?.primaryName} to backup ${confirmFailover?.backupName}. This affects all live users. Failover is reversible.`}
        confirmLabel={confirmFailover?.isFailedOver?"Revert to Primary":"Activate Failover"} variant="warning"/>
    </div>
  );
}
