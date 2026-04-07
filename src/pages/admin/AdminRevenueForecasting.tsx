import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { TrendingUp, IndianRupee, BarChart3, Calendar } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const actuals = [1.2,1.8,2.1,2.6,3.0,3.4];
const forecast = [3.4,3.9,4.5,5.1,5.8,6.4];
const months = ["Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"];

export default function AdminRevenueForecasting() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [model, setModel] = useState<"linear"|"growth"|"seasonal">("growth");

  const maxVal = Math.max(...actuals, ...forecast);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Revenue Forecasting</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>AI-powered revenue projections for the next 6 months based on platform growth trends.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Current MRR", value:"₹34.2L", color:"#4ade80", icon:IndianRupee },
          { label:"Projected MRR (Oct)", value:"₹64.0L", color:"#a78bfa", icon:TrendingUp },
          { label:"Growth Rate", value:"+18%/mo", color:"#60a5fa", icon:BarChart3 },
          { label:"Forecast Confidence", value:"91%", color:"#fbbf24", icon:Calendar },
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

      <div className="rounded-2xl border p-6" style={{ background:T.card, borderColor:T.border }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold" style={{ color:T.text }}>Revenue Chart (₹ Lakhs)</h3>
          <div className="flex gap-2">
            {(["linear","growth","seasonal"] as const).map(m => (
              <button key={m} onClick={() => setModel(m)} className="px-3 py-1 rounded-lg text-xs font-bold capitalize border"
                style={{ background:model===m?A1:"transparent", color:model===m?"#fff":T.sub, borderColor:model===m?A1:T.border }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1 h-36 mb-4">
          {actuals.map((v,i) => (
            <div key={`a${i}`} className="flex-1 rounded-t-lg" style={{ height:`${(v/maxVal)*100}%`, background:"#6366f1" }} />
          ))}
          {forecast.map((v,i) => (
            <div key={`f${i}`} className="flex-1 rounded-t-lg border-2 border-dashed" style={{ height:`${(v/maxVal)*100}%`, background:"rgba(99,102,241,.25)", borderColor:"#6366f1" }} />
          ))}
        </div>
        <div className="flex">
          {months.map(m => <span key={m} className="flex-1 text-center text-[9px]" style={{ color:T.sub }}>{m}</span>)}
        </div>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2"><div className="h-3 w-6 rounded" style={{ background:"#6366f1" }} /><span className="text-xs" style={{ color:T.sub }}>Actual</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-6 rounded border-2 border-dashed" style={{ background:"rgba(99,102,241,.25)", borderColor:"#6366f1" }} /><span className="text-xs" style={{ color:T.sub }}>Forecast</span></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold" style={{ color:T.text }}>Monthly Forecast Detail</h3>
          {[
            { month:"May 2026", low:"₹36L", mid:"₹39L", high:"₹42L" },
            { month:"Jun 2026", low:"₹41L", mid:"₹45L", high:"₹49L" },
            { month:"Jul 2026", low:"₹46L", mid:"₹51L", high:"₹55L" },
            { month:"Aug 2026", low:"₹52L", mid:"₹58L", high:"₹63L" },
            { month:"Sep 2026", low:"₹57L", mid:"₹64L", high:"₹71L" },
            { month:"Oct 2026", low:"₹58L", mid:"₹64L", high:"₹72L" },
          ].map(r => (
            <div key={r.month} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
              <span className="text-sm font-bold" style={{ color:T.text }}>{r.month}</span>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color:"#f87171" }}>{r.low}</span>
                <span className="font-bold" style={{ color:"#4ade80" }}>{r.mid}</span>
                <span style={{ color:"#60a5fa" }}>{r.high}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-4 mt-1">
            {[["Low","#f87171"],["Base","#4ade80"],["High","#60a5fa"]].map(([l,c]) => (
              <span key={l} className="text-[10px] font-bold" style={{ color:c }}>{l}</span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold" style={{ color:T.text }}>Revenue Drivers</h3>
          {[
            { driver:"New freelancer signups", contribution:"34%", trend:"↑" },
            { driver:"Subscription upgrades", contribution:"28%", trend:"↑" },
            { driver:"Commission on projects", contribution:"22%", trend:"→" },
            { driver:"Featured listings", contribution:"9%", trend:"↑" },
            { driver:"TDS processing fees", contribution:"7%", trend:"→" },
          ].map(d => (
            <div key={d.driver} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
              <span className="text-sm" style={{ color:T.text }}>{d.driver}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color:A1 }}>{d.contribution}</span>
                <span className="text-sm" style={{ color:d.trend==="↑"?"#4ade80":d.trend==="↓"?"#f87171":T.sub }}>{d.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
