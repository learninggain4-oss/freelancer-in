import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { TrendingUp, RefreshCw, Lock, RotateCcw, Edit2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type RiskUser = { id:string; name:string; email:string; score:number; level:string; locked:boolean;
  factors:{ name:string; value:number; weight:number }[] };

const lvlColor = (l: string) => l==="critical"?"#f87171":l==="high"?"#f97316":l==="medium"?"#fbbf24":"#4ade80";

const getName = (fn: string[] | null | undefined) => fn?.join(" ").trim() || "Unknown User";

function computeRisk(p: { wallet_active: boolean | null; available_balance: number | null; hold_balance: number | null }) {
  const factors = [
    { name:"Wallet inactive", value: p.wallet_active === false ? 30 : 0, weight: 3 },
    { name:"Zero balance", value: (p.available_balance || 0) === 0 ? 20 : 0, weight: 2 },
    { name:"Hold balance", value: (p.hold_balance || 0) > 0 ? 15 : 0, weight: 2 },
    { name:"High available balance", value: (p.available_balance || 0) > 50000 ? 10 : 0, weight: 1 },
  ].filter(f => f.value > 0);
  const score = Math.min(100, factors.reduce((s, f) => s + f.value, 0));
  const level = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";
  return { score, level, factors };
}

export default function AdminUserRiskScore() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [overrideVal, setOverrideVal] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [recalculating, setRecalculating] = useState<string|null>(null);
  const [expandHistory, setExpandHistory] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, { score:number; level:string; locked:boolean }>>({});

  const { data: rawProfiles = [], isLoading } = useQuery({
    queryKey: ["admin-user-risk-scores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, wallet_active, available_balance, hold_balance")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: autoUpdate ? 60000 : false,
  });

  const users: RiskUser[] = rawProfiles
    .map(p => {
      const base = computeRisk(p);
      const ov = overrides[p.id];
      return {
        id: p.id,
        name: getName(p.full_name),
        email: p.email || "—",
        score: ov?.score ?? base.score,
        level: ov?.level ?? base.level,
        locked: ov?.locked ?? false,
        factors: base.factors,
      };
    })
    .filter(u => u.score > 0)
    .sort((a, b) => b.score - a.score);

  const sel = users.find(u => u.id === selectedId);

  const resetScore = (id: string) => setOverrides(o => ({ ...o, [id]: { score:0, level:"low", locked:false } }));
  const lockScore = (id: string) => setOverrides(o => ({ ...o, [id]: { ...(o[id] || { score:0, level:"low" }), locked:!(o[id]?.locked) } }));
  const forceRecalc = (id: string) => { setRecalculating(id); setTimeout(() => setRecalculating(null), 1800); };
  const applyOverride = () => {
    const v = parseInt(overrideVal);
    if (isNaN(v) || !selectedId) return;
    const clamped = Math.min(100, Math.max(0, v));
    const lvl = clamped>=75?"critical":clamped>=50?"high":clamped>=25?"medium":"low";
    setOverrides(o => ({ ...o, [selectedId]: { score:clamped, level:lvl, locked:o[selectedId]?.locked||false } }));
    setShowOverride(false); setOverrideVal("");
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"24px", fontFamily:"Inter,sans-serif" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${A1},${A2})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${A1}40` }}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>User Risk Score Management</h1>
            <p style={{ fontSize:13, color:T.sub, margin:0 }}>Risk scoring (0–100) with factor breakdown and admin controls</p>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.sub, cursor:"pointer" }}>
              <div onClick={()=>setAutoUpdate(x=>!x)} style={{ width:36, height:20, borderRadius:10, background:autoUpdate?A1:T.input, position:"relative", cursor:"pointer" }}>
                <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:autoUpdate?18:2 }} />
              </div>
              Auto Update
            </label>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:64, gap:12 }}>
            <Loader2 size={24} color={A1} />
            <span style={{ color:T.sub, fontSize:14 }}>Loading risk scores…</span>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20 }}>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:16, backdropFilter:"blur(10px)", height:"fit-content" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>Users with Risk ({users.length})</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {users.length === 0
                  ? <div style={{ textAlign:"center", padding:"32px 12px", color:T.sub, fontSize:13 }}>No users with risk scores</div>
                  : users.map(u => (
                    <div key={u.id} onClick={()=>setSelectedId(u.id)} style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${selectedId===u.id?A1:T.border}`, background:selectedId===u.id?`${A1}10`:T.input, cursor:"pointer" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{u.name}</div>
                          <div style={{ fontSize:11, color:T.sub }}>{u.email}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:lvlColor(u.level) }}>{u.score}</div>
                          <span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:`${lvlColor(u.level)}18`, color:lvlColor(u.level), fontWeight:700, textTransform:"capitalize" }}>{u.level}</span>
                        </div>
                      </div>
                      {overrides[u.id]?.locked && <div style={{ fontSize:11, color:"#fbbf24", marginTop:4 }}>🔒 Score Locked</div>}
                    </div>
                  ))
                }
              </div>
            </div>

            {sel && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                    <div>
                      <h2 style={{ fontSize:18, fontWeight:700, color:T.text, margin:0 }}>{sel.name}</h2>
                      <div style={{ fontSize:13, color:T.sub }}>{sel.email}</div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:48, fontWeight:800, color:lvlColor(sel.level), lineHeight:1 }}>{sel.score}</div>
                      <span style={{ padding:"4px 12px", borderRadius:20, background:`${lvlColor(sel.level)}18`, color:lvlColor(sel.level), fontSize:12, fontWeight:700, textTransform:"capitalize" }}>{sel.level} Risk</span>
                    </div>
                  </div>
                  <div style={{ height:12, borderRadius:6, background:T.input, overflow:"hidden", marginBottom:20 }}>
                    <div style={{ height:"100%", width:`${sel.score}%`, borderRadius:6, background:`linear-gradient(to right,#4ade80,#fbbf24,#f87171)` }} />
                  </div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <button onClick={()=>setShowOverride(x=>!x)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${A1}`, background:`${A1}15`, color:A1, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Edit2 size={14}/> Override Score</button>
                    <button onClick={()=>resetScore(sel.id)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid #fbbf24`, background:"rgba(251,191,36,.1)", color:"#fbbf24", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><RotateCcw size={14}/> Reset Score</button>
                    <button onClick={()=>lockScore(sel.id)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${overrides[sel.id]?.locked?"#4ade80":"#f87171"}`, background:overrides[sel.id]?.locked?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)", color:overrides[sel.id]?.locked?"#4ade80":"#f87171", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Lock size={14}/> {overrides[sel.id]?.locked?"Unlock":"Lock"} Score</button>
                    <button onClick={()=>forceRecalc(sel.id)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><RefreshCw size={14} style={{ animation:recalculating===sel.id?"spin 1s linear infinite":"none" }}/> Force Recalculate</button>
                  </div>
                  {showOverride && (
                    <div style={{ marginTop:16, display:"flex", gap:10, alignItems:"center" }}>
                      <input value={overrideVal} onChange={e=>setOverrideVal(e.target.value)} placeholder="Enter score (0–100)" type="number" style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.text, fontSize:13 }} />
                      <button onClick={applyOverride} style={{ padding:"8px 16px", borderRadius:8, background:`linear-gradient(135deg,${A1},${A2})`, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer" }}>Apply</button>
                    </div>
                  )}
                </div>

                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 16px" }}>Risk Score Breakdown</h3>
                  {sel.factors.length === 0
                    ? <div style={{ color:T.sub, fontSize:13 }}>No risk factors detected for this user.</div>
                    : (
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {sel.factors.map(f => (
                          <div key={f.name} style={{ display:"flex", alignItems:"center", gap:12 }}>
                            <div style={{ width:200, fontSize:12, color:T.sub }}>{f.name}</div>
                            <div style={{ flex:1, height:6, borderRadius:3, background:T.input, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${Math.min(100,(f.value/30)*100)}%`, borderRadius:3, background:A1, opacity:0.8 }} />
                            </div>
                            <div style={{ width:40, fontSize:12, color:T.text, textAlign:"right" }}>+{f.value}</div>
                            <div style={{ width:50, fontSize:12, color:T.sub, textAlign:"right" }}>w:{f.weight}</div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, backdropFilter:"blur(10px)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:0 }}>Risk Score History</h3>
                    <button onClick={()=>setExpandHistory(x=>!x)} style={{ background:"none", border:"none", color:T.sub, cursor:"pointer" }}>{expandHistory?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>
                  </div>
                  <div style={{ color:T.sub, fontSize:13 }}>Detailed score history is recorded in the audit log.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
