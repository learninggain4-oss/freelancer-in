import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, Users, CheckCircle2, ArrowDown, Loader2 } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b" },
};
const A1 = "#6366f1";

export default function AdminFunnelAnalytics() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const { data, isLoading } = useQuery({
    queryKey: ["admin-funnel-analytics"],
    queryFn: async () => {
      const [
        { count: totalFreelancers },
        { count: approvedFreelancers },
        { count: aadhaarSubmitted },
        { count: aadhaarVerified },
        { count: totalClients },
        { count: totalProjects },
        { count: activeProjects },
        { count: completedProjects },
        { data: reviews },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count:"exact", head:true }).eq("user_type","employee"),
        supabase.from("profiles").select("*", { count:"exact", head:true }).eq("user_type","employee").eq("approval_status","approved"),
        supabase.from("aadhaar_verifications").select("*", { count:"exact", head:true }),
        supabase.from("aadhaar_verifications").select("*", { count:"exact", head:true }).eq("status","verified"),
        supabase.from("profiles").select("*", { count:"exact", head:true }).eq("user_type","client"),
        supabase.from("projects").select("*", { count:"exact", head:true }),
        supabase.from("projects").select("*", { count:"exact", head:true }).eq("status","active"),
        supabase.from("projects").select("*", { count:"exact", head:true }).eq("status","completed"),
        supabase.from("reviews").select("id"),
      ]);

      const fl = totalFreelancers || 0;
      const cl = totalClients || 0;
      const aaSub = aadhaarSubmitted || 0;
      const aaVer = aadhaarVerified || 0;
      const aprv = approvedFreelancers || 0;
      const proj = totalProjects || 0;
      const active = activeProjects || 0;
      const completed = completedProjects || 0;
      const revCount = reviews?.length || 0;

      const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;

      const hireRate = pct(completed, proj);
      const overallConv = pct(aprv, fl);
      const avgSteps = aprv > 0 ? ((fl + aaSub + aprv) / aprv).toFixed(1) : "—";

      const biggestDropoff = (() => {
        const drops = [
          { label: "KYC Step", drop: fl - aaSub },
          { label: "Approval Step", drop: aaSub - aprv },
        ];
        return drops.sort((a, b) => b.drop - a.drop)[0]?.label || "—";
      })();

      const freelancerFunnel = [
        { label: "Registered (Freelancers)", count: fl, pct: 100 },
        { label: "Aadhaar KYC Submitted", count: aaSub, pct: pct(aaSub, fl) },
        { label: "Aadhaar Verified", count: aaVer, pct: pct(aaVer, fl) },
        { label: "Profile Approved", count: aprv, pct: pct(aprv, fl) },
      ];

      const clientFunnel = [
        { label: "Registered (Employers)", count: cl, pct: 100 },
        { label: "Jobs Posted", count: proj, pct: pct(proj, cl) },
        { label: "Jobs Active", count: active, pct: pct(active, cl) },
        { label: "Jobs Completed", count: completed, pct: pct(completed, cl) },
        { label: "Reviews Left", count: revCount, pct: pct(revCount, completed > 0 ? completed : 1) },
      ];

      return { freelancerFunnel, clientFunnel, overallConv, hireRate, biggestDropoff, avgSteps, hasData: fl > 0 || cl > 0 };
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
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Funnel Analytics</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Real conversion funnels from registration to hire — based on live platform data.</p>
      </div>
      <div className="rounded-2xl border p-12 text-center" style={{ background:T.card, borderColor:T.border }}>
        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color:T.sub }} />
        <p className="font-bold" style={{ color:T.text }}>No user data yet</p>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Funnel analytics will appear once users register on the platform.</p>
      </div>
    </div>
  );

  const funnels = [
    { name: "Freelancer Signup Funnel", steps: data.freelancerFunnel },
    { name: "Client Hiring Funnel", steps: data.clientFunnel },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color:T.text }}>Funnel Analytics</h1>
        <p className="text-sm mt-1" style={{ color:T.sub }}>Real conversion funnels from registration to hire — based on live platform data.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Overall Approval Rate", value:`${data.overallConv}%`, color:"#a78bfa", icon:CheckCircle2 },
          { label:"Job Completion Rate", value:`${data.hireRate}%`, color:"#4ade80", icon:Users },
          { label:"Biggest Drop-off", value: data.biggestDropoff, color:"#f87171", icon:TrendingDown },
          { label:"Avg Steps to Approval", value: String(data.avgSteps), color:"#60a5fa", icon:ArrowDown },
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
                const dropOff = i === 0 ? 0 : funnel.steps[i-1].pct - step.pct;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color:T.text }}>{step.label}</span>
                      <div className="flex items-center gap-3">
                        {i > 0 && dropOff > 10 && (
                          <span className="text-[10px] font-bold" style={{ color:"#f87171" }}>-{dropOff}%</span>
                        )}
                        <span className="text-xs font-mono" style={{ color:T.sub }}>{step.count.toLocaleString("en-IN")}</span>
                        <span className="text-xs font-bold w-10 text-right" style={{ color:step.pct>=50?"#4ade80":step.pct>=20?"#60a5fa":"#fbbf24" }}>{step.pct}%</span>
                      </div>
                    </div>
                    <div className="h-6 rounded-lg overflow-hidden" style={{ background:`${A1}12` }}>
                      <div className="h-6 rounded-lg transition-all" style={{ width:`${Math.max(step.pct, 2)}%`, background:`${A1}60` }} />
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
            { issue:"KYC Drop-off", fix:"Streamline Aadhaar submission — reduce friction in KYC flow", impact:"High" },
            { issue:"Low Review Rate", fix:"Auto-prompt review request after project completion", impact:"Medium" },
            { issue:"Profile Approval Rate", fix:"Send in-app reminders to users awaiting profile approval", impact:"High" },
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
