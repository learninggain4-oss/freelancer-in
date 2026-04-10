import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Key, Plus, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, Copy } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const apiKeys = [
  { id:"AK001", service:"Razorpay", category:"Payments", keyPreview:"rzp_live_••••••••••••••••", status:"Active", lastUsed:"2 min ago", requests:"84,210/month", env:"Production" },
  { id:"AK002", service:"Razorpay (Test)", category:"Payments", keyPreview:"rzp_test_••••••••••••••••", status:"Active", lastUsed:"1 day ago", requests:"1,240/month", env:"Staging" },
  { id:"AK003", service:"Twilio / MSG91", category:"SMS", keyPreview:"MG••••••••••••••••••••••••", status:"Active", lastUsed:"5 min ago", requests:"1,30,020/month", env:"Production" },
  { id:"AK004", service:"OneSignal", category:"Push Notifications", keyPreview:"os_v2_app_••••••••••••••••", status:"Active", lastUsed:"10 min ago", requests:"38,200/month", env:"Production" },
  { id:"AK005", service:"SendGrid", category:"Email", keyPreview:"SG.••••••••••••••••••••••••", status:"Active", lastUsed:"1 hour ago", requests:"56,400/month", env:"Production" },
  { id:"AK006", service:"Google Maps", category:"Maps/Geo", keyPreview:"AIza••••••••••••••••••••••••", status:"Active", lastUsed:"3 min ago", requests:"12,840/month", env:"Production" },
  { id:"AK007", service:"Aadhaar eSign API", category:"KYC", keyPreview:"ae_••••••••••••••••••••••••", status:"Active", lastUsed:"1 hour ago", requests:"4,820/month", env:"Production" },
  { id:"AK008", service:"DigiLocker", category:"KYC", keyPreview:"dl_••••••••••••••••••••••••", status:"Inactive", lastUsed:"Never", requests:"0/month", env:"Production" },
  { id:"AK009", service:"Sentry", category:"Monitoring", keyPreview:"sn_••••••••••••••••••••••••", status:"Active", lastUsed:"Just now", requests:"Unlimited", env:"Both" },
  { id:"AK010", service:"OpenAI", category:"AI/ML", keyPreview:"sk-••••••••••••••••••••••••", status:"Active", lastUsed:"30 min ago", requests:"8,420/month", env:"Production" },
];

const categories = ["All","Payments","SMS","Push Notifications","Email","KYC","Maps/Geo","Monitoring","AI/ML"];

export default function AdminThirdPartyApiKeyManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [cat, setCat] = useState("All");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string|null>(null);

  const filtered = cat==="All" ? apiKeys : apiKeys.filter(k=>k.category===cat);
  const toggle = (id:string) => {
    setRevealed(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  };
  const copy = (id:string) => { setCopied(id); setTimeout(()=>setCopied(null),2000); };

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
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> Add API Key
        </button>
      </div>

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
            {filtered.map(k=>(
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
