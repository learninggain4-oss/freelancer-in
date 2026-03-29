import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { StabilityFrame, StabilityReadOnlyBadge, useCanMutateStability } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import ConfirmationDialog from "@/components/admin/security/ConfirmationDialog";

type Row = { key: string; value: string; on: boolean; safeDefault: boolean };
type Aud = Tables<"stability_feature_toggle_audit">;

function parseRow(key: string, raw: string): Row {
  try {
    const j = JSON.parse(raw) as { value?: string; safeDefault?: boolean };
    const v = String(j.value ?? raw);
    return { key, value: raw, on: v === "true", safeDefault: j.safeDefault !== false };
  } catch {
    return { key, value: raw, on: raw === "true", safeDefault: true };
  }
}

export default function FeatureFlagsPage() {
  const { profile } = useAuth();
  const { logActivity } = useActivityLogger();
  const canMutate = useCanMutateStability();
  const [flags, setFlags] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Aud[]>([]);
  const [newKey, setNewKey] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; row: Row | null; next: boolean }>({
    open: false,
    row: null,
    next: false,
  });

  const load = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("key, value").like("key", "feature_toggle_%");
    setFlags((data || []).map((r) => parseRow(r.key, r.value)));
    const { data: a } = await supabase
      .from("stability_feature_toggle_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    setAudit(a || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (row: Row, nextOn: boolean) => {
    if (!profile?.id || !canMutate) return;
    const oldStr = row.value;
    const j = (() => {
      try {
        return JSON.parse(row.value) as { value?: string; safeDefault?: boolean };
      } catch {
        return { value: row.value, safeDefault: true };
      }
    })();
    j.value = nextOn ? "true" : "false";
    const newStr = JSON.stringify(j);
    await supabase.from("app_settings").upsert({ key: row.key, value: newStr }, { onConflict: "key" });
    await supabase.from("stability_feature_toggle_audit").insert({
      toggle_key: row.key,
      old_value: oldStr,
      new_value: newStr,
      changed_by: profile.id,
    });
    await logActivity({
      action: "config_change",
      details: { area: "feature_toggle", key: row.key, nextOn },
    });
    toast.success("Toggle updated");
    load();
  };

  const onToggle = (row: Row, next: boolean) => {
    if (!row.safeDefault && next) {
      setConfirm({ open: true, row, next });
      return;
    }
    void persist(row, next);
  };

  const addFlag = async () => {
    if (!canMutate || !newKey.trim()) return;
    const key = newKey.trim().startsWith("feature_toggle_")
      ? newKey.trim()
      : `feature_toggle_${newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_")}`;
    await supabase.from("app_settings").upsert(
      { key, value: JSON.stringify({ value: "false", safeDefault: true }) },
      { onConflict: "key" }
    );
    setNewKey("");
    load();
  };

  return (
    <StabilityFrame
      title="Feature flags & toggle safety"
      subtitle="Toggles live in app_settings. Default-off safe flags avoid accidental prod activation."
    >
      <StabilityReadOnlyBadge />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add toggle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            placeholder="MY_FEATURE"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-48 font-mono"
            disabled={!canMutate}
          />
          <Button onClick={addFlag} disabled={!canMutate}>
            Create (off)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active toggles</CardTitle>
          <CardDescription>Unsafe defaults require confirmation to enable.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72">
            <div className="space-y-3">
              {flags.map((r) => (
                <div key={r.key} className="flex items-center justify-between rounded border p-2 gap-3">
                  <div>
                    <code className="text-sm">{r.key}</code>
                    {!r.safeDefault && (
                      <span className="ml-2 text-[10px] text-destructive">non-safe default</span>
                    )}
                  </div>
                  <Switch checked={r.on} disabled={!canMutate} onCheckedChange={(v) => onToggle(r, v)} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toggle audit</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1 font-mono">
          {audit.map((a) => (
            <div key={a.id} className="border rounded p-1">
              {a.toggle_key} · {new Date(a.created_at).toLocaleString()}
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirm.open}
        onOpenChange={(v) => setConfirm((c) => ({ ...c, open: v }))}
        title="Enable non-safe toggle?"
        description="This flag is marked unsafe — confirm rollout."
        variant="warning"
        confirmLabel="Enable"
        onConfirm={async () => {
          if (confirm.row) await persist(confirm.row, confirm.next);
          setConfirm({ open: false, row: null, next: false });
        }}
      />
    </StabilityFrame>
  );
}
