import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Bell, Send, RefreshCw, CheckCircle2, XCircle, AlertTriangle, BarChart3, Users } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const CAMPAIGNS = [
  { id:"c1", name:"Platform Update v2.5", recipients:18200, delivered:18142, failed:58, status:"completed", time:"2 hrs ago" },
  { id:"c2", name:"KYC Reminder - Batch 3", recipients:4200, delivered:0, failed:0, status:"in_progress", time:"Now" },
  { id:"c3", name:"Weekend Promo", recipients:22000, delivered:21840, failed:160, status:"completed", time:"Yesterday" },
  { id:"c4", name:"New Feature Announcement", recipients:30000, delivered:0, failed:0, status:"queued", time:"Scheduled" },
];

export default function AdminBulkNotification() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [retrying, setRetrying] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"campaigns"|"metrics"|"queue">("campaigns");

  const retry = (id: string) => {
    setRetrying(id);
    setTimeout(() => setRetrying(null), 2000);
  };

  const statusColor = (s: string) => s === "completed" ? "#4ade80" : s === "in_progress" ? "#60a5fa" : s === "queued" ? "#94a3b8" : "#f87171";

  const stats = [
    { label:"Total Sent Today", value:"22,342", color:"#60a5fa", icon:Bell },
    { label:"Delivery Rate", value:"98.7%", color:"#4ade80", icon:CheckCircle2 },
    { label:"Total Failed", value:"218", color:"#f87171", icon:XCircle },
    { label:"Active Campaigns", value:CAMPAIGNS.filter(c=>c.status==="in_progress").length, color:A1, icon:Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Bulk Notification Reliability</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Track delivery success, retry failures, monitor queue, and verify notification health.</p>
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
        {(["campaigns","metrics","queue"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "campaigns" ? "Campaigns" : tab === "metrics" ? "Performance" : "Queue Monitor"}
          </button>
        ))}
      </div>

      {activeTab === "campaigns" && (
        <div className="space-y-3">
          {CAMPAIGNS.map(c => {
            const rate = c.recipients > 0 && c.delivered > 0 ? Math.round((c.delivered/c.recipients)*100) : 0;
            return (
              <div key={c.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: T.text }}>{c.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor(c.status)}18`, color: statusColor(c.status) }}>{c.status.replace("_"," ")}</span>
                    </div>
                    <div className="flex gap-4 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: T.sub }}>Recipients: {c.recipients.toLocaleString()}</span>
                      {c.delivered > 0 && <span className="text-xs text-green-400">✓ {c.delivered.toLocaleString()} delivered</span>}
                      {c.failed > 0 && <span className="text-xs text-red-400">✗ {c.failed} failed</span>}
                    </div>
                    {c.status === "completed" && (
                      <div className="mt-2">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                          <div className="h-full rounded-full" style={{ width:`${rate}%`, background:"#4ade80" }} />
                        </div>
                        <p className="text-[10px] mt-0.5 font-mono" style={{ color: T.sub }}>{rate}% delivery rate</p>
                      </div>
                    )}
                    {c.status === "in_progress" && (
                      <div className="mt-2">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                          <div className="h-full rounded-full animate-pulse" style={{ width:"45%", background: A1 }} />
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: T.sub }}>Sending… (~45%)</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: T.sub }}>{c.time}</span>
                    {c.failed > 0 && (
                      <button onClick={() => retry(c.id)} disabled={retrying === c.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: A1, color:"#fff", opacity: retrying === c.id ? .6 : 1 }}>
                        <RefreshCw className={`h-3 w-3 ${retrying===c.id?"animate-spin":""}`} /> Retry Failed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Performance Metrics</h3>
            {[
              { label:"Avg delivery latency", value:"1.4s" },
              { label:"Peak throughput", value:"12,000/min" },
              { label:"Retry success rate", value:"82%" },
              { label:"Failed after 3 retries", value:"0.3%" },
              { label:"Queue processing lag", value:"<2s" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.sub }}>{m.label}</span>
                <span className="font-bold font-mono" style={{ color: T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Health Verification</h3>
            {[
              { label:"Delivery tracking active", ok:true },
              { label:"Auto-retry on failure (3×)", ok:true },
              { label:"Failure alert at >5% rate", ok:true },
              { label:"Queue monitoring active", ok:true },
              { label:"Delivery verification tool", ok:true },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "queue" && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
          <h3 className="font-bold" style={{ color: T.text }}>Notification Queue Monitor</h3>
          {[
            { queue:"High Priority Queue", size:42, rate:"instant", color:"#f87171" },
            { queue:"Standard Queue", size:820, rate:"~1.4s/msg", color:"#60a5fa" },
            { queue:"Scheduled Queue", size:30000, rate:"Starts 9 PM", color:"#94a3b8" },
            { queue:"Retry Queue", size:218, rate:"Every 5 min", color:"#fbbf24" },
          ].map(q => (
            <div key={q.queue} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: q.color }} />
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{q.queue}</p>
                  <p className="text-xs" style={{ color: T.sub }}>Rate: {q.rate}</p>
                </div>
              </div>
              <span className="font-bold font-mono text-lg" style={{ color: T.text }}>{q.size.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
