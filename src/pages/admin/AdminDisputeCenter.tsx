import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, Search, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, Eye, Plus, Download, RefreshCw, X, MessageSquare, FileText, User, Briefcase, IndianRupee } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", bg:"#070714" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", bg:"#f0f4ff" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", bg:"#f0f4ff" },
};

const A1 = "#6366f1";
const DISP_KEY = "admin_disputes_v2";

type Dispute = {
  id: string;
  projectId: string;
  projectTitle: string;
  freelancerName: string;
  employerName: string;
  amount: number;
  reason: string;
  status: "open" | "under_review" | "resolved_freelancer" | "resolved_employer" | "closed";
  createdAt: string;
  resolvedAt?: string;
  notes: string;
  timeline: { time: string; action: string; by: string }[];
};

type Project = { id: string; name: string; amount: number; client_id: string; assigned_employee_id: string | null };
type Profile = { id: string; full_name: string[]; email: string };

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open:                { label:"Open",               color:"#f87171", bg:"rgba(248,113,113,.12)" },
  under_review:        { label:"Under Review",       color:"#fbbf24", bg:"rgba(251,191,36,.12)" },
  resolved_freelancer: { label:"Resolved (Freelancer)", color:"#4ade80", bg:"rgba(74,222,128,.12)" },
  resolved_employer:   { label:"Resolved (Employer)",   color:"#60a5fa", bg:"rgba(96,165,250,.12)" },
  closed:              { label:"Closed",             color:"#94a3b8", bg:"rgba(148,163,184,.12)" },
};

const PAGE_SIZE = 8;

function loadDisputes(): Dispute[] {
  try { const d = localStorage.getItem(DISP_KEY); if (d) return JSON.parse(d); } catch {}
  return [];
}
function saveDisputes(d: Dispute[]) { localStorage.setItem(DISP_KEY, JSON.stringify(d)); }

