import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { IndianRupee, UserPlus, CheckCircle2, Clock, Search, Download } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

type Status = "Paid"|"Pending"|"Processing";

const payouts = [
  { id:"AP001", affiliate:"Ravi Shankar", referrals:42, earned:"₹12,600", pending:"₹0",     status:"Paid" as Status,       date:"Mar 31, 2026" },
  { id:"AP002", affiliate:"Neha Joshi",   referrals:28, earned:"₹8,400",  pending:"₹2,100", status:"Pending" as Status,    date:"Due Apr 30" },
  { id:"AP003", affiliate:"Arjun Das",    referrals:15, earned:"₹4,500",  pending:"₹1,500", status:"Processing" as Status, date:"Processing" },
  { id:"AP004", affiliate:"Sita Rao",     referrals:61, earned:"₹18,300", pending:"₹0",     status:"Paid" as Status,       date:"Mar 31, 2026" },
  { id:"AP005", affiliate:"Mohan Verma",  referrals:9,  earned:"₹2,700",  pending:"₹900",   status:"Pending" as Status,    date:"Due Apr 30" },
];

const STATUS_COLOR: Record<Status,string> = { Paid:"#4ade80", Pending:"#fbbf24", Processing:"#60a5fa" };

export default function AdminAffiliatePayouts() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All"|Status>("All");

  const filtered = payouts.filter(p => {
    const matchSearch = p.affiliate.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter==="All" || p.status===filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>Affiliate Payout Tracker</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Track, approve, and process affiliate commission payouts for the FreeLan referral programme.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor:A1, color:A1 }}>
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Affiliates", value:"5", color:"#60a5fa", icon:UserPlus },
          { label:"Total Referrals MTD", value:"155", color:"#a78bfa", icon:UserPlus },
          { label:"Paid Out MTD", value:"₹30,900", color:"#4ade80", icon:IndianRupee },
          { label:"Pending Payouts", value:"₹4,500", color:"#fbbf24", icon:Clock },
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

      <div className="rounded-2xl border p-4" style={{ background:T.card, borderColor:T.border }}>
        <h3 className="font-bold mb-3" style={{ color:T.text }}>Commission Structure</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { action:"Freelancer Signup", rate:"₹150/referral" },
            { action:"First Project Hire", rate:"₹300/referral" },
            { action:"Premium Upgrade", rate:"₹500/referral" },
          ].map(c => (
            <div key={c.action} className="p-3 rounded-xl border text-center" style={{ borderColor:T.border }}>
              <p className="text-sm font-bold" style={{ color:A1 }}>{c.rate}</p>
              <p className="text-xs mt-1" style={{ color:T.sub }}>{c.action}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1" style={{ background:T.input, borderColor:T.border }}>
          <Search className="h-4 w-4 shrink-0" style={{ color:T.sub }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search affiliate..." className="flex-1 bg-transparent text-sm" style={{ color:T.text }} />
        </div>
        {(["All","Paid","Pending","Processing"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-2 rounded-xl text-xs font-bold border"
            style={{ background:filter===f?A1:"transparent", color:filter===f?"#fff":T.sub, borderColor:filter===f?A1:T.border }}>
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background:T.card, borderColor:T.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor:T.border }}>
              {["ID","Affiliate","Referrals","Total Earned","Pending","Status","Date"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold" style={{ color:T.sub }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b hover:opacity-80" style={{ borderColor:T.border }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color:T.sub }}>{p.id}</td>
                <td className="px-4 py-3 font-bold" style={{ color:T.text }}>{p.affiliate}</td>
                <td className="px-4 py-3" style={{ color:T.sub }}>{p.referrals}</td>
                <td className="px-4 py-3 font-bold" style={{ color:"#4ade80" }}>{p.earned}</td>
                <td className="px-4 py-3 font-bold" style={{ color:p.pending==="₹0"?T.sub:"#fbbf24" }}>{p.pending}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${STATUS_COLOR[p.status]}15`, color:STATUS_COLOR[p.status] }}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color:T.sub }}>{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background:"rgba(74,222,128,.12)", color:"#4ade80" }}>
          <CheckCircle2 className="h-4 w-4 inline mr-2" />Process All Pending Payouts
        </button>
      </div>
    </div>
  );
}
