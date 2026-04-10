import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, Search, IndianRupee, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { format, startOfYear, endOfYear } from "date-fns";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";
const TDS_RATE = 0.10;
const TDS_THRESHOLD = 30000;
const PAGE_SIZE = 12;

const AdminTdsManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  const { data: freelancerEarnings = [], isLoading } = useQuery({
    queryKey: ["admin-tds", year],
    queryFn: async () => {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const { data: txns } = await supabase
        .from("wallet_transactions")
        .select("user_id,amount,created_at")
        .gte("created_at", start)
        .lte("created_at", end + "T23:59:59")
        .eq("transaction_type", "earning")
        .limit(5000);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id,full_name,user_code,email,pan_number")
        .eq("user_type", "employee")
        .limit(1000);

      const earningsMap: Record<string, number> = {};
      (txns || []).forEach((t: any) => {
        earningsMap[t.user_id] = (earningsMap[t.user_id] || 0) + Number(t.amount || 0);
      });

      return (profiles || []).map((p: any) => {
        const gross = earningsMap[p.user_id] || 0;
        const tdsApplicable = gross >= TDS_THRESHOLD;
        const tdsAmount = tdsApplicable ? gross * TDS_RATE : 0;
        const netPay = gross - tdsAmount;
        return { ...p, gross, tdsAmount, netPay, tdsApplicable };
      }).sort((a: any, b: any) => b.gross - a.gross);
    },
  });

  const filtered = freelancerEarnings.filter((f: any) => {
    const q = search.toLowerCase();
    const name = (f.full_name || []).join(" ").toLowerCase();
    const code = (f.user_code || []).join("").toLowerCase();
    const mq = !q || name.includes(q) || code.includes(q);
    const mf = filter === "all" || (filter === "applicable" ? f.tdsApplicable : !f.tdsApplicable);
    return mq && mf;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalGross = filtered.reduce((s: number, f: any) => s + f.gross, 0);
  const totalTds = filtered.reduce((s: number, f: any) => s + f.tdsAmount, 0);
  const tdsApplicableCount = filtered.filter((f: any) => f.tdsApplicable).length;

  const generateForm16A = (f: any) => {
    const html = `<!DOCTYPE html><html><head><title>Form 16A - TDS Certificate</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:30px auto;color:#1e293b;font-size:13px}.header{text-align:center;border-bottom:2px solid #6366f1;padding-bottom:16px;margin-bottom:20px}h1{font-size:18px;color:#6366f1;margin:0}h2{font-size:14px;color:#64748b;margin:4px 0}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:8px 12px;text-align:left;border:1px solid #e2e8f0}th{background:#f1f5f9;font-weight:700;font-size:12px}tfoot td{font-weight:700;background:#f8faff}.footer{margin-top:30px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}</style></head><body><div class="header"><h1>FORM 16A</h1><h2>Certificate of Tax Deducted at Source</h2><p>Under Section 203 of the Income Tax Act, 1961</p></div><table><tr><th colspan="2">Deductor Details</th></tr><tr><td>Name</td><td>FreeLan Space Technologies Pvt Ltd</td></tr><tr><td>GSTIN</td><td>32AAAAA0000A1Z5</td></tr><tr><td>Address</td><td>Kerala, India</td></tr><tr><td>Financial Year</td><td>${year}-${parseInt(year)+1}</td></tr></table><table><tr><th colspan="2">Deductee Details</th></tr><tr><td>Name</td><td>${(f.full_name||[]).join(" ")||"Freelancer"}</td></tr><tr><td>User Code</td><td>${(f.user_code||[]).join("")||"—"}</td></tr><tr><td>Email</td><td>${f.email||"—"}</td></tr><tr><td>PAN</td><td>${f.pan_number||"PENDING"}</td></tr></table><table><tr><th>Description</th><th>Amount (₹)</th></tr><tr><td>Total Earnings (Gross)</td><td>₹${f.gross.toLocaleString("en-IN",{maximumFractionDigits:2})}</td></tr><tr><td>TDS Rate</td><td>${TDS_RATE*100}%</td></tr><tfoot><tr><td>TDS Deducted</td><td>₹${f.tdsAmount.toLocaleString("en-IN",{maximumFractionDigits:2})}</td></tr><tr><td>Net Amount Paid</td><td>₹${f.netPay.toLocaleString("en-IN",{maximumFractionDigits:2})}</td></tr></tfoot></table><div class="footer"><p>This is a computer-generated certificate and does not require a signature.</p><p>Generated on: ${format(new Date(),"dd MMM yyyy")} | FreeLan.space — India's Freelancer Platform</p></div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Form16A_${(f.full_name||[]).join("_")}_${year}.html`;
    a.click();
    toast.success("Form 16A downloaded");
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "User Code", "Email", "PAN", "Gross Earnings", "TDS @10%", "Net Pay", "TDS Applicable"],
      ...filtered.map((f: any) => [
        (f.full_name || []).join(" "), (f.user_code || []).join(""), f.email || "", f.pan_number || "N/A",
        f.gross.toFixed(2), f.tdsAmount.toFixed(2), f.netPay.toFixed(2), f.tdsApplicable ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `TDS_Report_${year}.csv`;
    a.click();
    toast.success("TDS report exported");
  };

  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1050, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>TDS Management</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Income Tax TDS @10% on earnings above ₹{TDS_THRESHOLD.toLocaleString("en-IN")} · Financial Year {year}-{parseInt(year)+1}</p>
        </div>
        <button onClick={exportCSV} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Download size={14} /> Export TDS Report
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { l: "Total Freelancers", v: filtered.length, c: "#6366f1" },
          { l: "TDS Applicable", v: tdsApplicableCount, c: "#fbbf24" },
          { l: "Total Gross (₹)", v: `₹${(totalGross / 100000).toFixed(1)}L`, c: "#4ade80" },
          { l: "Total TDS Deducted", v: `₹${totalTds.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, c: "#f87171" },
        ].map(s => (
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: `${A1}08`, border: `1px solid ${A1}22`, borderRadius: 10, padding: "12px 18px", marginBottom: 20, fontSize: 12, color: T.sub }}>
        📋 <strong style={{ color: T.text }}>India TDS Rules:</strong> Section 194C/194J — 10% TDS on payments above ₹30,000/year to freelancers. PAN mandatory for TDS certificate. Without PAN, TDS rate is 20%.
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", flex: 1, minWidth: 160 }}>
            <Search size={13} color={T.sub} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search freelancers..." style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1 }} />
          </div>
          <select value={year} onChange={e => { setYear(e.target.value); setPage(1); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 12px", fontSize: 13 }}>
            {years.map(y => <option key={y} value={y}>FY {y}-{parseInt(y) + 1}</option>)}
          </select>
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 12px", fontSize: 13 }}>
            <option value="all">All Freelancers</option>
            <option value="applicable">TDS Applicable</option>
            <option value="below">Below Threshold</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Freelancer", "PAN", "Gross Earnings", "TDS @10%", "Net Pay", "Status", "Form 16A"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: T.sub }}>Loading...</td></tr>}
              {!isLoading && paginated.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: T.sub }}>No freelancers found</td></tr>}
              {paginated.map((f: any) => (
                <tr key={f.user_id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{(f.full_name || []).join(" ") || "User"}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{(f.user_code || []).join("") || "—"}</div>
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: f.pan_number ? T.text : "#f87171", fontWeight: 600 }}>{f.pan_number || "NOT ADDED"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: T.text, fontWeight: 600 }}>₹{f.gross.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: f.tdsApplicable ? "#f87171" : T.sub, fontWeight: f.tdsApplicable ? 700 : 400 }}>
                    {f.tdsApplicable ? `₹${f.tdsAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#4ade80", fontWeight: 700 }}>₹{f.netPay.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={bs(f.tdsApplicable ? "#fbbf24" : "#4ade80", f.tdsApplicable ? "rgba(251,191,36,.12)" : "rgba(74,222,128,.12)")}>
                      {f.tdsApplicable ? "TDS Applicable" : "Below Limit"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {f.tdsApplicable ? (
                      <button onClick={() => generateForm16A(f)} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: A1, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                        <Download size={11} /> Form 16A
                      </button>
                    ) : <span style={{ fontSize: 11, color: T.sub }}>N/A</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} freelancers</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12 }}><ChevronLeft size={13} /></button>
              <span style={{ padding: "5px 10px", fontSize: 12, color: T.sub }}>{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12 }}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTdsManagement;
