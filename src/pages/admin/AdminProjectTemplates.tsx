import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Layout, Plus, Copy, Edit, Star } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const templates = [
  { id:"PT001", name:"E-commerce Website Build",    category:"Web Dev",     milestones:5, budget:"₹40,000–₹1,20,000", uses:1840, rating:4.8, featured:true },
  { id:"PT002", name:"Mobile App MVP",              category:"Mobile",      milestones:4, budget:"₹60,000–₹2,00,000", uses:1240, rating:4.7, featured:true },
  { id:"PT003", name:"Logo & Brand Identity",       category:"Design",      milestones:3, budget:"₹5,000–₹25,000",    uses:2840, rating:4.9, featured:true },
  { id:"PT004", name:"SEO Content Package (10 blogs)",category:"Writing",   milestones:2, budget:"₹8,000–₹20,000",    uses:1980, rating:4.6, featured:false },
  { id:"PT005", name:"Social Media Marketing",      category:"Marketing",   milestones:3, budget:"₹15,000–₹40,000",   uses:1120, rating:4.5, featured:false },
  { id:"PT006", name:"Data Science Dashboard",      category:"Data",        milestones:4, budget:"₹50,000–₹1,50,000", uses:640,  rating:4.7, featured:false },
  { id:"PT007", name:"WordPress Website",           category:"Web Dev",     milestones:3, budget:"₹10,000–₹40,000",   uses:3200, rating:4.8, featured:false },
];

export default function AdminProjectTemplates() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(templates.map(t=>t.category)))];
  const filtered = filter==="All" ? templates : templates.filter(t=>t.category===filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Project Template Library</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Manage reusable project templates with milestones, budgets, and deliverables for clients to quick-post jobs.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Templates", value:`${templates.length}`, color:"#60a5fa" },
          { label:"Total Uses", value:`${templates.reduce((s,t)=>s+t.uses,0).toLocaleString()}`, color:"#4ade80" },
          { label:"Featured", value:`${templates.filter(t=>t.featured).length}`, color:"#a78bfa" },
          { label:"Avg Rating", value:"4.7 ⭐", color:"#fbbf24" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <p className="text-2xl font-bold" style={{ color:s.color }}>{s.value}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest mt-1" style={{ color:T.sub }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:filter===c?A1:"transparent", color:filter===c?"#fff":T.sub, borderColor:filter===c?A1:T.border }}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl shrink-0" style={{ background:`${A1}15` }}>
                  <Layout className="h-5 w-5" style={{ color:A1 }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm" style={{ color:T.text }}>{t.name}</span>
                    {t.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:"rgba(167,139,250,.15)", color:"#a78bfa" }}>Featured</span>}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background:`${A1}12`, color:A1 }}>{t.category}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs" style={{ color:T.sub }}>
              <span>{t.milestones} milestones</span>
              <span className="text-right">{t.budget}</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" style={{ color:"#fbbf24" }} />
                <span>{t.rating}</span>
              </div>
              <span className="text-right">{t.uses.toLocaleString()} uses</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{ background:t.featured?"rgba(167,139,250,.12)":A1, color:t.featured?"#a78bfa":"#fff" }}>
                {t.featured ? "Unfeature" : "Feature"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