const AdminDisputeCenter = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];

  const [disputes, setDisputes] = useState<Dispute[]>(loadDisputes);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [notes, setNotes] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [newDispute, setNewDispute] = useState({ projectId: "", reason: "", amount: "" });

  const fetchRealData = async () => {
    setLoadingProjects(true);
    const [{ data: proj }, { data: prof }] = await Promise.all([
      supabase.from("projects").select("id, name, amount, client_id, assigned_employee_id").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id, full_name, email").limit(500),
    ]);
    setProjects(proj || []);
    setProfiles(prof || []);
    setLoadingProjects(false);
  };

  useEffect(() => { fetchRealData(); }, []);

  const getProfileName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find(pr => pr.id === id);
    return p?.full_name?.[0] || p?.email || "Unknown";
  };

  const filtered = disputes.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !q || d.projectTitle.toLowerCase().includes(q) || d.freelancerName.toLowerCase().includes(q) || d.employerName.toLowerCase().includes(q) || d.reason.toLowerCase().includes(q);
    const matchF = filter === "all" || d.status === filter;
    return matchQ && matchF;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateAndSave = (updated: Dispute[]) => { setDisputes(updated); saveDisputes(updated); };

  const resolveDispute = (id: string, status: Dispute["status"]) => {
    const updated = disputes.map(d => d.id === id ? {
      ...d, status,
      resolvedAt: status !== "under_review" ? new Date().toISOString() : d.resolvedAt,
      notes: notes || d.notes,
      timeline: [...(d.timeline || []), { time: new Date().toISOString(), action: STATUS_META[status]?.label || status, by: "Admin" }],
    } : d);
    updateAndSave(updated);
    setSelected(null); setNotes("");
    toast.success("Dispute status updated");
  };

  const createDispute = () => {
    if (!newDispute.projectId || !newDispute.reason) { toast.error("Project and reason required"); return; }
    const proj = projects.find(p => p.id === newDispute.projectId);
    if (!proj) { toast.error("Project not found"); return; }
    const d: Dispute = {
      id: crypto.randomUUID(),
      projectId: proj.id,
      projectTitle: proj.name,
      freelancerName: getProfileName(proj.assigned_employee_id),
      employerName: getProfileName(proj.client_id),
      amount: newDispute.amount ? Number(newDispute.amount) : proj.amount,
      reason: newDispute.reason,
      status: "open",
      createdAt: new Date().toISOString(),
      notes: "",
      timeline: [{ time: new Date().toISOString(), action: "Dispute Opened", by: "Admin" }],
    };
    updateAndSave([d, ...disputes]);
    setShowCreate(false);
    setNewDispute({ projectId: "", reason: "", amount: "" });
    toast.success("Dispute created");
  };

  const exportCSV = () => {
    const headers = ["ID","Project","Freelancer","Employer","Amount","Reason","Status","Opened","Resolved"];
    const rows = disputes.map(d => [d.id, d.projectTitle, d.freelancerName, d.employerName, d.amount, d.reason, STATUS_META[d.status]?.label || d.status, safeFmt(d.createdAt, "dd MMM yyyy"), d.resolvedAt ? safeFmt(d.resolvedAt, "dd MMM yyyy") : ""]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `disputes_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const sm = (status: string) => STATUS_META[status] || STATUS_META.closed;
  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 });

  const counts = {
    open: disputes.filter(d => d.status === "open").length,
    under_review: disputes.filter(d => d.status === "under_review").length,
    resolved: disputes.filter(d => d.status.startsWith("resolved")).length,
    closed: disputes.filter(d => d.status === "closed").length,
  };
  const totalAmount = disputes.filter(d => d.status === "open" || d.status === "under_review").reduce((s, d) => s + d.amount, 0);

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Dispute Resolution Center</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Mediate disputes between freelancers and employers</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchRealData} style={{ display: "flex", alignItems: "center", gap: 5, background: T.card, border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 14px", cursor: "pointer", color: T.sub, fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 5, background: T.card, border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 14px", cursor: "pointer", color: T.text, fontSize: 12 }}>
            <Download size={13} style={{ color: A1 }} /> Export CSV
          </button>
          <button onClick={() => { fetchRealData(); setShowCreate(true); }} style={{ display: "flex", alignItems: "center", gap: 5, background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700 }}>
            <Plus size={13} /> New Dispute
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Open", value: counts.open, color: "#f87171" },
          { label: "Under Review", value: counts.under_review, color: "#fbbf24" },
          { label: "Resolved", value: counts.resolved, color: "#4ade80" },
          { label: "Closed", value: counts.closed, color: "#94a3b8" },
          { label: "Amount at Risk", value: `₹${totalAmount.toLocaleString("en-IN")}`, color: A1 },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: s.label === "Amount at Risk" ? 16 : 26, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create Dispute */}
      {showCreate && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Create New Dispute</h3>
            <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={18} /></button>
          </div>
          {loadingProjects ? (
            <div style={{ color: T.sub, fontSize: 13, padding: "8px 0" }}>Loading projects…</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>PROJECT *</label>
                <select value={newDispute.projectId} onChange={e => setNewDispute(d => ({ ...d, projectId: e.target.value }))} style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "9px 12px", fontSize: 13 }}>
                  <option value="">— Select Project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.amount.toLocaleString("en-IN")})</option>)}
                </select>
                {newDispute.projectId && (() => {
                  const proj = projects.find(p => p.id === newDispute.projectId);
                  if (!proj) return null;
                  return (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: `${A1}10`, border: `1px solid ${A1}25`, borderRadius: 8, fontSize: 12, color: T.sub, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span><User size={11} style={{ display: "inline", marginRight: 4 }} /><strong style={{ color: T.text }}>Employer:</strong> {getProfileName(proj.client_id)}</span>
                      <span><Briefcase size={11} style={{ display: "inline", marginRight: 4 }} /><strong style={{ color: T.text }}>Freelancer:</strong> {getProfileName(proj.assigned_employee_id)}</span>
                      <span><IndianRupee size={11} style={{ display: "inline", marginRight: 4 }} /><strong style={{ color: T.text }}>Amount:</strong> ₹{proj.amount.toLocaleString("en-IN")}</span>
                    </div>
                  );
                })()}
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>DISPUTED AMOUNT (₹)</label>
                <input type="number" value={newDispute.amount} onChange={e => setNewDispute(d => ({ ...d, amount: e.target.value }))} placeholder="Leave blank to use project amount" style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "9px 12px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>REASON *</label>
                <input value={newDispute.reason} onChange={e => setNewDispute(d => ({ ...d, reason: e.target.value }))} placeholder="Describe the dispute reason" style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "9px 12px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={createDispute} style={{ padding: "8px 20px", borderRadius: 9, background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Create Dispute</button>
                <button onClick={() => setShowCreate(false)} style={{ padding: "8px 14px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", flex: 1, minWidth: 180 }}>
            <Search size={13} color={T.sub} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by project, freelancer, employer, reason…" style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1 }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub, padding: 0, display: "flex" }}><X size={12} /></button>}
          </div>
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 12px", fontSize: 13 }}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved_freelancer">Resolved (Freelancer)</option>
            <option value="resolved_employer">Resolved (Employer)</option>
            <option value="closed">Closed</option>
          </select>
          <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} disputes</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Project", "Freelancer", "Employer", "Amount", "Reason", "Status", "Opened", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: T.sub }}>
                  <ShieldAlert size={32} style={{ margin: "0 auto 8px", opacity: 0.3, display: "block" }} />
                  {disputes.length === 0 ? "No disputes yet. Use \"New Dispute\" to create one." : "No disputes match your search."}
                </td></tr>
              )}
              {paginated.map(d => (
                <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: T.text, fontWeight: 600, maxWidth: 160 }}>
                    <span title={d.projectTitle} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{d.projectTitle}</span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: T.sub }}>{d.freelancerName}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: T.sub }}>{d.employerName}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: T.text, fontWeight: 700 }}>₹{d.amount.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: T.sub, maxWidth: 160 }}>
                    <span title={d.reason} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{d.reason}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}><span style={bs(sm(d.status).color, sm(d.status).bg)}>{sm(d.status).label}</span></td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: T.sub, whiteSpace: "nowrap" }}>{safeFmt(d.createdAt, "dd MMM yyyy")}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={() => { setSelected(d); setNotes(d.notes); }} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: A1, fontSize: 12, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} total</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12, opacity: page <= 1 ? 0.4 : 1 }}><ChevronLeft size={13} /></button>
              <span style={{ padding: "5px 10px", fontSize: 12, color: T.sub }}>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12, opacity: page >= totalPages ? 0.4 : 1 }}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 18, padding: 28, maxWidth: 560, width: "100%", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>Dispute Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><XCircle size={20} /></button>
            </div>

            {/* Status Badge */}
            <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={bs(sm(selected.status).color, sm(selected.status).bg)}>{sm(selected.status).label}</span>
              <span style={{ fontSize: 12, color: T.sub }}>Opened {safeFmt(selected.createdAt, "dd MMM yyyy")}</span>
            </div>

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 18 }}>
              {[
                ["Project", selected.projectTitle],
                ["Amount", `₹${selected.amount.toLocaleString("en-IN")}`],
                ["Freelancer", selected.freelancerName],
                ["Employer", selected.employerName],
                ["Reason", selected.reason],
                ...(selected.resolvedAt ? [["Resolved", safeFmt(selected.resolvedAt, "dd MMM yyyy")]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ gridColumn: k === "Reason" ? "1/-1" : undefined }}>
                  <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            {selected.timeline && selected.timeline.length > 0 && (
              <div style={{ marginBottom: 18, background: `${A1}08`, border: `1px solid ${A1}20`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Timeline</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.timeline.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: A1, marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{t.action}</span>
                        <span style={{ fontSize: 11, color: T.sub, marginLeft: 6 }}>by {t.by} · {safeFmt(t.time, "dd MMM, HH:mm")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 6, fontWeight: 600 }}>Admin Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add resolution notes, evidence reviewed, decision made…" style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selected.status !== "under_review" && (
                <button onClick={() => resolveDispute(selected.id, "under_review")} style={{ flex: 1, background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.3)", borderRadius: 8, padding: "9px 14px", cursor: "pointer", color: "#fbbf24", fontWeight: 700, fontSize: 12, minWidth: 120 }}>
                  <Clock size={12} style={{ display: "inline", marginRight: 4 }} />Under Review
                </button>
              )}
              {!selected.status.startsWith("resolved") && selected.status !== "closed" && (
                <>
                  <button onClick={() => resolveDispute(selected.id, "resolved_freelancer")} style={{ flex: 1, background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)", borderRadius: 8, padding: "9px 14px", cursor: "pointer", color: "#4ade80", fontWeight: 700, fontSize: 12, minWidth: 120 }}>
                    <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />Favour Freelancer
                  </button>
                  <button onClick={() => resolveDispute(selected.id, "resolved_employer")} style={{ flex: 1, background: "rgba(96,165,250,.12)", border: "1px solid rgba(96,165,250,.3)", borderRadius: 8, padding: "9px 14px", cursor: "pointer", color: "#60a5fa", fontWeight: 700, fontSize: 12, minWidth: 120 }}>
                    <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />Favour Employer
                  </button>
                  <button onClick={() => resolveDispute(selected.id, "closed")} style={{ flex: 1, background: "rgba(148,163,184,.12)", border: "1px solid rgba(148,163,184,.3)", borderRadius: 8, padding: "9px 14px", cursor: "pointer", color: "#94a3b8", fontWeight: 700, fontSize: 12, minWidth: 80 }}>
                    <XCircle size={12} style={{ display: "inline", marginRight: 4 }} />Close
                  </button>
                </>
              )}
              {(selected.status.startsWith("resolved") || selected.status === "closed") && (
                <button onClick={() => resolveDispute(selected.id, "open")} style={{ flex: 1, background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 8, padding: "9px 14px", cursor: "pointer", color: "#f87171", fontWeight: 700, fontSize: 12 }}>
                  Reopen Dispute
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputeCenter;
