import { useState } from "react";
import { GitPullRequest, CheckCircle2, XCircle, Clock, Users, ShieldAlert, UserPlus, History, AlertTriangle, Lock, Unlock, RefreshCw, Eye, MessageSquare, Star, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1", A2 = "#8b5cf6";
const TH = {
  black: { bg:"#070714",card:"rgba(255,255,255,.05)",border:"rgba(255,255,255,.08)",text:"#e2e8f0",sub:"#94a3b8",input:"rgba(255,255,255,.07)",badge:"rgba(99,102,241,.2)",badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff",card:"#ffffff",border:"rgba(0,0,0,.08)",text:"#1e293b",sub:"#64748b",input:"#f8fafc",badge:"rgba(99,102,241,.1)",badgeFg:"#4f46e5" },
};

const APPROVALS_KEY = "admin_approvals_v1";
const RECOVERY_KEY  = "admin_recovery_accounts_v1";

interface ApprovalRequest {
  id: string; action: string; requestedBy: string; target: string;
  category: "Financial" | "Security" | "User Management" | "System" | "Data";
  risk: "critical" | "high" | "medium";
  status: "pending" | "approved" | "rejected";
  reason: string; notes?: string;
  requestedAt: string; resolvedAt?: string; resolvedBy?: string;
}

interface RecoveryAccount {
  id: string; name: string; email: string; role: "super_admin" | "emergency";
  isActive: boolean; lastUsed?: string; createdAt: string;
}

function seedApprovals(): ApprovalRequest[] {
  return [
    { id: "a1", action: "Bulk Delete 1,200 Inactive Users", requestedBy: "Admin A", target: "User Database", category: "Data", risk: "critical", status: "pending", reason: "Clear accounts inactive for 2+ years", requestedAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "a2", action: "Approve Withdrawal ₹85,000 (User: DEMO)", requestedBy: "Admin B", target: "Wallet #W-0042", category: "Financial", risk: "high", status: "pending", reason: "High-value withdrawal flagged for dual approval", requestedAt: new Date(Date.now() - 7200000).toISOString() },
    { id: "a3", action: "Grant Admin Role to freeandin@gmail.com", requestedBy: "Admin A", target: "freeandin@gmail.com", category: "Security", risk: "critical", status: "approved", reason: "New super admin required for operations", requestedAt: new Date(Date.now() - 86400000).toISOString(), resolvedAt: new Date(Date.now() - 82800000).toISOString(), resolvedBy: "Super Admin" },
    { id: "a4", action: "Export Full User Database (CSV)", requestedBy: "Admin C", target: "profiles table", category: "Data", risk: "high", status: "pending", reason: "Compliance audit requirement", requestedAt: new Date(Date.now() - 1800000).toISOString() },
    { id: "a5", action: "Reset Platform Commission to 5%", requestedBy: "Admin B", target: "PLATFORM_COMMISSION_RATE", category: "Financial", risk: "medium", status: "rejected", reason: "Proposed change from 10% to 5%", notes: "Rejected: Requires board approval first", requestedAt: new Date(Date.now() - 172800000).toISOString(), resolvedAt: new Date(Date.now() - 169200000).toISOString(), resolvedBy: "Super Admin" },
  ];
}

function seedRecovery(): RecoveryAccount[] {
  return [
    { id: "r1", name: "Primary Super Admin", email: "freeandin@gmail.com", role: "super_admin", isActive: true, lastUsed: new Date().toISOString(), createdAt: new Date(Date.now() - 864e5 * 30).toISOString() },
    { id: "r2", name: "Emergency Recovery", email: "recovery@freelancer.in", role: "emergency", isActive: true, createdAt: new Date(Date.now() - 864e5 * 15).toISOString() },
  ];
}

function load<T>(key: string, seed: () => T[]): T[] {
  try { const d = localStorage.getItem(key); if (d) return JSON.parse(d); } catch { /* */ }
  const s = seed(); localStorage.setItem(key, JSON.stringify(s)); return s;
}
function persist<T>(key: string, data: T[]) { localStorage.setItem(key, JSON.stringify(data)); }

const riskColor = { critical: "#f87171", high: "#fb923c", medium: "#fbbf24" };
const riskBg    = { critical: "rgba(248,113,113,.1)", high: "rgba(251,146,60,.1)", medium: "rgba(251,191,36,.1)" };
const statusColor = { pending: "#fbbf24", approved: "#4ade80", rejected: "#f87171" };
const catColor: Record<string, string> = { Financial: "#a5b4fc", Security: "#f87171", "User Management": "#4ade80", System: "#fbbf24", Data: "#fb923c" };

export default function AdminApprovalCenter() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const { logAction } = useAdminAudit();
  const { toast } = useToast();

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => load(APPROVALS_KEY, seedApprovals));
  const [recovery,  setRecovery]  = useState<RecoveryAccount[]>(() => load(RECOVERY_KEY,  seedRecovery));
  const [tab, setTab]   = useState<"approvals" | "recovery">("approvals");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState<"approved" | "rejected" | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newReq, setNewReq] = useState({ action: "", reason: "", category: "System" as ApprovalRequest["category"], risk: "medium" as ApprovalRequest["risk"] });
  const [newRecovery, setNewRecovery] = useState({ name: "", email: "", role: "emergency" as RecoveryAccount["role"] });
  const [showAddRecovery, setShowAddRecovery] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<RecoveryAccount | null>(null);

  const persistApprovals = (a: ApprovalRequest[]) => { persist(APPROVALS_KEY, a); setApprovals(a); };
  const persistRecovery  = (r: RecoveryAccount[]) => { persist(RECOVERY_KEY, r); setRecovery(r); };

  const resolve = (id: string, status: "approved" | "rejected") => {
    const req = approvals.find(a => a.id === id)!;
    const updated = approvals.map(a => a.id === id ? { ...a, status, notes: resolveNotes, resolvedAt: new Date().toISOString(), resolvedBy: "Current Admin" } : a);
    persistApprovals(updated);
    logAction(`Approval ${status === "approved" ? "Approved" : "Rejected"}`, `${req.action} — ${resolveNotes || "No notes"}`, req.category, status === "approved" ? "success" : "warning");
    toast({ title: `Request ${status}`, description: req.action });
    setResolveId(null); setResolveAction(null); setResolveNotes("");
  };

  const submitNewRequest = () => {
    if (!newReq.action.trim()) { toast({ title: "Action description required", variant: "destructive" }); return; }
    const req: ApprovalRequest = { id: crypto.randomUUID(), ...newReq, target: "System", status: "pending", requestedBy: "Current Admin", requestedAt: new Date().toISOString() };
    persistApprovals([req, ...approvals]);
    logAction("Approval Requested", `New request: ${newReq.action}`, newReq.category, "warning");
    toast({ title: "Approval request submitted", description: "Waiting for second admin to approve" });
    setShowNewRequest(false); setNewReq({ action: "", reason: "", category: "System", risk: "medium" });
  };

  const addRecovery = () => {
    if (!newRecovery.name.trim() || !newRecovery.email.trim()) { toast({ title: "Name and email required", variant: "destructive" }); return; }
    const acc: RecoveryAccount = { id: crypto.randomUUID(), ...newRecovery, isActive: false, createdAt: new Date().toISOString() };
    persistRecovery([...recovery, acc]);
    logAction("Recovery Account Added", `Added ${newRecovery.email} as ${newRecovery.role}`, "Security", "success");
    toast({ title: "Recovery account added" });
    setShowAddRecovery(false); setNewRecovery({ name: "", email: "", role: "emergency" });
  };

  const filtered = approvals.filter(a => filter === "all" || a.status === filter);
  const pending = approvals.filter(a => a.status === "pending").length;
  const inp = (s?: object) => ({ background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, ...s });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22,${A2}15)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "26px 28px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: 160, height: 160, background: `radial-gradient(circle at top right,${A2}12,transparent 70%)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${A1}55`, flexShrink: 0 }}>
            <GitPullRequest size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Approval Center</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Dual-approval workflow for sensitive actions · Emergency recovery account management</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowNewRequest(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <GitPullRequest size={13} /> New Request
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[{ l: "Pending Approvals", v: pending, c: "#fbbf24" }, { l: "Approved", v: approvals.filter(a=>a.status==="approved").length, c: "#4ade80" }, { l: "Rejected", v: approvals.filter(a=>a.status==="rejected").length, c: "#f87171" }, { l: "Recovery Accounts", v: recovery.length, c: "#a5b4fc" }].map(s => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${s.v > 0 && s.c === "#fbbf24" ? "rgba(251,191,36,.3)" : T.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {([["approvals", "Approval Workflow", GitPullRequest], ["recovery", "Recovery Accounts", ShieldAlert]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: `1px solid ${tab === t ? A1 : T.border}`, background: tab === t ? `${A1}18` : T.card, color: tab === t ? T.badgeFg : T.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Icon size={14} /> {label} {t === "approvals" && pending > 0 && <span style={{ background: "#fbbf24", color: "#000", borderRadius: 9, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{pending}</span>}
          </button>
        ))}
      </div>

      {tab === "approvals" && (
        <>
          {/* New request form */}
          {showNewRequest && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 14 }}>
              <h3 style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: "0 0 14px" }}>Submit for Dual Approval</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>ACTION DESCRIPTION *</label>
                  <Input value={newReq.action} onChange={e => setNewReq(r => ({ ...r, action: e.target.value }))} placeholder="Describe the action requiring approval" style={inp()} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>CATEGORY</label>
                  <select value={newReq.category} onChange={e => setNewReq(r => ({ ...r, category: e.target.value as ApprovalRequest["category"] }))} style={{ ...inp(), width: "100%", padding: "9px 12px", fontSize: 13 }}>
                    {["Financial","Security","User Management","System","Data"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>RISK LEVEL</label>
                  <select value={newReq.risk} onChange={e => setNewReq(r => ({ ...r, risk: e.target.value as ApprovalRequest["risk"] }))} style={{ ...inp(), width: "100%", padding: "9px 12px", fontSize: 13 }}>
                    <option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>REASON / JUSTIFICATION</label>
                  <Input value={newReq.reason} onChange={e => setNewReq(r => ({ ...r, reason: e.target.value }))} placeholder="Why is this action needed?" style={inp()} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={submitNewRequest} style={{ padding: "8px 18px", borderRadius: 9, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Submit Request</button>
                <button onClick={() => setShowNewRequest(false)} style={{ padding: "8px 14px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {(["pending","approved","rejected","all"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === f ? A1 : T.border}`, background: filter === f ? `${A1}18` : T.card, color: filter === f ? T.badgeFg : T.sub, textTransform: "capitalize" }}>{f} {f !== "all" && `(${approvals.filter(a => a.status === f).length})`}</button>
            ))}
          </div>

          {/* Approvals list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(req => (
              <div key={req.id} style={{ background: T.card, border: `1px solid ${req.status === "pending" ? "rgba(251,191,36,.25)" : T.border}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: riskBg[req.risk], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {req.status === "pending" ? <Clock size={16} color={riskColor[req.risk]} /> : req.status === "approved" ? <CheckCircle2 size={16} color="#4ade80" /> : <XCircle size={16} color="#f87171" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{req.action}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: riskColor[req.risk], background: riskBg[req.risk], padding: "2px 7px", borderRadius: 5, textTransform: "uppercase" }}>{req.risk}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: catColor[req.category] || T.badgeFg, background: T.input, padding: "2px 7px", borderRadius: 5 }}>{req.category}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[req.status], background: `${statusColor[req.status]}15`, padding: "2px 8px", borderRadius: 5, textTransform: "capitalize" }}>{req.status}</span>
                    </div>
                    <p style={{ fontSize: 12, color: T.sub, margin: "0 0 4px" }}><strong style={{ color: T.text }}>{req.requestedBy}</strong> · {req.target} · {safeFmt(req.requestedAt, "MMM d, HH:mm")}</p>
                    <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>Reason: {req.reason}</p>
                    {req.notes && <p style={{ fontSize: 11, color: "#fbbf24", margin: "4px 0 0" }}>Note: {req.notes}</p>}
                    {req.resolvedBy && <p style={{ fontSize: 11, color: T.sub, margin: "4px 0 0" }}>Resolved by {req.resolvedBy} at {safeFmt(req.resolvedAt!, "MMM d, HH:mm")}</p>}
                  </div>
                </div>
                {req.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                    <Input value={resolveId === req.id ? resolveNotes : ""} onChange={e => { setResolveId(req.id); setResolveNotes(e.target.value); }} placeholder="Add notes before approving/rejecting…" style={{ ...inp(), flex: 1, fontSize: 12 }} />
                    <button onClick={() => { setResolveId(req.id); setResolveAction("approved"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 9, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button onClick={() => { setResolveId(req.id); setResolveAction("rejected"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 9, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "recovery" && (
        <>
          <div style={{ background: "rgba(251,191,36,.05)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.6 }}>Recovery accounts are emergency backdoor admin access points. Keep at least 2 active super admins and 1 emergency recovery account to prevent lockout. These credentials should be stored securely offline.</p>
          </div>
          {showAddRecovery && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 12 }}>
              <h3 style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: "0 0 12px" }}>Add Recovery Account</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>FULL NAME *</label><Input value={newRecovery.name} onChange={e => setNewRecovery(r => ({ ...r, name: e.target.value }))} placeholder="Recovery Admin Name" style={inp()} /></div>
                <div><label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>EMAIL *</label><Input value={newRecovery.email} onChange={e => setNewRecovery(r => ({ ...r, email: e.target.value }))} placeholder="recovery@example.com" style={inp()} /></div>
                <div><label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>ROLE</label><select value={newRecovery.role} onChange={e => setNewRecovery(r => ({ ...r, role: e.target.value as RecoveryAccount["role"] }))} style={{ ...inp(), width: "100%", padding: "9px 12px", fontSize: 13 }}><option value="super_admin">Super Admin</option><option value="emergency">Emergency Recovery</option></select></div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={addRecovery} style={{ padding: "8px 18px", borderRadius: 9, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Add Account</button>
                <button onClick={() => setShowAddRecovery(false)} style={{ padding: "8px 14px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button onClick={() => setShowAddRecovery(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><UserPlus size={13} /> Add Recovery Account</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recovery.map(acc => (
              <div key={acc.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: acc.role === "super_admin" ? `${A1}18` : "rgba(251,191,36,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {acc.role === "super_admin" ? <Star size={17} color={A1} /> : <Zap size={17} color="#fbbf24" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{acc.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: acc.role === "super_admin" ? T.badgeFg : "#fbbf24", background: acc.role === "super_admin" ? `${A1}18` : "rgba(251,191,36,.1)", padding: "2px 7px", borderRadius: 5, textTransform: "uppercase" }}>{acc.role === "super_admin" ? "Super Admin" : "Emergency"}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: acc.isActive ? "#4ade80" : "#f87171", background: acc.isActive ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", padding: "2px 7px", borderRadius: 5 }}>{acc.isActive ? "ACTIVE" : "INACTIVE"}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>{acc.email} · Added {safeFmt(acc.createdAt, "MMM d, yyyy")}{acc.lastUsed ? ` · Last used ${safeFmt(acc.lastUsed, "MMM d")}` : ""}</p>
                </div>
                <button onClick={() => setConfirmToggle(acc)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 9, background: acc.isActive ? "rgba(248,113,113,.08)" : "rgba(74,222,128,.08)", border: `1px solid ${acc.isActive ? "rgba(248,113,113,.2)" : "rgba(74,222,128,.2)"}`, color: acc.isActive ? "#f87171" : "#4ade80", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {acc.isActive ? <><Lock size={12} /> Deactivate</> : <><Unlock size={12} /> Activate</>}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmActionDialog open={!!resolveAction} onOpenChange={o => { if (!o) { setResolveAction(null); setResolveId(null); } }}
        onConfirm={() => resolveId && resolveAction && resolve(resolveId, resolveAction)}
        title={resolveAction === "approved" ? "Approve Request" : "Reject Request"}
        description={`You are about to ${resolveAction === "approved" ? "approve" : "reject"} this sensitive action. This will be logged in the audit trail.`}
        confirmLabel={resolveAction === "approved" ? "Confirm Approve" : "Confirm Reject"}
        variant={resolveAction === "approved" ? "warning" : "danger"} />
      <ConfirmActionDialog open={!!confirmToggle} onOpenChange={o => !o && setConfirmToggle(null)}
        onConfirm={() => { if (confirmToggle) { const r = recovery.map(a => a.id === confirmToggle.id ? { ...a, isActive: !a.isActive } : a); persistRecovery(r); toast({ title: `Account ${confirmToggle.isActive ? "deactivated" : "activated"}` }); setConfirmToggle(null); } }}
        title={`${confirmToggle?.isActive ? "Deactivate" : "Activate"} Recovery Account`}
        description={`This will ${confirmToggle?.isActive ? "remove" : "restore"} emergency access for ${confirmToggle?.email}.`}
        confirmLabel={confirmToggle?.isActive ? "Deactivate" : "Activate"} variant="warning" />
    </div>
  );
}
