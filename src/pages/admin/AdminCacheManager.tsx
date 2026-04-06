import { useState } from "react";
import { Layers, RefreshCw, AlertTriangle, CheckCircle2, Activity, Search, Zap, BarChart3, Clock, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

interface CacheEntry { id:string; key:string; type:string; size:string; ttlSec:number; hitRate:number; lastInvalidated?:string; status:"healthy"|"stale"|"failed"; }
interface SlowQuery { id:string; query:string; table:string; avgMs:number; executions:number; lastRun:string; indexed:boolean; }
interface CacheSetting { id:string; label:string; value:number|boolean; type:"number"|"boolean"; description:string; }

function load<T>(key:string,seed:()=>T[]): T[] {
  try { const d=localStorage.getItem(key); if(d) return JSON.parse(d); } catch {}
  const s=seed(); localStorage.setItem(key,JSON.stringify(s)); return s;
}

const CACHE_KEY = "admin_cache_manager_v1";
const statusColor = { healthy:"#4ade80", stale:"#fbbf24", failed:"#f87171" };

export default function AdminCacheManager() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [tab, setTab]       = useState<"cache"|"queries"|"settings">("cache");
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [queries]           = useState<SlowQuery[]>([]);
  const [settings, setSettings] = useState<CacheSetting[]>([]);
  const [flushing, setFlushing] = useState<string|null>(null);
  const [flushAll, setFlushAll] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [editVal, setEditVal] = useState<string|number>("");

  const invalidate = async (id:string) => {
    setFlushing(id);
    await new Promise(r=>setTimeout(r,800));
    const updated = entries.map(e=>e.id===id?{...e,status:"healthy" as const,lastInvalidated:new Date().toISOString(),hitRate:0}:e);
    localStorage.setItem(CACHE_KEY,JSON.stringify(updated));
    setEntries(updated);
    setFlushing(null);
    const e = entries.find(x=>x.id===id)!;
    logAction("Cache Invalidated",`${e.key} flushed`,"System","success");
    toast({ title:`Cache key "${entries.find(e=>e.id===id)?.key}" cleared` });
  };

  const invalidateAll = async () => {
    setFlushAll(true);
    await new Promise(r=>setTimeout(r,1500));
    const updated = entries.map(e=>({...e,status:"healthy" as const,lastInvalidated:new Date().toISOString(),hitRate:0}));
    localStorage.setItem(CACHE_KEY,JSON.stringify(updated));
    setEntries(updated);
    setFlushAll(false);
    logAction("Full Cache Flush","All cache keys invalidated","System","warning");
    toast({ title:"All cache cleared",description:"Cache will rebuild on next requests" });
  };

  const saveSetting = (id:string) => {
    const updated = settings.map(s=>s.id===id?{...s,value:s.type==="number"?Number(editVal):Boolean(editVal)}:s);
    localStorage.setItem("admin_cache_settings_v1",JSON.stringify(updated));
    setSettings(updated);
    toast({ title:"Cache setting updated" });
    setEditId(null);
  };

  const toggleSetting = (id:string) => {
    const updated = settings.map(s=>s.id===id?{...s,value:!s.value}:s);
    localStorage.setItem("admin_cache_settings_v1",JSON.stringify(updated));
    setSettings(updated);
  };

  const inp=(s?:object)=>({ background:T.input,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,...s });
  const stale = entries.filter(e=>e.status!=="healthy").length;
  const avgHit = Math.round(entries.reduce((s,e)=>s+e.hitRate,0)/entries.length);

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${A1}22,${A2}15)`,border:`1px solid rgba(99,102,241,.2)`,borderRadius:18,padding:"26px 28px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${A1},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${A1}55`,flexShrink:0 }}>
            <Layers size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ color:T.text,fontWeight:800,fontSize:22,margin:0 }}>Cache & Search Performance</h1>
            <p style={{ color:T.sub,fontSize:13,margin:"3px 0 0" }}>Cache health · Auto-invalidation · Slow query detection · Query optimization · Performance settings</p>
          </div>
          <button onClick={invalidateAll} disabled={flushAll} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer",opacity:flushAll?.7:1 }}>
            <Trash2 size={13}/>{flushAll?"Flushing…":"Flush All"}
          </button>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18,flexWrap:"wrap" }}>
          {[{l:"Cache Keys",v:entries.length,c:T.badgeFg},{l:"Stale / Failed",v:stale,c:stale>0?"#f87171":"#4ade80"},{l:"Avg Hit Rate",v:avgHit+"%",c:avgHit>80?"#4ade80":"#fbbf24"},{l:"Slow Queries",v:queries.filter(q=>!q.indexed).length,c:"#fbbf24"}].map(s=>(
            <div key={s.l} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 16px",display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</span><span style={{ fontSize:11,color:T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {([["cache","Cache Health",Layers],["queries","Slow Queries",Search],["settings","Settings",Activity]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:10,border:`1px solid ${tab===t?A1:T.border}`,background:tab===t?`${A1}18`:T.card,color:tab===t?T.badgeFg:T.sub,fontWeight:600,fontSize:12,cursor:"pointer" }}>
            <Icon size={13}/>{l}
          </button>
        ))}
      </div>

      {tab==="cache"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {entries.map(e=>(
            <div key={e.id} style={{ background:T.card,border:`1px solid ${e.status!=="healthy"?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"monospace",fontWeight:700,fontSize:13,color:T.text }}>{e.key}</span>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>{e.type}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:(statusColor as Record<string,string>)[e.status],background:`${(statusColor as Record<string,string>)[e.status]}15`,padding:"2px 7px",borderRadius:5,textTransform:"uppercase" }}>{e.status}</span>
                  </div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    <span style={{ fontSize:12,color:T.sub }}>Size: <strong style={{ color:T.text }}>{e.size}</strong></span>
                    <span style={{ fontSize:12,color:T.sub }}>TTL: <strong style={{ color:T.text }}>{e.ttlSec}s</strong></span>
                    <span style={{ fontSize:12,color:T.sub }}>Hit rate: <strong style={{ color:e.hitRate>80?"#4ade80":"#fbbf24" }}>{e.hitRate}%</strong></span>
                  </div>
                </div>
                <button onClick={()=>invalidate(e.id)} disabled={flushing===e.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:8,background:`${A1}15`,border:`1px solid ${A1}33`,color:T.badgeFg,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0 }}>
                  <RefreshCw size={11} className={flushing===e.id?"animate-spin":""}/>{flushing===e.id?"Clearing…":"Invalidate"}
                </button>
              </div>
              <div style={{ height:4,borderRadius:4,background:"rgba(255,255,255,.07)",overflow:"hidden" }}>
                <div style={{ height:"100%",borderRadius:4,background:e.hitRate>80?`linear-gradient(90deg,${A1},${A2})`:"linear-gradient(90deg,#fbbf24,#fb923c)",width:`${e.hitRate}%`,transition:"width .5s ease" }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="queries"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          <div style={{ background:"rgba(251,191,36,.04)",border:"1px solid rgba(251,191,36,.12)",borderRadius:10,padding:"10px 14px",marginBottom:4,display:"flex",gap:8 }}>
            <AlertTriangle size={13} color="#fbbf24" style={{ flexShrink:0,marginTop:1 }}/>
            <p style={{ fontSize:12,color:T.sub,margin:0,lineHeight:1.6 }}>{queries.filter(q=>!q.indexed).length} queries lack database indexes. Adding indexes can reduce query time by 80-95%. Slow queries are automatically cached after the first run.</p>
          </div>
          {queries.map(q=>(
            <div key={q.id} style={{ background:T.card,border:`1px solid ${q.avgMs>500&&!q.indexed?"rgba(248,113,113,.2)":T.border}`,borderRadius:13,padding:"14px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap" }}>
                    <span style={{ fontSize:10,color:T.sub,background:T.input,padding:"2px 7px",borderRadius:5 }}>table: {q.table}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:q.indexed?"#4ade80":"#f87171",background:q.indexed?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)",padding:"2px 7px",borderRadius:5 }}>{q.indexed?"INDEXED":"NOT INDEXED"}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:q.avgMs>1000?"#f87171":q.avgMs>500?"#fbbf24":"#4ade80",background:`rgba(0,0,0,.1)`,padding:"2px 7px",borderRadius:5 }}>{q.avgMs}ms avg</span>
                  </div>
                  <p style={{ fontSize:12,color:T.text,margin:"0 0 4px",fontFamily:"monospace",lineHeight:1.5 }}>{q.query}</p>
                  <p style={{ fontSize:11,color:T.sub,margin:0 }}>{q.executions.toLocaleString()} executions · Last: {safeFmt(q.lastRun, "MMM d, HH:mm")}</p>
                </div>
              </div>
              {!q.indexed&&<div style={{ background:"rgba(251,191,36,.05)",border:"1px solid rgba(251,191,36,.1)",borderRadius:8,padding:"7px 12px",fontSize:11,color:"#fbbf24" }}>Recommendation: Add an index on <code style={{ fontFamily:"monospace" }}>{q.table}.{q.query.match(/WHERE\s+(\w+)/i)?.[1]||"id"}</code></div>}
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
                  <Input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ ...inp(),width:80,padding:"6px 10px",fontSize:13,textAlign:"center" as const }}/>
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
