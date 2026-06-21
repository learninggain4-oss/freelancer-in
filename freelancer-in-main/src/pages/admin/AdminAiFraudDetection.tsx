import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Shield, Brain, AlertTriangle, Settings, ToggleLeft, ToggleRight, TrendingUp, Zap } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type Rule = { id:string; name:string; description:string; threshold:number; enabled:boolean; severity:"critical"|"high"|"medium"|"low" };

const seedRules: Rule[] = [
  { id:"r1", name:"Multiple Failed Logins", description:"Block after N failed login attempts", threshold:5, enabled:true, severity:"high" },
  { id:"r2", name:"IP Velocity Check", description:"Flag IPs with >50 requests/min", threshold:50, enabled:true, severity:"critical" },
  { id:"r3", name:"Duplicate Payment Fingerprint", description:"Detect same card used across multiple accounts", threshold:3, enabled:true, severity:"critical" },
  { id:"r4", name:"Abnormal Withdrawal Pattern", description:"Flag withdrawal >3× average in 24h", threshold:3, enabled:true, severity:"high" },
  { id:"r5", name:"New Account High Value Bid", description:"Flag bids >₹50k from accounts <7 days old", threshold:50000, enabled:false, severity:"medium" },
  { id:"r6", name:"Profile Photo Similarity", description:"Detect near-duplicate profile images (fraud rings)", threshold:90, enabled:true, severity:"high" },
  { id:"r7", name:"Review Bombing", description:"Flag >10 reviews in 1h from similar IPs", threshold:10, enabled:true, severity:"medium" },
  { id:"r8", name:"PAN Reuse Detection", description:"Alert when same PAN is linked to multiple accounts", threshold:1, enabled:true, severity:"critical" },
];

const SEVERITY_COLOR: Record<string,string> = { critical:"#f87171", high:"#fbbf24", medium:"#60a5fa", low:"#4ade80" };

const stats = [
  { label:"Model Accuracy", value:"97.4%", color:"#4ade80", icon:Brain },
  { label:"Threats Blocked Today", value:"143", color:"#f87171", icon:Shield },
  { label:"False Positives", value:"2.1%", color:"#fbbf24", icon:AlertTriangle },
  { label:"Active Rules", value:"7/8", color:"#60a5fa", icon:Zap },
];

export default function AdminAiFraudDetection() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [rules, setRules] = useState<Rule[]>(seedRules);
  const [tab, setTab] = useState<"rules"|"model"|"log">("rules");

  const toggle = (id: string) => setRules(prev => prev.map(r => r.id===id ? {...r, enabled:!r.enabled} : r));
  const setThreshold = (id: string, val: number) => setRules(prev => prev.map(r => r.id===id ? {...r, threshold:val} : r));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>AI Fraud Detection Config</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Configure ML-powered fraud detection rules, model thresholds, and real-time monitoring for the FreeLan platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div>
                <p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor:T.border }}>
        {(["rules","model","log"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="rules"?"Detection Rules":t==="model"?"Model Settings":"Audit Log"}
          </button>
        ))}
      </div>

      {tab==="rules" && (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-bold text-sm" style={{ color:T.text }}>{rule.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${SEVERITY_COLOR[rule.severity]}18`, color:SEVERITY_COLOR[rule.severity] }}>{rule.severity}</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color:T.sub }}>{rule.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color:T.sub }}>Threshold:</span>
                    <input type="number" value={rule.threshold} onChange={e => setThreshold(rule.id, +e.target.value)}
                      className="w-24 px-2 py-1 rounded-lg text-xs font-mono border" style={{ background:T.input, borderColor:T.border, color:T.text }} />
                  </div>
                </div>
                <button onClick={() => toggle(rule.id)} className="shrink-0">
                  {rule.enabled
                    ? <ToggleRight className="h-8 w-8" style={{ color:A1 }} />
                    : <ToggleLeft className="h-8 w-8" style={{ color:T.sub }} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="model" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-4" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>ML Model Configuration</h3>
            {[
              { label:"Model Version", value:"FraudNet v3.2.1" },
              { label:"Training Data Size", value:"4.2M transactions" },
              { label:"Last Retrained", value:"2 days ago" },
              { label:"Confidence Threshold", value:"87%" },
              { label:"Inference Latency", value:"~12ms" },
              { label:"Auto-Retrain Schedule", value:"Weekly (Sunday 2AM)" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
                <span className="text-sm" style={{ color:T.sub }}>{m.label}</span>
                <span className="font-bold text-sm font-mono" style={{ color:T.text }}>{m.value}</span>
              </div>
            ))}
            <button className="w-full py-2.5 rounded-xl text-sm font-bold mt-2" style={{ background:A1, color:"#fff" }}>
              Trigger Manual Retrain
            </button>
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>Model Performance</h3>
            {[
              { label:"Precision", value:97, color:"#4ade80" },
              { label:"Recall", value:94, color:"#60a5fa" },
              { label:"F1 Score", value:95, color:"#a78bfa" },
              { label:"AUC-ROC", value:98, color:"#f472b6" },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color:T.sub }}>{m.label}</span>
                  <span className="text-xs font-bold" style={{ color:m.color }}>{m.value}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background:`${m.color}20` }}>
                  <div className="h-2 rounded-full" style={{ width:`${m.value}%`, background:m.color }} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl" style={{ background:`${A1}10` }}>
              <TrendingUp className="h-4 w-4" style={{ color:A1 }} />
              <span className="text-xs font-bold" style={{ color:A1 }}>+2.3% accuracy improvement vs last month</span>
            </div>
          </div>
        </div>
      )}

      {tab==="log" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
          <div className="p-4 border-b" style={{ borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>Recent Fraud Detections</h3>
          </div>
          <div className="divide-y" style={{ borderColor:T.border }}>
            {[
              { time:"2 min ago", event:"IP blocked: 103.12.44.8 (velocity limit)", severity:"critical" },
              { time:"11 min ago", event:"PAN reuse: ABCDE1234F linked to 3 accounts", severity:"critical" },
              { time:"34 min ago", event:"Duplicate payment fingerprint flagged: user #4821", severity:"high" },
              { time:"1 hr ago", event:"Review bombing detected: 12 reviews from 3 IPs", severity:"medium" },
              { time:"3 hr ago", event:"Profile photo similarity 94% — user #7710 flagged", severity:"high" },
              { time:"5 hr ago", event:"Abnormal withdrawal: ₹82,000 in 1h (avg ₹12,000)", severity:"high" },
            ].map((l,i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full" style={{ background:SEVERITY_COLOR[l.severity] }} />
                  <span className="text-sm" style={{ color:T.text }}>{l.event}</span>
                </div>
                <span className="text-xs shrink-0 ml-4" style={{ color:T.sub }}>{l.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
