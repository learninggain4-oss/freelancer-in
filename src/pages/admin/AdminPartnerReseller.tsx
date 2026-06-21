import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Handshake, Building2, IndianRupee, Star, Plus, Search } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type Partner = { id:string; name:string; type:string; tier:string; revenue:string; commission:number; status:string; since:string };

const seedPartners: Partner[] = [
  { id:"p1", name:"TechHire Solutions Pvt Ltd", type:"Reseller", tier:"Gold", revenue:"₹4.2L", commission:12, status:"Active", since:"Jan 2025" },
  { id:"p2", name:"StartupHub India", type:"Partner", tier:"Platinum", revenue:"₹8.9L", commission:15, status:"Active", since:"Oct 2024" },
  { id:"p3", name:"FreelanceConnect.co", type:"Reseller", tier:"Silver", revenue:"₹1.8L", commission:10, status:"Active", since:"Mar 2025" },
  { id:"p4", name:"DevAgency Mumbai", type:"Agency", tier:"Gold", revenue:"₹3.1L", commission:12, status:"Pending", since:"Apr 2025" },
  { id:"p5", name:"DigitalTalent Pro", type:"Reseller", tier:"Bronze", revenue:"₹0.7L", commission:8, status:"Active", since:"Feb 2026" },
];

const TIER_COLOR: Record<string,string> = { Platinum:"#a78bfa", Gold:"#fbbf24", Silver:"#94a3b8", Bronze:"#f97316" };

export default function AdminPartnerReseller() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"partners"|"tiers"|"requests">("partners");

  const filtered = seedPartners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Partner / Reseller Portal</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Manage reseller partnerships, commission tiers, and partner onboarding.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> Add Partner
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Partners", value:"5", color:"#60a5fa", icon:Handshake },
          { label:"Active Partners", value:"4", color:"#4ade80", icon:Building2 },
          { label:"Partner Revenue MTD", value:"₹18.7L", color:"#a78bfa", icon:IndianRupee },
          { label:"Top Partner Tier", value:"Platinum", color:"#fbbf24", icon:Star },
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
        {(["partners","tiers","requests"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="partners"?"All Partners":t==="tiers"?"Commission Tiers":"Onboard Requests"}
          </button>
        ))}
      </div>

      {tab==="partners" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background:T.input, borderColor:T.border }}>
            <Search className="h-4 w-4" style={{ color:T.sub }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search partners..." className="flex-1 bg-transparent text-sm" style={{ color:T.text }} />
          </div>
          {filtered.map(p => (
            <div key={p.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="font-bold" style={{ color:T.text }}>{p.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${TIER_COLOR[p.tier]}20`, color:TIER_COLOR[p.tier] }}>{p.tier}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:p.status==="Active"?"rgba(74,222,128,.12)":"rgba(251,191,36,.12)", color:p.status==="Active"?"#4ade80":"#fbbf24" }}>{p.status}</span>
                  </div>
                  <p className="text-xs" style={{ color:T.sub }}>{p.type} · Since {p.since}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg" style={{ color:"#4ade80" }}>{p.revenue}</p>
                  <p className="text-xs" style={{ color:T.sub }}>{p.commission}% commission</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="tiers" && (
        <div className="grid lg:grid-cols-2 gap-4">
          {[
            { tier:"Platinum", minRevenue:"₹5L/mo", commission:15, perks:["Dedicated account manager","Custom sub-domain","Priority support","Co-marketing access"] },
            { tier:"Gold", minRevenue:"₹2L/mo", commission:12, perks:["Account manager support","API access","Monthly reports","Featured listing"] },
            { tier:"Silver", minRevenue:"₹50K/mo", commission:10, perks:["Email support","Standard API","Quarterly reports"] },
            { tier:"Bronze", minRevenue:"₹0/mo", commission:8, perks:["Self-serve dashboard","Basic reporting"] },
          ].map(t => (
            <div key={t.tier} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg" style={{ color:TIER_COLOR[t.tier] }}>{t.tier}</span>
                <span className="font-bold text-2xl" style={{ color:T.text }}>{t.commission}%</span>
              </div>
              <p className="text-xs mb-3" style={{ color:T.sub }}>Min Revenue: {t.minRevenue}</p>
              <div className="space-y-1">
                {t.perks.map(perk => (
                  <div key={perk} className="flex items-center gap-2 text-xs" style={{ color:T.sub }}>
                    <span style={{ color:TIER_COLOR[t.tier] }}>✓</span> {perk}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="requests" && (
        <div className="space-y-3">
          {[
            { name:"CodeBridge Tech", type:"Reseller", submitted:"2 days ago", revenue:"₹1.2L projected" },
            { name:"HireIndia.io", type:"Partner", submitted:"4 days ago", revenue:"₹3.5L projected" },
          ].map((r,i) => (
            <div key={i} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold" style={{ color:T.text }}>{r.name}</p>
                  <p className="text-xs" style={{ color:T.sub }}>{r.type} · Submitted {r.submitted} · {r.revenue}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>Approve</button>
                  <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
