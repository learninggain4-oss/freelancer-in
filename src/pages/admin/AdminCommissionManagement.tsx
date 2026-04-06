import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IndianRupee, Percent, TrendingUp, Edit2, Save, X, RefreshCw, BarChart3, Layers } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const A1 = "#6366f1", A2 = "#8b5cf6";

const COMM_KEY = "admin_commission_rates_v1";
type CommRule = { id: string; category: string; rate: number; minAmount: number; maxCap: number; active: boolean };

function loadRules(): CommRule[] {
  try { const d = localStorage.getItem(COMM_KEY); if (d) return JSON.parse(d); } catch {}
  const seed: CommRule[] = [
    { id:"cr1", category:"Web Development",     rate:10, minAmount:500,  maxCap:5000, active:true },
    { id:"cr2", category:"Mobile App",          rate:10, minAmount:500,  maxCap:5000, active:true },
    { id:"cr3", category:"UI/UX Design",        rate:12, minAmount:300,  maxCap:3000, active:true },
    { id:"cr4", category:"Content Writing",     rate:15, minAmount:100,  maxCap:1000, active:true },
    { id:"cr5", category:"Digital Marketing",   rate:12, minAmount:200,  maxCap:2000, active:true },
    { id:"cr6", category:"Data Entry",          rate:18, minAmount:50,   maxCap:500,  active:true },
    { id:"cr7", category:"Video Editing",       rate:12, minAmount:300,  maxCap:3000, active:true },
    { id:"cr8", category:"Accounting",          rate:10, minAmount:500,  maxCap:4000, active:true },
    { id:"cr9", category:"Others",              rate:15, minAmount:100,  maxCap:2000, active:true },
  ];
  localStorage.setItem(COMM_KEY, JSON.stringify(seed));
  return seed;
}
function saveRules(rules: CommRule[]) { localStorage.setItem(COMM_KEY, JSON.stringify(rules)); }

const AdminCommissionManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [rules, setRules] = useState<CommRule[]>(loadRules);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editCap, setEditCap] = useState("");

  const { data: revenueStats } = useQuery({
    queryKey: ["admin-commission-stats"],
    queryFn: async () => {
      const { data: txns } = await supabase
        .from("wallet_transactions")
        .select("amount, transaction_type, created_at")
        .eq("transaction_type", "commission")
        .order("created_at", { ascending: false })
        .limit(500);
      const total = (txns || []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const today = new Date().toISOString().slice(0, 10);
      const todayAmt = (txns || []).filter((t: any) => t.created_at?.startsWith(today))
        .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const month = new Date().toISOString().slice(0, 7);
      const monthAmt = (txns || []).filter((t: any) => t.created_at?.startsWith(month))
        .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      return { total, todayAmt, monthAmt, count: (txns || []).length };
    },
  });

  const startEdit = (r: CommRule) => {
    setEditId(r.id); setEditRate(String(r.rate)); setEditMin(String(r.minAmount)); setEditCap(String(r.maxCap));
  };

  const saveEdit = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, rate: Number(editRate), minAmount: Number(editMin), maxCap: Number(editCap) } : r);
    setRules(updated); saveRules(updated); setEditId(null);
    toast.success("Commission rate updated");
  };

  const toggleActive = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setRules(updated); saveRules(updated);
  };

  const stats = [
    { label: "Total Commission Earned", value: `₹${(revenueStats?.total || 0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "#4ade80" },
    { label: "Today's Commission",      value: `₹${(revenueStats?.todayAmt || 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "#6366f1" },
    { label: "This Month",              value: `₹${(revenueStats?.monthAmt || 0).toLocaleString("en-IN")}`, icon: BarChart3, color: "#f59e0b" },
    { label: "Total Transactions",      value: String(revenueStats?.count || 0), icon: Layers, color: "#8b5cf6" },
  ];

  const cs = (c: string, bg = "rgba(0,0,0,.1)") => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700, display:"inline-block" });

  return (
    <div style={{ padding: "24px 16px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Commission & Revenue Management</h1>
        <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Set platform commission rates per job category and track revenue</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px", display:"flex", alignItems:"center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: T.text }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, display:"flex", alignItems:"center", gap: 8 }}>
            <Percent size={16} color={A1} /> Commission Rules
          </div>
          <span style={{ fontSize: 12, color: T.sub }}>{rules.filter(r => r.active).length} active categories</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Category","Rate (%)","Min Amount (₹)","Max Cap (₹)","Status","Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign:"left", fontSize: 11, fontWeight: 700, color: T.sub, textTransform:"uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: T.text }}>{r.category}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {editId === r.id
                      ? <input value={editRate} onChange={e => setEditRate(e.target.value)} style={{ width: 60, background: T.input, border: `1px solid ${A1}55`, borderRadius: 6, color: T.text, padding: "4px 8px", fontSize: 13 }} />
                      : <span style={cs(A1, `${A1}15`)}>{r.rate}%</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {editId === r.id
                      ? <input value={editMin} onChange={e => setEditMin(e.target.value)} style={{ width: 80, background: T.input, border: `1px solid ${A1}55`, borderRadius: 6, color: T.text, padding: "4px 8px", fontSize: 13 }} />
                      : <span style={{ color: T.text, fontSize: 13 }}>₹{r.minAmount}</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {editId === r.id
                      ? <input value={editCap} onChange={e => setEditCap(e.target.value)} style={{ width: 80, background: T.input, border: `1px solid ${A1}55`, borderRadius: 6, color: T.text, padding: "4px 8px", fontSize: 13 }} />
                      : <span style={{ color: T.text, fontSize: 13 }}>₹{r.maxCap}</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={cs(r.active ? "#4ade80" : "#f87171", r.active ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)")}>{r.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display:"flex", gap: 6 }}>
                      {editId === r.id ? (
                        <>
                          <button onClick={() => saveEdit(r.id)} style={{ background: "#4ade8022", border:"1px solid #4ade8044", borderRadius: 6, padding:"4px 8px", cursor:"pointer", color:"#4ade80", display:"flex", alignItems:"center", gap:3, fontSize:12 }}><Save size={12}/> Save</button>
                          <button onClick={() => setEditId(null)} style={{ background: "rgba(248,113,113,.12)", border:"1px solid rgba(248,113,113,.3)", borderRadius: 6, padding:"4px 8px", cursor:"pointer", color:"#f87171", display:"flex", alignItems:"center", gap:3, fontSize:12 }}><X size={12}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(r)} style={{ background: `${A1}15`, border:`1px solid ${A1}33`, borderRadius: 6, padding:"4px 8px", cursor:"pointer", color:A1, display:"flex", alignItems:"center", gap:3, fontSize:12 }}><Edit2 size={12}/> Edit</button>
                          <button onClick={() => toggleActive(r.id)} style={{ background: r.active ? "rgba(248,113,113,.1)" : "rgba(74,222,128,.1)", border:`1px solid ${r.active ? "rgba(248,113,113,.3)" : "rgba(74,222,128,.3)"}`, borderRadius: 6, padding:"4px 8px", cursor:"pointer", color: r.active ? "#f87171" : "#4ade80", fontSize:12 }}>{r.active ? "Disable" : "Enable"}</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCommissionManagement;
