import { useState } from "react";
import { ShieldCheck, Crown, User, Eye, Lock, Unlock, Check, X as XIcon, Users, Save } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

type Role = "super_admin" | "admin" | "operator" | "viewer";

const ROLES: { key: Role; label: string; color: string; bg: string; icon: React.ElementType; description: string }[] = [
  { key: "super_admin", label: "Super Admin", color: "#fbbf24", bg: "rgba(251,191,36,.12)", icon: Crown, description: "Full system access including DB, env vars, server controls" },
  { key: "admin", label: "Admin", color: "#a5b4fc", bg: "rgba(99,102,241,.12)", icon: ShieldCheck, description: "Full admin panel access except system-level operations" },
  { key: "operator", label: "Operator", color: "#4ade80", bg: "rgba(74,222,128,.12)", icon: User, description: "Can approve/reject requests, manage content and users" },
  { key: "viewer", label: "Viewer", color: "#94a3b8", bg: "rgba(148,163,184,.08)", icon: Eye, description: "Read-only access to all admin panel sections" },
];

const PERMISSIONS: { label: string; super_admin: boolean; admin: boolean; operator: boolean; viewer: boolean; critical?: boolean }[] = [
  { label: "View dashboard & reports", super_admin: true, admin: true, operator: true, viewer: true },
  { label: "Manage users & profiles", super_admin: true, admin: true, operator: true, viewer: false },
  { label: "Approve/reject withdrawals", super_admin: true, admin: true, operator: true, viewer: false },
  { label: "Approve verifications", super_admin: true, admin: true, operator: true, viewer: false },
  { label: "Send notifications & announcements", super_admin: true, admin: true, operator: true, viewer: false },
  { label: "Manage wallet & transactions", super_admin: true, admin: true, operator: false, viewer: false },
  { label: "Block/unblock IP addresses", super_admin: true, admin: true, operator: false, viewer: false },
  { label: "Access security & audit logs", super_admin: true, admin: true, operator: false, viewer: false },
  { label: "Modify platform settings", super_admin: true, admin: true, operator: false, viewer: false },
  { label: "Manage admin roles (RBAC)", super_admin: true, admin: false, operator: false, viewer: false, critical: true },
  { label: "Switch database connection", super_admin: true, admin: false, operator: false, viewer: false, critical: true },
  { label: "Modify environment variables", super_admin: true, admin: false, operator: false, viewer: false, critical: true },
  { label: "Execute server operations", super_admin: true, admin: false, operator: false, viewer: false, critical: true },
  { label: "Enable/disable maintenance mode", super_admin: true, admin: false, operator: false, viewer: false, critical: true },
  { label: "Emergency stop / system reset", super_admin: true, admin: false, operator: false, viewer: false, critical: true },
];

const RBAC_KEY = "admin_rbac_overrides";

function getRoleOverrides(): Record<string, Role> {
  try { return JSON.parse(localStorage.getItem(RBAC_KEY) || "{}"); } catch { return {}; }
}

