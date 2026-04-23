import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import {
  Upload, Plus, Trash2, ExternalLink, Edit3, Image, Code,
  Palette, Globe, Video, FileText, CheckCircle, X, Link,
} from "lucide-react";
import { toast } from "sonner";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", muted: "rgba(255,255,255,.03)", input: "rgba(255,255,255,.07)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", muted: "#f1f5f9", input: "#f8fafc" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", muted: "#f1f5f9", input: "#f8fafc" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", muted:"#fef3c7", input:"#fffdf7" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", muted:"#dcfce7", input:"#ffffff" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", muted:"#e0f2fe", input:"#ffffff" },
};

const CAT_ICONS: Record<string, React.ComponentType<any>> = {
  Web: Globe, Design: Palette, App: Code, Video, Content: FileText, Other: Image,
};

const CAT_COLORS: Record<string, string> = {
  Web: "#60a5fa", Design: "#a78bfa", App: "#4ade80", Video: "#f472b6", Content: "#fbbf24", Other: "#94a3b8",
};

const CAT_TEXT_COLORS: Record<string, string> = {
  Web: "#2563eb", Design: "#7c3aed", App: "#16a34a", Video: "#be185d", Content: "#b45309", Other: "#475569",
};

const INITIAL_ITEMS: { id: string; title: string; category: string; desc: string; link: string; image: string; tags: string[] }[] = [];

type Item = typeof INITIAL_ITEMS[0];

