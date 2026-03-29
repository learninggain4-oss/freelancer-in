import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/hooks/use-rbac";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import {
  getBundledSupabaseUrl,
  isBundledSupabaseProject,
  CORE_SCHEMA_TABLES,
  INFRA_SCHEMA_TABLES,
} from "@/lib/infrastructure";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DoubleConfirmationDialog from "@/components/admin/security/DoubleConfirmationDialog";
import PasswordReentryDialog from "@/components/admin/security/PasswordReentryDialog";
import ChangePreviewDialog, { type ChangeItem } from "@/components/admin/security/ChangePreviewDialog";
import ConfirmationDialog from "@/components/admin/security/ConfirmationDialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import {
  Database,
  Server,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldAlert,
  Lock,
  Key,
  RotateCcw,
  History,
  Copy,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Zap,
  Power,
  Package,
  Webhook,
  FileText,
  Layers,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react";

type InfraDbRow = Tables<"infra_database_connections">;

interface EnvVariable {
  key: string;
  value: string;
  isSecret: boolean;
  isProtected: boolean;
  category: string;
  enabled: boolean;
}

interface ConfigVersion {
  id: string;
  timestamp: string;
  changes: string;
  admin: string;
  snapshot: string;
}

const PROTECTED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
];

const INFRA_AUDIT_ACTIONS = [
  "db_switch",
  "env_var_change",
  "server_restart",
  "maintenance_toggle",
  "backup_create",
  "config_change",
  "config_rollback",
];

