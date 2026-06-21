import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Shield, ShieldCheck, ShieldAlert, Activity, Database, Server, Clock, Lock, Unlock,
  AlertTriangle, CheckCircle2, XCircle, Wrench, Power, RefreshCw, Eye, Users, Wifi,
  WifiOff, KeyRound, LogOut, Bell, ChevronRight, Settings, ClipboardList, Crown,
  ToggleLeft, ToggleRight, Zap, Globe, Terminal,
} from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAudit } from "@/hooks/use-admin-audit";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { safeFmt, safeDist } from "@/lib/admin-date";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const MAINTENANCE_KEY = "admin_maintenance_mode";
const SESSION_TIMEOUT_KEY = "admin_session_timeout_min";
const CONFIG_HISTORY_KEY = "admin_config_history";

interface ConfigEntry { id: string; timestamp: string; by: string; key: string; change: string; }

function getConfigHistory(): ConfigEntry[] {
  try { return JSON.parse(localStorage.getItem(CONFIG_HISTORY_KEY) || "[]"); } catch { return []; }
}

function addConfigEntry(by: string, key: string, change: string) {
  const existing = getConfigHistory();
  const entry: ConfigEntry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), by, key, change };
  const updated = [entry, ...existing].slice(0, 20);
  localStorage.setItem(CONFIG_HISTORY_KEY, JSON.stringify(updated));
}

