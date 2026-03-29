import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC, ROLE_PERMISSIONS, type AdminRole } from "@/hooks/use-rbac";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import TotpSetupCard from "@/components/admin/TotpSetupCard";
import ConfirmationDialog from "@/components/admin/security/ConfirmationDialog";
import { toast } from "sonner";
import {
  ShieldCheck, Users, Globe, Lock, Clock, Smartphone, FileText,
  KeyRound, AlertTriangle, Bell, Loader2, Save, Plus, Trash2, Search,
  X, Shield, Eye, EyeOff, UserCheck, Ban,
} from "lucide-react";

const ROLES: { value: AdminRole; label: string; description: string }[] = [
  { value: "super_admin", label: "Super Admin", description: "Full system access including database, env vars, and server controls" },
  { value: "admin", label: "Admin", description: "User management, settings, backups, and audit logs" },
  { value: "operator", label: "Operator", description: "View audit logs and system health only" },
  { value: "viewer", label: "Viewer", description: "Read-only access to system health dashboard" },
];

const SecurityCenter = () => {
  const { user, profile } = useAuth();
  const { role, permissions } = useRBAC();
  const { logActivity } = useActivityLogger();

  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // IP Whitelist
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [ipLoading, setIpLoading] = useState(true);

  // Login limits
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [lockoutMinutes, setLockoutMinutes] = useState("15");

  // Session settings
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState("30");
  const [deviceVerification, setDeviceVerification] = useState(false);

  // Password policy
  const [minPasswordLength, setMinPasswordLength] = useState("8");
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);

  // Security alerts
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [configChangeAlerts, setConfigChangeAlerts] = useState(true);

  // RBAC - admin list
  const [adminUsers, setAdminUsers] = useState<{ id: string; email: string; role: AdminRole }[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // Dialogs
  const [removeIpDialog, setRemoveIpDialog] = useState<{ open: boolean; ip: string }>({ open: false, ip: "" });

  const [saving, setSaving] = useState<string | null>(null);

  // Security stats
  const [stats, setStats] = useState({
    totalLogins: 0,
    failedAttempts: 0,
    activeSessionsCount: 0,
    blockedIps: 0,
    auditEvents24h: 0,
  });

  useEffect(() => {
    fetchSecuritySettings();
    fetchSecurityStats();
    fetchAdminUsers();
  }, []);

  const fetchSecuritySettings = async () => {
    setIpLoading(true);
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "ip_whitelist",
          "ip_whitelist_enabled",
          "max_login_attempts",
          "lockout_minutes",
          "session_timeout_minutes",
          "device_verification_enabled",
          "min_password_length",
          "require_uppercase",
          "require_numbers",
          "require_special_chars",
          "email_alerts_enabled",
          "login_alerts_enabled",
          "config_change_alerts_enabled",
        ]);

      if (data) {
        for (const row of data) {
          switch (row.key) {
            case "ip_whitelist":
              setIpWhitelist(row.value ? JSON.parse(row.value) : []);
              break;
            case "ip_whitelist_enabled":
              setIpWhitelistEnabled(row.value === "true");
              break;
            case "max_login_attempts":
              setMaxLoginAttempts(row.value);
              break;
            case "lockout_minutes":
              setLockoutMinutes(row.value);
              break;
            case "session_timeout_minutes":
              setSessionTimeoutMin(row.value);
              break;
            case "device_verification_enabled":
              setDeviceVerification(row.value === "true");
              break;
            case "min_password_length":
              setMinPasswordLength(row.value);
              break;
            case "require_uppercase":
              setRequireUppercase(row.value !== "false");
              break;
            case "require_numbers":
              setRequireNumbers(row.value !== "false");
              break;
            case "require_special_chars":
              setRequireSpecialChars(row.value !== "false");
              break;
            case "email_alerts_enabled":
              setEmailAlerts(row.value !== "false");
              break;
            case "login_alerts_enabled":
              setLoginAlerts(row.value !== "false");
              break;
            case "config_change_alerts_enabled":
              setConfigChangeAlerts(row.value !== "false");
              break;
          }
        }
      }
    } catch {
      // Use defaults
    } finally {
      setIpLoading(false);
    }
  };

  const fetchSecurityStats = async () => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [auditRes, blockedRes] = await Promise.all([
        supabase
          .from("admin_audit_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", yesterday),
        supabase
          .from("app_settings")
          .select("value")
          .eq("key", "blocked_ips_count")
          .maybeSingle(),
      ]);

      setStats({
        totalLogins: 0,
        failedAttempts: 0,
        activeSessionsCount: 0,
        blockedIps: blockedRes.data ? parseInt(blockedRes.data.value) || 0 : 0,
        auditEvents24h: auditRes.count || 0,
      });
    } catch {
      // Use defaults
    }
  };

  const fetchAdminUsers = async () => {
    setAdminLoading(true);
    try {
      const { data: settings } = await supabase
        .from("app_settings")
        .select("key, value")
        .like("key", "admin_role_%");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .eq("user_type", "admin");

      if (profiles) {
        const roleMap: Record<string, string> = {};
        if (settings) {
          for (const s of settings) {
            const userId = s.key.replace("admin_role_", "");
            roleMap[userId] = s.value;
          }
        }

        setAdminUsers(
          profiles.map((p) => ({
            id: p.user_id,
            email: p.email,
            role: (roleMap[p.user_id] as AdminRole) || "admin",
          }))
        );
      }
    } catch {
      // Use defaults
    } finally {
      setAdminLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string, label: string) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
      toast.success(`${label} saved`);
      logActivity({ action: "settings_change", details: { key, value, label } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleAddIp = async () => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(newIp.trim())) {
      toast.error("Enter a valid IP address (e.g., 192.168.1.1 or 10.0.0.0/24)");
      return;
    }
    if (ipWhitelist.includes(newIp.trim())) {
      toast.error("IP already in whitelist");
      return;
    }
    const updated = [...ipWhitelist, newIp.trim()];
    setIpWhitelist(updated);
    setNewIp("");
    await saveSetting("ip_whitelist", JSON.stringify(updated), "IP Whitelist");
    logActivity({ action: "ip_whitelist_change", details: { added: newIp.trim() } });
  };

  const handleRemoveIp = async (ip: string) => {
    const updated = ipWhitelist.filter((i) => i !== ip);
    setIpWhitelist(updated);
    setRemoveIpDialog({ open: false, ip: "" });
    await saveSetting("ip_whitelist", JSON.stringify(updated), "IP Whitelist");
    logActivity({ action: "ip_whitelist_change", details: { removed: ip } });
  };

  const handleRoleChange = async (targetAuthUserId: string, newRole: AdminRole) => {
    const prev =
      adminUsers.find((u) => u.id === targetAuthUserId)?.role ?? "admin";
    if (!profile?.id) return;
    try {
      const { data: dualRow } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "dual_approval_enabled")
        .maybeSingle();
      const dual = dualRow?.value === "true";
      const sensitive = newRole === "super_admin" || prev === "super_admin";

      if (dual && sensitive) {
        const { error } = await supabase.from("admin_pending_actions").insert({
          action_type: "role_change",
          title: `Role change: ${prev} → ${newRole}`,
          payload: { targetAuthUserId, newRole, oldRole: prev },
          requested_by: profile.id,
          status: "pending",
        });
        if (error) throw error;
        toast.success("Queued for second approver");
        logActivity({
          action: "pending_action_created",
          details: { targetAuthUserId, newRole, oldRole: prev },
        });
        return;
      }

      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: `admin_role_${targetAuthUserId}`, value: newRole },
          { onConflict: "key" }
        );
      if (error) throw error;

      await supabase.from("admin_permission_change_log").insert({
        changed_by: profile.id,
        target_auth_user_id: targetAuthUserId,
        old_role: prev,
        new_role: newRole,
      });

      setAdminUsers((prevU) =>
        prevU.map((u) => (u.id === targetAuthUserId ? { ...u, role: newRole } : u))
      );
      toast.success("Role updated");
      logActivity({
        action: "role_change",
        details: { userId: targetAuthUserId, newRole, oldRole: prev },
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredAdmins = adminUsers.filter((a) =>
    adminSearch ? a.email.toLowerCase().includes(adminSearch.toLowerCase()) : true
  );

  const securityScore = (() => {
    let score = 0;
    if (ipWhitelistEnabled) score += 15;
    if (parseInt(maxLoginAttempts) <= 5) score += 10;
    if (parseInt(sessionTimeoutMin) <= 30) score += 10;
    if (deviceVerification) score += 15;
    if (parseInt(minPasswordLength) >= 8) score += 10;
    if (requireUppercase) score += 5;
    if (requireNumbers) score += 5;
    if (requireSpecialChars) score += 10;
    if (emailAlerts) score += 10;
    if (loginAlerts) score += 5;
    if (configChangeAlerts) score += 5;
    return Math.min(score, 100);
  })();

  const scoreColor =
    securityScore >= 80
      ? "text-green-600"
      : securityScore >= 50
      ? "text-amber-500"
      : "text-destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Security Center</h2>
          <p className="text-sm text-muted-foreground">
            Manage security policies, access controls, and monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            {role?.replace("_", " ").toUpperCase() || "ADMIN"}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="access" className="text-xs">Access Control</TabsTrigger>
          <TabsTrigger value="auth" className="text-xs">Authentication</TabsTrigger>
          <TabsTrigger value="network" className="text-xs">Network</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {/* Security Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                  <p className={`text-4xl font-bold ${scoreColor}`}>{securityScore}/100</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {securityScore >= 80
                      ? "Strong security posture"
                      : securityScore >= 50
                      ? "Some improvements recommended"
                      : "Critical improvements needed"}
                  </p>
                </div>
                <div className="relative h-20 w-20">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18" cy="18" r="16"
                      fill="none" stroke="currentColor"
                      className="text-muted/30" strokeWidth="3"
                    />
                    <circle
                      cx="18" cy="18" r="16"
                      fill="none" stroke="currentColor"
                      className={scoreColor}
                      strokeWidth="3"
                      strokeDasharray={`${securityScore} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <ShieldCheck className={`absolute inset-0 m-auto h-6 w-6 ${scoreColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.auditEvents24h}</p>
                    <p className="text-xs text-muted-foreground">Audit Events (24h)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-500/10 p-2">
                    <Ban className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.blockedIps}</p>
                    <p className="text-xs text-muted-foreground">Blocked IPs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <Users className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{adminUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Admin Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2">
                    <Globe className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{ipWhitelist.length}</p>
                    <p className="text-xs text-muted-foreground">Whitelisted IPs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Security Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Two-Factor Authentication (2FA)", done: true, tab: "auth" },
                { label: "Role-Based Access Control", done: true, tab: "access" },
                { label: "IP Address Whitelisting", done: ipWhitelistEnabled, tab: "network" },
                { label: "Login Attempt Limiting", done: parseInt(maxLoginAttempts) <= 10, tab: "auth" },
                { label: "Session Timeout", done: parseInt(sessionTimeoutMin) <= 60, tab: "auth" },
                { label: "Device Verification", done: deviceVerification, tab: "auth" },
                { label: "Strong Password Policy", done: parseInt(minPasswordLength) >= 8 && requireSpecialChars, tab: "auth" },
                { label: "Security Alert Notifications", done: emailAlerts, tab: "alerts" },
                { label: "Activity Audit Logging", done: true, tab: "overview" },
                { label: "Data Encryption", done: true, tab: "overview" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setActiveTab(item.tab)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        item.done ? "bg-green-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge variant={item.done ? "default" : "secondary"} className="text-[10px]">
                    {item.done ? "Active" : "Configure"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACCESS CONTROL TAB */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Role-Based Access Control (RBAC)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assign roles to admin users. Only Super Admin can change database, environment variables, and server controls.
              </p>

              {/* Role Definitions */}
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLES.map((r) => (
                  <div
                    key={r.value}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={r.value === "super_admin" ? "destructive" : r.value === "admin" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {r.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(ROLE_PERMISSIONS[r.value])
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <Badge key={k} variant="outline" className="text-[9px]">
                            {k.replace(/^can/, "").replace(/([A-Z])/g, " $1").trim()}
                          </Badge>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Users List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">Admin Users</h4>
                  <div className="relative ml-auto flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search admins..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="h-8 pl-9 text-xs"
                    />
                  </div>
                </div>

                {adminLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ScrollArea className="max-h-60">
                    <div className="space-y-2">
                      {filteredAdmins.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{admin.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {admin.id === user?.id ? "(You)" : ""}
                            </p>
                          </div>
                          <Select
                            value={admin.role}
                            onValueChange={(v) => handleRoleChange(admin.id, v as AdminRole)}
                            disabled={role !== "super_admin" || admin.id === user?.id}
                          >
                            <SelectTrigger className="w-36 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                      {filteredAdmins.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          No admin users found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUTHENTICATION TAB */}
        <TabsContent value="auth" className="space-y-4">
          {/* 2FA Setup */}
          <TotpSetupCard />

          {/* Login Attempts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-primary" />
                Login Attempt Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Lock accounts after too many failed login attempts to prevent brute-force attacks.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Max Failed Attempts</Label>
                  <Input
                    type="number" min="3" max="20"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Lockout Duration (minutes)</Label>
                  <Input
                    type="number" min="5" max="120"
                    value={lockoutMinutes}
                    onChange={(e) => setLockoutMinutes(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  saveSetting("max_login_attempts", maxLoginAttempts, "Max login attempts");
                  saveSetting("lockout_minutes", lockoutMinutes, "Lockout duration");
                }}
                disabled={saving !== null}
                className="gap-1"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </CardContent>
          </Card>

          {/* Session Timeout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Session Timeout & Auto Logout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Automatically log out inactive admin sessions to prevent unauthorized access.
              </p>
              <div>
                <Label>Inactivity Timeout (minutes)</Label>
                <Input
                  type="number" min="5" max="480"
                  value={sessionTimeoutMin}
                  onChange={(e) => setSessionTimeoutMin(e.target.value)}
                />
              </div>
              <Button
                onClick={() => saveSetting("session_timeout_minutes", sessionTimeoutMin, "Session timeout")}
                disabled={saving !== null}
                className="gap-1"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </CardContent>
          </Card>

          {/* Device Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4 text-primary" />
                Device Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Require verification when logging in from a new device or browser.
              </p>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Enable device verification for admin logins</Label>
                <Switch
                  checked={deviceVerification}
                  onCheckedChange={async (checked) => {
                    setDeviceVerification(checked);
                    await saveSetting("device_verification_enabled", String(checked), "Device verification");
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Password Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4 text-primary" />
                Password Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enforce strong password requirements for all admin accounts.
              </p>
              <div>
                <Label>Minimum Password Length</Label>
                <Input
                  type="number" min="6" max="32"
                  value={minPasswordLength}
                  onChange={(e) => setMinPasswordLength(e.target.value)}
                />
              </div>
              {[
                { label: "Require uppercase letters", key: "require_uppercase", checked: requireUppercase, set: setRequireUppercase },
                { label: "Require numbers", key: "require_numbers", checked: requireNumbers, set: setRequireNumbers },
                { label: "Require special characters (!@#$%)", key: "require_special_chars", checked: requireSpecialChars, set: setRequireSpecialChars },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                  <Label className="text-sm">{item.label}</Label>
                  <Switch
                    checked={item.checked}
                    onCheckedChange={(checked) => {
                      item.set(checked);
                      saveSetting(item.key, String(checked), item.label);
                    }}
                  />
                </div>
              ))}
              <Button
                onClick={() => saveSetting("min_password_length", minPasswordLength, "Min password length")}
                disabled={saving !== null}
                className="gap-1"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Password Length
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NETWORK TAB */}
        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-primary" />
                IP Address Whitelisting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Only allow admin access from trusted IP addresses. Supports individual IPs and CIDR ranges.
              </p>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Enable IP Whitelisting</Label>
                <Switch
                  checked={ipWhitelistEnabled}
                  onCheckedChange={async (checked) => {
                    setIpWhitelistEnabled(checked);
                    await saveSetting("ip_whitelist_enabled", String(checked), "IP Whitelisting");
                  }}
                />
              </div>

              {ipWhitelistEnabled && (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter IP address (e.g., 192.168.1.1)"
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddIp();
                      }}
                    />
                    <Button onClick={handleAddIp} className="gap-1 shrink-0">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {ipWhitelist.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No IPs whitelisted. Add trusted IPs above.
                      </p>
                    ) : (
                      ipWhitelist.map((ip) => (
                        <div
                          key={ip}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <code className="text-sm font-mono">{ip}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-destructive hover:text-destructive"
                            onClick={() => setRemoveIpDialog({ open: true, ip })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {!ipWhitelistEnabled && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  IP Whitelisting is disabled
                </p>
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
                  Enable IP whitelisting to restrict admin panel access to trusted IP addresses only. This significantly reduces the risk of unauthorized access.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ALERTS TAB */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-primary" />
                Security Alert Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure when security alert notifications are sent to admin users.
              </p>

              {[
                {
                  label: "Email notifications for critical security events",
                  description: "Receive alerts for unauthorized access attempts, account lockouts, and system changes",
                  key: "email_alerts_enabled",
                  checked: emailAlerts,
                  set: setEmailAlerts,
                },
                {
                  label: "Login attempt alerts",
                  description: "Notify when failed login attempts exceed the configured limit",
                  key: "login_alerts_enabled",
                  checked: loginAlerts,
                  set: setLoginAlerts,
                },
                {
                  label: "Configuration change alerts",
                  description: "Notify when system configuration, environment variables, or security settings are modified",
                  key: "config_change_alerts_enabled",
                  checked: configChangeAlerts,
                  set: setConfigChangeAlerts,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div>
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={item.checked}
                    onCheckedChange={async (checked) => {
                      item.set(checked);
                      await saveSetting(item.key, String(checked), item.label);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConfirmationDialog
        open={removeIpDialog.open}
        onOpenChange={(v) => setRemoveIpDialog({ ...removeIpDialog, open: v })}
        title="Remove IP from Whitelist"
        description={`Are you sure you want to remove ${removeIpDialog.ip} from the whitelist? This may lock out users connecting from this IP.`}
        variant="destructive"
        confirmLabel="Remove"
        onConfirm={() => handleRemoveIp(removeIpDialog.ip)}
      />
    </div>
  );
};

export default SecurityCenter;
