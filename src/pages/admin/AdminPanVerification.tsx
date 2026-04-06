import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Search, CheckCircle2, XCircle, Eye, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const PAGE_SIZE = 12;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const AdminPanVerification = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"pan" | "gst">("pan");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [comment, setComment] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-pan-verify", tab],
    queryFn: async () => {
      const field = tab === "pan" ? "pan_number" : "gst_number";
      const statusField = tab === "pan" ? "pan_verification_status" : "gst_verification_status";
      const { data } = await supabase
        .from("profiles")
        .select(`user_id,full_name,user_code,email,user_type,${field},${statusField},pan_admin_notes,gst_admin_notes,created_at`)
        .not(field, "is", null)
        .order("created_at", { ascending: false })
        .limit(300);
      return (data || []).map((u: any) => ({
        ...u,
        docValue: u[field],
        status: u[statusField] || "pending",
        adminNotes: tab === "pan" ? u.pan_admin_notes : u.gst_admin_notes,
        isValid: tab === "pan" ? PAN_REGEX.test(u[field] || "") : (u[field] || "").length >= 15,
      }));
    },
  });

  const filtered = users.filter((u: any) => {
    const q = search.toLowerCase();
    const name = (u.full_name || []).join(" ").toLowerCase();
    const code = (u.user_code || []).join("").toLowerCase();
    const mq = !q || name.includes(q) || code.includes(q) || (u.docValue || "").toLowerCase().includes(q);
    const mf = filter === "all" || u.status === filter;
    return mq && mf;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = { pending: users.filter((u: any) => u.status === "pending").length, verified: users.filter((u: any) => u.status === "verified").length, rejected: users.filter((u: any) => u.status === "rejected").length };

  const updateStatus = async (userId: string, status: string) => {
    const statusField = tab === "pan" ? "pan_verification_status" : "gst_verification_status";
    const notesField = tab === "pan" ? "pan_admin_notes" : "gst_admin_notes";
    const { error } = await supabase.from("profiles").update({ [statusField]: status, [notesField]: comment || null }).eq("user_id", userId);
    if (error) return toast.error("Update failed");
    toast.success(`${tab.toUpperCase()} ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-pan-verify"] });
    setSelected(null); setComment("");
  };

  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });
  const statusStyle = (s: string) => { const m: Record<string, any> = { pending: { c: "#fbbf24", bg: "rgba(251,191,36,.12)" }, verified: { c: "#4ade80", bg: "rgba(74,222,128,.12)" }, rejected: { c: "#f87171", bg: "rgba(248,113,113,.12)" } }; return bs(m[s]?.c || "#94a3b8", m[s]?.bg || "rgba(148,163,184,.12)"); };

  return (
    <div style={{ padding: "24px 16px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>PAN & GST Verification</h1>
        <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Verify PAN cards and GST certificates for income tax compliance</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[{ l: "Pending", v: counts.pending, c: "#fbbf24", f: "pending" }, { l: "Verified", v: counts.verified, c: "#4ade80", f: "verified" }, { l: "Rejected", v: counts.rejected, c: "#f87171", f: "rejected" }].map(s => (
          <div key={s.l} onClick={() => { setFilter(s.f); setPage(1); }} style={{ background: T.card, border: `2px solid ${filter === s.f ? s.c : T.border}`, borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontWeight: 800, fontSize: 26, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
        {([["pan", "PAN Card", CreditCard], ["gst", "GST Certificate", Building2]] as any[]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => { setTab(key); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", border: "none", cursor: "pointer", background: tab === key ? A1 : "transparent", color: tab === key ? "#fff" : T.sub, fontWeight: tab === key ? 700 : 500, fontSize: 13 }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", flex: 1, minWidth: 160 }}>
            <Search size={13} color={T.sub} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or number..." style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1 }} />
          </div>
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 12px", fontSize: 13 }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["User", "Type", tab === "pan" ? "PAN Number" : "GSTIN", "Format Valid", "Status", "Submitted", "Action"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: T.sub }}>Loading...</td></tr>}
              {!isLoading && paginated.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: T.sub }}>No records found</td></tr>}
              {paginated.map((u: any) => (
                <tr key={u.user_id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{(u.full_name || []).join(" ") || "User"}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{(u.user_code || []).join("") || "—"}</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}><span style={bs(u.user_type === "employee" ? "#6366f1" : "#f59e0b", u.user_type === "employee" ? "rgba(99,102,241,.12)" : "rgba(245,158,11,.12)")}>{u.user_type === "employee" ? "Freelancer" : "Employer"}</span></td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: 1 }}>{u.docValue || "—"}</td>
                  <td style={{ padding: "10px 14px" }}><span style={bs(u.isValid ? "#4ade80" : "#f87171", u.isValid ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)")}>{u.isValid ? "✓ Valid" : "✗ Invalid"}</span></td>
                  <td style={{ padding: "10px 14px" }}><span style={statusStyle(u.status)}>{u.status}</span></td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: T.sub }}>{safeFmt(u.created_at, "dd MMM yyyy")}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <button onClick={() => { setSelected(u); setComment(u.adminNotes || ""); }} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: A1, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                      <Eye size={12} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} records</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12 }}><ChevronLeft size={13} /></button>
              <span style={{ padding: "5px 10px", fontSize: 12, color: T.sub }}>{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12 }}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>{tab.toUpperCase()} Verification</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><XCircle size={20} /></button>
            </div>
            {[["Name", (selected.full_name || []).join(" ") || "User"], ["User Code", (selected.user_code || []).join("") || "—"], [tab === "pan" ? "PAN Number" : "GSTIN", selected.docValue || "—"], ["Format", selected.isValid ? "✓ Valid format" : "✗ Invalid format"], ["Current Status", selected.status]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.sub, width: 110, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 6 }}>Admin Notes</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, resize: "vertical", boxSizing: "border-box" as any }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setSelected(null)} style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", cursor: "pointer", color: T.text, fontWeight: 600 }}>Cancel</button>
              <button onClick={() => updateStatus(selected.user_id, "rejected")} style={{ flex: 1, background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#f87171", fontWeight: 700 }}>Reject</button>
              <button onClick={() => updateStatus(selected.user_id, "verified")} style={{ flex: 2, background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#000", fontWeight: 700 }}>Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanVerification;
