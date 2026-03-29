import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { StabilityFrame, StabilityReadOnlyBadge, useCanMutateStability } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VendorProvidersPage() {
  const canMutate = useCanMutateStability();
  const { logActivity } = useActivityLogger();
  const [json, setJson] = useState('{"primary":"supabase","backup":"","notes":""}');

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "stability_vendor_registry")
      .maybeSingle()
      .then(({ data }) => data?.value && setJson(data.value));
  }, []);

  const save = async () => {
    if (!canMutate) return;
    try {
      JSON.parse(json);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    await supabase
      .from("app_settings")
      .upsert({ key: "stability_vendor_registry", value: json }, { onConflict: "key" });
    await logActivity({ action: "config_change", details: { area: "vendor_registry" } });
    toast.success("Provider registry saved");
  };

  return (
    <StabilityFrame
      title="Vendor lock-in mitigation"
      subtitle="Document primary/backup providers and migration anchors. Pair with Infrastructure connection registry and Postgres exports."
    >
      <StabilityReadOnlyBadge />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provider registry</CardTitle>
          <CardDescription>JSON: primary, backup, failover notes, S3-compatible target, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            className="font-mono text-xs min-h-[180px]"
            value={json}
            onChange={(e) => setJson(e.target.value)}
            disabled={!canMutate}
          />
          <Button onClick={save} disabled={!canMutate}>
            Save
          </Button>
        </CardContent>
      </Card>
    </StabilityFrame>
  );
}
