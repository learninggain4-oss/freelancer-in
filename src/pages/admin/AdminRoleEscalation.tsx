import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { UserCog, CheckCircle2, AlertTriangle, Shield, RefreshCw, XCircle, Clock } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const REQUESTS = [
  { id:"r1", user:"Rahul Sharma", from:"moderator", to:"admin", reason:"Need payment approval access", status:"pending", time:"2 hrs ago" },
  { id:"r2", user:"Kavya Nair", from:"user", to:"freelancer", reason:"Completed profile verification", status:"approved", time:"1 day ago" },
  { id:"r3", user:"Dev Patel", from:"admin", to:"superadmin", reason:"Taking over site operations", status:"rejected", time:"3 days ago" },
];

const ROLES = ["user","freelancer","client","moderator","admin","superadmin"];

export default function AdminRoleEscalation() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [requests, setRequests] = useState(REQUESTS);
  const [activeTab, setActiveTab] = useState<"requests"|"matrix"|"logs">("requests");

  const approve = (id: string) => setRequests(prev => prev.map(r => r.id===id?{...r,status:"approved"}:r));
  const reject = (id: string) => setRequests(prev => prev.map(r => r.id===id?{...r,status:"rejected"}:r));

  const statusColor = (s: string) => s==="approved"?"#4ade80":s==="rejected"?"#f87171":"#fbbf24";

  const stats = [
    { label:"Pending Requests", value:requests.filter(r=>r.status==="pending").length, color:"#fbbf24", icon:Clock },
    { label:"Approved (30d)", value:requests.filter(r=>r.status==="approved").length, color:"#4ade80", icon:CheckCircle2 },
    { label:"Rejected (30d)", value:requests.filter(r=>r.status==="rejected").length, color:"#f87171", icon:XCircle },
    { label:"Total Roles", value:ROLES.length, color:A1, icon:UserCog },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Role Escalation Management</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Review role escalation requests, manage role permissions matrix, and track all role changes.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              <div>
                <p className="text-xl font-bold" style={{ color: T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["requests","matrix","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "requests" ? "Escalation Requests" : tab === "matrix" ? "Permission Matrix" : "Change Logs"}
          </button>
        ))}
      </div>

      {activeTab === "requests" && (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: T.text }}>{r.user}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${A1}15`, color: A1 }}>{r.from}</span>
                    <span style={{ color: T.sub }}>→</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${A2}15`, color: A2 }}>{r.to}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${statusColor(r.status)}18`, color: statusColor(r.status) }}>{r.status}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: T.sub }}>Reason: {r.reason} · {r.time}</p>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => approve(r.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(74,222,128,.15)", color:"#4ade80" }}>Approve</button>
                    <button onClick={() => reject(r.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(248,113,113,.15)", color:"#f87171" }}>Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "matrix" && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
          <h3 className="font-bold" style={{ color: T.text }}>Role Permission Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2" style={{ color: T.sub }}>Permission</th>
                  {ROLES.map(r => <th key={r} className="text-center p-2 capitalize" style={{ color: T.sub }}>{r}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: T.border }}>
                {[
                  { perm:"View dashboard", access:[1,1,1,1,1,1] },
                  { perm:"Create jobs", access:[0,0,1,1,1,1] },
                  { perm:"Bid on jobs", access:[0,1,0,1,1,1] },
                  { perm:"Approve payments", access:[0,0,0,0,1,1] },
                  { perm:"Manage users", access:[0,0,0,1,1,1] },
                  { perm:"Access system config", access:[0,0,0,0,1,1] },
                  { perm:"Superadmin controls", access:[0,0,0,0,0,1] },
                ].map(p => (
                  <tr key={p.perm}>
                    <td className="p-2 font-bold" style={{ color: T.text }}>{p.perm}</td>
                    {p.access.map((a,i) => (
                      <td key={i} className="p-2 text-center">
                        {a ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mx-auto" /> : <XCircle className="h-3.5 w-3.5 mx-auto" style={{ color: T.border }} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}><h3 className="font-bold" style={{ color: T.text }}>Role Change Logs</h3></div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {requests.map(r => (
              <div key={r.id} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{r.user}: {r.from} → {r.to}</p>
                  <p className="text-xs" style={{ color: T.sub }}>{r.reason}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{r.time}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background:`${statusColor(r.status)}18`, color: statusColor(r.status) }}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
