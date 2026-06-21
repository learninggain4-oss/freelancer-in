import { useState } from "react";
import { toast } from "sonner";
import { IndianRupee, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const RC_KEY = "admin_rate_cards_v1";

type RateCard = { id: string; category: string; subcategory: string; minHourly: number; maxHourly: number; minProject: number; maxProject: number; currency: "INR"; unit: "hour" | "project" | "word" | "page"; visible: boolean };

function defaultCards(): RateCard[] {
  return [
    { id: "rc1", category: "Web Development", subcategory: "React / Next.js", minHourly: 500, maxHourly: 3000, minProject: 5000, maxProject: 500000, currency: "INR", unit: "hour", visible: true },
    { id: "rc2", category: "Web Development", subcategory: "WordPress", minHourly: 200, maxHourly: 1500, minProject: 2000, maxProject: 100000, currency: "INR", unit: "hour", visible: true },
    { id: "rc3", category: "Mobile App", subcategory: "React Native", minHourly: 600, maxHourly: 3500, minProject: 20000, maxProject: 1000000, currency: "INR", unit: "hour", visible: true },
    { id: "rc4", category: "UI/UX Design", subcategory: "Figma / XD", minHourly: 400, maxHourly: 2500, minProject: 3000, maxProject: 300000, currency: "INR", unit: "hour", visible: true },
    { id: "rc5", category: "Content Writing", subcategory: "Blog / Article", minHourly: 100, maxHourly: 800, minProject: 500, maxProject: 20000, currency: "INR", unit: "word", visible: true },
    { id: "rc6", category: "Content Writing", subcategory: "Copywriting", minHourly: 200, maxHourly: 1500, minProject: 1000, maxProject: 50000, currency: "INR", unit: "page", visible: true },
    { id: "rc7", category: "Digital Marketing", subcategory: "SEO", minHourly: 300, maxHourly: 2000, minProject: 5000, maxProject: 200000, currency: "INR", unit: "hour", visible: true },
    { id: "rc8", category: "Digital Marketing", subcategory: "Social Media", minHourly: 200, maxHourly: 1500, minProject: 3000, maxProject: 100000, currency: "INR", unit: "project", visible: true },
    { id: "rc9", category: "Graphic Design", subcategory: "Logo Design", minHourly: 300, maxHourly: 2000, minProject: 2000, maxProject: 50000, currency: "INR", unit: "project", visible: true },
    { id: "rc10", category: "Accounting", subcategory: "GST Filing", minHourly: 300, maxHourly: 1500, minProject: 1000, maxProject: 30000, currency: "INR", unit: "project", visible: true },
  ];
}
function loadCards(): RateCard[] { try { const d = localStorage.getItem(RC_KEY); if (d) return JSON.parse(d); } catch { } const s = defaultCards(); localStorage.setItem(RC_KEY, JSON.stringify(s)); return s; }
function saveCards(c: RateCard[]) { localStorage.setItem(RC_KEY, JSON.stringify(c)); }

const blank = (): Omit<RateCard, "id"> => ({ category: "", subcategory: "", minHourly: 200, maxHourly: 2000, minProject: 2000, maxProject: 100000, currency: "INR", unit: "hour", visible: true });

const AdminRateCards = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [cards, setCards] = useState<RateCard[]>(loadCards);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<RateCard, "id">>(blank());
  const f = (k: any, v: any) => setForm(p => ({ ...p, [k]: v }));

  const categories = [...new Set(cards.map(c => c.category))];

  const submit = () => {
    if (!form.category.trim() || !form.subcategory.trim()) return toast.error("Category and subcategory required");
    if (editId) { const up = cards.map(c => c.id === editId ? { ...c, ...form } : c); setCards(up); saveCards(up); toast.success("Rate card updated"); }
    else { const nc: RateCard = { ...form, id: `rc${Date.now()}` }; const up = [...cards, nc]; setCards(up); saveCards(up); toast.success("Rate card added"); }
    setShowForm(false); setEditId(null);
  };
  const openEdit = (c: RateCard) => { setForm({ category: c.category, subcategory: c.subcategory, minHourly: c.minHourly, maxHourly: c.maxHourly, minProject: c.minProject, maxProject: c.maxProject, currency: c.currency, unit: c.unit, visible: c.visible }); setEditId(c.id); setShowForm(true); };
  const del = (id: string) => { const up = cards.filter(c => c.id !== id); setCards(up); saveCards(up); };
  const toggleVisible = (id: string) => { const up = cards.map(c => c.id === id ? { ...c, visible: !c.visible } : c); setCards(up); saveCards(up); };

  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;
  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1050, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Rate Card Templates</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Standard hourly/project rates by category — shown to employers as guidance</p>
        </div>
        <button onClick={() => { setForm(blank()); setEditId(null); setShowForm(true); }} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Rate Card
        </button>
      </div>

      {categories.map(cat => {
        const catCards = cards.filter(c => c.category === cat);
        return (
          <div key={cat} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`, fontWeight: 800, fontSize: 14, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
              {cat} <span style={{ fontSize: 11, color: T.sub, fontWeight: 400 }}>({catCards.length} subcategories)</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Subcategory", "Hourly Rate Range", "Project Rate Range", "Unit", "Visibility", "Actions"].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {catCards.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}20`, opacity: c.visible ? 1 : 0.5 }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: T.text }}>{c.subcategory}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: T.sub }}>{fmt(c.minHourly)} – {fmt(c.maxHourly)}/hr</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: T.sub }}>{fmt(c.minProject)} – {fmt(c.maxProject)}</td>
                      <td style={{ padding: "10px 14px" }}><span style={bs("#6366f1", "rgba(99,102,241,.12)")}>{c.unit}</span></td>
                      <td style={{ padding: "10px 14px" }}><span style={bs(c.visible ? "#4ade80" : "#94a3b8", c.visible ? "rgba(74,222,128,.12)" : "rgba(148,163,184,.12)")}>{c.visible ? "Visible" : "Hidden"}</span></td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => openEdit(c)} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: A1 }}><Edit2 size={11} /></button>
                          <button onClick={() => toggleVisible(c.id)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: T.sub, fontSize: 10 }}>{c.visible ? "Hide" : "Show"}</button>
                          <button onClick={() => del(c.id)} style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#f87171" }}><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 480, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>{editId ? "Edit" : "Add"} Rate Card</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ l: "Category", k: "category" }, { l: "Subcategory", k: "subcategory" }].map(fi => (
                <div key={fi.k} style={{ gridColumn: "span 1" }}>
                  <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>{fi.l}</label>
                  <input value={(form as any)[fi.k]} onChange={e => f(fi.k, e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" as any }} />
                </div>
              ))}
              {[{ l: "Min Hourly Rate (₹)", k: "minHourly" }, { l: "Max Hourly Rate (₹)", k: "maxHourly" }, { l: "Min Project Rate (₹)", k: "minProject" }, { l: "Max Project Rate (₹)", k: "maxProject" }].map(fi => (
                <div key={fi.k}>
                  <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>{fi.l}</label>
                  <input type="number" value={(form as any)[fi.k]} onChange={e => f(fi.k, Number(e.target.value))} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" as any }} />
                </div>
              ))}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Billing Unit</label>
                <select value={form.unit} onChange={e => f("unit", e.target.value)} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "7px 10px", fontSize: 13 }}>
                  <option value="hour">Per Hour</option>
                  <option value="project">Per Project</option>
                  <option value="word">Per Word</option>
                  <option value="page">Per Page</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", cursor: "pointer", color: T.text, fontWeight: 600 }}>Cancel</button>
              <button onClick={submit} style={{ flex: 2, background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#fff", fontWeight: 700 }}>{editId ? "Save" : "Add Rate Card"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRateCards;
