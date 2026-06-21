import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Gift, Plus, Coins, Users, TrendingUp, Settings } from "lucide-react";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const earningRules = [
  { action:"Complete a project", points:100, active:true },
  { action:"Receive 5-star review", points:50, active:true },
  { action:"Refer a new user", points:200, active:true },
  { action:"Pass skill assessment", points:75, active:true },
  { action:"Complete profile 100%", points:150, active:true },
  { action:"Respond within 1 hour", points:10, active:true },
  { action:"First bid placed", points:25, active:false },
  { action:"Post a testimonial", points:30, active:false },
];

const redeemOptions = [
  { reward:"₹50 Cash Withdrawal Bonus", cost:1000, redeemed:842, active:true },
  { reward:"Featured Listing for 7 days", cost:500, redeemed:1240, active:true },
  { reward:"Premium Badge (1 month)", cost:800, redeemed:320, active:true },
  { reward:"Bid Pack — 10 extra bids", cost:300, redeemed:2180, active:true },
  { reward:"1 Free Skill Assessment", cost:200, redeemed:940, active:true },
];

export default function AdminLoyaltyPointsSystem() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [tab, setTab] = useState<"earn"|"redeem">("earn");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Loyalty Points System</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Configure how FreeLan Coins are earned, redeemed, and managed to drive freelancer retention and engagement.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border" style={{ borderColor:T.border, color:T.sub }}>
            <Settings className="h-4 w-4" /> Configure
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{ background:A1, color:"#fff" }}>
            <Plus className="h-4 w-4" /> Add Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Points Issued MTD", value:"8,42,000", color:"#fbbf24", icon:Coins },
          { label:"Points Redeemed MTD", value:"3,18,000", color:"#4ade80", icon:Gift },
          { label:"Users with Points", value:"24,820", color:"#60a5fa", icon:Users },
          { label:"Redemption Rate", value:"37.8%", color:"#a78bfa", icon:TrendingUp },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background:T.card, borderColor:T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color:s.color }} /></div>
              <div><p className="text-xl font-bold" style={{ color:T.text }}>{s.value}</p><p className="text-[10px] uppercase font-bold tracking-widest" style={{ color:T.sub }}>{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor:T.border }}>
        {(["earn","redeem"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="earn"?"Earning Rules":"Redemption Options"}
          </button>
        ))}
      </div>

      {tab==="earn" && (
        <div className="space-y-3">
          {earningRules.map((r,i)=>(
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background:"rgba(251,191,36,.12)" }}><Coins className="h-4 w-4" style={{ color:"#fbbf24" }} /></div>
                <div>
                  <p className="font-bold text-sm" style={{ color:T.text }}>{r.action}</p>
                  <p className="text-xs" style={{ color:T.sub }}>+{r.points} FreeLan Coins</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm" style={{ color:"#fbbf24" }}>+{r.points} pts</span>
                <div className="relative">
                  <div className="h-5 w-9 rounded-full cursor-pointer transition-all" style={{ background:r.active?A1:"rgba(148,163,184,.2)" }}>
                    <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left:r.active?"calc(100% - 18px)":"2px" }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="redeem" && (
        <div className="space-y-3">
          {redeemOptions.map((r,i)=>(
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background:"rgba(74,222,128,.12)" }}><Gift className="h-4 w-4" style={{ color:"#4ade80" }} /></div>
                <div>
                  <p className="font-bold text-sm" style={{ color:T.text }}>{r.reward}</p>
                  <p className="text-xs" style={{ color:T.sub }}>Redeemed {r.redeemed.toLocaleString()} times</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm" style={{ color:"#fbbf24" }}>{r.cost} pts</span>
                <div className="relative">
                  <div className="h-5 w-9 rounded-full cursor-pointer transition-all" style={{ background:r.active?A1:"rgba(148,163,184,.2)" }}>
                    <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left:r.active?"calc(100% - 18px)":"2px" }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button className="w-full py-3 rounded-2xl border-2 border-dashed text-sm font-bold" style={{ borderColor:`${A1}30`, color:A1 }}>+ Add Redemption Option</button>
        </div>
      )}
    </div>
  );
}
