import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { ClipboardList, Search, Download, User, Shield, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";

const A1 = "#6366f1";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const LOGS = [
  { id:1, action:"User role changed", actor:"superadmin@site.com", target:"user_482", type:"admin", severity:"high", time:"2 min ago", ip:"103.45.12.8" },
  { id:2, action:"Withdrawal approved", actor:"admin@site.com", target:"txn_9234", type:"finance", severity:"medium", time:"15 min ago", ip:"103.45.12.9" },
  { id:3, action:"User banned", actor:"admin@site.com", target:"user_291", type:"user", severity:"high", time:"1 hr ago", ip:"103.45.12.9" },
  { id:4, action:"Settings updated", actor:"manager@site.com", target:"system_config", type:"admin", severity:"medium", time:"3 hrs ago", ip:"192.168.1.1" },
  { id:5, action:"Export generated", actor:"manager@site.com", target:"report_q1", type:"system", severity:"low", time:"5 hrs ago", ip:"192.168.1.1" },
  { id:6, action:"Password reset (admin)", actor:"superadmin@site.com", target:"user_103", type:"user", severity:"high", time:"Yesterday", ip:"103.45.12.8" },
  { id:7, action:"API key created", actor:"dev@site.com", target:"api_key_44", type:"security", severity:"high", time:"Yesterday", ip:"10.0.0.5" },
  { id:8, action:"Cache cleared", actor:"admin@site.com", target:"cache_all", type:"system", severity:"low", time:"2 days ago", ip:"103.45.12.9" },
];

const TYPES = ["all","admin","user","finance","system","security"];

export default function AdminAuditLogs() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"logs"|"settings"|"health">("logs");

  const filtered = LOGS.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || l.type === typeFilter;
    const matchSev = severityFilter === "all" || l.severity === severityFilter;
    return matchSearch && matchType && matchSev;
  });

  const severityColor = (s: string) => s === "high" ? "#f87171" : s === "medium" ? "#fbbf24" : "#94a3b8";
  const typeColor = (t: string) => {
    if (t === "admin") return A1;
    if (t === "security") return "#f87171";
    if (t === "finance") return "#4ade80";
    if (t === "user") return "#60a5fa";
    return "#94a3b8";
  };

  const stats = [
    { label:"Total Logs (24h)", value:"4,820", color:"#60a5fa", icon:ClipboardList },
    { label:"Admin Actions", value:"142", color:A1, icon:Shield },
    { label:"User Actions", value:"3,210", color:"#4ade80", icon:User },
    { label:"High Severity", value:"28", color:"#f87171", icon:AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Comprehensive Audit Logging</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Track all admin and user actions with full change history and export capability.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: A1, color:"#fff" }}>
          <Download className="h-4 w-4" /> Export Logs
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["logs","settings","health"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "logs" ? "Activity Logs" : tab === "settings" ? "Retention Settings" : "Health"}
          </button>
        ))}
      </div>

      {activeTab === "logs" && (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl border" style={{ background: T.input, borderColor: T.border }}>
              <Search className="h-4 w-4" style={{ color: T.sub }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions or actors…"
                className="bg-transparent flex-1 text-sm outline-none" style={{ color: T.text }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm font-bold outline-none" style={{ background: T.input, borderColor: T.border, color: T.text }}>
              {TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm font-bold outline-none" style={{ background: T.input, borderColor: T.border, color: T.text }}>
              {["all","high","medium","low"].map(s => <option key={s} value={s}>{s === "all" ? "All Severity" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
            <div className="p-3 border-b" style={{ borderColor: T.border }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: T.sub }}>{filtered.length} records</span>
            </div>
            <div className="divide-y" style={{ borderColor: T.border }}>
              {filtered.map(log => (
                <div key={log.id} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-2.5 w-2.5 rounded-full mt-1.5" style={{ background: severityColor(log.severity) }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: T.text }}>{log.action}</p>
                      <p className="text-xs mt-0.5" style={{ color: T.sub }}>
                        <span style={{ color: typeColor(log.type) }}>{log.actor}</span>{" → "}{log.target}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: T.sub }}>IP: {log.ip} · {log.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${typeColor(log.type)}15`, color: typeColor(log.type) }}>{log.type}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${severityColor(log.severity)}15`, color: severityColor(log.severity) }}>{log.severity}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Eye className="h-8 w-8 opacity-20" style={{ color: T.sub }} />
                  <p className="text-sm" style={{ color: T.sub }}>No logs match your filters</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "settings" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Retention Policy</h3>
            {[
              { label:"Admin action logs", days:365 },
              { label:"User action logs", days:90 },
              { label:"Finance logs", days:730 },
              { label:"Security logs", days:730 },
              { label:"System logs", days:30 },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{p.label}</span>
                <span className="font-bold text-sm font-mono" style={{ color: A1 }}>{p.days} days</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Integrity Validation</h3>
            {[
              { check:"Log tamper detection", status:true },
              { check:"Encrypted log storage", status:true },
              { check:"Log export signed", status:true },
              { check:"Real-time log streaming", status:false },
              { check:"External SIEM integration", status:false },
            ].map(c => (
              <div key={c.check} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.check}</span>
                {c.status ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <AlertTriangle className="h-5 w-5 text-amber-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "health" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Monitoring Dashboard</h3>
            {[
              { label:"Log ingestion rate", value:"82 logs/min" },
              { label:"Storage used", value:"14.2 GB / 50 GB" },
              { label:"Oldest log", value:"365 days ago" },
              { label:"Last integrity check", value:"2 hrs ago" },
              { label:"Failed log writes", value:"0" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold" style={{ color: T.text }}>{m.value}</span>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Alert System</h3>
            {[
              { alert:"High-severity action", channel:"Email + In-app" },
              { alert:"Bulk export attempt", channel:"Email" },
              { alert:"Admin login from new IP", channel:"Email + SMS" },
              { alert:"Log storage >80%", channel:"In-app" },
              { alert:"Log write failure", channel:"Email + SMS" },
            ].map(a => (
              <div key={a.alert} className="flex items-start justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: T.text }}>{a.alert}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{a.channel}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
