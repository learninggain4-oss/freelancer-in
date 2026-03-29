import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRBAC } from "@/hooks/use-rbac";
import { StabilityFrame, StabilityReadOnlyBadge, useCanMutateStability } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function RateLimitsPage() {
  const { role } = useRBAC();
  const canMutate = useCanMutateStability();
  const [perMin, setPerMin] = useState("120");
  const [bulkMax, setBulkMax] = useState("500");
  const [cooldownSec, setCooldownSec] = useState("2");
  const [queueJson, setQueueJson] = useState("[]");

  useEffect(() => {
    (async () => {
      const keys = [
        "stability_rate_admin_actions_per_min",
        "stability_bulk_max_rows",
        "stability_action_cooldown_sec",
        "stability_operation_queue",
      ];
      const { data } = await supabase.from("app_settings").select("key, value").in("key", keys);
      data?.forEach((r) => {
        if (r.key === "stability_rate_admin_actions_per_min") setPerMin(r.value);
        if (r.key === "stability_bulk_max_rows") setBulkMax(r.value);
        if (r.key === "stability_action_cooldown_sec") setCooldownSec(r.value);
        if (r.key === "stability_operation_queue") setQueueJson(r.value || "[]");
      });
    })();
  }, []);

  const save = async () => {
    if (!canMutate) return;
    try {
      JSON.parse(queueJson);
    } catch {
      toast.error("Queue must be valid JSON array");
      return;
    }
    await supabase.from("app_settings").upsert(
      { key: "stability_rate_admin_actions_per_min", value: perMin },
      { onConflict: "key" }
    );
    await supabase.from("app_settings").upsert(
      { key: "stability_bulk_max_rows", value: bulkMax },
      { onConflict: "key" }
    );
    await supabase.from("app_settings").upsert(
      { key: "stability_action_cooldown_sec", value: cooldownSec },
      { onConflict: "key" }
    );
    await supabase.from("app_settings").upsert(
      { key: "stability_operation_queue", value: queueJson },
      { onConflict: "key" }
    );
    toast.success("Rate & queue settings saved — enforce in Edge middleware");
  };

  return (
    <StabilityFrame
      title="Rate limits & abuse protection"
      subtitle="Values stored for Edge Functions / API gateways. Super Admin should bypass hard blocks at the provider level when needed."
    >
      <div className="flex flex-wrap gap-2 items-center">
        <StabilityReadOnlyBadge />
        {role === "super_admin" && (
          <Badge variant="outline" className="text-[10px]">
            Super Admin override at provider
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limits</CardTitle>
          <CardDescription>Advisory counters until wired into your API layer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div>
            <Label>Admin actions / min / operator</Label>
            <Input value={perMin} onChange={(e) => setPerMin(e.target.value)} type="number" />
          </div>
          <div>
            <Label>Bulk max rows per job</Label>
            <Input value={bulkMax} onChange={(e) => setBulkMax(e.target.value)} type="number" />
          </div>
          <div>
            <Label>Cooldown (seconds)</Label>
            <Input value={cooldownSec} onChange={(e) => setCooldownSec(e.target.value)} type="number" />
          </div>
          <Button className="sm:col-span-2 w-fit" onClick={save} disabled={!canMutate}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operation queue (JSON)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="font-mono text-xs min-h-[120px]"
            value={queueJson}
            onChange={(e) => setQueueJson(e.target.value)}
            disabled={!canMutate}
          />
        </CardContent>
      </Card>
    </StabilityFrame>
  );
}
