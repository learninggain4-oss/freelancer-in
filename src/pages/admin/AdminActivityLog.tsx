import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, Search, Download, Filter, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";
import { format } from "date-fns";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const PAGE_SIZE = 15;

const ACTION_META: Record<string, { color: string; bg: string; icon: string }> = {
  approved: { color: "#4ade80", bg: "rgba(74,222,128,.12)", icon: "✓" },
  rejected: { color: "#f87171", bg: "rgba(248,113,113,.12)", icon: "✗" },
  deleted: { color: "#f87171", bg: "rgba(248,113,113,.12)", icon: "🗑" },
  created: { color: "#6366f1", bg: "rgba(99,102,241,.12)", icon: "+" },
  updated: { color: "#fbbf24", bg: "rgba(251,191,36,.12)", icon: "✏" },
  viewed: { color: "#94a3b8", bg: "rgba(148,163,184,.12)", icon: "👁" },
  login: { color: "#10b981", bg: "rgba(16,185,129,.12)", icon: "🔑" },
  logout: { color: "#94a3b8", bg: "rgba(148,163,184,.12)", icon: "🚪" },
  exported: { color: "#8b5cf6", bg: "rgba(139,92,246,.12)", icon: "⬇" },
  overrode: { color: "#f97316", bg: "rgba(249,115,22,.12)", icon: "⚡" },
};

const AdminActivityLog = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["admin-activity-log"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_audit_logs")
        .select("id,action,table_name,record_id,old_values,new_values,created_at,admin_id,profile:admin_id(full_name,user_code)")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  const { data: admins = [] } = useQuery({
    queryKey: ["admin-list-for-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id,full_name,user_code").eq("user_type", "admin").limit(50);
      return data || [];
    },
  });

  const filtered = auditLogs.filter((log: any) => {
    const q = search.toLowerCase();
    const action = (log.action || "").toLowerCase();
    const table = (log.table_name || "").toLowerCase();
    const adminName = (log.profile?.full_name || []).join(" ").toLowerCase();
    const mq = !q || action.includes(q) || table.includes(q) || adminName.includes(q);
    const ma = adminFilter === "all" || log.admin_id === adminFilter;
    return mq && ma;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportLog = () => {
    const rows = [
      ["Timestamp", "Admin", "Action", "Table", "Record ID"],
      ...filtered.map((log: any) => [
        safeFmt(log.created_at, "dd/MM/yyyy HH:mm"),
        (log.profile?.full_name || []).join(" ") || "Admin",
        log.action || "—",
        log.table_name || "—",
        log.record_id || "—",
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `AdminActivityLog_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Activity log exported");
  };

  const getMeta = (action: string) => {
    const key = Object.keys(ACTION_META).find(k => action.toLowerCase().includes(k));
    return key ? ACTION_META[key] : { color: "#94a3b8", bg: "rgba(148,163,184,.12)", icon: "•" };
  };

  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Admin Activity Log</h1>
          <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Track every admin action — who did what and when</p>
        </div>
        <button onClick={exportLog} style={{ background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { l: "Total Actions", v: auditLogs.length, c: "#6366f1" },
          { l: "Today", v: auditLogs.filter((l: any) => l.created_at?.startsWith(format(new Date(), "yyyy-MM-dd"))).length, c: "#4ade80" },
          { l: "Deletions", v: auditLogs.filter((l: any) => (l.action || "").toLowerCase().includes("delet")).length, c: "#f87171" },
          { l: "Admins Active", v: new Set(auditLogs.map((l: any) => l.admin_id)).size, c: "#fbbf24" },
        ].map(s => (
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", flex: 1, minWidth: 180 }}>
            <Search size={13} color={T.sub} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search action, table, admin..." style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1 }} />
          </div>
          <select value={adminFilter} onChange={e => { setAdminFilter(e.target.value); setPage(1); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 12px", fontSize: 13 }}>
            <option value="all">All Admins</option>
            {admins.map((a: any) => <option key={a.user_id} value={a.user_id}>{(a.full_name || []).join(" ")}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, textAlign: "center", color: T.sub }}>Loading activity logs...</div>
        ) : auditLogs.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: T.sub }}>
            <Shield size={40} color={T.sub} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>No audit logs found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Admin actions will be logged here once the audit_logs table is set up</div>
          </div>
        ) : (
          <div>
            {paginated.map((log: any) => {
              const meta = getMeta(log.action || "");
              return (
                <div key={log.id} style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}20`, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{(log.profile?.full_name || []).join(" ") || "Admin"}</span>
                      <span style={bs(meta.color, meta.bg)}>{log.action || "action"}</span>
                      {log.table_name && <span style={{ fontSize: 11, color: T.sub }}>on <code style={{ background: `${A1}10`, padding: "1px 5px", borderRadius: 3, fontSize: 11, color: A1 }}>{log.table_name}</code></span>}
                    </div>
                    {log.record_id && <div style={{ fontSize: 11, color: T.sub }}>Record ID: {log.record_id}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, flexShrink: 0 }}>{safeFmt(log.created_at, "dd MMM HH:mm")}</div>
                </div>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} log entries</span>
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

export default AdminActivityLog;
