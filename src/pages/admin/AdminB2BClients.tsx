import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { Building2, Users, IndianRupee, Briefcase, Plus, Search } from "lucide-react";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const clients = [
  { id:"b1", company:"Infosys BPM Ltd", contact:"Rajan Kumar", employees:12000, spend:"₹28.4L", projects:84, plan:"Enterprise", status:"Active" },
  { id:"b2", company:"Zomato India",    contact:"Priya Shah",  employees:5000,  spend:"₹14.2L", projects:42, plan:"Enterprise", status:"Active" },
  { id:"b3", company:"Paytm Payments",  contact:"Amit Jain",   employees:8000,  spend:"₹9.8L",  projects:31, plan:"Business+",  status:"Active" },
  { id:"b4", company:"Naukri.com",      contact:"Sneha Gupta", employees:3500,  spend:"₹7.1L",  projects:24, plan:"Business",   status:"Active" },
  { id:"b5", company:"PolicyBazaar",    contact:"Rahul Verma", employees:4200,  spend:"₹5.4L",  projects:18, plan:"Business",   status:"Pending" },
];

const PLAN_COLOR: Record<string,string> = { Enterprise:"#a78bfa", "Business+":"#60a5fa", Business:"#4ade80" };

export default function AdminB2BClients() {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"clients"|"plans"|"analytics">("clients");

  const filtered = clients.filter(c =>
    c.company.toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:T.text }}>B2B Client Management</h1>
          <p className="text-sm mt-1" style={{ color:T.sub }}>Manage enterprise and business clients with custom plans, bulk hiring, and account management.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:A1, color:"#fff" }}>
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"B2B Clients", value:"5", color:"#60a5fa", icon:Building2 },
          { label:"Total Employees Reached", value:"32,700", color:"#a78bfa", icon:Users },
          { label:"B2B Revenue MTD", value:"₹64.9L", color:"#4ade80", icon:IndianRupee },
          { label:"Active Projects", value:"199", color:"#fbbf24", icon:Briefcase },
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
        {(["clients","plans","analytics"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color:tab===t?A1:T.sub, borderBottom:tab===t?`2px solid ${A1}`:"2px solid transparent" }}>
            {t==="clients"?"All Clients":t==="plans"?"B2B Plans":"Analytics"}
          </button>
        ))}
      </div>

      {tab==="clients" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background:T.input, borderColor:T.border }}>
            <Search className="h-4 w-4" style={{ color:T.sub }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search companies..." className="flex-1 bg-transparent text-sm" style={{ color:T.text }} />
          </div>
          {filtered.map(c => (
            <div key={c.id} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="font-bold text-lg" style={{ color:T.text }}>{c.company}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${PLAN_COLOR[c.plan]}20`, color:PLAN_COLOR[c.plan] }}>{c.plan}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:c.status==="Active"?"rgba(74,222,128,.12)":"rgba(251,191,36,.12)", color:c.status==="Active"?"#4ade80":"#fbbf24" }}>{c.status}</span>
                  </div>
                  <p className="text-sm" style={{ color:T.sub }}>Contact: {c.contact} · {c.employees.toLocaleString()} employees</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold" style={{ color:"#4ade80" }}>{c.spend}</p>
                  <p className="text-xs" style={{ color:T.sub }}>{c.projects} projects</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="plans" && (
        <div className="grid lg:grid-cols-3 gap-4">
          {[
            { plan:"Business", price:"₹4,999/mo", seats:10, features:["10 job posts/mo","Priority listing","Basic analytics","Email support"] },
            { plan:"Business+", price:"₹12,999/mo", seats:50, features:["Unlimited job posts","Featured badge","Advanced analytics","Phone support","Bulk hiring"] },
            { plan:"Enterprise", price:"Custom", seats:-1, features:["Unlimited everything","Dedicated manager","Custom integrations","SLA guarantee","White-label option"] },
          ].map(p => (
            <div key={p.plan} className="rounded-2xl border p-5" style={{ background:T.card, borderColor:T.border }}>
              <p className="font-bold text-lg mb-1" style={{ color:PLAN_COLOR[p.plan] }}>{p.plan}</p>
              <p className="text-2xl font-bold mb-1" style={{ color:T.text }}>{p.price}</p>
              <p className="text-xs mb-4" style={{ color:T.sub }}>{p.seats>0 ? `Up to ${p.seats} seats`:"Unlimited seats"}</p>
              <div className="space-y-1.5">
                {p.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs" style={{ color:T.sub }}>
                    <span style={{ color:PLAN_COLOR[p.plan] }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="analytics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>Revenue by Client</h3>
            {clients.map(c => (
              <div key={c.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color:T.sub }}>{c.company}</span>
                  <span className="text-xs font-bold" style={{ color:A1 }}>{c.spend}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background:`${A1}12` }}>
                  <div className="h-2 rounded-full" style={{ width:`${(parseInt(c.spend.replace(/[^\d]/g,""))/2840)*100}%`, background:A1 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-5 space-y-3" style={{ background:T.card, borderColor:T.border }}>
            <h3 className="font-bold" style={{ color:T.text }}>B2B KPIs</h3>
            {[
              { label:"Avg contract value", value:"₹13L" },
              { label:"Client retention rate", value:"88%" },
              { label:"Avg time to first hire", value:"1.8 days" },
              { label:"NPS score", value:"72" },
              { label:"Renewal rate", value:"91%" },
            ].map(k => (
              <div key={k.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor:T.border }}>
                <span className="text-sm" style={{ color:T.sub }}>{k.label}</span>
                <span className="text-sm font-bold" style={{ color:T.text }}>{k.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
