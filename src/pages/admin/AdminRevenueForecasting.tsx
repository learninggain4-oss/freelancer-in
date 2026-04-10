import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, IndianRupee, BarChart3, Calendar, Loader2 } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b" },
};
const A1 = "#6366f1";
const fmt = (v: number) => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : v >= 1000 ? `₹${(v/1000).toFixed(1)}K` : `₹${v.toLocaleString("en-IN")}`;

export default function AdminRevenueForecasting() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const { data, isLoading } = useQuery({
    queryKey: ["admin-revenue-forecast"],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: txns } = await supabase
        .from("transactions")
        .select("amount, created_at, type")
        .gte("created_at", sixMonthsAgo.toISOString())
        .eq("type", "credit");

      const monthMap: Record<string, number> = {};
      for (const t of txns || []) {
        const key = new Date(t.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        monthMap[key] = (monthMap[key] || 0) + Number(t.amount);
      }

      const entries = Object.entries(monthMap).sort((a, b) => {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const [aM, aY] = a[0].split(" ");
        const [bM, bY] = b[0].split(" ");
        return Number(aY) !== Number(bY) ? Number(aY) - Number(bY) : months.indexOf(aM) - months.indexOf(bM);
      });

      const actuals = entries.map(([, v]) => v);
      const monthLabels = entries.map(([k]) => k);
      const currentMRR = actuals[actuals.length - 1] || 0;
      const prevMRR = actuals[actuals.length - 2] || 0;
      const growthPct = prevMRR > 0 ? Math.round(((currentMRR - prevMRR) / prevMRR) * 100) : 0;

      const forecast: number[] = [];
      const forecastLabels: string[] = [];
      const last = currentMRR;
      const growthFactor = growthPct > 0 ? 1 + growthPct / 100 : 1.05;
      const months3 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const now = new Date();
      for (let i = 1; i <= 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        forecast.push(Math.round(last * Math.pow(growthFactor, i)));
        forecastLabels.push(d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }));
      }

      const totalRevenue = actuals.reduce((s, v) => s + v, 0);
      const projectedMRR = forecast[5] || 0;
      const confidence = actuals.length >= 3 ? Math.min(95, 70 + actuals.length * 4) : 0;

      return { actuals, monthLabels, forecast, forecastLabels, currentMRR, growthPct, totalRevenue, projectedMRR, confidence, hasData: actuals.length > 0 };
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: A1 }} />
    </div>
  );

  if (!data?.hasData) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Revenue Forecasting</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Revenue projections based on actual platform transaction data.</p>
      </div>
      <div className="rounded-2xl border p-12 text-center" style={{ background:T.card, borderColor:T.border }}>
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color:T.sub }} />
        <p className="font-bold" style={{ color:T.text }}>No transaction data yet</p>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Revenue forecasting will appear once transactions are recorded in the system.</p>
      </div>
    </div>
  );

  const allValues = [...(data.actuals || []), ...(data.forecast || [])];
  const maxVal = Math.max(...allValues, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Revenue Forecasting</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Revenue projections for the next 6 months based on actual platform transaction trends.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Current MRR", value: fmt(data.currentMRR), color:"#4ade80", icon:IndianRupee },
          { label:`Projected MRR (${data.forecastLabels[5] || "—"})`, value: fmt(data.projectedMRR), color:"#a78bfa", icon:TrendingUp },
          { label:"Growth Rate (MoM)", value: data.growthPct >= 0 ? `+${data.growthPct}%` : `${data.growthPct}%`, color: data.growthPct >= 0 ? "#4ade80" : "#f87171", icon:BarChart3 },
          { label:"Forecast Confidence", value: `${data.confidence}%`, color:"#fbbf24", icon:Calendar },
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
        <h3 className="font-bold mb-6" style={{ color:T.text }}>Revenue Chart (Actual + 6-Month Forecast)</h3>
        <div className="flex items-end gap-1 h-36 mb-4">
          {data.actuals.map((v, i) => (
            <div key={`a${i}`} className="flex-1 rounded-t-lg" title={`${data.monthLabels[i]}: ${fmt(v)}`} style={{ height:`${(v/maxVal)*100}%`, background:"#6366f1", minHeight:2 }} />
          ))}
          {data.forecast.map((v, i) => (
            <div key={`f${i}`} className="flex-1 rounded-t-lg border-2 border-dashed" title={`${data.forecastLabels[i]}: ${fmt(v)} (forecast)`} style={{ height:`${(v/maxVal)*100}%`, background:"rgba(99,102,241,.25)", borderColor:"#6366f1", minHeight:2 }} />
          ))}
        </div>
        <div className="flex overflow-hidden">
          {[...data.monthLabels, ...data.forecastLabels].map(m => (
            <span key={m} className="flex-1 text-center text-[9px] truncate" style={{ color:T.sub }}>{m}</span>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2"><div className="h-3 w-6 rounded" style={{ background:"#6366f1" }} /><span className="text-xs" style={{ color:T.sub }}>Actual</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-6 rounded border-2 border-dashed" style={{ background:"rgba(99,102,241,.25)", borderColor:"#6366f1" }} /><span className="text-xs" style={{ color:T.sub }}>Forecast</span></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
          <h3 className="font-bold" style={{ color:T.text }}>Monthly Forecast Detail</h3>
          {data.forecast.map((base, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
              <span className="text-sm font-bold" style={{ color:T.text }}>{data.forecastLabels[i]}</span>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color:"#f87171" }}>{fmt(Math.round(base * 0.88))}</span>
                <span className="font-bold" style={{ color:"#4ade80" }}>{fmt(base)}</span>
                <span style={{ color:"#60a5fa" }}>{fmt(Math.round(base * 1.12))}</span>
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
          <h3 className="font-bold" style={{ color:T.text }}>Historical Summary</h3>
          {data.actuals.map((v, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
              <span className="text-sm" style={{ color:T.text }}>{data.monthLabels[i]}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color:A1 }}>{fmt(v)}</span>
                {i > 0 && (
                  <span className="text-xs" style={{ color: v >= data.actuals[i-1] ? "#4ade80" : "#f87171" }}>
                    {v >= data.actuals[i-1] ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </div>
          ))}
          {data.actuals.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color:T.sub }}>No historical data</p>
          )}
        </div>
      </div>
    </div>
  );
}
