import { useState } from "react";
import { toast } from "sonner";
import { Award, Plus, Edit2, Trash2, Save, X, Star, Shield, Zap, Trophy, Target, TrendingUp } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const A1 = "#6366f1";
const BADGE_KEY = "admin_badges_v1";

type BadgeDef = {
  id: string; name: string; description: string; icon: string; color: string;
  criteria: string; criteriaValue: number; autoAward: boolean; active: boolean; createdAt: string;
};

const ICON_OPTIONS = ["Star","Shield","Zap","Trophy","Target","TrendingUp","Award"];
const COLOR_OPTIONS = ["#6366f1","#8b5cf6","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#f97316"];

const ICON_MAP: Record<string, any> = { Star, Shield, Zap, Trophy, Target, TrendingUp, Award };

function seed(): BadgeDef[] {
  return [
    { id:"b1", name:"Rising Star",     description:"Completed first 3 jobs successfully", icon:"Star",      color:"#f59e0b", criteria:"jobs_completed",    criteriaValue:3,   autoAward:true,  active:true, createdAt:new Date(Date.now()-86400000*30).toISOString() },
    { id:"b2", name:"Top Performer",   description:"Completed 10+ jobs with 4.5+ rating",  icon:"Trophy",    color:"#6366f1", criteria:"jobs_completed",    criteriaValue:10,  autoAward:true,  active:true, createdAt:new Date(Date.now()-86400000*25).toISOString() },
    { id:"b3", name:"Verified Pro",    description:"Aadhaar & bank account verified",        icon:"Shield",    color:"#10b981", criteria:"kyc_complete",      criteriaValue:1,   autoAward:true,  active:true, createdAt:new Date(Date.now()-86400000*20).toISOString() },
    { id:"b4", name:"Speed Demon",     description:"Delivered 5 projects before deadline",   icon:"Zap",       color:"#f97316", criteria:"early_deliveries",  criteriaValue:5,   autoAward:true,  active:true, createdAt:new Date(Date.now()-86400000*15).toISOString() },
    { id:"b5", name:"Elite Freelancer",description:"Earned ₹1,00,000 on the platform",       icon:"TrendingUp",color:"#ec4899", criteria:"total_earnings",    criteriaValue:100000, autoAward:true, active:true, createdAt:new Date(Date.now()-86400000*10).toISOString() },
  ];
}

function load(): BadgeDef[] {
  try { const d = localStorage.getItem(BADGE_KEY); if (d) return JSON.parse(d); } catch {}
  const s = seed(); localStorage.setItem(BADGE_KEY, JSON.stringify(s)); return s;
}
function save(b: BadgeDef[]) { localStorage.setItem(BADGE_KEY, JSON.stringify(b)); }

const CRITERIA_LABELS: Record<string, string> = {
  jobs_completed: "Jobs Completed",
  kyc_complete: "KYC Verified",
  early_deliveries: "Early Deliveries",
  total_earnings: "Total Earnings (₹)",
  rating_above: "Rating Above",
  referrals: "Referrals Made",
};

const blank = (): Omit<BadgeDef,"id"|"createdAt"> => ({ name:"", description:"", icon:"Star", color:"#6366f1", criteria:"jobs_completed", criteriaValue:1, autoAward:true, active:true });

const AdminBadgeManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [badges, setBadges] = useState<BadgeDef[]>(load);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState(blank());
  const f = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setForm(blank()); setEditId(null); setShowAdd(true); };
  const openEdit = (b: BadgeDef) => { setForm({ name:b.name, description:b.description, icon:b.icon, color:b.color, criteria:b.criteria, criteriaValue:b.criteriaValue, autoAward:b.autoAward, active:b.active }); setEditId(b.id); setShowAdd(true); };

  const submit = () => {
    if (!form.name.trim()) return toast.error("Badge name required");
    if (editId) {
      const updated = badges.map(b => b.id === editId ? { ...b, ...form } : b);
      setBadges(updated); save(updated); toast.success("Badge updated");
    } else {
      const newB: BadgeDef = { ...form, id:`b${Date.now()}`, createdAt: new Date().toISOString() };
      const updated = [...badges, newB]; setBadges(updated); save(updated); toast.success("Badge created");
    }
    setShowAdd(false); setEditId(null);
  };

  const del = (id: string) => {
    const updated = badges.filter(b => b.id !== id); setBadges(updated); save(updated); toast.success("Badge deleted");
  };

  const toggleActive = (id: string) => {
    const updated = badges.map(b => b.id === id ? { ...b, active: !b.active } : b);
    setBadges(updated); save(updated);
  };

  const bs = (c: string, bg: string) => ({ background:bg, color:c, border:`1px solid ${c}33`, borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700 });

  return (
    <div style={{ padding:"24px 16px", maxWidth:980, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, color:T.text, margin:0 }}>Badge Management</h1>
          <p style={{ color:T.sub, fontSize:13, marginTop:4 }}>Create and manage achievement badges with auto-award rules</p>
        </div>
        <button onClick={openAdd} style={{ background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={14}/> New Badge
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {badges.map(b => {
          const Icon = ICON_MAP[b.icon] || Award;
          return (
            <div key={b.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, position:"relative" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${b.color}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon size={22} color={b.color} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:15, color:T.text }}>{b.name}</div>
                  <div style={{ display:"flex", gap:6, marginTop:3 }}>
                    <span style={bs(b.active ? "#4ade80" : "#f87171", b.active ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)")}>{b.active ? "Active" : "Inactive"}</span>
                    {b.autoAward && <span style={bs("#6366f1","rgba(99,102,241,.12)")}>Auto-Award</span>}
                  </div>
                </div>
              </div>
              <p style={{ fontSize:12, color:T.sub, marginBottom:10, lineHeight:1.5 }}>{b.description}</p>
              <div style={{ background:`${b.color}10`, borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
                <div style={{ fontSize:11, color:T.sub, marginBottom:2 }}>Criteria</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{CRITERIA_LABELS[b.criteria] || b.criteria}: {b.criteria==="total_earnings" ? `₹${b.criteriaValue.toLocaleString("en-IN")}` : b.criteriaValue}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>openEdit(b)} style={{ flex:1, background:`${A1}15`, border:`1px solid ${A1}33`, borderRadius:7, padding:"6px", cursor:"pointer", color:A1, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}><Edit2 size={12}/> Edit</button>
                <button onClick={()=>toggleActive(b.id)} style={{ flex:1, background: b.active?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)", border:`1px solid ${b.active?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)"}`, borderRadius:7, padding:"6px", cursor:"pointer", color:b.active?"#f87171":"#4ade80", fontSize:12 }}>{b.active?"Disable":"Enable"}</button>
                <button onClick={()=>del(b.id)} style={{ background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.3)", borderRadius:7, padding:"6px 10px", cursor:"pointer", color:"#f87171" }}><Trash2 size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background: themeKey==="black"?"#0f0f23":"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:28, maxWidth:480, width:"100%", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:17, color:T.text, margin:0 }}>{editId?"Edit Badge":"New Badge"}</h2>
              <button onClick={()=>setShowAdd(false)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub }}><X size={20}/></button>
            </div>
            {[
              { label:"Badge Name", key:"name", type:"text" },
              { label:"Description", key:"description", type:"text" },
            ].map(fi => (
              <div key={fi.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>{fi.label}</label>
                <input value={(form as any)[fi.key]} onChange={e=>f(fi.key as any, e.target.value)} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Icon</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {ICON_OPTIONS.map(ico => {
                  const I = ICON_MAP[ico]; return (
                    <button key={ico} onClick={()=>f("icon",ico)} style={{ width:38, height:38, borderRadius:8, background:form.icon===ico?`${form.color}30`:T.input, border:`2px solid ${form.icon===ico?form.color:T.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <I size={16} color={form.icon===ico?form.color:T.sub}/>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Color</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={()=>f("color",c)} style={{ width:28, height:28, borderRadius:6, background:c, border:`3px solid ${form.color===c?"#fff":"transparent"}`, cursor:"pointer", outline: form.color===c?`2px solid ${c}`:"none" }} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Award Criteria</label>
              <select value={form.criteria} onChange={e=>f("criteria",e.target.value)} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" }}>
                {Object.entries(CRITERIA_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:T.sub, display:"block", marginBottom:5 }}>Criteria Value</label>
              <input type="number" value={form.criteriaValue} onChange={e=>f("criteriaValue",Number(e.target.value))} style={{ width:"100%", background:T.input, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex", gap:14, marginBottom:18 }}>
              {[{label:"Auto Award",key:"autoAward"},{label:"Active",key:"active"}].map(sw=>(
                <label key={sw.key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <div onClick={()=>f(sw.key as any, !(form as any)[sw.key])} style={{ width:36, height:20, borderRadius:10, background:(form as any)[sw.key]?A1:"rgba(148,163,184,.3)", position:"relative", cursor:"pointer", transition:"background .2s" }}>
                    <div style={{ position:"absolute", top:2, left:(form as any)[sw.key]?16:2, width:16, height:16, borderRadius:8, background:"#fff", transition:"left .2s" }}/>
                  </div>
                  <span style={{ fontSize:13, color:T.text }}>{sw.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowAdd(false)} style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px", cursor:"pointer", color:T.text, fontWeight:600 }}>Cancel</button>
              <button onClick={submit} style={{ flex:2, background:`linear-gradient(135deg,${A1},#8b5cf6)`, border:"none", borderRadius:8, padding:"9px", cursor:"pointer", color:"#fff", fontWeight:700 }}>{editId?"Save Changes":"Create Badge"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBadgeManagement;
