import { useState, useCallback } from "react";
import {
  ShieldCheck, Crown, User, Eye, Lock, Check, X as XIcon, Users, Plus,
  Trash2, Search, Loader2, Mail, ChevronDown,
} from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc", overlay:"rgba(0,0,0,.7)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5", overlay:"rgba(0,0,0,.4)" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5", overlay:"rgba(0,0,0,.4)" },
};

type Role = "super_admin" | "admin" | "operator" | "viewer";

interface AdminMember { userId: string; name: string; email: string; role: Role; addedAt: string; }

const ROLES: { key: Role; label: string; color: string; bg: string; icon: React.ElementType; description: string }[] = [
  { key: "super_admin", label: "Super Admin", color: "#fbbf24", bg: "rgba(251,191,36,.12)", icon: Crown,       description: "Full system access including DB, env vars, server controls" },
  { key: "admin",       label: "Admin",       color: "#a5b4fc", bg: "rgba(99,102,241,.12)", icon: ShieldCheck, description: "Full admin panel access except system-level operations" },
  { key: "operator",    label: "Operator",    color: "#4ade80", bg: "rgba(74,222,128,.12)", icon: User,        description: "Can approve/reject requests, manage content and users" },
  { key: "viewer",      label: "Viewer",      color: "#94a3b8", bg: "rgba(148,163,184,.08)", icon: Eye,        description: "Read-only access to all admin panel sections" },
];

const PERMISSIONS: { label: string; super_admin: boolean; admin: boolean; operator: boolean; viewer: boolean; critical?: boolean }[] = [
  { label: "View dashboard & reports",          super_admin: true,  admin: true,  operator: true,  viewer: true  },
  { label: "Manage users & profiles",           super_admin: true,  admin: true,  operator: true,  viewer: false },
  { label: "Approve/reject withdrawals",        super_admin: true,  admin: true,  operator: true,  viewer: false },
  { label: "Approve verifications",             super_admin: true,  admin: true,  operator: true,  viewer: false },
  { label: "Send notifications & announcements",super_admin: true,  admin: true,  operator: true,  viewer: false },
  { label: "Manage wallet & transactions",      super_admin: true,  admin: true,  operator: false, viewer: false },
  { label: "Block/unblock IP addresses",        super_admin: true,  admin: true,  operator: false, viewer: false },
  { label: "Access security & audit logs",      super_admin: true,  admin: true,  operator: false, viewer: false },
  { label: "Modify platform settings",          super_admin: true,  admin: true,  operator: false, viewer: false },
  { label: "Manage admin roles (RBAC)",         super_admin: true,  admin: false, operator: false, viewer: false, critical: true },
  { label: "Switch database connection",        super_admin: true,  admin: false, operator: false, viewer: false, critical: true },
  { label: "Modify environment variables",      super_admin: true,  admin: false, operator: false, viewer: false, critical: true },
  { label: "Execute server operations",         super_admin: true,  admin: false, operator: false, viewer: false, critical: true },
  { label: "Enable/disable maintenance mode",   super_admin: true,  admin: false, operator: false, viewer: false, critical: true },
  { label: "Emergency stop / system reset",     super_admin: true,  admin: false, operator: false, viewer: false, critical: true },
];

const MEMBERS_KEY = "admin_rbac_members";

function loadMembers(): AdminMember[] {
  try { return JSON.parse(localStorage.getItem(MEMBERS_KEY) || "[]"); } catch { return []; }
}
function saveMembers(members: AdminMember[]) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

