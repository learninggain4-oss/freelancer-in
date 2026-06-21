import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Brain, Sliders, CheckCircle2, RefreshCw, TrendingUp, Users } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type Weight = { key:string; label:string; value:number; description:string };

const seedWeights: Weight[] = [
  { key:"skill_match",    label:"Skill Match",          value:35, description:"How well freelancer skills align with job requirements" },
  { key:"rating",         label:"Rating Score",          value:20, description:"Freelancer's average client rating (1–5)" },
  { key:"completion",     label:"Completion Rate",       value:15, description:"% of jobs completed successfully" },
  { key:"response_time",  label:"Response Time",         value:10, description:"Avg time to respond to client messages" },
  { key:"budget_fit",     label:"Budget Compatibility",  value:10, description:"How closely bid aligns with client budget" },
  { key:"location",       label:"Location Preference",   value:5,  description:"State/city proximity to client" },
  { key:"experience",     label:"Experience Level",      value:5,  description:"Years and projects in relevant category" },
];

export default function AdminSmartMatchAlgorithm() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [weights, setWeights] = useState<Weight[]>(seedWeights);
  const [tab, setTab] = useState<"weights"|"preview"|"stats">("weights");

  const total = weights.reduce((s,w) => s+w.value, 0);
  const updateWeight = (key: string, val: number) => setWeights(prev => prev.map(w => w.key===key ? {...w, value:val} : w));

  const previewMatches = [
    { freelancer:"Priya Sharma", score:94, skills:"React, TypeScript", location:"Mumbai", rating:4.9 },
    { freelancer:"Arjun Nair",   score:89, skills:"React, Node.js",   location:"Bangalore", rating:4.7 },
    { freelancer:"Sneha Gupta",  score:82, skills:"Vue, TypeScript",  location:"Pune", rating:4.8 },
    { freelancer:"Rahul Das",    score:76, skills:"Angular, React",   location:"Delhi", rating:4.5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Smart Match Algorithm</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Configure the AI matching engine that connects freelancers with the right jobs.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold" style={{ borderColor:total===100?"#4ade80":T.border, color:total===100?"#4ade80":"#f87171" }}>
          {total===100 ? <CheckCircle2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          Total: {total}%
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Avg Match Score", value:"88.4%", icon:Brain, color:"#a78bfa" },
          { label:"Hire Rate", value:"34.2%", icon:Users, color:"#4ade80" },
          { label:"Time-to-Hire", value:"2.1 days", icon:TrendingUp, color:"#60a5fa" },
          { label:"Client Satisfaction", value:"96.1%", icon:CheckCircle2, color:"#f472b6" },
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

      <div className="flex gap-2 border-b" style={{ borderColor:T.border }}>
        {(["weights","preview","stats"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="weights"?"Algorithm Weights":t==="preview"?"Match Preview":"Performance Stats"}
          </button>
        ))}
      </div>

      {tab==="weights" && (
        <div className="space-y-4">
          {total !== 100 && (
            <div className="p-3 rounded-xl border text-sm font-bold text-center" style={{ background:"rgba(248,113,113,.08)", borderColor:"rgba(248,113,113,.3)", color:"#f87171" }}>
              Weights must sum to 100%. Currently: {total}%
            </div>
          )}
          {weights.map(w => (
            <div key={w.key} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm" style={{ color:T.text }}>{w.label}</span>
                <span className="font-bold text-sm" style={{ color:A1 }}>{w.value}%</span>
              </div>
              <p className="text-xs mb-3" style={{ color:T.sub }}>{w.description}</p>
              <input type="range" min={0} max={60} value={w.value} onChange={e => updateWeight(w.key, +e.target.value)}
                className="w-full accent-indigo-500" />
            </div>
          ))}
          <button className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background:total===100?A1:"rgba(255,255,255,.08)", color:total===100?"#fff":T.sub }}
            disabled={total!==100}>Save Algorithm Config</button>
        </div>
      )}

      {tab==="preview" && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-4" style={{ background:T.card, borderColor:T.border }}>
            <p className="text-sm font-bold mb-3" style={{ color:T.text }}>Sample Job: "React + TypeScript Developer — ₹40,000 — Mumbai"</p>
            <div className="space-y-3">
              {previewMatches.map((m,i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color:T.text }}>{m.freelancer}</p>
                    <p className="text-xs" style={{ color:T.sub }}>{m.skills} · {m.location} · ⭐ {m.rating}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color:m.score>=90?"#4ade80":m.score>=80?"#60a5fa":"#fbbf24" }}>{m.score}%</p>
                    <p className="text-[10px]" style={{ color:T.sub }}>match score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="stats" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-3" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>Top Match Categories</h3>
            {[
              { cat:"Web Development", matches:4210, hire:38 },
              { cat:"Mobile Apps", matches:2890, hire:41 },
              { cat:"Graphic Design", matches:1980, hire:29 },
              { cat:"Content Writing", matches:1540, hire:52 },
              { cat:"Data Science", matches:980, hire:35 },
            ].map(c => (
              <div key={c.cat} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
                <span className="text-sm" style={{ color:T.text }}>{c.cat}</span>
                <div className="text-right">
                  <span className="text-xs font-bold" style={{ color:A1 }}>{c.matches.toLocaleString()} matches</span>
                  <span className="text-xs ml-2" style={{ color:"#4ade80" }}>{c.hire}% hired</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-6 space-y-3" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>Algorithm Health</h3>
            {[
              { label:"Matches generated today", value:"12,400" },
              { label:"Avg response to match", value:"18 min" },
              { label:"Top weight factor", value:"Skill Match (35%)" },
              { label:"Model last updated", value:"3 days ago" },
              { label:"A/B test running", value:"Yes — Variant B (+4% hire rate)" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
                <span className="text-sm" style={{ color:T.sub }}>{m.label}</span>
                <span className="text-sm font-bold" style={{ color:T.text }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
