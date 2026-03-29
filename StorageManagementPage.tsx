import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StabilityFrame, StabilityReadOnlyBadge, useCanMutateStability } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function StorageManagementPage() {
  const canMutate = useCanMutateStability();
  const [warnPct, setWarnPct] = useState("80");
  const [maxUploadMb, setMaxUploadMb] = useState("25");
  const [buckets, setBuckets] = useState<{ id: string; name: string }[]>([]);
  const [samples, setSamples] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["stability_storage_warn_pct", "stability_max_upload_mb"]);
      s?.forEach((r) => {
        if (r.key === "stability_storage_warn_pct") setWarnPct(r.value);
        if (r.key === "stability_max_upload_mb") setMaxUploadMb(r.value);
      });
      const { data } = await supabase.storage.listBuckets();
      setBuckets((data || []).map((b) => ({ id: b.name, name: b.name })));
    })();
  }, []);

  const sampleBucket = async (name: string) => {
    const { data, error } = await supabase.storage.from(name).list("", { limit: 500 });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSamples((prev) => ({ ...prev, [name]: data?.length ?? 0 }));
  };

  const save = async () => {
    if (!canMutate) return;
    await supabase.from("app_settings").upsert(
      { key: "stability_storage_warn_pct", value: warnPct },
      { onConflict: "key" }
    );
    await supabase.from("app_settings").upsert(
      { key: "stability_max_upload_mb", value: maxUploadMb },
      { onConflict: "key" }
    );
    toast.success("Thresholds saved");
  };

  return (
    <StabilityFrame
      title="Storage & disk governance"
      subtitle="Bucket sampling from the browser. True disk quotas come from Supabase project plan and host metrics."
    >
      <StabilityReadOnlyBadge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limits & alerts (metadata)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 max-w-md">
          <div>
            <Label>Warn threshold (% full — manual)</Label>
            <Input type="number" value={warnPct} onChange={(e) => setWarnPct(e.target.value)} />
          </div>
          <div>
            <Label>Max upload MB (document for UIs)</Label>
            <Input type="number" value={maxUploadMb} onChange={(e) => setMaxUploadMb(e.target.value)} />
          </div>
          <Button className="w-fit" onClick={save} disabled={!canMutate}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buckets</CardTitle>
          <CardDescription>Sample first 500 objects per bucket (count only).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {buckets.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 border rounded p-2">
              <span className="font-mono text-sm">{b.name}</span>
              <Button size="sm" variant="outline" onClick={() => sampleBucket(b.name)}>
                Sample
              </Button>
              {samples[b.name] != null && (
                <>
                  <span className="text-xs">{samples[b.name]} listed</span>
                  <Progress value={Math.min(100, (samples[b.name] / 500) * 100)} className="h-2 w-32" />
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </StabilityFrame>
  );
}
