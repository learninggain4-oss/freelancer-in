import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Inbox, Clock, CheckCircle2, XCircle, ChevronRight, User, Briefcase, IndianRupee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { format } from "date-fns";

const TH = {
  black:  { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", nav:"rgba(255,255,255,.04)" },
  white:  { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", nav:"#f1f5f9" },
  wb:     { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", nav:"#f1f5f9" },
  warm:   { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", nav:"#fef0d0" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", nav:"#dcfce7" },
  ocean:  { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", nav:"#e0f2fe" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:  { label: "Pending",  color: "#b45309", bg: "rgba(180,83,9,0.1)",   border: "rgba(180,83,9,0.25)",   icon: Clock },
  approved: { label: "Approved", color: "#16a34a", bg: "rgba(22,163,74,0.1)",  border: "rgba(22,163,74,0.25)",  icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "#dc2626", bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.25)",  icon: XCircle },
};

const EmployerRequests = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { theme } = useDashboardTheme();
  const T = TH[theme] ?? TH.white;
  const isDark = theme === "black";
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["employer-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select(`
          *,
          project:project_id(id, name, amount, status, client_id),
          employee:employee_id(full_name, user_code, avatar_url)
        `)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((a: any) => a.project?.client_id === profile.id);
    },
    enabled: !!profile?.id,
  });

  const filtered = activeTab === "all" ? applications : applications.filter((a: any) => a.status === activeTab);

  const counts = {
    all: applications.length,
    pending: applications.filter((a: any) => a.status === "pending").length,
    approved: applications.filter((a: any) => a.status === "approved").length,
    rejected: applications.filter((a: any) => a.status === "rejected").length,
  };

  const tabs: { key: typeof activeTab; label: string; count: number }[] = [
    { key: "all",      label: "All",      count: counts.all },
    { key: "pending",  label: "Pending",  count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div style={{ minHeight: "100%", background: T.bg, padding: "16px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", color: T.sub, display: "flex", padding: 4 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.3px" }}>Job Requests</h1>
          <p style={{ margin: 0, fontSize: 12, color: T.sub }}>{counts.all} application{counts.all !== 1 ? "s" : ""} received</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", fontFamily: "inherit",
              background: activeTab === tab.key ? "#6366f1" : T.nav,
              color: activeTab === tab.key ? "white" : T.sub,
              transition: "all .15s",
            }}
          >
            {tab.label}{tab.count > 0 ? ` (${tab.count})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 100, borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: isDark ? "rgba(99,102,241,.15)" : "rgba(99,102,241,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Inbox size={26} color="#6366f1" />
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>No requests yet</p>
          <p style={{ margin: 0, fontSize: 13, color: T.sub, textAlign: "center" }}>
            {activeTab === "all" ? "Applications from freelancers will appear here." : `No ${activeTab} applications.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((app: any) => {
            const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const name = Array.isArray(app.employee?.full_name) ? app.employee.full_name[0] : app.employee?.full_name ?? "Freelancer";
            const code = Array.isArray(app.employee?.user_code) ? app.employee.user_code[0] : app.employee?.user_code ?? "";
            const projectName = Array.isArray(app.project?.name) ? app.project.name[0] : app.project?.name ?? "Project";
            const amount = app.project?.amount ?? 0;

            return (
              <div
                key={app.id}
                style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: "14px 16px",
                  cursor: "pointer", transition: "all .15s",
                }}
                onClick={() => navigate(`/employer/projects/chat/${app.project_id}`)}
              >
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: isDark ? "rgba(99,102,241,.18)" : "rgba(99,102,241,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={18} color="#6366f1" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                      {code && <p style={{ margin: 0, fontSize: 11, color: T.sub }}>#{code}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                    <StatusIcon size={11} color={cfg.color} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>

                {/* Project info */}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Briefcase size={13} color={T.sub} />
                    <span style={{ fontSize: 12, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{projectName}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <IndianRupee size={12} color={T.sub} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{Number(amount).toLocaleString()}</span>
                  </div>
                </div>

                {/* Date + arrow */}
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: T.sub }}>
                    Applied {app.applied_at ? format(new Date(app.applied_at), "dd MMM yyyy") : "—"}
                  </span>
                  <ChevronRight size={14} color={T.sub} />
                </div>

                {/* Proposal preview */}
                {app.proposal && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: T.sub, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    "{app.proposal}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployerRequests;