export default function EmployeePortfolio() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";
  const clrGreen  = isDark ? "#4ade80" : "#16a34a";
  const clrPurple = isDark ? "#a78bfa" : "#7c3aed";
  const clrIndigo = isDark ? "#818cf8" : "#4f46e5";
  const [items, setItems]         = useState<Item[]>(INITIAL_ITEMS);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState({ title: "", category: "Web", desc: "", link: "", tags: "" });
  const [filter, setFilter]       = useState("All");

  const CATEGORIES = ["All", "Web", "Design", "App", "Video", "Content", "Other"];
  const filtered = filter === "All" ? items : items.filter(i => i.category === filter);

  const resetForm = () => { setForm({ title: "", category: "Web", desc: "", link: "", tags: "" }); setEditId(null); setShowForm(false); };

  const handleSave = () => {
    if (!form.title.trim() || !form.desc.trim()) { toast.error("Please fill in title and description"); return; }
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (editId) {
      setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form, tags } : i));
      toast.success("Portfolio item updated!");
    } else {
      setItems(prev => [...prev, { id: Date.now().toString(), ...form, tags, image: "" }]);
      toast.success("Portfolio item added!");
    }
    resetForm();
  };

  const handleEdit = (item: Item) => {
    setForm({ title: item.title, category: item.category, desc: item.desc, link: item.link, tags: item.tags.join(", ") });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = (id: string) => { setItems(prev => prev.filter(i => i.id !== id)); toast.success("Item removed"); };

  const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  return (
    <div className="min-h-screen pb-24" style={{ background: T.bg, color: T.text }}>
      {/* Gradient Hero */}
      <div className="px-4 sm:px-6 pt-6 mb-5">
        <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #0ea5e9 100%)" }} className="relative overflow-hidden rounded-3xl p-6 shadow-2xl">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,.08)" }} />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,.04)" }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl" style={{ background: "rgba(255,255,255,.2)", backdropFilter: "blur(12px)" }}>
                  <Upload className="h-7 w-7" style={{ color: "white" }} />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: "white" }}>My Portfolio</h1>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.75)" }}>Showcase your best work</p>
                </div>
              </div>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold transition-all shrink-0"
                style={{ background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.3)", color: "white" }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Project
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                { label: "Projects",    value: items.length },
                { label: "Live Links",  value: items.filter(i => i.link).length },
                { label: "Categories",  value: new Set(items.map(i => i.category)).size },
              ].map(s => (
                <div key={s.label} className="shrink-0 rounded-2xl px-4 py-2.5 min-w-[80px]" style={{ background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)" }}>
                  <p className="text-2xl font-black" style={{ color: "white" }}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,.7)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="px-4 sm:px-6 mb-5">
          <div className="rounded-2xl p-5" style={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: T.text }}>{editId ? "Edit Project" : "Add New Project"}</h3>
              <button onClick={resetForm}><X className="h-4 w-4" style={{ color: T.sub }} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: T.sub }}>Project Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. React Dashboard for Startup" className="w-full rounded-xl px-3 py-2.5 text-xs outline-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: T.sub }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 text-xs outline-none appearance-none cursor-pointer" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}>
                  {["Web", "Design", "App", "Video", "Content", "Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: T.sub }}>Live Link (optional)</label>
                <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." className="w-full rounded-xl px-3 py-2.5 text-xs outline-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: T.sub }}>Description *</label>
                <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} placeholder="Describe your project, tech stack, and key features..." className="w-full rounded-xl px-3 py-2.5 text-xs outline-none resize-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: T.sub }}>Skills / Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="React, TypeScript, Tailwind CSS" className="w-full rounded-xl px-3 py-2.5 text-xs outline-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="rounded-xl px-5 py-2.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                <CheckCircle className="h-3.5 w-3.5 inline mr-1.5" />{editId ? "Update" : "Save Project"}
              </button>
              <button onClick={resetForm} className="rounded-xl px-5 py-2.5 text-xs font-semibold" style={{ background: T.muted, color: T.sub, border: `1px solid ${T.border}` }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="px-4 sm:px-6 mb-5 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(c => {
          const color = CAT_COLORS[c] ?? "#6366f1";
          const textColor = isDark ? color : (CAT_TEXT_COLORS[c] ?? color);
          const active = filter === c;
          return (
            <button key={c} onClick={() => setFilter(c)} className="shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all" style={{ background: active ? `${color}20` : T.card, border: `1px solid ${active ? color + "50" : T.border}`, color: active ? textColor : T.sub, boxShadow: active ? `0 0 12px ${color}35` : "none" }}>
              {c}
            </button>
          );
        })}
      </div>

      {/* Portfolio Grid */}
      <div className="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => {
          const Icon = CAT_ICONS[item.category] ?? Image;
          const color = CAT_COLORS[item.category] ?? "#6366f1";
          const itemTextColor = isDark ? color : (CAT_TEXT_COLORS[item.category] ?? color);
          return (
            <div key={item.id} className="rounded-2xl overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1" style={card}>
              <div className="h-32 flex items-center justify-center" style={{ background: `${color}10`, borderBottom: `1px solid ${T.border}` }}>
                <Icon className="h-12 w-12" style={{ color: `${color}60` }} />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[9px] font-bold rounded-md px-1.5 py-0.5 mb-1 inline-block" style={{ background: `${color}15`, color: itemTextColor }}>{item.category}</span>
                    <h3 className="text-sm font-bold leading-snug" style={{ color: T.text }}>{item.title}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: "rgba(99,102,241,.15)" }}>
                      <Edit3 className="h-3 w-3 text-indigo-400" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: "rgba(248,113,113,.15)" }}>
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed mb-3 line-clamp-2" style={{ color: T.sub }}>{item.desc}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[9px] rounded-md px-1.5 py-0.5" style={{ background: T.muted, color: T.sub, border: `1px solid ${T.border}` }}>{tag}</span>
                  ))}
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold" style={{ color }}>
                    <ExternalLink className="h-2.5 w-2.5" /> View Live
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {/* Upload Placeholder */}
        <button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-2xl border-2 border-dashed h-48 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.01]" style={{ borderColor: T.border }}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,.1)" }}>
            <Plus className="h-5 w-5" style={{ color: "#6366f1" }} />
          </div>
          <p className="text-xs font-semibold" style={{ color: T.sub }}>Add Portfolio Item</p>
        </button>
      </div>
    </div>
  );
}
