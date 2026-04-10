import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, Edit2, Save, X, Users, Star, IndianRupee, ChevronUp, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const LEVELS_KEY = "admin_freelancer_levels_v1";
const PAGE_SIZE = 12;

type Level = { id: string; name: string; icon: string; color: string; minEarnings: number; minRating: number; minReviews: number; minCompletionRate: number; perks: string[] };

function defaultLevels(): Level[] {
  return [
    { id: "l1", name: "Level 1", icon: "🌱", color: "#94a3b8", minEarnings: 0, minRating: 0, minReviews: 0, minCompletionRate: 0, perks: ["Basic profile listing", "Apply to jobs"] },
    { id: "l2", name: "Level 2", icon: "⭐", color: "#6366f1", minEarnings: 10000, minRating: 4.0, minReviews: 5, minCompletionRate: 80, perks: ["Priority listing", "Level 2 badge", "Reduced fees 12%"] },
    { id: "l3", name: "Top Rated", icon: "🏆", color: "#f59e0b", minEarnings: 100000, minRating: 4.5, minReviews: 20, minCompletionRate: 90, perks: ["Featured in search", "Top Rated badge", "Reduced fees 8%", "Priority support"] },
    { id: "l4", name: "Expert", icon: "💎", color: "#8b5cf6", minEarnings: 500000, minRating: 4.8, minReviews: 50, minCompletionRate: 95, perks: ["Homepage showcase", "Expert badge", "Fees 5%", "Dedicated account manager", "Verified seal"] },
  ];
}
function loadLevels(): Level[] {
  try { const d = localStorage.getItem(LEVELS_KEY); if (d) return JSON.parse(d); } catch { }
  const s = defaultLevels(); localStorage.setItem(LEVELS_KEY, JSON.stringify(s)); return s;
}
function saveLevels(l: Level[]) { localStorage.setItem(LEVELS_KEY, JSON.stringify(l)); }

