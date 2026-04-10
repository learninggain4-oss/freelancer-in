import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { BarChart3, Plus, TrendingUp, CheckCircle2, Clock, FlaskConical } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const tests = [
  { id:"AB001", name:"Homepage Hero CTA Button", variantA:"Post a Job — Free", variantB:"Hire Top Freelancers", traffic:"50/50", aConv:3.2, bConv:4.8, visitors:8400, status:"Running", winner:null, started:"Mar 20" },
  { id:"AB002", name:"Bid Placement Flow Steps", variantA:"3-Step Wizard", variantB:"Single Form", traffic:"50/50", aConv:28.4, bConv:34.2, visitors:3200, status:"Running", winner:"B", started:"Mar 25" },
  { id:"AB003", name:"Freelancer Profile Card Layout", variantA:"Grid Card", variantB:"List Row", traffic:"50/50", aConv:12.1, bConv:9.8, visitors:12000, status:"Completed", winner:"A", started:"Mar 1" },
  { id:"AB004", name:"Pricing Page Layout", variantA:"Monthly first", variantB:"Annual first", traffic:"50/50", aConv:6.8, bConv:8.4, visitors:5600, status:"Paused", winner:null, started:"Feb 15" },
];

export default function AdminAbTestManager() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const running = tests.filter(t=>t.status==="Running").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>A/B Test Manager</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Create and analyze split tests on UI variants, copy, flows, and pricing to maximize conversions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> New Test
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Running Tests", value:running, color:"#4ade80", icon:FlaskConical },
          { label:"Total Variants Tested", value:"8", color:"#60a5fa", icon:BarChart3 },
          { label:"Avg Uplift", value:"+18%", color:"#a78bfa", icon:TrendingUp },
          { label:"Tests Won (This Month)", value:"1", color:"#fbbf24", icon:CheckCircle2 },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {tests.map(t=>{
          const uplift = t.bConv > t.aConv ? `+${((t.bConv-t.aConv)/t.aConv*100).toFixed(1)}%` : `${((t.bConv-t.aConv)/t.aConv*100).toFixed(1)}%`;
          return (
            <div key={t.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <FlaskConical className="h-4 w-4" style={{ color:A1 }} />
                    <span className="font-bold" style={{ color:T.text }}>{t.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:t.status==="Running"?"rgba(74,222,128,.12)":t.status==="Completed"?"rgba(99,102,241,.12)":"rgba(251,191,36,.12)", color:t.status==="Running"?"#4ade80":t.status==="Completed"?A1:"#fbbf24" }}>{t.status}</span>
                    {t.winner && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:"rgba(74,222,128,.15)", color:"#4ade80" }}>Winner: {t.winner}</span>}
                  </div>
                  <p className="text-xs" style={{ color:T.sub }}>Started {t.started} · {t.visitors.toLocaleString()} visitors · Traffic split: {t.traffic}</p>
                </div>
                <div className="flex gap-2">
                  {t.status==="Running" && <button className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>Pause</button>}
                  {t.status==="Running" && <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>Declare Winner</button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border" style={{ borderColor:t.winner==="A"?"rgba(74,222,128,.3)":T.border, background:t.winner==="A"?"rgba(74,222,128,.05)":"transparent" }}>
                  <p className="text-xs font-bold mb-1" style={{ color:T.sub }}>Variant A</p>
                  <p className="text-sm font-bold mb-2" style={{ color:T.text }}>{t.variantA}</p>
                  <p className="text-2xl font-bold" style={{ color:"#60a5fa" }}>{t.aConv}%</p>
                  <p className="text-xs" style={{ color:T.sub }}>conversion rate</p>
                </div>
                <div className="p-4 rounded-xl border" style={{ borderColor:t.winner==="B"?"rgba(74,222,128,.3)":T.border, background:t.winner==="B"?"rgba(74,222,128,.05)":"transparent" }}>
                  <p className="text-xs font-bold mb-1" style={{ color:T.sub }}>Variant B <span className="ml-1" style={{ color:t.bConv>t.aConv?"#4ade80":"#f87171" }}>{uplift}</span></p>
                  <p className="text-sm font-bold mb-2" style={{ color:T.text }}>{t.variantB}</p>
                  <p className="text-2xl font-bold" style={{ color:"#a78bfa" }}>{t.bConv}%</p>
                  <p className="text-xs" style={{ color:T.sub }}>conversion rate</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
