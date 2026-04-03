import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IndianRupee, TrendingUp, ArrowDownToLine, Clock, FileText,
  Download, Calendar, ChevronDown, CheckCircle, Wallet, BarChart3,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { toast } from "sonner";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)", tip: { background: "rgba(13,13,36,.95)", border: "1px solid rgba(255,255,255,.1)", color: "white" }, axis: "rgba(255,255,255,.3)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", tip: { background: "#fff", border: "1px solid rgba(0,0,0,.1)", color: "#1e293b" }, axis: "#9ca3af" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc", tip: { background: "#fff", border: "1px solid rgba(0,0,0,.1)", color: "#1e293b" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff" }, axis: "#9ca3af" },
};

const MOCK_MONTHLY = [
  { month: "Oct", earned: 12000 }, { month: "Nov", earned: 18500 },
  { month: "Dec", earned: 9000  }, { month: "Jan", earned: 22000 },
  { month: "Feb", earned: 15000 }, { month: "Mar", earned: 28500 },
];

const MOCK_TXN = [
  { id: "t1", type: "credit",  desc: "Payment — React Dashboard Project",     amount: 35000, date: "Mar 28, 2026", status: "completed" },
  { id: "t2", type: "debit",   desc: "Withdrawal to SBI ****4321",             amount: 15000, date: "Mar 25, 2026", status: "completed" },
  { id: "t3", type: "credit",  desc: "Payment — Logo Design",                  amount: 6500,  date: "Mar 20, 2026", status: "completed" },
  { id: "t4", type: "credit",  desc: "Milestone 1 — Flutter App",              amount: 20000, date: "Mar 15, 2026", status: "completed" },
  { id: "t5", type: "debit",   desc: "Withdrawal to HDFC ****8892",            amount: 10000, date: "Mar 10, 2026", status: "completed" },
  { id: "t6", type: "credit",  desc: "Payment — WordPress E-commerce",        amount: 8500,  date: "Mar 05, 2026", status: "completed" },
];

