import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Users, TrendingDown, CheckCircle2, ArrowRight, BarChart3 } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const freelancerFunnel = [
  { step:"Registered", count:12840, pct:100, dropoff:0 },
  { step:"Email Verified", count:10920, pct:85, dropoff:15 },
  { step:"Profile Basic Info", count:9240, pct:72, dropoff:13 },
  { step:"Skills Added", count:7680, pct:60, dropoff:12 },
  { step:"Portfolio Added", count:5120, pct:40, dropoff:20 },
  { step:"KYC Submitted", count:3840, pct:30, dropoff:10 },
  { step:"First Bid Placed", count:2560, pct:20, dropoff:10 },
  { step:"First Project Won", count:1280, pct:10, dropoff:10 },
];

const clientFunnel = [
  { step:"Registered", count:4820, pct:100, dropoff:0 },
  { step:"Email Verified", count:4340, pct:90, dropoff:10 },
  { step:"Company Info", count:3380, pct:70, dropoff:20 },
  { step:"First Job Posted", count:2170, pct:45, dropoff:25 },
  { step:"First Hire Made", count:1210, pct:25, dropoff:20 },
  { step:"Payment Method Added", count:964, pct:20, dropoff:5 },
  { step:"Second Job Posted", count:530, pct:11, dropoff:9 },
];

export default function AdminUserOnboardingFunnel() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [type, setType] = useState<"freelancer"|"client">("freelancer");
  const funnel = type==="freelancer" ? freelancerFunnel : clientFunnel;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>User Onboarding Funnel</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Visualize step-by-step onboarding completion rates for freelancers and clients. Identify drop-off points and optimize conversion.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"New Registered (MTD)", value:"17,660", color:"#60a5fa", icon:Users },
          { label:"Fully Onboarded", value:"2,244", color:"#4ade80", icon:CheckCircle2 },
          { label:"Onboarding Rate", value:"12.7%", color:"#a78bfa", icon:TrendingDown },
          { label:"Avg Completion Days", value:"4.2d", color:"#fbbf24", icon:BarChart3 },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["freelancer","client"] as const).map(t=>(
          <button key={t} onClick={()=>setType(t)} className="px-4 py-2 rounded-xl text-sm font-bold border transition-all capitalize"
            style={{ background:type===t?A1:"transparent", color:type===t?"#fff":T.sub, borderColor:type===t?A1:T.border }}>{t} Funnel</button>
        ))}
      </div>

      <div className="rounded-2xl border p-6" style={{ background:T.card, borderColor:T.border }}>
        <h3 className="font-bold mb-6" style={{ color:T.text }}>Step-by-Step Funnel — {type==="freelancer"?"Freelancer":"Client"} Onboarding</h3>
        <div className="space-y-3">
          {funnel.map((s,i)=>(
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background:`${A1}15`, color:A1 }}>{i+1}</div>
                  <span className="text-sm font-bold" style={{ color:T.text }}>{s.step}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span style={{ color:T.sub }}>{s.count.toLocaleString()} users</span>
                  <span className="font-bold w-10 text-right" style={{ color:A1 }}>{s.pct}%</span>
                  {s.dropoff>0 && <span className="text-red-400 w-20 text-right">-{s.dropoff}% drop</span>}
                </div>
              </div>
              <div className="h-7 rounded-xl overflow-hidden" style={{ background:`${A1}10` }}>
                <div className="h-full rounded-xl flex items-center px-2 transition-all" style={{ width:`${s.pct}%`, background:s.pct>60?A1:s.pct>30?"#fbbf24":"#f87171", minWidth:"2%" }}>
                  <span className="text-[10px] font-bold text-white">{s.pct}%</span>
                </div>
              </div>
              {s.dropoff>10 && (
                <div className="mt-1 text-xs flex items-center gap-1" style={{ color:"#f87171" }}>
                  <TrendingDown className="h-3 w-3" /> High drop-off — consider adding help nudge here
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
        <h3 className="font-bold mb-3" style={{ color:T.text }}>Optimization Suggestions</h3>
        <div className="space-y-2">
          {[
            { step:"Portfolio Added", suggestion:"Add 'Import from LinkedIn' option to reduce friction", impact:"Est. +8% completion" },
            { step:"KYC Submitted", suggestion:"Pre-fill Aadhaar details using DigiLocker integration", impact:"Est. +6% completion" },
            { step:"First Bid Placed", suggestion:"Guided bid wizard for first-time users", impact:"Est. +5% completion" },
          ].map((s,i)=>(
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor:T.border }}>
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color:A1 }} />
              <div>
                <p className="text-xs font-bold" style={{ color:T.text }}>{s.step}: {s.suggestion}</p>
                <p className="text-xs" style={{ color:"#4ade80" }}>{s.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