/** Full super-admin infrastructure console (database registry, runtime env, ops, backups, deploy, APIs, logs). */
const InfrastructureConsole = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { role, permissions } = useRBAC();
  const { logActivity } = useActivityLogger();

  const [activeTab, setActiveTab] = useState("database");

  const [dbProfiles, setDbProfiles] = useState<InfraDbRow[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [infraMigrationOk, setInfraMigrationOk] = useState(true);
  const [dbSwitchDialog, setDbSwitchDialog] = useState<{ open: boolean; targetId: string | null }>({
    open: false,
    targetId: null,
  });
  const [deleteConnDialog, setDeleteConnDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [dbHealthChecking, setDbHealthChecking] = useState(false);
  const [dbHealth, setDbHealth] = useState<{ status: string; latency: number } | null>(null);
  const [schemaChecking, setSchemaChecking] = useState(false);
  const [schemaResults, setSchemaResults] = useState<{ name: string; ok: boolean; message: string }[]>([]);
  const [connHistory, setConnHistory] = useState<
    { id: string; action: string; created_at: string; details: unknown }[]
  >([]);

  const [connFormOpen, setConnFormOpen] = useState(false);
  const [connEditing, setConnEditing] = useState<InfraDbRow | null>(null);
  const [connDraft, setConnDraft] = useState({
    name: "",
    provider: "supabase",
    project_url: "",
    database_name: "postgres",
    username: "",
    password_or_key: "",
    environment: "production",
    description: "",
    is_primary: false,
  });

  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [envVersions, setEnvVersions] = useState<Tables<"infra_env_variable_versions">[]>([]);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [newEnvSecret, setNewEnvSecret] = useState(false);
  const [bulkEnvText, setBulkEnvText] = useState("");
  const [revealedVars, setRevealedVars] = useState<Set<string>>(new Set());
  const [envLoading, setEnvLoading] = useState(true);
  const [envSearch, setEnvSearch] = useState("");
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; action: () => void }>({
    open: false,
    action: () => {},
  });
  const [changePreview, setChangePreview] = useState<{
    open: boolean;
    changes: ChangeItem[];
    action: () => void;
  }>({ open: false, changes: [], action: () => {} });

  const [serverStatus, setServerStatus] = useState<"running" | "restarting" | "maintenance">("running");
  const [restartDialog, setRestartDialog] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [configHistory, setConfigHistory] = useState<ConfigVersion[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [rollbackDialog, setRollbackDialog] = useState<{ open: boolean; version: ConfigVersion | null }>({
    open: false,
    version: null,
  });

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [deleteEnvDialog, setDeleteEnvDialog] = useState<{ open: boolean; key: string }>({
    open: false,
    key: "",
  });

  const [deployWebhook, setDeployWebhook] = useState("");
  const [appVersion, setAppVersion] = useState("0.0.0");
  const [logRetentionDays, setLogRetentionDays] = useState("90");
  const [integrationsJson, setIntegrationsJson] = useState("{}");
  const [infraLogs, setInfraLogs] = useState<
    { id: string; action: string; created_at: string; details: unknown }[]
  >([]);
  const [backupEvents, setBackupEvents] = useState<
    { id: string; created_at: string; details: unknown }[]
  >([]);

  const isSuperAdmin = role === "super_admin";

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

  const fetchConfigHistory = async () => {
    try {
      const { data } = await supabase
        .from("admin_audit_logs")
        .select("id, created_at, action, details, admin_id")
        .in("action", ["config_change", "env_var_change", "db_switch", "config_rollback"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        setConfigHistory(
          data.map((row) => ({
            id: row.id,
            timestamp: row.created_at,
            changes: (row.details as { description?: string })?.description || row.action,
            admin: row.admin_id,
            snapshot: JSON.stringify(row.details || {}),
          }))
        );
      }
    } catch {
      /* ignore */
    }
  };

  const fetchConnHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("infra_connection_history")
        .select("id, action, details, created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      setConnHistory(data || []);
    } catch {
      setConnHistory([]);
    }
  };

  const fetchDbProfiles = async () => {
    setDbLoading(true);
    try {
      const { data, error } = await supabase
        .from("infra_database_connections")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!data?.length && isSuperAdmin) {
        const url = getBundledSupabaseUrl();
        const ins = await supabase
          .from("infra_database_connections")
          .insert({
            name: "Primary (bundled client)",
            provider: "supabase",
            project_url: url,
            database_name: "postgres",
            username: "supabase_managed",
            environment: "production",
            is_active: true,
            is_primary: true,
            connection_status: "ok",
            description: "Matches VITE_SUPABASE_URL for this build. Add staging replicas as separate rows.",
          })
          .select("id")
          .single();
        if (ins.data?.id) {
          await supabase.from("app_settings").upsert(
            { key: "active_database_connection_id", value: ins.data.id },
            { onConflict: "key" }
          );
        }
        const again = await supabase.from("infra_database_connections").select("*").order("created_at");
        setDbProfiles(again.data || []);
      } else {
        setDbProfiles(data || []);
      }
      setInfraMigrationOk(true);
      await fetchConnHistory();
    } catch {
      setInfraMigrationOk(false);
      setDbProfiles([]);
    } finally {
      setDbLoading(false);
    }
  };

  const fetchEnvVars = async () => {
    setEnvLoading(true);
    try {
      const [{ data }, { data: vers }] = await Promise.all([
        supabase.from("app_settings").select("key, value").like("key", "env_%"),
        supabase
          .from("infra_env_variable_versions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(60),
      ]);
      if (data) {
        setEnvVars(
          data.map((row) => {
            let parsed: Record<string, unknown> = {};
            try {
              parsed = JSON.parse(row.value) as Record<string, unknown>;
            } catch {
              parsed = { value: row.value };
            }
            return {
              key: row.key.replace("env_", ""),
              value: String(parsed.value ?? row.value),
              isSecret: Boolean(parsed.isSecret),
              isProtected: PROTECTED_VARS.includes(row.key.replace("env_", "")),
              category: String(parsed.category ?? "general"),
              enabled: parsed.enabled !== false,
            };
          })
        );
      }
      setEnvVersions(vers || []);
    } catch {
      /* ignore */
    } finally {
      setEnvLoading(false);
    }
  };

  const loadDeploySettings = async () => {
    try {
      const keys = ["deploy_webhook_url", "deploy_app_version", "log_retention_days_admin", "infra_integration_registry"];
      const { data } = await supabase.from("app_settings").select("key, value").in("key", keys);
      if (data) {
        for (const r of data) {
          if (r.key === "deploy_webhook_url") setDeployWebhook(r.value);
          if (r.key === "deploy_app_version") setAppVersion(r.value);
          if (r.key === "log_retention_days_admin") setLogRetentionDays(r.value);
          if (r.key === "infra_integration_registry") setIntegrationsJson(r.value || "{}");
        }
      }
    } catch {
      /* ignore */
    }
  };

  const fetchInfraLogs = async () => {
    try {
      const { data } = await supabase
        .from("admin_audit_logs")
        .select("id, action, created_at, details")
        .in("action", INFRA_AUDIT_ACTIONS)
        .order("created_at", { ascending: false })
        .limit(120);
      setInfraLogs(data || []);
    } catch {
      setInfraLogs([]);
    }
  };

  const fetchBackupEvents = async () => {
    try {
      const { data } = await supabase
        .from("admin_audit_logs")
        .select("id, created_at, details")
        .eq("action", "backup_create")
        .order("created_at", { ascending: false })
        .limit(25);
      setBackupEvents(data || []);
    } catch {
      setBackupEvents([]);
    }
  };

  const loadAll = useCallback(async () => {
    await fetchDbProfiles();
    await fetchEnvVars();
    await fetchConfigHistory();
    await loadDeploySettings();
    await fetchInfraLogs();
    await fetchBackupEvents();
    try {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "maintenance_mode").maybeSingle();
      setMaintenanceMode(data?.value === "true");
      setServerStatus(data?.value === "true" ? "maintenance" : "running");
    } catch {
      /* ignore */
    }
  }, [isSuperAdmin, role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const recordConnHistory = async (connectionId: string | null, action: string, details: Record<string, unknown>) => {
    if (!profile?.id) return;
    await supabase.from("infra_connection_history").insert({
      connection_id: connectionId,
      action,
      details,
      admin_profile_id: profile.id,
    });
    fetchConnHistory();
  };

  const recordEnvVersion = async (envKey: string, snapshot: Record<string, unknown>) => {
    if (!profile?.id) return;
    await supabase.from("infra_env_variable_versions").insert({
      env_key: envKey,
      snapshot,
      changed_by: profile.id,
    });
    const { data: vers } = await supabase
      .from("infra_env_variable_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    setEnvVersions(vers || []);
  };

  const handleDbHealthCheck = async (profileRow?: InfraDbRow) => {
    setDbHealthChecking(true);
    const row = profileRow ?? dbProfiles.find((p) => p.is_active);
    try {
      if (row && !isBundledSupabaseProject(row.project_url)) {
        await supabase
          .from("infra_database_connections")
          .update({
            connection_status: "pending_validation",
            last_test_at: new Date().toISOString(),
            last_error:
              "This URL does not match the bundled Supabase project. Validate from a trusted server or deploy a build pointing at this project.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        toast.message("External profile saved", {
          description:
            "Live browser sessions always use VITE_SUPABASE_URL. Test & switch here tracks operational intent for workers and future builds.",
        });
        await fetchDbProfiles();
        setDbHealthChecking(false);
        return;
      }
      const start = performance.now();
      const { error } = await supabase.from("app_settings").select("key").limit(1);
      const latency = Math.round(performance.now() - start);
      if (error) throw error;
      setDbHealth({ status: "healthy", latency });
      if (row) {
        await supabase
          .from("infra_database_connections")
          .update({
            connection_status: "ok",
            last_test_at: new Date().toISOString(),
            last_connected_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        await fetchDbProfiles();
      }
      toast.success(`Database healthy — ${latency}ms`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setDbHealth({ status: "error", latency: 0 });
      if (row) {
        await supabase
          .from("infra_database_connections")
          .update({
            connection_status: "error",
            last_test_at: new Date().toISOString(),
            last_error: msg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        await fetchDbProfiles();
      }
      toast.error(`Check failed: ${msg}`);
    } finally {
      setDbHealthChecking(false);
    }
  };

  const runSchemaValidation = async () => {
    setSchemaChecking(true);
    const tables = [...CORE_SCHEMA_TABLES, ...INFRA_SCHEMA_TABLES];
    const out: { name: string; ok: boolean; message: string }[] = [];
    for (const t of tables) {
      try {
        const { error } = await supabase.from(t).select("*").limit(1);
        if (error) out.push({ name: t, ok: false, message: error.message });
        else out.push({ name: t, ok: true, message: "reachable" });
      } catch (e: unknown) {
        out.push({
          name: t,
          ok: false,
          message: e instanceof Error ? e.message : "failed",
        });
      }
    }
    setSchemaResults(out);
    setSchemaChecking(false);
    await logActivity({
      action: "system_health_check",
      details: { type: "schema_validation", results: out },
    });
    toast.success("Schema validation finished");
  };

  const handleDbSwitch = async () => {
    const targetId = dbSwitchDialog.targetId;
    if (!targetId || !profile?.id) return;
    const target = dbProfiles.find((p) => p.id === targetId);
    if (!target) return;

    toast.info("Recording switch & backup intent…");
    await logActivity({
      action: "backup_create",
      details: { description: "Pre-switch snapshot (metadata); use Supabase dashboard for full DB backup." },
    });

    const { data: activeRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "active_database_connection_id")
      .maybeSingle();
    const prevId = activeRow?.value || "";
    await supabase
      .from("app_settings")
      .upsert({ key: "previous_database_connection_id", value: prevId }, { onConflict: "key" });

    await supabase
      .from("infra_database_connections")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("infra_database_connections")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", targetId);
    await supabase
      .from("app_settings")
      .upsert({ key: "active_database_connection_id", value: targetId }, { onConflict: "key" });

    await recordConnHistory(targetId, "switch", { target: target.name, previousId: prevId });
    await logActivity({
      action: "db_switch",
      details: { targetId, targetName: target.name, description: `Marked active connection ${target.name}` },
    });
    await fetchConfigHistory();
    await fetchDbProfiles();
    toast.success(
      `Active connection set to “${target.name}”. Deploy a client build with matching VITE_SUPABASE_URL for end-users to use it.`
    );
    setDbSwitchDialog({ open: false, targetId: null });
  };

  const handleRollbackConnection = async () => {
    const { data: prev } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "previous_database_connection_id")
      .maybeSingle();
    if (!prev?.value) {
      toast.error("No previous connection recorded");
      return;
    }
    setDbSwitchDialog({ open: true, targetId: prev.value });
  };

  const openCreateConnection = () => {
    setConnEditing(null);
    setConnDraft({
      name: "",
      provider: "supabase",
      project_url: "",
      database_name: "postgres",
      username: "",
      password_or_key: "",
      environment: "production",
      description: "",
      is_primary: false,
    });
    setConnFormOpen(true);
  };

  const openEditConnection = (row: InfraDbRow) => {
    setConnEditing(row);
    setConnDraft({
      name: row.name,
      provider: row.provider,
      project_url: row.project_url,
      database_name: row.database_name,
      username: row.username,
      password_or_key: "",
      environment: row.environment,
      description: row.description || "",
      is_primary: row.is_primary,
    });
    setConnFormOpen(true);
  };

  const saveConnection = async () => {
    if (!connDraft.name.trim() || !connDraft.project_url.trim()) {
      toast.error("Name and project URL are required");
      return;
    }
    const payload: Partial<InfraDbRow> = {
      name: connDraft.name.trim(),
      provider: connDraft.provider,
      project_url: connDraft.project_url.trim(),
      database_name: connDraft.database_name.trim() || "postgres",
      username: connDraft.username.trim(),
      environment: connDraft.environment,
      description: connDraft.description.trim() || null,
      is_primary: connDraft.is_primary,
      updated_at: new Date().toISOString(),
    };
    if (connDraft.password_or_key.trim()) {
      payload.password_or_key = connDraft.password_or_key.trim();
    }
    try {
      if (connEditing) {
        const { error } = await supabase.from("infra_database_connections").update(payload).eq("id", connEditing.id);
        if (error) throw error;
        await recordConnHistory(connEditing.id, "update", { name: payload.name });
        toast.success("Connection updated");
      } else {
        const { data, error } = await supabase
          .from("infra_database_connections")
          .insert({
            name: payload.name!,
            provider: payload.provider!,
            project_url: payload.project_url!,
            database_name: payload.database_name!,
            username: payload.username!,
            password_or_key: payload.password_or_key ?? null,
            environment: payload.environment!,
            description: payload.description ?? null,
            is_primary: payload.is_primary ?? false,
            connection_status: "unknown",
            is_active: false,
          })
          .select("id")
          .single();
        if (error) throw error;
        await recordConnHistory(data?.id ?? null, "create", { name: payload.name });
        toast.success("Connection added — test, then switch when ready");
      }
      setConnFormOpen(false);
      await fetchDbProfiles();
      await logActivity({
        action: "config_change",
        details: { area: "database_connection", name: payload.name },
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const confirmDeleteConnection = async () => {
    const id = deleteConnDialog.id;
    if (!id) return;
    const row = dbProfiles.find((p) => p.id === id);
    if (row?.is_active) {
      toast.error("Deactivate before delete");
      setDeleteConnDialog({ open: false, id: null });
      return;
    }
    try {
      const { error } = await supabase.from("infra_database_connections").delete().eq("id", id);
      if (error) throw error;
      await recordConnHistory(id, "delete", { name: row?.name });
      toast.success("Connection removed");
      setDeleteConnDialog({ open: false, id: null });
      await fetchDbProfiles();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleAddEnvVar = () => {
    if (!newEnvKey.trim()) {
      toast.error("Variable name is required");
      return;
    }
    if (!/^[A-Z_][A-Z0-9_]*$/.test(newEnvKey.trim())) {
      toast.error("Use UPPER_SNAKE_CASE");
      return;
    }
    if (envVars.some((v) => v.key === newEnvKey.trim())) {
      toast.error("Already exists");
      return;
    }
    const changes: ChangeItem[] = [
      {
        field: newEnvKey.trim(),
        oldValue: "",
        newValue: newEnvSecret ? "***" : newEnvValue,
        critical: PROTECTED_VARS.includes(newEnvKey.trim()),
      },
    ];
    setChangePreview({
      open: true,
      changes,
      action: () => saveEnvVar(newEnvKey.trim(), newEnvValue, newEnvSecret, true),
    });
  };

  const saveEnvVar = async (key: string, value: string, isSecret: boolean, enabled = true) => {
    try {
      const payload = JSON.stringify({ value, isSecret, category: "general", enabled });
      const { error } = await supabase.from("app_settings").upsert(
        { key: `env_${key}`, value: payload },
        { onConflict: "key" }
      );
      if (error) throw error;
      setEnvVars((prev) => [
        ...prev.filter((v) => v.key !== key),
        { key, value, isSecret, isProtected: PROTECTED_VARS.includes(key), category: "general", enabled },
      ]);
      setNewEnvKey("");
      setNewEnvValue("");
      setNewEnvSecret(false);
      await recordEnvVersion(key, { value: isSecret ? "[secret]" : value, isSecret, enabled });
      await logActivity({
        action: "env_var_change",
        details: { key, action: "upsert", description: `Env ${key}` },
      });
      await fetchConfigHistory();
      toast.success(`Saved ${key}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setChangePreview({ open: false, changes: [], action: () => {} });
  };

  const toggleEnvEnabled = async (v: EnvVariable) => {
    await saveEnvVar(v.key, v.value, v.isSecret, !v.enabled);
  };

  const handleBulkImportEnv = async () => {
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(bulkEnvText) as Record<string, unknown>;
    } catch {
      toast.error("Invalid JSON object");
      return;
    }
    for (const [k, val] of Object.entries(obj)) {
      const key = k.toUpperCase().replace(/[^A-Z0-9_]/g, "");
      if (!key) continue;
      await saveEnvVar(key, String(val), false, true);
    }
    setBulkEnvText("");
    toast.success("Import finished");
  };

  const exportEnvVars = () => {
    const o: Record<string, string> = {};
    envVars.forEach((v) => {
      o[v.key] = v.value;
    });
    const blob = new Blob([JSON.stringify(o, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `env-export-${Date.now()}.json`;
    a.click();
    toast.success("Download started");
  };

  const handleDeleteEnvVar = async (key: string) => {
    if (PROTECTED_VARS.includes(key)) {
      toast.error("Protected");
      return;
    }
    try {
      const { error } = await supabase.from("app_settings").delete().eq("key", `env_${key}`);
      if (error) throw error;
      setEnvVars((prev) => prev.filter((v) => v.key !== key));
      await recordEnvVersion(key, { deleted: true });
      await logActivity({
        action: "env_var_change",
        details: { key, action: "delete" },
      });
      await fetchConfigHistory();
      toast.success(`Deleted ${key}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setDeleteEnvDialog({ open: false, key: "" });
  };

  const handleServerRestart = async () => {
    setServerStatus("restarting");
    await logActivity({
      action: "server_restart",
      details: { description: "Recorded restart request — apply on hosting / Supabase edge pool." },
    });
    await new Promise((r) => setTimeout(r, 1500));
    setServerStatus("running");
    toast.success("Restart logged. Run rolling restart from your host (Vercel/Fly/Node) or Supabase dashboard.");
    setRestartDialog(false);
    await fetchConfigHistory();
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    setMaintenanceMode(enabled);
    setServerStatus(enabled ? "maintenance" : "running");
    try {
      await supabase
        .from("app_settings")
        .upsert({ key: "maintenance_mode", value: String(enabled) }, { onConflict: "key" });
      await logActivity({
        action: "maintenance_toggle",
        details: { enabled, description: `Maintenance ${enabled}` },
      });
      await fetchConfigHistory();
      toast.success(enabled ? "Maintenance on" : "Maintenance off");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "");
      setMaintenanceMode(!enabled);
      setServerStatus(!enabled ? "maintenance" : "running");
    }
  };

  const handleRollback = async (version: ConfigVersion) => {
    await logActivity({
      action: "config_rollback",
      details: { rollbackTo: version.id, description: `Rollback marker ${version.timestamp}` },
    });
    await fetchConfigHistory();
    toast.success("Rollback recorded — re-apply values manually from snapshot if needed.");
    setRollbackDialog({ open: false, version: null });
  };

  const saveDeploySettings = async () => {
    try {
      await supabase.from("app_settings").upsert(
        { key: "deploy_webhook_url", value: deployWebhook.trim() },
        { onConflict: "key" }
      );
      await supabase.from("app_settings").upsert(
        { key: "deploy_app_version", value: appVersion.trim() },
        { onConflict: "key" }
      );
      await supabase.from("app_settings").upsert(
        { key: "log_retention_days_admin", value: logRetentionDays.trim() },
        { onConflict: "key" }
      );
      await logActivity({ action: "config_change", details: { area: "deploy_metadata" } });
      toast.success("Deploy metadata saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "");
    }
  };

  const invokeDeployWebhook = async () => {
    const url = deployWebhook.trim();
    if (!url) {
      toast.error("Set webhook URL first");
      return;
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "admin_infrastructure_console", at: new Date().toISOString() }),
      });
      await logActivity({
        action: "config_change",
        details: { area: "deploy_trigger", status: res.status },
      });
      toast.success(`Webhook responded ${res.status}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Webhook failed (check CORS/host)");
    }
  };

  const saveIntegrations = async () => {
    try {
      JSON.parse(integrationsJson);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    await supabase
      .from("app_settings")
      .upsert({ key: "infra_integration_registry", value: integrationsJson }, { onConflict: "key" });
    await logActivity({ action: "config_change", details: { area: "integrations" } });
    toast.success("Integration registry saved");
  };

  const toggleRevealVar = (key: string) => {
    setRevealedVars((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredEnvVars = envVars.filter((v) =>
    envSearch ? v.key.toLowerCase().includes(envSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Infrastructure &amp; system control</h2>
          <p className="text-sm text-muted-foreground">
            Super Admin console: database registry, runtime configuration, operations, backups, deploy hooks, APIs, and
            logs. Browser clients always use the bundled Supabase URL unless you ship a new build.
          </p>
        </div>
        <Badge
          variant={
            serverStatus === "running" ? "default" : serverStatus === "restarting" ? "secondary" : "destructive"
          }
          className="w-fit gap-1"
        >
          {serverStatus === "running" ? "Running" : serverStatus === "restarting" ? "Restarting" : "Maintenance"}
        </Badge>
      </div>

      {!isSuperAdmin && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Restricted</p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
              Only Super Admin can change infrastructure. Your role: <strong>{role?.replace("_", " ")}</strong>
            </p>
          </div>
        </div>
      )}

      {!infraMigrationOk && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-destructive">Infrastructure tables missing</CardTitle>
            <CardDescription>
              Apply migration <code className="text-xs">20260330140000_infrastructure_console.sql</code> via Supabase,
              then refresh.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="database" className="text-xs gap-1">
            <Database className="h-3 w-3" />
            Database
          </TabsTrigger>
          <TabsTrigger value="env-vars" className="text-xs gap-1">
            <Key className="h-3 w-3" />
            Env
          </TabsTrigger>
          <TabsTrigger value="server" className="text-xs gap-1">
            <Server className="h-3 w-3" />
            Server
          </TabsTrigger>
          <TabsTrigger value="backups" className="text-xs gap-1">
            <HardDrive className="h-3 w-3" />
            Backups
          </TabsTrigger>
          <TabsTrigger value="deploy" className="text-xs gap-1">
            <Package className="h-3 w-3" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs gap-1">
            <Webhook className="h-3 w-3" />
            APIs
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1">
            <History className="h-3 w-3" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Live connection health (bundled project)
              </CardTitle>
              <CardDescription>
                Ping uses the active browser Supabase session. Profiles whose URL matches{" "}
                <code className="text-xs">VITE_SUPABASE_URL</code> validate end-to-end.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button onClick={() => handleDbHealthCheck()} disabled={dbHealthChecking} variant="outline" size="sm">
                {dbHealthChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Test active / bundled
              </Button>
              {dbHealth && (
                <Badge variant={dbHealth.status === "healthy" ? "default" : "destructive"}>{dbHealth.status}</Badge>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={runSchemaValidation}
                disabled={schemaChecking || !infraMigrationOk}
              >
                {schemaChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                Validate tables
              </Button>
              <Button size="sm" variant="outline" onClick={handleRollbackConnection} disabled={!isSuperAdmin}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Use previous connection
              </Button>
            </CardContent>
          </Card>

          {schemaResults.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Schema check</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1 sm:grid-cols-2">
                {schemaResults.map((r) => (
                  <div key={r.name} className="flex items-center gap-2 text-xs">
                    {r.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="font-mono">{r.name}</span>
                    <span className="text-muted-foreground truncate">{r.message}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Connection registry
              </CardTitle>
              {isSuperAdmin && (
                <Button size="sm" onClick={openCreateConnection} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add connection
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {dbLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {dbProfiles.map((db) => (
                    <div
                      key={db.id}
                      className={`rounded-lg border p-4 ${db.is_active ? "border-primary/50 bg-primary/5" : ""}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                db.is_active ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
                              }`}
                            />
                            <p className="text-sm font-medium">{db.name}</p>
                            {db.is_active && <Badge className="text-[10px]">Active</Badge>}
                            {isBundledSupabaseProject(db.project_url) && (
                              <Badge variant="secondary" className="text-[10px]">
                                Bundled
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {db.provider}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {db.environment}
                            </Badge>
                          </div>
                          <code className="block text-[11px] text-muted-foreground break-all">{db.project_url}</code>
                          <p className="text-[11px] text-muted-foreground">
                            Status: {db.connection_status}
                            {db.last_test_at && ` · tested ${new Date(db.last_test_at).toLocaleString()}`}
                          </p>
                          {db.last_error && (
                            <p className="text-[11px] text-destructive break-words">{db.last_error}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!isSuperAdmin}
                            onClick={() => handleDbHealthCheck(db)}
                          >
                            Test
                          </Button>
                          {!db.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isSuperAdmin}
                              onClick={() => {
                                requirePasswordReentry(() =>
                                  setDbSwitchDialog({ open: true, targetId: db.id })
                                );
                              }}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Set active
                            </Button>
                          )}
                          {isSuperAdmin && (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => openEditConnection(db)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                disabled={db.is_active}
                                onClick={() => setDeleteConnDialog({ open: true, id: db.id })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                <p className="font-medium">Multi-database &amp; switch</p>
                <p className="mt-1 text-blue-800/90 dark:text-blue-200/90">
                  Switching updates registry + <code className="text-[10px]">app_settings</code> for workers and
                  documentation. End-user SPA builds still embed one Supabase URL — ship a new frontend or dynamic
                  bootstrap endpoint for true multi-tenant runtime switching.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Connection history</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-48">
                <div className="space-y-2 text-xs">
                  {connHistory.length === 0 ? (
                    <p className="text-muted-foreground">No events</p>
                  ) : (
                    connHistory.map((h) => (
                      <div key={h.id} className="rounded border p-2">
                        <span className="font-medium">{h.action}</span> · {new Date(h.created_at).toLocaleString()}
                        <pre className="mt-1 text-[10px] text-muted-foreground overflow-x-auto max-h-16">
                          {JSON.stringify(h.details)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="env-vars" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Runtime environment variables</CardTitle>
              <CardDescription>
                Stored in <code className="text-xs">app_settings</code> as <code className="text-xs">env_*</code> — use
                in Edge Functions / server via DB read. Vite <code className="text-xs">import.meta.env</code> is still
                build-time only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSuperAdmin && (
                <>
                  <div className="space-y-3 rounded-lg border border-dashed p-4">
                    <h4 className="text-sm font-semibold">Add variable</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={newEnvKey}
                          onChange={(e) =>
                            setNewEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
                          }
                          className="font-mono"
                          placeholder="API_KEY"
                        />
                      </div>
                      <div>
                        <Label>Value</Label>
                        <Input
                          type={newEnvSecret ? "password" : "text"}
                          value={newEnvValue}
                          onChange={(e) => setNewEnvValue(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={newEnvSecret} onCheckedChange={setNewEnvSecret} />
                        <Label className="text-xs">Secret (mask in UI)</Label>
                      </div>
                      <Button size="sm" onClick={handleAddEnvVar}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bulk import (JSON object)</Label>
                    <Textarea
                      value={bulkEnvText}
                      onChange={(e) => setBulkEnvText(e.target.value)}
                      className="font-mono text-xs min-h-[80px]"
                      placeholder='{ "MY_KEY": "value" }'
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={handleBulkImportEnv}>
                        Import
                      </Button>
                      <Button size="sm" variant="outline" onClick={exportEnvVars}>
                        Export all
                      </Button>
                    </div>
                  </div>
                </>
              )}
              <Input placeholder="Search…" value={envSearch} onChange={(e) => setEnvSearch(e.target.value)} />
              {envLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto my-6" />
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-2">
                    {filteredEnvVars.map((v) => (
                      <div key={v.key} className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="text-sm font-mono font-medium">{v.key}</code>
                            {!v.enabled && <Badge variant="secondary" className="text-[9px]">off</Badge>}
                            {v.isProtected && (
                              <Badge variant="outline" className="text-[9px]">Protected</Badge>
                            )}
                            {v.isSecret && (
                              <Badge variant="secondary" className="text-[9px]">
                                <Lock className="h-2.5 w-2.5 mr-0.5" />
                                Secret
                              </Badge>
                            )}
                          </div>
                          <code className="text-xs text-muted-foreground font-mono break-all">
                            {v.isSecret && !revealedVars.has(v.key) ? "••••••••" : v.value}
                          </code>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {isSuperAdmin && (
                            <div className="flex items-center gap-1 mr-2">
                              <Switch checked={v.enabled} onCheckedChange={() => toggleEnvEnabled(v)} />
                              <span className="text-[10px] text-muted-foreground">on</span>
                            </div>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleRevealVar(v.key)}>
                            {revealedVars.has(v.key) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              navigator.clipboard.writeText(v.value);
                              toast.success("Copied");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {!v.isProtected && isSuperAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteEnvDialog({ open: true, key: v.key })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <div>
                <h4 className="text-sm font-medium mb-2">Version history</h4>
                <ScrollArea className="max-h-40">
                  <div className="space-y-1 text-[11px]">
                    {envVersions.map((ev) => (
                      <div key={ev.id} className="rounded border p-2 font-mono">
                        {ev.env_key} · {new Date(ev.created_at).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="server" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Server &amp; platform</CardTitle>
              <CardDescription>
                Browser cannot open SSH or host terminals. Use your cloud console; actions below log intent and toggle
                app-visible maintenance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Maintenance mode</p>
                  <p className="text-xs text-muted-foreground">Uses existing maintenance flags consumed by your app.</p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  disabled={!isSuperAdmin}
                  onCheckedChange={(c) => requirePasswordReentry(() => handleMaintenanceToggle(c))}
                />
              </div>
              <div className="rounded-lg border p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Record rolling restart</p>
                  <p className="text-xs text-muted-foreground">Log + notify ops; perform restart on the host.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!isSuperAdmin || serverStatus === "restarting"}
                  onClick={() => requirePasswordReentry(() => setRestartDialog(true))}
                >
                  <Power className="h-3.5 w-3.5 mr-1" />
                  Restart
                </Button>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 grid gap-2 text-xs sm:grid-cols-2">
                {[
                  { label: "Bundled Supabase", value: getBundledSupabaseUrl() || "—" },
                  { label: "Platform", value: "Supabase (managed Postgres, Auth, Storage)" },
                  { label: "Process", value: "Static SPA + Edge Functions" },
                  { label: "Session", value: serverStatus },
                ].map((x) => (
                  <div key={x.label} className="flex justify-between rounded border bg-background p-2 gap-2">
                    <span className="text-muted-foreground shrink-0">{x.label}</span>
                    <span className="font-mono text-[10px] text-right break-all">{x.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Full SSH, file manager, and kernel metrics require a private agent or provider API — not embedded here
                  by default.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Backup &amp; restore</CardTitle>
              <CardDescription>
                Full Postgres PITR and downloads live in Supabase Dashboard. This panel records admin-triggered backup
                events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/maintenance")}>
                  Open maintenance / schedules
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                <Button
                  size="sm"
                  disabled={!permissions.canCreateBackups}
                  onClick={async () => {
                    await logActivity({
                      action: "backup_create",
                      details: { description: "Manual backup marker from infrastructure console" },
                    });
                    toast.success("Backup event logged — run dump/PITR in Supabase");
                    fetchBackupEvents();
                  }}
                >
                  Log manual backup
                </Button>
              </div>
              <ScrollArea className="max-h-52">
                <div className="space-y-2 text-xs">
                  {backupEvents.map((b) => (
                    <div key={b.id} className="rounded border p-2">
                      {new Date(b.created_at).toLocaleString()}
                      <pre className="text-[10px] text-muted-foreground mt-1 overflow-x-auto">
                        {JSON.stringify(b.details)}
                      </pre>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deployment &amp; versioning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-w-xl">
              <div>
                <Label>Deploy webhook URL</Label>
                <Input value={deployWebhook} onChange={(e) => setDeployWebhook(e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <Label>Recorded app version</Label>
                <Input value={appVersion} onChange={(e) => setAppVersion(e.target.value)} />
              </div>
              <div>
                <Label>Admin log retention (days)</Label>
                <Input value={logRetentionDays} onChange={(e) => setLogRetentionDays(e.target.value)} type="number" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={saveDeploySettings} disabled={!isSuperAdmin}>
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={invokeDeployWebhook} disabled={!isSuperAdmin}>
                  POST webhook
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void loadDeploySettings();
                    toast.success("Client cache: hard refresh or purge CDN in hosting UI");
                    logActivity({ action: "config_change", details: { area: "cache_hint" } });
                  }}
                >
                  Cache / CDN note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API &amp; integration registry</CardTitle>
              <CardDescription>JSON map consumed by your Edge Functions (read via app_settings).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                className="font-mono text-xs min-h-[160px]"
                value={integrationsJson}
                onChange={(e) => setIntegrationsJson(e.target.value)}
                disabled={!isSuperAdmin}
              />
              <Button size="sm" onClick={saveIntegrations} disabled={!isSuperAdmin}>
                Save registry
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Infrastructure audit stream</CardTitle>
              <Button size="sm" variant="outline" onClick={fetchInfraLogs}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[420px]">
                <div className="space-y-2 text-xs">
                  {infraLogs.map((row) => (
                    <div key={row.id} className="rounded border p-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{row.action}</Badge>
                        <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
                      </div>
                      <pre className="mt-1 text-[10px] text-muted-foreground max-h-24 overflow-auto">
                        {JSON.stringify(row.details)}
                      </pre>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button variant="link" className="px-0 mt-2 h-auto text-xs" onClick={() => navigate("/admin/audit-log")}>
                Full audit log →
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration markers</CardTitle>
            </CardHeader>
            <CardContent>
              {configHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No entries</p>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {configHistory.map((version) => (
                      <div key={version.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{version.changes}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(version.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7"
                              onClick={() =>
                                setExpandedHistory(expandedHistory === version.id ? null : version.id)
                              }
                            >
                              {expandedHistory === version.id ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                            {isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1"
                                onClick={() => setRollbackDialog({ open: true, version })}
                              >
                                <RotateCcw className="h-3 w-3" />
                                Mark rollback
                              </Button>
                            )}
                          </div>
                        </div>
                        {expandedHistory === version.id && (
                          <code className="mt-2 block whitespace-pre-wrap text-[11px] text-muted-foreground">
                            {version.snapshot}
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={connFormOpen} onOpenChange={setConnFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{connEditing ? "Edit connection" : "New connection"}</DialogTitle>
            <DialogDescription>
              Credentials are stored for Super Admin operational use — restrict RLS and rotate keys regularly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Name</Label>
              <Input value={connDraft.name} onChange={(e) => setConnDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Provider</Label>
                <Select
                  value={connDraft.provider}
                  onValueChange={(v) => setConnDraft((d) => ({ ...d, provider: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supabase">Supabase</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Environment</Label>
                <Select
                  value={connDraft.environment}
                  onValueChange={(v) => setConnDraft((d) => ({ ...d, environment: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Project / API URL</Label>
              <Input
                value={connDraft.project_url}
                onChange={(e) => setConnDraft((d) => ({ ...d, project_url: e.target.value }))}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label>Database name</Label>
              <Input
                value={connDraft.database_name}
                onChange={(e) => setConnDraft((d) => ({ ...d, database_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                value={connDraft.username}
                onChange={(e) => setConnDraft((d) => ({ ...d, username: e.target.value }))}
              />
            </div>
            <div>
              <Label>Password / API key {connEditing && "(leave blank to keep)"}</Label>
              <Input
                type="password"
                value={connDraft.password_or_key}
                onChange={(e) => setConnDraft((d) => ({ ...d, password_or_key: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={connDraft.description}
                onChange={(e) => setConnDraft((d) => ({ ...d, description: e.target.value }))}
                className="text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={connDraft.is_primary}
                onCheckedChange={(c) => setConnDraft((d) => ({ ...d, is_primary: c }))}
              />
              <Label className="text-xs">Primary (informational)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveConnection} disabled={!isSuperAdmin}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DoubleConfirmationDialog
        open={dbSwitchDialog.open}
        onOpenChange={(v) => setDbSwitchDialog((s) => ({ ...s, open: v }))}
        title="Set active database profile"
        description={`Activate profile ${dbSwitchDialog.targetId?.slice(0, 8) ?? ""}…? This records the switch and previous id for rollback.`}
        confirmPhrase="SWITCH DATABASE"
        warningMessage="Ensure Supabase/backups are current. SPA clients need a matching build or dynamic config to use a different project."
        onConfirm={handleDbSwitch}
      />

      <PasswordReentryDialog
        open={passwordDialog.open}
        onOpenChange={(v) => setPasswordDialog((p) => ({ ...p, open: v }))}
        onVerified={handlePasswordVerified}
      />

      <ChangePreviewDialog
        open={changePreview.open}
        onOpenChange={(v) => setChangePreview((c) => ({ ...c, open: v }))}
        changes={changePreview.changes}
        onApply={changePreview.action}
      />

      <ConfirmationDialog
        open={restartDialog}
        onOpenChange={setRestartDialog}
        title="Record server restart"
        description="This logs the restart for operations. Perform the actual restart on your infrastructure."
        variant="warning"
        confirmLabel="Confirm"
        onConfirm={handleServerRestart}
        loading={serverStatus === "restarting"}
      />

      <ConfirmationDialog
        open={deleteEnvDialog.open}
        onOpenChange={(v) => setDeleteEnvDialog((d) => ({ ...d, open: v }))}
        title="Delete variable"
        description={`Remove ${deleteEnvDialog.key}?`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => handleDeleteEnvVar(deleteEnvDialog.key)}
      />

      <ConfirmationDialog
        open={deleteConnDialog.open}
        onOpenChange={(v) => setDeleteConnDialog({ open: v, id: deleteConnDialog.id })}
        title="Delete connection"
        description="Remove this profile from the registry?"
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={confirmDeleteConnection}
      />

      <DoubleConfirmationDialog
        open={rollbackDialog.open}
        onOpenChange={(v) => setRollbackDialog((r) => ({ ...r, open: v }))}
        title="Mark rollback"
        description={`Record rollback intent for ${rollbackDialog.version ? new Date(rollbackDialog.version.timestamp).toLocaleString() : ""}?`}
        confirmPhrase="ROLLBACK"
        warningMessage="Re-apply settings manually from stored snapshots where needed."
        onConfirm={() => {
          if (rollbackDialog.version) handleRollback(rollbackDialog.version);
        }}
      />
    </div>
  );
};

export default InfrastructureConsole;