const AdminFreelancerLevels = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [levels, setLevels] = useState<Level[]>(loadLevels);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Level | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [overrideUser, setOverrideUser] = useState<any>(null);
  const [overrideLevel, setOverrideLevel] = useState("");

  const { data: freelancers = [], isLoading } = useQuery({
    queryKey: ["admin-fl-levels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id,full_name,user_code,rating,total_earnings,user_level,profile_completion_percentage,user_type")
        .eq("user_type", "employee")
        .order("total_earnings", { ascending: false })
        .limit(500);
      return (data || []).map((f: any) => {
        const earnings = Number(f.total_earnings || 0);
        const rating = Number(f.rating || 0);
        const computedLevel = levels.slice().reverse().find(l => earnings >= l.minEarnings && rating >= l.minRating);
        return { ...f, computedLevel: computedLevel?.id || "l1", computedLevelName: computedLevel?.name || "Level 1" };
      });
    },
  });

  const filtered = freelancers.filter((f: any) => {
    const q = search.toLowerCase();
    const name = (f.full_name || []).join(" ").toLowerCase();
    return !q || name.includes(q) || (f.user_code || []).join("").toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (l: Level) => { setEditId(l.id); setEditForm({ ...l, perks: [...l.perks] }); };
  const saveEdit = () => {
    if (!editForm) return;
    const up = levels.map(l => l.id === editId ? editForm : l);
    setLevels(up); saveLevels(up); setEditId(null); setEditForm(null);
    toast.success("Level criteria updated");
  };

  const doOverride = async () => {
    if (!overrideUser || !overrideLevel) return;
    const { error } = await supabase.from("profiles").update({ user_level: overrideLevel }).eq("user_id", overrideUser.user_id);
    if (error) return toast.error("Override failed");
    toast.success("Level overridden"); setOverrideUser(null); setOverrideLevel("");
    qc.invalidateQueries({ queryKey: ["admin-fl-levels"] });
  };

  const getLevelMeta = (id: string) => levels.find(l => l.id === id) || levels[0];
  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1050, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Freelancer Level System</h1>
        <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Define level criteria and manage freelancer tier upgrades</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
        {levels.map(l => {
          const count = freelancers.filter((f: any) => f.computedLevel === l.id).length;
          const isEditing = editId === l.id;
          return (
            <div key={l.id} style={{ background: T.card, border: `2px solid ${l.color}33`, borderRadius: 14, padding: 18 }}>
              {isEditing && editForm ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Edit {l.name}</span>
                    <button onClick={() => setEditId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={15} /></button>
                  </div>
                  {[
                    { label: "Min Earnings (₹)", key: "minEarnings", type: "number" },
                    { label: "Min Rating", key: "minRating", type: "number" },
                    { label: "Min Reviews", key: "minReviews", type: "number" },
                    { label: "Min Completion %", key: "minCompletionRate", type: "number" },
                  ].map(fi => (
                    <div key={fi.key} style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, color: T.sub, display: "block", marginBottom: 3 }}>{fi.label}</label>
                      <input type={fi.type} value={(editForm as any)[fi.key]} onChange={e => setEditForm(p => p ? { ...p, [fi.key]: Number(e.target.value) } : p)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, padding: "6px 10px", fontSize: 12, boxSizing: "border-box" as any }} />
                    </div>
                  ))}
                  <button onClick={saveEdit} style={{ width: "100%", background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, marginTop: 4 }}>Save Changes</button>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontSize: 28 }}>{l.icon}</div>
                    <button onClick={() => openEdit(l)} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: A1 }}><Edit2 size={11} /></button>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: l.color, marginBottom: 4 }}>{l.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>{count} <span style={{ fontSize: 12, color: T.sub, fontWeight: 400 }}>freelancers</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: T.sub }}>
                    <span>💰 Min ₹{l.minEarnings.toLocaleString("en-IN")}</span>
                    <span>⭐ Rating ≥ {l.minRating}</span>
                    <span>📝 {l.minReviews}+ reviews</span>
                    <span>✅ {l.minCompletionRate}% completion</span>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {l.perks.map((p, i) => <span key={i} style={{ fontSize: 10, background: `${l.color}12`, color: l.color, borderRadius: 4, padding: "2px 6px", border: `1px solid ${l.color}22` }}>{p}</span>)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", flex: 1, maxWidth: 320 }}>
            <Search size={13} color={T.sub} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search freelancers..." style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1 }} />
          </div>
          <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} freelancers</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Freelancer", "Earnings", "Rating", "Computed Level", "DB Level", "Action"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: T.sub }}>Loading...</td></tr>}
              {paginated.map((f: any) => {
                const cm = getLevelMeta(f.computedLevel);
                const dm = getLevelMeta(f.user_level || "l1");
                const mismatch = f.computedLevel !== (f.user_level || "l1");
                return (
                  <tr key={f.user_id} style={{ borderBottom: `1px solid ${T.border}20`, background: mismatch ? "rgba(251,191,36,.03)" : "transparent" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{(f.full_name || []).join(" ") || "User"}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{(f.user_code || []).join("") || "—"}</div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#4ade80", fontWeight: 700 }}>₹{Number(f.total_earnings || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>★ {Number(f.rating || 0).toFixed(1)}</td>
                    <td style={{ padding: "10px 14px" }}><span style={bs(cm.color, `${cm.color}15`)}>{cm.icon} {cm.name}</span></td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={bs(dm.color, `${dm.color}15`)}>{dm.icon} {dm.name}</span>
                      {mismatch && <span style={{ fontSize: 10, color: "#fbbf24", marginLeft: 4 }}>⚠️</span>}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => { setOverrideUser(f); setOverrideLevel(f.user_level || "l1"); }} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: A1, fontSize: 12 }}>Override</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} freelancers</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12 }}><ChevronLeft size={13} /></button>
              <span style={{ padding: "5px 10px", fontSize: 12, color: T.sub }}>{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12 }}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>

      {overrideUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 380, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>Manual Level Override</h2>
              <button onClick={() => setOverrideUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 16, padding: "12px 14px", background: `${A1}08`, borderRadius: 8 }}>
              <div style={{ fontWeight: 700, color: T.text }}>{(overrideUser.full_name || []).join(" ")}</div>
              <div style={{ fontSize: 12, color: T.sub }}>{(overrideUser.user_code || []).join("")}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 6 }}>Set Level</label>
              <select value={overrideLevel} onChange={e => setOverrideLevel(e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13 }}>
                {levels.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setOverrideUser(null)} style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", cursor: "pointer", color: T.text, fontWeight: 600 }}>Cancel</button>
              <button onClick={doOverride} style={{ flex: 2, background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#fff", fontWeight: 700 }}>Apply Override</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFreelancerLevels;
