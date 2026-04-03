import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { IndianRupee, ShieldCheck, AlertTriangle, CheckCircle2, Search, Lock, RefreshCw, XCircle, Eye } from "lucide-react";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

const TRANSACTIONS = [
  { id:"txn_001", user:"Ravi Kumar", amount:5000, status:"success", ref:"PAY-2026-001", duplicate:false, time:"2 min ago" },
  { id:"txn_002", user:"Priya Sharma", amount:12000, status:"duplicate", ref:"PAY-2026-002", duplicate:true, time:"15 min ago" },
  { id:"txn_003", user:"Arjun Singh", amount:3500, status:"pending", ref:"PAY-2026-003", duplicate:false, time:"1 hr ago" },
  { id:"txn_004", user:"Meena Patel", amount:8000, status:"success", ref:"PAY-2026-004", duplicate:false, time:"3 hrs ago" },
  { id:"txn_005", user:"Dev Nair", amount:2200, status:"locked", ref:"PAY-2026-005", duplicate:false, time:"5 hrs ago" },
];

export default function AdminTransactionControl() {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"protection"|"transactions"|"logs">("protection");
  const [retryLimit, setRetryLimit] = useState(3);
  const [lockEnabled, setLockEnabled] = useState(true);
  const [doubleClickProtect, setDoubleClickProtect] = useState(true);
  const [idempotencyEnabled, setIdempotencyEnabled] = useState(true);

  const filtered = TRANSACTIONS.filter(t =>
    t.user.toLowerCase().includes(search.toLowerCase()) || t.ref.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => {
    if (s === "success") return "#4ade80";
    if (s === "duplicate") return "#f87171";
    if (s === "locked") return "#fbbf24";
    return "#94a3b8";
  };

  const stats = [
    { label:"Total Today", value:"₹4,82,000", color:"#60a5fa", icon:IndianRupee },
    { label:"Success Rate", value:"97.2%", color:"#4ade80", icon:CheckCircle2 },
    { label:"Duplicates Blocked", value:"3", color:"#f87171", icon:XCircle },
    { label:"Locked Txns", value:"1", color:"#fbbf24", icon:Lock },
  ];

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="w-12 h-6 rounded-full relative transition-all shrink-0"
      style={{ background: checked ? A1 : T.border }}>
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-0.5"}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Transaction Protection</h1>
        <p className="text-sm mt-1" style={{ color: T.sub }}>Prevent duplicate payments, manage idempotency keys, and monitor transaction integrity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background:`${s.color}18` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: T.text }}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: T.border }}>
        {(["protection","transactions","logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-bold capitalize transition-all"
            style={{ color: activeTab === tab ? A1 : T.sub, borderBottom: activeTab === tab ? `2px solid ${A1}` : "2px solid transparent" }}>
            {tab === "protection" ? "Protection Rules" : tab === "transactions" ? "Transactions" : "Integrity Logs"}
          </button>
        ))}
      </div>

      {activeTab === "protection" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Core Protection Controls</h3>
            {[
              { label:"Payment idempotency key generation", sub:"Auto-generate unique key per payment attempt", checked:idempotencyEnabled, set:setIdempotencyEnabled },
              { label:"Payment transaction lock", sub:"Lock transaction while processing to prevent duplicates", checked:lockEnabled, set:setLockEnabled },
              { label:"Double-click payment protection", sub:"Block rapid repeat submissions from UI", checked:doubleClickProtect, set:setDoubleClickProtect },
            ].map(s => (
              <div key={s.label} className="flex items-start justify-between gap-4 p-4 rounded-xl border" style={{ borderColor: T.border }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: T.text }}>{s.label}</p>
                  <p className="text-xs mt-1" style={{ color: T.sub }}>{s.sub}</p>
                </div>
                <Toggle checked={s.checked} onChange={() => s.set(v => !v)} />
              </div>
            ))}
            <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: T.border }}>
              <div>
                <p className="font-bold text-sm" style={{ color: T.text }}>Payment retry limit</p>
                <p className="text-xs mt-1" style={{ color: T.sub }}>Max retry attempts before blocking</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setRetryLimit(v => Math.max(1, v-1))} className="h-7 w-7 rounded-full border flex items-center justify-center" style={{ borderColor: T.border, color: T.text }}>−</button>
                <span className="w-6 text-center font-bold" style={{ color: T.text }}>{retryLimit}</span>
                <button onClick={() => setRetryLimit(v => Math.min(10, v+1))} className="h-7 w-7 rounded-full border flex items-center justify-center" style={{ borderColor: T.border, color: T.text }}>+</button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ background: T.card, borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Duplicate Detection Engine</h3>
            {[
              { label:"Payment unique reference validator", ok:true },
              { label:"Duplicate payment detection engine", ok:true },
              { label:"Payment verification before processing", ok:true },
              { label:"Payment reconciliation system", ok:true },
              { label:"Refund auto-trigger (on duplicate)", ok:idempotencyEnabled },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: T.border }}>
                <span className="text-sm" style={{ color: T.text }}>{c.label}</span>
                {c.ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl border" style={{ background: T.input, borderColor: T.border }}>
            <Search className="h-4 w-4" style={{ color: T.sub }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or reference…"
              className="bg-transparent flex-1 text-sm outline-none" style={{ color: T.text }} />
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
            <div className="divide-y" style={{ borderColor: T.border }}>
              {filtered.map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor(txn.status) }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: T.text }}>{txn.user}</p>
                      <p className="text-xs font-mono" style={{ color: T.sub }}>{txn.ref} · {txn.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold font-mono" style={{ color: T.text }}>₹{txn.amount.toLocaleString()}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:`${statusColor(txn.status)}18`, color: statusColor(txn.status) }}>
                      {txn.status}
                    </span>
                    {txn.duplicate && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">DUPLICATE</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "logs" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="p-4 border-b" style={{ borderColor: T.border }}>
            <h3 className="font-bold" style={{ color: T.text }}>Payment Integrity Logs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: T.border }}>
            {[
              { event:"Duplicate payment blocked", ref:"PAY-2026-002", user:"Priya Sharma", action:"Auto-refund triggered", time:"15 min ago", severity:"high" },
              { event:"Idempotency key validated", ref:"PAY-2026-001", user:"Ravi Kumar", action:"Payment processed", time:"2 min ago", severity:"info" },
              { event:"Transaction locked", ref:"PAY-2026-005", user:"Dev Nair", action:"Pending investigation", time:"5 hrs ago", severity:"medium" },
              { event:"Reconciliation completed", ref:"batch_daily", user:"System", action:"0 discrepancies", time:"Yesterday", severity:"info" },
            ].map((l,i) => (
              <div key={i} className="flex items-start justify-between p-4 hover:bg-white/5 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${l.severity === "high" ? "bg-red-400" : l.severity === "medium" ? "bg-amber-400" : "bg-blue-400"}`} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>{l.event}</p>
                    <p className="text-xs" style={{ color: T.sub }}>{l.ref} · {l.user}</p>
                    <p className="text-xs mt-0.5" style={{ color: T.sub }}>{l.action} · {l.time}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.severity === "high" ? "bg-red-500/15 text-red-400" : l.severity === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
                  {l.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
