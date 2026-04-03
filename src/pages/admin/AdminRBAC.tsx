import { useState, useCallback, useEffect } from "react";
import {
  ShieldCheck, Crown, User, Eye, Lock, Check, X as XIcon, Users, Plus,
  Trash2, Search, Loader2, Mail, ChevronDown, BadgeCheck,
  Send, Clock, Link2, Copy, RefreshCw, CheckCircle, AlertCircle,
} from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { useAuth } from "@/contexts/AuthContext";
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

interface Invitation {
  id: string;
  email: string;
  role: Role;
  token: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
}

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

const MEMBERS_KEY     = "admin_rbac_members";
const INVITATIONS_KEY = "admin_rbac_invitations";
const INVITE_EXPIRY_DAYS = 7;

function loadMembers(): AdminMember[] {
  try { return JSON.parse(localStorage.getItem(MEMBERS_KEY) || "[]"); } catch { return []; }
}
function saveMembers(members: AdminMember[]) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}
function loadInvitations(): Invitation[] {
  try { return JSON.parse(localStorage.getItem(INVITATIONS_KEY) || "[]"); } catch { return []; }
}
function saveInvitations(invitations: Invitation[]) {
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
}
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export default function AdminRBAC() {
  const { themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const [members, setMembers] = useState<AdminMember[]>(loadMembers);
  const [invitations, setInvitations] = useState<Invitation[]>(loadInvitations);

  /* Auto-expire invitations on load */
  useEffect(() => {
    const updated = invitations.map(inv =>
      inv.status === "pending" && isExpired(inv.expiresAt) ? { ...inv, status: "expired" as const } : inv
    );
    if (JSON.stringify(updated) !== JSON.stringify(invitations)) {
      setInvitations(updated);
      saveInvitations(updated);
    }
  }, []);

  /* Auto-seed the currently logged-in super admin */
  useEffect(() => {
    if (!user) return;
    setMembers(prev => {
      if (prev.some(m => m.userId === user.id)) return prev;
      const email = user.email || "";
      const rawName = profile
        ? (Array.isArray((profile as unknown as { full_name: string[] }).full_name)
            ? (profile as unknown as { full_name: string[] }).full_name[0]
            : (profile as unknown as { full_name: string }).full_name)
        : null;
      const name = rawName || email.split("@")[0] || "Super Admin";
      const seed: AdminMember = { userId: user.id, name, email, role: "super_admin", addedAt: new Date().toISOString() };
      const updated = [seed, ...prev];
      saveMembers(updated);
      return updated;
    });
  }, [user, profile]);

  /* ── Add Admin Modal ── */
  const [showAddModal, setShowAddModal]   = useState(false);
  const [searchEmail, setSearchEmail]     = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string | string[] | null; email: string | null }[]>([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [selectedUser, setSelectedUser]   = useState<{ id: string; name: string; email: string } | null>(null);
  const [addRole, setAddRole]             = useState<Role>("admin");
  const [roleDropOpen, setRoleDropOpen]   = useState(false);

  /* ── Invite Modal ── */
  const [showInviteModal, setShowInviteModal]   = useState(false);
  const [inviteEmail, setInviteEmail]           = useState("");
  const [inviteRole, setInviteRole]             = useState<Role>("admin");
  const [inviteRoleDrop, setInviteRoleDrop]     = useState(false);
  const [generatedLink, setGeneratedLink]       = useState<string | null>(null);
  const [copiedLink, setCopiedLink]             = useState(false);
  const [cancelTarget, setCancelTarget]         = useState<Invitation | null>(null);

  const [roleChangeTarget, setRoleChangeTarget] = useState<{ member: AdminMember; newRole: Role } | null>(null);
  const [deleteTarget, setDeleteTarget]         = useState<AdminMember | null>(null);

  const roleCounts = ROLES.map(r => ({ ...r, count: members.filter(m => m.role === r.key).length }));

  const pendingInvites    = invitations.filter(i => i.status === "pending");
  const nonPendingInvites = invitations.filter(i => i.status !== "pending");

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
    const newMember: AdminMember = { userId: selectedUser.id, name: selectedUser.name, email: selectedUser.email, role: addRole, addedAt: new Date().toISOString() };
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

  const handleSendInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (invitations.some(i => i.email === email && i.status === "pending")) {
      toast({ title: "Already invited", description: "A pending invitation already exists for this email.", variant: "destructive" });
      return;
    }
    const token = generateToken();
    const now = new Date();
    const expires = new Date(now.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const invitation: Invitation = {
      id: crypto.randomUUID(),
      email,
      role: inviteRole,
      token,
      invitedBy: user?.email || "Super Admin",
      invitedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: "pending",
    };
    const updated = [invitation, ...invitations];
    setInvitations(updated);
    saveInvitations(updated);
    const link = `${window.location.origin}/register?invite=${token}&email=${encodeURIComponent(email)}&role=${inviteRole}`;
    setGeneratedLink(link);
    logAction("Invitation Sent", `Invited ${email} as ${inviteRole}`, "Security", "warning");
    toast({ title: "Invitation created", description: `Invite link generated for ${email}` });
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: "Link copied!", description: "Invitation link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const handleResend = (inv: Invitation) => {
    const token = generateToken();
    const expires = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const updated = invitations.map(i =>
      i.id === inv.id ? { ...i, token, expiresAt: expires.toISOString(), invitedAt: new Date().toISOString(), status: "pending" as const } : i
    );
    setInvitations(updated);
    saveInvitations(updated);
    const link = `${window.location.origin}/register?invite=${token}&email=${encodeURIComponent(inv.email)}&role=${inv.role}`;
    handleCopyLink(link);
    logAction("Invitation Resent", `Resent invite to ${inv.email}`, "Security", "success");
    toast({ title: "Invitation refreshed", description: `New link generated and copied for ${inv.email}` });
  };

  const handleCancelInvite = (inv: Invitation) => {
    const updated = invitations.map(i => i.id === inv.id ? { ...i, status: "cancelled" as const } : i);
    setInvitations(updated);
    saveInvitations(updated);
    logAction("Invitation Cancelled", `Cancelled invite for ${inv.email}`, "Security", "warning");
    toast({ title: "Invitation cancelled", description: `Invite for ${inv.email} has been cancelled.` });
    setCancelTarget(null);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail("");
    setInviteRole("admin");
    setInviteRoleDrop(false);
    setGeneratedLink(null);
    setCopiedLink(false);
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

  const statusBadge = (status: Invitation["status"]) => {
    const cfg = {
      pending:   { color: "#fbbf24", bg: "rgba(251,191,36,.12)", label: "Pending" },
      accepted:  { color: "#4ade80", bg: "rgba(74,222,128,.12)", label: "Accepted" },
      expired:   { color: "#f87171", bg: "rgba(248,113,113,.12)", label: "Expired" },
      cancelled: { color: "#94a3b8", bg: "rgba(148,163,184,.08)", label: "Cancelled" },
    }[status];
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 7, padding: "3px 9px" }}>
        {status === "pending" && <Clock size={10} />}
        {status === "accepted" && <CheckCircle size={10} />}
        {status === "expired" && <AlertCircle size={10} />}
        {status === "cancelled" && <XIcon size={10} />}
        {cfg.label}
      </span>
    );
  };

  const RoleDropdown = ({ value, onChange, open, setOpen }: { value: Role; onChange: (r: Role) => void; open: boolean; setOpen: (v: boolean) => void }) => {
    const r = ROLES.find(x => x.key === value)!;
    const Icon = r.icon;
    return (
      <div style={{ position: "relative" }}>
        <button onClick={() => setOpen(!open)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.input, border: `1px solid ${A1}55`, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={13} color={r.color} />
          </div>
          <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 700, color: T.text }}>{r.label}</span>
          <ChevronDown size={14} color={T.sub} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, borderRadius: 10, background: themeKey === "black" ? "#0f0f24" : "#fff", border: `1px solid ${T.border}`, overflow: "hidden", zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
            {ROLES.map(role => {
              const RIcon = role.icon;
              return (
                <button key={role.key} onClick={() => { onChange(role.key); setOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: value === role.key ? `${A1}12` : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: role.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <RIcon size={13} color={role.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{role.label}</p>
                    <p style={{ fontSize: 10, color: T.sub, margin: 0 }}>{role.description}</p>
                  </div>
                  {value === role.key && <Check size={14} color={A1} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
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
            <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1 }}>Search by email</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 12 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, background: T.input, border: `1px solid ${T.border}`, padding: "9px 12px" }}>
                <Mail size={14} color={T.sub} />
                <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && searchUsers()}
                  placeholder="user@example.com"
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: T.text }} />
              </div>
              <button onClick={searchUsers} disabled={isSearching || !searchEmail.trim()}
                style={{ padding: "9px 16px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: isSearching || !searchEmail.trim() ? "not-allowed" : "pointer", opacity: isSearching || !searchEmail.trim() ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Search
              </button>
            </div>
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
            <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1 }}>Assign Role</label>
            <div style={{ marginTop: 6, marginBottom: 20 }}>
              <RoleDropdown value={addRole} onChange={setAddRole} open={roleDropOpen} setOpen={setRoleDropOpen} />
            </div>
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

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: T.overlay, backdropFilter: "blur(6px)" }} onClick={closeInviteModal} />
          <div style={{ position: "relative", width: "100%", maxWidth: 500, borderRadius: 20, background: themeKey === "black" ? "#0f0f24" : "#fff", border: `1px solid ${T.border}`, padding: "28px 28px 24px", boxShadow: "0 24px 64px rgba(0,0,0,.5)", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,#f59e0b,#f97316)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send size={20} color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 16, color: T.text, margin: 0 }}>Send Invitation</p>
                <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>Invite someone by email — they get a sign-up link with a pre-assigned role</p>
              </div>
              <button onClick={closeInviteModal} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.sub }}>
                <XIcon size={18} />
              </button>
            </div>

            {!generatedLink ? (
              <>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1 }}>Email address</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 10, background: T.input, border: `1px solid ${T.border}`, padding: "9px 12px", marginTop: 6, marginBottom: 16 }}>
                  <Mail size={14} color={T.sub} />
                  <input
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendInvite()}
                    placeholder="newadmin@example.com"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: T.text }}
                  />
                </div>

                <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1 }}>Assign Role</label>
                <div style={{ marginTop: 6, marginBottom: 8 }}>
                  <RoleDropdown value={inviteRole} onChange={setInviteRole} open={inviteRoleDrop} setOpen={setInviteRoleDrop} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
                  <Clock size={13} color="#fbbf24" />
                  <p style={{ fontSize: 12, color: "#fbbf24", margin: 0 }}>Invitation link expires in {INVITE_EXPIRY_DAYS} days</p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={closeInviteModal}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handleSendInvite} disabled={!inviteEmail.trim()}
                    style={{ flex: 2, padding: "10px", borderRadius: 10, background: inviteEmail.trim() ? "linear-gradient(135deg,#f59e0b,#f97316)" : T.input, border: "none", color: inviteEmail.trim() ? "#fff" : T.sub, fontSize: 13, fontWeight: 700, cursor: inviteEmail.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                    <Send size={15} /> Generate Invite Link
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
                  <CheckCircle size={16} color="#4ade80" />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: 0 }}>Invitation created!</p>
                    <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>Copy and share this link with <strong>{inviteEmail}</strong></p>
                  </div>
                </div>

                <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1 }}>Invitation Link</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", marginTop: 6, marginBottom: 16 }}>
                  <Link2 size={13} color={T.sub} style={{ flexShrink: 0 }} />
                  <p style={{ flex: 1, fontSize: 11, color: T.sub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{generatedLink}</p>
                  <button onClick={() => handleCopyLink(generatedLink)}
                    style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: copiedLink ? "rgba(74,222,128,.15)" : `${A1}18`, border: `1px solid ${copiedLink ? "rgba(74,222,128,.3)" : A1 + "33"}`, color: copiedLink ? "#4ade80" : A1, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                    {copiedLink ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
                  <Clock size={13} color={A1} />
                  <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>This link expires in <strong style={{ color: T.text }}>{INVITE_EXPIRY_DAYS} days</strong>. Share it only with <strong style={{ color: T.text }}>{inviteEmail}</strong>.</p>
                </div>

                <button onClick={closeInviteModal}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Done
                </button>
              </>
            )}
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
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={16} color={A1} />
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Admin Users & Roles</h2>
          <span style={{ fontSize: 12, color: T.sub }}>{members.length} admin{members.length !== 1 ? "s" : ""}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => setShowInviteModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(245,158,11,.35)" }}>
              <Send size={14} /> Invite
            </button>
            <button onClick={() => setShowAddModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${A1}44` }}>
              <Plus size={14} /> Add Admin
            </button>
          </div>
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
                  const isSelf    = user?.id === member.userId;
                  const roleCfg   = ROLES.find(r => r.key === member.role) || ROLES[1];
                  const RoleIcon  = roleCfg.icon;
                  const addedDate = new Date(member.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <tr key={member.userId} style={{ borderBottom: `1px solid ${T.border}`, background: isSelf ? `${A1}07` : "transparent" }}>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: isSelf ? `${A1}28` : `${A1}18`, border: isSelf ? `1.5px solid ${A1}55` : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <User size={15} color={A1} />
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <p style={{ fontWeight: 600, fontSize: 13, color: T.text, margin: 0 }}>{member.name}</p>
                              {isSelf && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 800, color: A1, background: `${A1}18`, border: `1px solid ${A1}33`, borderRadius: 5, padding: "1px 6px", letterSpacing: .5, textTransform: "uppercase" }}>
                                  <BadgeCheck size={9} /> You
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: roleCfg.bg, border: `1px solid ${roleCfg.color}33`, borderRadius: 8, padding: "5px 10px" }}>
                          <RoleIcon size={12} color={roleCfg.color} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: roleCfg.color }}>{roleCfg.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        {isSelf ? (
                          <span style={{ fontSize: 11, color: T.sub, fontStyle: "italic" }}>Cannot change own role</span>
                        ) : (
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
                        )}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>{addedDate}</span>
                      </td>
                      <td style={{ padding: "13px 20px", textAlign: "center" }}>
                        {isSelf ? (
                          <div style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", opacity: 0.2 }} title="Cannot remove yourself">
                            <Lock size={13} color={T.sub} />
                          </div>
                        ) : (
                          <button onClick={() => setDeleteTarget(member)}
                            style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", margin: "0 auto" }}
                            title="Remove admin">
                            <Trash2 size={14} color="#f87171" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pending Invitations ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Send size={16} color="#f59e0b" />
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Pending Invitations</h2>
          {pendingInvites.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 20, padding: "2px 9px" }}>
              {pendingInvites.length} pending
            </span>
          )}
          <button onClick={() => setShowInviteModal(true)}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(245,158,11,.35)" }}>
            <Send size={14} /> New Invitation
          </button>
        </div>

        {pendingInvites.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Send size={22} color="#f59e0b" style={{ opacity: .5 }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: "0 0 5px" }}>No pending invitations</p>
            <p style={{ fontSize: 12, color: T.sub, margin: "0 0 16px" }}>Send an invitation to grant someone admin access before they register</p>
            <button onClick={() => setShowInviteModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Send size={14} /> Send Invitation
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Invitee", "Role", "Invited By", "Expires", "Status", "Actions"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 20px", textAlign: i === 5 ? "center" : "left", fontSize: 11, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map(inv => {
                  const roleCfg = ROLES.find(r => r.key === inv.role) || ROLES[1];
                  const RIcon   = roleCfg.icon;
                  const expDate = new Date(inv.expiresAt);
                  const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / 86400000));
                  const invLink = `${window.location.origin}/register?invite=${inv.token}&email=${encodeURIComponent(inv.email)}&role=${inv.role}`;
                  return (
                    <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(245,158,11,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Mail size={14} color="#f59e0b" />
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{inv.email}</p>
                        </div>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: roleCfg.bg, border: `1px solid ${roleCfg.color}33`, borderRadius: 8, padding: "5px 10px" }}>
                          <RIcon size={12} color={roleCfg.color} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: roleCfg.color }}>{roleCfg.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>{inv.invitedBy}</span>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <div>
                          <p style={{ fontSize: 12, color: daysLeft <= 1 ? "#f87171" : T.text, margin: 0, fontWeight: daysLeft <= 1 ? 700 : 400 }}>
                            {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
                          </p>
                          <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{expDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                        </div>
                      </td>
                      <td style={{ padding: "13px 20px" }}>{statusBadge(inv.status)}</td>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <button onClick={() => handleCopyLink(invLink)} title="Copy invite link"
                            style={{ width: 32, height: 32, borderRadius: 9, background: `${A1}12`, border: `1px solid ${A1}22`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Copy size={13} color={A1} />
                          </button>
                          <button onClick={() => handleResend(inv)} title="Resend & refresh link"
                            style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <RefreshCw size={13} color="#4ade80" />
                          </button>
                          <button onClick={() => setCancelTarget(inv)} title="Cancel invitation"
                            style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <XIcon size={13} color="#f87171" />
                          </button>
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

      {/* ── Invitation History ── */}
      {nonPendingInvites.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
            <h2 style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Invitation History</h2>
            <p style={{ color: T.sub, fontSize: 12, margin: "4px 0 0" }}>Accepted, expired and cancelled invitations</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Invitee", "Role", "Invited By", "Date", "Status"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nonPendingInvites.map(inv => {
                  const roleCfg = ROLES.find(r => r.key === inv.role) || ROLES[1];
                  const RIcon   = roleCfg.icon;
                  return (
                    <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}`, opacity: 0.65 }}>
                      <td style={{ padding: "12px 20px" }}>
                        <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{inv.email}</p>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: roleCfg.bg, border: `1px solid ${roleCfg.color}22`, borderRadius: 7, padding: "4px 9px" }}>
                          <RIcon size={11} color={roleCfg.color} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: roleCfg.color }}>{roleCfg.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>{inv.invitedBy}</span>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>{new Date(inv.invitedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </td>
                      <td style={{ padding: "12px 20px" }}>{statusBadge(inv.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Cancel invite confirmation */}
      <ConfirmActionDialog
        open={!!cancelTarget} onOpenChange={open => !open && setCancelTarget(null)}
        onConfirm={() => cancelTarget && handleCancelInvite(cancelTarget)}
        title="Cancel Invitation"
        description={`Cancel the pending invitation for ${cancelTarget?.email}? Their invite link will become invalid immediately.`}
        confirmLabel="Cancel Invitation" variant="warning" />
    </div>
  );
}
