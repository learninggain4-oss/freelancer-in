import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Download, FileText, CheckCircle2, AlertTriangle, RefreshCw, Eye, BarChart3, Clock, XCircle, FileCheck } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const FORMATS = [
  { id:"csv", label:"CSV", desc:"Comma-separated values, UTF-8 encoded", icon:"📄", compatible:true },
  { id:"excel", label:"Excel (.xlsx)", desc:"Microsoft Excel format, full Unicode support", icon:"📊", compatible:true },
  { id:"pdf", label:"PDF", desc:"Portable Document Format, read-only", icon:"📕", compatible:true },
  { id:"json", label:"JSON", desc:"Machine-readable, API-friendly", icon:"🔧", compatible:true },
  { id:"xml", label:"XML", desc:"Legacy format, limited Unicode support", icon:"🗂️", compatible:false },
];

const LOGS = [
  { id:1, format:"CSV", status:"success", size:"2.3 MB", rows:14200, time:"2 min ago", user:"admin@site.com" },
  { id:2, format:"Excel", status:"success", size:"5.1 MB", rows:31000, time:"1 hr ago", user:"manager@site.com" },
  { id:3, format:"PDF", status:"failed", size:"—", rows:0, time:"3 hrs ago", user:"admin@site.com" },
  { id:4, format:"JSON", status:"success", size:"8.7 MB", rows:52000, time:"Yesterday", user:"dev@site.com" },
  { id:5, format:"XML", status:"failed", size:"—", rows:0, time:"2 days ago", user:"admin@site.com" },
];

export default function AdminExportControl() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [encoding, setEncoding] = useState("utf8");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<null|"pass"|"fail">(null);
  const [retrying, setRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<"config"|"logs"|"health">("config");

  const runValidation = () => {
    setValidating(true);
    setValidationResult(null);
    setTimeout(() => { setValidating(false); setValidationResult("pass"); }, 1800);
  };

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => setRetrying(false), 2000);
  };

  const stats = [
    { label:"Total Exports", value:"1,842", icon:Download, color:"#60a5fa" },
    { label:"Success Rate", value:"96.4%", icon:CheckCircle2, color:"#4ade80" },
    { label:"Failed Exports", value:"66", icon:XCircle, color:"#f87171" },
    { label:"Avg File Size", value:"4.2 MB", icon:FileText, color:A1 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Export Format Validation</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Configure and validate export formats, encoding, and compatibility.</p>
        </div>
        <button onClick={handleRetry} disabled={retrying}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: A1, color:"#fff", opacity: retrying ? .6 : 1 }}>
          <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Retrying…" : "Retry Failed"}
        </button>
      </div>

      {/* Stats */}
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

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["config","logs","health"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "config" ? "Format Config" : tab === "logs" ? "Export Logs" : "Health"}
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Export Format Selection</h3>
            <div className="space-y-3">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setSelectedFormat(f.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left"
                  style={{ background: selectedFormat === f.id ? `${A1}15` : "transparent", borderColor: selectedFormat === f.id ? A1 : T.border }}>
                  <span className="text-2xl">{f.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: T.text }}>{f.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${f.compatible ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                        {f.compatible ? "Compatible" : "Issues"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: T.sub }}>{f.desc}</p>
                  </div>
                  {selectedFormat === f.id && <CheckCircle2 className="h-5 w-5 text-[#4ade80]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Encoding & Validation */}
          <div className="space-y-4">
            <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
              <h3 className="font-bold" style={{ color: T.text }}>Encoding Validation</h3>
              <div className="space-y-3">
                {["utf8","latin1","ascii"].map(enc => (
                  <button key={enc} onClick={() => setEncoding(enc)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border transition-all"
                    style={{ background: encoding === enc ? `${A1}15` : "transparent", borderColor: encoding === enc ? A1 : T.border }}>
                    <span className="text-sm font-bold" style={{ color: T.text }}>
                      {enc === "utf8" ? "UTF-8 (Recommended)" : enc === "latin1" ? "Latin-1" : "ASCII"}
                    </span>
                    {encoding === enc && <CheckCircle2 className="h-4 w-4 text-[#4ade80]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
              <h3 className="font-bold" style={{ color: T.text }}>Validation & Preview</h3>
              <div className="flex gap-3">
                <button onClick={runValidation} disabled={validating}
                  className="flex-1 py-2 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2"
                  style={{ borderColor: A1, color: A1, opacity: validating ? .6 : 1 }}>
                  <FileCheck className={`h-4 w-4 ${validating ? "animate-pulse" : ""}`} />
                  {validating ? "Validating…" : "Run Validation"}
                </button>
                <button onClick={() => setPreviewOpen(v => !v)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: `${A2}20`, color: A2 }}>
                  <Eye className="h-4 w-4" /> Preview
                </button>
              </div>
              {validationResult && (
                <div className={`p-3 rounded-xl flex items-center gap-3 ${validationResult === "pass" ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  {validationResult === "pass" ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <AlertTriangle className="h-5 w-5 text-red-400" />}
                  <span className="text-sm font-bold" style={{ color: validationResult === "pass" ? "#4ade80" : "#f87171" }}>
                    {validationResult === "pass" ? "Validation passed — export is safe" : "Validation failed — check encoding settings"}
                  </span>
                </div>
              )}
              {previewOpen && (
                <div className="rounded-xl p-3 font-mono text-xs border" style={{ background:"rgba(0,0,0,.3)", borderColor: T.border, color: T.sub }}>
                  <p>id,name,email,amount,date</p>
                  <p>1,Ravi Kumar,ravi@mail.com,5000,2026-04-01</p>
                  <p>2,Priya Sharma,priya@mail.com,12000,2026-04-01</p>
                  <p className="opacity-50">…{" "}14,197 more rows</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Export Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {LOGS.map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${log.status === "success" ? "bg-green-400" : "bg-red-400"}`} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{log.format} Export</p>
                    <p className="text-xs" style={{ color: T.sub }}>{log.user} · {log.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs font-bold" style={{ color: T.text }}>{log.rows > 0 ? log.rows.toLocaleString() : "—"} rows</p>
                    <p className="text-xs" style={{ color: T.sub }}>{log.size}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${log.status === "success" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "health" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Export Health Dashboard</h3>
            {[
              { label:"CSV Engine", status:"healthy", latency:"12ms" },
              { label:"Excel Renderer", status:"healthy", latency:"34ms" },
              { label:"PDF Generator", status:"degraded", latency:"820ms" },
              { label:"JSON Serializer", status:"healthy", latency:"8ms" },
              { label:"Encoding Layer", status:"healthy", latency:"5ms" },
            ].map(svc => (
              <div key={svc.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${svc.status === "healthy" ? "bg-green-400" : "bg-amber-400"}`} />
                  <span className="text-sm font-bold" style={{ color: T.text }}>{svc.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono" style={{ color: T.sub }}>{svc.latency}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${svc.status === "healthy" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>File Verification</h3>
            <p className="text-sm" style={{ color: T.sub }}>Last 3 export files verified against checksums.</p>
            {["export_20260401_01.csv","export_20260401_02.xlsx","export_20260331_01.json"].map((f,i) => (
              <div key={f} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" style={{ color: T.sub }} />
                  <span className="text-xs font-mono" style={{ color: T.text }}>{f}</span>
                </div>
                {i === 1
                  ? <AlertTriangle className="h-4 w-4 text-amber-400" />
                  : <CheckCircle2 className="h-4 w-4 text-green-400" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
