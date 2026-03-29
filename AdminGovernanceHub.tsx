import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/hooks/use-rbac";
import type { AdminRole } from "@/hooks/use-rbac";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
  History,
  Bell,
  Database,
  RefreshCw,
  Globe,
  GitBranch,
  Link2,
  Lock,
  Eye,
} from "lucide-react";

type PendingRow = {
  id: string;
  action_type: string;
  title: string;
  payload: Record<string, unknown>;
  status: string;
  requested_by: string;
  created_at: string;
};

type PermLogRow = {
  id: string;
  changed_by: string;
  target_auth_user_id: string;
  old_role: string;
  new_role: string;
  created_at: string;
  note: string | null;
};

const safeguards = [
  {
    area: "Privilege & internal misuse",
    items: ["Granular RBAC + sidebar/route guards", "Dual approval for super-admin role changes (optional)", "Permission change history", "Audit log sanitization"],
  },
  {
    area: "Super admin recovery",
    items: ["Multiple super admins via `super_admin_user_ids`", "Bootstrap emails in code + DB list", "Use Supabase auth recovery + Security Center MFA"],
  },
  {
    area: "Privacy & compliance",
    items: ["Data masking helpers (`lib/data-masking`)", "`data_masking_default` setting", "Export restrictions via role (`canExportUnmaskedData`)"],
  },
  {
    area: "Alerts & notifications",
    items: ["Email / config-change flags in Security Center", "In-app audit + governance queue", "Hook external SMS/webhooks in edge functions when needed"],
  },
  {
    area: "Backups & recovery",
    items: ["System Management backup actions + audit", "Supabase Dashboard PITR / dumps for DB", "Document R2/blob provider backups"],
  },
  {
    area: "Performance & UX",
    items: ["Lazy-loaded admin routes", "Module-grouped navigation", "Health dashboard"],
  },
  {
    area: "Third-party resilience",
    items: ["Retries/timeouts in integrations", "Health panel + manual fallback toggles", "Log provider failures to audit"],
  },
  {
    area: "Deployments & versions",
    items: ["Staging/CDN outside this repo", "Track releases in `app_settings` + audit", "Rollback via git/hosting provider"],
  },
  {
    area: "Data consistency",
    items: ["Scheduled reconciliation jobs (DB/cron)", "Validation & duplicate checks in domain logic", "Mismatch alerts → audit action types"],
  },
  {
    area: "Session security",
    items: ["Session timeout / device flags in Security Center", "TOTP via Security Center", "IP allowlist + activity logging"],
  },
];

