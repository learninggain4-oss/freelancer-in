import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { FolderOpen, AlertTriangle, CheckCircle2, RefreshCw, Link, XCircle, Search, FileText } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const PATHS = [
  { id:"p1", oldPath:"/uploads/avatars/", newPath:"/storage/user-avatars/", status:"redirected", files:18200, broken:0 },
  { id:"p2", oldPath:"/uploads/jobs/", newPath:"/storage/job-attachments/", status:"redirected", files:42000, broken:0 },
  { id:"p3", oldPath:"/uploads/kyc/", newPath:"/storage/id-verification/", status:"broken", files:6800, broken:124 },
  { id:"p4", oldPath:"/temp/", newPath:"/storage/temp-uploads/", status:"ok", files:320, broken:0 },
  { id:"p5", oldPath:"/uploads/invoices/", newPath:"—", status:"missing", files:2400, broken:2400 },
];

export default function AdminFilePathManagement() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"paths"|"broken"|"logs">("paths");

  const scan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 2500);
  };

  const statusColor = (s: string) => s === "ok" || s === "redirected" ? "#4ade80" : s === "broken" ? "#f87171" : "#fbbf24";

  const filtered = PATHS.filter(p => p.oldPath.includes(search) || p.newPath.includes(search));

  const stats = [
    { label:"Total Path Mappings", value:PATHS.length, color:"#60a5fa", icon:FolderOpen },
    { label:"Active/Redirected", value:PATHS.filter(p=>p.status==="ok"||p.status==="redirected").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Broken Paths", value:PATHS.filter(p=>p.status==="broken").length, color:"#f87171", icon:XCircle },
    { label:"Total Broken Files", value:PATHS.reduce((a,b)=>a+b.broken,0).toLocaleString(), color:"#f87171", icon:AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>File Path Management</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Map, redirect, and repair broken file paths. Detect missing links and recover file access.</p>
        </div>
        <button onClick={scan} disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: A1, color:"#fff", opacity: scanning ? .6 : 1 }}>
          <RefreshCw className={`h-4 w-4 ${scanning?"animate-spin":""}`} />
          {scanning ? "Scanning…" : "Scan Broken Links"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              <div>
                <p className="text-xl font-bold" style={{ color: T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["paths","broken","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "paths" ? "Path Mappings" : tab === "broken" ? "Broken Links" : "Path Logs"}
          </button>
        ))}
      </div>

      {activeTab === "paths" && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: T.input, borderColor: T.border }}>
            <Search className="h-4 w-4" style={{ color: T.sub }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search paths…"
              className="bg-transparent flex-1 text-sm outline-none" style={{ color: T.text }} />
          </div>
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: p.broken > 0 ? "rgba(248,113,113,.3)" : T.border }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold px-2 py-0.5 rounded-full text-xs" style={{ background:`${statusColor(p.status)}18`, color: statusColor(p.status) }}>{p.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <code className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background:"rgba(0,0,0,.2)", color: T.sub }}>{p.oldPath}</code>
                      {p.newPath !== "—" && <><Link className="h-3.5 w-3.5" style={{ color: T.sub }} /><code className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background:"rgba(0,0,0,.2)", color: A1 }}>{p.newPath}</code></>}
                    </div>
                    <p className="text-xs mt-2" style={{ color: T.sub }}>
                      {p.files.toLocaleString()} files total
                      {p.broken > 0 && <span className="text-red-400 ml-2">· {p.broken.toLocaleString()} broken</span>}
                    </p>
                  </div>
                  {p.broken > 0 && (
                    <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: A1, color:"#fff" }}>
                      Repair
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "broken" && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
          <h3 className="font-bold" style={{ color: T.text }}>Broken Link Recovery</h3>
          {PATHS.filter(p => p.broken > 0).map(p => (
            <div key={p.id} className="flex items-start justify-between p-4 rounded-xl border" style={{ borderColor: T.border }}>
              <div>
                <p className="font-bold text-sm font-mono" style={{ color: T.text }}>{p.oldPath}</p>
                <p className="text-xs" style={{ color: T.sub }}>{p.broken.toLocaleString()} broken references detected</p>
                <p className="text-xs mt-0.5 text-red-400">{p.newPath === "—" ? "No redirect configured — files inaccessible" : `Redirect broken → ${p.newPath}`}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor: T.border, color: T.sub }}>Preview</button>
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: A1, color:"#fff" }}>Fix Path</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>File Path Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Broken links detected", path:"/uploads/kyc/", detail:"124 files unreachable", time:"1 hr ago", type:"error" },
              { event:"Path redirect added", path:"/uploads/avatars/", detail:"→ /storage/user-avatars/", time:"3 days ago", type:"info" },
              { event:"Scan completed", path:"All paths", detail:"2,524 broken total", time:"1 hr ago", type:"warning" },
              { event:"Path repaired", path:"/uploads/jobs/", detail:"42,000 files now accessible", time:"3 days ago", type:"success" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs font-mono" style={{ color: T.sub }}>{l.path} · {l.detail}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.type==="error"?"bg-red-500/15 text-red-400":l.type==="warning"?"bg-amber-500/15 text-amber-400":l.type==="success"?"bg-green-500/15 text-green-400":"bg-blue-500/15 text-blue-400"}`}>{l.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
