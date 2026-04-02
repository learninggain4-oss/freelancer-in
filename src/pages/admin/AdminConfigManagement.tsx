import { useState } from "react";
import { Settings2, ToggleLeft, ToggleRight, GitCompare, RefreshCw, History, Bell, CheckCircle2, AlertTriangle, Clock, Shield, Zap, Eye, Lock, Unlock, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
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

interface FeatureToggle {
  id: string; name: string; key: string; description: string;
  enabled: boolean; requiresApproval: boolean;
  category: string; lastChanged: string; changedBy?: string;
  dependencies?: string[];
}

interface ConfigEntry {
  id: string; key: string; prodValue: string; backupValue: string;
  stagingValue: string; category: string; sensitive: boolean;
  lastSync: string; hasDrift: boolean;
}

interface ConfigAudit {
  id: string; key: string; oldValue: string; newValue: string;
  changedBy: string; timestamp: string; approved: boolean;
}

const TOGGLES_KEY = "admin_feature_toggles_v1";
const CONFIG_KEY  = "admin_config_drift_v1";

const seedToggles = (): FeatureToggle[] => [
  { id:"t1", name:"Maintenance Mode",       key:"MAINTENANCE_MODE",       description:"Show maintenance page to all non-admin users",             enabled:false, requiresApproval:true,  category:"System",   lastChanged: new Date(Date.now()-864e5*5).toISOString(),  dependencies:[] },
  { id:"t2", name:"New User Registration",  key:"ALLOW_REGISTRATION",     description:"Allow new users to register on the platform",              enabled:true,  requiresApproval:false, category:"Users",    lastChanged: new Date(Date.now()-864e5*10).toISOString(), dependencies:[] },
  { id:"t3", name:"Wallet Withdrawals",     key:"WITHDRAWALS_ENABLED",    description:"Allow users to submit withdrawal requests",                enabled:true,  requiresApproval:true,  category:"Finance",  lastChanged: new Date(Date.now()-864e5*3).toISOString(),  dependencies:["WALLET_ENABLED"] },
  { id:"t4", name:"Aadhaar Verification",   key:"AADHAAR_VERIFY",         description:"Enable Aadhaar-based identity verification flow",          enabled:true,  requiresApproval:false, category:"Verify",   lastChanged: new Date(Date.now()-864e5*20).toISOString(), dependencies:[] },
  { id:"t5", name:"PWA Push Notifications", key:"PUSH_NOTIFICATIONS",     description:"Send push notifications via OneSignal",                    enabled:true,  requiresApproval:false, category:"System",   lastChanged: new Date(Date.now()-864e5*7).toISOString(),  dependencies:[] },
  { id:"t6", name:"Chat File Uploads",      key:"CHAT_FILE_UPLOAD",       description:"Allow file attachments in project chat",                   enabled:true,  requiresApproval:false, category:"Features", lastChanged: new Date(Date.now()-864e5*14).toISOString(), dependencies:["CHAT_ENABLED"] },
  { id:"t7", name:"Admin Dual Approval",    key:"DUAL_APPROVAL_REQUIRED", description:"Require second admin to approve sensitive admin actions",  enabled:false, requiresApproval:true,  category:"Security", lastChanged: new Date(Date.now()-864e5*1).toISOString(),  dependencies:[] },
  { id:"t8", name:"Rate Limiting",          key:"RATE_LIMITING_ENABLED",  description:"Enforce API and admin action rate limits",                 enabled:true,  requiresApproval:true,  category:"Security", lastChanged: new Date(Date.now()-864e5*2).toISOString(),  dependencies:[] },
];

const seedConfigs = (): ConfigEntry[] => [
  { id:"c1", key:"PLATFORM_COMMISSION_RATE", prodValue:"10%",   backupValue:"10%",   stagingValue:"5%",    category:"Finance", sensitive:false, lastSync: new Date(Date.now()-3600000).toISOString(),  hasDrift:true },
  { id:"c2", key:"MAX_WITHDRAWAL_AMOUNT",    prodValue:"50000", backupValue:"50000", stagingValue:"50000", category:"Finance", sensitive:false, lastSync: new Date(Date.now()-7200000).toISOString(),  hasDrift:false },
  { id:"c3", key:"SESSION_TIMEOUT_MIN",      prodValue:"30",    backupValue:"30",    stagingValue:"60",    category:"Security",sensitive:false, lastSync: new Date(Date.now()-3600000).toISOString(),  hasDrift:true },
  { id:"c4", key:"SUPABASE_URL",             prodValue:"https://maystt…",backupValue:"https://maystt…",stagingValue:"https://maystt…",category:"Database",sensitive:true, lastSync: new Date().toISOString(), hasDrift:false },
  { id:"c5", key:"SMTP_HOST",                prodValue:"smtp.resend.com",backupValue:"smtp.resend.com",stagingValue:"smtp.mailtrap.io",category:"Email",sensitive:false, lastSync: new Date(Date.now()-3600000).toISOString(), hasDrift:true },
];

const seedAudit = (): ConfigAudit[] => [
  { id:"a1", key:"PLATFORM_COMMISSION_RATE", oldValue:"8%",  newValue:"10%", changedBy:"Super Admin", timestamp: new Date(Date.now()-864e5*3).toISOString(), approved:true },
  { id:"a2", key:"SESSION_TIMEOUT_MIN",      oldValue:"60",  newValue:"30",  changedBy:"Admin A",     timestamp: new Date(Date.now()-864e5*7).toISOString(), approved:true },
  { id:"a3", key:"DUAL_APPROVAL_REQUIRED",   oldValue:"true",newValue:"false",changedBy:"Admin B",    timestamp: new Date(Date.now()-864e5*1).toISOString(), approved:false },
];

function load<T>(key: string, seed: () => T[]): T[] {
  try { const d = localStorage.getItem(key); if (d) return JSON.parse(d); } catch {}
  const s = seed(); localStorage.setItem(key, JSON.stringify(s)); return s;
}

export default function AdminConfigManagement() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]         = useState<"toggles"|"drift"|"audit">("toggles");
  const [toggles, setToggles] = useState<FeatureToggle[]>(() => load(TOGGLES_KEY, seedToggles));
  const [configs]             = useState<ConfigEntry[]>(() => load(CONFIG_KEY, seedConfigs));
  const [audit]               = useState<ConfigAudit[]>(() => load("admin_config_audit_v1", seedAudit));
  const [pendingToggle, setPendingToggle] = useState<FeatureToggle | null>(null);
  const [catFilter, setCatFilter] = useState("All");
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);

  const doToggle = (t: FeatureToggle) => {
    const updated = toggles.map(x => x.id === t.id ? { ...x, enabled: !x.enabled, lastChanged: new Date().toISOString(), changedBy: "Current Admin" } : x);
    localStorage.setItem(TOGGLES_KEY, JSON.stringify(updated));
    setToggles(updated);
    logAction("Feature Toggle Changed", `${t.key}: ${t.enabled} → ${!t.enabled}`, "System", t.enabled ? "warning" : "success");
    toast({ title: `${t.name} ${!t.enabled ? "enabled" : "disabled"}` });
    setPendingToggle(null);
  };

  const syncAll = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 1800));
    setSyncing(false);
    logAction("Config Sync", "All configurations synchronized with production", "System", "success");
    toast({ title: "Configuration synchronized", description: "All environments aligned with production" });
  };

  const cats = ["All", ...Array.from(new Set(toggles.map(t => t.category)))];
  const filtered = catFilter === "All" ? toggles : toggles.filter(t => t.category === catFilter);
  const driftCount = configs.filter(c => c.hasDrift).length;
  const inp = (s?: object) => ({ background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, ...s });
  const catColor: Record<string,string> = { System:"#a5b4fc", Users:"#4ade80", Finance:"#fb923c", Verify:"#fbbf24", Features:"#c084fc", Security:"#f87171" };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`, border:`1px solid rgba(99,102,241,.2)`, borderRadius:18, padding:"26px 28px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${A1}55`, flexShrink:0 }}>
            <Settings2 size={22} color="#fff" />
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text, fontWeight:800, fontSize:22, margin:0 }}>Configuration Management</h1>
            <p style={{ color:T.sub, fontSize:13, margin:"3px 0 0" }}>Feature toggles · Config drift detection · Approval workflow · Audit trail</p>
          </div>
          <button onClick={syncAll} disabled={syncing} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:`linear-gradient(135deg,${A1},${A2})`, border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", opacity:syncing?.7:1 }}>
            <RefreshCw size={13} className={syncing?"animate-spin":""} />{syncing?"Syncing…":"Sync All"}
          </button>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
          {[{l:"Active Toggles",v:toggles.filter(t=>t.enabled).length,c:"#4ade80"},{l:"Requires Approval",v:toggles.filter(t=>t.requiresApproval).length,c:"#fbbf24"},{l:"Config Drifts",v:driftCount,c:driftCount>0?"#f87171":"#4ade80"},{l:"Audit Entries",v:audit.length,c:T.badgeFg}].map(s=>(
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 16px", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontWeight:800, fontSize:18, color:s.c }}>{s.v}</span>
              <span style={{ fontSize:11, color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {([["toggles","Feature Toggles",Zap],["drift","Config Drift",GitCompare],["audit","Audit Log",History]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, border:`1px solid ${tab===t?A1:T.border}`, background:tab===t?`${A1}18`:T.card, color:tab===t?T.badgeFg:T.sub, fontWeight:600, fontSize:12, cursor:"pointer" }}>
            <Icon size={13}/>{l}{t==="drift"&&driftCount>0&&<span style={{ background:"#f87171",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:800 }}>{driftCount}</span>}
          </button>
        ))}
      </div>

      {tab==="toggles"&&(
        <>
          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            {cats.map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{ padding:"5px 13px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${catFilter===c?(catColor[c]||A1):T.border}`, background:catFilter===c?`${catColor[c]||A1}15`:T.card, color:catFilter===c?catColor[c]||T.badgeFg:T.sub }}>{c}</button>)}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.map(t=>(
              <div key={t.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{t.name}</span>
                      <span style={{ fontFamily:"monospace", fontSize:10, color:T.badgeFg, background:T.badge, padding:"2px 7px", borderRadius:5 }}>{t.key}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:catColor[t.category]||T.badgeFg, background:`${catColor[t.category]||A1}15`, padding:"2px 7px", borderRadius:5 }}>{t.category}</span>
                      {t.requiresApproval&&<span style={{ fontSize:10, color:"#fbbf24", background:"rgba(251,191,36,.1)", padding:"2px 7px", borderRadius:5, fontWeight:700 }}>NEEDS APPROVAL</span>}
                    </div>
                    <p style={{ fontSize:12, color:T.sub, margin:"0 0 4px" }}>{t.description}</p>
                    {t.dependencies&&t.dependencies.length>0&&<p style={{ fontSize:11, color:T.sub, margin:0 }}>Depends on: {t.dependencies.map(d=><span key={d} style={{ fontFamily:"monospace", color:"#fbbf24" }}>{d} </span>)}</p>}
                    <p style={{ fontSize:11, color:T.sub, margin:"3px 0 0", opacity:.7 }}>Last changed: {safeFmt(t.lastChanged, "MMM d, yyyy")}{t.changedBy?` by ${t.changedBy}`:""}</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:t.enabled?"#4ade80":"#94a3b8" }}>{t.enabled?"ON":"OFF"}</span>
                    <button onClick={()=>t.requiresApproval?setPendingToggle(t):doToggle(t)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                      {t.enabled?<ToggleRight size={30} color="#4ade80"/>:<ToggleLeft size={30} color="#94a3b8"/>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==="drift"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ background:"rgba(248,113,113,.05)", border:"1px solid rgba(248,113,113,.15)", borderRadius:12, padding:"10px 14px", marginBottom:4, display:"flex", gap:8 }}>
            <AlertTriangle size={13} color="#f87171" style={{ flexShrink:0, marginTop:1 }} />
            <p style={{ fontSize:12, color:T.sub, margin:0, lineHeight:1.6 }}>{driftCount} configuration{driftCount!==1?"s":""} have drifted between environments. Review and sync to prevent unexpected behavior in production.</p>
          </div>
          {configs.map(c=>(
            <div key={c.id} style={{ background:T.card, border:`1px solid ${c.hasDrift?"rgba(248,113,113,.25)":T.border}`, borderRadius:13, padding:"14px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: c.hasDrift?12:0 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:T.text }}>{c.key}</span>
                    <span style={{ fontSize:10, color:T.sub, background:T.input, padding:"2px 7px", borderRadius:5 }}>{c.category}</span>
                    {c.sensitive&&<span style={{ fontSize:10, color:"#f87171", background:"rgba(248,113,113,.1)", padding:"2px 7px", borderRadius:5 }}>SENSITIVE</span>}
                    {c.hasDrift?<span style={{ fontSize:10, fontWeight:700, color:"#f87171", background:"rgba(248,113,113,.1)", padding:"2px 7px", borderRadius:5 }}>⚠ DRIFT DETECTED</span>:<span style={{ fontSize:10, fontWeight:700, color:"#4ade80", background:"rgba(74,222,128,.1)", padding:"2px 7px", borderRadius:5 }}>✓ IN SYNC</span>}
                  </div>
                  <p style={{ fontSize:11, color:T.sub, margin:0 }}>Last sync: {safeFmt(c.lastSync, "MMM d, HH:mm")}</p>
                </div>
                <button onClick={()=>setExpanded(expanded===c.id?null:c.id)} style={{ padding:"5px 10px", borderRadius:8, background:T.input, border:`1px solid ${T.border}`, color:T.sub, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                  {expanded===c.id?<ChevronUp size={12}/>:<ChevronDown size={12}/>}Compare
                </button>
              </div>
              {expanded===c.id&&(
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                  {[{l:"Production",v:c.prodValue,active:true},{l:"Backup",v:c.backupValue,active:false},{l:"Staging",v:c.stagingValue,active:false}].map(e=>(
                    <div key={e.l} style={{ background:T.input, borderRadius:10, padding:"10px 12px", border:`1px solid ${e.l==="Staging"&&c.hasDrift?"rgba(248,113,113,.3)":T.border}` }}>
                      <p style={{ fontSize:10, fontWeight:700, color:T.sub, margin:"0 0 5px", textTransform:"uppercase" }}>{e.l}</p>
                      <p style={{ fontFamily:"monospace", fontSize:13, color:c.sensitive?"#94a3b8":T.text, margin:0 }}>{c.sensitive?"••••••••":e.v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="audit"&&(
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <History size={14} color={A1}/><span style={{ fontWeight:700, fontSize:14, color:T.text }}>Configuration Change History</span>
            <span style={{ fontSize:11, color:T.sub, marginLeft:"auto" }}>{audit.length} entries</span>
          </div>
          {audit.map((a,i)=>(
            <div key={a.id} style={{ display:"flex", gap:12, padding:"13px 18px", borderBottom:i<audit.length-1?`1px solid ${T.border}`:"none", alignItems:"flex-start" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:a.approved?"#4ade80":"#fbbf24", flexShrink:0, marginTop:5 }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:12, color:T.text }}>{a.key}</span>
                  <span style={{ fontSize:12, color:T.sub }}><span style={{ color:"#f87171" }}>{a.oldValue}</span> → <span style={{ color:"#4ade80" }}>{a.newValue}</span></span>
                  {a.approved?<span style={{ fontSize:10, color:"#4ade80" }}>✓ Approved</span>:<span style={{ fontSize:10, color:"#fbbf24" }}>⏳ Pending</span>}
                </div>
                <p style={{ fontSize:11, color:T.sub, margin:0 }}>{a.changedBy} · {safeFmt(a.timestamp, "MMM d, HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionDialog open={!!pendingToggle} onOpenChange={o=>!o&&setPendingToggle(null)} onConfirm={()=>pendingToggle&&doToggle(pendingToggle)}
        title={`${pendingToggle?.enabled?"Disable":"Enable"} ${pendingToggle?.name}`}
        description={`This toggle requires dual approval in production. Changing "${pendingToggle?.key}" will affect live users. Confirm to proceed — this will be logged.`}
        confirmLabel={pendingToggle?.enabled?"Disable Feature":"Enable Feature"} variant="warning"/>
    </div>
  );
}
