import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Bell, AlertTriangle, CheckCircle2, RefreshCw, Activity, Pause, Clock, XCircle, BarChart3 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const CHANNELS = [
  { id:"c1", name:"In-App Notifications", sent:8420, failed:12, status:"active" },
  { id:"c2", name:"Email Notifications", sent:3200, failed:42, status:"active" },
  { id:"c3", name:"SMS Notifications", sent:820, failed:4, status:"active" },
  { id:"c4", name:"Push Notifications", sent:12000, failed:320, status:"degraded" },
];

export default function AdminNotificationControl() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [freqLimit, setFreqLimit] = useState(10);
  const [cooldown, setCooldown] = useState(5);
  const [preventDuplicate, setPreventDuplicate] = useState(true);
  const [scheduler, setScheduler] = useState(true);
  const [activeTab, setActiveTab] = useState<"channels"|"rules"|"analytics">("channels");
  const [muted, setMuted] = useState<string[]>([]);

  const toggleMute = (id: string) => setMuted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const statusColor = (s: string) => s === "active" ? "#4ade80" : s === "degraded" ? "#fbbf24" : "#f87171";

  const stats = [
    { label:"Total Sent (24h)", value:"24,440", color:"#60a5fa", icon:Bell },
    { label:"Success Rate", value:"98.2%", color:"#4ade80", icon:CheckCircle2 },
    { label:"Failed", value:"378", color:"#f87171", icon:XCircle },
    { label:"Queued", value:"820", color:A1, icon:Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Notification Control</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Control notification frequency, prevent spam, manage channels, and monitor delivery analytics.</p>
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
        {(["channels","rules","analytics"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "channels" ? "Channels" : tab === "rules" ? "Control Rules" : "Analytics"}
          </button>
        ))}
      </div>

      {activeTab === "channels" && (
        <div className="space-y-3">
          {CHANNELS.map(ch => (
            <div key={ch.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor(ch.status) }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{ch.name}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs" style={{ color: T.sub }}>Sent: <strong style={{ color:"#4ade80" }}>{ch.sent.toLocaleString()}</strong></span>
                      <span className="text-xs" style={{ color: T.sub }}>Failed: <strong style={{ color:"#f87171" }}>{ch.failed}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:`${statusColor(ch.status)}18`, color: statusColor(ch.status) }}>
                    {ch.status}
                  </span>
                  <button onClick={() => toggleMute(ch.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: muted.includes(ch.id) ? "rgba(248,113,113,.15)" : "rgba(99,102,241,.15)", color: muted.includes(ch.id) ? "#f87171" : A1 }}>
                    {muted.includes(ch.id) ? <><Pause className="h-3 w-3" /> Muted</> : <>Active</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "rules" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Spam Prevention Rules</h3>
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="text-sm font-bold" style={{ color: T.text }}>Frequency limit (per user/hour)</p>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={50} value={freqLimit} onChange={e => setFreqLimit(+e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="font-bold font-mono w-12 text-right" style={{ color: T.text }}>{freqLimit}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: T.border }}>
              <p className="text-sm font-bold" style={{ color: T.text }}>Cooldown between same-type notifications</p>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={60} value={cooldown} onChange={e => setCooldown(+e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="font-bold font-mono w-16 text-right" style={{ color: T.text }}>{cooldown} min</span>
              </div>
            </div>
            {[
              { label:"Prevent duplicate notifications", checked:preventDuplicate, set:setPreventDuplicate },
              { label:"Notification scheduler", checked:scheduler, set:setScheduler },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm font-bold" style={{ color: T.text }}>{s.label}</span>
                <button onClick={() => s.set(v => !v)} className="w-12 h-6 rounded-full relative transition-all" style={{ background: s.checked ? A1 : T.border }}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.checked ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Priority Levels</h3>
            {[
              { level:"Critical", desc:"Payment failures, security alerts", color:"#f87171" },
              { level:"High", desc:"Order updates, KYC status", color:"#fbbf24" },
              { level:"Medium", desc:"New messages, bid updates", color:"#60a5fa" },
              { level:"Low", desc:"Promotions, tips, newsletters", color:"#94a3b8" },
            ].map(p => (
              <div key={p.level} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ background: p.color }} />
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{p.level}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Delivery Analytics</h3>
            {CHANNELS.map(ch => {
              const successRate = Math.round((ch.sent / (ch.sent + ch.failed)) * 100);
              return (
                <div key={ch.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: T.text }}>{ch.name}</span>
                    <span className="font-bold font-mono text-sm" style={{ color: T.text }}>{successRate}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
                    <div className="h-full rounded-full" style={{ width:`${successRate}%`, background: successRate > 95 ? "#4ade80" : successRate > 90 ? "#fbbf24" : "#f87171" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Spam Alert Monitoring</h3>
            {[
              { alert:"Frequency limit exceeded", count:4, time:"Today" },
              { alert:"Duplicate detected & blocked", count:12, time:"Today" },
              { alert:"Cooldown bypass attempt", count:1, time:"Yesterday" },
              { alert:"Channel degraded", count:1, time:"2 hrs ago" },
            ].map(a => (
              <div key={a.alert} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: T.text }}>{a.alert}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{a.time}</p>
                </div>
                <span className="font-bold font-mono" style={{ color:"#fbbf24" }}>{a.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
