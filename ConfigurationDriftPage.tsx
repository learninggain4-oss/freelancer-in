import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/hooks/use-rbac";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { StabilityFrame, StabilityReadOnlyBadge, useCanMutateStability, diffSettingMaps } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, RefreshCw } from "lucide-react";
import DoubleConfirmationDialog from "@/components/admin/security/DoubleConfirmationDialog";

type Snap = Tables<"stability_config_snapshots">;

export default function ConfigurationDriftPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { role } = useRBAC();
  const { logActivity } = useActivityLogger();
  const canMutate = useCanMutateStability();

  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("production");
  const [env, setEnv] = useState("production");
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [diffView, setDiffView] = useState<{ key: string; left: string; right: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stability_config_snapshots")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) toast.error(error.message);
    setSnaps(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const captureSnapshot = async () => {
    if (!profile?.id || !canMutate) return;
    const { data, error } = await supabase.from("app_settings").select("key, value");
    if (error) {
      toast.error(error.message);
      return;
    }
    const filtered =
      data?.filter(
        (r) =>
          r.key.startsWith("feature_toggle_") ||
          r.key.startsWith("env_") ||
          r.key.startsWith("stability_")
      ) ?? [];
    const { error: ins } = await supabase.from("stability_config_snapshots").insert({
      label,
      environment: env,
      payload: { settings: filtered, capturedAt: new Date().toISOString() },
      created_by: profile.id,
    });
    if (ins) {
      toast.error(ins.message);
      return;
    }
    await logActivity({
      action: "config_change",
      details: { area: "stability_config_snapshot", label, environment: env },
    });
    toast.success("Snapshot saved");
    load();
  };

  const getMapFromSnap = (s: Snap | undefined): Record<string, string> => {
    const pl = s?.payload as { settings?: { key: string; value: string }[] } | null;
    const m: Record<string, string> = {};
    pl?.settings?.forEach((r) => {
      m[r.key] = r.value;
    });
    return m;
  };

  const runCompare = () => {
    const sa = snaps.find((x) => x.id === compareA);
    const sb = snaps.find((x) => x.id === compareB);
    if (!sa || !sb) {
      toast.error("Select two snapshots");
      return;
    }
    const diffs = diffSettingMaps(getMapFromSnap(sa), getMapFromSnap(sb));
    toast.info(`${diffs.length} differing keys — see below`);
    setDiffView(diffs);
  };

  const loadLiveVsSnap = async () => {
    const s = snaps.find((x) => x.id === compareA);
    if (!s) {
      toast.error("Select snapshot A");
      return;
    }
    const { data } = await supabase.from("app_settings").select("key, value");
    const live: Record<string, string> = {};
    data
      ?.filter(
        (r) =>
          r.key.startsWith("feature_toggle_") ||
          r.key.startsWith("env_") ||
          r.key.startsWith("stability_")
      )
      .forEach((r) => {
        live[r.key] = r.value;
      });
    setDiffView(diffSettingMaps(getMapFromSnap(s), live));
  };

  const applyRestore = async () => {
    const s = snaps.find((x) => x.id === restoreId);
    if (!s || !canMutate || role !== "super_admin") {
      toast.error("Super Admin only");
      return;
    }
    const pl = s.payload as { settings?: { key: string; value: string }[] };
    if (!pl?.settings?.length) {
      toast.error("Empty snapshot");
      return;
    }
    await logActivity({
      action: "backup_create",
      details: { description: "Pre-restore marker (stability)" },
    });
    for (const row of pl.settings) {
      await supabase.from("app_settings").upsert({ key: row.key, value: row.value }, { onConflict: "key" });
    }
    await logActivity({
      action: "config_rollback",
      details: { snapshotId: s.id, label: s.label },
    });
    toast.success("Settings merged from snapshot");
    setRestoreOpen(false);
    setRestoreId(null);
  };

  return (
    <StabilityFrame
      title="Configuration & drift"
      subtitle="Compare environments, snapshot feature toggles / runtime env keys, detect mismatch with live settings, and roll back (Super Admin)."
    >
      <div className="flex flex-wrap items-center gap-2">
        <StabilityReadOnlyBadge />
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/system-management")}>
          Environment variables (Infrastructure)
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/governance")}>
          Governance & approvals
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capture configuration backup</CardTitle>
          <CardDescription>
            Stores keys matching feature_toggle_*, env_*, stability_* from app_settings. Schedule external jobs for
            prod/staging parity checks.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label>Environment tag</Label>
            <Select value={env} onValueChange={setEnv}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="backup">Backup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={captureSnapshot} disabled={!canMutate}>
            Save snapshot
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare & mismatch detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={compareA} onValueChange={setCompareA}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Snapshot A" />
              </SelectTrigger>
              <SelectContent>
                {snaps.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label} · {new Date(s.created_at).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={compareB} onValueChange={setCompareB}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Snapshot B" />
              </SelectTrigger>
              <SelectContent>
                {snaps.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label} · {new Date(s.created_at).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={runCompare}>
              Compare A ↔ B
            </Button>
            <Button variant="outline" onClick={loadLiveVsSnap}>
              A vs live
            </Button>
          </div>
          <ScrollArea className="h-48 rounded border">
            <div className="p-2 text-xs font-mono space-y-1">
              {diffView.length === 0 ? (
                <p className="text-muted-foreground p-2">No diff yet</p>
              ) : (
                diffView.map((d) => (
                  <div key={d.key} className="break-all">
                    <span className="font-semibold">{d.key}</span>
                    <div className="text-muted-foreground">A: {d.left.slice(0, 200)}</div>
                    <div className="text-muted-foreground">B: {d.right.slice(0, 200)}</div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rollback (dangerous)</CardTitle>
          <CardDescription>Super Admin only — overwrites matching keys in app_settings.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          <Select value={restoreId ?? ""} onValueChange={(v) => setRestoreId(v)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose snapshot" />
            </SelectTrigger>
            <SelectContent>
              {snaps.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label} · {s.environment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            disabled={!restoreId || !canMutate || role !== "super_admin"}
            onClick={() => setRestoreOpen(true)}
          >
            Restore from snapshot
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Snapshot history</CardTitle>
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ScrollArea className="max-h-56">
              <ul className="text-sm space-y-2">
                {snaps.map((s) => (
                  <li key={s.id} className="rounded border p-2">
                    <span className="font-medium">{s.label}</span> · {s.environment} ·{" "}
                    {new Date(s.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <DoubleConfirmationDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore configuration"
        description="This overwrites app_settings for keys in the snapshot."
        confirmPhrase="RESTORE CONFIG"
        warningMessage="Notify the team; invalid keys can break the app."
        onConfirm={applyRestore}
      />
    </StabilityFrame>
  );
}
