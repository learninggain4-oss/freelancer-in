import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { MessageSquare, TrendingUp, TrendingDown, Minus, Brain, Filter } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type Sentiment = "positive"|"neutral"|"negative";

const reviews = [
  { user:"Priya M.", text:"Excellent platform! Found great freelancers within hours.", sentiment:"positive" as Sentiment, score:0.94, date:"Today" },
  { user:"Rahul K.", text:"Payment was delayed by 2 days. Support resolved it.", sentiment:"neutral" as Sentiment, score:0.51, date:"Today" },
  { user:"Anjali S.", text:"Worst experience. Freelancer disappeared after payment.", sentiment:"negative" as Sentiment, score:0.08, date:"Yesterday" },
  { user:"Vikram P.", text:"Very smooth onboarding. KYC was fast.", sentiment:"positive" as Sentiment, score:0.88, date:"Yesterday" },
  { user:"Neha R.", text:"Chat feature needs improvement. Overall okay.", sentiment:"neutral" as Sentiment, score:0.48, date:"2 days ago" },
  { user:"Amit D.", text:"Got scammed. Raised dispute but no response yet.", sentiment:"negative" as Sentiment, score:0.05, date:"2 days ago" },
  { user:"Soni T.", text:"Love the milestone-based payment! Very secure.", sentiment:"positive" as Sentiment, score:0.91, date:"3 days ago" },
];

const SENT_COLOR: Record<Sentiment,string> = { positive:"#4ade80", neutral:"#fbbf24", negative:"#f87171" };
const SENT_ICON: Record<Sentiment, typeof TrendingUp> = { positive:TrendingUp, neutral:Minus, negative:TrendingDown };

export default function AdminSentimentAnalysis() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [filter, setFilter] = useState<"all"|Sentiment>("all");

  const filtered = filter==="all" ? reviews : reviews.filter(r => r.sentiment===filter);
  const pos = reviews.filter(r=>r.sentiment==="positive").length;
  const neu = reviews.filter(r=>r.sentiment==="neutral").length;
  const neg = reviews.filter(r=>r.sentiment==="negative").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Sentiment Analysis Dashboard</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>AI-powered sentiment tracking across user reviews, support tickets, and chat messages.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Positive", value:`${pos}`, pct:Math.round(pos/reviews.length*100), color:"#4ade80", icon:TrendingUp },
          { label:"Neutral",  value:`${neu}`, pct:Math.round(neu/reviews.length*100), color:"#fbbf24", icon:Minus },
          { label:"Negative", value:`${neg}`, pct:Math.round(neg/reviews.length*100), color:"#f87171", icon:TrendingDown },
          { label:"Avg Score", value:"0.64", pct:64, color:"#a78bfa", icon:Brain },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div>
                <p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full" style={{ background:`${s.color}20` }}>
              <div className="h-1.5 rounded-full" style={{ width:`${s.pct}%`, background:s.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-6" style={{ background:T.card, borderColor:T.border }}>
        <h3 className="font-bold mb-4" style={{ color:T.text }}>Sentiment Over Time (Last 7 Days)</h3>
        <div className="flex items-end gap-2 h-28">
          {[62,71,58,80,74,68,76].map((v,i) => (
            <div key={i} className="flex-1 rounded-t-lg" style={{ height:`${v}%`, background:`${A1}80`, minWidth:0 }} />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <span key={d} className="text-[10px] flex-1 text-center" style={{ color:T.sub }}>{d}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4" style={{ color:T.sub }} />
        {(["all","positive","neutral","negative"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize border transition-all"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r,i) => {
          const Icon = SENT_ICON[r.sentiment];
          return (
            <div key={i} className="rounded-2xl border p-4" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm" style={{ color:T.text }}>{r.user}</span>
                    <span className="text-xs" style={{ color:T.sub }}>· {r.date}</span>
                  </div>
                  <p className="text-sm" style={{ color:T.sub }}>"{r.text}"</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background:`${SENT_COLOR[r.sentiment]}15` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color:SENT_COLOR[r.sentiment] }} />
                    <span className="text-xs font-bold capitalize" style={{ color:SENT_COLOR[r.sentiment] }}>{r.sentiment}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color:T.sub }}>Score: {r.score}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
