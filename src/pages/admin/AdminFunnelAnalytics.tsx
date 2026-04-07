import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { TrendingDown, Users, CheckCircle2, ArrowDown } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const funnels = [
  {
    name:"Freelancer Signup Funnel",
    steps:[
      { label:"Landing Page Visit",   count:42000, pct:100 },
      { label:"Registration Started", count:18900, pct:45 },
      { label:"Email Verified",       count:14200, pct:34 },
      { label:"KYC Submitted",        count:8400,  pct:20 },
      { label:"Profile Completed",    count:5600,  pct:13 },
      { label:"First Bid Placed",     count:2800,  pct:7  },
    ],
  },
  {
    name:"Client Hiring Funnel",
    steps:[
      { label:"Job Posted",       count:6200, pct:100 },
      { label:"Bids Received",    count:5800, pct:94 },
      { label:"Freelancer Hired", count:2100, pct:34 },
      { label:"Milestone Set",    count:1890, pct:30 },
      { label:"Work Completed",   count:1540, pct:25 },
      { label:"Review Left",      count:980,  pct:16 },
    ],
  },
];

export default function AdminFunnelAnalytics() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Funnel Analytics</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Analyse conversion funnels from visit to hire — identify drop-off points and optimise.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Overall Conversion", value:"6.7%", color:"#a78bfa", icon:CheckCircle2 },
          { label:"Hire Rate", value:"33.9%", color:"#4ade80", icon:Users },
          { label:"Biggest Drop-off", value:"KYC Step", color:"#f87171", icon:TrendingDown },
          { label:"Avg Steps to Hire", value:"4.2", color:"#60a5fa", icon:ArrowDown },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div>
                <p className="text-lg font-bold" style={{ color:T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {funnels.map(funnel => (
          <div key={funnel.name} className="rounded-2xl border p-6" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold mb-5" style={{ color:T.text }}>{funnel.name}</h3>
            <div className="space-y-2">
              {funnel.steps.map((step, i) => {
                const dropOff = i===0 ? 0 : funnel.steps[i-1].pct - step.pct;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color:T.text }}>{step.label}</span>
                      <div className="flex items-center gap-3">
                        {i>0 && dropOff>10 && (
                          <span className="text-[10px] font-bold" style={{ color:"#f87171" }}>-{dropOff}%</span>
                        )}
                        <span className="text-xs font-mono" style={{ color:T.sub }}>{step.count.toLocaleString()}</span>
                        <span className="text-xs font-bold w-10 text-right" style={{ color:step.pct>=50?"#4ade80":step.pct>=20?"#60a5fa":"#fbbf24" }}>{step.pct}%</span>
                      </div>
                    </div>
                    <div className="h-6 rounded-lg overflow-hidden" style={{ background:`${A1}12` }}>
                      <div className="h-6 rounded-lg flex items-center px-2 transition-all"
                        style={{ width:`${step.pct}%`, background:`${A1}60`, minWidth:"2%" }}>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-6" style={{ background:T.card, borderColor:T.border }}>
        <h3 className="font-bold mb-4" style={{ color:T.text }}>Optimisation Opportunities</h3>
        <div className="grid lg:grid-cols-3 gap-4">
          {[
            { issue:"KYC Drop-off (20%→34% gap)", fix:"Simplify KYC — allow Aadhaar eKYC", impact:"High" },
            { issue:"Low Review Rate (16%)", fix:"Auto-prompt review after payment release", impact:"Medium" },
            { issue:"Profile Completion (13%)", fix:"In-app nudge after email verification", impact:"High" },
          ].map(o => (
            <div key={o.issue} className="p-4 rounded-xl border" style={{ borderColor:T.border }}>
              <p className="font-bold text-sm mb-1" style={{ color:"#f87171" }}>{o.issue}</p>
              <p className="text-xs mb-2" style={{ color:T.sub }}>{o.fix}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:o.impact==="High"?"rgba(74,222,128,.12)":"rgba(96,165,250,.12)", color:o.impact==="High"?"#4ade80":"#60a5fa" }}>{o.impact} Impact</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
