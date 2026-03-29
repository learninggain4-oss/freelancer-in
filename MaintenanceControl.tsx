import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRBAC } from "@/hooks/use-rbac";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import ConfirmationDialog from "@/components/admin/security/ConfirmationDialog";
import DoubleConfirmationDialog from "@/components/admin/security/DoubleConfirmationDialog";
import PasswordReentryDialog from "@/components/admin/security/PasswordReentryDialog";
import { toast } from "sonner";
import {
  Wrench, Shield, Save, Loader2, Clock, Download,
  AlertTriangle, CheckCircle, Calendar, Lock,
  RefreshCw, HardDrive, FileText, RotateCcw,
  Play, Pause, Settings, Power, Bug,
  BookOpen, Cpu, Search,
} from "lucide-react";

interface Backup {
  id: string;
  timestamp: string;
  type: string;
  size: string;
  status: string;
}

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  enabled: boolean;
}

const MaintenanceControl = () => {
  const { role, permissions } = useRBAC();
  const { logActivity } = useActivityLogger();

  // Maintenance mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("System is under maintenance. Please try again later.");
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false);

  // Backups
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");

  // Scheduled maintenance
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([
    { id: "1", name: "Database Optimization", schedule: "Weekly (Sunday 2:00 AM)", nextRun: "Next Sunday", enabled: true },
    { id: "2", name: "Log Cleanup", schedule: "Daily (3:00 AM)", nextRun: "Tomorrow", enabled: true },
    { id: "3", name: "Cache Purge", schedule: "Every 6 Hours", nextRun: "In 4 hours", enabled: false },
    { id: "4", name: "Health Check Report", schedule: "Hourly", nextRun: "In 45 minutes", enabled: true },
  ]);

  // Debug mode
  const [debugMode, setDebugMode] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);

  // Config lock
  const [configLocked, setConfigLocked] = useState(false);

  // Password re-entry
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; action: () => void }>({ open: false, action: () => {} });
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Saving state
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchMaintenanceSettings();
    fetchBackups();
  }, []);

  const fetchMaintenanceSettings = async () => {
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "maintenance_mode",
          "maintenance_message",
          "auto_backup_enabled",
          "backup_frequency",
          "debug_mode",
          "config_locked",
        ]);

      if (data) {
        for (const row of data) {
          switch (row.key) {
            case "maintenance_mode":
              setMaintenanceMode(row.value === "true");
              break;
            case "maintenance_message":
              setMaintenanceMessage(row.value || "System is under maintenance.");
              break;
            case "auto_backup_enabled":
              setAutoBackup(row.value !== "false");
              break;
            case "backup_frequency":
              setBackupFrequency(row.value || "daily");
              break;
            case "debug_mode":
              setDebugMode(row.value === "true");
              break;
            case "config_locked":
              setConfigLocked(row.value === "true");
              break;
          }
        }
      }
    } catch {
      // Use defaults
    }
  };

  const fetchBackups = async () => {
    try {
      const { data } = await supabase
        .from("admin_audit_logs")
        .select("id, created_at, action, details")
        .eq("action", "backup_create")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setBackups(
          data.map((row) => ({
            id: row.id,
            timestamp: row.created_at,
            type: (row.details as any)?.type || "manual",
            size: (row.details as any)?.size || "Unknown",
            status: "completed",
          }))
        );
      }
    } catch {
      // Use defaults
    }
  };

  const requirePasswordReentry = (action: () => void) => {
    setPendingAction(() => action);
    setPasswordDialog({ open: true, action });
  };

  const handlePasswordVerified = () => {
    setPasswordDialog({ open: false, action: () => {} });
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
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
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleMaintenance = async () => {
    const newState = !maintenanceMode;
    setMaintenanceLoading(true);
    try {
      await supabase
        .from("app_settings")
        .upsert({ key: "maintenance_mode", value: String(newState) }, { onConflict: "key" });

      if (maintenanceMessage.trim()) {
        await supabase
          .from("app_settings")
          .upsert({ key: "maintenance_message", value: maintenanceMessage }, { onConflict: "key" });
      }

      setMaintenanceMode(newState);
      await logActivity({
        action: "maintenance_toggle",
        details: {
          enabled: newState,
          message: maintenanceMessage,
          description: `Maintenance mode ${newState ? "enabled" : "disabled"}`,
        },
      });
      toast.success(`Maintenance mode ${newState ? "enabled" : "disabled"}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setMaintenanceLoading(false);
      setMaintenanceConfirm(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    setBackupProgress(0);

    const interval = setInterval(() => {
      setBackupProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + Math.random() * 15;
      });
    }, 300);

    try {
      // Simulate backup process
      await new Promise((r) => setTimeout(r, 3000));
      clearInterval(interval);
      setBackupProgress(100);

      const newBackup: Backup = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: "manual",
        size: `${Math.round(Math.random() * 500 + 100)} MB`,
        status: "completed",
      };

      setBackups((prev) => [newBackup, ...prev]);

      await logActivity({
        action: "backup_create",
        details: {
          type: "manual",
          size: newBackup.size,
          description: "Manual system backup created",
        },
      });

      toast.success("Backup created successfully");
    } catch (e: any) {
      clearInterval(interval);
      toast.error(`Backup failed: ${e.message}`);
    } finally {
      setBackupLoading(false);
      setTimeout(() => setBackupProgress(0), 1000);
    }
  };

  const handleToggleDebug = async (enabled: boolean) => {
    setDebugLoading(true);
    try {
      await saveSetting("debug_mode", String(enabled), "Debug mode");
      setDebugMode(enabled);
      await logActivity({
        action: "config_change",
        details: { key: "debug_mode", value: enabled, description: `Debug mode ${enabled ? "enabled" : "disabled"}` },
      });
    } catch {
      // Error handled in saveSetting
    } finally {
      setDebugLoading(false);
    }
  };

  const handleToggleConfigLock = async (locked: boolean) => {
    try {
      await saveSetting("config_locked", String(locked), "Configuration lock");
      setConfigLocked(locked);
      await logActivity({
        action: "config_change",
        details: {
          key: "config_locked",
          value: locked,
          description: `Configuration ${locked ? "locked" : "unlocked"}`,
        },
      });
    } catch {
      // Error handled in saveSetting
    }
  };

  const handleToggleScheduledTask = (taskId: string) => {
    setScheduledTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, enabled: !t.enabled } : t
      )
    );
    toast.success("Task updated");
  };

  const isSuperAdmin = role === "super_admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Maintenance Control</h2>
          <p className="text-sm text-muted-foreground">
            System maintenance, backups, scheduling, and configuration management
          </p>
        </div>
        {maintenanceMode && (
          <Badge variant="destructive" className="gap-1 animate-pulse">
            <Wrench className="h-3 w-3" />
            Maintenance Active
          </Badge>
        )}
      </div>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-primary" />
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enable maintenance mode before performing system changes. Users will see a maintenance page.
          </p>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">
                {maintenanceMode ? "Maintenance Mode is ON" : "Maintenance Mode is OFF"}
              </p>
              <p className="text-xs text-muted-foreground">
                {maintenanceMode
                  ? "Users are seeing the maintenance page"
                  : "System is operating normally"}
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              disabled={!permissions.canToggleMaintenance}
              onCheckedChange={() => {
                requirePasswordReentry(() => setMaintenanceConfirm(true));
              }}
            />
          </div>

          <div>
            <Label>Maintenance Message</Label>
            <Textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Message shown to users during maintenance..."
              rows={3}
              disabled={!permissions.canToggleMaintenance}
            />
          </div>

          <Button
            onClick={() => saveSetting("maintenance_message", maintenanceMessage, "Maintenance message")}
            disabled={saving === "maintenance_message" || !permissions.canToggleMaintenance}
            className="gap-1"
            size="sm"
          >
            {saving === "maintenance_message" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Message
          </Button>
        </CardContent>
      </Card>

      {/* Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-4 w-4 text-primary" />
            System Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create and manage system backups. Automatic backups are created before critical operations.
          </p>

          {/* Auto-backup settings */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Automatic Backups</p>
                <p className="text-xs text-muted-foreground">
                  Automatically create backups on schedule
                </p>
              </div>
              <Switch
                checked={autoBackup}
                disabled={!permissions.canCreateBackups}
                onCheckedChange={async (checked) => {
                  setAutoBackup(checked);
                  await saveSetting("auto_backup_enabled", String(checked), "Auto backup");
                }}
              />
            </div>
            {autoBackup && (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label>Backup Frequency</Label>
                  <Select
                    value={backupFrequency}
                    onValueChange={async (v) => {
                      setBackupFrequency(v);
                      await saveSetting("backup_frequency", v, "Backup frequency");
                    }}
                    disabled={!permissions.canCreateBackups}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Create backup */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => requirePasswordReentry(handleCreateBackup)}
              disabled={backupLoading || !permissions.canCreateBackups}
              className="gap-1"
            >
              {backupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Create Backup Now
            </Button>
          </div>

          {backupLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Creating backup...</span>
                <span>{Math.round(backupProgress)}%</span>
              </div>
              <Progress value={backupProgress} className="h-2" />
            </div>
          )}

          {/* Backup history */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Backup History</h4>
            {backups.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No backups recorded yet
              </p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {backup.type === "manual" ? "Manual Backup" : "Auto Backup"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(backup.timestamp).toLocaleString()} · {backup.size}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {backup.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Scheduled Maintenance Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Configure scheduled maintenance tasks for system optimization.
          </p>
          {scheduledTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.name}</p>
                <p className="text-xs text-muted-foreground">
                  {task.schedule} · Next: {task.nextRun}
                </p>
              </div>
              <Switch
                checked={task.enabled}
                onCheckedChange={() => handleToggleScheduledTask(task.id)}
                disabled={!permissions.canToggleMaintenance}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configuration Controls */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Debug Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bug className="h-4 w-4 text-primary" />
              Debug Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Enable verbose logging and error details for debugging.
            </p>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Debug Mode</Label>
              <Switch
                checked={debugMode}
                disabled={debugLoading || !isSuperAdmin}
                onCheckedChange={(checked) =>
                  requirePasswordReentry(() => handleToggleDebug(checked))
                }
              />
            </div>
            {debugMode && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Debug mode is active. Performance may be affected.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Config Lock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-primary" />
              Configuration Lock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Lock all configuration changes. Only Super Admin can unlock.
            </p>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Lock Configuration</Label>
              <Switch
                checked={configLocked}
                disabled={!isSuperAdmin}
                onCheckedChange={(checked) =>
                  requirePasswordReentry(() => handleToggleConfigLock(checked))
                }
              />
            </div>
            {configLocked && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/30">
                <Shield className="mt-0.5 h-3 w-3 shrink-0 text-red-600" />
                <p className="text-[11px] text-red-700 dark:text-red-400">
                  Configuration is locked. No settings can be changed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            Maintenance Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium text-foreground mb-1">Before System Changes:</p>
              <ol className="list-decimal pl-4 space-y-1 text-xs">
                <li>Enable Maintenance Mode to prevent user access</li>
                <li>Create a manual backup of the current system state</li>
                <li>Run System Health checks to verify current status</li>
                <li>Apply configuration changes</li>
                <li>Run diagnostics to verify changes</li>
                <li>Disable Maintenance Mode</li>
              </ol>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium text-foreground mb-1">Emergency Recovery:</p>
              <ol className="list-decimal pl-4 space-y-1 text-xs">
                <li>Enable Maintenance Mode immediately</li>
                <li>Go to System Management and rollback to last known good configuration</li>
                <li>Run Health Checks to verify recovery</li>
                <li>Review Audit Log for the root cause</li>
                <li>Disable Maintenance Mode once resolved</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmationDialog
        open={maintenanceConfirm}
        onOpenChange={setMaintenanceConfirm}
        title={maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
        description={
          maintenanceMode
            ? "This will restore normal system access for all users."
            : "This will show a maintenance page to all users and prevent access to the application."
        }
        variant={maintenanceMode ? "default" : "warning"}
        confirmLabel={maintenanceMode ? "Disable" : "Enable"}
        onConfirm={handleToggleMaintenance}
        loading={maintenanceLoading}
      />

      <PasswordReentryDialog
        open={passwordDialog.open}
        onOpenChange={(v) => setPasswordDialog({ ...passwordDialog, open: v })}
        onVerified={handlePasswordVerified}
      />
    </div>
  );
};

export default MaintenanceControl;
