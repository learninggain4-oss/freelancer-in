import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { FileText, Plus, Edit, Trash2, Eye, Download } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type Template = { id:string; name:string; category:string; language:string; uses:number; lastUpdated:string; status:string };

const templates: Template[] = [
  { id:"t1", name:"Standard Freelance Agreement", category:"General",    language:"English", uses:1840, lastUpdated:"Mar 2026", status:"Active" },
  { id:"t2", name:"Software Development Contract", category:"Tech",      language:"English", uses:1240, lastUpdated:"Feb 2026", status:"Active" },
  { id:"t3", name:"Design & Creative Work Agreement", category:"Design", language:"English", uses:820,  lastUpdated:"Jan 2026", status:"Active" },
  { id:"t4", name:"Content Writing Contract",       category:"Writing",  language:"English", uses:640,  lastUpdated:"Mar 2026", status:"Active" },
  { id:"t5", name:"Consulting Agreement",           category:"Business", language:"English", uses:480,  lastUpdated:"Dec 2025", status:"Active" },
  { id:"t6", name:"मानक फ्रीलांस अनुबंध (Hindi)",   category:"General",  language:"Hindi",   uses:310,  lastUpdated:"Feb 2026", status:"Active" },
  { id:"t7", name:"Fixed Price Project Contract",   category:"Tech",     language:"English", uses:290,  lastUpdated:"Nov 2025", status:"Draft" },
];

export default function AdminContractTemplates() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [selected, setSelected] = useState<Template|null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Contract Template Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Create and manage legally-compliant contract templates for freelancers and clients across India.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Templates", value:"7", color:"#60a5fa" },
          { label:"Total Uses", value:"5,620", color:"#4ade80" },
          { label:"Languages", value:"2", color:"#a78bfa" },
          { label:"Avg Uses/Template", value:"803", color:"#fbbf24" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <p className="text-2xl font-bold" style={{ color:s.color }}>{s.value}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest mt-1" style={{ color:T.sub }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-start justify-between mb-3">
              <FileText className="h-8 w-8 p-1.5 rounded-xl" style={{ background:`${A1}15`, color:A1 }} />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:t.status==="Active"?"rgba(74,222,128,.12)":"rgba(251,191,36,.12)", color:t.status==="Active"?"#4ade80":"#fbbf24" }}>{t.status}</span>
            </div>
            <p className="font-bold text-sm mb-1 leading-tight" style={{ color:T.text }}>{t.name}</p>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background:`${A1}12`, color:A1 }}>{t.category}</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background:"rgba(255,255,255,.05)", color:T.sub }}>{t.language}</span>
            </div>
            <p className="text-xs mb-3" style={{ color:T.sub }}>{t.uses.toLocaleString()} uses · Updated {t.lastUpdated}</p>
            <div className="flex gap-2">
              <button onClick={() => setSelected(t)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button className="p-1.5 rounded-lg border" style={{ borderColor:T.border, color:T.sub }}><Edit className="h-3.5 w-3.5" /></button>
              <button className="p-1.5 rounded-lg border" style={{ borderColor:T.border, color:"#f87171" }}><Trash2 className="h-3.5 w-3.5" /></button>
              <button className="p-1.5 rounded-lg border" style={{ borderColor:T.border, color:A1 }}><Download className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background:"rgba(0,0,0,.7)" }}>
          <div className="rounded-2xl border w-full max-w-lg p-6" style={{ background:TH.black.bg, borderColor:TH.black.border }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color:"#e2e8f0" }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ color:"#94a3b8" }}>✕</button>
            </div>
            <div className="space-y-3 text-sm" style={{ color:"#94a3b8" }}>
              <p><strong style={{ color:"#e2e8f0" }}>THIS FREELANCE AGREEMENT</strong> is entered into between the Client and the Freelancer as registered on FreeLan.space platform.</p>
              <p><strong style={{ color:"#e2e8f0" }}>1. Services:</strong> The Freelancer agrees to provide the services as described in the project posting, including all deliverables agreed upon in the project milestone schedule.</p>
              <p><strong style={{ color:"#e2e8f0" }}>2. Payment:</strong> All payments shall be processed through the FreeLan.space escrow system. Milestone payments shall be released upon client approval.</p>
              <p><strong style={{ color:"#e2e8f0" }}>3. Intellectual Property:</strong> Upon full payment, all work product created shall become the sole property of the Client unless otherwise agreed in writing.</p>
              <p><strong style={{ color:"#e2e8f0" }}>4. Governing Law:</strong> This agreement shall be governed by the laws of India and disputes shall be subject to Indian jurisdiction.</p>
              <p className="text-xs pt-2" style={{ color:"#64748b" }}>Category: {selected.category} · Language: {selected.language} · {selected.uses} uses</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
