import { useState, useMemo } from "react";
import { ClipboardList, Search, Download, Trash2, Filter, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAudit, AuditEntry } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { format, parseISO } from "date-fns";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const CATEGORIES = ["All", "Authentication", "Security", "User Management", "Financial", "System", "Content", "General"] as const;
const STATUSES = ["All", "success", "warning", "critical"] as const;

const statusConfig = {
  success: { icon: CheckCircle2, color: "#4ade80", bg: "rgba(74,222,128,.12)", label: "Success" },
  warning: { icon: AlertTriangle, color: "#fbbf24", bg: "rgba(251,191,36,.12)", label: "Warning" },
  critical: { icon: ShieldAlert, color: "#f87171", bg: "rgba(248,113,113,.12)", label: "Critical" },
};

function downloadCSV(logs: AuditEntry[]) {
  const header = "Timestamp,User,Category,Action,Details,Status\n";
  const rows = logs.map(l =>
    `"${l.timestamp}","${l.user}","${l.category}","${l.action}","${l.details}","${l.status}"`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "audit-logs.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAuditLogs() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { getLogs, clearLogs, logAction } = useAdminAudit();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<typeof CATEGORIES[number]>("All");
  const [statusFilter, setStatusFilter] = useState<typeof STATUSES[number]>("All");
  const [confirmClear, setConfirmClear] = useState(false);
  const [, forceRefresh] = useState(0);

  const logs = useMemo(() => getLogs(), [forceRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => logs.filter(l => {
    const matchSearch = !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || l.category === catFilter;
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  }), [logs, search, catFilter, statusFilter]);

  const handleClear = () => {
    clearLogs();
    logAction("Audit Log Cleared", "All audit log entries were deleted by admin", "Security", "warning");
    setConfirmClear(false);
    forceRefresh(n => n + 1);
  };

  const criticalCount = logs.filter(l => l.status === "critical").length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22 0%,${A2}15 100%)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "28px 28px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${A2}18 0%,transparent 70%)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <ClipboardList size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: -0.5 }}>Activity Audit Log</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Complete record of all admin actions and system events</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { forceRefresh(n => n + 1); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => downloadCSV(filtered)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          {[
            { label: "Total Entries", value: logs.length, color: T.badgeFg },
            { label: "Critical Events", value: criticalCount, color: "#f87171" },
            { label: "Warnings", value: logs.filter(l => l.status === "warning").length, color: "#fbbf24" },
            { label: "Shown", value: filtered.length, color: "#4ade80" },
          ].map(stat => (
            <div key={stat.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</span>
              <span style={{ fontSize: 11, color: T.sub, fontWeight: 500 }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.sub }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, users, details…"
            style={{ paddingLeft: 32, background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${catFilter === cat ? A1 : T.border}`, background: catFilter === cat ? `${A1}22` : T.card, color: catFilter === cat ? T.badgeFg : T.sub, transition: "all .15s" }}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${statusFilter === s ? (s === "critical" ? "#f87171" : s === "warning" ? "#fbbf24" : s === "success" ? "#4ade80" : A1) : T.border}`, background: statusFilter === s ? (s === "critical" ? "rgba(248,113,113,.12)" : s === "warning" ? "rgba(251,191,36,.12)" : s === "success" ? "rgba(74,222,128,.12)" : `${A1}22`) : T.card, color: statusFilter === s ? (s === "critical" ? "#f87171" : s === "warning" ? "#fbbf24" : s === "success" ? "#4ade80" : T.badgeFg) : T.sub, transition: "all .15s", textTransform: "capitalize" }}>
              {s === "All" ? <Filter size={11} style={{ display: "inline", marginRight: 3 }} /> : null}{s}
            </button>
          ))}
        </div>
        <button onClick={() => setConfirmClear(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {/* Log entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: T.sub }}>
            <ClipboardList size={40} style={{ opacity: .2, marginBottom: 12 }} />
            <p style={{ fontWeight: 600 }}>No log entries found</p>
          </div>
        ) : filtered.map(entry => {
          const sc = statusConfig[entry.status];
          const Icon = sc.icon;
          return (
            <div key={entry.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Icon size={15} color={sc.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{entry.action}</span>
                  <Badge style={{ background: TH.black.badge, color: T.badgeFg, fontSize: 10, fontWeight: 600, padding: "1px 7px", border: "none" }}>{entry.category}</Badge>
                  <span style={{ fontSize: 10, color: sc.color, fontWeight: 700, background: sc.bg, padding: "1px 7px", borderRadius: 5, textTransform: "uppercase" }}>{entry.status}</span>
                </div>
                <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.5 }}>{entry.details}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{format(parseISO(entry.timestamp), "MMM d, HH:mm:ss")}</p>
                <p style={{ fontSize: 10, color: T.sub, margin: "2px 0 0", opacity: .7 }}>{entry.user}</p>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmActionDialog
        open={confirmClear} onOpenChange={setConfirmClear} onConfirm={handleClear}
        title="Clear All Audit Logs" description="This will permanently delete all audit log entries. This action cannot be undone."
        confirmLabel="Clear All" variant="danger" mode="type" typeToConfirm="CLEAR" />
    </div>
  );
}
