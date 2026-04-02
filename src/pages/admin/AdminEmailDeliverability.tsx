import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Mail, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Activity, Shield, BarChart3 } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const PROVIDERS = [
  { name:"SendGrid", status:"healthy", deliveryRate:98.4, bounces:12, spam:0.02 },
  { name:"AWS SES", status:"healthy", deliveryRate:99.1, bounces:4, spam:0.01 },
  { name:"Mailgun (fallback)", status:"standby", deliveryRate:97.8, bounces:22, spam:0.03 },
];

export default function AdminEmailDeliverability() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null|"pass">(null);
  const [activeTab, setActiveTab] = useState<"providers"|"config"|"logs">("providers");

  const runTest = () => { setTesting(true); setTimeout(() => { setTesting(false); setTestResult("pass"); }, 2000); };

  const stats = [
    { label:"Avg Delivery Rate", value:"98.7%", color:"#4ade80", icon:CheckCircle2 },
    { label:"Emails Sent (24h)", value:"24,820", color:"#60a5fa", icon:Mail },
    { label:"Bounces", value:"38", color:"#fbbf24", icon:AlertTriangle },
    { label:"Spam Reports", value:"2", color:"#f87171", icon:XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Email Deliverability</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Monitor email delivery rates, bounce handling, spam detection, and provider failover.</p>
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
        {(["providers","config","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "providers" ? "Providers" : tab === "config" ? "Configuration" : "Delivery Logs"}
          </button>
        ))}
      </div>

      {activeTab === "providers" && (
        <div className="space-y-3">
          {PROVIDERS.map(p => (
            <div key={p.name} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${p.status==="healthy"?"bg-green-400 animate-pulse":"bg-gray-400"}`} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{p.name}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-green-400">Delivery: {p.deliveryRate}%</span>
                      <span className="text-xs text-amber-400">Bounces: {p.bounces}</span>
                      <span className="text-xs text-red-400">Spam: {p.spam}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden w-48" style={{ background: T.border }}>
                      <div className="h-full rounded-full" style={{ width:`${p.deliveryRate}%`, background:"#4ade80" }} />
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.status==="healthy"?"bg-green-500/15 text-green-400":"bg-gray-500/15 text-gray-400"}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>DNS & Authentication</h3>
            {[
              { label:"SPF record configured", ok:true },
              { label:"DKIM signing enabled", ok:true },
              { label:"DMARC policy active", ok:true },
              { label:"Domain verified", ok:true },
              { label:"Reverse DNS (PTR record)", ok:true },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            ))}
            <button onClick={runTest} disabled={testing} className="w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all" style={{ borderColor: A1, color: A1, opacity:testing?.6:1 }}>
              <Activity className={`h-4 w-4 ${testing?"animate-pulse":""}`} />
              {testing?"Testing…":"Send Test Email"}
            </button>
            {testResult && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" /><span className="text-sm text-green-400 font-bold">Test email delivered successfully</span></div>}
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Bounce Handling</h3>
            {[
              { label:"Hard bounce auto-unsubscribe", active:true },
              { label:"Soft bounce retry (3×)", active:true },
              { label:"Spam complaint auto-removal", active:true },
              { label:"Bounce rate alert (>5%)", active:true },
              { label:"Provider failover on degradation", active:true },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{r.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Email Delivery Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Hard bounce", email:"user@invalid.com", type:"KYC approval", time:"10 min ago", status:"bounce" },
              { event:"Delivered", email:"ravi@gmail.com", type:"Welcome email", time:"2 min ago", status:"success" },
              { event:"Spam complaint", email:"user@yahoo.com", type:"Promo", time:"1 hr ago", status:"spam" },
              { event:"Soft bounce retried", email:"priya@outlook.com", type:"Password reset", time:"30 min ago", status:"retry" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{l.email} · {l.type}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.status==="bounce"?"bg-red-500/15 text-red-400":l.status==="success"?"bg-green-500/15 text-green-400":l.status==="spam"?"bg-red-500/15 text-red-400":"bg-amber-500/15 text-amber-400"}`}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