const AdminGovernanceHub = () => {
  const { profile, user } = useAuth();
  const { role, permissions, loading: rbacLoading } = useRBAC();
  const { logActivity } = useActivityLogger();

  const [pending, setPending] = useState<PendingRow[]>([]);
  const [permLog, setPermLog] = useState<PermLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dualApproval, setDualApproval] = useState(false);
  const [savingDual, setSavingDual] = useState(false);
  const [superIdsJson, setSuperIdsJson] = useState("[]");
  const [savingSuperIds, setSavingSuperIds] = useState(false);
  const [rejectOpen, setRejectOpen] = useState<{ id: string; text: string } | null>(null);

  const isSuper = role === "super_admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: pend }, { data: plog }, { data: dualRow }, { data: superRow }] = await Promise.all([
        supabase
          .from("admin_pending_actions")
          .select("id, action_type, title, payload, status, requested_by, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("admin_permission_change_log")
          .select("id, changed_by, target_auth_user_id, old_role, new_role, created_at, note")
          .order("created_at", { ascending: false })
          .limit(80),
        supabase.from("app_settings").select("value").eq("key", "dual_approval_enabled").maybeSingle(),
        supabase.from("app_settings").select("value").eq("key", "super_admin_user_ids").maybeSingle(),
      ]);

      setPending((pend as PendingRow[]) || []);
      setPermLog((plog as PermLogRow[]) || []);
      setDualApproval(dualRow?.value === "true");
      if (superRow?.value) setSuperIdsJson(superRow.value);
    } catch (e: any) {
      toast.error(e.message || "Failed to load governance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveDualApproval = async (v: boolean) => {
    if (!isSuper) {
      toast.error("Only super admins can change this policy");
      return;
    }
    setSavingDual(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "dual_approval_enabled", value: v ? "true" : "false" }, { onConflict: "key" });
      if (error) throw error;
      setDualApproval(v);
      toast.success("Policy saved");
      logActivity({ action: "settings_change", details: { key: "dual_approval_enabled", value: v } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingDual(false);
    }
  };

  const saveSuperIds = async () => {
    if (!isSuper) {
      toast.error("Only super admins can edit recovery super-admin list");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(superIdsJson);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === "string")) {
      toast.error("Must be a JSON array of auth user id strings");
      return;
    }
    setSavingSuperIds(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "super_admin_user_ids", value: JSON.stringify(parsed) }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Super admin IDs saved — affected users must re-auth to pick up role");
      logActivity({ action: "settings_change", details: { key: "super_admin_user_ids", count: parsed.length } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingSuperIds(false);
    }
  };

  const approvePending = async (row: PendingRow) => {
    if (!profile?.id) return;
    if (!permissions.canApproveSensitiveActions) {
      toast.error("Your role cannot approve sensitive actions");
      return;
    }
    if (row.requested_by === profile.id) {
      toast.error("You cannot approve your own request");
      return;
    }
    try {
      if (row.action_type === "role_change") {
        const payload = row.payload as {
          targetAuthUserId?: string;
          newRole?: AdminRole;
        };
        if (!payload.targetAuthUserId || !payload.newRole) throw new Error("Invalid payload");

        const { error: uerr } = await supabase.from("app_settings").upsert(
          { key: `admin_role_${payload.targetAuthUserId}`, value: payload.newRole },
          { onConflict: "key" }
        );
        if (uerr) throw uerr;

        await supabase.from("admin_permission_change_log").insert({
          changed_by: profile.id,
          target_auth_user_id: payload.targetAuthUserId,
          old_role: String(row.payload.oldRole ?? "admin"),
          new_role: payload.newRole,
          note: `Approved pending action ${row.id}`,
        });
      }

      const { error } = await supabase
        .from("admin_pending_actions")
        .update({
          status: "approved",
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;

      toast.success("Approved");
      logActivity({ action: "pending_action_approved", details: { pendingId: row.id, action_type: row.action_type } });
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const rejectPending = async () => {
    if (!rejectOpen || !profile?.id) return;
    if (!permissions.canApproveSensitiveActions) return;
    const row = pending.find((p) => p.id === rejectOpen.id);
    if (row?.requested_by === profile.id) {
      toast.error("You cannot reject your own request");
      return;
    }
    try {
      const { error } = await supabase
        .from("admin_pending_actions")
        .update({
          status: "rejected",
          approved_by: profile.id,
          rejection_reason: rejectOpen.text || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rejectOpen.id);
      if (error) throw error;
      toast.success("Rejected");
      logActivity({
        action: "pending_action_rejected",
        details: { pendingId: rejectOpen.id, reason: rejectOpen.text },
      });
      setRejectOpen(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (rbacLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Governance &amp; reliability</h2>
        <p className="text-sm text-muted-foreground">
          Central controls for RBAC enforcement, dual approval, recovery super-admins, and safeguard coverage.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="overview" className="text-xs gap-1">
            <Shield className="h-3 w-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs gap-1">
            <Activity className="h-3 w-3" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1">
            <History className="h-3 w-3" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="policies" className="text-xs gap-1">
            <Lock className="h-3 w-3" />
            Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Safeguard coverage (platform)
              </CardTitle>
              <CardDescription>
                Mandatory controls from your requirements — implemented in-app vs. operated via Supabase/hosting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {safeguards.map((s) => (
                <div key={s.area} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm font-medium">{s.area}</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                    {s.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pending sensitive actions</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => load()} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pending.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No pending approvals.</p>
              ) : (
                <ScrollArea className="max-h-[420px] pr-3">
                  <div className="space-y-3">
                    {pending.map((row) => (
                      <div key={row.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{row.action_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{row.title}</p>
                        <pre className="text-[10px] bg-muted rounded p-2 overflow-x-auto max-h-24">
                          {JSON.stringify(row.payload, null, 2)}
                        </pre>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => approvePending(row)}
                            disabled={
                              !permissions.canApproveSensitiveActions || row.requested_by === profile?.id
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectOpen({ id: row.id, text: "" })}
                            disabled={
                              !permissions.canApproveSensitiveActions || row.requested_by === profile?.id
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {rejectOpen && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <Label>Rejection reason (logged)</Label>
                  <Textarea
                    value={rejectOpen.text}
                    onChange={(e) => setRejectOpen({ ...rejectOpen, text: e.target.value })}
                    placeholder="Reason for rejection…"
                    className="min-h-[72px]"
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="destructive" onClick={rejectPending}>
                      Confirm reject
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setRejectOpen(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permission change history</CardTitle>
              <CardDescription>Admin RBAC role changes (applied or noted via approval).</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2 text-sm">
                  {permLog.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center">No entries yet.</p>
                  ) : (
                    permLog.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center gap-2 rounded border p-2 text-xs">
                        <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                        <Badge variant="outline">{r.old_role}</Badge>
                        <span>→</span>
                        <Badge variant="default">{r.new_role}</Badge>
                        <span className="font-mono text-[10px] truncate max-w-[120px]" title={r.target_auth_user_id}>
                          {r.target_auth_user_id.slice(0, 8)}…
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dual approval</CardTitle>
              <CardDescription>
                When enabled, promoting or demoting <strong>super admin</strong> roles requires a second approver
                (cannot self-approve).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="dual"
                  checked={dualApproval}
                  onCheckedChange={(v) => saveDualApproval(v)}
                  disabled={!isSuper || savingDual}
                />
                <Label htmlFor="dual">Require two-person approval for super-admin role changes</Label>
              </div>
              {!isSuper && (
                <Badge variant="secondary" className="text-[10px]">
                  Super admin only
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional super admin user IDs</CardTitle>
              <CardDescription>
                JSON array of Supabase <code className="text-xs">auth.users.id</code> UUIDs. Merges with bootstrap
                emails in code. Signed-in users need a refresh to pick up <code>super_admin</code> role.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={superIdsJson}
                onChange={(e) => setSuperIdsJson(e.target.value)}
                disabled={!isSuper}
                className="font-mono text-xs min-h-[100px]"
              />
              <Button type="button" size="sm" onClick={saveSuperIds} disabled={!isSuper || savingSuperIds}>
                {savingSuperIds ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save list"}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Configure email and login alerts under <strong>Security Center → Alerts</strong>. Wire SMS and
                escalation in Supabase Edge Functions or your notification provider.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Backups
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Use <strong>System Management</strong> for operational backups and Supabase project backups for
                database PITR. Track restores in the audit log.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Dependencies
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Monitor third parties from <strong>System Health</strong>. Add fallback API keys in{" "}
                <code className="text-[10px]">app_settings</code> and retry policies in clients.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Releases
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Staging, canary, and rollback are handled in your CI/hosting. Log deployments via audit actions from
                automation if desired.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Consistency
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Add scheduled SQL or Edge cron for reconciliation. Surface mismatches as{" "}
                <code className="text-[10px]">security_alert</code> audit events.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Your session
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Signed in as <span className="font-medium text-foreground">{user?.email}</span> — role{" "}
                  <Badge variant="outline" className="text-[10px]">
                    {role}
                  </Badge>
                </p>
                <p>Use TOTP and session timeout policies in Security Center.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Operational scope
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Items such as multi-region backups, SMS gateways, automatic reconciliation workers, and staged rollouts
              need infrastructure outside this SPA. This hub wires <strong>policy, approvals, visibility, and audit</strong>{" "}
              so those processes stay accountable.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGovernanceHub;