export default function AdminRBAC() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [overrides, setOverrides] = useState<Record<string, Role>>(getRoleOverrides);
  const [pendingChange, setPendingChange] = useState<{ id: string; name: string; role: Role } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: admins = [] } = useQuery({
    queryKey: ["admin-rbac-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,full_name,email,user_type,created_at").eq("user_type", "admin").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getEffectiveRole = (id: string): Role => overrides[id] || "admin";

  const requestRoleChange = (id: string, name: string, role: Role) => {
    setPendingChange({ id, name, role });
    setConfirmOpen(true);
  };

  const applyRoleChange = () => {
    if (!pendingChange) return;
    const updated = { ...overrides, [pendingChange.id]: pendingChange.role };
    setOverrides(updated);
    localStorage.setItem(RBAC_KEY, JSON.stringify(updated));
    logAction("Role Changed", `Changed ${pendingChange.name} role to ${pendingChange.role}`, "Security", "warning");
    toast({ title: "Role updated", description: `${pendingChange.name} is now ${pendingChange.role}` });
    setConfirmOpen(false);
    setPendingChange(null);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22 0%,${A2}15 100%)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "28px 28px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${A2}18 0%,transparent 70%)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <ShieldCheck size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Role-Based Access Control</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Define and manage what each admin role can access and modify</p>
          </div>
        </div>
      </div>

      {/* Role cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginBottom: 24 }}>
        {ROLES.map(role => {
          const Icon = role.icon;
          const count = role.key === "admin" ? admins.length - Object.values(overrides).filter(r => r !== "admin").length : Object.values(overrides).filter(r => r === role.key).length;
          return (
            <div key={role.key} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: role.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={17} color={role.color} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: T.text, margin: 0 }}>{role.label}</p>
                  <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{count} user{count !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.5 }}>{role.description}</p>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Permission Matrix</h2>
          <p style={{ color: T.sub, fontSize: 12, margin: "4px 0 0" }}>What each role can do — critical system operations are Super Admin only</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Permission</th>
                {ROLES.map(r => (
                  <th key={r.key} style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: r.color, textTransform: "uppercase", letterSpacing: 1 }}>{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: perm.critical ? "rgba(248,113,113,.03)" : "transparent" }}>
                  <td style={{ padding: "10px 20px", fontSize: 13, color: perm.critical ? "#f87171" : T.text, display: "flex", alignItems: "center", gap: 7 }}>
                    {perm.critical && <Lock size={12} color="#f87171" />}
                    {perm.label}
                  </td>
                  {ROLES.map(r => (
                    <td key={r.key} style={{ padding: "10px 16px", textAlign: "center" }}>
                      {perm[r.key] ? <Check size={15} color="#4ade80" /> : <XIcon size={14} color="rgba(148,163,184,.3)" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin users */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={16} color={A1} />
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Admin Users & Roles</h2>
          <span style={{ marginLeft: "auto", fontSize: 12, color: T.sub }}>{admins.length} admin user{admins.length !== 1 ? "s" : ""}</span>
        </div>
        {admins.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: T.sub }}>
            <Users size={32} style={{ opacity: .2, marginBottom: 8 }} />
            <p>No admin users found</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Admin User", "Current Role", "Assign Role", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const currentRole = getEffectiveRole(admin.id);
                  const roleCfg = ROLES.find(r => r.key === currentRole) || ROLES[1];
                  const RoleIcon = roleCfg.icon;
                  const displayName = Array.isArray(admin.full_name) ? admin.full_name[0] : admin.full_name || "—";
                  return (
                    <tr key={admin.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "12px 20px" }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: T.text, margin: 0 }}>{displayName}</p>
                        <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{admin.email || admin.id.slice(0, 12) + "…"}</p>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, background: roleCfg.bg, border: `1px solid ${roleCfg.color}33`, borderRadius: 8, padding: "5px 10px", width: "fit-content" }}>
                          <RoleIcon size={12} color={roleCfg.color} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: roleCfg.color }}>{roleCfg.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {ROLES.map(r => (
                            <button key={r.key} onClick={() => requestRoleChange(admin.id, displayName, r.key)}
                              disabled={currentRole === r.key}
                              style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: currentRole === r.key ? "default" : "pointer", border: `1px solid ${currentRole === r.key ? r.color + "44" : T.border}`, background: currentRole === r.key ? r.bg : T.input, color: currentRole === r.key ? r.color : T.sub, opacity: currentRole === r.key ? 1 : 0.7, transition: "all .15s" }}>
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Unlock size={12} color="#4ade80" />
                          <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>Active</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmActionDialog
        open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={applyRoleChange}
        title={`Change Role to ${pendingChange ? ROLES.find(r => r.key === pendingChange.role)?.label : ""}`}
        description={`You are about to change ${pendingChange?.name}'s role. This will immediately affect their access permissions across the admin panel.`}
        confirmLabel="Apply Role Change" variant="warning" />
    </div>
  );
}