export default function AdminRBAC() {
  const { themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [members, setMembers] = useState<AdminMember[]>(loadMembers);

  const [showAddModal, setShowAddModal]   = useState(false);
  const [searchEmail, setSearchEmail]     = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string | string[] | null; email: string | null }[]>([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [selectedUser, setSelectedUser]   = useState<{ id: string; name: string; email: string } | null>(null);
  const [addRole, setAddRole]             = useState<Role>("admin");
  const [roleDropOpen, setRoleDropOpen]   = useState(false);

  const [roleChangeTarget, setRoleChangeTarget] = useState<{ member: AdminMember; newRole: Role } | null>(null);
  const [deleteTarget, setDeleteTarget]         = useState<AdminMember | null>(null);

  const roleCounts = ROLES.map(r => ({ ...r, count: members.filter(m => m.role === r.key).length }));

  const searchUsers = useCallback(async () => {
    const q = searchEmail.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedUser(null);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .ilike("email", `%${q}%`)
        .limit(6);
      setSearchResults(data || []);
    } finally {
      setIsSearching(false);
    }
  }, [searchEmail]);

  const handleAddAdmin = () => {
    if (!selectedUser) return;
    if (members.some(m => m.userId === selectedUser.id)) {
      toast({ title: "Already added", description: "This user is already in the admin list.", variant: "destructive" });
      return;
    }
    const newMember: AdminMember = {
      userId: selectedUser.id,
      name:   selectedUser.name,
      email:  selectedUser.email,
      role:   addRole,
      addedAt: new Date().toISOString(),
    };
    const updated = [newMember, ...members];
    setMembers(updated);
    saveMembers(updated);
    logAction("Admin Added", `Added ${selectedUser.name} as ${addRole}`, "Security", "warning");
    toast({ title: "Admin added", description: `${selectedUser.name} is now ${ROLES.find(r => r.key === addRole)?.label}` });
    setShowAddModal(false);
    setSearchEmail("");
    setSearchResults([]);
    setSelectedUser(null);
    setAddRole("admin");
  };

  const applyRoleChange = () => {
    if (!roleChangeTarget) return;
    const updated = members.map(m =>
      m.userId === roleChangeTarget.member.userId ? { ...m, role: roleChangeTarget.newRole } : m
    );
    setMembers(updated);
    saveMembers(updated);
    logAction("Role Changed", `Changed ${roleChangeTarget.member.name} role to ${roleChangeTarget.newRole}`, "Security", "warning");
    toast({ title: "Role updated", description: `${roleChangeTarget.member.name} is now ${ROLES.find(r => r.key === roleChangeTarget.newRole)?.label}` });
    setRoleChangeTarget(null);
  };

  const applyDelete = () => {
    if (!deleteTarget) return;
    const updated = members.filter(m => m.userId !== deleteTarget.userId);
    setMembers(updated);
    saveMembers(updated);
    logAction("Admin Removed", `Removed ${deleteTarget.name} from admin panel`, "Security", "critical");
    toast({ title: "Admin removed", description: `${deleteTarget.name} has been removed.` });
    setDeleteTarget(null);
  };

  const getDisplayName = (u: { full_name: string | string[] | null; email: string | null }) => {
    if (Array.isArray(u.full_name)) return u.full_name[0] || u.email || "—";
    return u.full_name || u.email || "—";
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 40px" }}>

      {/* ── Add Admin Modal ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: T.overlay, backdropFilter: "blur(6px)" }}
               onClick={() => { setShowAddModal(false); setSearchEmail(""); setSearchResults([]); setSelectedUser(null); }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 480, borderRadius: 20, background: themeKey === "black" ? "#0f0f24" : "#fff", border: `1px solid ${T.border}`, padding: "28px 28px 24px", boxShadow: "0 24px 64px rgba(0,0,0,.5)", zIndex: 1 }}>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={20} color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 16, color: T.text, margin: 0 }}>Add New Admin</p>
                <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>Search user by email and assign a role</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setSearchEmail(""); setSearchResults([]); setSelectedUser(null); }}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.sub }}>
                <XIcon size={18} />
              </button>
            </div>

            {/* Email Search */}
            <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1 }}>Search by email</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 12 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, background: T.input, border: `1px solid ${T.border}`, padding: "9px 12px" }}>
                <Mail size={14} color={T.sub} />
                <input
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchUsers()}
                  placeholder="user@example.com"
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: T.text }}
                />
              </div>
              <button onClick={searchUsers} disabled={isSearching || !searchEmail.trim()}
                style={{ padding: "9px 16px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: isSearching || !searchEmail.trim() ? "not-allowed" : "pointer", opacity: isSearching || !searchEmail.trim() ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Search
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: 16 }}>
                {searchResults.map((u, i) => {
                  const name = getDisplayName(u);
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <button key={u.id} onClick={() => setSelectedUser({ id: u.id, name, email: u.email || "" })}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: isSelected ? `${A1}18` : "transparent", border: "none", borderBottom: i < searchResults.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: isSelected ? `${A1}30` : T.input, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={14} color={isSelected ? A1 : T.sub} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                        <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{u.email}</p>
                      </div>
                      {isSelected && <Check size={15} color={A1} />}
                    </button>
                  );
                })}
              </div>
            )}

            {searchResults.length === 0 && searchEmail && !isSearching && (
              <p style={{ fontSize: 12, color: T.sub, textAlign: "center", padding: "10px 0", marginBottom: 12 }}>No users found — try a different email</p>
            )}

            {/* Role Selector */}
            <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1 }}>Assign Role</label>
            <div style={{ position: "relative", marginTop: 6, marginBottom: 20 }}>
              <button onClick={() => setRoleDropOpen(p => !p)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.input, border: `1px solid ${A1}55`, cursor: "pointer" }}>
                {(() => { const r = ROLES.find(x => x.key === addRole)!; const Icon = r.icon; return (
                  <>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={13} color={r.color} />
                    </div>
                    <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 700, color: T.text }}>{r.label}</span>
                    <ChevronDown size={14} color={T.sub} style={{ transform: roleDropOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                  </>
                ); })()}
              </button>
              {roleDropOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, borderRadius: 10, background: themeKey === "black" ? "#0f0f24" : "#fff", border: `1px solid ${T.border}`, overflow: "hidden", zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    return (
                      <button key={r.key} onClick={() => { setAddRole(r.key); setRoleDropOpen(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: addRole === r.key ? `${A1}12` : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={13} color={r.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{r.label}</p>
                          <p style={{ fontSize: 10, color: T.sub, margin: 0 }}>{r.description}</p>
                        </div>
                        {addRole === r.key && <Check size={14} color={A1} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Button */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowAddModal(false); setSearchEmail(""); setSearchResults([]); setSelectedUser(null); }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleAddAdmin} disabled={!selectedUser}
                style={{ flex: 2, padding: "10px", borderRadius: 10, background: selectedUser ? `linear-gradient(135deg,${A1},${A2})` : T.input, border: "none", color: selectedUser ? "#fff" : T.sub, fontSize: 13, fontWeight: 700, cursor: selectedUser ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Plus size={15} /> Add as {ROLES.find(r => r.key === addRole)?.label}
              </button>
            </div>
          </div>
        </div>
      )}

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
        {roleCounts.map(role => {
          const Icon = role.icon;
          return (
            <div key={role.key} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: role.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={17} color={role.color} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: T.text, margin: 0 }}>{role.label}</p>
                  <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{role.count} user{role.count !== 1 ? "s" : ""}</p>
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
                  <td style={{ padding: "10px 20px", fontSize: 13, color: perm.critical ? "#f87171" : T.text }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {perm.critical && <Lock size={12} color="#f87171" />}
                      {perm.label}
                    </div>
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
          <span style={{ fontSize: 12, color: T.sub }}>{members.length} admin{members.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setShowAddModal(true)}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${A1}44` }}>
            <Plus size={14} /> Add Admin
          </button>
        </div>

        {members.length === 0 ? (
          <div style={{ padding: "52px 40px", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: `${A1}12`, border: `1px solid ${A1}22`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Users size={26} color={A1} style={{ opacity: .5 }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: T.text, margin: "0 0 6px" }}>No admins added yet</p>
            <p style={{ fontSize: 13, color: T.sub, margin: "0 0 20px" }}>Click "Add Admin" to grant a user access to the admin panel</p>
            <button onClick={() => setShowAddModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Plus size={15} /> Add First Admin
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Admin User", "Current Role", "Assign Role", "Added", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 20px", textAlign: i === 4 ? "center" : "left", fontSize: 11, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const roleCfg = ROLES.find(r => r.key === member.role) || ROLES[1];
                  const RoleIcon = roleCfg.icon;
                  const addedDate = new Date(member.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <tr key={member.userId} style={{ borderBottom: `1px solid ${T.border}` }}>
                      {/* User */}
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${A1}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <User size={15} color={A1} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 13, color: T.text, margin: 0 }}>{member.name}</p>
                            <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{member.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Current Role */}
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: roleCfg.bg, border: `1px solid ${roleCfg.color}33`, borderRadius: 8, padding: "5px 10px" }}>
                          <RoleIcon size={12} color={roleCfg.color} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: roleCfg.color }}>{roleCfg.label}</span>
                        </div>
                      </td>
                      {/* Assign Role buttons */}
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {ROLES.map(r => {
                            const active = member.role === r.key;
                            return (
                              <button key={r.key}
                                onClick={() => !active && setRoleChangeTarget({ member, newRole: r.key })}
                                disabled={active}
                                style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: active ? "default" : "pointer", border: `1px solid ${active ? r.color + "55" : T.border}`, background: active ? r.bg : T.input, color: active ? r.color : T.sub, opacity: active ? 1 : 0.75, transition: "all .15s" }}>
                                {r.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      {/* Added date */}
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>{addedDate}</span>
                      </td>
                      {/* Delete */}
                      <td style={{ padding: "13px 20px", textAlign: "center" }}>
                        <button onClick={() => setDeleteTarget(member)}
                          style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", margin: "0 auto", transition: "all .15s" }}
                          title="Remove admin">
                          <Trash2 size={14} color="#f87171" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role change confirmation */}
      <ConfirmActionDialog
        open={!!roleChangeTarget} onOpenChange={open => !open && setRoleChangeTarget(null)}
        onConfirm={applyRoleChange}
        title={`Change Role to ${roleChangeTarget ? ROLES.find(r => r.key === roleChangeTarget.newRole)?.label : ""}`}
        description={`You are about to change ${roleChangeTarget?.member.name}'s role. This will immediately affect their access permissions across the admin panel.`}
        confirmLabel="Apply Role Change" variant="warning" />

      {/* Delete confirmation */}
      <ConfirmActionDialog
        open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={applyDelete}
        title="Remove Admin Access"
        description={`Remove ${deleteTarget?.name} (${deleteTarget?.email}) from the admin panel? They will immediately lose all admin access.`}
        confirmLabel="Remove Admin" variant="danger" />
    </div>
  );
}
