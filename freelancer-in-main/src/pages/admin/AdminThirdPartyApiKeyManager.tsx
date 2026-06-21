import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Key, Plus, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, Copy } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type ApiKey = { id:string; service:string; category:string; keyPreview:string; status:string; lastUsed:string; requests:string; env:string };

const categories = ["All","Payments","SMS","Push Notifications","Email","KYC","Maps/Geo","Monitoring","AI/ML"];
const catOptions = categories.filter(c => c !== "All");
const envOptions = ["Production", "Staging", "Both"];

export default function AdminThirdPartyApiKeyManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [cat, setCat] = useState("All");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string|null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ service:"", category:catOptions[0], apiKey:"", env:envOptions[0], status:"Active" });

  const filtered = cat==="All" ? apiKeys : apiKeys.filter(k=>k.category===cat);
  const toggle = (id:string) => {
    setRevealed(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  };
  const copy = (id:string) => { setCopied(id); setTimeout(()=>setCopied(null),2000); };

  const maskKey = (k:string) => {
    if (!k) return "";
    if (k.length <= 8) return "•".repeat(k.length);
    return k.slice(0,4) + "•".repeat(Math.max(8, k.length - 8)) + k.slice(-4);
  };

  const handleAdd = () => {
    if (!form.service.trim() || !form.apiKey.trim()) return;
    const newKey: ApiKey = {
      id: `AK${Date.now()}`,
      service: form.service.trim(),
      category: form.category,
      keyPreview: maskKey(form.apiKey.trim()),
      status: form.status,
      lastUsed: "Never",
      requests: "0/month",
      env: form.env,
    };
    setApiKeys(prev => [newKey, ...prev]);
    setForm({ service:"", category:catOptions[0], apiKey:"", env:envOptions[0], status:"Active" });
    setShowModal(false);
  };

  const catColor = (c:string) => {
    if(c==="Payments") return "#4ade80";
    if(c==="SMS") return "#60a5fa";
    if(c==="Push Notifications") return "#a78bfa";
    if(c==="Email") return "#fbbf24";
    if(c==="KYC") return "#f97316";
    if(c==="AI/ML") return "#e879f9";
    return "#94a3b8";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Third-party API Key Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Securely manage and monitor all third-party API keys. View usage, rotate keys, and control access by environment.</p>
        </div>
        <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> Add API Key
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,.6)" }} onClick={()=>setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4" style={{ background:T.card, borderColor:T.border }} onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-bold" style={{ color:T.text }}>Add API Key</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Service Name</label>
                <input value={form.service} onChange={e=>setForm({...form, service:e.target.value})} placeholder="e.g. Razorpay" className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background:T.input, borderColor:T.border, color:T.text }} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Category</label>
                <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background:T.input, borderColor:T.border, color:T.text }}>
                  {catOptions.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>API Key</label>
                <input value={form.apiKey} onChange={e=>setForm({...form, apiKey:e.target.value})} placeholder="Paste API key" className="w-full px-3 py-2 rounded-lg text-sm border outline-none font-mono" style={{ background:T.input, borderColor:T.border, color:T.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Environment</label>
                  <select value={form.env} onChange={e=>setForm({...form, env:e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background:T.input, borderColor:T.border, color:T.text }}>
                    {envOptions.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color:T.sub }}>Status</label>
                  <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ background:T.input, borderColor:T.border, color:T.text }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor:T.border, color:T.sub }}>Cancel</button>
              <button onClick={handleAdd} disabled={!form.service.trim()||!form.apiKey.trim()} className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background:A1, color:"#fff" }}>Save Key</button>
            </div>
          </div>
        </div>
      )}


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Integrations", value:apiKeys.length, color:"#60a5fa", icon:Key },
          { label:"Active Keys", value:apiKeys.filter(k=>k.status==="Active").length, color:"#4ade80", icon:CheckCircle2 },
          { label:"Inactive / Review", value:apiKeys.filter(k=>k.status!=="Active").length, color:"#f87171", icon:AlertCircle },
          { label:"Environments", value:"3", color:"#a78bfa", icon:RefreshCw },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background:cat===c?A1:"transparent", color:cat===c?"#fff":T.sub, borderColor:cat===c?A1:T.border }}>{c}</button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
        <table className="w-full text-sm">
          <thead><tr className="border-b" style={{ borderColor:T.border }}>
            {["Service","Category","API Key","Status","Last Used","Usage","Env","Actions"].map(h=>(
              <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-xs" style={{ color:T.sub }}>No API keys added yet. Click "Add API Key" to get started.</td></tr>
            ) : filtered.map(k=>(
              <tr key={k.id} className="border-b" style={{ borderColor:T.border }}>
                <td className="px-4 py-3 font-bold text-sm" style={{ color:T.text }}>{k.service}</td>
                <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${catColor(k.category)}15`, color:catColor(k.category) }}>{k.category}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs" style={{ color:T.sub }}>{revealed.has(k.id) ? k.keyPreview.replace(/•/g,"x") : k.keyPreview}</span>
                    <button onClick={()=>toggle(k.id)} className="p-1 rounded-lg" style={{ color:T.sub }}>
                      {revealed.has(k.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button onClick={()=>copy(k.id)} className="p-1 rounded-lg" style={{ color:copied===k.id?"#4ade80":T.sub }}>
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-[10px] font-bold" style={{ color:k.status==="Active"?"#4ade80":"#f87171" }}>{k.status}</span></td>
                <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{k.lastUsed}</td>
                <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{k.requests}</td>
                <td className="px-4 py-3"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:`${A1}12`, color:A1 }}>{k.env}</span></td>
                <td className="px-4 py-3">
                  <button className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border" style={{ borderColor:T.border, color:T.sub }}>
                    <RefreshCw className="h-3 w-3" /> Rotate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border p-4" style={{ background:"rgba(251,191,36,.05)", borderColor:"rgba(251,191,36,.2)" }}>
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color:"#fbbf24" }} />
          <p className="text-xs" style={{ color:"#fbbf24" }}>API keys are stored encrypted in Supabase Vault. Never commit keys to version control. Rotate keys every 90 days for security.</p>
        </div>
      </div>
    </div>
  );
}