export default function AdminSafetyCenter() {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction, getLogs } = useAdminAudit();
  const { toast } = useToast();

  const [maintenance, setMaintenance] = useState(() => localStorage.getItem(MAINTENANCE_KEY) === "true");
  const [sessionTimeout, setSessionTimeout] = useState(() => parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY) || "30"));
  const [dbStatus, setDbStatus] = useState<"checking" | "online" | "offline">("checking");
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: string }>({ open: false, type: "" });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const adminName = (profile as unknown as { full_name?: string[]; email?: string } | null)?.full_name?.[0] || (profile as unknown as { email?: string } | null)?.email || "Admin";

  const auditLogs = getLogs();
  const configHistory = getConfigHistory();

  const checkDb = useCallback(async () => {
    setDbStatus("checking");
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      setDbStatus(error ? "offline" : "online");
    } catch { setDbStatus("offline"); }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await checkDb();
      await queryClient.refetchQueries({ queryKey: ["safety-sessions"] });
      await queryClient.refetchQueries({ queryKey: ["safety-ip-blocks"] });
      await queryClient.refetchQueries({ queryKey: ["safety-pending-wd"] });
      toast({ title: "System health refreshed", description: "All metrics have been updated." });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, checkDb, queryClient, toast]);

  useEffect(() => { checkDb(); }, [checkDb]);

  const { data: activeSessions = 0 } = useQuery({
    queryKey: ["safety-sessions"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", since);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: ipBlockCount = 0 } = useQuery({
    queryKey: ["safety-ip-blocks"],
    queryFn: async () => {
      const { count } = await supabase.from("blocked_ips").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: pendingWithdrawals = 0 } = useQuery({
    queryKey: ["safety-pending-wd"],
    queryFn: async () => {
      const { count } = await supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
  });

  const criticalAlerts = auditLogs.filter(l => l.status === "critical").length;
  const recentWarnings = auditLogs.filter(l => l.status === "warning" && Date.now() - new Date(l.timestamp).getTime() < 86400000).length;

  const toggleMaintenance = () => {
    const newVal = !maintenance;
    setMaintenance(newVal);
    localStorage.setItem(MAINTENANCE_KEY, String(newVal));
    addConfigEntry(adminName, "Maintenance Mode", newVal ? "Enabled" : "Disabled");
    logAction("Maintenance Mode " + (newVal ? "Enabled" : "Disabled"), `Platform maintenance mode was ${newVal ? "activated" : "deactivated"}`, "System", newVal ? "warning" : "success");
    toast({ title: `Maintenance Mode ${newVal ? "Enabled" : "Disabled"}`, description: newVal ? "New logins will be blocked during maintenance." : "Platform is back online." });
    setConfirmModal({ open: false, type: "" });
  };

  const handleEmergencyLogout = async () => {
    logAction("Emergency Admin Logout", "Admin triggered emergency logout from Safety Center", "Security", "warning");
    await signOut();
    navigate("/login");
  };

  const updateSessionTimeout = (val: number) => {
    setSessionTimeout(val);
    localStorage.setItem(SESSION_TIMEOUT_KEY, String(val));
    addConfigEntry(adminName, "Session Timeout", `Set to ${val} minutes`);
    logAction("Session Timeout Updated", `Admin session timeout changed to ${val} minutes`, "Security", "success");
    toast({ title: "Session timeout updated", description: `Auto-logout after ${val} minutes of inactivity.` });
  };

  const statusBg = { checking: "rgba(251,191,36,.12)", online: "rgba(74,222,128,.12)", offline: "rgba(248,113,113,.12)" };
  const statusColor = { checking: "#fbbf24", online: "#4ade80", offline: "#f87171" };
  const StatusIcon = { checking: RefreshCw, online: CheckCircle2, offline: XCircle };

  const SIcon = StatusIcon[dbStatus];

  const quickLinks = [
    { label: "Audit Logs", icon: ClipboardList, path: "/admin/audit-logs", color: "#a5b4fc", count: auditLogs.length },
    { label: "RBAC & Roles", icon: Crown, path: "/admin/rbac", color: "#fbbf24", count: null },
    { label: "IP Blocking", icon: Shield, path: "/admin/ip-blocking", color: "#f87171", count: ipBlockCount },
    { label: "Sessions", icon: Users, path: "/admin/sessions", color: "#4ade80", count: activeSessions },
    { label: "Settings", icon: Settings, path: "/admin/settings", color: "#94a3b8", count: null },
    { label: "Online Status", icon: Wifi, path: "/admin/online-status", color: "#34d399", count: null },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${A1}22 0%,${A2}15 100%)`, border: `1px solid rgba(99,102,241,.2)`, borderRadius: 18, padding: "28px 28px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: 200, height: 200, background: `radial-gradient(circle at top right,${A2}12,transparent 70%)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 28px ${A1}55`, flexShrink: 0 }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: -0.5 }}>System Safety Center</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: "3px 0 0" }}>Risk mitigation, access control, and system health monitoring</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {maintenance && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(251,191,36,.15)", border: "1px solid rgba(251,191,36,.3)" }}>
                <Wrench size={12} color="#fbbf24" />
                <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>MAINTENANCE</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10, background: isRefreshing ? `${A1}22` : T.card, border: `1px solid ${isRefreshing ? A1 : T.border}`, color: isRefreshing ? "#a5b4fc" : T.sub, fontSize: 12, fontWeight: 600, cursor: isRefreshing ? "not-allowed" : "pointer", transition: "all .2s", minWidth: 90 }}
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Status strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
          {[
            { label: "Database", value: dbStatus, icon: Database, color: statusColor[dbStatus], bg: statusBg[dbStatus], icon2: SIcon },
            { label: "Active Sessions", value: activeSessions + " online", icon: Users, color: "#4ade80", bg: "rgba(74,222,128,.1)", icon2: Activity },
            { label: "IP Blocks", value: ipBlockCount + " blocked", icon: Shield, color: "#f87171", bg: "rgba(248,113,113,.1)", icon2: Lock },
            { label: "Pending Withdrawals", value: pendingWithdrawals + " pending", icon: Clock, color: "#fbbf24", bg: "rgba(251,191,36,.1)", icon2: AlertTriangle },
            { label: "Critical Alerts", value: criticalAlerts + " total", icon: ShieldAlert, color: criticalAlerts > 0 ? "#f87171" : "#4ade80", bg: criticalAlerts > 0 ? "rgba(248,113,113,.1)" : "rgba(74,222,128,.1)", icon2: criticalAlerts > 0 ? ShieldAlert : CheckCircle2 },
          ].map(item => (
            <div key={item.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <item.icon size={13} color={item.color} />
                <span style={{ fontSize: 10, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: .8 }}>{item.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <item.icon2 size={14} color={item.color} className={item.label === "Database" && dbStatus === "checking" ? "animate-spin" : ""} />
                <span style={{ fontWeight: 700, fontSize: 13, color: item.color, textTransform: "capitalize" }}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Maintenance Mode */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <Wrench size={16} color="#fbbf24" />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Maintenance Mode</h2>
          </div>
          <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, marginBottom: 16 }}>
            When enabled, regular users cannot access the platform. Only Super Admins retain access. A maintenance notice is shown to all visitors.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: maintenance ? "rgba(251,191,36,.08)" : "rgba(255,255,255,.03)", border: `1px solid ${maintenance ? "rgba(251,191,36,.25)" : T.border}`, borderRadius: 12, padding: "12px 16px" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: maintenance ? "#fbbf24" : T.text, margin: 0 }}>{maintenance ? "MAINTENANCE ACTIVE" : "Platform Online"}</p>
              <p style={{ fontSize: 11, color: T.sub, margin: "2px 0 0" }}>{maintenance ? "Users cannot log in" : "All systems operational"}</p>
            </div>
            <button onClick={() => setConfirmModal({ open: true, type: "maintenance" })}
              style={{ background: "none", border: "none", cursor: "pointer", color: maintenance ? "#fbbf24" : T.sub }}>
              {maintenance ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </button>
          </div>
        </div>

        {/* Session Timeout */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <Clock size={16} color="#a5b4fc" />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Session Timeout</h2>
          </div>
          <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, marginBottom: 16 }}>
            Automatically log out admin sessions after a period of inactivity. Shorter timeouts reduce risk of unauthorized access.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[15, 30, 60, 120].map(min => (
              <button key={min} onClick={() => updateSessionTimeout(min)}
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${sessionTimeout === min ? A1 : T.border}`, background: sessionTimeout === min ? `${A1}22` : T.input, color: sessionTimeout === min ? T.badgeFg : T.sub, transition: "all .15s" }}>
                {min}m
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: T.sub, marginTop: 10 }}>Current: <span style={{ color: T.badgeFg, fontWeight: 700 }}>{sessionTimeout} minutes</span></p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Security Controls Overview */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <ShieldCheck size={16} color="#4ade80" />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Security Controls</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Two-Factor Authentication", status: "active", icon: KeyRound, note: "TOTP enabled for admins" },
              { label: "IP Address Blocking", status: "active", icon: Shield, note: `${ipBlockCount} IPs blocked` },
              { label: "Session Management", status: "active", icon: Users, note: `${activeSessions} active sessions` },
              { label: "Activity Audit Logging", status: "active", icon: ClipboardList, note: `${auditLogs.length} entries logged` },
              { label: "Role-Based Access Control", status: "active", icon: Lock, note: "RBAC configured" },
              { label: "Auto Session Timeout", status: "active", icon: Clock, note: `${sessionTimeout} min timeout` },
            ].map(item => {
              const Icon = item.icon;
              const isActive = item.status === "active";
              return (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: isActive ? "rgba(74,222,128,.05)" : "rgba(248,113,113,.05)", border: `1px solid ${isActive ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)"}` }}>
                  <Icon size={13} color={isActive ? "#4ade80" : "#f87171"} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 10, color: T.sub, margin: 0 }}>{item.note}</p>
                  </div>
                  {isActive ? <CheckCircle2 size={13} color="#4ade80" /> : <XCircle size={13} color="#f87171" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Controls */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
            <Zap size={16} color="#f87171" />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Emergency Controls</h2>
          </div>
          <p style={{ fontSize: 11, color: T.sub, marginBottom: 14, lineHeight: 1.5 }}>Critical actions with immediate system-wide effect. Use with extreme caution.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              { label: "Enable Maintenance Mode", desc: "Block all user access immediately", icon: Wrench, color: "#fbbf24", type: "maintenance", disabled: maintenance },
              { label: "Force Logout Current Session", desc: "Sign out of this admin session now", icon: LogOut, color: "#f87171", type: "emergency_logout", disabled: false },
              { label: "Refresh System Health", desc: "Re-check all system connections", icon: RefreshCw, color: "#a5b4fc", type: "refresh", disabled: false },
            ].map(action => {
              const Icon = action.icon;
              return (
                <button key={action.type} disabled={action.disabled}
                  onClick={() => {
                    if (action.type === "refresh") { handleRefresh(); }
                    else setConfirmModal({ open: true, type: action.type });
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11, background: `${action.color}0a`, border: `1px solid ${action.color}25`, cursor: action.disabled ? "not-allowed" : "pointer", opacity: action.disabled ? .4 : 1, textAlign: "left" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${action.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color={action.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0 }}>{action.label}</p>
                    <p style={{ fontSize: 10, color: T.sub, margin: 0 }}>{action.desc}</p>
                  </div>
                  <ChevronRight size={14} color={T.sub} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Quick navigation */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <Globe size={16} color={A1} />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Safety Quick Links</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <button key={link.path} onClick={() => navigate(link.path)}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 11, background: T.input, border: `1px solid ${T.border}`, cursor: "pointer", textAlign: "left" }}>
                  <Icon size={15} color={link.color} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.label}</p>
                    {link.count !== null && <p style={{ fontSize: 10, color: T.sub, margin: 0 }}>{link.count} item{link.count !== 1 ? "s" : ""}</p>}
                  </div>
                  <ChevronRight size={12} color={T.sub} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Config History */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <Terminal size={16} color="#a5b4fc" />
            <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Configuration History</h2>
            <span style={{ marginLeft: "auto", fontSize: 11, color: T.sub }}>{configHistory.length} changes</span>
          </div>
          {configHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: T.sub }}>
              <Terminal size={28} style={{ opacity: .2, marginBottom: 8 }} />
              <p style={{ fontSize: 12 }}>No configuration changes yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {configHistory.slice(0, 6).map(entry => (
                <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 9, background: T.input, border: `1px solid ${T.border}` }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: A1, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.key}: {entry.change}</p>
                    <p style={{ fontSize: 10, color: T.sub, margin: 0 }}>by {entry.by}</p>
                  </div>
                  <span style={{ fontSize: 10, color: T.sub, flexShrink: 0 }}>{safeFmt(entry.timestamp, "MMM d, HH:mm")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <Bell size={16} color="#fbbf24" />
          <h2 style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Recent Security Alerts</h2>
          <button onClick={() => navigate("/admin/audit-logs")}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: T.input, border: `1px solid ${T.border}`, color: T.sub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            View All <ChevronRight size={11} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {auditLogs.filter(l => l.status !== "success").slice(0, 5).length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px", borderRadius: 10, background: "rgba(74,222,128,.05)", border: "1px solid rgba(74,222,128,.12)" }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <p style={{ fontSize: 13, color: "#4ade80", fontWeight: 600, margin: 0 }}>No active alerts — all systems normal</p>
            </div>
          ) : auditLogs.filter(l => l.status !== "success").slice(0, 5).map(entry => (
            <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, background: entry.status === "critical" ? "rgba(248,113,113,.06)" : "rgba(251,191,36,.06)", border: `1px solid ${entry.status === "critical" ? "rgba(248,113,113,.15)" : "rgba(251,191,36,.15)"}` }}>
              {entry.status === "critical" ? <ShieldAlert size={15} color="#f87171" /> : <AlertTriangle size={15} color="#fbbf24" />}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0 }}>{entry.action}</p>
                <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>{entry.details}</p>
              </div>
              <span style={{ fontSize: 11, color: T.sub, flexShrink: 0 }}>{safeFmt(entry.timestamp, "MMM d, HH:mm")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation dialogs */}
      <ConfirmActionDialog
        open={confirmModal.open && confirmModal.type === "maintenance"}
        onOpenChange={o => setConfirmModal({ open: o, type: "" })}
        onConfirm={toggleMaintenance}
        title={maintenance ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
        description={maintenance ? "Platform will be accessible to all users again immediately." : "This will block all regular user access immediately. Only Super Admins will be able to log in. Proceed?"}
        confirmLabel={maintenance ? "Disable" : "Enable Maintenance"} variant="warning" />

      <ConfirmActionDialog
        open={confirmModal.open && confirmModal.type === "emergency_logout"}
        onOpenChange={o => setConfirmModal({ open: o, type: "" })}
        onConfirm={handleEmergencyLogout}
        title="Force Logout Current Session"
        description="You will be immediately signed out of the admin panel. Make sure any unsaved work is saved."
        confirmLabel="Logout Now" variant="danger" />
    </div>
  );
}