export default function EmployeeEarnings() {
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const isDark = theme === "black";
  const clrGreen = isDark ? "#4ade80" : "#16a34a";
  const clrAmber = isDark ? "#fbbf24" : "#b45309";
  const clrRed   = isDark ? "#f87171" : "#dc2626";
  const clrBlue  = isDark ? "#60a5fa" : "#2563eb";
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [invoiceMonth, setInvoiceMonth]   = useState("March 2026");
  const [invoiceName, setInvoiceName]     = useState(profile?.full_name ?? "Freelancer");
  const [invoiceGstin, setInvoiceGstin]   = useState("");
  const [showInvoice, setShowInvoice]     = useState(false);

  const { data: txns = [], isLoading } = useQuery({
    queryKey: ["employee-earnings-txns", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.from("transactions").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  const displayTxns = txns.length > 0 ? txns : MOCK_TXN;

  const totalEarned   = displayTxns.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalWithdrawn= displayTxns.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const pendingBal    = profile?.available_balance ?? (totalEarned - totalWithdrawn);
  const holdBal       = profile?.hold_balance ?? 0;

  const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  const handleDownloadInvoice = () => {
    const content = `
INVOICE
=======
Freelancer India Platform
Date: ${invoiceMonth}

Bill From:
${invoiceName}
${invoiceGstin ? `GSTIN: ${invoiceGstin}` : ""}

Summary:
Total Earned    : ₹${totalEarned.toLocaleString("en-IN")}
Total Withdrawn : ₹${totalWithdrawn.toLocaleString("en-IN")}
Available Balance: ₹${Number(pendingBal).toLocaleString("en-IN")}

Transactions:
${displayTxns.map((t: any) => `${t.date ?? new Date(t.created_at).toLocaleDateString("en-IN")} | ${t.type === "credit" ? "+" : "-"}₹${Number(t.amount).toLocaleString("en-IN")} | ${t.desc ?? t.description ?? "Transaction"}`).join("\n")}

---
Generated by Freelancer India | freelancer-india.com
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invoice-${invoiceMonth.replace(" ", "-")}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Invoice downloaded!");
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: T.bg, color: T.text }}>
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-xl font-black" style={{ color: T.text }}>Earnings & Invoice</h1>
        <p className="text-xs mt-0.5" style={{ color: T.sub }}>Track your income and generate invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="px-4 sm:px-6 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Earned",    value: `₹${totalEarned.toLocaleString("en-IN")}`,     color: clrGreen, icon: TrendingUp },
          { label: "Withdrawn",       value: `₹${totalWithdrawn.toLocaleString("en-IN")}`,  color: clrBlue,  icon: ArrowDownToLine },
          { label: "Available",       value: `₹${Number(pendingBal).toLocaleString("en-IN")}`, color: isDark ? "#818cf8" : "#4f46e5", icon: Wallet },
          { label: "On Hold",         value: `₹${Number(holdBal).toLocaleString("en-IN")}`, color: clrAmber, icon: Clock },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4" style={card}>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${s.color}18` }}>
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: T.sub }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="px-4 sm:px-6 mb-5">
        <div className="rounded-2xl p-4" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: T.text }}>Monthly Earnings</h3>
            <div className="flex gap-1 rounded-lg p-0.5" style={{ background: T.input }}>
              {(["area", "bar"] as const).map(t => (
                <button key={t} onClick={() => setChartType(t)} className="rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all" style={{ background: chartType === t ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent", color: chartType === t ? "#fff" : T.sub }}>
                  {t === "area" ? "Area" : "Bar"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            {chartType === "area" ? (
              <AreaChart data={MOCK_MONTHLY}>
                <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fill: T.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.axis, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip contentStyle={T.tip} formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Earned"]} />
                <Area type="monotone" dataKey="earned" stroke="#6366f1" strokeWidth={2} fill="url(#eg)" />
              </AreaChart>
            ) : (
              <BarChart data={MOCK_MONTHLY}>
                <XAxis dataKey="month" tick={{ fill: T.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.axis, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip contentStyle={T.tip} formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Earned"]} />
                <Bar dataKey="earned" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoice Generator */}
      <div className="px-4 sm:px-6 mb-5">
        <div className="rounded-2xl p-4" style={card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: T.text }}>Generate Invoice</h3>
              <p className="text-[10px]" style={{ color: T.sub }}>Download a text invoice for your records</p>
            </div>
            <FileText className="h-5 w-5" style={{ color: "#6366f1" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: T.sub }}>Your Name</label>
              <input value={invoiceName} onChange={e => setInvoiceName(e.target.value)} className="w-full rounded-xl px-3 py-2 text-xs outline-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: T.sub }}>Month</label>
              <input value={invoiceMonth} onChange={e => setInvoiceMonth(e.target.value)} className="w-full rounded-xl px-3 py-2 text-xs outline-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: T.sub }}>GSTIN (optional)</label>
              <input value={invoiceGstin} onChange={e => setInvoiceGstin(e.target.value)} placeholder="27XXXXX..." className="w-full rounded-xl px-3 py-2 text-xs outline-none" style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
            </div>
          </div>
          <button onClick={handleDownloadInvoice} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,.35)" }}>
            <Download className="h-4 w-4" /> Download Invoice
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="px-4 sm:px-6">
        <h3 className="text-sm font-bold mb-3" style={{ color: T.text }}>Transaction History</h3>
        <div className="rounded-2xl overflow-hidden" style={card}>
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : (
            displayTxns.map((t: any, i: number) => (
              <div key={t.id ?? i} className="flex items-center justify-between px-4 py-3.5 transition-all" style={{ borderBottom: i < displayTxns.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.type === "credit" ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)" }}>
                    {t.type === "credit" ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <ArrowDownToLine className="h-4 w-4 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: T.text }}>{t.desc ?? t.description ?? (t.type === "credit" ? "Payment Received" : "Withdrawal")}</p>
                    <p className="text-[10px]" style={{ color: T.sub }}>{t.date ?? new Date(t.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
                <span className="text-sm font-black" style={{ color: t.type === "credit" ? clrGreen : clrRed }}>
                  {t.type === "credit" ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
